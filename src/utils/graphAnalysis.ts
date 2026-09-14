import { Point2D } from '../types';
import { CompiledSafeExpression } from './calculator';
import {
  findRoots as numFindRoots,
  findExtrema as numFindExtrema,
  findIntersections as numFindIntersections,
  calculateDerivative as numCalcDerivative,
  calculateTangentLine as numCalcTangent,
  calculateNormalLine as numCalcNormal,
  integrateDefinite as numIntegrateDefinite,
  calculateAreaBetweenCurves as numCalcAreaBetween,
  calculateParametricArcLength as numCalcParametricArcLength,
  calculatePolarArcLength as numCalcPolarArcLength,
  calculatePolarArea as numCalcPolarArea,
} from './numericalAnalysis';

export interface AnalysisRange {
  min: number;
  max: number;
}

/**
 * Finds numerical roots (x-intercepts) for a function within a bounded range.
 * Delegates to centralized numericalAnalysis module with Brent's method and tangent root detection.
 */
export function findRoots(
  compiled: CompiledSafeExpression,
  range: AnalysisRange,
  scope: Record<string, number> = {},
  samples: number = 100
): number[] {
  return numFindRoots(compiled, range, { scope, samples });
}

/**
 * Finds local extrema (minima and maxima) within a range.
 */
export function findExtrema(
  compiled: CompiledSafeExpression,
  range: AnalysisRange,
  scope: Record<string, number> = {},
  samples: number = 120
): { x: number; y: number; type: 'min' | 'max' }[] {
  return numFindExtrema(compiled, range, scope, samples);
}

/**
 * Finds intersections between two compiled functions f(x) and g(x).
 */
export function findIntersections(
  fn1: CompiledSafeExpression,
  fn2: CompiledSafeExpression,
  range: AnalysisRange,
  scope: Record<string, number> = {},
  samples: number = 100
): Point2D[] {
  return numFindIntersections(fn1, fn2, range, scope, samples);
}

/**
 * Finds y-intercept of a curve at x = 0.
 */
