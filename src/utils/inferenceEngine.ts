/**
 * Comprehensive Statistical Inference Engine for OmniCalc Pro.
 * Provides hypothesis tests, confidence intervals, effect sizes, ANOVA,
 * Chi-Square tests, and probability value computations with exact numerical precision.
 */

import {
  NormalDist,
  StudentTDist,
  ChiSquareDist,
  incompleteBeta,
} from './distributions';

export type AlternativeHypothesis = 'two-sided' | 'less' | 'greater';

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidenceLevel: number; // e.g. 0.95
  marginOfError: number;
}

export interface HypothesisTestResult {
  testName: string;
  testStatistic: number;
  statisticName: 'z' | 't' | 'chi2' | 'F';
  degreesOfFreedom?: number | [number, number];
  pValue: number;
  alpha: number;
  rejectNull: boolean;
  alternative: AlternativeHypothesis;
  confidenceInterval?: ConfidenceInterval;
  effectSize?: {
    name: string;
    value: number;
    interpretation?: string;
  };
  details: Record<string, number | string>;
  interpretation: string;
}

/**
 * F-distribution Cumulative Distribution Function and P-value.
 */
export function fDistributionCdf(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0) return 0;
  const x = (df1 * f) / (df1 * f + df2);
  return incompleteBeta(x, df1 / 2, df2 / 2);
}

export function fDistributionPValue(f: number, df1: number, df2: number): number {
  if (f <= 0) return 1;
  const cdf = fDistributionCdf(f, df1, df2);
  return Math.max(0, Math.min(1, 1 - cdf));
}

// ==========================================
// 1. ONE-SAMPLE Z-TEST & INTERVAL FOR MEAN
// ==========================================
export function oneSampleZTest({
  sampleMean,
  sampleSize,
  popStdDev,
  hypothesizedMean = 0,
  alpha = 0.05,
  alternative = 'two-sided',
}: {
  sampleMean: number;
  sampleSize: number;
  popStdDev: number;
  hypothesizedMean?: number;
  alpha?: number;
  alternative?: AlternativeHypothesis;
}): HypothesisTestResult {
  if (sampleSize <= 0 || popStdDev <= 0) {
    throw new Error('Sample size must be > 0 and population standard deviation must be > 0.');
  }

  const standardError = popStdDev / Math.sqrt(sampleSize);
  const z = (sampleMean - hypothesizedMean) / standardError;

  let pValue = 0;
  if (alternative === 'two-sided') {
    pValue = 2 * (1 - NormalDist.cdf(Math.abs(z), { mu: 0, sigma: 1 }));
  } else if (alternative === 'less') {
    pValue = NormalDist.cdf(z, { mu: 0, sigma: 1 });
  } else {
    pValue = 1 - NormalDist.cdf(z, { mu: 0, sigma: 1 });
  }
  pValue = Math.max(0, Math.min(1, pValue));

  const zCrit = NormalDist.inverseCdf(1 - alpha / 2, { mu: 0, sigma: 1 });
  const marginOfError = zCrit * standardError;
  const ci: ConfidenceInterval = {
    lower: sampleMean - marginOfError,
    upper: sampleMean + marginOfError,
    confidenceLevel: 1 - alpha,
    marginOfError,
  };

  const cohensD = Math.abs(sampleMean - hypothesizedMean) / popStdDev;

  return {
    testName: 'One-Sample Z-Test for Population Mean',
    testStatistic: z,
    statisticName: 'z',
    pValue,
    alpha,
    rejectNull: pValue < alpha,
    alternative,
    confidenceInterval: ci,
    effectSize: {
      name: "Cohen's d",
      value: cohensD,
      interpretation: cohensD < 0.2 ? 'Negligible' : cohensD < 0.5 ? 'Small' : cohensD < 0.8 ? 'Medium' : 'Large',
    },
    details: {
      'Sample Mean': sampleMean,
      'Hypothesized Mean (μ₀)': hypothesizedMean,
      'Pop. Std Dev (σ)': popStdDev,
      'Sample Size (n)': sampleSize,
      'Standard Error': standardError,
      'Critical Value (z*)': zCrit,
    },
    interpretation:
      pValue < alpha
        ? `Reject H₀ (p = ${pValue.toFixed(5)} < α = ${alpha}). Statistically significant evidence that μ ${alternative === 'two-sided' ? '≠' : alternative === 'less' ? '<' : '>'} ${hypothesizedMean}.`
        : `Fail to reject H₀ (p = ${pValue.toFixed(5)} ≥ α = ${alpha}). Insufficient evidence that μ ${alternative === 'two-sided' ? '≠' : alternative === 'less' ? '<' : '>'} ${hypothesizedMean}.`,
  };
}

