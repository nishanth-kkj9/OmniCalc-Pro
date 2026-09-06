from typing import Dict, List, Union
import statistics
import numpy as np


Number = Union[int, float]


class StatisticsEngine:
    @staticmethod
    def analyze(data_list: List[Number]) -> Dict[str, float]:
        if not data_list:
            return {}
        arr = np.array(data_list, dtype=float)
        n = len(arr)
        modes = statistics.multimode(data_list)
        mode_val = float(modes[0]) if modes else float(np.nan)
        sorted_arr = np.sort(arr)

        pop_std = float(np.std(arr))
        pop_var = float(np.var(arr))
        sample_std = float(np.std(arr, ddof=1)) if n > 1 else 0.0
        sample_var = float(np.var(arr, ddof=1)) if n > 1 else 0.0
        q1 = float(np.percentile(sorted_arr, 25))
        q3 = float(np.percentile(sorted_arr, 75))
        min_val = float(np.min(arr))
        max_val = float(np.max(arr))

        return {
            "Count": float(n),
            "Sum": float(np.sum(arr)),
            "Mean": float(np.mean(arr)),
            "Median": float(np.median(arr)),
            "Mode": mode_val,
            "Std Dev": pop_std,
            "Sample Std Dev": sample_std,
            "Variance": pop_var,
            "Sample Variance": sample_var,
            "Min": min_val,
            "Max": max_val,
            "Range": max_val - min_val,
            "IQR": q3 - q1,
            "Q1": q1,
            "Q3": q3,
        }
