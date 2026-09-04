import { NUMERICAL_EPSILON, MAX_ITERATIONS, MAX_ANALYSIS_ITERATIONS } from '../constants/limits';
import { CompiledSafeExpression, CalculatorScope } from './calculator';

export interface NumericalRange {
  min: number;
  max: number;
}

export type EvaluatorFn = (x: number) => number | null;

export function toEvaluator(
  fnOrCompiled: EvaluatorFn | CompiledSafeExpression,
  scope: CalculatorScope = {}
): EvaluatorFn {
  if (typeof fnOrCompiled === 'function') {
    return fnOrCompiled;
  }
  return (x: number) => {
    try {
      const val = fnOrCompiled.evaluate({ ...scope, x });
      return val !== null && Number.isFinite(val) && !isNaN(val) ? val : null;
    } catch {
      return null;
    }
  };
}

export interface DerivativeResult {
  value: number;
  errorEstimate?: number;
  method: 'five-point' | 'richardson';
}

/**
 * Computes numerical first derivative using a 5-point stencil with scale-aware step size.
 * Formula: (-f(x+2h) + 8f(x+h) - 8f(x-h) + f(x-2h)) / (12h)
 */
export function calculateDerivative(
  fn: EvaluatorFn | CompiledSafeExpression,
  x0: number,
  scope: CalculatorScope = {},
  hParam?: number
): number | null {
  const evalAt = toEvaluator(fn, scope);
  if (!Number.isFinite(x0)) return null;

  // Scale-aware step size
  const h = hParam ?? Math.max(1e-6, Math.abs(x0) * 1e-6);

  const fp2 = evalAt(x0 + 2 * h);
  const fp1 = evalAt(x0 + h);
  const fm1 = evalAt(x0 - h);
  const fm2 = evalAt(x0 - 2 * h);

  if (fp2 !== null && fp1 !== null && fm1 !== null && fm2 !== null) {
    const d = (-fp2 + 8 * fp1 - 8 * fm1 + fm2) / (12 * h);
    return Number.isFinite(d) ? d : null;
  }

  // Fallback to central difference if 5-point stencil hits boundary
  const right = evalAt(x0 + h);
  const left = evalAt(x0 - h);
  if (right !== null && left !== null) {
    const cd = (right - left) / (2 * h);
    return Number.isFinite(cd) ? cd : null;
  }

  // Forward/backward difference fallback
  const center = evalAt(x0);
  if (center !== null && right !== null) {
    return (right - center) / h;
  }
  if (center !== null && left !== null) {
    return (center - left) / h;
  }

  return null;
}

/**
 * Computes numerical second derivative using a 5-point stencil.
 * Formula: (-f(x+2h) + 16f(x+h) - 30f(x) + 16f(x-h) - f(x-2h)) / (12h^2)
 */
export function calculateSecondDerivative(
  fn: EvaluatorFn | CompiledSafeExpression,
  x0: number,
  scope: CalculatorScope = {},
  hParam?: number
): number | null {
  const evalAt = toEvaluator(fn, scope);
  if (!Number.isFinite(x0)) return null;

  const h = hParam ?? Math.max(1e-5, Math.abs(x0) * 1e-5);
  const f0 = evalAt(x0);
  if (f0 === null) return null;

  const fp2 = evalAt(x0 + 2 * h);
  const fp1 = evalAt(x0 + h);
  const fm1 = evalAt(x0 - h);
  const fm2 = evalAt(x0 - 2 * h);

  if (fp2 !== null && fp1 !== null && fm1 !== null && fm2 !== null) {
    const d2 = (-fp2 + 16 * fp1 - 30 * f0 + 16 * fm1 - fm2) / (12 * h * h);
    return Number.isFinite(d2) ? d2 : null;
  }

  // Fallback to standard 3-point central second difference: (f(x+h) - 2f(x) + f(x-h)) / h^2
  if (fp1 !== null && fm1 !== null) {
    const d2 = (fp1 - 2 * f0 + fm1) / (h * h);
    return Number.isFinite(d2) ? d2 : null;
  }

  return null;
}

export interface TangentLineResult {
  x0: number;
  y0: number;
  slope: number;
  intercept: number;
  equation: string;
}