// ==========================================
// 2. ONE-SAMPLE t-TEST & INTERVAL FOR MEAN
// ==========================================
export function oneSampleTTest({
  sampleMean,
  sampleStdDev,
  sampleSize,
  hypothesizedMean = 0,
  alpha = 0.05,
  alternative = 'two-sided',
}: {
  sampleMean: number;
  sampleStdDev: number;
  sampleSize: number;
  hypothesizedMean?: number;
  alpha?: number;
  alternative?: AlternativeHypothesis;
}): HypothesisTestResult {
  if (sampleSize <= 1 || sampleStdDev <= 0) {
    throw new Error('Sample size must be > 1 and sample standard deviation must be > 0.');
  }

  const df = sampleSize - 1;
  const standardError = sampleStdDev / Math.sqrt(sampleSize);
  const t = (sampleMean - hypothesizedMean) / standardError;

  let pValue = 0;
  if (alternative === 'two-sided') {
    pValue = 2 * (1 - StudentTDist.cdf(Math.abs(t), { df }));
  } else if (alternative === 'less') {
    pValue = StudentTDist.cdf(t, { df });
  } else {
    pValue = 1 - StudentTDist.cdf(t, { df });
  }
  pValue = Math.max(0, Math.min(1, pValue));

  const tCrit = StudentTDist.inverseCdf(1 - alpha / 2, { df });
  const marginOfError = tCrit * standardError;
  const ci: ConfidenceInterval = {
    lower: sampleMean - marginOfError,
    upper: sampleMean + marginOfError,
    confidenceLevel: 1 - alpha,
    marginOfError,
  };

  const cohensD = Math.abs(sampleMean - hypothesizedMean) / sampleStdDev;

  return {
    testName: "One-Sample Student's t-Test for Mean",
    testStatistic: t,
    statisticName: 't',
    degreesOfFreedom: df,
    pValue,
    alpha,
    rejectNull: pValue < alpha,
    alternative,
    confidenceInterval: ci,
    effectSize: {
      name: "Cohen's d",
      value: cohensD,
      interpretation: cohensD < 0.2 ? 'Negligible' : cohensD < 0.5 ? 'Small' : cohensD < 0.8 ? 'Medium' : 'Large',
    },
    details: {
      'Sample Mean': sampleMean,
      'Hypothesized Mean (μ₀)': hypothesizedMean,
      'Sample Std Dev (s)': sampleStdDev,
      'Sample Size (n)': sampleSize,
      'Degrees of Freedom (df)': df,
      'Standard Error': standardError,
      'Critical Value (t*)': tCrit,
    },
    interpretation:
      pValue < alpha
        ? `Reject H₀ (p = ${pValue.toFixed(5)} < α = ${alpha}). Significant evidence that μ ${alternative === 'two-sided' ? '≠' : alternative === 'less' ? '<' : '>'} ${hypothesizedMean}.`
        : `Fail to reject H₀ (p = ${pValue.toFixed(5)} ≥ α = ${alpha}). Insufficient evidence to conclude μ ${alternative === 'two-sided' ? '≠' : alternative === 'less' ? '<' : '>'} ${hypothesizedMean}.`,
  };
}

