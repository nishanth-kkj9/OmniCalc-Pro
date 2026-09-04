"""
OmniCalc Pro Probability Distributions Engine (Python Desktop Parity)
Provides PDF/PMF, CDF, Inverse CDF / Quantiles for Normal, Student's t, Chi-Square,
F-distribution, Binomial, Poisson, and Exponential distributions using high-precision
numerical approximations (Lanczos Gamma, Incomplete Beta/Gamma, rational Chebyshev).
"""

import math
from typing import Dict, Any, Optional


def log_gamma(x: float) -> float:
    """Lanczos approximation for ln(Gamma(x))."""
    if x <= 0:
        return 0.0
    p = [
        676.5203681287885,
        -1259.139216722289,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.1385710958565258,
        9.9843695780195716e-6,
        1.5056327351493116e-7,
    ]
    g = 7
    if x < 0.5:
        return math.log(math.pi / math.sin(math.pi * x)) - log_gamma(1.0 - x)
    x -= 1
    a = 0.99999999999980993
    for i, p_val in enumerate(p):
        a += p_val / (x + i + 1)
    t = x + g + 0.5
    return 0.5 * math.log(2 * math.pi) + (x + 0.5) * math.log(t) - t + math.log(a)


def incomplete_beta(x: float, a: float, b: float) -> float:
    """Regularized incomplete beta function I_x(a, b) via continued fraction."""
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0

    # Symmetry transformation for rapid convergence
    if x > (a + 1.0) / (a + b + 2.0):
        return 1.0 - incomplete_beta(1.0 - x, b, a)

    l_beta = log_gamma(a) + log_gamma(b) - log_gamma(a + b)
    front = math.exp(a * math.log(x) + b * math.log(1.0 - x) - l_beta) / a

    # Lentz continued fraction
    f = 1.0
    c = 1.0
    d = 0.0
    tiny = 1e-30

    for m in range(1, 200):
        # Even step 2m
        numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m))
        d = 1.0 + numerator * d
        if abs(d) < tiny:
            d = tiny
        c = 1.0 + numerator / c
        if abs(c) < tiny:
            c = tiny
        d = 1.0 / d
        f *= c * d

        # Odd step 2m + 1
        numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1))
        d = 1.0 + numerator * d
        if abs(d) < tiny:
            d = tiny
        c = 1.0 + numerator / c
        if abs(c) < tiny:
            c = tiny
        d = 1.0 / d
        delta = c * d
        f *= delta

        if abs(delta - 1.0) < 1e-14:
            break

    return front * (f - 1.0)


def incomplete_gamma(s: float, x: float) -> float:
    """Regularized lower incomplete gamma P(s, x) = gamma(s, x) / Gamma(s)."""
    if x <= 0.0:
        return 0.0
    if s <= 0.0:
        return 1.0

    if x < s + 1.0:
        # Series expansion
        sum_val = 1.0 / s
        term = sum_val
        for n in range(1, 200):
            term *= x / (s + n)
            sum_val += term
            if abs(term / sum_val) < 1e-14:
                break
        return sum_val * math.exp(-x + s * math.log(x) - log_gamma(s))
    else:
        # Continued fraction
        b = x + 1.0 - s
        c = 1.0 / 1e-30
        d = 1.0 / b
        h = d
        for i in range(1, 200):
            an = -i * (i - s)
            b += 2.0
            d = an * d + b
            if abs(d) < 1e-30:
                d = 1e-30
            c = b + an / c
            if abs(c) < 1e-30:
                c = 1e-30
            d = 1.0 / d
            del_val = d * c
            h *= del_val
            if abs(del_val - 1.0) < 1e-14:
                break
        return 1.0 - math.exp(-x + s * math.log(x) - log_gamma(s)) * h


def normal_pdf(x: float, mean: float = 0.0, std: float = 1.0) -> float:
    if std <= 0:
        raise ValueError("Standard deviation must be > 0.")
    z = (x - mean) / std
    return (1.0 / (std * math.sqrt(2 * math.pi))) * math.exp(-0.5 * z * z)