export function calculateTangentLine(
  fn: EvaluatorFn | CompiledSafeExpression,
  x0: number,
  scope: CalculatorScope = {}
): TangentLineResult | null {
  const evalAt = toEvaluator(fn, scope);
  const y0 = evalAt(x0);
  if (y0 === null || !Number.isFinite(y0)) return null;

  const slope = calculateDerivative(evalAt, x0);
  if (slope === null || !Number.isFinite(slope)) return null;

  const intercept = y0 - slope * x0;
  const sign = intercept >= 0 ? '+' : '-';
  const absB = Math.abs(intercept).toFixed(3);
  const eq = `y = ${slope.toFixed(3)}x ${sign} ${absB}`;

  return {
    x0: Number(x0.toFixed(6)),
    y0: Number(y0.toFixed(6)),
    slope: Number(slope.toFixed(6)),
    intercept: Number(intercept.toFixed(6)),
    equation: eq,
  };
}

export interface NormalLineResult {
  x0: number;
  y0: number;
  slope: number | null;
  intercept: number | null;
  equation: string;
  isVertical: boolean;
}

export function calculateNormalLine(
  fn: EvaluatorFn | CompiledSafeExpression,
  x0: number,
  scope: CalculatorScope = {}
): NormalLineResult | null {
  const evalAt = toEvaluator(fn, scope);
  const y0 = evalAt(x0);
  if (y0 === null || !Number.isFinite(y0)) return null;

  const tanSlope = calculateDerivative(evalAt, x0);
  if (tanSlope === null || !Number.isFinite(tanSlope)) return null;

  if (Math.abs(tanSlope) < 1e-8) {
    // Horizontal tangent => vertical normal: x = x0
    return {
      x0: Number(x0.toFixed(6)),
      y0: Number(y0.toFixed(6)),
      slope: null,
      intercept: null,
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
    x0: Number(x0.toFixed(6)),
    y0: Number(y0.toFixed(6)),
    slope: Number(normalSlope.toFixed(6)),
    intercept: Number(intercept.toFixed(6)),
    equation: eq,
    isVertical: false,
  };
}

/**
 * High-accuracy hybrid root finding using Brent's method with bisection fallback.
 */
export function brentRoot(
  evalAt: EvaluatorFn,
  a: number,
  b: number,
  faParam?: number | null,
  fbParam?: number | null,
  maxIterations: number = MAX_ANALYSIS_ITERATIONS,
  tol: number = NUMERICAL_EPSILON
): number | null {
  let aVal = a;
  let bVal = b;
  let fa = faParam !== undefined && faParam !== null ? faParam : evalAt(aVal);
  let fb = fbParam !== undefined && fbParam !== null ? fbParam : evalAt(bVal);

  if (fa === null || fb === null) return null;
  if (Math.abs(fa) <= tol) return aVal;
  if (Math.abs(fb) <= tol) return bVal;
  if (fa * fb > 0) return null; // No guaranteed root bracket

  let c = aVal;
  let fc = fa;
  let d = bVal - aVal;
  let e = d;

  for (let i = 0; i < maxIterations; i++) {
    if (fb === 0) return bVal;

    if (fa * fb > 0) {
      aVal = c;
      fa = fc;
      d = bVal - aVal;
      e = d;
    }

    if (Math.abs(fa) < Math.abs(fb)) {
      c = bVal;
      bVal = aVal;
      aVal = c;
      fc = fb;
      fb = fa;
      fa = fc;
    }

    const tolAct = 2 * Number.EPSILON * Math.abs(bVal) + 0.5 * tol;
    const m = 0.5 * (aVal - bVal);

    if (Math.abs(m) <= tolAct || fb === 0) {
      return bVal;
    }

    if (Math.abs(e) >= tolAct && Math.abs(fc) > Math.abs(fb)) {
      const s = fb / fc;
      let p: number;
      let q: number;

      if (aVal === c) {
        // Secant method
        p = 2 * m * s;
        q = 1 - s;
      } else {
        // Inverse quadratic interpolation
        q = fc / fa;
        const r = fb / fa;
        p = s * (2 * m * q * (q - r) - (bVal - c) * (r - 1));
        q = (q - 1) * (r - 1) * (s - 1);
      }

      if (p > 0) q = -q;
      p = Math.abs(p);

      if (2 * p < Math.min(3 * m * q - Math.abs(tolAct * q), Math.abs(e * q))) {
        e = d;
        d = p / q;
      } else {
        d = m;
        e = m;
      }
    } else {
      d = m;
      e = m;
    }

    c = bVal;
    fc = fb;

    if (Math.abs(d) > tolAct) {
      bVal += d;
    } else {
      bVal += m > 0 ? tolAct : -tolAct;
    }

    const nextFb = evalAt(bVal);
    if (nextFb === null) return null;
    fb = nextFb;
  }

  return bVal;
}

export interface RootFindingOptions {
  scope?: CalculatorScope;
  samples?: number;
  tolerance?: number;
  detectTangentRoots?: boolean;
}

/**
 * Scans a range for roots including bracketed sign changes, exact roots, and tangent roots.
 */
export function findRoots(
  fn: EvaluatorFn | CompiledSafeExpression,
  range: NumericalRange,
  options: RootFindingOptions = {}
): number[] {
  const { min, max } = range;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return [];

  const {
    scope = {},
    samples = 120,
    tolerance = 1e-6,
    detectTangentRoots = true,
  } = options;

  const evalAt = toEvaluator(fn, scope);
  const step = (max - min) / samples;
  const roots: number[] = [];

  const addRoot = (val: number) => {
    const rounded = Number(val.toFixed(6));
    if (Number.isFinite(rounded) && !roots.some((r) => Math.abs(r - rounded) < tolerance * 10)) {
      roots.push(rounded);
    }
  };

  let x1 = min;
  let y1 = evalAt(x1);

  if (y1 !== null && Math.abs(y1) < 1e-9) {
    addRoot(x1);
  }

  for (let i = 1; i <= samples; i++) {
    const x2 = min + i * step;
    const y2 = evalAt(x2);

    if (y1 !== null && y2 !== null) {
      if (Math.abs(y2) < 1e-9) {
        addRoot(x2);
      } else if ((y1 > 0 && y2 < 0) || (y1 < 0 && y2 > 0)) {
        // Sign change -> solve with Brent's method
        const root = brentRoot(evalAt, x1, x2, y1, y2, MAX_ANALYSIS_ITERATIONS, tolerance);
        if (root !== null && Number.isFinite(root)) {
          addRoot(root);
        }
      } else if (detectTangentRoots) {
        // Check for tangent root: f'(x) changes sign and min |f(x)| is close to 0
        const d1 = calculateDerivative(evalAt, x1);
        const d2 = calculateDerivative(evalAt, x2);
        if (d1 !== null && d2 !== null && ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0))) {
          const mid = (x1 + x2) / 2;
          const yMid = evalAt(mid);
          if (yMid !== null && Math.abs(yMid) < 1e-4) {
            // Refine local extremum to check if it touches 0
            const optRoot = refineTangentRoot(evalAt, x1, x2);
            if (optRoot !== null) {
              addRoot(optRoot);
            }
          }
        }
      }
    }

    x1 = x2;
    y1 = y2;
  }

  return roots.sort((a, b) => a - b);
}

