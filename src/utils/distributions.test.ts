import { describe, it, expect } from 'vitest';
import {
  NormalDist,
  BinomialDist,
  PoissonDist,
  UniformDist,
  ExponentialDist,
  calculateRangeProbability,
  erf,
  factorial,
} from './distributions';

describe('Distributions Engine Tests', () => {
  it('computes factorial accurately', () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(5)).toBe(120);
    expect(factorial(10)).toBe(3628800);
  });

  it('computes error function erf(0) and erf(1)', () => {
    expect(erf(0)).toBeCloseTo(0, 5);
    expect(erf(1)).toBeCloseTo(0.8427, 3);
  });

  it('verifies Normal standard distribution CDF, PDF, and Inverse CDF', () => {
    const params = { mu: 0, sigma: 1 };
    // PDF at 0: 1/sqrt(2pi) ~ 0.39894
    expect(NormalDist.pdfOrPmf(0, params)).toBeCloseTo(0.39894, 4);

    // CDF at 0 is 0.5
    expect(NormalDist.cdf(0, params)).toBeCloseTo(0.5, 4);

    // CDF at 1.96 ~ 0.975 (2.5% tail)
    expect(NormalDist.cdf(1.96, params)).toBeCloseTo(0.975, 2);

    // Inverse CDF at 0.5 is 0
    expect(NormalDist.inverseCdf(0.5, params)).toBeCloseTo(0, 4);

    // Empirical 68-95-99.7 rule
    const p1Sigma = calculateRangeProbability(NormalDist, params, -1, 1);
    expect(p1Sigma).toBeCloseTo(0.6827, 2);

    const p2Sigma = calculateRangeProbability(NormalDist, params, -2, 2);
    expect(p2Sigma).toBeCloseTo(0.9545, 2);
  });

  it('verifies Binomial distribution (n=10, p=0.5)', () => {
    const params = { n: 10, p: 0.5 };
    // P(X = 5) = 252 / 1024 ~ 0.24609
    expect(BinomialDist.pdfOrPmf(5, params)).toBeCloseTo(0.24609, 4);

    // CDF at 5: sum(k=0..5) = 0.5 + 0.24609/2 = 0.62305
    expect(BinomialDist.cdf(5, params)).toBeCloseTo(0.623, 2);

    // Moments
    const m = BinomialDist.moments(params);
    expect(m.mean).toBe(5);
    expect(m.variance).toBe(2.5);
  });

  it('verifies Poisson distribution (lambda=4)', () => {
    const params = { lambda: 4 };
    // P(X = 0) = e^-4 ~ 0.0183
    expect(PoissonDist.pdfOrPmf(0, params)).toBeCloseTo(Math.exp(-4), 4);

    const m = PoissonDist.moments(params);
    expect(m.mean).toBe(4);
    expect(m.variance).toBe(4);
  });

  it('verifies Uniform distribution [0, 10]', () => {
    const params = { a: 0, b: 10 };
    expect(UniformDist.pdfOrPmf(5, params)).toBeCloseTo(0.1, 4);
    expect(UniformDist.cdf(5, params)).toBeCloseTo(0.5, 4);
    expect(UniformDist.inverseCdf(0.8, params)).toBeCloseTo(8, 4);
  });

  it('verifies Exponential distribution (lambda=2)', () => {
    const params = { lambda: 2 };
    // CDF(x) = 1 - e^(-2x)
    expect(ExponentialDist.cdf(1, params)).toBeCloseTo(1 - Math.exp(-2), 4);
    expect(ExponentialDist.inverseCdf(1 - Math.exp(-2), params)).toBeCloseTo(1, 4);
  });
});
