import { create, all, MathNode } from 'mathjs';
import { AngleMode, AppSettings } from '../types';
import { formatNumberWithSettings } from './formatting';
import {
  MAX_EXPRESSION_LENGTH,
  MAX_NESTING_DEPTH,
  MAX_EXPONENT,
  MAX_FACTORIAL_ARGUMENT,
  MAX_GAMMA_ARGUMENT,
} from '../constants/limits';

const math = create(all, {});

export interface CalculatorScope {
  x?: number;
  y?: number;
  z?: number;
  t?: number;
  n?: number;
  r?: number;
  k?: number;
  [key: string]: number | undefined;
}

export type EvalResult =
  | { ok: true; value: string }
  | { ok: false; error: 'syntax' | 'math' | 'overflow' };

export interface CompiledSafeExpression {
  evaluate: (scope?: CalculatorScope) => number | null;
}

export type SafeCompileResult =
  | { ok: true; compiled: CompiledSafeExpression }
  | { ok: false; error: 'syntax' | 'math' | 'overflow' };

// Whitelist of approved MathJS AST node types
const ALLOWED_NODE_TYPES = new Set([
  'OperatorNode',
  'ConstantNode',
  'SymbolNode',
  'FunctionNode',
  'ParenthesisNode',
  'BlockNode',
]);

// Whitelist of approved mathematical functions
export const ALLOWED_FUNCTIONS = new Set([
  'sin', 'cos', 'tan',
  'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'asinh', 'acosh', 'atanh',
  'log', 'log10', 'ln', 'log2',
  'exp', 'sqrt', 'cbrt', 'abs',
  'mod', 'round', 'floor', 'ceil',
  'fact', 'factorial', 'sign', 'gamma',
]);

// Whitelist of approved constants and variables
export const ALLOWED_SYMBOLS = new Set([
  'pi', 'PI', 'e', 'E', 'i', 'I', 'tau', 'phi', 'x', 'y', 'z', 't', 'n', 'r', 'k'
]);

/**
 * Validates expression length and parenthesis nesting depth before parsing.
 */
export function prevalidateWebExpression(expr: string): boolean {
  if (expr.length > MAX_EXPRESSION_LENGTH) return false;

  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === '(') {
      depth++;
      if (depth > MAX_NESTING_DEPTH) return false;
    } else if (expr[i] === ')') {
      depth--;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

/**
 * Validates parsed MathJS AST against strict allowlists and resource limits.
 * Rejects property access (AccessorNode), object construction (ObjectNode),
 * assignments (AssignmentNode), function definitions (FunctionAssignmentNode),
 * unknown symbols, unapproved function calls, and excessive arguments.
 */
export function validateMathAst(node: MathNode, customScopeKeys: Set<string>): boolean {
  let isValid = true;

  node.traverse((child: any) => {
    if (!isValid) return;

    // Check allowed AST node types
    if (!ALLOWED_NODE_TYPES.has(child.type)) {
      isValid = false;
      return;
    }

    // Function node validation
    if (child.isFunctionNode) {
      const fnName = child.name?.toLowerCase();
      if (!fnName || !ALLOWED_FUNCTIONS.has(fnName)) {
        isValid = false;
        return;
      }

      // Check expensive factorial argument in AST
      if (fnName === 'factorial' || fnName === 'fact') {
        if (child.args?.[0]?.isConstantNode) {
          const val = Number(child.args[0].value);
          if (!isNaN(val) && (val > MAX_FACTORIAL_ARGUMENT || val < 0)) {
            isValid = false;
            return;
          }
        }
      }

      // Check expensive gamma argument in AST
      if (fnName === 'gamma') {
        if (child.args?.[0]?.isConstantNode) {
          const val = Number(child.args[0].value);
          if (!isNaN(val) && (val > MAX_GAMMA_ARGUMENT || (val <= 0 && Number.isInteger(val)))) {
            isValid = false;
            return;
          }
        }
      }
    }

    // Symbol node validation (constants, customScope keys like 'x', or known math functions)
    if (child.isSymbolNode) {
      const symName = child.name;
      const lower = symName.toLowerCase();
      if (
        !ALLOWED_SYMBOLS.has(symName) &&
        !ALLOWED_SYMBOLS.has(lower) &&
        !ALLOWED_FUNCTIONS.has(lower) &&
        !customScopeKeys.has(symName)
      ) {
        isValid = false;
        return;
      }
    }

    // Operator validation
    if (child.isOperatorNode) {
      // Exponent limit protection in AST
      if ((child.op === '^' || child.op === '**') && child.args?.[1]?.isConstantNode) {
        const expVal = Number(child.args[1].value);
        if (!isNaN(expVal) && Math.abs(expVal) > MAX_EXPONENT) {
          isValid = false;
          return;
        }
      }
    }
  });

  return isValid;
}

/**
 * Standardizes symbols, percentage tokens, and square root notations.
 */
export function sanitizeExpression(expr: string): string {
  let sanitized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/−/g, '-');

  // Replace square root symbols like √(4) or √4 or √x
  sanitized = sanitized
    .replace(/√\(/g, 'sqrt(')
    .replace(/√([0-9a-zA-Z.]+)/g, 'sqrt($1)');

  // Percentage conversion: e.g. 50% -> (50 * 0.01)
  sanitized = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1 * 0.01)');

  return sanitized;
}

