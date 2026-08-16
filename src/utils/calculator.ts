import { create, all } from 'mathjs';
import { AngleMode, AppSettings } from '../types';
import { formatNumberWithSettings } from './formatting';

const math = create(all, {});

// Configure custom trig functions based on angle mode
export function evaluateExpression(
  expr: string, 
  angleMode: AngleMode = 'DEG', 
  precision: number = 6,
  customScope: Record<string, any> = {}
): string {
  if (!expr.trim()) return '';

  try {
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/−/g, '-');

    // Replace square root symbols
    sanitized = sanitized
      .replace(/√\(/g, 'sqrt(')
      .replace(/√([0-9a-zA-Z.]+)/g, 'sqrt($1)');

    // Percentage conversion for expressions like 50% -> (50 * 0.01)
    // Avoid replacing 'mod' or modulo operations between numbers
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
        sin: (x: number) => Math.sin((x * Math.PI) / 180),
        cos: (x: number) => Math.cos((x * Math.PI) / 180),
        tan: (x: number) => {
          const modDeg = Math.abs(x) % 180;
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
        sin: (x: number) => Math.sin((x * Math.PI) / 200),
        cos: (x: number) => Math.cos((x * Math.PI) / 200),
        tan: (x: number) => {
          const modGrad = Math.abs(x) % 200;
          if (Math.abs(modGrad - 100) < 1e-10) return NaN;
          return Math.tan((x * Math.PI) / 200);
        },
        asin: (x: number) => (Math.asin(x) * 200) / Math.PI,
        acos: (x: number) => (Math.acos(x) * 200) / Math.PI,
        atan: (x: number) => (Math.atan(x) * 200) / Math.PI,
      };
    }

    const scope = { ...mathScope, ...customScope };
    const result = math.evaluate(sanitized, scope);

    if (result === undefined || result === null) return 'Error';
    if (typeof result === 'function') return 'Error';
    
    if (typeof result === 'number') {
      if (isNaN(result)) return 'NaN';
      if (!isFinite(result)) return 'Infinity';
      // Format number nicely with precision
      const factor = Math.pow(10, precision);
      const rounded = Math.round(result * factor) / factor;
      return String(rounded);
    }

    return String(result);
  } catch (err) {
    return 'Error';
  }
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

