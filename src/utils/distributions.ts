/**
 * Comprehensive Probability & Statistical Distributions Engine for OmniCalc Pro.
 * Provides analytical & numerical implementations of PMF, PDF, CDF, Inverse CDF (Quantile),
 * moments (mean, variance, skewness, kurtosis), and probability interval evaluation.
 *
 * Supported Distributions:
 * - Bernoulli, Binomial, Geometric, Poisson (Discrete)
 * - Uniform, Normal, Exponential, Student t, Chi-Square (Continuous)
 */

import { brentRoot } from './numericalAnalysis';

// Helper: Factorial
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= Math.min(n, 170); i++) {
    res *= i;
  }
  return res;
}

// Helper: Log-Gamma function ln(Γ(x)) using Lanczos approximation (Lanczos 7-term)
export function logGamma(x: number): number {
  if (x <= 0) return NaN;
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.138571095856205,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  const g = 7;
  if (x < 0.5) {
    // Reflection formula: Γ(1-z)Γ(z) = π / sin(πz)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = p[0];
  const t = x + g + 0.5;
  for (let i = 1; i < p.length; i++) {
    a += p[i] / (x + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

export function gamma(x: number): number {
  return Math.exp(logGamma(x));
}

// Helper: Regularized Incomplete Beta function I_x(a, b) via continued fraction
export function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(x, a, b)) / a;
  } else {
    return 1 - (bt * betaContinuedFraction(1 - x, b, a)) / b;
  }
}

function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIterations = 100;
  const epsilon = 3e-7;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < epsilon) break;
  }
  return h;
}

// Helper: Regularized Lower Incomplete Gamma function P(s, x) = γ(s,x)/Γ(s)
export function lowerIncompleteGamma(s: number, x: number): number {
  if (x <= 0) return 0;
  if (s <= 0) return NaN;

  if (x < s + 1) {
    // Series representation
    let sum = 1 / s;
    let term = 1 / s;
    for (let n = 1; n < 100; n++) {
      term *= x / (s + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-12) break;
    }
    return sum * Math.exp(-x + s * Math.log(x) - logGamma(s));
  } else {
    // Continued fraction representation: 1 - Q(s, x)
    return 1 - upperIncompleteGammaContinuedFraction(s, x);
  }
}

function upperIncompleteGammaContinuedFraction(s: number, x: number): number {
  const maxIterations = 100;
  let b = x + 1 - s;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i <= maxIterations; i++) {
    const a = -i * (i - s);
    b += 2;
    d = a * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + a / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-10) break;
  }
  return Math.exp(-x + s * Math.log(x) - logGamma(s)) * h;
}

// Helper: Error function erf(x) & erfc(x)
export function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

export function erfc(x: number): number {
  return 1 - erf(x);
}

// Inverse Error Function erf^-1(x) using rational approximation
export function erfInverse(x: number): number {
  if (x <= -1) return -Infinity;
  if (x >= 1) return Infinity;
  if (x === 0) return 0;

  const a = 0.147;
  const ln1MinusX2 = Math.log(1 - x * x);
  const term1 = 2 / (Math.PI * a) + ln1MinusX2 / 2;
  const innerSqrt = term1 * term1 - ln1MinusX2 / a;
  const sign = x < 0 ? -1 : 1;
  return sign * Math.sqrt(Math.sqrt(innerSqrt) - term1);
}

// Combinations nCr
export function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  r = Math.min(r, n - r);
  let c = 1;
  for (let i = 1; i <= r; i++) {
    c = (c * (n - (r - i))) / i;
  }
  return c;
}

export type DistributionType =
  | 'bernoulli'
  | 'binomial'
  | 'geometric'
  | 'poisson'
  | 'uniform'
  | 'normal'
  | 'exponential'
  | 'student_t'
  | 'chi_square';

export interface DistributionParams {
  p?: number; // probability of success (0 to 1)
  n?: number; // number of trials (int >= 1)
  lambda?: number; // rate param (> 0)
  a?: number; // uniform lower bound
  b?: number; // uniform upper bound
  mu?: number; // normal mean
  sigma?: number; // normal std dev (> 0)
  df?: number; // degrees of freedom (> 0)
}

export interface DistributionMoments {
  mean: number;
  variance: number;
  stdDev: number;
  skewness?: number;
  kurtosis?: number;
}

export interface DistributionDefinition {
  type: DistributionType;
  name: string;
  isDiscrete: boolean;
  paramNames: string[];
  pdfOrPmf: (x: number, params: DistributionParams) => number;
  cdf: (x: number, params: DistributionParams) => number;
  inverseCdf: (p: number, params: DistributionParams) => number;
  moments: (params: DistributionParams) => DistributionMoments;
  suggestedDomain: (params: DistributionParams) => { min: number; max: number };
}