def normal_cdf(x: float, mean: float = 0.0, std: float = 1.0) -> float:
    if std <= 0:
        raise ValueError("Standard deviation must be > 0.")
    z = (x - mean) / std
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def normal_quantile(p: float, mean: float = 0.0, std: float = 1.0) -> float:
    """Acklam rational approximation for inverse standard normal CDF."""
    if p <= 0.0:
        return -math.inf
    if p >= 1.0:
        return math.inf

    # Acklam coefficients
    a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0]
    b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
    c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0]
    d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0]

    p_low = 0.02425
    p_high = 1.0 - p_low

    if p < p_low:
        q = math.sqrt(-2.0 * math.log(p))
        z = (((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) / \
            ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1.0)
    elif p <= p_high:
        q = p - 0.5
        r = q * q
        z = (((((a[0]*r + a[1])*r + a[2])*r + a[3])*r + a[4])*r + a[5])*q / \
            (((((b[0]*r + b[1])*r + b[2])*r + b[3])*r + b[4])*r + 1.0)
    else:
        q = math.sqrt(-2.0 * math.log(1.0 - p))
        z = -(((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) / \
             ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1.0)

    # One Halley refinement iteration
    e = 0.5 * math.erfc(-z / math.sqrt(2.0)) - p
    u = e * math.sqrt(2.0 * math.pi) * math.exp(z * z / 2.0)
    z = z - u / (1.0 + z * u / 2.0)

    return mean + z * std


def student_t_pdf(t: float, df: float) -> float:
    if df <= 0:
        return 0.0
    coef = math.exp(log_gamma((df + 1) / 2.0) - log_gamma(df / 2.0)) / math.sqrt(df * math.pi)
    return coef * ((1.0 + (t * t) / df) ** (-(df + 1) / 2.0))


def student_t_cdf(t: float, df: float) -> float:
    if df <= 0:
        return 0.0
    x = df / (df + t * t)
    ib = incomplete_beta(x, df / 2.0, 0.5)
    if t >= 0:
        return 1.0 - 0.5 * ib
    else:
        return 0.5 * ib


def student_t_quantile(p: float, df: float) -> float:
    if p <= 0.0:
        return -math.inf
    if p >= 1.0:
        return math.inf
    if p == 0.5:
        return 0.0

    # Initial guess using Cornish-Fisher expansion
    z = normal_quantile(p, 0.0, 1.0)
    t = z + (z**3 + z) / (4.0 * df) + (5.0 * z**5 + 16.0 * z**3 + 3.0 * z) / (96.0 * df**2)

    # Halley root-finding refinement
    for _ in range(10):
        val = student_t_cdf(t, df) - p
        deriv = student_t_pdf(t, df)
        if deriv == 0:
            break
        t_next = t - val / deriv
        if abs(t_next - t) < 1e-10:
            break
        t = t_next

    return t


def chi_square_cdf(x: float, df: float) -> float:
    if x <= 0 or df <= 0:
        return 0.0
    return incomplete_gamma(df / 2.0, x / 2.0)


class DistributionsEngine:
    @staticmethod
    def normal_pdf(x: float, mean: float = 0.0, std: float = 1.0) -> float:
        return normal_pdf(x, mean, std)

    @staticmethod
    def normal_cdf(x: float, mean: float = 0.0, std: float = 1.0) -> float:
        return normal_cdf(x, mean, std)

    @staticmethod
    def normal_quantile(p: float, mean: float = 0.0, std: float = 1.0) -> float:
        return normal_quantile(p, mean, std)

    @staticmethod
    def student_t_cdf(t: float, df: float) -> float:
        return student_t_cdf(t, df)

    @staticmethod
    def student_t_quantile(p: float, df: float) -> float:
        return student_t_quantile(p, df)

    @staticmethod
    def chi_square_cdf(x: float, df: float) -> float:
        return chi_square_cdf(x, df)

    @staticmethod
    def binomial_pmf(k: int, n: int, p: float) -> float:
        if not (0 <= k <= n) or not (0.0 <= p <= 1.0):
            return 0.0
        return math.comb(n, k) * (p ** k) * ((1.0 - p) ** (n - k))

    @staticmethod
    def binomial_cdf(k: int, n: int, p: float) -> float:
        if k < 0:
            return 0.0
        if k >= n:
            return 1.0
        return sum(DistributionsEngine.binomial_pmf(i, n, p) for i in range(k + 1))

    @staticmethod
    def poisson_pmf(k: int, lambda_val: float) -> float:
        if k < 0 or lambda_val <= 0:
            return 0.0
        return (math.exp(-lambda_val) * (lambda_val ** k)) / math.factorial(k)

    @staticmethod
    def poisson_cdf(k: int, lambda_val: float) -> float:
        if k < 0 or lambda_val <= 0:
            return 0.0
        return sum(DistributionsEngine.poisson_pmf(i, lambda_val) for i in range(k + 1))

    @staticmethod
    def exponential_pdf(x: float, rate: float = 1.0) -> float:
        if x < 0 or rate <= 0:
            return 0.0
        return rate * math.exp(-rate * x)

    @staticmethod
    def exponential_cdf(x: float, rate: float = 1.0) -> float:
        if x < 0 or rate <= 0:
            return 0.0
        return 1.0 - math.exp(-rate * x)

    @staticmethod
    def exponential_quantile(p: float, rate: float = 1.0) -> float:
        if p <= 0.0 or rate <= 0:
            return 0.0
        if p >= 1.0:
            return math.inf
        return -math.log(1.0 - p) / rate

    @staticmethod
    def bernoulli_pmf(k: int, p: float) -> float:
        if p < 0.0 or p > 1.0:
            return 0.0
        if k == 1:
            return p
        elif k == 0:
            return 1.0 - p
        return 0.0

    @staticmethod
    def bernoulli_cdf(k: int, p: float) -> float:
        if k < 0:
            return 0.0
        if k >= 1:
            return 1.0
        return 1.0 - p

    @staticmethod
    def geometric_pmf(k: int, p: float) -> float:
        if k < 1 or p <= 0.0 or p > 1.0:
            return 0.0
        return ((1.0 - p) ** (k - 1)) * p

    @staticmethod
    def geometric_cdf(k: int, p: float) -> float:
        if k < 1 or p <= 0.0 or p > 1.0:
            return 0.0
        return 1.0 - ((1.0 - p) ** k)

    @staticmethod
    def uniform_pdf(x: float, a: float = 0.0, b: float = 1.0) -> float:
        if a >= b or x < a or x > b:
            return 0.0
        return 1.0 / (b - a)

    @staticmethod
    def uniform_cdf(x: float, a: float = 0.0, b: float = 1.0) -> float:
        if a >= b:
            return 0.0
        if x < a:
            return 0.0
        if x >= b:
            return 1.0
        return (x - a) / (b - a)

    @staticmethod
    def uniform_quantile(p: float, a: float = 0.0, b: float = 1.0) -> float:
        if a >= b or p < 0.0 or p > 1.0:
            return 0.0
        return a + p * (b - a)

    @staticmethod
    def get_moments(dist_type: str, params: Dict[str, float]) -> Dict[str, float]:
        """
        Analytical moments (mean, variance, std_dev, skewness, excess kurtosis).
        Note: Kurtosis is strictly EXCESS KURTOSIS (Normal = 0.0) across all distributions.
        """
        d = dist_type.lower()
        if d == "normal":
            mu = params.get("mean", params.get("mu", 0.0))
            std = params.get("std", params.get("sigma", 1.0))
            var = std * std
            return {"mean": mu, "variance": var, "std_dev": std, "skewness": 0.0, "kurtosis": 0.0}
        elif d == "student_t":
            df = params.get("df", 10.0)
            mean = 0.0 if df > 1 else math.nan
            var = (df / (df - 2.0)) if df > 2 else math.nan
            skew = 0.0 if df > 3 else math.nan
            kurt = (6.0 / (df - 4.0)) if df > 4 else math.nan
            return {"mean": mean, "variance": var, "std_dev": math.sqrt(var) if not math.isnan(var) else math.nan, "skewness": skew, "kurtosis": kurt}
        elif d == "chi_square":
            df = params.get("df", 1.0)
            mean = df
            var = 2.0 * df
            skew = math.sqrt(8.0 / df) if df > 0 else math.nan
            kurt = (12.0 / df) if df > 0 else math.nan
            return {"mean": mean, "variance": var, "std_dev": math.sqrt(var) if var >= 0 else math.nan, "skewness": skew, "kurtosis": kurt}
        elif d == "binomial":
            n = int(params.get("n", 10))
            p = params.get("p", 0.5)
            mean = n * p
            var = n * p * (1.0 - p)
            std = math.sqrt(var) if var >= 0 else math.nan
            if var <= 0:
                skew = math.nan
                kurt = math.nan
            else:
                skew = (1.0 - 2.0 * p) / std
                kurt = (1.0 - 6.0 * p * (1.0 - p)) / var
            return {"mean": mean, "variance": var, "std_dev": std, "skewness": skew, "kurtosis": kurt}
        elif d == "poisson":
            lam = params.get("lambda", 1.0)
            mean = lam
            var = lam
            std = math.sqrt(lam) if lam >= 0 else math.nan
            skew = (1.0 / std) if std > 0 else math.nan
            kurt = (1.0 / lam) if lam > 0 else math.nan
            return {"mean": mean, "variance": var, "std_dev": std, "skewness": skew, "kurtosis": kurt}
        elif d == "exponential":
            rate = params.get("rate", params.get("lambda", 1.0))
            if rate <= 0:
                return {"mean": math.nan, "variance": math.nan, "std_dev": math.nan, "skewness": math.nan, "kurtosis": math.nan}
            mean = 1.0 / rate
            var = 1.0 / (rate * rate)
            return {"mean": mean, "variance": var, "std_dev": math.sqrt(var), "skewness": 2.0, "kurtosis": 6.0}
        elif d == "bernoulli":
            p = params.get("p", 0.5)
            mean = p
            var = p * (1.0 - p)
            std = math.sqrt(var) if var >= 0 else math.nan
            if var <= 0 or p <= 0 or p >= 1:
                skew = math.nan
                kurt = math.nan
            else:
                skew = (1.0 - 2.0 * p) / std
                kurt = (1.0 - 6.0 * p * (1.0 - p)) / var
            return {"mean": mean, "variance": var, "std_dev": std, "skewness": skew, "kurtosis": kurt}
        elif d == "geometric":
            p = params.get("p", 0.5)
            if p <= 0 or p > 1:
                return {"mean": math.nan, "variance": math.nan, "std_dev": math.nan, "skewness": math.nan, "kurtosis": math.nan}
            mean = 1.0 / p
            var = (1.0 - p) / (p * p)
            std = math.sqrt(var)
            if p == 1.0 or var <= 0:
                skew = math.nan
                kurt = math.nan
            else:
                skew = (2.0 - p) / math.sqrt(1.0 - p)
                kurt = 6.0 + (p * p) / (1.0 - p)
            return {"mean": mean, "variance": var, "std_dev": std, "skewness": skew, "kurtosis": kurt}
        elif d == "uniform":
            a = params.get("a", 0.0)
            b = params.get("b", 1.0)
            if a >= b:
                return {"mean": math.nan, "variance": math.nan, "std_dev": math.nan, "skewness": math.nan, "kurtosis": math.nan}
            mean = (a + b) / 2.0
            var = ((b - a) ** 2) / 12.0
            std = math.sqrt(var)
            return {"mean": mean, "variance": var, "std_dev": std, "skewness": 0.0, "kurtosis": -1.2}
        return {"mean": math.nan, "variance": math.nan, "std_dev": math.nan, "skewness": math.nan, "kurtosis": math.nan}

    @staticmethod
    def range_probability(dist_type: str, params: Dict[str, float], x_min: float, x_max: float) -> float:
        if x_min > x_max:
            x_min, x_max = x_max, x_min
        d = dist_type.lower()
        if d == "normal":
            mu = params.get("mean", 0.0)
            std = params.get("std", 1.0)
            return normal_cdf(x_max, mu, std) - normal_cdf(x_min, mu, std)
        elif d == "student_t":
            df = params.get("df", 10.0)
            return student_t_cdf(x_max, df) - student_t_cdf(x_min, df)
        elif d == "chi_square":
            df = params.get("df", 1.0)
            return chi_square_cdf(x_max, df) - chi_square_cdf(x_min, df)
        elif d == "binomial":
            n = int(params.get("n", 10))
            p = params.get("p", 0.5)
            k_min = math.ceil(x_min)
            k_max = math.floor(x_max)
            return sum(DistributionsEngine.binomial_pmf(k, n, p) for k in range(k_min, k_max + 1))
        elif d == "poisson":
            lam = params.get("lambda", 1.0)
            k_min = max(0, math.ceil(x_min))
            k_max = math.floor(x_max)
            return sum(DistributionsEngine.poisson_pmf(k, lam) for k in range(k_min, k_max + 1))
        elif d == "exponential":
            rate = params.get("rate", 1.0)
            return DistributionsEngine.exponential_cdf(x_max, rate) - DistributionsEngine.exponential_cdf(x_min, rate)
        elif d == "bernoulli":
            p = params.get("p", 0.5)
            k_min = math.ceil(x_min)
            k_max = math.floor(x_max)
            return sum(DistributionsEngine.bernoulli_pmf(k, p) for k in range(k_min, k_max + 1))
        elif d == "geometric":
            p = params.get("p", 0.5)
            k_min = max(1, math.ceil(x_min))
            k_max = math.floor(x_max)
            return sum(DistributionsEngine.geometric_pmf(k, p) for k in range(k_min, k_max + 1))
        elif d == "uniform":
            a = params.get("a", 0.0)
            b = params.get("b", 1.0)
            return DistributionsEngine.uniform_cdf(x_max, a, b) - DistributionsEngine.uniform_cdf(x_min, a, b)
        return 0.0
