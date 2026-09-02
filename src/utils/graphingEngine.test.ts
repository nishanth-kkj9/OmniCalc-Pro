import { describe, it, expect } from 'vitest';
import { compileSafeExpression } from './calculator';
import {
  findRoots,
  findExtrema,
  findIntersections,
  computeTangentLine,
  computeDefiniteIntegral,
  GRAPHING_PRESETS,
} from './graphingEngine';

describe('graphingEngine algorithms', () => {
  it('has presets defined', () => {
    expect(GRAPHING_PRESETS.length).toBeGreaterThan(5);
    expect(GRAPHING_PRESETS.some((p) => p.id === 'sine_wave')).toBe(true);
  });

  it('finds roots for a parabola x^2 - 4', () => {
    const comp = compileSafeExpression('x^2 - 4', 'RAD', ['x']);
    expect(comp.ok).toBe(true);
    if (comp.ok) {
      const roots = findRoots(comp.compiled, -5, 5);
      expect(roots).toContain(-2);
      expect(roots).toContain(2);
    }
  });

  it('finds extrema for cubic x^3 - 3*x', () => {
    const comp = compileSafeExpression('x^3 - 3 * x', 'RAD', ['x']);
    expect(comp.ok).toBe(true);
    if (comp.ok) {
      const extrema = findExtrema(comp.compiled, -3, 3);
      // Derivative 3x^2 - 3 = 0 => x = -1 (max), x = 1 (min)
      const maxPt = extrema.find((e) => e.type === 'max');
      const minPt = extrema.find((e) => e.type === 'min');
      expect(maxPt).toBeDefined();
      expect(minPt).toBeDefined();
      expect(Math.abs((maxPt?.x ?? 0) - -1)).toBeLessThan(0.05);
      expect(Math.abs((minPt?.x ?? 0) - 1)).toBeLessThan(0.05);
    }
  });

  it('finds intersections between sin(x) and 0', () => {
    const c1 = compileSafeExpression('sin(x)', 'RAD', ['x']);
    const c2 = compileSafeExpression('0', 'RAD', ['x']);
    if (c1.ok && c2.ok) {
      const intersections = findIntersections(c1.compiled, c2.compiled, -3.5, 3.5);
      const xVals = intersections.map((pt) => Math.round(pt.x * 10) / 10);
      expect(xVals).toContain(0);
      expect(xVals.some((x) => Math.abs(x - 3.1) < 0.2)).toBe(true);
    }
  });

  it('computes tangent line at x0 = 1 for x^2', () => {
    const comp = compileSafeExpression('x^2', 'RAD', ['x']);
    if (comp.ok) {
      const tangent = computeTangentLine(comp.compiled, 1);
      expect(tangent).not.toBeNull();
      // f(1) = 1, f'(1) = 2 => y = 2x - 1
      expect(tangent?.y0).toBe(1);
      expect(tangent?.slope).toBe(2);
      expect(tangent?.intercept).toBe(-1);
    }
  });

  it('computes definite integral of 2*x from 0 to 3', () => {
    const comp = compileSafeExpression('2 * x', 'RAD', ['x']);
    if (comp.ok) {
      // integral of 2x dx from 0 to 3 is x^2|_0^3 = 9
      const res = computeDefiniteIntegral(comp.compiled, 0, 3, 100);
      expect(res).not.toBeNull();
      expect(Math.abs((res?.value ?? 0) - 9)).toBeLessThan(0.01);
    }
  });
});
