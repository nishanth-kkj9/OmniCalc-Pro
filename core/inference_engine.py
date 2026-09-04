"""
Comprehensive Statistical Inference & Hypothesis Testing Engine for OmniCalc Pro (Desktop).
Provides Z-tests, Student's t-tests, Welch's t-test, Paired t-tests, Proportions,
Chi-Square tests, One-Way ANOVA, and effect sizes.
"""

from typing import Dict, List, Optional, Tuple, Union
import math
from core.distributions_engine import (
    normal_cdf,
    normal_quantile,
    student_t_cdf,
    student_t_quantile,
    chi_square_cdf,
    incomplete_beta,
)


def f_distribution_cdf(f: float, df1: float, df2: float) -> float:
    """Computes F-distribution CDF via regularized incomplete beta."""
    if f <= 0 or df1 <= 0 or df2 <= 0:
        return 0.0
    x = (df1 * f) / (df1 * f + df2)
    return incomplete_beta(x, df1 / 2.0, df2 / 2.0)


def f_distribution_p_value(f: float, df1: float, df2: float) -> float:
    """Computes F-distribution p-value (survival function)."""
    if f <= 0:
        return 1.0
    return max(0.0, min(1.0, 1.0 - f_distribution_cdf(f, df1, df2)))


def one_sample_z_test(
    sample_mean: float,
    sample_size: int,
    pop_std_dev: float,
    hypothesized_mean: float = 0.0,
    alpha: float = 0.05,
    alternative: str = "two-sided",
) -> Dict[str, Union[float, int, bool, str, Dict[str, float]]]:
    """One-sample z-test with known population standard deviation."""
    if sample_size <= 0 or pop_std_dev <= 0:
        raise ValueError("Sample size must be > 0 and pop std dev must be > 0.")

    standard_error = pop_std_dev / math.sqrt(sample_size)
    z = (sample_mean - hypothesized_mean) / standard_error

    if alternative == "two-sided":
        p_value = 2.0 * (1.0 - normal_cdf(abs(z), 0.0, 1.0))
    elif alternative == "less":
        p_value = normal_cdf(z, 0.0, 1.0)
    else:
        p_value = 1.0 - normal_cdf(z, 0.0, 1.0)

    p_value = max(0.0, min(1.0, p_value))
    z_crit = normal_quantile(1.0 - alpha / 2.0, 0.0, 1.0)
    margin = z_crit * standard_error

    return {
        "test_name": "One-Sample Z-Test",
        "statistic": z,
        "p_value": p_value,
        "alpha": alpha,
        "reject_null": p_value < alpha,
        "confidence_interval": {
            "lower": sample_mean - margin,
            "upper": sample_mean + margin,
            "confidence_level": 1.0 - alpha,
        },
        "effect_size": abs(sample_mean - hypothesized_mean) / pop_std_dev,
    }


def one_sample_t_test(
    sample_mean: float,
    sample_std_dev: float,
    sample_size: int,
    hypothesized_mean: float = 0.0,
    alpha: float = 0.05,
    alternative: str = "two-sided",
) -> Dict[str, Union[float, int, bool, str, Dict[str, float]]]:
    """One-sample Student's t-test with unknown population standard deviation."""
    if sample_size <= 1 or sample_std_dev <= 0:
        raise ValueError("Sample size must be > 1 and sample std dev must be > 0.")

    df = sample_size - 1
    standard_error = sample_std_dev / math.sqrt(sample_size)
    t = (sample_mean - hypothesized_mean) / standard_error

    if alternative == "two-sided":
        p_value = 2.0 * (1.0 - student_t_cdf(abs(t), df))
    elif alternative == "less":
        p_value = student_t_cdf(t, df)
    else:
        p_value = 1.0 - student_t_cdf(t, df)

    p_value = max(0.0, min(1.0, p_value))
    t_crit = student_t_quantile(1.0 - alpha / 2.0, df)
    margin = t_crit * standard_error

    return {
        "test_name": "One-Sample Student's t-Test",
        "statistic": t,
        "df": df,
        "p_value": p_value,
        "alpha": alpha,
        "reject_null": p_value < alpha,
        "confidence_interval": {
            "lower": sample_mean - margin,
            "upper": sample_mean + margin,
            "confidence_level": 1.0 - alpha,
        },
        "effect_size": abs(sample_mean - hypothesized_mean) / sample_std_dev,
    }