// ==========================================
// 3. TWO-SAMPLE INDEPENDENT t-TEST
// ==========================================
export function twoSampleTTest({
  mean1,
  stdDev1,
  n1,
  mean2,
  stdDev2,
  n2,
  equalVariances = false,
  hypothesizedDiff = 0,
  alpha = 0.05,
  alternative = 'two-sided',
}: {
  mean1: number;
  stdDev1: number;
  n1: number;
  mean2: number;
  stdDev2: number;
  n2: number;
  equalVariances?: boolean;
  hypothesizedDiff?: number;
  alpha?: number;
  alternative?: AlternativeHypothesis;
}): HypothesisTestResult {
  if (n1 <= 1 || n2 <= 1 || stdDev1 <= 0 || stdDev2 <= 0) {
    throw new Error('Both sample sizes must be > 1 and standard deviations must be > 0.');
  }

  const diff = mean1 - mean2;
  let df = 0;
  let standardError = 0;
  let pooledStdDev = 0;

  if (equalVariances) {
    // Pooled t-test
    df = n1 + n2 - 2;
    const pooledVariance = ((n1 - 1) * stdDev1 ** 2 + (n2 - 1) * stdDev2 ** 2) / df;
    pooledStdDev = Math.sqrt(pooledVariance);
    standardError = pooledStdDev * Math.sqrt(1 / n1 + 1 / n2);
  } else {
    // Welch's t-test (unequal variances)
    const var1n = stdDev1 ** 2 / n1;
    const var2n = stdDev2 ** 2 / n2;
    standardError = Math.sqrt(var1n + var2n);
    df = (var1n + var2n) ** 2 / (var1n ** 2 / (n1 - 1) + var2n ** 2 / (n2 - 1));
    pooledStdDev = Math.sqrt((stdDev1 ** 2 + stdDev2 ** 2) / 2);
  }

  const t = (diff - hypothesizedDiff) / standardError;

  let pValue = 0;
  if (alternative === 'two-sided') {
    pValue = 2 * (1 - StudentTDist.cdf(Math.abs(t), { df }));
  } else if (alternative === 'less') {
    pValue = StudentTDist.cdf(t, { df });
  } else {
    pValue = 1 - StudentTDist.cdf(t, { df });
  }
  pValue = Math.max(0, Math.min(1, pValue));

  const tCrit = StudentTDist.inverseCdf(1 - alpha / 2, { df });
  const marginOfError = tCrit * standardError;
  const ci: ConfidenceInterval = {
    lower: diff - marginOfError,
    upper: diff + marginOfError,
    confidenceLevel: 1 - alpha,
    marginOfError,
  };

  const cohensD = Math.abs(diff) / (pooledStdDev || 1);

  return {
    testName: equalVariances
      ? 'Two-Sample Pooled t-Test (Equal Variances)'
      : "Welch's Two-Sample t-Test (Unequal Variances)",
    testStatistic: t,
    statisticName: 't',
    degreesOfFreedom: Number(df.toFixed(3)),
    pValue,
    alpha,
    rejectNull: pValue < alpha,
    alternative,
    confidenceInterval: ci,
    effectSize: {
      name: "Cohen's d",
      value: cohensD,
      interpretation: cohensD < 0.2 ? 'Negligible' : cohensD < 0.5 ? 'Small' : cohensD < 0.8 ? 'Medium' : 'Large',
    },
    details: {
      'Mean 1 (x̄₁)': mean1,
      'Mean 2 (x̄₂)': mean2,
      'Difference (x̄₁ - x̄₂)': diff,
      'Sample 1 (n₁, s₁)': `n=${n1}, s=${stdDev1}`,
      'Sample 2 (n₂, s₂)': `n=${n2}, s=${stdDev2}`,
      'Degrees of Freedom (df)': df.toFixed(3),
      'Standard Error': standardError,
      'Critical Value (t*)': tCrit,
    },
    interpretation:
      pValue < alpha
        ? `Reject H₀ (p = ${pValue.toFixed(5)} < α = ${alpha}). Statistically significant difference between population means.`
        : `Fail to reject H₀ (p = ${pValue.toFixed(5)} ≥ α = ${alpha}). No significant difference detected between population means.`,
  };
}

