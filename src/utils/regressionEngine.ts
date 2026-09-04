/**
 * Regression & Curve Fitting Engine for OmniCalc Pro.
 * Computes Ordinary Least Squares (OLS) Linear, Polynomial (Quadratic & Cubic),
 * Exponential, Power, and Logarithmic regressions with complete ANOVA metrics (R², RSS, TSS, residuals).
 */

import { invertMatrix, multiplyMatrices, Matrix } from './matrix';

export interface DataPoint {
  x: number;
  y: number;
}

export interface ResidualPoint {
  x: number;
  yObserved: number;
  yPredicted: number;
  residual: number;
}

export interface RegressionResult {
  type: 'linear' | 'polynomial' | 'exponential' | 'power' | 'logarithmic';
  equation: string;
  r: number; // Pearson correlation coefficient
  rSquared: number; // Coefficient of determination
  coefficients: number[];
  predict: (x: number) => number;
  residuals: ResidualPoint[];
  standardError: number;
  degree?: number;
}

/**
 * Computes Linear Regression: y = mx + b.
 */
export function fitLinearRegression(points: DataPoint[]): RegressionResult | null {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return null; // Vertical line

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // Correlation r and R²
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;

  const residuals: ResidualPoint[] = [];
  for (const p of points) {
    const yPred = slope * p.x + intercept;
    const res = p.y - yPred;
    ssTot += (p.y - meanY) * (p.y - meanY);
    ssRes += res * res;
    residuals.push({
      x: p.x,
      yObserved: p.y,
      yPredicted: yPred,
      residual: res,
    });
  }

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;
  const r = (slope >= 0 ? 1 : -1) * Math.sqrt(rSquared);
  const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;

  const sign = intercept >= 0 ? '+' : '-';
  const eq = `y = ${slope.toFixed(4)}x ${sign} ${Math.abs(intercept).toFixed(4)}`;

  return {
    type: 'linear',
    equation: eq,
    r,
    rSquared,
    coefficients: [intercept, slope],
    predict: (x: number) => slope * x + intercept,
    residuals,
    standardError,
  };
}

/**
 * Computes Polynomial Regression of specified degree (e.g. 2 for quadratic, 3 for cubic)
 * using the OLS normal equation: (X^T X) * Beta = X^T Y.
 */
export function fitPolynomialRegression(points: DataPoint[], degree: number = 2): RegressionResult | null {
  const n = points.length;
  const numCoeffs = degree + 1;
  if (n < numCoeffs || degree < 1) return null;

  // Build design matrix X: n x numCoeffs where X[i][j] = x_i^j
  const X: Matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: numCoeffs }, (_, j) => Math.pow(points[i].x, j))
  );

  // Y vector: n x 1
  const Y: Matrix = points.map((p) => [p.y]);

  // Compute X^T
  const XT: Matrix = Array.from({ length: numCoeffs }, (_, j) =>
    Array.from({ length: n }, (_, i) => X[i][j])
  );

  // Normal equations: (X^T * X) * Beta = X^T * Y
  const XTX = multiplyMatrices(XT, X);
  const XTY = multiplyMatrices(XT, Y);
  if (!XTX || !XTY) return null;

  const invXTX = invertMatrix(XTX);
  if (!invXTX) return null;

  const betaMatrix = multiplyMatrices(invXTX, XTY);
  if (!betaMatrix) return null;

  const coeffs = betaMatrix.map((row) => row[0]); // [a0, a1, a2, ...]

  const predict = (x: number) => {
    let y = 0;
    for (let j = 0; j <= degree; j++) {
      y += coeffs[j] * Math.pow(x, j);
    }
    return y;
  };

  // Residuals & R²
  const meanY = points.reduce((acc, p) => acc + p.y, 0) / n;
  let ssTot = 0;
  let ssRes = 0;
  const residuals: ResidualPoint[] = [];

  for (const p of points) {
    const yPred = predict(p.x);
    const res = p.y - yPred;
    ssTot += Math.pow(p.y - meanY, 2);
    ssRes += Math.pow(res, 2);
    residuals.push({
      x: p.x,
      yObserved: p.y,
      yPredicted: yPred,
      residual: res,
    });
  }

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;
  const standardError = n > numCoeffs ? Math.sqrt(ssRes / (n - numCoeffs)) : 0;

  // Build equation string: y = a_n x^n + ... + a1 x + a0
  const terms: string[] = [];
  for (let j = degree; j >= 0; j--) {
    const c = coeffs[j];
    if (Math.abs(c) < 1e-8 && terms.length > 0) continue;
    if (j === 0) {
      terms.push(`${c >= 0 && terms.length > 0 ? '+ ' : ''}${c.toFixed(4)}`);
    } else if (j === 1) {
      terms.push(`${c >= 0 && terms.length > 0 ? '+ ' : ''}${c.toFixed(4)}x`);
    } else {
      terms.push(`${c >= 0 && terms.length > 0 ? '+ ' : ''}${c.toFixed(4)}x^${j}`);
    }
  }

  return {
    type: 'polynomial',
    degree,
    equation: `y = ${terms.join(' ')}`,
    r: Math.sqrt(rSquared),
    rSquared,
    coefficients: coeffs,
    predict,
    residuals,
    standardError,
  };
}