def two_sample_t_test(
    mean1: float,
    std_dev1: float,
    n1: int,
    mean2: float,
    std_dev2: float,
    n2: int,
    equal_variances: bool = False,
    hypothesized_diff: float = 0.0,
    alpha: float = 0.05,
    alternative: str = "two-sided",
) -> Dict[str, Union[float, int, bool, str, Dict[str, float]]]:
    """Two-sample t-test (Welch or Pooled)."""
    if n1 <= 1 or n2 <= 1 or std_dev1 <= 0 or std_dev2 <= 0:
        raise ValueError("Sample sizes must be > 1 and std devs must be > 0.")

    diff = mean1 - mean2
    if equal_variances:
        df = n1 + n2 - 2
        sp2 = ((n1 - 1) * std_dev1**2 + (n2 - 1) * std_dev2**2) / df
        sp = math.sqrt(sp2)
        se = sp * math.sqrt(1.0 / n1 + 1.0 / n2)
    else:
        v1 = std_dev1**2 / n1
        v2 = std_dev2**2 / n2
        se = math.sqrt(v1 + v2)
        df = (v1 + v2) ** 2 / (v1**2 / (n1 - 1) + v2**2 / (n2 - 1))
        sp = math.sqrt((std_dev1**2 + std_dev2**2) / 2.0)

    t = (diff - hypothesized_diff) / se

    if alternative == "two-sided":
        p_value = 2.0 * (1.0 - student_t_cdf(abs(t), df))
    elif alternative == "less":
        p_value = student_t_cdf(t, df)
    else:
        p_value = 1.0 - student_t_cdf(t, df)

    p_value = max(0.0, min(1.0, p_value))
    t_crit = student_t_quantile(1.0 - alpha / 2.0, df)
    margin = t_crit * se

    return {
        "test_name": "Two-Sample t-Test",
        "statistic": t,
        "df": df,
        "p_value": p_value,
        "alpha": alpha,
        "reject_null": p_value < alpha,
        "confidence_interval": {
            "lower": diff - margin,
            "upper": diff + margin,
            "confidence_level": 1.0 - alpha,
        },
        "effect_size": abs(diff) / (sp or 1.0),
    }


def paired_t_test(
    mean_diff: float,
    std_diff: float,
    sample_size: int,
    hypothesized_diff: float = 0.0,
    alpha: float = 0.05,
    alternative: str = "two-sided",
) -> Dict[str, Union[float, int, bool, str, Dict[str, float]]]:
    """Paired samples t-test on differences."""
    res = one_sample_t_test(mean_diff, std_diff, sample_size, hypothesized_diff, alpha, alternative)
    res["test_name"] = "Paired Samples t-Test"
    return res


def one_sample_proportion_test(
    successes: int,
    trials: int,
    hypothesized_p: float = 0.5,
    alpha: float = 0.05,
    alternative: str = "two-sided",
) -> Dict[str, Union[float, int, bool, str, Dict[str, float]]]:
    """One-sample proportion z-test."""
    if trials <= 0 or successes < 0 or successes > trials or not (0.0 < hypothesized_p < 1.0):
        raise ValueError("Invalid parameters for proportion test (0 <= successes <= trials, trials > 0, 0 < p < 1).")

    sample_p = successes / trials
    se = math.sqrt((hypothesized_p * (1.0 - hypothesized_p)) / trials)
    z = (sample_p - hypothesized_p) / se

    if alternative == "two-sided":
        p_val = 2.0 * (1.0 - normal_cdf(abs(z), 0.0, 1.0))
    elif alternative == "less":
        p_val = normal_cdf(z, 0.0, 1.0)
    else:
        p_val = 1.0 - normal_cdf(z, 0.0, 1.0)

    p_val = max(0.0, min(1.0, p_val))
    z_crit = normal_quantile(1.0 - alpha / 2.0, 0.0, 1.0)
    margin = z_crit * math.sqrt((sample_p * (1.0 - sample_p)) / trials) if trials > 0 else 0.0

    return {
        "test_name": "One-Sample Proportion Z-Test",
        "statistic": z,
        "p_value": p_val,
        "alpha": alpha,
        "reject_null": p_val < alpha,
        "sample_p": sample_p,
        "confidence_interval": {
            "lower": max(0.0, sample_p - margin),
            "upper": min(1.0, sample_p + margin),
            "confidence_level": 1.0 - alpha,
        },
    }