/**
 * Factory for unified mathematical execution scope.
 */
export function buildMathScope(angleMode: AngleMode = 'DEG'): Record<string, any> {
  const factorialFn = (n: number): number => {
    if (n < 0 || n > MAX_FACTORIAL_ARGUMENT || !Number.isFinite(n) || !Number.isInteger(n)) {
      return NaN;
    }
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  };

  const gammaFn = (n: number): number => {
    if (n <= 0 && Number.isInteger(n)) return NaN;
    if (n > MAX_GAMMA_ARGUMENT || !Number.isFinite(n)) return Infinity;
    try {
      return (math as any).gamma(n);
    } catch {
      return NaN;
    }
  };

  const baseScope: Record<string, any> = {
    // Hyperbolic Trigonometry
    sinh: (x: number) => Math.sinh(x),
    cosh: (x: number) => Math.cosh(x),
    tanh: (x: number) => Math.tanh(x),
    asinh: (x: number) => Math.asinh(x),
    acosh: (x: number) => Math.acosh(x),
    atanh: (x: number) => Math.atanh(x),

    // Logarithmic & Exponential Functions
    log: (x: number) => Math.log10(x),
    log10: (x: number) => Math.log10(x),
    ln: (x: number) => Math.log(x),
    log2: (x: number) => Math.log2(x),
    exp: (x: number) => Math.exp(x),
    sqrt: (x: number) => Math.sqrt(x),
    cbrt: (x: number) => Math.cbrt(x),
    abs: (x: number) => Math.abs(x),
    mod: (a: number, b: number) => a % b,
    round: (x: number) => Math.round(x),
    floor: (x: number) => Math.floor(x),
    ceil: (x: number) => Math.ceil(x),
    sign: (x: number) => Math.sign(x),

    // Special Functions
    factorial: factorialFn,
    fact: factorialFn,
    gamma: gammaFn,
  };

  if (angleMode === 'DEG') {
    return {
      ...baseScope,
      sin: (x: number) => {
        const modDeg = ((x % 360) + 360) % 360;
        if (Math.abs(modDeg - 180) < 1e-10 || Math.abs(modDeg) < 1e-10 || Math.abs(modDeg - 360) < 1e-10) {
          return 0;
        }
        return Math.sin((x * Math.PI) / 180);
      },
      cos: (x: number) => {
        const modDeg = ((x % 360) + 360) % 360;
        if (Math.abs(modDeg - 90) < 1e-10 || Math.abs(modDeg - 270) < 1e-10) {
          return 0;
        }
        return Math.cos((x * Math.PI) / 180);
      },
      tan: (x: number) => {
        const modDeg = ((x % 180) + 180) % 180;
        if (Math.abs(modDeg - 90) < 1e-10) return NaN;
        return Math.tan((x * Math.PI) / 180);
      },
      asin: (x: number) => (Math.asin(x) * 180) / Math.PI,
      acos: (x: number) => (Math.acos(x) * 180) / Math.PI,
      atan: (x: number) => (Math.atan(x) * 180) / Math.PI,
    };
  }

  if (angleMode === 'GRAD') {
    return {
      ...baseScope,
      sin: (x: number) => {
        const modGrad = ((x % 400) + 400) % 400;
        if (Math.abs(modGrad - 200) < 1e-10 || Math.abs(modGrad) < 1e-10 || Math.abs(modGrad - 400) < 1e-10) {
          return 0;
        }
        return Math.sin((x * Math.PI) / 200);
      },
      cos: (x: number) => {
        const modGrad = ((x % 400) + 400) % 400;
        if (Math.abs(modGrad - 100) < 1e-10 || Math.abs(modGrad - 300) < 1e-10) {
          return 0;
        }
        return Math.cos((x * Math.PI) / 200);
      },
      tan: (x: number) => {
        const modGrad = ((x % 200) + 200) % 200;
        if (Math.abs(modGrad - 100) < 1e-10) return NaN;
        return Math.tan((x * Math.PI) / 200);
      },
      asin: (x: number) => (Math.asin(x) * 200) / Math.PI,
      acos: (x: number) => (Math.acos(x) * 200) / Math.PI,
      atan: (x: number) => (Math.atan(x) * 200) / Math.PI,
    };
  }

  // RAD mode
  return {
    ...baseScope,
    sin: (x: number) => Math.sin(x),
    cos: (x: number) => Math.cos(x),
    tan: (x: number) => {
      const halfPi = Math.PI / 2;
      const modPi = ((x % Math.PI) + Math.PI) % Math.PI;
      if (Math.abs(modPi - halfPi) < 1e-10) return NaN;
      return Math.tan(x);
    },
    asin: (x: number) => Math.asin(x),
    acos: (x: number) => Math.acos(x),
    atan: (x: number) => Math.atan(x),
  };
}

