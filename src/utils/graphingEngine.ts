import { CalculatorScope, CompiledSafeExpression } from './calculator';

export interface PresetFunction {
  id: string;
  name: string;
  category: 'Trigonometry' | 'Polynomials' | 'Calculus' | 'Waves & Physics' | 'Special';
  expr: string;
  description: string;
  suggestedBounds?: { xMin: number; xMax: number; yMin: number; yMax: number };
}

export const GRAPHING_PRESETS: PresetFunction[] = [
  {
    id: 'sine_wave',
    name: 'Sine Wave',
    category: 'Trigonometry',
    expr: 'sin(x)',
    description: 'Fundamental periodic wave with period 2π',
    suggestedBounds: { xMin: -6.28, xMax: 6.28, yMin: -2, yMax: 2 },
  },
  {
    id: 'cosine_wave',
    name: 'Cosine Wave',
    category: 'Trigonometry',
    expr: 'cos(x)',
    description: 'Phase-shifted harmonic wave with period 2π',
    suggestedBounds: { xMin: -6.28, xMax: 6.28, yMin: -2, yMax: 2 },
  },
  {
    id: 'damped_sine',
    name: 'Damped Oscillation',
    category: 'Waves & Physics',
    expr: 'exp(-0.2 * x) * sin(3 * x)',
    description: 'Exponential decay of harmonic oscillation',
    suggestedBounds: { xMin: 0, xMax: 15, yMin: -1.5, yMax: 1.5 },
  },
  {
    id: 'gaussian',
    name: 'Gaussian Bell Curve',
    category: 'Special',
    expr: 'exp(-x^2)',
    description: 'Normal distribution probability density bell curve',
    suggestedBounds: { xMin: -4, xMax: 4, yMin: -0.5, yMax: 1.5 },
  },
  {
    id: 'cubic_polynomial',
    name: 'Cubic Polynomial',
    category: 'Polynomials',
    expr: 'x^3 - 3 * x',
    description: 'Cubic with distinct local maximum, minimum, and three roots',
    suggestedBounds: { xMin: -3, xMax: 3, yMin: -4, yMax: 4 },
  },
  {
    id: 'parabola',
    name: 'Standard Parabola',
    category: 'Polynomials',
    expr: 'x^2 - 4',
    description: 'Quadratic parabola with roots at x = -2 and x = 2',
    suggestedBounds: { xMin: -5, xMax: 5, yMin: -6, yMax: 10 },
  },
  {
    id: 'sigmoid',
    name: 'Logistic / Sigmoid',
    category: 'Special',
    expr: '1 / (1 + exp(-x))',
    description: 'S-shaped activation function widely used in machine learning',
    suggestedBounds: { xMin: -6, xMax: 6, yMin: -0.5, yMax: 1.5 },
  },
  {
    id: 'rational_witch',
    name: 'Witch of Agnesi',
    category: 'Calculus',
    expr: '1 / (x^2 + 1)',
    description: 'Smooth bell-like rational curve with horizontal asymptote y = 0',
    suggestedBounds: { xMin: -5, xMax: 5, yMin: -0.5, yMax: 1.5 },
  },
  {
    id: 'wave_interference',
    name: 'Beat / Wave Interference',
    category: 'Waves & Physics',
    expr: 'sin(x) + sin(1.2 * x)',
    description: 'Superposition of two close frequencies producing acoustic beats',
    suggestedBounds: { xMin: -30, xMax: 30, yMin: -2.5, yMax: 2.5 },
  },
  {
    id: 'parameter_demo',
    name: 'Dynamic Parameter Wave',
    category: 'Calculus',
    expr: 'k * sin(x)',
    description: 'Demonstrates real-time amplitude modulation using slider parameter k',
    suggestedBounds: { xMin: -10, xMax: 10, yMin: -5, yMax: 5 },
  },
];

export interface CriticalPoint {
  id: string;
  type: 'root' | 'y-intercept' | 'min' | 'max' | 'intersection';
  x: number;
  y: number;
  label: string;
  fnIndex?: number;
}

