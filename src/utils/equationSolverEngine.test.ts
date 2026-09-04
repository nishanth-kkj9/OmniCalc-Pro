import { describe, it, expect } from 'vitest';
import {
  solveQuadratic,
  solveCubic,
  solveLinearSystem2x2,
  solveLinearSystem3x3,
  solveGeneralEquation,
  formatComplex,
} from './equationSolverEngine';

describe('Equation Solver Engine', () => {
  describe('Quadratic Solver', () => {
    it('solves standard two-real-root quadratics (e.g. x^2 - 5x + 6 = 0)', () => {
      const res = solveQuadratic(1, -5, 6);
      expect(res.nature).toBe('two-real');
      expect(res.roots).toHaveLength(2);
      expect(res.roots[0].re).toBeCloseTo(2, 4);
      expect(res.roots[1].re).toBeCloseTo(3, 4);
      expect(res.vertex.x).toBeCloseTo(2.5, 4);
    });

    it('solves one-real-root (repeated root) quadratics (e.g. x^2 - 6x + 9 = 0)', () => {
      const res = solveQuadratic(1, -6, 9);
      expect(res.nature).toBe('one-real');
      expect(res.roots).toHaveLength(1);
      expect(res.roots[0].re).toBeCloseTo(3, 4);
    });

    it('solves complex conjugate quadratics (e.g. x^2 + 4 = 0)', () => {
      const res = solveQuadratic(1, 0, 4);
      expect(res.nature).toBe('two-complex');
      expect(res.roots).toHaveLength(2);
      expect(res.roots[0].re).toBeCloseTo(0, 4);
      expect(Math.abs(res.roots[0].im)).toBeCloseTo(2, 4);
    });

    it('gracefully handles linear degeneration (a = 0)', () => {
      const res = solveQuadratic(0, 2, -10);
      expect(res.nature).toBe('linear');
      expect(res.roots[0].re).toBeCloseTo(5, 4);
    });
  });

  describe('Cubic Solver (Cardano & Casus Irreducibilis)', () => {
    it('solves cubics with three distinct real roots (x^3 - 6x^2 + 11x - 6 = 0 => 1, 2, 3)', () => {
      const res = solveCubic(1, -6, 11, -6);
      expect(res.roots).toHaveLength(3);
      const realParts = res.roots.map((r) => r.re).sort((a, b) => a - b);
      expect(realParts[0]).toBeCloseTo(1, 2);
      expect(realParts[1]).toBeCloseTo(2, 2);
      expect(realParts[2]).toBeCloseTo(3, 2);
    });

    it('solves cubics with one real root and two complex roots (x^3 - 1 = 0)', () => {
      const res = solveCubic(1, 0, 0, -1);
      expect(res.roots).toHaveLength(3);
      const realRoot = res.roots.find((r) => Math.abs(r.im) < 1e-6);
      expect(realRoot).toBeDefined();
      expect(realRoot?.re).toBeCloseTo(1, 4);
    });
  });

  describe('Linear Systems', () => {
    it('solves 2x2 system via Cramer rule: 2x + 3y = 13 and x - 2y = -4', () => {
      // Solution: x = 2, y = 3
      const res = solveLinearSystem2x2(2, 3, 13, 1, -2, -4);
      expect(res.isSolvable).toBe(true);
      expect(res.x).toBeCloseTo(2, 4);
      expect(res.y).toBeCloseTo(3, 4);
    });

    it('flags inconsistent/parallel 2x2 systems', () => {
      const res = solveLinearSystem2x2(1, 1, 5, 1, 1, 10);
      expect(res.isSolvable).toBe(false);
    });

    it('solves 3x3 system with unique solution', () => {
      // x + y + z = 6
      // 2x - y + z = 3
      // x + 2y - z = 2
      // Solution: x = 1, y = 2, z = 3
      const res = solveLinearSystem3x3(
        1, 1, 1, 6,
        2, -1, 1, 3,
        1, 2, -1, 2
      );
      expect(res.isSolvable).toBe(true);
      expect(res.x).toBeCloseTo(1, 4);
      expect(res.y).toBeCloseTo(2, 4);
      expect(res.z).toBeCloseTo(3, 4);
    });
  });

  describe('General Non-linear Equation Solver', () => {
    it('solves non-linear equation roots accurately', () => {
      // cos(x) - x = 0 has a root near 0.739085
      const res = solveGeneralEquation('cos(x) - x', { min: 0, max: 2 });
      expect(res.ok).toBe(true);
      expect(res.roots.length).toBeGreaterThan(0);
      expect(res.roots[0]).toBeCloseTo(0.739, 2);
    });
  });

  describe('Complex number formatting', () => {
    it('formats pure real, pure imaginary, and mixed complex numbers', () => {
      expect(formatComplex({ re: 5, im: 0 })).toBe('5');
      expect(formatComplex({ re: 0, im: 3 })).toBe('3i');
      expect(formatComplex({ re: 2, im: -4 })).toBe('2 - 4i');
      expect(formatComplex({ re: 2, im: 4 })).toBe('2 + 4i');
    });
  });
});