// ==========================================
// 4. PAIRED SAMPLES t-TEST
// ==========================================
export function pairedTTest({
  meanDifference,
  stdDevDifference,
  sampleSize,
  hypothesizedDiff = 0,
  alpha = 0.05,
  alternative = 'two-sided',
}: {
  meanDifference: number;
  stdDevDifference: number;
  sampleSize: number;
  hypothesizedDiff?: number;
  alpha?: number;
  alternative?: AlternativeHypothesis;
}): HypothesisTestResult {
  return oneSampleTTest({
    sampleMean: meanDifference,
    sampleStdDev: stdDevDifference,
    sampleSize,
    hypothesizedMean: hypothesizedDiff,
    alpha,
    alternative,
  });
}

// ==========================================
// 5. ONE-SAMPLE PROPORTION Z-TEST
// ==========================================
export function oneSampleProportionTest({
  successes,
  trials,
  hypothesizedP = 0.5,
  alpha = 0.05,
  alternative = 'two-sided',
}: {
  successes: number;
  trials: number;
  hypothesizedP?: number;
  alpha?: number;
  alternative?: AlternativeHypothesis;
}): HypothesisTestResult {
  if (trials <= 0 || successes < 0 || successes > trials || hypothesizedP <= 0 || hypothesizedP >= 1) {
    throw new Error('Successes must be between 0 and total trials (trials > 0). Hypothesized p must be in (0, 1).');
  }

  const sampleP = successes / trials;
  const standardError = Math.sqrt((hypothesizedP * (1 - hypothesizedP)) / trials);
  const z = (sampleP - hypothesizedP) / standardError;

  let pValue = 0;
  if (alternative === 'two-sided') {
    pValue = 2 * (1 - NormalDist.cdf(Math.abs(z), { mu: 0, sigma: 1 }));
  } else if (alternative === 'less') {
    pValue = NormalDist.cdf(z, { mu: 0, sigma: 1 });
  } else {
    pValue = 1 - NormalDist.cdf(z, { mu: 0, sigma: 1 });
  }
  pValue = Math.max(0, Math.min(1, pValue));

  // Wilson Score Interval with Continuity Correction
  const zCrit = NormalDist.inverseCdf(1 - alpha / 2, { mu: 0, sigma: 1 });
  const z2 = zCrit ** 2;
  const denom = 1 + z2 / trials;
  const center = (sampleP + z2 / (2 * trials)) / denom;
  const margin = (zCrit * Math.sqrt((sampleP * (1 - sampleP)) / trials + z2 / (4 * trials ** 2))) / denom;

  const ci: ConfidenceInterval = {
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
    confidenceLevel: 1 - alpha,
    marginOfError: margin,
  };

  const h = 2 * Math.asin(Math.sqrt(sampleP)) - 2 * Math.asin(Math.sqrt(hypothesizedP));

  return {
    testName: 'One-Sample Proportion Z-Test (Wilson Score CI)',
    testStatistic: z,
    statisticName: 'z',
    pValue,
    alpha,
    rejectNull: pValue < alpha,
    alternative,
    confidenceInterval: ci,
    effectSize: {
      name: "Cohen's h",
      value: Math.abs(h),
      interpretation: Math.abs(h) < 0.2 ? 'Negligible' : Math.abs(h) < 0.5 ? 'Small' : Math.abs(h) < 0.8 ? 'Medium' : 'Large',
    },
    details: {
      'Sample Proportion (p̂)': sampleP,
      'Successes / Trials (x/n)': `${successes} / ${trials}`,
      'Hypothesized (p₀)': hypothesizedP,
      'Standard Error': standardError,
      'Wilson 95% CI': `[${ci.lower.toFixed(4)}, ${ci.upper.toFixed(4)}]`,
    },
    interpretation:
      pValue < alpha
        ? `Reject H₀ (p = ${pValue.toFixed(5)} < α = ${alpha}). Proportion is significantly different from ${hypothesizedP}.`
        : `Fail to reject H₀ (p = ${pValue.toFixed(5)} ≥ α = ${alpha}). No significant difference from ${hypothesizedP}.`,
  };
}

