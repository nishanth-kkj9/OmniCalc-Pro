/**
 * Statistics & Probability Engine for OmniCalc Pro.
 * Provides numerically stable algorithms for descriptive statistics, shape metrics
 * (skewness, kurtosis), outlier detection, and probability distributions (Normal, Binomial, Poisson, t-dist).
 */

export interface DescriptiveStats {
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  geometricMean: number | null;
  harmonicMean: number | null;
  min: number;
  max: number;
  range: number;
  sampleVariance: number;
  sampleStdDev: number;
  popVariance: number;
  popStdDev: number;
  standardError: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  outliers: {
    mild: number[];
    extreme: number[];
  };
}

/**
 * Computes complete descriptive statistics including skewness, kurtosis, and Tukey outliers.
 */
export function computeDescriptiveStats(numbers: number[]): DescriptiveStats | null {
  const clean = numbers.filter((n) => typeof n === 'number' && Number.isFinite(n));
  const n = clean.length;
  if (n === 0) return null;

  const sorted = [...clean].sort((a, b) => a - b);
  const sum = clean.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Median
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  // Mode(s)
  const freqMap = new Map<number, number>();
  let maxFreq = 0;
  for (const v of clean) {
    const count = (freqMap.get(v) || 0) + 1;
    freqMap.set(v, count);
    if (count > maxFreq) maxFreq = count;
  }
  const modes: number[] = [];
  if (maxFreq > 1) {
    for (const [val, count] of freqMap.entries()) {
      if (count === maxFreq) modes.push(val);
    }
  }

  // Geometric & Harmonic Mean (positive values only)
  const allPositive = clean.every((v) => v > 0);
  let geometricMean: number | null = null;
  let harmonicMean: number | null = null;
  if (allPositive) {
    const logSum = clean.reduce((acc, v) => acc + Math.log(v), 0);
    geometricMean = Math.exp(logSum / n);

    const invSum = clean.reduce((acc, v) => acc + 1 / v, 0);
    harmonicMean = invSum > 0 ? n / invSum : null;
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // Sum of powers of deviations for variance, skewness, kurtosis
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const v of clean) {
    const diff = v - mean;
    const diff2 = diff * diff;
    m2 += diff2;
    m3 += diff2 * diff;
    m4 += diff2 * diff2;
  }

  const popVariance = m2 / n;
  const popStdDev = Math.sqrt(popVariance);
  const sampleVariance = n > 1 ? m2 / (n - 1) : 0;
  const sampleStdDev = Math.sqrt(sampleVariance);
  const standardError = sampleStdDev / Math.sqrt(n);

  // Adjusted Fisher-Pearson skewness and excess kurtosis
  let skewness = 0;
  let kurtosis = 0;
  if (n >= 3 && sampleStdDev > 1e-12) {
    const s = sampleStdDev;
    skewness = (n / ((n - 1) * (n - 2))) * (m3 / (s * s * s));
  }
  if (n >= 4 && sampleStdDev > 1e-12) {
    const s2 = sampleVariance;
    const term1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const term2 = m4 / (s2 * s2);
    const term3 = (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    kurtosis = term1 * term2 - term3; // excess kurtosis (Normal = 0)
  }

  // Quartiles (linear interpolation)
  const getPercentile = (p: number): number => {
    const idx = p * (n - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    const w = idx - low;
    return sorted[low] * (1 - w) + sorted[high] * w;
  };

  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  // Outlier detection using Tukey's fences
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const lowerExtreme = q1 - 3.0 * iqr;
  const upperExtreme = q3 + 3.0 * iqr;

  const mildOutliers: number[] = [];
  const extremeOutliers: number[] = [];

  for (const v of clean) {
    if (v < lowerExtreme || v > upperExtreme) {
      extremeOutliers.push(v);
    } else if (v < lowerFence || v > upperFence) {
      mildOutliers.push(v);
    }
  }

  return {
    count: n,
    sum,
    mean,
    median,
    modes,
    geometricMean,
    harmonicMean,
    min,
    max,
    range,
    sampleVariance,
    sampleStdDev,
    popVariance,
    popStdDev,
    standardError,
    q1,
    q3,
    iqr,
    skewness,
    kurtosis,
    outliers: {
      mild: mildOutliers,
      extreme: extremeOutliers,
    },
  };
}

export interface FrequencyEntry {
  value: number;
  frequency: number;
  relativeFreq: number;
  cumulativeFreq: number;
  cumulativeRelativeFreq: number;
}

/**
 * Builds an exact frequency distribution table from raw numbers.
 */
export function computeFrequencyTable(numbers: number[]): FrequencyEntry[] {
  const clean = numbers.filter((n) => typeof n === 'number' && Number.isFinite(n));
  const n = clean.length;
  if (n === 0) return [];

  const map = new Map<number, number>();
  for (const v of clean) {
    map.set(v, (map.get(v) || 0) + 1);
  }

  const sortedKeys = Array.from(map.keys()).sort((a, b) => a - b);
  const result: FrequencyEntry[] = [];
  let cum = 0;

  for (const k of sortedKeys) {
    const count = map.get(k)!;
    cum += count;
    result.push({
      value: k,
      frequency: count,
      relativeFreq: count / n,
      cumulativeFreq: cum,
      cumulativeRelativeFreq: cum / n,
    });
  }

  return result;
}

export interface WeightedStats {
  count: number;
  weightedMean: number;
  weightedVariance: number;
  weightedStdDev: number;
  totalWeight: number;
}

/**
 * Computes weighted mean and sample variance.
 */
export function computeWeightedStats(values: number[], weights: number[]): WeightedStats | null {
  if (values.length !== weights.length || values.length === 0) return null;

  let sumWV = 0;
  let sumW = 0;
  let sumW2 = 0;
  let validCount = 0;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const w = weights[i];
    if (isFinite(v) && isFinite(w) && w > 0) {
      sumWV += v * w;
      sumW += w;
      sumW2 += w * w;
      validCount++;
    }
  }

  if (validCount === 0 || sumW === 0) return null;

  const weightedMean = sumWV / sumW;

  let sumDevSq = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const w = weights[i];
    if (isFinite(v) && isFinite(w) && w > 0) {
      sumDevSq += w * Math.pow(v - weightedMean, 2);
    }
  }

  // Unbiased weighted sample variance (if sumW^2 != sumW2)
  const denom = sumW - sumW2 / sumW;
  const weightedVariance = denom > 0 ? sumDevSq / denom : sumDevSq / sumW;
  const weightedStdDev = Math.sqrt(weightedVariance);

  return {
    count: validCount,
    weightedMean,
    weightedVariance,
    weightedStdDev,
    totalWeight: sumW,
  };
}