// Normal Distribution
export const NormalDist: DistributionDefinition = {
  type: 'normal',
  name: 'Normal (Gaussian) Distribution',
  isDiscrete: false,
  paramNames: ['mu', 'sigma'],
  pdfOrPmf: (x, { mu = 0, sigma = 1 }) => {
    if (sigma <= 0) return NaN;
    const z = (x - mu) / sigma;
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
  },
  cdf: (x, { mu = 0, sigma = 1 }) => {
    if (sigma <= 0) return NaN;
    return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
  },
  inverseCdf: (p, { mu = 0, sigma = 1 }) => {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (sigma <= 0) return NaN;
    return mu + sigma * Math.SQRT2 * erfInverse(2 * p - 1);
  },
  moments: ({ mu = 0, sigma = 1 }) => ({
    mean: mu,
    variance: sigma * sigma,
    stdDev: sigma,
    skewness: 0,
    kurtosis: 0,
  }),
  suggestedDomain: ({ mu = 0, sigma = 1 }) => ({
    min: mu - 4 * sigma,
    max: mu + 4 * sigma,
  }),
};

// Binomial Distribution
export const BinomialDist: DistributionDefinition = {
  type: 'binomial',
  name: 'Binomial Distribution',
  isDiscrete: true,
  paramNames: ['n', 'p'],
  pdfOrPmf: (k, { n = 10, p = 0.5 }) => {
    if (!Number.isInteger(k) || k < 0 || k > n || p < 0 || p > 1 || n < 1) return 0;
    return combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  },
  cdf: (k, { n = 10, p = 0.5 }) => {
    if (p < 0 || p > 1 || n < 1) return NaN;
    if (k < 0) return 0;
    if (k >= n) return 1;
    const intK = Math.floor(k);
    let sum = 0;
    for (let i = 0; i <= intK; i++) {
      sum += BinomialDist.pdfOrPmf(i, { n, p });
    }
    return Math.min(1, Math.max(0, sum));
  },
  inverseCdf: (prob, { n = 10, p = 0.5 }) => {
    if (prob <= 0) return 0;
    if (prob >= 1) return n;
    let sum = 0;
    for (let i = 0; i <= n; i++) {
      sum += BinomialDist.pdfOrPmf(i, { n, p });
      if (sum >= prob) return i;
    }
    return n;
  },
  moments: ({ n = 10, p = 0.5 }) => {
    const varVal = n * p * (1 - p);
    const sd = Math.sqrt(varVal);
    return {
      mean: n * p,
      variance: varVal,
      stdDev: sd,
      skewness: sd > 0 ? (1 - 2 * p) / sd : NaN,
      kurtosis: varVal > 0 ? (1 - 6 * p * (1 - p)) / varVal : NaN,
    };
  },
  suggestedDomain: ({ n = 10, p = 0.5 }) => {
    const mean = n * p;
    const sd = Math.sqrt(n * p * (1 - p));
    return { min: Math.max(0, Math.floor(mean - 3.5 * sd)), max: Math.min(n, Math.ceil(mean + 3.5 * sd)) };
  },
};

// Bernoulli Distribution
export const BernoulliDist: DistributionDefinition = {
  type: 'bernoulli',
  name: 'Bernoulli Distribution',
  isDiscrete: true,
  paramNames: ['p'],
  pdfOrPmf: (k, { p = 0.5 }) => {
    if (k === 1) return p;
    if (k === 0) return 1 - p;
    return 0;
  },
  cdf: (k, { p = 0.5 }) => {
    if (k < 0) return 0;
    if (k < 1) return 1 - p;
    return 1;
  },
  inverseCdf: (prob, { p = 0.5 }) => {
    if (prob <= 1 - p) return 0;
    return 1;
  },
  moments: ({ p = 0.5 }) => {
    const varVal = p * (1 - p);
    const sd = Math.sqrt(varVal);
    return {
      mean: p,
      variance: varVal,
      stdDev: sd,
      skewness: sd > 0 ? (1 - 2 * p) / sd : NaN,
      kurtosis: varVal > 0 ? (1 - 6 * p * (1 - p)) / varVal : NaN,
    };
  },
  suggestedDomain: () => ({ min: -0.5, max: 1.5 }),
};

