/**
 * Advanced Regression & Curve Fitting Engine for OmniCalc Pro.
 * Provides Linear, Quadratic, Cubic, Polynomial, Exponential, Logarithmic, and Power regressions
 * with complete ANOVA metrics, residuals, prediction, inverse prediction, and model evaluation.
 */

import {
  DataPoint,
  ResidualPoint,
  RegressionResult,
  fitLinearRegression,
  fitPolynomialRegression,
  fitExponentialRegression,
  fitLogarithmicRegression,
  fitPowerRegression,
} from './regressionEngine';
import { findRoots } from './numericalAnalysis';

export type { DataPoint, ResidualPoint, RegressionResult };
export {
  fitLinearRegression,
  fitPolynomialRegression,
  fitExponentialRegression,
  fitLogarithmicRegression,
  fitPowerRegression,
};

export type RegressionModelType =
  | 'linear'
  | 'quadratic'
  | 'cubic'
  | 'polynomial'
  | 'exponential'
  | 'logarithmic'
  | 'power';

export type RegressionType = RegressionModelType;

export interface ExtendedRegressionResult extends RegressionResult {
  modelType: RegressionModelType;
  adjustedRSquared: number;
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
  fStatistic?: number;
  pValEstimate?: number;
  inversePredict?: (y: number, xMin?: number, xMax?: number) => number[];
}

export type RegressionModelResult = ExtendedRegressionResult;

/**
 * Fits a specific regression model with extended ANOVA metrics.
 */
export function fitModel(
  type: RegressionModelType,
  points: DataPoint[],
  degree: number = 2
): ExtendedRegressionResult | null {
  if (!points || points.length < 2) return null;

  // Filter invalid or non-finite points
  const validPoints = points.filter(
    (p) =>
      typeof p.x === 'number' &&
      typeof p.y === 'number' &&
      isFinite(p.x) &&
      isFinite(p.y) &&
      !isNaN(p.x) &&
      !isNaN(p.y)
  );

  let baseResult: RegressionResult | null = null;

  switch (type) {
    case 'linear':
      baseResult = fitLinearRegression(validPoints);
      break;
    case 'quadratic':
      baseResult = fitPolynomialRegression(validPoints, 2);
      break;
    case 'cubic':
      baseResult = fitPolynomialRegression(validPoints, 3);
      break;
    case 'polynomial':
      baseResult = fitPolynomialRegression(validPoints, Math.max(1, Math.min(6, degree)));
      break;
    case 'exponential':
      baseResult = fitExponentialRegression(validPoints);
      break;
    case 'logarithmic':
      baseResult = fitLogarithmicRegression(validPoints);
      break;
    case 'power':
      baseResult = fitPowerRegression(validPoints);
      break;
  }

  if (!baseResult) return null;

  const n = validPoints.length;
  const p = baseResult.coefficients.length - 1; // number of predictors

  // Compute MAE and RMSE
  let sumAbsRes = 0;
  let sumSqRes = 0;
  for (const res of baseResult.residuals) {
    sumAbsRes += Math.abs(res.residual);
    sumSqRes += res.residual * res.residual;
  }

  const mae = sumAbsRes / n;
  const rmse = Math.sqrt(sumSqRes / n);

  // Adjusted R²: 1 - [(1 - R²)(n - 1) / (n - p - 1)]
  let adjustedRSquared = baseResult.rSquared;
  if (n > p + 1) {
    adjustedRSquared = 1 - ((1 - baseResult.rSquared) * (n - 1)) / (n - p - 1);
  }

  // F-statistic: [R² / p] / [(1 - R²) / (n - p - 1)]
  let fStatistic: number | undefined = undefined;
  if (p > 0 && n > p + 1 && baseResult.rSquared < 1) {
    fStatistic =
      (baseResult.rSquared / p) / ((1 - baseResult.rSquared) / (n - p - 1));
  }

  // Inverse prediction using numerical root finding
  const xs = validPoints.map((pt) => pt.x);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const span = Math.abs(xMax - xMin);
  const margin = Math.max(10, span * 2);

  const inversePredict = (targetY: number, customMin?: number, customMax?: number): number[] => {
    const searchMin = customMin ?? xMin - margin;
    const searchMax = customMax ?? xMax + margin;

    // Objective: predict(x) - targetY = 0
    const objFunc = (x: number) => baseResult!.predict(x) - targetY;
    return findRoots(objFunc, { min: searchMin, max: searchMax }, { samples: 100, tolerance: 1e-5 });
  };

  return {
    ...baseResult,
    modelType: type,
    adjustedRSquared: Math.max(0, Math.min(1, adjustedRSquared)),
    rmse,
    mae,
    fStatistic: fStatistic && isFinite(fStatistic) ? fStatistic : undefined,
    inversePredict,
  };
}

/**
 * Automatically evaluates all available regression models and returns them sorted by R² descending.
 */
export function evaluateAllModels(
  points: DataPoint[]
): ExtendedRegressionResult[] {
  const types: RegressionModelType[] = [
    'linear',
    'quadratic',
    'cubic',
    'exponential',
    'logarithmic',
    'power',
  ];

  const results: ExtendedRegressionResult[] = [];
  for (const t of types) {
    const res = fitModel(t, points);
    if (res) results.push(res);
  }

  results.sort((a, b) => b.rSquared - a.rSquared);
  return results;
}