export interface BivariateStats {
  count: number;
  covariance: number;
  pearsonCorrelation: number;
  spearmanCorrelation: number;
}

/**
 * Computes sample Covariance and Pearson & Spearman Correlations between X and Y.
 */
export function computeBivariateStats(x: number[], y: number[]): BivariateStats | null {
  if (x.length !== y.length || x.length < 2) return null;

  const validPairs: { x: number; y: number }[] = [];
  for (let i = 0; i < x.length; i++) {
    if (isFinite(x[i]) && isFinite(y[i])) {
      validPairs.push({ x: x[i], y: y[i] });
    }
  }

  const n = validPairs.length;
  if (n < 2) return null;

  const meanX = validPairs.reduce((acc, p) => acc + p.x, 0) / n;
  const meanY = validPairs.reduce((acc, p) => acc + p.y, 0) / n;

  let cov = 0;
  let varX = 0;
  let varY = 0;

  for (const p of validPairs) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  const sampleCov = cov / (n - 1);
  const denom = Math.sqrt(varX * varY);
  const pearson = denom > 0 ? cov / denom : 0;

  // Spearman Rank correlation
  const rankX = computeRanks(validPairs.map((p) => p.x));
  const rankY = computeRanks(validPairs.map((p) => p.y));
  let dSqSum = 0;
  for (let i = 0; i < n; i++) {
    const d = rankX[i] - rankY[i];
    dSqSum += d * d;
  }
  const spearman = 1 - (6 * dSqSum) / (n * (n * n - 1));

  return {
    count: n,
    covariance: sampleCov,
    pearsonCorrelation: Math.max(-1, Math.min(1, pearson)),
    spearmanCorrelation: Math.max(-1, Math.min(1, spearman)),
  };
}

function computeRanks(arr: number[]): number[] {
  const indexed = arr.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);
  const ranks = new Array(arr.length).fill(0);

  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length - 1 && indexed[j + 1].val === indexed[j].val) {
      j++;
    }
    const rank = (i + 1 + j + 1) / 2;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].idx] = rank;
    }
    i = j + 1;
  }

  return ranks;
}

export interface HistogramBin {
  binMin: number;
  binMax: number;
  binMid: number;
  count: number;
  density: number;
}

/**
 * Computes optimal histogram bins using Freedman-Diaconis rule.
 */
