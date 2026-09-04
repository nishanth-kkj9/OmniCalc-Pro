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
    def anova(groups: List[List[float]], alpha: float = 0.05):
        return one_way_anova(groups, alpha)

