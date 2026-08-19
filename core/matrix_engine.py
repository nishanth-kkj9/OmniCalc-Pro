import numpy as np
import numpy.typing as npt
from numpy.linalg import LinAlgError


class MatrixError(ValueError):
    """Raised for malformed matrix input or invalid linear algebra operations."""


class MatrixEngine:
    @staticmethod
    def parse(text: str) -> npt.NDArray[np.float64]:
        rows = text.split(';')
        mat = []
        width: int | None = None
        for r in rows:
            if not r.strip():
                continue
            cells = [x.strip() for x in r.split(',')]
            try:
                row = [float(x) for x in cells]
            except ValueError as e:
                raise MatrixError(f"Non-numeric cell in row {r!r}: {e}") from e
            if width is None:
                width = len(row)
            elif len(row) != width:
                raise MatrixError(f"Ragged matrix: row width {len(row)} != expected {width}")
            mat.append(row)
        if not mat:
            raise MatrixError("Empty matrix")
        return np.array(mat, dtype=float)

    @staticmethod
    def add(a: npt.NDArray, b: npt.NDArray) -> npt.NDArray:
        if a.shape != b.shape:
            raise MatrixError(f"Shape mismatch for add: {a.shape} vs {b.shape}")
        return a + b

    @staticmethod
    def sub(a: npt.NDArray, b: npt.NDArray) -> npt.NDArray:
        if a.shape != b.shape:
            raise MatrixError(f"Shape mismatch for sub: {a.shape} vs {b.shape}")
        return a - b

    @staticmethod
    def mul(a: npt.NDArray, b: npt.NDArray) -> npt.NDArray:
        if a.ndim != 2 or b.ndim != 2 or a.shape[1] != b.shape[0]:
            raise MatrixError(f"Cannot multiply: {a.shape} x {b.shape}")
        return np.dot(a, b)

    @staticmethod
    def det(a: npt.NDArray) -> float:
        if a.ndim != 2 or a.shape[0] != a.shape[1]:
            raise MatrixError(f"Determinant requires a square matrix, got shape {a.shape}")
        try:
            return float(np.linalg.det(a))
        except LinAlgError as e:
            raise MatrixError(f"Could not compute determinant: {e}") from e

    @staticmethod
    def inv(a: npt.NDArray) -> npt.NDArray:
        if a.ndim != 2 or a.shape[0] != a.shape[1]:
            raise MatrixError(f"Inverse requires a square matrix, got shape {a.shape}")
        try:
            return np.linalg.inv(a)
        except LinAlgError as e:
            raise MatrixError(f"Matrix is singular (not invertible): {e}") from e

    @staticmethod
    def trans(a: npt.NDArray) -> npt.NDArray:
        return a.T
