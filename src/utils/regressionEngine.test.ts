import { describe, it, expect } from 'vitest';
import {
  fitLinearRegression,
  fitPolynomialRegression,
  fitExponentialRegression,
  fitLogarithmicRegression,
  fitPowerRegression,
} from './regressionEngine';

describe('Regression & Curve Fitting Engine', () => {
  describe('Linear Regression', () => {
    it('accurately fits perfectly linear data (y = 2x + 1)', () => {
      const points = [
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 7 },
        { x: 4, y: 9 },
      ];
      const fit = fitLinearRegression(points);
      expect(fit).not.toBeNull();
      expect(fit?.rSquared).toBeCloseTo(1, 4);
      expect(fit?.coefficients[1]).toBeCloseTo(2, 4); // slope
      expect(fit?.coefficients[0]).toBeCloseTo(1, 4); // intercept
      expect(fit?.predict(5)).toBeCloseTo(11, 4);
    });

    it('computes residuals for noisy data', () => {
      const points = [
        { x: 1, y: 2.1 },
        { x: 2, y: 3.9 },
        { x: 3, y: 6.2 },
        { x: 4, y: 7.8 },
      ];
      const fit = fitLinearRegression(points);
      expect(fit).not.toBeNull();
      expect(fit?.rSquared).toBeGreaterThan(0.98);
      expect(fit?.residuals).toHaveLength(4);
    });
  });

  describe('Polynomial Regression', () => {
    it('fits quadratic curve (y = x^2 - 2x + 3)', () => {
      const points = [
        { x: -1, y: 6 },
        { x: 0, y: 3 },
        { x: 1, y: 2 },
        { x: 2, y: 3 },
        { x: 3, y: 6 },
      ];
      const fit = fitPolynomialRegression(points, 2);
      expect(fit).not.toBeNull();
      expect(fit?.rSquared).toBeCloseTo(1, 4);
      // a0 = 3, a1 = -2, a2 = 1
      expect(fit?.coefficients[0]).toBeCloseTo(3, 4);
      expect(fit?.coefficients[1]).toBeCloseTo(-2, 4);
      expect(fit?.coefficients[2]).toBeCloseTo(1, 4);
      expect(fit?.predict(4)).toBeCloseTo(11, 4); // 16 - 8 + 3 = 11
    });
  });

  describe('Exponential Regression', () => {
    it('fits exponential growth y = 3 * e^(0.5x)', () => {
      const points = [
        { x: 0, y: 3 },
        { x: 1, y: 3 * Math.exp(0.5) },
        { x: 2, y: 3 * Math.exp(1.0) },
        { x: 3, y: 3 * Math.exp(1.5) },
      ];
      const fit = fitExponentialRegression(points);
      expect(fit).not.toBeNull();
      expect(fit?.rSquared).toBeCloseTo(1, 4);
      expect(fit?.coefficients[0]).toBeCloseTo(3, 4);
      expect(fit?.coefficients[1]).toBeCloseTo(0.5, 4);
    });
  });

  describe('Power and Logarithmic Regression', () => {
    it('fits power curve y = 2 * x^3', () => {
      const points = [
        { x: 1, y: 2 },
        { x: 2, y: 16 },
        { x: 3, y: 54 },
        { x: 4, y: 128 },
      ];
      const fit = fitPowerRegression(points);
      expect(fit).not.toBeNull();
      expect(fit?.rSquared).toBeCloseTo(1, 4);
      expect(fit?.coefficients[0]).toBeCloseTo(2, 4);
      expect(fit?.coefficients[1]).toBeCloseTo(3, 4);
    });

    it('fits logarithmic curve y = 4 + 2 * ln(x)', () => {
      const points = [
        { x: 1, y: 4 },
        { x: 2, y: 4 + 2 * Math.log(2) },
        { x: 3, y: 4 + 2 * Math.log(3) },
        { x: 5, y: 4 + 2 * Math.log(5) },
      ];
      const fit = fitLogarithmicRegression(points);
      expect(fit).not.toBeNull();
      expect(fit?.rSquared).toBeCloseTo(1, 4);
      expect(fit?.coefficients[0]).toBeCloseTo(4, 4);
      expect(fit?.coefficients[1]).toBeCloseTo(2, 4);
    });
  });
});
