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

/**
 * Multiplies a matrix by a scalar: k * A.
 */
export function scaleMatrix(mat: Matrix, scalar: number): Matrix {
  return mat.map((row) => row.map((val) => val * scalar));
}

/**
 * Computes the trace of a square matrix: sum of diagonal elements.
 */
export function matrixTrace(mat: Matrix): number | null {
  const check = validateMatrix(mat);
  if (!check.valid || check.rows !== check.cols) return null;
  let tr = 0;
  for (let i = 0; i < check.rows; i++) {
    tr += mat[i][i];
  }
  return tr;
}

/**
 * Computes the rank of a matrix using Gaussian row echelon elimination with partial pivoting.
 */
export function matrixRank(mat: Matrix, tol: number = 1e-10): number {
  const check = validateMatrix(mat);
  if (!check.valid) return 0;

  const rows = check.rows;
  const cols = check.cols;
  const A = mat.map((row) => [...row]);

  let rank = 0;
  let col = 0;

  for (let row = 0; row < rows && col < cols; col++) {
    // Find pivot in current column
    let pivotRow = row;
    for (let i = row + 1; i < rows; i++) {
      if (Math.abs(A[i][col]) > Math.abs(A[pivotRow][col])) {
        pivotRow = i;
      }
    }

    if (Math.abs(A[pivotRow][col]) <= tol) {
      continue; // No pivot in this column, move to next column
    }

    // Swap pivot row
    if (pivotRow !== row) {
      const tmp = A[row];
      A[row] = A[pivotRow];
      A[pivotRow] = tmp;
    }

    // Eliminate below
    for (let i = row + 1; i < rows; i++) {
      const factor = A[i][col] / A[row][col];
      for (let j = col; j < cols; j++) {
        A[i][j] -= factor * A[row][j];
      }
    }

    rank++;
    row++;
  }

  return rank;
}

/**
 * Computes integer matrix power A^k for square matrix.
 */
export function matrixPower(mat: Matrix, power: number): Matrix | null {
  const check = validateMatrix(mat);
  if (!check.valid || check.rows !== check.cols || !Number.isInteger(power) || power < 0) {
    return null;
  }

  const n = check.rows;
  if (power === 0) {
    // Identity matrix
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => (r === c ? 1 : 0))
    );
  }

  let result: Matrix = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => (r === c ? 1 : 0))
  );
  let base = mat.map((row) => [...row]);
  let p = power;

  // Exponentiation by squaring
  while (p > 0) {
    if (p % 2 === 1) {
      const mul = multiplyMatrices(result, base);
      if (!mul) return null;
      result = mul;
    }
    if (p > 1) {
      const sq = multiplyMatrices(base, base);
      if (!sq) return null;
      base = sq;
    }
    p = Math.floor(p / 2);
  }

  return result;
}

export interface QRDecompositionResult {
  Q: Matrix;
  R: Matrix;
}

/**
 * Computes QR decomposition of matrix A (m x n, m >= n) using Gram-Schmidt orthogonalization: A = Q * R.
 */
export function decomposeQR(mat: Matrix): QRDecompositionResult | null {
  const check = validateMatrix(mat);
  if (!check.valid || check.rows < check.cols) return null;

  const m = check.rows;
  const n = check.cols;

  const Q: Matrix = Array.from({ length: m }, () => Array(n).fill(0));
  const R: Matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (let j = 0; j < n; j++) {
    // v = a_j
    const v = Array.from({ length: m }, (_, i) => mat[i][j]);

    for (let i = 0; i < j; i++) {
      // R[i][j] = q_i . a_j
      let dot = 0;
      for (let k = 0; k < m; k++) {
        dot += Q[k][i] * mat[k][j];
      }
      R[i][j] = dot;

      // v = v - R[i][j] * q_i
      for (let k = 0; k < m; k++) {
        v[k] -= dot * Q[k][i];
      }
    }

    // R[j][j] = ||v||
    let norm = 0;
    for (let k = 0; k < m; k++) norm += v[k] * v[k];
    norm = Math.sqrt(norm);
    R[j][j] = norm;

    if (norm > 1e-12) {
      for (let k = 0; k < m; k++) {
        Q[k][j] = v[k] / norm;
      }
    }
  }

  return { Q, R };
}

/**
 * Computes Cholesky decomposition A = L * L^T for symmetric positive-definite matrix.
 */
export function decomposeCholesky(mat: Matrix): Matrix | null {
  const check = validateMatrix(mat);
  if (!check.valid || check.rows !== check.cols) return null;

  const n = check.rows;
  const L: Matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }

      if (i === j) {
        const val = mat[i][i] - sum;
        if (val <= 0) {
          return null; // Not positive definite
        }
        L[i][j] = Math.sqrt(val);
      } else {
        if (Math.abs(L[j][j]) < 1e-12) return null;
        L[i][j] = (mat[i][j] - sum) / L[j][j];
      }
    }
  }

  return L;
}

/**
 * Computes eigenvalues of a 2x2 matrix analytically: λ² - tr(A)λ + det(A) = 0.
 */
export function eigenvalues2x2(mat: Matrix): { re: number; im: number }[] | null {
  const check = validateMatrix(mat);
  if (!check.valid || check.rows !== 2 || check.cols !== 2) return null;

  const tr = mat[0][0] + mat[1][1];
  const det = mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];
  const disc = tr * tr - 4 * det;

  if (disc >= 0) {
    const sqrtD = Math.sqrt(disc);
    return [
      { re: (tr + sqrtD) / 2, im: 0 },
      { re: (tr - sqrtD) / 2, im: 0 },
    ];
  } else {
    const sqrtAbsD = Math.sqrt(-disc);
    return [
      { re: tr / 2, im: sqrtAbsD / 2 },
      { re: tr / 2, im: -sqrtAbsD / 2 },
    ];
  }
}

/**
 * Computes Frobenius norm of a matrix: sqrt(sum(a_ij^2))
 */
export function matrixFrobeniusNorm(mat: Matrix): number {
  let sumSq = 0;
  for (const row of mat) {
    for (const val of row) {
      sumSq += val * val;
    }
  }
  return Math.sqrt(sumSq);
}