function refineTangentRoot(evalAt: EvaluatorFn, a: number, b: number): number | null {
  let left = a;
  let right = b;
  for (let iter = 0; iter < 40; iter++) {
    const m1 = left + (right - left) / 3;
    const m2 = right - (right - left) / 3;
    const ym1 = evalAt(m1);
    const ym2 = evalAt(m2);
    if (ym1 === null || ym2 === null) break;
    if (Math.abs(ym1) < Math.abs(ym2)) {
      right = m2;
    } else {
      left = m1;
    }
  }
  const bestX = (left + right) / 2;
  const bestY = evalAt(bestX);
  if (bestY !== null && Math.abs(bestY) < 1e-5) {
    return bestX;
  }
  return null;
}

export interface ExtremaResult {
  x: number;
  y: number;
  type: 'min' | 'max';
}

/**
 * Locates local minima and maxima in a given range using derivative zero-crossing detection
 * and golden section / Brent refinement.
 */
export function findExtrema(
  fn: EvaluatorFn | CompiledSafeExpression,
  range: NumericalRange,
  scope: CalculatorScope = {},
  samples: number = 120
): ExtremaResult[] {
  const { min, max } = range;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return [];

  const evalAt = toEvaluator(fn, scope);
  const derivAt = (x: number) => calculateDerivative(evalAt, x);
  const step = (max - min) / samples;
  const extrema: ExtremaResult[] = [];

  let x1 = min;
  let d1 = derivAt(x1);

  for (let i = 1; i <= samples; i++) {
    const x2 = min + i * step;
    const d2 = derivAt(x2);

    if (d1 !== null && d2 !== null) {
      if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) {
        // Local max or min
        const root = brentRoot(derivAt, x1, x2, d1, d2, 60, 1e-7);
        if (root !== null) {
          const yVal = evalAt(root);
          if (yVal !== null && Number.isFinite(yVal)) {
            const type: 'min' | 'max' = d1 < 0 && d2 > 0 ? 'min' : 'max';
            const rx = Number(root.toFixed(6));
            const ry = Number(yVal.toFixed(6));
            if (!extrema.some((e) => Math.abs(e.x - rx) < 1e-4)) {
              extrema.push({ x: rx, y: ry, type });
            }
          }
        }
      }
    }

    x1 = x2;
    d1 = d2;
  }

  return extrema;
}