// ==========================================
// 6. TWO-SAMPLE PROPORTIONS Z-TEST
// ==========================================
export function twoSampleProportionsTest({
  x1,
  n1,
  x2,
  n2,
  alpha = 0.05,
  alternative = 'two-sided',
}: {
  x1: number;
  n1: number;
  x2: number;
  n2: number;
  alpha?: number;
  alternative?: AlternativeHypothesis;
}): HypothesisTestResult {
  if (n1 <= 0 || n2 <= 0 || x1 < 0 || x1 > n1 || x2 < 0 || x2 > n2) {
    throw new Error('Invalid count of successes or trial counts.');
  }

  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const diff = p1 - p2;

  // Pooled proportion for hypothesis test
  const pPooled = (x1 + x2) / (n1 + n2);
  const sePooled = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));
  const z = (p1 - p2) / (sePooled || 1);

  let pValue = 0;
  if (alternative === 'two-sided') {
    pValue = 2 * (1 - NormalDist.cdf(Math.abs(z), { mu: 0, sigma: 1 }));
  } else if (alternative === 'less') {
    pValue = NormalDist.cdf(z, { mu: 0, sigma: 1 });
  } else {
    pValue = 1 - NormalDist.cdf(z, { mu: 0, sigma: 1 });
  }
  pValue = Math.max(0, Math.min(1, pValue));

  // Unpooled SE for confidence interval
  const seUnpooled = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
  const zCrit = NormalDist.inverseCdf(1 - alpha / 2, { mu: 0, sigma: 1 });
  const marginOfError = zCrit * seUnpooled;

  const ci: ConfidenceInterval = {
    lower: diff - marginOfError,
    upper: diff + marginOfError,
    confidenceLevel: 1 - alpha,
    marginOfError,
  };

  const relativeRisk = p2 > 0 ? p1 / p2 : NaN;
  const oddsRatio = x2 * (n1 - x1) > 0 ? (x1 * (n2 - x2)) / (x2 * (n1 - x1)) : NaN;

  return {
    testName: 'Two-Sample Proportions Z-Test',
    testStatistic: z,
    statisticName: 'z',
    pValue,
    alpha,
    rejectNull: pValue < alpha,
    alternative,
    confidenceInterval: ci,
    effectSize: {
      name: 'Odds Ratio / Relative Risk',
      value: isFinite(oddsRatio) ? oddsRatio : relativeRisk,
      interpretation: `RR = ${relativeRisk.toFixed(3)}, OR = ${oddsRatio.toFixed(3)}`,
    },
    details: {
      'Group 1 (p̂₁)': `${p1.toFixed(4)} (${x1}/${n1})`,
      'Group 2 (p̂₂)': `${p2.toFixed(4)} (${x2}/${n2})`,
      'Difference (p̂₁ - p̂₂)': diff.toFixed(4),
      'Pooled Proportion': pPooled.toFixed(4),
      'Standard Error': sePooled,
    },
    interpretation:
      pValue < alpha
        ? `Reject H₀ (p = ${pValue.toFixed(5)} < α = ${alpha}). Significant difference between the two proportions.`
        : `Fail to reject H₀ (p = ${pValue.toFixed(5)} ≥ α = ${alpha}). Insufficient evidence of a difference in proportions.`,
  };
}

