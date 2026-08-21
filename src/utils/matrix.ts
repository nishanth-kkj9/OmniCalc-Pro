/**
 * High-performance, numerically stable Matrix linear algebra algorithms for OmniCalc Pro.
 * Replaces recursive Laplace expansion (O(N!)) with LU Decomposition / Gaussian Elimination (O(N^3))
 * with partial pivoting for numerical stability and zero-division resistance.
 * Preserves full IEEE 754 float64 precision; display formatting is handled in the UI layer.
 */

import { MAX_MATRIX_DIMENSION, NUMERICAL_EPSILON } from '../constants/limits';

export type Matrix = number[][];

export interface LUDecompositionResult {
  L: Matrix;
  U: Matrix;
  P: number[]; // Permutation vector
  pivotSign: number; // +1 or -1
}

/**
 * Validates matrix dimensions and returns bounds.
 */
export function validateMatrix(m: Matrix): {
  valid: boolean;
  rows: number;
  cols: number;
  error?: string;
} {
  if (!Array.isArray(m) || m.length === 0 || !Array.isArray(m[0])) {
    return { valid: false, rows: 0, cols: 0, error: 'Invalid or empty matrix structure.' };
  }
  const rows = m.length;
  const cols = m[0].length;

  if (rows > MAX_MATRIX_DIMENSION || cols > MAX_MATRIX_DIMENSION) {
    return {
      valid: false,
      rows,
      cols,
      error: `Matrix dimension exceeds maximum limit of ${MAX_MATRIX_DIMENSION}x${MAX_MATRIX_DIMENSION}.`,
    };
  }

  for (let r = 0; r < rows; r++) {
    if (!Array.isArray(m[r]) || m[r].length !== cols) {
      return { valid: false, rows, cols, error: 'Matrix rows must have equal column counts.' };
    }
    for (let c = 0; c < cols; c++) {
      if (typeof m[r][c] !== 'number' || isNaN(m[r][c]) || !isFinite(m[r][c])) {
        return { valid: false, rows, cols, error: `Invalid matrix element at [${r}, ${c}].` };
      }
    }
  }

  return { valid: true, rows, cols };
}

/**
 * Computes LU decomposition with partial pivoting: P * A = L * U
 * Complexity: O(N^3)
 */
export function decomposeLU(mat: Matrix): LUDecompositionResult | null {
  const check = validateMatrix(mat);
  if (!check.valid || check.rows !== check.cols) return null;

  const n = check.rows;
  const A = mat.map((row) => [...row]);
  const P = Array.from({ length: n }, (_, i) => i);
  let pivotSign = 1;

  for (let k = 0; k < n; k++) {
    // Partial pivoting: find maximum element in current column
    let maxVal = Math.abs(A[k][k]);
    let maxRow = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(A[i][k]) > maxVal) {
        maxVal = Math.abs(A[i][k]);
        maxRow = i;
      }
    }

    if (maxRow !== k) {
      // Swap rows in A
      const tmpRow = A[k];
      A[k] = A[maxRow];
      A[maxRow] = tmpRow;

      // Swap permutation index
      const tmpP = P[k];
      P[k] = P[maxRow];
      P[maxRow] = tmpP;

      pivotSign = -pivotSign;
    }

    // Singular matrix check
    if (Math.abs(A[k][k]) < NUMERICAL_EPSILON) {
      continue;
    }

    for (let i = k + 1; i < n; i++) {
      A[i][k] /= A[k][k];
      for (let j = k + 1; j < n; j++) {
        A[i][j] -= A[i][k] * A[k][j];
      }
    }
  }

  const L: Matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const U: Matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    L[i][i] = 1;
    for (let j = 0; j < n; j++) {
      if (i > j) {
        L[i][j] = A[i][j];
      } else {
        U[i][j] = A[i][j];
      }
    }
  }

  return { L, U, P, pivotSign };
}

/**
 * Computes determinant via LU decomposition.
 * Complexity: O(N^3) compared to O(N!) in Laplace expansion.
 */
