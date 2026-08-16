import { describe, it, expect } from 'vitest';
import { evaluateExpression, evaluateWithResult, formatNumber } from './calculator';

describe('Calculator Evaluator', () => {
  describe('Trigonometry and Angle Modes', () => {
    it('evaluates sin, cos, tan correctly in DEG mode', () => {
      expect(evaluateExpression('sin(0)', 'DEG')).toBe('0');
      expect(evaluateExpression('sin(90)', 'DEG')).toBe('1');
      expect(evaluateExpression('cos(0)', 'DEG')).toBe('1');
      expect(evaluateExpression('cos(90)', 'DEG')).toBe('0');
      expect(evaluateExpression('tan(45)', 'DEG')).toBe('1');
    });

    it('returns NaN for tan(90deg) in DEG mode', () => {
      expect(evaluateExpression('tan(90)', 'DEG')).toBe('NaN');
      expect(evaluateExpression('tan(270)', 'DEG')).toBe('NaN');
    });

    it('evaluates sin, cos, tan in RAD mode', () => {
      expect(evaluateExpression('sin(pi / 2)', 'RAD')).toBe('1');
      expect(evaluateExpression('cos(pi)', 'RAD')).toBe('-1');
    });

    it('evaluates sin, cos, tan in GRAD mode and handles tan(100grad)', () => {
      expect(evaluateExpression('sin(100)', 'GRAD')).toBe('1');
      expect(evaluateExpression('cos(200)', 'GRAD')).toBe('-1');
      expect(evaluateExpression('tan(100)', 'GRAD')).toBe('NaN');
      expect(evaluateExpression('tan(300)', 'GRAD')).toBe('NaN');
    });
  });

  describe('Sanitization and Special Symbols', () => {
    it('handles unicode multiplication, division, and minus symbols', () => {
      expect(evaluateExpression('5 × 4 ÷ 2', 'DEG')).toBe('10');
      expect(evaluateExpression('10 − 4', 'DEG')).toBe('6');
    });

    it('handles square root symbol and pi replacement', () => {
      expect(evaluateExpression('√(16)', 'DEG')).toBe('4');
      expect(evaluateExpression('√9 + 1', 'DEG')).toBe('4');
      expect(evaluateExpression('2 * π', 'RAD', 4)).toBe('6.2832');
    });

    it('correctly handles percentages vs mod operations', () => {
      expect(evaluateExpression('50%', 'DEG')).toBe('0.5');
      expect(evaluateExpression('50% + 10%', 'DEG')).toBe('0.6');
      expect(evaluateExpression('mod(10, 3)', 'DEG')).toBe('1');
    });
  });

  describe('Error Handling, Zero Division, and Propagation', () => {
    it('handles divide by zero and returns Infinity', () => {
      expect(evaluateExpression('1 / 0', 'DEG')).toBe('Infinity');
      expect(evaluateExpression('-1 / 0', 'DEG')).toBe('-Infinity');
    });

    it('returns Error on invalid syntax', () => {
      expect(evaluateExpression('5 ++* 3', 'DEG')).toBe('Error');
      expect(evaluateExpression('(((5 + 2', 'DEG')).toBe('Error');
    });

    it('returns empty string on empty input', () => {
      expect(evaluateExpression('', 'DEG')).toBe('');
      expect(evaluateExpression('   ', 'DEG')).toBe('');
    });
  });

  describe('evaluateWithResult (Typed Result Type)', () => {
    it('returns ok: true for valid expression', () => {
      const res = evaluateWithResult('2 + 3 * 4');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value).toBe('14');
      }
    });

    it('returns ok: false with error: "syntax" for invalid expression', () => {
      const res = evaluateWithResult('2 +* 4');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('syntax');
      }
    });

    it('blocks prototype pollution and security injection attempts', () => {
      expect(evaluateWithResult('constructor.prototype').ok).toBe(false);
      expect(evaluateWithResult('__proto__').ok).toBe(false);
      expect(evaluateWithResult('window.alert(1)').ok).toBe(false);
      expect(evaluateWithResult('eval("2+2")').ok).toBe(false);
    });

    it('blocks deeply nested parentheses attacks', () => {
      const nested = '('.repeat(30) + '5' + ')'.repeat(30);
      expect(evaluateWithResult(nested).ok).toBe(false);
    });

    it('blocks oversized exponents to prevent CPU lockup', () => {
      const hugeExp = evaluateWithResult('10 ^ 999999');
      expect(hugeExp.ok).toBe(false);
    });
  });

  describe('formatNumber utility', () => {
    it('formats numbers with thousand separators', () => {
      expect(formatNumber(1234567.89, 2)).toBe('1,234,567.89');
      expect(formatNumber('Infinity')).toBe('Infinity');
      expect(formatNumber('NaN')).toBe('Error');
    });
  });
});
