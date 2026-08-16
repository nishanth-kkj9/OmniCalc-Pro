from typing import Dict, List, Union
import numpy as np
import pandas as pd


Number = Union[int, float]


class StatisticsEngine:
    @staticmethod
    def analyze(data_list: List[Number]) -> Dict[str, float]:
        arr = np.array(data_list, dtype=float)
        return {
            "Count": float(len(arr)),
            "Sum": float(np.sum(arr)),
            "Mean": float(np.mean(arr)),
            "Median": float(np.median(arr)),
            "Mode": float(pd.Series(arr).mode()[0]),
            "Std Dev": float(np.std(arr)),
            "Variance": float(np.var(arr)),
            "Min": float(np.min(arr)),
            "Max": float(np.max(arr))
        }