/**
 * Finds numerical roots (zeros) of a compiled function f(x) = 0 within [xMin, xMax].
 */
export function findRoots(
  compiled: CompiledSafeExpression,
  xMin: number,
  xMax: number,
  samples: number = 200,
  scope: CalculatorScope = {}
): number[] {
  if (xMin >= xMax || samples <= 2) return [];
  const roots: number[] = [];
  const dx = (xMax - xMin) / samples;
  let prevX = xMin;
  let prevY = compiled.evaluate({ ...scope, x: prevX });

  for (let i = 1; i <= samples; i++) {
    const curX = xMin + i * dx;
    const curY = compiled.evaluate({ ...scope, x: curX });

    if (prevY !== null && curY !== null && isFinite(prevY) && isFinite(curY)) {
      // Direct hit
      if (Math.abs(curY) < 1e-10) {
        roots.push(Number(curX.toFixed(5)));
      }
      // Sign change indicates a root in (prevX, curX)
      else if (prevY * curY < 0 && Math.abs(curY - prevY) < 1e4) {
        // Bisection refinement
        let a = prevX;
        let b = curX;
        let root = (a + b) / 2;
        for (let iter = 0; iter < 24; iter++) {
          root = (a + b) / 2;
          const yMid = compiled.evaluate({ ...scope, x: root });
          if (yMid === null || !isFinite(yMid) || Math.abs(yMid) < 1e-10) break;
          const yA = compiled.evaluate({ ...scope, x: a });
          if (yA !== null && yA * yMid < 0) {
            b = root;
          } else {
            a = root;
          }
        }
        const rounded = Number(root.toFixed(5));
        // Avoid duplicate roots that are very close
        if (!roots.some((r) => Math.abs(r - rounded) < 1e-3)) {
          roots.push(rounded);
        }
      }
    }

    prevX = curX;
    prevY = curY;
  }

  return roots;
}

/**
 * Finds local extrema (local minima & maxima) within [xMin, xMax].
 */
export function findExtrema(
  compiled: CompiledSafeExpression,
  xMin: number,
  xMax: number,
  samples: number = 200,
  scope: CalculatorScope = {}
): { x: number; y: number; type: 'min' | 'max' }[] {
  if (xMin >= xMax || samples <= 3) return [];
  const extrema: { x: number; y: number; type: 'min' | 'max' }[] = [];
  const dx = (xMax - xMin) / samples;
  const h = 1e-5;

  const evalDeriv = (xVal: number) => {
    const yPlus = compiled.evaluate({ ...scope, x: xVal + h });
    const yMinus = compiled.evaluate({ ...scope, x: xVal - h });
    if (yPlus === null || yMinus === null || !isFinite(yPlus) || !isFinite(yMinus)) return null;
    return (yPlus - yMinus) / (2 * h);
  };

  let prevX = xMin;
  let prevD = evalDeriv(prevX);

  for (let i = 1; i <= samples; i++) {
    const curX = xMin + i * dx;
    const curD = evalDeriv(curX);

    if (prevD !== null && curD !== null && isFinite(prevD) && isFinite(curD)) {
      if (prevD * curD < 0 && Math.abs(curD - prevD) < 1e4) {
        // Bisection to find zero of derivative
        let a = prevX;
        let b = curX;
        let mid = (a + b) / 2;
        for (let iter = 0; iter < 20; iter++) {
          mid = (a + b) / 2;
          const dMid = evalDeriv(mid);
          if (dMid === null || Math.abs(dMid) < 1e-7) break;
          const dA = evalDeriv(a);
          if (dA !== null && dA * dMid < 0) {
            b = mid;
          } else {
            a = mid;
          }
        }
        const yVal = compiled.evaluate({ ...scope, x: mid });
        if (yVal !== null && isFinite(yVal)) {
          const type: 'min' | 'max' = prevD < 0 ? 'min' : 'max';
          const roundedX = Number(mid.toFixed(4));
          const roundedY = Number(yVal.toFixed(4));
          if (!extrema.some((e) => Math.abs(e.x - roundedX) < 1e-3)) {
            extrema.push({ x: roundedX, y: roundedY, type });
          }
        }
      }
    }
    prevX = curX;
    prevD = curD;
  }

  return extrema;
}

