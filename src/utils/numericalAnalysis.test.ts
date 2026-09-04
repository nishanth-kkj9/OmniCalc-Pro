import { describe, it, expect } from 'vitest';
import {
  calculateDerivative,
  calculateSecondDerivative,
  calculateTangentLine,
  calculateNormalLine,
  findRoots,
  findExtrema,
  findIntersections,
  integrateDefinite,
  calculateAreaBetweenCurves,
  solveNewtonRaphson,
} from './numericalAnalysis';
import { compileSafeExpression } from './calculator';

describe('Numerical Analysis Layer', () => {
  it('calculates numerical first derivatives accurately', () => {
    // f(x) = x^3 => f'(2) = 12
    const cubeFn = (x: number) => x * x * x;
    const d1 = calculateDerivative(cubeFn, 2);
    expect(d1).not.toBeNull();
    expect(Math.abs((d1 as number) - 12)).toBeLessThan(1e-4);

    // f(x) = sin(x) in rads => f'(0) = 1
    const sinFn = (x: number) => Math.sin(x);
    const dSin = calculateDerivative(sinFn, 0);
    expect(dSin).not.toBeNull();
    expect(Math.abs((dSin as number) - 1)).toBeLessThan(1e-4);
  });

  it('calculates numerical second derivatives accurately', () => {
    // f(x) = x^4 => f''(3) = 12 * 3^2 = 108
    const quadFn = (x: number) => x * x * x * x;
    const d2 = calculateSecondDerivative(quadFn, 3);
    expect(d2).not.toBeNull();
    expect(Math.abs((d2 as number) - 108)).toBeLessThan(1e-2);
  });

  it('computes tangent and normal lines', () => {
    // f(x) = x^2 at x0 = 1 => y0 = 1, slope = 2 => y = 2x - 1
    const parabola = (x: number) => x * x;
    const tangent = calculateTangentLine(parabola, 1);
    expect(tangent).not.toBeNull();
    expect(tangent?.slope).toBeCloseTo(2, 2);
    expect(tangent?.intercept).toBeCloseTo(-1, 2);

    const normal = calculateNormalLine(parabola, 1);
    expect(normal).not.toBeNull();
    expect(normal?.slope).toBeCloseTo(-0.5, 2);
  });

  it('finds multiple roots and repeated roots', () => {
    // f(x) = (x - 2)(x + 3) = x^2 + x - 6 => roots at -3 and 2
    const poly = (x: number) => x * x + x - 6;
    const roots = findRoots(poly, { min: -5, max: 5 });
    expect(roots).toHaveLength(2);
    expect(roots[0]).toBeCloseTo(-3, 2);
    expect(roots[1]).toBeCloseTo(2, 2);

    // Tangent root: f(x) = (x - 1)^2 => root at x=1
    const tangentPoly = (x: number) => (x - 1) * (x - 1);
    const tangentRoots = findRoots(tangentPoly, { min: -2, max: 4 });
    expect(tangentRoots.some((r) => Math.abs(r - 1) < 0.05)).toBe(true);
  });

  it('finds local extrema (minima and maxima)', () => {
    // f(x) = x^3 - 3x => local max at x = -1 (y=2), local min at x = 1 (y=-2)
    const cubic = (x: number) => x * x * x - 3 * x;
    const extrema = findExtrema(cubic, { min: -3, max: 3 });
    expect(extrema.length).toBeGreaterThanOrEqual(2);

    const max = extrema.find((e) => e.type === 'max');
    const min = extrema.find((e) => e.type === 'min');
    expect(max).toBeDefined();
    expect(max?.x).toBeCloseTo(-1, 2);
    expect(min).toBeDefined();
    expect(min?.x).toBeCloseTo(1, 2);
  });

  it('finds intersections between two curves', () => {
    // f(x) = x^2 and g(x) = x + 2 => x^2 - x - 2 = 0 => roots at -1 and 2
    const f = (x: number) => x * x;
    const g = (x: number) => x + 2;
    const intersections = findIntersections(f, g, { min: -4, max: 4 });
    expect(intersections).toHaveLength(2);
    expect(intersections[0].x).toBeCloseTo(-1, 2);
    expect(intersections[0].y).toBeCloseTo(1, 2);
    expect(intersections[1].x).toBeCloseTo(2, 2);
    expect(intersections[1].y).toBeCloseTo(4, 2);
  });

  it('integrates using Simpson, Trapezoid, Midpoint, and Adaptive quadrature', () => {
    // \int_0^3 x^2 dx = [x^3/3]_0^3 = 9
    const f = (x: number) => x * x;

    const simpson = integrateDefinite(f, 0, 3, { method: 'simpson', subdivisions: 100 });
    expect(simpson).not.toBeNull();
    expect(simpson?.value).toBeCloseTo(9, 4);

    const trap = integrateDefinite(f, 0, 3, { method: 'trapezoid', subdivisions: 200 });
    expect(trap).not.toBeNull();
    expect(trap?.value).toBeCloseTo(9, 2);

    const mid = integrateDefinite(f, 0, 3, { method: 'midpoint', subdivisions: 200 });
    expect(mid).not.toBeNull();
    expect(mid?.value).toBeCloseTo(9, 2);

    const adaptive = integrateDefinite(f, 0, 3, { method: 'adaptive', tolerance: 1e-6 });
    expect(adaptive).not.toBeNull();
    expect(adaptive?.value).toBeCloseTo(9, 4);
  });

  it('calculates area between two curves', () => {
    // Area between y = x and y = x^2 from 0 to 1: \int_0^1 (x - x^2) dx = 1/2 - 1/3 = 1/6 ~ 0.166667
    const f = (x: number) => x;
    const g = (x: number) => x * x;
    const area = calculateAreaBetweenCurves(f, g, 0, 1);
    expect(area).not.toBeNull();
    expect(area?.value).toBeCloseTo(1 / 6, 3);
  });

  it('solves Newton-Raphson with convergence details', () => {
    // x^2 - 4 = 0 starting from x0 = 1 => converges to 2
    const f = (x: number) => x * x - 4;
    const res = solveNewtonRaphson(f, 1);
    expect(res.converged).toBe(true);
    expect(res.root).toBeCloseTo(2, 4);
    expect(res.iterationCount).toBeLessThan(10);
    expect(res.iterations.length).toBeGreaterThan(0);
  });

  it('seamlessly accepts CompiledSafeExpression instances', () => {
    const compiled = compileSafeExpression('x^2 - 9', 'RAD');
    expect(compiled.ok).toBe(true);
    if (compiled.ok) {
      const roots = findRoots(compiled.compiled, { min: -5, max: 5 });
      expect(roots).toHaveLength(2);
      expect(roots[0]).toBeCloseTo(-3, 2);
      expect(roots[1]).toBeCloseTo(3, 2);
    }
  });

  it('handles trigonometric integrals with precision', () => {
    // \int_0^\pi \sin(x) dx = 2
    const sinFn = (x: number) => Math.sin(x);
    const result = integrateDefinite(sinFn, 0, Math.PI, { method: 'adaptive', tolerance: 1e-7 });
    expect(result).not.toBeNull();
    expect(result?.value).toBeCloseTo(2, 5);
  });

  it('handles exponential and gaussian integrals', () => {
    // \int_0^1 e^x dx = e - 1 = 1.7182818
    const expFn = (x: number) => Math.exp(x);
    const expResult = integrateDefinite(expFn, 0, 1, { method: 'simpson', subdivisions: 200 });
    expect(expResult?.value).toBeCloseTo(Math.E - 1, 4);

    // Gaussian bell curve: \int_{-3}^3 e^{-x^2} dx ~ sqrt(pi) * erf(3) ~ 1.7724
    const gaussFn = (x: number) => Math.exp(-x * x);
    const gaussResult = integrateDefinite(gaussFn, -3, 3, { method: 'adaptive', tolerance: 1e-6 });
    expect(gaussResult?.value).toBeCloseTo(Math.sqrt(Math.PI), 2);
  });

  it('gracefully handles domain errors, non-convergent, and zero derivative cases', () => {
    // Zero derivative at x = 0 for f(x) = x^2 + 1
    const flatFn = (x: number) => x * x + 1;
    const nrRes = solveNewtonRaphson(flatFn, 0, { maxIterations: 10 });
    expect(nrRes.converged).toBe(false);

    // Sqrt with negative values
    const sqrtFn = (x: number) => (x < 0 ? NaN : Math.sqrt(x));
    const dSqrt = calculateDerivative(sqrtFn, -1);
    expect(dSqrt).toBeNull();
  });
});
