import { describe, it, expect } from 'vitest';
import { compileSafeExpression } from './calculator';
import arithmeticCases from '../../tests/math-spec/arithmetic.json';
import trigCases from '../../tests/math-spec/trigonometry.json';
import specialCases from '../../tests/math-spec/special_functions.json';

interface TestCase {
  name: string;
  expr: string;
  expected: number;
  angle_mode: 'degrees' | 'radians';
}

describe('Cross-Surface Mathematical Conformance (Web Evaluator)', () => {
  describe('Arithmetic Specification', () => {
    (arithmeticCases as TestCase[]).forEach((tc) => {
      it(`evaluates ${tc.name}: ${tc.expr} -> ${tc.expected}`, () => {
        const mode = tc.angle_mode === 'degrees' ? 'DEG' : 'RAD';
        const compiled = compileSafeExpression(tc.expr, mode, ['x']);
        expect(compiled.ok).toBe(true);
        if (compiled.ok) {
          const res = compiled.compiled.evaluate();
          expect(res).not.toBeNull();
          expect(res!).toBeCloseTo(tc.expected, 4);
        }
      });
    });
  });

  describe('Trigonometry Specification', () => {
    (trigCases as TestCase[]).forEach((tc) => {
      it(`evaluates ${tc.name}: ${tc.expr} -> ${tc.expected}`, () => {
        const mode = tc.angle_mode === 'degrees' ? 'DEG' : 'RAD';
        const compiled = compileSafeExpression(tc.expr, mode, ['x']);
        expect(compiled.ok).toBe(true);
        if (compiled.ok) {
          const res = compiled.compiled.evaluate();
          expect(res).not.toBeNull();
          expect(res!).toBeCloseTo(tc.expected, 4);
        }
      });
    });
  });

  describe('Special Functions Specification', () => {
    (specialCases as TestCase[]).forEach((tc) => {
      it(`evaluates ${tc.name}: ${tc.expr} -> ${tc.expected}`, () => {
        const mode = tc.angle_mode === 'degrees' ? 'DEG' : 'RAD';
        const compiled = compileSafeExpression(tc.expr, mode, ['x']);
        expect(compiled.ok).toBe(true);
        if (compiled.ok) {
          const res = compiled.compiled.evaluate();
          expect(res).not.toBeNull();
          expect(res!).toBeCloseTo(tc.expected, 4);
        }
      });
    });
  });
});
