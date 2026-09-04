import { Point2D } from '../types';
import { CompiledSafeExpression } from './calculator';
import { MAX_ANALYSIS_ITERATIONS, NUMERICAL_EPSILON } from '../constants/limits';

export interface AnalysisRange {
  min: number;
  max: number;
}

/**
 * Finds numerical roots (x-intercepts) for a function within a bounded range.
 * Uses sign change scanning combined with Brent's / bisection method refinement.
 */
export function findRoots(
  compiled: CompiledSafeExpression,
  range: AnalysisRange,
  scope: Record<string, number> = {},
  samples: number = 100
): number[] {
  const { min, max } = range;
  if (min >= max || !Number.isFinite(min) || !Number.isFinite(max)) return [];

  const step = (max - min) / samples;
  const roots: number[] = [];

  const evalAt = (x: number): number | null => {
    try {
      const v = compiled.evaluate({ ...scope, x });
      return v !== null && Number.isFinite(v) ? v : null;
    } catch {
      return null;
    }
  };

  let x1 = min;
  let y1 = evalAt(x1);

  for (let i = 1; i <= samples; i++) {
    const x2 = min + i * step;
    const y2 = evalAt(x2);

    if (y1 !== null && y2 !== null) {
      // Direct root at sample point
      if (Math.abs(y1) < NUMERICAL_EPSILON) {
        addUniqueRoot(roots, x1);
      } else if (Math.abs(y2) < NUMERICAL_EPSILON) {
        addUniqueRoot(roots, x2);
      } else if ((y1 > 0 && y2 < 0) || (y1 < 0 && y2 > 0)) {
        // Sign change between x1 and x2: refine using bisection
        const root = bisectionRoot(evalAt, x1, x2, y1);
        if (root !== null) {
          addUniqueRoot(roots, root);
        }
      }
    }

    x1 = x2;
    y1 = y2;
  }

  return roots.sort((a, b) => a - b);
}

function addUniqueRoot(roots: number[], root: number, tolerance: number = 1e-5): void {
  const rounded = Number(root.toFixed(6));
  if (!roots.some((r) => Math.abs(r - rounded) < tolerance)) {
    roots.push(rounded);
  }
}

function bisectionRoot(
  evalAt: (x: number) => number | null,
  a: number,
  b: number,
  ya: number
): number | null {
  let left = a;
  let right = b;
  let fLeft = ya;

  for (let iter = 0; iter < MAX_ANALYSIS_ITERATIONS; iter++) {
    const mid = (left + right) / 2;
    const fMid = evalAt(mid);
    if (fMid === null) return null;

    if (Math.abs(fMid) < 1e-10 || (right - left) < 1e-8) {
      return mid;
    }

    if ((fLeft > 0 && fMid < 0) || (fLeft < 0 && fMid > 0)) {
      right = mid;
    } else {
      left = mid;
      fLeft = fMid;
    }
  }

  return (left + right) / 2;
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
  const { min, max } = range;
  if (min >= max) return [];

  const step = (max - min) / samples;
  const extrema: { x: number; y: number; type: 'min' | 'max' }[] = [];

  const evalAt = (x: number): number | null => {
    try {
      const v = compiled.evaluate({ ...scope, x });
      return v !== null && Number.isFinite(v) ? v : null;
    } catch {
      return null;
    }
  };

  // Numerical derivative helper
  const h = 1e-5;
  const derivAt = (x: number): number | null => {
    const yp = evalAt(x + h);
    const ym = evalAt(x - h);
    if (yp === null || ym === null) return null;
    return (yp - ym) / (2 * h);
  };

  let x1 = min;
  let d1 = derivAt(x1);

  for (let i = 1; i <= samples; i++) {
    const x2 = min + i * step;
    const d2 = derivAt(x2);

    if (d1 !== null && d2 !== null) {
      if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) {
        // Derivative sign change => local extremum between x1 and x2
        let left = x1;
        let right = x2;
        let bestX = (left + right) / 2;

        for (let iter = 0; iter < 40; iter++) {
          const mid = (left + right) / 2;
          const dMid = derivAt(mid);
          if (dMid === null || Math.abs(dMid) < 1e-9 || (right - left) < 1e-7) {
            bestX = mid;
            break;
          }
          if ((d1 > 0 && dMid < 0) || (d1 < 0 && dMid > 0)) {
            right = mid;
          } else {
            left = mid;
          }
          bestX = mid;
        }

        const yVal = evalAt(bestX);
        if (yVal !== null) {
          const type: 'min' | 'max' = d1 < 0 && d2 > 0 ? 'min' : 'max';
          const roundedX = Number(bestX.toFixed(5));
          const roundedY = Number(yVal.toFixed(5));

          if (!extrema.some((e) => Math.abs(e.x - roundedX) < 1e-3)) {
            extrema.push({ x: roundedX, y: roundedY, type });
          }
        }
      }
    }

    x1 = x2;
    d1 = d2;
  }

  return extrema;
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
  // Solve h(x) = fn1(x) - fn2(x) = 0
  const diffCompiled: CompiledSafeExpression = {
    evaluate: (s) => {
      const y1 = fn1.evaluate(s);
      const y2 = fn2.evaluate(s);
      if (y1 === null || y2 === null) return null;
      return y1 - y2;
    },
  };

  const roots = findRoots(diffCompiled, range, scope, samples);
  const intersections: Point2D[] = [];

  for (const rx of roots) {
    const yVal = fn1.evaluate({ ...scope, x: rx });
    if (yVal !== null && Number.isFinite(yVal)) {
      intersections.push({
        x: rx,
        y: Number(yVal.toFixed(5)),
      });
    }
  }

  return intersections;
}

