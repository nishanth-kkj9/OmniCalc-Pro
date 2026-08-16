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
        modes = statistics.multimode(data_list)
        mode_val = float(modes[0]) if modes else float(np.nan)
        return {
            "Count": float(len(arr)),
            "Sum": float(np.sum(arr)),
            "Mean": float(np.mean(arr)),
            "Median": float(np.median(arr)),
            "Mode": mode_val,
            "Std Dev": float(np.std(arr)),
            "Variance": float(np.var(arr)),
            "Min": float(np.min(arr)),
            "Max": float(np.max(arr)),
        }