export interface IntersectionPoint {
  x: number;
  y: number;
}

/**
 * Finds intersections between two mathematical curves f(x) and g(x).
 */
export function findIntersections(
  fn1: EvaluatorFn | CompiledSafeExpression,
  fn2: EvaluatorFn | CompiledSafeExpression,
  range: NumericalRange,
  scope: CalculatorScope = {},
  samples: number = 120
): IntersectionPoint[] {
  const eval1 = toEvaluator(fn1, scope);
  const eval2 = toEvaluator(fn2, scope);

  const diffFn: EvaluatorFn = (x: number) => {
    const y1 = eval1(x);
    const y2 = eval2(x);
    if (y1 === null || y2 === null) return null;
    return y1 - y2;
  };

  const roots = findRoots(diffFn, range, { scope, samples, tolerance: 1e-6 });
  const intersections: IntersectionPoint[] = [];

  for (const rx of roots) {
    const yVal = eval1(rx);
    if (yVal !== null && Number.isFinite(yVal)) {
      intersections.push({
        x: rx,
        y: Number(yVal.toFixed(6)),
      });
    }
  }

  return intersections;
}

export interface IntegrationOptions {
  scope?: CalculatorScope;
  subdivisions?: number;
  method?: 'simpson' | 'trapezoid' | 'midpoint' | 'adaptive';
  tolerance?: number;
}

export interface IntegrationResult {
  value: number;
  errorEstimate?: number;
  method: string;
  subdivisions: number;
  converged: boolean;
}

/**
 * Comprehensive numerical definite integration supporting Midpoint, Trapezoidal, Simpson's 1/3, and Adaptive Quadrature.
 */
export function integrateDefinite(
  fn: EvaluatorFn | CompiledSafeExpression,
  a: number,
  b: number,
  options: IntegrationOptions = {}
): IntegrationResult | null {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (Math.abs(a - b) < 1e-12) {
    return { value: 0, method: 'exact', subdivisions: 0, converged: true };
  }

  const {
    scope = {},
    subdivisions = 100,
    method = 'simpson',
    tolerance = 1e-8,
  } = options;

  const evalAt = toEvaluator(fn, scope);
  const sign = b >= a ? 1 : -1;
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);

  if (method === 'midpoint') {
    const n = Math.max(10, subdivisions);
    const h = (upper - lower) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const mid = lower + (i + 0.5) * h;
      const fMid = evalAt(mid);
      if (fMid === null) return null;
      sum += fMid;
    }
    const val = sign * h * sum;
    return {
      value: Number(val.toFixed(8)),
      method: 'midpoint',
      subdivisions: n,
      converged: true,
    };
  }

  if (method === 'trapezoid') {
    const n = Math.max(10, subdivisions);
    const h = (upper - lower) / n;
    const f0 = evalAt(lower);
    const fnVal = evalAt(upper);
    if (f0 === null || fnVal === null) return null;

    let sum = 0.5 * (f0 + fnVal);
    for (let i = 1; i < n; i++) {
      const x = lower + i * h;
      const fx = evalAt(x);
      if (fx === null) return null;
      sum += fx;
    }
    const val = sign * h * sum;
    return {
      value: Number(val.toFixed(8)),
      method: 'trapezoid',
      subdivisions: n,
      converged: true,
    };
  }

  if (method === 'adaptive') {
    let evalCount = 0;
    const maxDepth = 20;

    const adaptiveRecurse = (
      left: number,
      right: number,
      fa: number,
      fb: number,
      fm: number,
      whole: number,
      depth: number
    ): number | null => {
      evalCount += 2;
      const m = (left + right) / 2;
      const lm = (left + m) / 2;
      const rm = (m + right) / 2;
      const flm = evalAt(lm);
      const frm = evalAt(rm);

      if (flm === null || frm === null) return null;

      const leftSimp = ((m - left) / 6) * (fa + 4 * flm + fm);
      const rightSimp = ((right - m) / 6) * (fm + 4 * frm + fb);
      const delta = leftSimp + rightSimp - whole;

      if (depth >= maxDepth || Math.abs(delta) <= 15 * tolerance) {
        return leftSimp + rightSimp + delta / 15;
      }

      const lRes = adaptiveRecurse(left, m, fa, fm, flm, leftSimp, depth + 1);
      const rRes = adaptiveRecurse(m, right, fm, fb, frm, rightSimp, depth + 1);
      if (lRes === null || rRes === null) return null;
      return lRes + rRes;
    };

    const fa = evalAt(lower);
    const fb = evalAt(upper);
    const mid = (lower + upper) / 2;
    const fm = evalAt(mid);
    if (fa === null || fb === null || fm === null) return null;

    const initialSimp = ((upper - lower) / 6) * (fa + 4 * fm + fb);
    const res = adaptiveRecurse(lower, upper, fa, fb, fm, initialSimp, 1);
    if (res === null) return null;

    return {
      value: Number((sign * res).toFixed(8)),
      method: 'adaptive-simpson',
      subdivisions: evalCount,
      converged: true,
      errorEstimate: tolerance,
    };
  }

  // Default: Composite Simpson's 1/3 Rule
  const n = subdivisions % 2 === 0 ? subdivisions : subdivisions + 1;
  const h = (upper - lower) / n;
  const f0 = evalAt(lower);
  const fnVal = evalAt(upper);
  if (f0 === null || fnVal === null) return null;

  let sum = f0 + fnVal;
  for (let i = 1; i < n; i++) {
    const x = lower + i * h;
    const fx = evalAt(x);
    if (fx === null) return null;
    sum += (i % 2 === 1 ? 4 : 2) * fx;
  }

  const val = sign * (h / 3) * sum;
  return {
    value: Number(val.toFixed(8)),
    method: 'simpson-1/3',
    subdivisions: n,
    converged: true,
  };
}