export function findYIntercept(
  compiled: CompiledSafeExpression,
  scope: Record<string, number> = {}
): Point2D | null {
  try {
    const y = compiled.evaluate({ ...scope, x: 0 });
    if (y !== null && Number.isFinite(y)) {
      return { x: 0, y: Number(y.toFixed(5)) };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Calculates numerical derivative f'(x0).
 */
export function calculateDerivative(
  compiled: CompiledSafeExpression,
  x0: number,
  scope: Record<string, number> = {}
): number | null {
  const d = numCalcDerivative(compiled, x0, scope);
  return d !== null ? Number(d.toFixed(6)) : null;
}

/**
 * Computes the tangent line equation at point x0: y = m*x + b
 */
export function calculateTangentLine(
  compiled: CompiledSafeExpression,
  x0: number,
  scope: Record<string, number> = {}
): { x0: number; y0: number; slope: number; equation: string } | null {
  const res = numCalcTangent(compiled, x0, scope);
  if (!res) return null;
  return {
    x0: res.x0,
    y0: res.y0,
    slope: res.slope,
    equation: res.equation,
  };
}

/**
 * Computes the normal line equation at point x0: perpendicular to tangent
 */
export function calculateNormalLine(
  compiled: CompiledSafeExpression,
  x0: number,
  scope: Record<string, number> = {}
): { x0: number; y0: number; slope: number | null; equation: string; isVertical: boolean } | null {
  return numCalcNormal(compiled, x0, scope);
}

/**
 * Computes definite integral using composite Simpson's 1/3 rule.
 */
export function calculateDefiniteIntegral(
  compiled: CompiledSafeExpression,
  a: number,
  b: number,
  scope: Record<string, number> = {},
  nSubintervals: number = 200
): { value: number; formatted: string; singularityDetected?: boolean } | null {
  const res = numIntegrateDefinite(compiled, a, b, {
    scope,
    subdivisions: nSubintervals,
    method: 'simpson',
  });
  if (!res) return null;
  if (res.singularityDetected || !Number.isFinite(res.value)) {
    return {
      value: NaN,
      formatted: res.error || 'Singularity in interval',
      singularityDetected: true,
    };
  }
  return {
    value: res.value,
    formatted: Number(res.value.toFixed(5)).toString(),
  };
}

/**
 * Computes area between two curves f(x) and g(x) over [a, b].
 */
export function calculateAreaBetweenCurves(
  fn1: CompiledSafeExpression,
  fn2: CompiledSafeExpression,
  a: number,
  b: number,
  scope: Record<string, number> = {},
  nSubintervals: number = 200
): { value: number; formatted: string } | null {
  const res = numCalcAreaBetween(fn1, fn2, a, b, { scope, subdivisions: nSubintervals });
  if (!res) return null;
  return {
    value: res.value,
    formatted: Number(res.value.toFixed(5)).toString(),
  };
}

/**
 * Generates polygon points for area under curve shading between x=a and x=b.
 * Splits into separate polygons across undefined points or asymptotes (non-bridging).
 */
export function generateIntegralPolygons(
  compiled: CompiledSafeExpression,
  a: number,
  b: number,
  scope: Record<string, number> = {},
  samples: number = 160
): Point2D[][] {
  if (a >= b) return [];

  const step = (b - a) / samples;
  const polygons: Point2D[][] = [];
  let currentSegment: Point2D[] = [];
  let segStart = a;

  for (let i = 0; i <= samples; i++) {
    const x = a + i * step;
    let y: number | null = null;
    try {
      const val = compiled.evaluate({ ...scope, x });
      if (val !== null && Number.isFinite(val) && Math.abs(val) < 1e5) {
        y = val;
      }
    } catch {
      y = null;
    }

    if (y === null) {
      if (currentSegment.length > 0) {
        const lastX = currentSegment[currentSegment.length - 1].x;
        polygons.push([{ x: segStart, y: 0 }, ...currentSegment, { x: lastX, y: 0 }]);
        currentSegment = [];
      }
      segStart = x + step;
    } else {
      // Check for steep asymptotic jump relative to previous point
      if (currentSegment.length > 0) {
        const prev = currentSegment[currentSegment.length - 1];
        const dy = Math.abs(y - prev.y);
        if (dy > 200 && Math.sign(y) !== Math.sign(prev.y)) {
          polygons.push([{ x: segStart, y: 0 }, ...currentSegment, { x: prev.x, y: 0 }]);
          currentSegment = [];
          segStart = x;
        }
      }
      currentSegment.push({ x, y });
    }
  }

  if (currentSegment.length > 0) {
    const lastX = currentSegment[currentSegment.length - 1].x;
    polygons.push([{ x: segStart, y: 0 }, ...currentSegment, { x: lastX, y: 0 }]);
  }

  return polygons.filter((p) => p.length >= 3);
}

/**
 * Generates polygon points for area under curve shading between x=a and x=b.
 */
export function generateIntegralPolygon(
  compiled: CompiledSafeExpression,
  a: number,
  b: number,
  scope: Record<string, number> = {},
  samples: number = 100
): Point2D[] {
  const polys = generateIntegralPolygons(compiled, a, b, scope, samples);
  return polys.length > 0 ? polys[0] : [];
}

/**
 * Calculates arc length of a parametric curve (x(t), y(t)) over [tMin, tMax].
 */
export function calculateParametricArcLength(
  compiledX: CompiledSafeExpression,
  compiledY: CompiledSafeExpression,
  tMin: number,
  tMax: number,
  scope: Record<string, number> = {}
): number | null {
  const res = numCalcParametricArcLength(compiledX, compiledY, tMin, tMax, { scope });
  return res && Number.isFinite(res.value) ? Number(res.value.toFixed(5)) : null;
}

/**
 * Calculates arc length of a polar curve r = f(theta) over [thetaMin, thetaMax].
 */
export function calculatePolarArcLength(
  compiledR: CompiledSafeExpression,
  thetaMin: number,
  thetaMax: number,
  scope: Record<string, number> = {}
): number | null {
  const res = numCalcPolarArcLength(compiledR, thetaMin, thetaMax, { scope });
  return res && Number.isFinite(res.value) ? Number(res.value.toFixed(5)) : null;
}

/**
 * Calculates area of a polar curve r = f(theta) over [thetaMin, thetaMax].
 */
export function calculatePolarArea(
  compiledR: CompiledSafeExpression,
  thetaMin: number,
  thetaMax: number,
  scope: Record<string, number> = {}
): number | null {
  const res = numCalcPolarArea(compiledR, thetaMin, thetaMax, { scope });
  return res && Number.isFinite(res.value) ? Number(res.value.toFixed(5)) : null;
}

/**
 * Generates polygon points for area between two curves f1 and f2 between x=a and x=b.
 */
export function generateAreaBetweenPolygon(
  fn1: CompiledSafeExpression,
  fn2: CompiledSafeExpression,
  a: number,
  b: number,
  scope: Record<string, number> = {},
  samples: number = 100
): Point2D[] {
  if (a >= b) return [];

  const step = (b - a) / samples;
  const topCurve: Point2D[] = [];
  const bottomCurve: Point2D[] = [];

  for (let i = 0; i <= samples; i++) {
    const x = a + i * step;
    try {
      const y1 = fn1.evaluate({ ...scope, x });
      const y2 = fn2.evaluate({ ...scope, x });
      if (y1 !== null && y2 !== null && Number.isFinite(y1) && Number.isFinite(y2)) {
        topCurve.push({ x, y: y1 });
        bottomCurve.push({ x, y: y2 });
      }
    } catch {
      // skip
    }
  }

  if (topCurve.length === 0) return [];

  // Traverse top curve forward, then bottom curve backwards
  const polygon: Point2D[] = [...topCurve];
  for (let i = bottomCurve.length - 1; i >= 0; i--) {
    polygon.push(bottomCurve[i]);
  }

  return polygon;
}
