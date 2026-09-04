import { describe, it, expect } from 'vitest';
import {
  oneSampleZTest,
  oneSampleTTest,
  twoSampleTTest,
  pairedTTest,
  oneSampleProportionTest,
  twoSampleProportionsTest,
  chiSquareGoodnessOfFitTest,
  chiSquareIndependenceTest,
  oneWayAnova,
  fDistributionCdf,
} from './inferenceEngine';

describe('Statistical Inference Engine', () => {
  describe('One-Sample Z-Test', () => {
    it('calculates two-tailed z-test correctly', () => {
      const res = oneSampleZTest({
        sampleMean: 105,
        sampleSize: 36,
        popStdDev: 15,
        hypothesizedMean: 100,
        alpha: 0.05,
        alternative: 'two-sided',
      });
      // SE = 15 / 6 = 2.5; z = (105-100)/2.5 = 2.0
      expect(res.testStatistic).toBeCloseTo(2.0, 4);
      expect(res.pValue).toBeCloseTo(0.0455, 3);
      expect(res.rejectNull).toBe(true);
      expect(res.confidenceInterval?.lower).toBeCloseTo(100.1, 1);
      expect(res.confidenceInterval?.upper).toBeCloseTo(109.9, 1);
    });

    it('calculates one-tailed (greater) z-test', () => {
      const res = oneSampleZTest({
        sampleMean: 105,
        sampleSize: 36,
        popStdDev: 15,
        hypothesizedMean: 100,
        alpha: 0.05,
        alternative: 'greater',
      });
      expect(res.pValue).toBeCloseTo(0.02275, 3);
      expect(res.rejectNull).toBe(true);
    });
  });

  describe('One-Sample t-Test', () => {
    it('computes t-test with student-t distribution', () => {
      const res = oneSampleTTest({
        sampleMean: 15.2,
        sampleStdDev: 2.1,
        sampleSize: 16,
        hypothesizedMean: 14.0,
        alpha: 0.05,
      });
      // SE = 2.1 / 4 = 0.525; t = 1.2 / 0.525 = 2.2857; df = 15
      expect(res.testStatistic).toBeCloseTo(2.2857, 3);
      expect(res.degreesOfFreedom).toBe(15);
      expect(res.pValue).toBeLessThan(0.05);
      expect(res.rejectNull).toBe(true);
    });
  });

  describe('Two-Sample t-Test', () => {
    it('performs Welch unequal variances t-test', () => {
      const res = twoSampleTTest({
        mean1: 25.4,
        stdDev1: 3.2,
        n1: 20,
        mean2: 22.1,
        stdDev2: 4.5,
        n2: 22,
        equalVariances: false,
      });
      expect(res.testStatistic).toBeGreaterThan(0);
      expect(res.pValue).toBeLessThan(0.05);
      expect(res.rejectNull).toBe(true);
    });

    it('performs pooled equal variances t-test', () => {
      const res = twoSampleTTest({
        mean1: 50,
        stdDev1: 5,
        n1: 10,
        mean2: 45,
        stdDev2: 5,
        n2: 10,
        equalVariances: true,
      });
      expect(res.degreesOfFreedom).toBe(18);
      expect(res.pValue).toBeLessThan(0.05);
    });
  });

  describe('Paired Differences t-Test', () => {
    it('evaluates paired differences', () => {
      const res = pairedTTest({
        meanDifference: 3.5,
        stdDevDifference: 1.2,
        sampleSize: 12,
        hypothesizedDiff: 0,
      });
      expect(res.testStatistic).toBeCloseTo(3.5 / (1.2 / Math.sqrt(12)), 2);
      expect(res.rejectNull).toBe(true);
    });
  });

  describe('Proportions Tests', () => {
    it('computes 1-sample proportion test with Wilson score CI', () => {
      const res = oneSampleProportionTest({
        successes: 60,
        trials: 100,
        hypothesizedP: 0.5,
      });
      expect(res.testStatistic).toBeCloseTo(2.0, 2);
      expect(res.confidenceInterval?.lower).toBeGreaterThan(0.49);
      expect(res.confidenceInterval?.upper).toBeLessThan(0.70);
    });

    it('computes 2-sample proportions test', () => {
      const res = twoSampleProportionsTest({
        x1: 45,
        n1: 100,
        x2: 30,
        n2: 100,
      });
      expect(res.testStatistic).toBeGreaterThan(0);
      expect(res.pValue).toBeLessThan(0.05);
    });
  });

  describe('Chi-Square Tests', () => {
    it('evaluates Goodness-of-Fit test', () => {
      // Observed dice rolls: [15, 20, 25, 10, 15, 35] (total 120, expected 20 each)
      const res = chiSquareGoodnessOfFitTest({
        observed: [15, 20, 25, 10, 15, 35],
      });
      expect(res.degreesOfFreedom).toBe(5);
      expect(res.testStatistic).toBeGreaterThan(15);
      expect(res.rejectNull).toBe(true);
    });

    it('evaluates Test of Independence on 2x2 contingency table', () => {
      const matrix = [
        [50, 20],
        [30, 40],
      ];
      const res = chiSquareIndependenceTest({ contingencyMatrix: matrix });
      expect(res.degreesOfFreedom).toBe(1);
      expect(res.pValue).toBeLessThan(0.01);
      expect(res.rejectNull).toBe(true);
    });
  });

  describe('One-Way ANOVA', () => {
    it('computes F-statistic and p-value for multiple groups', () => {
      const groups = [
        { name: 'Group A', data: [82, 85, 87, 86, 88] },
        { name: 'Group B', data: [75, 78, 77, 80, 79] },
        { name: 'Group C', data: [91, 93, 90, 92, 94] },
      ];
      const res = oneWayAnova({ groups });
      expect(res.statisticName).toBe('F');
      expect(res.testStatistic).toBeGreaterThan(10);
      expect(res.pValue).toBeLessThan(0.001);
      expect(res.rejectNull).toBe(true);
      expect(res.effectSize?.name).toBe('Eta-Squared (η²)');
    });

    it('validates F-distribution CDF behavior', () => {
      const cdfVal = fDistributionCdf(1.0, 2, 10);
      expect(cdfVal).toBeGreaterThan(0);
      expect(cdfVal).toBeLessThan(1);
    });
  });
});
