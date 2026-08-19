import { describe, it, expect } from 'vitest';
import { evaluateExpression, evaluateWithResult } from './calculator';

describe('Calculation Engines Comprehensive Mathematical Verification', () => {
  describe('Engine 1 & 2: Basic & Scientific Evaluator', () => {
    it('evaluates basic arithmetic, operator precedence, and negatives', () => {
      expect(evaluateExpression('3 + 5 * 2 - 8 / 4')).toBe('11');
      expect(evaluateExpression('-5 + 3')).toBe('-2');
      expect(evaluateExpression('(-4) * (-5)')).toBe('20');
      expect(evaluateExpression('10.5 + 2.25')).toBe('12.75');
    });

    it('evaluates logarithmic functions', () => {
      expect(evaluateExpression('log10(100)')).toBe('2');
      expect(evaluateExpression('log10(1000)')).toBe('3');
      expect(evaluateExpression('log2(8)')).toBe('3');
      expect(evaluateExpression('ln(e)')).toBe('1');
    });

    it('evaluates square roots, cube roots, and powers', () => {
      expect(evaluateExpression('sqrt(144)')).toBe('12');
      expect(evaluateExpression('cbrt(27)')).toBe('3');
      expect(evaluateExpression('2 ^ 10')).toBe('1024');
    });

    it('evaluates angle mode conversions and pole boundaries', () => {
      expect(evaluateExpression('sin(30)', 'DEG')).toBe('0.5');
      expect(evaluateExpression('cos(60)', 'DEG')).toBe('0.5');
      expect(evaluateExpression('tan(45)', 'DEG')).toBe('1');
      expect(evaluateExpression('tan(90)', 'DEG')).toBe('NaN');
      expect(evaluateExpression('sin(0)', 'RAD')).toBe('0');
      expect(evaluateExpression('cos(0)', 'RAD')).toBe('1');
    });
  });

  describe('Engine 3: Fractions & Modulo', () => {
    it('evaluates modulo operation with positive and negative operands', () => {
      expect(evaluateExpression('mod(17, 5)')).toBe('2');
      expect(evaluateExpression('mod(20, 4)')).toBe('0');
      expect(evaluateExpression('mod(7.5, 2)')).toBe('1.5');
    });
  });

  describe('Engine 6 & 7: Calculus & Graphing Expressions', () => {
    it('evaluates expressions with custom variable scope x', () => {
      expect(evaluateExpression('x^2 + 2*x + 1', 'DEG', 6, { x: 3 })).toBe('16');
      expect(evaluateExpression('sin(x)', 'RAD', 6, { x: 0 })).toBe('0');
      expect(evaluateExpression('exp(x)', 'DEG', 6, { x: 0 })).toBe('1');
    });

    it('handles numerical boundaries and domain errors', () => {
      expect(evaluateExpression('1 / x', 'DEG', 6, { x: 0 })).toBe('Infinity');
      expect(evaluateExpression('sqrt(x)', 'DEG', 6, { x: -4 })).toBe('NaN');
    });
  });

  describe('Security AST Allowlist & Resistance', () => {
    it('rejects assignments and function definitions', () => {
      expect(evaluateWithResult('x = 5').ok).toBe(false);
      expect(evaluateWithResult('f(x) = x^2').ok).toBe(false);
    });

    it('rejects property access and object literals', () => {
      expect(evaluateWithResult('a.b').ok).toBe(false);
      expect(evaluateWithResult('{"a": 1}').ok).toBe(false);
      expect(evaluateWithResult('[1, 2, 3]').ok).toBe(false);
    });

    it('rejects arbitrary global lookups and environment access', () => {
      expect(evaluateWithResult('process.env').ok).toBe(false);
      expect(evaluateWithResult('globalThis').ok).toBe(false);
      expect(evaluateWithResult('window').ok).toBe(false);
      expect(evaluateWithResult('document.cookie').ok).toBe(false);
    });

    it('rejects unknown functions not in whitelist', () => {
      expect(evaluateWithResult('alert(1)').ok).toBe(false);
      expect(evaluateWithResult('fetch("http://example.com")').ok).toBe(false);
      expect(evaluateWithResult('exec("ls")').ok).toBe(false);
    });
  });
});
