import { describe, it, expect } from 'vitest';
import {
  computeDescriptiveStats,
  normalPdf,
  normalCdf,
  normalInvCdf,
  binomialPmf,
  poissonPmf,
} from './statisticsEngine';

describe('Statistics & Probability Engine', () => {
  describe('Descriptive Statistics', () => {
    it('computes basic metrics correctly (mean, median, sum, count)', () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      const stats = computeDescriptiveStats(data);
      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(8);
      expect(stats?.sum).toBe(40);
      expect(stats?.mean).toBe(5);
      expect(stats?.median).toBe(4.5);
      expect(stats?.modes).toEqual([4]);
      expect(stats?.min).toBe(2);
      expect(stats?.max).toBe(9);
      expect(stats?.range).toBe(7);
    });

    it('computes sample variance, population variance, and standard deviation', () => {
      const data = [10, 12, 23, 23, 16, 23, 21, 16];
      const stats = computeDescriptiveStats(data);
      expect(stats).not.toBeNull();
      expect(stats?.mean).toBe(18);
      // Sample variance: ss = 64+36+25+25+4+25+9+4 = 192. s^2 = 192 / 7 ≈ 27.4286
      expect(stats?.sampleVariance).toBeCloseTo(192 / 7, 3);
      expect(stats?.sampleStdDev).toBeCloseTo(Math.sqrt(192 / 7), 3);
      expect(stats?.popVariance).toBeCloseTo(192 / 8, 3);
    });

    it('computes geometric and harmonic means for positive numbers', () => {
      const data = [2, 8];
      const stats = computeDescriptiveStats(data);
      expect(stats?.geometricMean).toBeCloseTo(4, 4); // sqrt(16) = 4
      expect(stats?.harmonicMean).toBeCloseTo(3.2, 4); // 2 / (1/2 + 1/8) = 2 / 0.625 = 3.2
    });

    it('detects outliers via Tukey IQR fences', () => {
      // 100 is an extreme outlier
      const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 100];
      const stats = computeDescriptiveStats(data);
      expect(stats).not.toBeNull();
      expect(stats!.outliers.mild.length + stats!.outliers.extreme.length).toBeGreaterThan(0);
      expect(stats!.outliers.extreme).toContain(100);
    });
  });

  describe('Probability Distributions', () => {
    it('evaluates standard Normal PDF and CDF', () => {
      // Normal PDF at peak (z = 0) is 1 / sqrt(2*pi) ≈ 0.3989
      expect(normalPdf(0)).toBeCloseTo(0.3989, 3);
      // Normal CDF at mean is 0.5
      expect(normalCdf(0)).toBeCloseTo(0.5, 4);
      // P(Z <= 1.96) ≈ 0.975
      expect(normalCdf(1.96)).toBeCloseTo(0.975, 2);
    });

    it('computes inverse Normal CDF (probit)', () => {
      const z975 = normalInvCdf(0.975);
      expect(z975).not.toBeNull();
      expect(z975!).toBeCloseTo(1.96, 2);

      const z50 = normalInvCdf(0.5);
      expect(z50).not.toBeNull();
      expect(z50!).toBeCloseTo(0, 4);
    });

    it('evaluates Binomial PMF', () => {
      // 10 flips of a fair coin (p = 0.5), P(k = 5) = C(10, 5) * 0.5^10 = 252 / 1024 ≈ 0.2461
      expect(binomialPmf(10, 5, 0.5)).toBeCloseTo(0.2461, 3);
    });

    it('evaluates Poisson PMF', () => {
      // λ = 3, P(X = 2) = 3^2 * e^-3 / 2! = 9 / (2 * 20.0855) ≈ 0.2240
      expect(poissonPmf(3, 2)).toBeCloseTo(0.224, 3);
    });
  });
});