export function computeDeterminant(mat: Matrix): { det: number; singular: boolean } {
  const check = validateMatrix(mat);
  if (!check.valid || check.rows !== check.cols) {
    return { det: NaN, singular: true };
  }

  const n = check.rows;
  if (n === 1) {
    const d = mat[0][0];
    return { det: d, singular: Math.abs(d) < NUMERICAL_EPSILON };
  }
  if (n === 2) {
    const d = mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];
    return { det: d, singular: Math.abs(d) < NUMERICAL_EPSILON };
  }

  const lu = decomposeLU(mat);
  if (!lu) return { det: NaN, singular: true };

  let det = lu.pivotSign;
  for (let i = 0; i < n; i++) {
    det *= lu.U[i][i];
  }

  // Handle tiny floating point artifacts near 0
  if (Math.abs(det) < NUMERICAL_EPSILON) {
    return { det: 0, singular: true };
  }

  return { det, singular: false };
}

/**
 * Computes matrix inverse via Gauss-Jordan elimination with partial pivoting.
 * Returns null if matrix is singular (det === 0).
 */
export function invertMatrix(mat: Matrix): Matrix | null {
  const check = validateMatrix(mat);
  if (!check.valid || check.rows !== check.cols) return null;

  const n = check.rows;
  // Augmented matrix [A | I]
  const aug: Matrix = Array.from({ length: n }, (_, r) => [
    ...mat[r],
    ...Array.from({ length: n }, (_, c) => (r === c ? 1 : 0)),
  ]);

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxEl = Math.abs(aug[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > maxEl) {
        maxEl = Math.abs(aug[k][i]);
        maxRow = k;
      }
    }

    if (maxEl < NUMERICAL_EPSILON) {
      return null; // Singular matrix
    }

    // Swap maximum row
    const tmp = aug[i];
    aug[i] = aug[maxRow];
    aug[maxRow] = tmp;

    // Normalize pivot row
    const pivot = aug[i][i];
    for (let j = 0; j < 2 * n; j++) {
      aug[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }
  }

  // Extract right-hand inverted matrix with full precision
  const inv: Matrix = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => aug[r][c + n])
  );

  return inv;
}

/**
 * Computes Matrix Transpose.
 */
export function transposeMatrix(mat: Matrix): Matrix {
  const rows = mat.length;
  const cols = mat[0].length;
  return Array.from({ length: cols }, (_, i) => Array.from({ length: rows }, (_, j) => mat[j][i]));
}

/**
 * Multiplies two matrices A * B.
 */
export function multiplyMatrices(a: Matrix, b: Matrix): Matrix | null {
  const checkA = validateMatrix(a);
  const checkB = validateMatrix(b);
  if (!checkA.valid || !checkB.valid || checkA.cols !== checkB.rows) {
    return null;
  }

  const rowsA = checkA.rows;
  const colsA = checkA.cols;
  const colsB = checkB.cols;

  const res: Matrix = Array.from({ length: rowsA }, () => Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += a[i][k] * b[k][j];
      }
      res[i][j] = sum;
    }
  }
  return res;
}

/**
 * Adds two matrices A + B.
 */
export function addMatrices(a: Matrix, b: Matrix): Matrix | null {
  const checkA = validateMatrix(a);
  const checkB = validateMatrix(b);
  if (
    !checkA.valid ||
    !checkB.valid ||
    checkA.rows !== checkB.rows ||
    checkA.cols !== checkB.cols
  ) {
    return null;
  }

  return a.map((row, r) => row.map((val, c) => val + b[r][c]));
}

/**
 * Subtracts two matrices A - B.
 */
export function subtractMatrices(a: Matrix, b: Matrix): Matrix | null {
  const checkA = validateMatrix(a);
  const checkB = validateMatrix(b);
  if (
    !checkA.valid ||
    !checkB.valid ||
    checkA.rows !== checkB.rows ||
    checkA.cols !== checkB.cols
  ) {
    return null;
  }

  return a.map((row, r) => row.map((val, c) => val - b[r][c]));
}