/**
 * Calculates the area between two curves f(x) and g(x) over [a, b].
 */
export function calculateAreaBetweenCurves(
  fn1: EvaluatorFn | CompiledSafeExpression,
  fn2: EvaluatorFn | CompiledSafeExpression,
  a: number,
  b: number,
  options: IntegrationOptions = {}
): IntegrationResult | null {
  const eval1 = toEvaluator(fn1, options.scope || {});
  const eval2 = toEvaluator(fn2, options.scope || {});

  const absDiffFn: EvaluatorFn = (x: number) => {
    const y1 = eval1(x);
    const y2 = eval2(x);
    if (y1 === null || y2 === null) return null;
    return Math.abs(y1 - y2);
  };

  return integrateDefinite(absDiffFn, a, b, { ...options, method: 'simpson' });
}

export interface NewtonIterationStep {
  iter: number;
  x: number;
  fx: number;
  fPrime: number;
  nextX: number;
  error: number;
}

export interface NewtonRaphsonResult {
  root: number;
  iterations: NewtonIterationStep[];
  iterationCount: number;
  converged: boolean;
  error?: string;
}

/**
 * Newton-Raphson single root solver with full step history and convergence status.
 */
export function solveNewtonRaphson(
  fn: EvaluatorFn | CompiledSafeExpression,
  initialGuess: number,
  options: {
    scope?: CalculatorScope;
    maxIterations?: number;
    tolerance?: number;
  } = {}
): NewtonRaphsonResult {
  const { scope = {}, maxIterations = MAX_ITERATIONS, tolerance = NUMERICAL_EPSILON } = options;
  const evalAt = toEvaluator(fn, scope);
  let x = initialGuess;
  const history: NewtonIterationStep[] = [];

  for (let iter = 1; iter <= maxIterations; iter++) {
    const y = evalAt(x);
    if (y === null || !Number.isFinite(y)) {
      return {
        root: x,
        iterations: history,
        iterationCount: iter,
        converged: false,
        error: 'Function undefined at point.',
      };
    }

    const dy = calculateDerivative(evalAt, x);
    if (dy === null || Math.abs(dy) < 1e-12) {
      history.push({ iter, x, fx: y, fPrime: dy ?? 0, nextX: x, error: Math.abs(y) });
      return {
        root: x,
        iterations: history,
        iterationCount: iter,
        converged: false,
        error: 'Derivative reached 0 (tangent is horizontal).',
      };
    }

    const nextX = x - y / dy;
    const err = Math.abs(nextX - x);
    history.push({ iter, x, fx: y, fPrime: dy, nextX, error: err });

    if (err <= tolerance || Math.abs(y) <= tolerance) {
      return {
        root: Number(nextX.toFixed(8)),
        iterations: history,
        iterationCount: iter,
        converged: true,
      };
    }

    x = nextX;
  }

  return {
    root: Number(x.toFixed(8)),
    iterations: history,
    iterationCount: maxIterations,
    converged: false,
    error: 'Maximum iterations exceeded without converging.',
  };
}