// ==========================================
// 7. CHI-SQUARE GOODNESS-OF-FIT TEST
// ==========================================
export function chiSquareGoodnessOfFitTest({
  observed,
  expected,
  alpha = 0.05,
}: {
  observed: number[];
  expected?: number[];
  alpha?: number;
}): HypothesisTestResult {
  const k = observed.length;
  if (k < 2) {
    throw new Error('Goodness-of-Fit test requires at least 2 categories.');
  }

  const totalObserved = observed.reduce((a, b) => a + b, 0);
  let exp = expected;
  if (!exp || exp.length !== k) {
    // Default to equal distribution
    exp = new Array(k).fill(totalObserved / k);
  } else {
    // Normalize expected to match observed total if given as frequencies/probabilities
    const totalExpected = exp.reduce((a, b) => a + b, 0);
    if (Math.abs(totalExpected - totalObserved) > 1e-4 && totalExpected > 0) {
      exp = exp.map((e) => (e / totalExpected) * totalObserved);
    }
  }

  let chi2 = 0;
  for (let i = 0; i < k; i++) {
    if (exp[i] <= 0) throw new Error('Expected frequencies must be strictly positive.');
    chi2 += (observed[i] - exp[i]) ** 2 / exp[i];
  }

  const df = k - 1;
  const pValue = Math.max(0, Math.min(1, 1 - ChiSquareDist.cdf(chi2, { df })));
  const cramersV = Math.sqrt(chi2 / (totalObserved * (k - 1)));

  return {
    testName: 'Chi-Square Goodness-of-Fit Test',
    testStatistic: chi2,
    statisticName: 'chi2',
    degreesOfFreedom: df,
    pValue,
    alpha,
    rejectNull: pValue < alpha,
    alternative: 'greater',
    effectSize: {
      name: "Cramér's V",
      value: cramersV,
      interpretation: cramersV < 0.1 ? 'Small' : cramersV < 0.3 ? 'Medium' : 'Large',
    },
    details: {
      'Categories (k)': k,
      'Total Observations': totalObserved,
      'Degrees of Freedom (df)': df,
      'Chi-Square (χ²)': chi2.toFixed(4),
    },
    interpretation:
      pValue < alpha
        ? `Reject H₀ (p = ${pValue.toFixed(5)} < α = ${alpha}). Observed distribution differs significantly from expected.`
        : `Fail to reject H₀ (p = ${pValue.toFixed(5)} ≥ α = ${alpha}). Observed distribution fits expected distribution well.`,
  };
}

// ==========================================
// 8. CHI-SQUARE TEST OF INDEPENDENCE
// ==========================================
export function chiSquareIndependenceTest({
  contingencyMatrix,
  alpha = 0.05,
}: {
  contingencyMatrix: number[][];
  alpha?: number;
}): HypothesisTestResult {
  const r = contingencyMatrix.length;
  if (r < 2) throw new Error('Contingency table requires at least 2 rows.');
  const c = contingencyMatrix[0].length;
  if (c < 2) throw new Error('Contingency table requires at least 2 columns.');

  const rowTotals = new Array(r).fill(0);
  const colTotals = new Array(c).fill(0);
  let totalN = 0;

  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      const val = contingencyMatrix[i][j];
      rowTotals[i] += val;
      colTotals[j] += val;
      totalN += val;
    }
  }

  let chi2 = 0;
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / totalN;
      if (expected <= 0) continue;
      chi2 += (contingencyMatrix[i][j] - expected) ** 2 / expected;
    }
  }

  const df = (r - 1) * (c - 1);
  const pValue = Math.max(0, Math.min(1, 1 - ChiSquareDist.cdf(chi2, { df })));
  const minDim = Math.min(r - 1, c - 1);
  const cramersV = Math.sqrt(chi2 / (totalN * minDim));

  return {
    testName: 'Chi-Square Test of Independence',
    testStatistic: chi2,
    statisticName: 'chi2',
    degreesOfFreedom: df,
    pValue,
    alpha,
    rejectNull: pValue < alpha,
    alternative: 'greater',
    effectSize: {
      name: "Cramér's V",
      value: cramersV,
      interpretation: cramersV < 0.1 ? 'Negligible' : cramersV < 0.3 ? 'Moderate' : 'Strong',
    },
    details: {
      'Table Dimensions': `${r} × ${c}`,
      'Total Observations (N)': totalN,
      'Degrees of Freedom (df)': df,
      'Chi-Square Statistic (χ²)': chi2.toFixed(4),
    },
    interpretation:
      pValue < alpha
        ? `Reject H₀ (p = ${pValue.toFixed(5)} < α = ${alpha}). Significant statistical association between row and column variables.`
        : `Fail to reject H₀ (p = ${pValue.toFixed(5)} ≥ α = ${alpha}). Variables appear statistically independent.`,
  };
}