/**
 * Fits Exponential Regression: y = a * e^(bx)
 * By transforming to ln(y) = ln(a) + bx. Requires all y > 0.
 */
export function fitExponentialRegression(points: DataPoint[]): RegressionResult | null {
  if (points.length < 2 || points.some((p) => p.y <= 0)) return null;

  const transformed: DataPoint[] = points.map((p) => ({ x: p.x, y: Math.log(p.y) }));
  const lin = fitLinearRegression(transformed);
  if (!lin) return null;

  const b = lin.coefficients[1];
  const a = Math.exp(lin.coefficients[0]);

  const predict = (x: number) => a * Math.exp(b * x);

  const meanY = points.reduce((acc, p) => acc + p.y, 0) / points.length;
  let ssTot = 0;
  let ssRes = 0;
  const residuals: ResidualPoint[] = [];

  for (const p of points) {
    const yPred = predict(p.x);
    const res = p.y - yPred;
    ssTot += Math.pow(p.y - meanY, 2);
    ssRes += Math.pow(res, 2);
    residuals.push({ x: p.x, yObserved: p.y, yPredicted: yPred, residual: res });
  }

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

  return {
    type: 'exponential',
    equation: `y = ${a.toFixed(4)} · e^(${b.toFixed(4)}x)`,
    r: Math.sqrt(rSquared),
    rSquared,
    coefficients: [a, b],
    predict,
    residuals,
    standardError: Math.sqrt(ssRes / (points.length - 2)),
  };
}

/**
 * Fits Logarithmic Regression: y = a + b * ln(x)
 * Requires all x > 0.
 */
export function fitLogarithmicRegression(points: DataPoint[]): RegressionResult | null {
  if (points.length < 2 || points.some((p) => p.x <= 0)) return null;

  const transformed: DataPoint[] = points.map((p) => ({ x: Math.log(p.x), y: p.y }));
  const lin = fitLinearRegression(transformed);
  if (!lin) return null;

  const a = lin.coefficients[0];
  const b = lin.coefficients[1];

  const predict = (x: number) => (x > 0 ? a + b * Math.log(x) : NaN);

  const sign = b >= 0 ? '+' : '-';
  return {
    type: 'logarithmic',
    equation: `y = ${a.toFixed(4)} ${sign} ${Math.abs(b).toFixed(4)} · ln(x)`,
    r: lin.r,
    rSquared: lin.rSquared,
    coefficients: [a, b],
    predict,
    residuals: lin.residuals.map((r, i) => ({
      x: points[i].x,
      yObserved: points[i].y,
      yPredicted: r.yPredicted,
      residual: r.residual,
    })),
    standardError: lin.standardError,
  };
}

/**
 * Fits Power Regression: y = a * x^b
 * Requires all x > 0 and y > 0.
 */
export function fitPowerRegression(points: DataPoint[]): RegressionResult | null {
  if (points.length < 2 || points.some((p) => p.x <= 0 || p.y <= 0)) return null;

  const transformed: DataPoint[] = points.map((p) => ({
    x: Math.log(p.x),
    y: Math.log(p.y),
  }));
  const lin = fitLinearRegression(transformed);
  if (!lin) return null;

  const a = Math.exp(lin.coefficients[0]);
  const b = lin.coefficients[1];

  const predict = (x: number) => (x > 0 ? a * Math.pow(x, b) : NaN);

  const meanY = points.reduce((acc, p) => acc + p.y, 0) / points.length;
  let ssTot = 0;
  let ssRes = 0;
  const residuals: ResidualPoint[] = [];

  for (const p of points) {
    const yPred = predict(p.x);
    const res = p.y - yPred;
    ssTot += Math.pow(p.y - meanY, 2);
    ssRes += Math.pow(res, 2);
    residuals.push({ x: p.x, yObserved: p.y, yPredicted: yPred, residual: res });
  }

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

  return {
    type: 'power',
    equation: `y = ${a.toFixed(4)} · x^(${b.toFixed(4)})`,
    r: Math.sqrt(rSquared),
    rSquared,
    coefficients: [a, b],
    predict,
    residuals,
    standardError: Math.sqrt(ssRes / (points.length - 2)),
  };
}