def two_sample_proportions_test(
    x1: int,
    n1: int,
    x2: int,
    n2: int,
    alpha: float = 0.05,
    alternative: str = "two-sided",
) -> Dict[str, Union[float, int, bool, str, Dict[str, float]]]:
    """Two-sample proportions z-test."""
    if n1 <= 0 or n2 <= 0 or x1 < 0 or x1 > n1 or x2 < 0 or x2 > n2:
        raise ValueError("Invalid counts or trial numbers for 2-proportion test.")

    p1 = x1 / n1
    p2 = x2 / n2
    diff = p1 - p2

    p_pooled = (x1 + x2) / (n1 + n2)
    se_pooled = math.sqrt(p_pooled * (1.0 - p_pooled) * (1.0 / n1 + 1.0 / n2))
    z = (p1 - p2) / (se_pooled or 1e-12)

    if alternative == "two-sided":
        p_val = 2.0 * (1.0 - normal_cdf(abs(z), 0.0, 1.0))
    elif alternative == "less":
        p_val = normal_cdf(z, 0.0, 1.0)
    else:
        p_val = 1.0 - normal_cdf(z, 0.0, 1.0)

    p_val = max(0.0, min(1.0, p_val))
    se_unpooled = math.sqrt((p1 * (1.0 - p1)) / n1 + (p2 * (1.0 - p2)) / n2)
    z_crit = normal_quantile(1.0 - alpha / 2.0, 0.0, 1.0)
    margin = z_crit * se_unpooled

    return {
        "test_name": "Two-Sample Proportions Z-Test",
        "statistic": z,
        "p_value": p_val,
        "alpha": alpha,
        "reject_null": p_val < alpha,
        "p1": p1,
        "p2": p2,
        "confidence_interval": {
            "lower": diff - margin,
            "upper": diff + margin,
            "confidence_level": 1.0 - alpha,
        },
    }


def chi_square_gof_test(
    observed: List[float],
    expected: Optional[List[float]] = None,
    alpha: float = 0.05,
) -> Dict[str, Union[float, int, bool, str]]:
    """Chi-Square Goodness-of-Fit Test."""
    k = len(observed)
    if k < 2:
        raise ValueError("Chi-Square Goodness-of-Fit requires at least 2 categories.")

    total_obs = sum(observed)
    if expected is None or len(expected) != k:
        exp_normalized = [total_obs / k] * k
    else:
        total_exp = sum(expected)
        exp_normalized = [(e / total_exp) * total_obs for e in expected] if total_exp > 0 else expected

    chi2 = 0.0
    for obs, exp in zip(observed, exp_normalized):
        if exp <= 0:
            raise ValueError("Expected frequencies must be > 0.")
        chi2 += ((obs - exp) ** 2) / exp

    df = k - 1
    p_val = max(0.0, min(1.0, 1.0 - chi_square_cdf(chi2, df)))

    return {
        "test_name": "Chi-Square Goodness-of-Fit Test",
        "statistic": chi2,
        "df": df,
        "p_value": p_val,
        "alpha": alpha,
        "reject_null": p_val < alpha,
    }


def chi_square_independence_test(
    contingency_table: List[List[float]],
    alpha: float = 0.05,
) -> Dict[str, Union[float, int, bool, str]]:
    """Chi-Square Test of Independence for R x C table."""
    r = len(contingency_table)
    if r < 2:
        raise ValueError("Contingency table requires at least 2 rows.")
    c = len(contingency_table[0])
    if c < 2:
        raise ValueError("Contingency table requires at least 2 columns.")

    row_totals = [sum(row) for row in contingency_table]
    col_totals = [sum(contingency_table[i][j] for i in range(r)) for j in range(c)]
    grand_total = sum(row_totals)

    chi2 = 0.0
    for i in range(r):
        for j in range(c):
            exp = (row_totals[i] * col_totals[j]) / grand_total if grand_total > 0 else 0.0
            if exp > 0:
                chi2 += ((contingency_table[i][j] - exp) ** 2) / exp

    df = (r - 1) * (c - 1)
    p_val = max(0.0, min(1.0, 1.0 - chi_square_cdf(chi2, df)))

    return {
        "test_name": "Chi-Square Test of Independence",
        "statistic": chi2,
        "df": df,
        "p_value": p_val,
        "alpha": alpha,
        "reject_null": p_val < alpha,
    }