// Poisson Distribution
export const PoissonDist: DistributionDefinition = {
  type: 'poisson',
  name: 'Poisson Distribution',
  isDiscrete: true,
  paramNames: ['lambda'],
  pdfOrPmf: (k, { lambda = 4 }) => {
    if (!Number.isInteger(k) || k < 0 || lambda <= 0) return 0;
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
  },
  cdf: (k, { lambda = 4 }) => {
    if (lambda <= 0) return NaN;
    if (k < 0) return 0;
    const intK = Math.floor(k);
    let sum = 0;
    for (let i = 0; i <= intK; i++) {
      sum += PoissonDist.pdfOrPmf(i, { lambda });
    }
    return Math.min(1, sum);
  },
  inverseCdf: (prob, { lambda = 4 }) => {
    if (prob <= 0) return 0;
    if (prob >= 1) return Math.ceil(lambda + 5 * Math.sqrt(lambda));
    let sum = 0;
    for (let i = 0; i <= 200; i++) {
      sum += PoissonDist.pdfOrPmf(i, { lambda });
      if (sum >= prob) return i;
    }
    return 200;
  },
  moments: ({ lambda = 4 }) => ({
    mean: lambda,
    variance: lambda,
    stdDev: Math.sqrt(lambda),
    skewness: 1 / Math.sqrt(lambda),
    kurtosis: 1 / lambda,
  }),
  suggestedDomain: ({ lambda = 4 }) => ({
    min: Math.max(0, Math.floor(lambda - 3.5 * Math.sqrt(lambda))),
    max: Math.ceil(lambda + 4 * Math.sqrt(lambda)),
  }),
};

// Geometric Distribution (trials until first success, k >= 1)
export const GeometricDist: DistributionDefinition = {
  type: 'geometric',
  name: 'Geometric Distribution',
  isDiscrete: true,
  paramNames: ['p'],
  pdfOrPmf: (k, { p = 0.5 }) => {
    if (!Number.isInteger(k) || k < 1 || p <= 0 || p > 1) return 0;
    return Math.pow(1 - p, k - 1) * p;
  },
  cdf: (k, { p = 0.5 }) => {
    if (k < 1 || p <= 0 || p > 1) return 0;
    const intK = Math.floor(k);
    return 1 - Math.pow(1 - p, intK);
  },
  inverseCdf: (prob, { p = 0.5 }) => {
    if (prob <= 0) return 1;
    if (prob >= 1) return Infinity;
    return Math.ceil(Math.log(1 - prob) / Math.log(1 - p));
  },
  moments: ({ p = 0.5 }) => {
    if (p <= 0 || p > 1) {
      return { mean: NaN, variance: NaN, stdDev: NaN, skewness: NaN, kurtosis: NaN };
    }
    const varVal = (1 - p) / (p * p);
    const sd = Math.sqrt(varVal);
    return {
      mean: 1 / p,
      variance: varVal,
      stdDev: sd,
      skewness: p < 1 ? (2 - p) / Math.sqrt(1 - p) : NaN,
      kurtosis: p < 1 ? 6 + (p * p) / (1 - p) : NaN,
    };
  },
  suggestedDomain: ({ p = 0.5 }) => ({
    min: 1,
    max: Math.max(10, Math.ceil((1 / p) * 3)),
  }),
};

// Uniform Continuous Distribution
export const UniformDist: DistributionDefinition = {
  type: 'uniform',
  name: 'Continuous Uniform Distribution',
  isDiscrete: false,
  paramNames: ['a', 'b'],
  pdfOrPmf: (x, { a = 0, b = 1 }) => {
    if (b <= a) return NaN;
    return x >= a && x <= b ? 1 / (b - a) : 0;
  },
  cdf: (x, { a = 0, b = 1 }) => {
    if (b <= a) return NaN;
    if (x < a) return 0;
    if (x > b) return 1;
    return (x - a) / (b - a);
  },
  inverseCdf: (p, { a = 0, b = 1 }) => {
    if (p < 0 || p > 1 || b <= a) return NaN;
    return a + p * (b - a);
  },
  moments: ({ a = 0, b = 1 }) => ({
    mean: (a + b) / 2,
    variance: Math.pow(b - a, 2) / 12,
    stdDev: (b - a) / Math.sqrt(12),
    skewness: 0,
    kurtosis: -1.2,
  }),
  suggestedDomain: ({ a = 0, b = 1 }) => ({
    min: a - (b - a) * 0.2,
    max: b + (b - a) * 0.2,
  }),
};

// Exponential Distribution
export const ExponentialDist: DistributionDefinition = {
  type: 'exponential',
  name: 'Exponential Distribution',
  isDiscrete: false,
  paramNames: ['lambda'],
  pdfOrPmf: (x, { lambda = 1 }) => {
    if (lambda <= 0 || x < 0) return 0;
    return lambda * Math.exp(-lambda * x);
  },
  cdf: (x, { lambda = 1 }) => {
    if (lambda <= 0 || x < 0) return 0;
    return 1 - Math.exp(-lambda * x);
  },
  inverseCdf: (p, { lambda = 1 }) => {
    if (p <= 0) return 0;
    if (p >= 1) return Infinity;
    if (lambda <= 0) return NaN;
    return -Math.log(1 - p) / lambda;
  },
  moments: ({ lambda = 1 }) => ({
    mean: 1 / lambda,
    variance: 1 / (lambda * lambda),
    stdDev: 1 / lambda,
    skewness: 2,
    kurtosis: 6,
  }),
  suggestedDomain: ({ lambda = 1 }) => ({
    min: 0,
    max: (1 / lambda) * 5,
  }),
};