export function computeHistogram(numbers: number[], numBins?: number): HistogramBin[] {
  const clean = numbers.filter((n) => typeof n === 'number' && Number.isFinite(n));
  const n = clean.length;
  if (n === 0) return [];

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  if (min === max) {
    return [{ binMin: min - 0.5, binMax: max + 0.5, binMid: min, count: n, density: 1 }];
  }

  const sorted = [...clean].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  // Freedman-Diaconis bin width: 2 * IQR * n^(-1/3)
  let k = numBins;
  if (!k || k < 2) {
    const fdWidth = iqr > 0 ? (2 * iqr) / Math.cbrt(n) : 0;
    k = fdWidth > 0 ? Math.ceil((max - min) / fdWidth) : Math.ceil(Math.sqrt(n));
    k = Math.max(4, Math.min(30, k));
  }

  const binWidth = (max - min) / k;
  const bins: HistogramBin[] = [];

  for (let i = 0; i < k; i++) {
    const bMin = min + i * binWidth;
    const bMax = i === k - 1 ? max + 1e-12 : min + (i + 1) * binWidth;
    const bMid = (bMin + bMax) / 2;
    bins.push({ binMin: bMin, binMax: bMax, binMid: bMid, count: 0, density: 0 });
  }

  for (const v of clean) {
    const idx = Math.min(k - 1, Math.floor((v - min) / binWidth));
    if (idx >= 0 && idx < k) {
      bins[idx].count++;
    }
  }

  for (const b of bins) {
    b.density = b.count / (n * binWidth);
  }

  return bins;
}

/**
 * Normal Distribution Probability Density Function (PDF).
 */
export function normalPdf(x: number, mean: number = 0, stdDev: number = 1): number {
  if (stdDev <= 0) return 0;
  const z = (x - mean) / stdDev;
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

/**
 * Standard Normal Cumulative Distribution Function (CDF) using Abramowitz & Stegun polynomial approximation (error < 7.5e-8).
 */
export function normalCdf(x: number, mean: number = 0, stdDev: number = 1): number {
  if (stdDev <= 0) return x >= mean ? 1 : 0;
  const z = (x - mean) / stdDev;

  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.sqrt(2);

  // Error function erf(x) approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * absZ);
  const erfVal =
    sign *
    (1 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
        t *
        Math.exp(-absZ * absZ));

  return 0.5 * (1 + erfVal);
}

/**
 * Inverse Normal Cumulative Distribution Function (probit function) via rational approximation.
 */
export function normalInvCdf(p: number, mean: number = 0, stdDev: number = 1): number | null {
  if (p <= 0 || p >= 1 || stdDev <= 0) return null;

  // Beasley-Springer-Moro rational approximation
  const a0 = 2.50662823884;
  const a1 = -18.61500062529;
  const a2 = 41.39119773534;
  const a3 = -25.44106049637;

  const b1 = -8.4735109309;
  const b2 = 23.08336743743;
  const b3 = -21.06224101826;
  const b4 = 3.13082909833;

  const c0 = 0.3374754822726147;
  const c1 = 0.9761690190917186;
  const c2 = 0.1607979714918209;
  const c3 = 0.0276438810333863;
  const c4 = 0.0038405729373609;
  const c5 = 0.0003951896511919;
  const c6 = 0.0000321767881768;
  const c7 = 0.0000002888167364;
  const c8 = 0.0000003960315187;

  const y = p - 0.5;
  let z: number;

  if (Math.abs(y) < 0.42) {
    const r = y * y;
    z = (y * (((a3 * r + a2) * r + a1) * r + a0)) / ((((b4 * r + b3) * r + b2) * r + b1) * r + 1);
  } else {
    let r = p < 0.5 ? p : 1 - p;
    r = Math.log(-Math.log(r));
    z =
      c0 +
      r *
        (c1 +
          r *
            (c2 +
              r *
                (c3 +
                  r *
                    (c4 +
                      r * (c5 + r * (c6 + r * (c7 + r * c8)))))));
    if (p < 0.5) z = -z;
  }

  return mean + z * stdDev;
}

/**
 * Binomial Probability Mass Function (PMF): P(X = k) = C(n, k) * p^k * (1-p)^(n-k)
 */
export function binomialPmf(n: number, k: number, p: number): number {
  if (p < 0 || p > 1 || k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) {
    return 0;
  }
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;

  // Use log-gamma / log-factorial to avoid integer overflow
  const logFactorial = (val: number): number => {
    let res = 0;
    for (let i = 2; i <= val; i++) res += Math.log(i);
    return res;
  };

  const logComb = logFactorial(n) - logFactorial(k) - logFactorial(n - k);
  const logProb = logComb + k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(logProb);
}

/**
 * Poisson Probability Mass Function (PMF): P(X = k) = (λ^k * e^(-λ)) / k!
 */
export function poissonPmf(lambda: number, k: number): number {
  if (lambda <= 0 || k < 0 || !Number.isInteger(k)) return 0;

  let logFact = 0;
  for (let i = 2; i <= k; i++) logFact += Math.log(i);

  const logProb = k * Math.log(lambda) - lambda - logFact;
  return Math.exp(logProb);
}