// ==========================================
// 9. ONE-WAY ANOVA (F-TEST)
// ==========================================
export interface AnovaGroup {
  name: string;
  data: number[];
}

export function oneWayAnova({
  groups,
  alpha = 0.05,
}: {
  groups: AnovaGroup[];
  alpha?: number;
}): HypothesisTestResult {
  const k = groups.length;
  if (k < 2) throw new Error('One-Way ANOVA requires at least 2 groups.');

  let totalN = 0;
  let grandSum = 0;
  const groupStats = groups.map((g) => {
    const n = g.data.length;
    if (n < 1) throw new Error(`Group '${g.name}' must contain at least 1 observation.`);
    const sum = g.data.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const ssq = g.data.reduce((a, b) => a + (b - mean) ** 2, 0);
    const variance = n > 1 ? ssq / (n - 1) : 0;
    totalN += n;
    grandSum += sum;
    return { name: g.name, n, mean, variance, ssq };
  });

  const grandMean = grandSum / totalN;

  // Between-Group Sum of Squares (SSB)
  let ssBetween = 0;
  groupStats.forEach((g) => {
    ssBetween += g.n * (g.mean - grandMean) ** 2;
  });
  const dfBetween = k - 1;
  const msBetween = ssBetween / dfBetween;

  // Within-Group Sum of Squares (SSW / SSE)
  let ssWithin = 0;
  groupStats.forEach((g) => {
    ssWithin += g.ssq;
  });
  const dfWithin = totalN - k;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  const ssTotal = ssBetween + ssWithin;
  const f = msWithin > 0 ? msBetween / msWithin : 0;
  const pValue = fDistributionPValue(f, dfBetween, dfWithin);

  const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;

  return {
    testName: 'One-Way Analysis of Variance (ANOVA)',
    testStatistic: f,
    statisticName: 'F',
    degreesOfFreedom: [dfBetween, dfWithin],
    pValue,
    alpha,
    rejectNull: pValue < alpha,
    alternative: 'greater',
    effectSize: {
      name: 'Eta-Squared (η²)',
      value: etaSquared,
      interpretation: etaSquared < 0.01 ? 'Small' : etaSquared < 0.06 ? 'Medium' : 'Large effect',
    },
    details: {
      'Groups (k)': k,
      'Total Samples (N)': totalN,
      'SS Between / df': `${ssBetween.toFixed(3)} / ${dfBetween}`,
      'SS Within / df': `${ssWithin.toFixed(3)} / ${dfWithin}`,
      'MS Between': msBetween.toFixed(3),
      'MS Within': msWithin.toFixed(3),
      'F-Ratio': f.toFixed(4),
    },
    interpretation:
      pValue < alpha
        ? `Reject H₀ (F(${dfBetween}, ${dfWithin}) = ${f.toFixed(3)}, p = ${pValue.toFixed(5)} < α = ${alpha}). At least one group mean is significantly different.`
        : `Fail to reject H₀ (p = ${pValue.toFixed(5)} ≥ α = ${alpha}). No significant difference among group means.`,
  };
}