// Student's t-Distribution
export const StudentTDist: DistributionDefinition = {
  type: 'student_t',
  name: "Student's t-Distribution",
  isDiscrete: false,
  paramNames: ['df'],
  pdfOrPmf: (x, { df = 10 }) => {
    if (df <= 0) return NaN;
    const factor =
      Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2)) / Math.sqrt(df * Math.PI);
    return factor * Math.pow(1 + (x * x) / df, -(df + 1) / 2);
  },
  cdf: (t, { df = 10 }) => {
    if (df <= 0) return NaN;
    const x = (t + Math.sqrt(t * t + df)) / (2 * Math.sqrt(t * t + df));
    return incompleteBeta(x, df / 2, df / 2);
  },
  inverseCdf: (p, { df = 10 }) => {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;

    // Use Brent's method on CDF(t) - p = 0
    const obj = (t: number) => StudentTDist.cdf(t, { df }) - p;
    const res = brentRoot(obj, -100, 100);
    return res !== null ? res : NaN;
  },
  moments: ({ df = 10 }) => ({
    mean: df > 1 ? 0 : NaN,
    variance: df > 2 ? df / (df - 2) : df > 1 ? Infinity : NaN,
    stdDev: df > 2 ? Math.sqrt(df / (df - 2)) : NaN,
    skewness: df > 3 ? 0 : NaN,
    kurtosis: df > 4 ? 6 / (df - 4) : NaN,
  }),
  suggestedDomain: () => ({ min: -5, max: 5 }),
};

// Chi-Square Distribution
export const ChiSquareDist: DistributionDefinition = {
  type: 'chi_square',
  name: 'Chi-Square Distribution',
  isDiscrete: false,
  paramNames: ['df'],
  pdfOrPmf: (x, { df = 5 }) => {
    if (x <= 0 || df <= 0) return 0;
    const k = df;
    return (
      (Math.pow(x, k / 2 - 1) * Math.exp(-x / 2)) /
      (Math.pow(2, k / 2) * Math.exp(logGamma(k / 2)))
    );
  },
  cdf: (x, { df = 5 }) => {
    if (x <= 0 || df <= 0) return 0;
    return lowerIncompleteGamma(df / 2, x / 2);
  },
  inverseCdf: (p, { df = 5 }) => {
    if (p <= 0) return 0;
    if (p >= 1) return Infinity;
    if (df <= 0) return NaN;

    // Bisection / Brent on CDF(x) - p = 0
    const obj = (x: number) => ChiSquareDist.cdf(x, { df }) - p;
    const maxSearch = Math.max(30, df * 5);
    const res = brentRoot(obj, 0.0001, maxSearch);
    return res !== null ? res : NaN;
  },
  moments: ({ df = 5 }) => ({
    mean: df,
    variance: 2 * df,
    stdDev: Math.sqrt(2 * df),
    skewness: Math.sqrt(8 / df),
    kurtosis: 12 / df,
  }),
  suggestedDomain: ({ df = 5 }) => ({
    min: 0,
    max: df + 4 * Math.sqrt(2 * df),
  }),
};

export const DISTRIBUTIONS_MAP: Record<DistributionType, DistributionDefinition> = {
  normal: NormalDist,
  binomial: BinomialDist,
  bernoulli: BernoulliDist,
  poisson: PoissonDist,
  geometric: GeometricDist,
  uniform: UniformDist,
  exponential: ExponentialDist,
  student_t: StudentTDist,
  chi_square: ChiSquareDist,
};

/**
 * Calculates probability in range [xMin, xMax]: P(xMin <= X <= xMax).
 */
export function calculateRangeProbability(
  dist: DistributionDefinition,
  params: DistributionParams,
  xMin: number,
  xMax: number
): number {
  if (xMin > xMax) return 0;
  if (dist.isDiscrete) {
    const start = Math.ceil(xMin);
    const end = Math.floor(xMax);
    let sum = 0;
    for (let k = start; k <= end; k++) {
      sum += dist.pdfOrPmf(k, params);
    }
    return Math.min(1, Math.max(0, sum));
  } else {
    const cdfMax = dist.cdf(xMax, params);
    const cdfMin = dist.cdf(xMin, params);
    return Math.min(1, Math.max(0, cdfMax - cdfMin));
  }
}
