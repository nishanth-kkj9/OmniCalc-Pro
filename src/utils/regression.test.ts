import { describe, it, expect } from 'vitest';
import {
  fitModel,
  evaluateAllModels,
  DataPoint,
} from './regression';

describe('Regression Engine Extended Tests', () => {
  const linearData: DataPoint[] = [
    { x: 1, y: 3 },
    { x: 2, y: 5 },
    { x: 3, y: 7 },
    { x: 4, y: 9 },
    { x: 5, y: 11 },
  ];

  it('fits linear regression perfectly on y = 2x + 1', () => {
    const res = fitModel('linear', linearData);
    expect(res).not.toBeNull();
    expect(res!.rSquared).toBeCloseTo(1.0, 4);
    expect(res!.coefficients[1]).toBeCloseTo(2.0, 4); // slope
    expect(res!.coefficients[0]).toBeCloseTo(1.0, 4); // intercept
    expect(res!.predict(6)).toBeCloseTo(13.0, 4);
    expect(res!.mae).toBeCloseTo(0, 4);
    expect(res!.rmse).toBeCloseTo(0, 4);

    // Inverse prediction: y=13 -> x=6
    const inv = res!.inversePredict!(13);
    expect(inv.length).toBeGreaterThan(0);
    expect(inv[0]).toBeCloseTo(6, 2);
  });

  const quadraticData: DataPoint[] = [
    { x: -2, y: 4 },
    { x: -1, y: 1 },
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 4 },
  ];

  it('fits quadratic regression on y = x^2', () => {
    const res = fitModel('quadratic', quadraticData);
    expect(res).not.toBeNull();
    expect(res!.rSquared).toBeCloseTo(1.0, 4);
    expect(res!.predict(3)).toBeCloseTo(9.0, 4);
    expect(res!.predict(-3)).toBeCloseTo(9.0, 4);

    // Inverse prediction: y = 4 -> x = -2 and x = 2
    const inv = res!.inversePredict!(4);
    expect(inv.length).toBe(2);
    expect(inv.some((x) => Math.abs(x - 2) < 0.1)).toBe(true);
    expect(inv.some((x) => Math.abs(x - -2) < 0.1)).toBe(true);
  });

  const expData: DataPoint[] = [
    { x: 1, y: 2.718 },
    { x: 2, y: 7.389 },
    { x: 3, y: 20.085 },
    { x: 4, y: 54.598 },
  ];

  it('fits exponential regression', () => {
    const res = fitModel('exponential', expData);
    expect(res).not.toBeNull();
    expect(res!.rSquared).toBeGreaterThan(0.99);
  });

  it('evaluates all models and ranks them by R²', () => {
    const all = evaluateAllModels(linearData);
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].rSquared).toBeCloseTo(1.0, 4);
  });

  it('handles invalid or insufficient data gracefully', () => {
    expect(fitModel('linear', [])).toBeNull();
    expect(fitModel('linear', [{ x: 1, y: 1 }])).toBeNull();
  });
});