/**
 * Finds intersections between two compiled functions f1(x) and f2(x) within [xMin, xMax].
 */
export function findIntersections(
  f1: CompiledSafeExpression,
  f2: CompiledSafeExpression,
  xMin: number,
  xMax: number,
  samples: number = 200,
  scope: CalculatorScope = {}
): { x: number; y: number }[] {
  const diffCompiled: CompiledSafeExpression = {
    evaluate: (s?: CalculatorScope) => {
      const y1 = f1.evaluate(s);
      const y2 = f2.evaluate(s);
      if (y1 === null || y2 === null) return null;
      return y1 - y2;
    },
  };

  const roots = findRoots(diffCompiled, xMin, xMax, samples, scope);
  return roots
    .map((rx) => {
      const yVal = f1.evaluate({ ...scope, x: rx });
      return yVal !== null && isFinite(yVal) ? { x: rx, y: Number(yVal.toFixed(4)) } : null;
    })
    .filter((pt): pt is { x: number; y: number } => pt !== null);
}

export interface TangentLineResult {
  x0: number;
  y0: number;
  slope: number;
  intercept: number;
  equation: string;
}

/**
 * Calculates tangent line for f(x) at x = x0.
 */
export function computeTangentLine(
  compiled: CompiledSafeExpression,
  x0: number,
  scope: CalculatorScope = {}
): TangentLineResult | null {
  const y0 = compiled.evaluate({ ...scope, x: x0 });
  if (y0 === null || !isFinite(y0)) return null;

  const h = 1e-5;
  const yPlus = compiled.evaluate({ ...scope, x: x0 + h });
  const yMinus = compiled.evaluate({ ...scope, x: x0 - h });
  if (yPlus === null || yMinus === null || !isFinite(yPlus) || !isFinite(yMinus)) return null;

  const slope = (yPlus - yMinus) / (2 * h);
  if (!isFinite(slope)) return null;

  const intercept = y0 - slope * x0;
  const slopeFormatted = Number(slope.toFixed(4));
  const interceptFormatted = Number(intercept.toFixed(4));

  const sign = interceptFormatted >= 0 ? '+' : '-';
  const absIntercept = Math.abs(interceptFormatted);
  const equation = `y = ${slopeFormatted}x ${sign} ${absIntercept}`;

  return {
    x0: Number(x0.toFixed(4)),
    y0: Number(y0.toFixed(4)),
    slope: slopeFormatted,
    intercept: interceptFormatted,
    equation,
  };
}

export interface DefiniteIntegralResult {
  a: number;
  b: number;
  value: number;
  steps: number;
}

/**
 * Approximates definite integral of f(x) from a to b using composite Simpson's rule.
 */
export function computeDefiniteIntegral(
  compiled: CompiledSafeExpression,
  a: number,
  b: number,
  n: number = 100,
  scope: CalculatorScope = {}
): DefiniteIntegralResult | null {
  if (a === b) return { a, b, value: 0, steps: 0 };
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);
  const sign = b >= a ? 1 : -1;

  // Simpson's rule requires even number of sub-intervals
  const intervals = n % 2 === 0 ? n : n + 1;
  const h = (upper - lower) / intervals;

  const y0 = compiled.evaluate({ ...scope, x: lower });
  const yn = compiled.evaluate({ ...scope, x: upper });
  if (y0 === null || yn === null || !isFinite(y0) || !isFinite(yn)) return null;

  let sum = y0 + yn;

  for (let i = 1; i < intervals; i++) {
    const x = lower + i * h;
    const y = compiled.evaluate({ ...scope, x });
    if (y === null || !isFinite(y)) return null;
    sum += (i % 2 === 0 ? 2 : 4) * y;
  }

  const integral = (h / 3) * sum * sign;
  return {
    a: Number(a.toFixed(4)),
    b: Number(b.toFixed(4)),
    value: Number(integral.toFixed(5)),
    steps: intervals,
  };
}