/**
 * Compiles a mathematical expression with full AST allowlist validation for safe, high-frequency evaluation.
 * Used across Graphing and Calculus engines to prevent AST bypass.
 */
export function compileSafeExpression(
  expr: string,
  angleMode: AngleMode = 'DEG',
  allowedVars: string[] = ['x']
): SafeCompileResult {
  if (!expr || !expr.trim()) {
    return { ok: false, error: 'syntax' };
  }

  if (!prevalidateWebExpression(expr)) {
    return { ok: false, error: 'syntax' };
  }

  try {
    const sanitized = sanitizeExpression(expr);

    let parsedAst: MathNode;
    try {
      parsedAst = math.parse(sanitized);
    } catch {
      return { ok: false, error: 'syntax' };
    }

    const scopeKeys = new Set(allowedVars);
    if (!validateMathAst(parsedAst, scopeKeys)) {
      return { ok: false, error: 'syntax' };
    }

    const compiledNode = parsedAst.compile();
    const baseMathScope = buildMathScope(angleMode);

    return {
      ok: true,
      compiled: {
        evaluate: (scope?: CalculatorScope) => {
          try {
            const fullScope = { ...baseMathScope, ...scope };
            const r = compiledNode.evaluate(fullScope);
            if (typeof r === 'number' && isFinite(r)) {
              return r;
            }
            return null;
          } catch {
            return null;
          }
        },
      },
    };
  } catch (err: unknown) {
    const msg = (err as Error)?.message || '';
    if (msg.includes('overflow') || msg.includes('too large')) {
      return { ok: false, error: 'overflow' };
    }
    return { ok: false, error: 'syntax' };
  }
}

/**
 * Evaluates a mathematical expression with full AST allowlist validation and typed EvalResult.
 */
export function evaluateWithResult(
  expr: string,
  angleMode: AngleMode = 'DEG',
  precision: number = 6,
  customScope: CalculatorScope = {}
): EvalResult {
  if (!expr || !expr.trim()) {
    return { ok: true, value: '' };
  }

  // Pre-validate length & parenthesis depth
  if (!prevalidateWebExpression(expr)) {
    return { ok: false, error: 'syntax' };
  }

  try {
    const sanitized = sanitizeExpression(expr);

    // Parse AST with mathjs parser
    let parsedAst: MathNode;
    try {
      parsedAst = math.parse(sanitized);
    } catch {
      return { ok: false, error: 'syntax' };
    }

    // AST Allowlist Enforcement
    const scopeKeys = new Set(Object.keys(customScope));
    if (!validateMathAst(parsedAst, scopeKeys)) {
      return { ok: false, error: 'syntax' };
    }

    const mathScope = buildMathScope(angleMode);
    const compiled = parsedAst.compile();
    const scope = { ...mathScope, ...customScope };
    const result = compiled.evaluate(scope);

    if (result === undefined || result === null || typeof result === 'function') {
      return { ok: false, error: 'syntax' };
    }

    if (typeof result === 'number') {
      if (isNaN(result)) {
        return { ok: true, value: 'NaN' };
      }
      if (!isFinite(result)) {
        return { ok: true, value: result > 0 ? 'Infinity' : '-Infinity' };
      }

      // High precision rounding without floating point artifacts
      const roundedVal = Number.parseFloat(result.toFixed(precision));
      return { ok: true, value: String(roundedVal) };
    }

    return { ok: true, value: String(result) };
  } catch (err: unknown) {
    const msg = (err as Error)?.message || '';
    if (msg.includes('overflow') || msg.includes('too large')) {
      return { ok: false, error: 'overflow' };
    }
    return { ok: false, error: 'syntax' };
  }
}

/**
 * Backwards-compatible evaluateExpression returning string.
 */
export function evaluateExpression(
  expr: string,
  angleMode: AngleMode = 'DEG',
  precision: number = 6,
  customScope: CalculatorScope = {}
): string {
  const result = evaluateWithResult(expr, angleMode, precision, customScope);
  if (result.ok) {
    return result.value;
  }
  return 'Error';
}

export function formatNumber(val: number | string, precision: number = 6, settings?: Partial<AppSettings>): string {
  if (settings) {
    return formatNumberWithSettings(val, settings);
  }
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';
  return num.toLocaleString('en-US', { maximumFractionDigits: precision });
}
