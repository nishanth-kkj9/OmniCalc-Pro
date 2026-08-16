import numpy as np
import numpy.typing as npt


class MatrixEngine:
    @staticmethod
    def parse(text: str) -> npt.NDArray[np.float64]:
        rows = text.split(';')
        mat = []
        for r in rows:
            mat.append([float(x.strip()) for x in r.split(',')])
        return np.array(mat)

    @staticmethod
    def add(a: npt.NDArray, b: npt.NDArray) -> npt.NDArray:
        return a + b

    @staticmethod
    def sub(a: npt.NDArray, b: npt.NDArray) -> npt.NDArray:
        return a - b

    @staticmethod
    def mul(a: npt.NDArray, b: npt.NDArray) -> npt.NDArray:
        return np.dot(a, b)

    @staticmethod
    def det(a: npt.NDArray) -> float:
        return np.linalg.det(a)

    @staticmethod
    def inv(a: npt.NDArray) -> npt.NDArray:
        return np.linalg.inv(a)

    @staticmethod
    def trans(a: npt.NDArray) -> npt.NDArray:
        return a.T