/**
 * Calculates numerical derivative f'(x0).
 */
export function calculateDerivative(
  compiled: CompiledSafeExpression,
  x0: number,
  scope: Record<string, number> = {}
): number | null {
  const h = 1e-5;
  try {
    const yPlus = compiled.evaluate({ ...scope, x: x0 + h });
    const yMinus = compiled.evaluate({ ...scope, x: x0 - h });
    if (yPlus === null || yMinus === null) return null;
    const slope = (yPlus - yMinus) / (2 * h);
    return Number.isFinite(slope) ? Number(slope.toFixed(6)) : null;
  } catch {
    return null;
  }
}

/**
 * Computes the tangent line equation at point x0: y = m*x + b
 */
export function calculateTangentLine(
  compiled: CompiledSafeExpression,
  x0: number,
  scope: Record<string, number> = {}
): { x0: number; y0: number; slope: number; equation: string } | null {
  const y0 = compiled.evaluate({ ...scope, x: x0 });
  if (y0 === null || !Number.isFinite(y0)) return null;

  const slope = calculateDerivative(compiled, x0, scope);
  if (slope === null) return null;

  // y - y0 = m(x - x0) => y = m*x + (y0 - m*x0)
  const intercept = y0 - slope * x0;
  const sign = intercept >= 0 ? '+' : '-';
  const absB = Math.abs(intercept).toFixed(3);
  const eq = `y = ${slope.toFixed(3)}x ${sign} ${absB}`;

  return {
    x0: Number(x0.toFixed(4)),
    y0: Number(y0.toFixed(4)),
    slope,
    equation: eq,
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
  const y0 = compiled.evaluate({ ...scope, x: x0 });
  if (y0 === null || !Number.isFinite(y0)) return null;

  const tanSlope = calculateDerivative(compiled, x0, scope);
  if (tanSlope === null) return null;

  // If tangent is horizontal (slope ~ 0), normal is vertical line x = x0
  if (Math.abs(tanSlope) < 1e-7) {
    return {
      x0: Number(x0.toFixed(4)),
      y0: Number(y0.toFixed(4)),
      slope: null,
      equation: `x = ${x0.toFixed(3)}`,
      isVertical: true,
    };
  }

  const normalSlope = -1 / tanSlope;
  const intercept = y0 - normalSlope * x0;
  const sign = intercept >= 0 ? '+' : '-';
  const absB = Math.abs(intercept).toFixed(3);
  const eq = `y = ${normalSlope.toFixed(3)}x ${sign} ${absB}`;

  return {
    x0: Number(x0.toFixed(4)),
    y0: Number(y0.toFixed(4)),
    slope: Number(normalSlope.toFixed(5)),
    equation: eq,
    isVertical: false,
  };
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
): { value: number; formatted: string } | null {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (Math.abs(a - b) < 1e-12) return { value: 0, formatted: '0' };

  // If b < a, invert sign
  const sign = b >= a ? 1 : -1;
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);

  // n must be even for Simpson's rule
  const n = nSubintervals % 2 === 0 ? nSubintervals : nSubintervals + 1;
  const h = (upper - lower) / n;

  const evalAt = (x: number): number | null => {
    try {
      const v = compiled.evaluate({ ...scope, x });
      return v !== null && Number.isFinite(v) ? v : null;
    } catch {
      return null;
    }
  };

  const f0 = evalAt(lower);
  const fn = evalAt(upper);
  if (f0 === null || fn === null) return null;

  let sum = f0 + fn;

  for (let i = 1; i < n; i++) {
    const x = lower + i * h;
    const fx = evalAt(x);
    if (fx === null) return null; // Discontinuity in integral interval
    sum += (i % 2 === 1 ? 4 : 2) * fx;
  }

  const result = sign * (h / 3) * sum;
  return {
    value: Number(result.toFixed(6)),
    formatted: Number(result.toFixed(5)).toString(),
  };
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
  if (a >= b) return [];

  const step = (b - a) / samples;
  const polygon: Point2D[] = [];

  // Start at (a, 0)
  polygon.push({ x: a, y: 0 });

  // Curve points from a to b
  for (let i = 0; i <= samples; i++) {
    const x = a + i * step;
    try {
      const y = compiled.evaluate({ ...scope, x });
      if (y !== null && Number.isFinite(y)) {
        polygon.push({ x, y });
      }
    } catch {
      // skip
    }
  }

  // End at (b, 0)
  polygon.push({ x: b, y: 0 });

  return polygon;
}
