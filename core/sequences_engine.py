"""
OmniCalc Pro Sequences Engine (Python Desktop Parity)
Supports Arithmetic, Geometric, Fibonacci, Harmonic, Explicit a_n = f(n),
and Recursive a_n = f(a_{n-1}) sequences, partial sum tracking,
formula generation, and convergence analysis.
"""

import math
from typing import List, Dict, Any, Optional
from core.safe_evaluator import safe_eval


class SequencesEngine:
    @staticmethod
    def arithmetic(a1: float, d: float, n_terms: int, start_n: int = 1) -> Dict[str, Any]:
        n_terms = max(1, min(500, int(n_terms)))
        terms = []
        running_sum = 0.0
        for i in range(n_terms):
            n = start_n + i
            an = a1 + (n - start_n) * d
            running_sum += an
            prev_an = terms[i - 1]["an"] if i > 0 else None
            terms.append({
                "n": n,
                "an": an,
                "Sn": running_sum,
                "diff": an - prev_an if prev_an is not None else None,
                "ratio": (an / prev_an) if (prev_an is not None and prev_an != 0) else None
            })

        is_convergent = (d == 0)
        sum_convergent = (a1 == 0 and d == 0)
        closed_form = f"a_n = {a1:g} + (n - {start_n:g})·({d:g})"
        sum_formula = f"S_n = (n/2)·[2·{a1:g} + (n-1)·{d:g}]"

        return {
            "terms": terms,
            "closed_form": closed_form,
            "sum_formula": sum_formula,
            "convergence": {
                "is_convergent": is_convergent,
                "estimated_limit": a1 if is_convergent else None,
                "sum_convergent": sum_convergent,
                "estimated_sum": 0.0 if sum_convergent else None,
                "notes": [
                    f"Arithmetic sequence with common difference d = {d:g}.",
                    "Trivially constant sequence." if d == 0 else "Sequence diverges as n → ∞."
                ]
            }
        }

    @staticmethod
    def geometric(a1: float, r: float, n_terms: int, start_n: int = 1) -> Dict[str, Any]:
        n_terms = max(1, min(500, int(n_terms)))
        terms = []
        running_sum = 0.0
        for i in range(n_terms):
            n = start_n + i
            an = a1 * (r ** (n - start_n))
            running_sum += an
            prev_an = terms[i - 1]["an"] if i > 0 else None
            terms.append({
                "n": n,
                "an": an,
                "Sn": running_sum,
                "diff": an - prev_an if prev_an is not None else None,
                "ratio": (an / prev_an) if (prev_an is not None and prev_an != 0) else None
            })

        sum_convergent = abs(r) < 1.0
        inf_sum = (a1 / (1.0 - r)) if sum_convergent else None
        closed_form = f"a_n = {a1:g} · ({r:g})^(n - {start_n:g})"
        sum_formula = f"S_n = {a1:g}·(1 - ({r:g})^n) / (1 - {r:g})" if r != 1 else f"S_n = {a1:g}·n"

        notes = [f"Geometric progression with common ratio r = {r:g}."]
        if sum_convergent:
            notes.append(f"Infinite Series converges to S_∞ = a1 / (1 - r) = {inf_sum:.8g}.")
        else:
            notes.append("Infinite Series diverges because |r| ≥ 1.")

        return {
            "terms": terms,
            "closed_form": closed_form,
            "sum_formula": sum_formula,
            "convergence": {
                "is_convergent": abs(r) < 1.0 or (r == 1.0 and a1 != 0),
                "estimated_limit": 0.0 if abs(r) < 1.0 else (a1 if r == 1.0 else None),
                "sum_convergent": sum_convergent,
                "estimated_sum": inf_sum,
                "notes": notes
            }
        }

    @staticmethod
    def fibonacci(n_terms: int) -> Dict[str, Any]:
        n_terms = max(1, min(500, int(n_terms)))
        terms = []
        running_sum = 0.0
        a, b = 1.0, 1.0
        for i in range(n_terms):
            n = i + 1
            if n == 1:
                an = 1.0
            elif n == 2:
                an = 1.0
            else:
                an = terms[-1]["an"] + terms[-2]["an"]
            running_sum += an
            prev_an = terms[i - 1]["an"] if i > 0 else None
            terms.append({
                "n": n,
                "an": an,
                "Sn": running_sum,
                "diff": an - prev_an if prev_an is not None else None,
                "ratio": (an / prev_an) if (prev_an is not None and prev_an != 0) else None
            })

        golden_ratio = (1.0 + math.sqrt(5.0)) / 2.0
        return {
            "terms": terms,
            "closed_form": "a_n = [φ^n - (1-φ)^n] / √5, where φ = (1+√5)/2 ≈ 1.61803398",
            "convergence": {
                "is_convergent": False,
                "estimated_limit": None,
                "sum_convergent": False,
                "notes": [
                    "Fibonacci sequence grows exponentially.",
                    f"Ratio of consecutive terms a_n/a_{{n-1}} converges to Golden Ratio φ ≈ {golden_ratio:.8g}."
                ]
            }
        }

    @staticmethod
    def harmonic(n_terms: int, a: float = 1.0, d: float = 1.0) -> Dict[str, Any]:
        """Harmonic sequence: a_n = 1 / (a + (n-1)*d)"""
        n_terms = max(1, min(500, int(n_terms)))
        terms = []
        running_sum = 0.0
        for i in range(n_terms):
            n = i + 1
            denom = a + (n - 1) * d
            if denom == 0:
                raise ZeroDivisionError(f"Harmonic sequence denominator is zero at n = {n}")
            an = 1.0 / denom
            running_sum += an
            prev_an = terms[i - 1]["an"] if i > 0 else None
            terms.append({
                "n": n,
                "an": an,
                "Sn": running_sum,
                "diff": an - prev_an if prev_an is not None else None,
                "ratio": (an / prev_an) if (prev_an is not None and prev_an != 0) else None
            })

        return {
            "terms": terms,
            "closed_form": f"a_n = 1 / ({a:g} + (n-1)·{d:g})",
            "convergence": {
                "is_convergent": True,
                "estimated_limit": 0.0,
                "sum_convergent": False,
                "notes": [
                    "Harmonic sequence terms a_n → 0 as n → ∞.",
                    "The harmonic series ∑(1/n) diverges logarithmically (S_n ~ ln n)."
                ]
            }
        }

    @staticmethod
    def explicit(expr: str, n_terms: int, start_n: int = 1) -> Dict[str, Any]:
        """Evaluates an explicit sequence formula a_n = f(n)."""
        n_terms = max(1, min(500, int(n_terms)))
        terms = []
        running_sum = 0.0

        for i in range(n_terms):
            n = start_n + i
            an = float(safe_eval(expr, {"n": float(n)}))
            running_sum += an
            prev_an = terms[i - 1]["an"] if i > 0 else None
            terms.append({
                "n": n,
                "an": an,
                "Sn": running_sum,
                "diff": an - prev_an if prev_an is not None else None,
                "ratio": (an / prev_an) if (prev_an is not None and prev_an != 0) else None
            })

        # Convergence limit check using the last term and ratio
        last_an = terms[-1]["an"]
        second_last_an = terms[-2]["an"] if len(terms) >= 2 else last_an
        ratio = (last_an / second_last_an) if second_last_an != 0 else 0

        is_conv = abs(last_an - second_last_an) < 1e-4
        return {
            "terms": terms,
            "closed_form": f"a_n = {expr}",
            "convergence": {
                "is_convergent": is_conv,
                "estimated_limit": last_an if is_conv else None,
                "notes": [
                    f"Explicit expression evaluated for n from {start_n} to {start_n + n_terms - 1}.",
                    f"Last computed term a_{start_n + n_terms - 1} = {last_an:.8g}."
                ]
            }
        }

    @staticmethod
    def recursive(expr: str, initial_terms: List[float], n_terms: int) -> Dict[str, Any]:
        """
        Evaluates a recursive sequence where expression can use:
        a_prev (or a_prev1) for a_{n-1}, a_prev2 for a_{n-2}, and n.
        """
        n_terms = max(1, min(500, int(n_terms)))
        if not initial_terms:
            initial_terms = [1.0]

        terms = []
        running_sum = 0.0

        for i in range(n_terms):
            n = i + 1
            if i < len(initial_terms):
                an = float(initial_terms[i])
            else:
                a_prev1 = terms[-1]["an"]
                a_prev2 = terms[-2]["an"] if len(terms) >= 2 else a_prev1
                scope = {
                    "a_prev": a_prev1,
                    "a_prev1": a_prev1,
                    "a_prev2": a_prev2,
                    "n": float(n)
                }
                an = float(safe_eval(expr, scope))

            running_sum += an
            prev_an = terms[i - 1]["an"] if i > 0 else None
            terms.append({
                "n": n,
                "an": an,
                "Sn": running_sum,
                "diff": an - prev_an if prev_an is not None else None,
                "ratio": (an / prev_an) if (prev_an is not None and prev_an != 0) else None
            })

        return {
            "terms": terms,
            "closed_form": f"Recursive: a_n = f(a_{{n-1}}) = {expr}",
            "convergence": {
                "is_convergent": False,
                "estimated_limit": None,
                "notes": [
                    f"Recursive relation computed with initial values {initial_terms}."
                ]
            }
        }
