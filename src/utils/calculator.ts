import { create, all } from 'mathjs';
import { AngleMode, AppSettings } from '../types';
import { formatNumberWithSettings } from './formatting';

const math = create(all, {});

export type EvalResult =
  | { ok: true; value: string }
  | { ok: false; error: 'syntax' | 'math' | 'overflow' };

/**
 * Evaluates a mathematical expression and returns a typed EvalResult.
 */
export function evaluateWithResult(
  expr: string,
  angleMode: AngleMode = 'DEG',
  precision: number = 6,
  customScope: Record<string, any> = {}
): EvalResult {
  if (!expr || !expr.trim()) {
    return { ok: true, value: '' };
  }

  try {
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
    // Ensure we don't clobber 'mod' operations
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1 * 0.01)');

    let mathScope: Record<string, any> = {
      // Standard Logarithmic & Exponential Functions
      log: (x: number) => Math.log10(x),
      log10: (x: number) => Math.log10(x),
      ln: (x: number) => Math.log(x),
      log2: (x: number) => Math.log2(x),
      sqrt: (x: number) => Math.sqrt(x),
      cbrt: (x: number) => Math.cbrt(x),
      abs: (x: number) => Math.abs(x),
      mod: (a: number, b: number) => a % b,
    };

    if (angleMode === 'DEG') {
      mathScope = {
        ...mathScope,
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
    } else if (angleMode === 'GRAD') {
      mathScope = {
        ...mathScope,
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
    } else {
      // RAD mode
      mathScope = {
        ...mathScope,
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

    const scope = { ...mathScope, ...customScope };
    const result = math.evaluate(sanitized, scope);

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
  } catch (err: any) {
    if (err?.message?.includes('overflow') || err?.message?.includes('too large')) {
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
  customScope: Record<string, any> = {}
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
