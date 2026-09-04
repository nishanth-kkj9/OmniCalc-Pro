"""
OmniCalc Pro Probability Distributions Engine (Python Desktop Parity)
"""

import math
from typing import Dict, Any


class DistributionsEngine:
    @staticmethod
    def normal_pdf(x: float, mean: float = 0.0, std: float = 1.0) -> float:
        if std <= 0:
            raise ValueError("Standard deviation must be > 0.")
        z = (x - mean) / std
        return (1.0 / (std * math.sqrt(2 * math.pi))) * math.exp(-0.5 * z * z)

    @staticmethod
    def normal_cdf(x: float, mean: float = 0.0, std: float = 1.0) -> float:
        if std <= 0:
            raise ValueError("Standard deviation must be > 0.")
        z = (x - mean) / std
        return 0.5 * (1.0 + math.erf(z / math.sqrt(2)))

    @staticmethod
    def binomial_pmf(k: int, n: int, p: float) -> float:
        if not (0 <= k <= n) or not (0.0 <= p <= 1.0):
            return 0.0
        comb = math.comb(n, k)
        return comb * (p ** k) * ((1.0 - p) ** (n - k))

    @staticmethod
    def poisson_pmf(k: int, lambda_val: float) -> float:
        if k < 0 or lambda_val <= 0:
            return 0.0
        return (math.exp(-lambda_val) * (lambda_val ** k)) / math.factorial(k)