def one_way_anova(
    groups: List[List[float]],
    alpha: float = 0.05,
) -> Dict[str, Union[float, int, bool, str, Tuple[float, float]]]:
    """One-way Analysis of Variance (ANOVA)."""
    k = len(groups)
    if k < 2:
        raise ValueError("ANOVA requires at least 2 groups.")

    total_n = 0
    grand_sum = 0.0
    group_stats = []

    for idx, grp in enumerate(groups):
        n = len(grp)
        if n < 1:
            raise ValueError(f"Group {idx} is empty.")
        g_sum = sum(grp)
        g_mean = g_sum / n
        ssq = sum((x - g_mean) ** 2 for x in grp)
        total_n += n
        grand_sum += g_sum
        group_stats.append((n, g_mean, ssq))

    grand_mean = grand_sum / total_n

    ss_between = sum(n * (m - grand_mean) ** 2 for n, m, _ in group_stats)
    df_between = k - 1
    ms_between = ss_between / df_between

    ss_within = sum(ssq for _, _, ssq in group_stats)
    df_within = total_n - k
    ms_within = ss_within / df_within if df_within > 0 else 1e-12

    f = ms_between / ms_within
    p_val = f_distribution_p_value(f, df_between, df_within)
    ss_total = ss_between + ss_within
    eta_sq = ss_between / ss_total if ss_total > 0 else 0.0

    return {
        "test_name": "One-Way ANOVA",
        "statistic": f,
        "df_between": df_between,
        "df_within": df_within,
        "p_value": p_val,
        "alpha": alpha,
        "reject_null": p_val < alpha,
        "eta_squared": eta_sq,
    }


class InferenceEngine:
    @staticmethod
    def z_test(sample_mean: float, sample_size: int, pop_std_dev: float, hypothesized_mean: float = 0.0, alpha: float = 0.05, alternative: str = "two-sided"):
        return one_sample_z_test(sample_mean, sample_size, pop_std_dev, hypothesized_mean, alpha, alternative)

    @staticmethod
    def one_sample_t_test(sample_mean: float, sample_std_dev: float, sample_size: int, hypothesized_mean: float = 0.0, alpha: float = 0.05, alternative: str = "two-sided"):
        return one_sample_t_test(sample_mean, sample_std_dev, sample_size, hypothesized_mean, alpha, alternative)

    @staticmethod
    def two_sample_t_test(mean1: float, std_dev1: float, n1: int, mean2: float, std_dev2: float, n2: int, equal_variances: bool = False, hypothesized_diff: float = 0.0, alpha: float = 0.05, alternative: str = "two-sided"):
        return two_sample_t_test(mean1, std_dev1, n1, mean2, std_dev2, n2, equal_variances, hypothesized_diff, alpha, alternative)

    @staticmethod
    def paired_t_test(mean_diff: float, std_diff: float, sample_size: int, hypothesized_diff: float = 0.0, alpha: float = 0.05, alternative: str = "two-sided"):
        return paired_t_test(mean_diff, std_diff, sample_size, hypothesized_diff, alpha, alternative)

    @staticmethod
    def one_sample_proportion_test(successes: int, trials: int, hypothesized_p: float = 0.5, alpha: float = 0.05, alternative: str = "two-sided"):
        return one_sample_proportion_test(successes, trials, hypothesized_p, alpha, alternative)

    @staticmethod
    def two_sample_proportions_test(x1: int, n1: int, x2: int, n2: int, alpha: float = 0.05, alternative: str = "two-sided"):
        return two_sample_proportions_test(x1, n1, x2, n2, alpha, alternative)

    @staticmethod
    def chi_square_gof_test(observed: List[float], expected: Optional[List[float]] = None, alpha: float = 0.05):
        return chi_square_gof_test(observed, expected, alpha)

    @staticmethod
    def chi_square_independence_test(contingency_table: List[List[float]], alpha: float = 0.05):
        return chi_square_independence_test(contingency_table, alpha)

    @staticmethod
    def anova(groups: List[List[float]], alpha: float = 0.05):
        return one_way_anova(groups, alpha)

