/**
 * OmniCalc Pro Matrix & Linear Algebra Engine
 */

export interface EigenResult {
  real: number;
  imag: number;
}

/**
 * Determinant of an N x N square matrix
 */
export function matrixDet(m: number[][]): number {
  const n = m.length;
  if (n === 0 || m.some((row) => row.length !== n)) {
    throw new Error('Matrix must be square.');
  }

  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  if (n === 3) {
    return (
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
  }

  // Gaussian elimination with partial pivoting for N > 3
  const a = m.map((row) => [...row]);
  let det = 1;

  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(a[j][i]) > Math.abs(a[pivot][i])) {
        pivot = j;
      }
    }

    if (Math.abs(a[pivot][i]) < 1e-12) return 0;

    if (pivot !== i) {
      [a[i], a[pivot]] = [a[pivot], a[i]];
      det = -det;
    }

    det *= a[i][i];

    for (let j = i + 1; j < n; j++) {
      const factor = a[j][i] / a[i][i];
      for (let k = i + 1; k < n; k++) {
        a[j][k] -= factor * a[i][k];
      }
    }
  }

  return det;
}

/**
 * Trace of a square matrix: sum of diagonal elements
 */
export function matrixTrace(m: number[][]): number {
  const n = Math.min(m.length, m[0]?.length || 0);
  let tr = 0;
  for (let i = 0; i < n; i++) {
    tr += m[i][i];
  }
  return tr;
}

/**
 * Transpose of matrix M
 */
export function matrixTranspose(m: number[][]): number[][] {
  const rows = m.length;
  const cols = m[0]?.length || 0;
  const res: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const row: number[] = [];
    for (let r = 0; r < rows; r++) {
      row.push(m[r][c]);
    }
    res.push(row);
  }
  return res;
}

/**
 * Matrix addition A + B
 */
export function matrixAdd(a: number[][], b: number[][]): number[][] {
  return a.map((row, r) => row.map((val, c) => val + b[r][c]));
}

/**
 * Matrix subtraction A - B
 */
export function matrixSub(a: number[][], b: number[][]): number[][] {
  return a.map((row, r) => row.map((val, c) => val - b[r][c]));
}

/**
 * Matrix multiplication A * B
 */
export function matrixMul(a: number[][], b: number[][]): number[][] {
  const rA = a.length;
  const cA = a[0]?.length || 0;
  const cB = b[0]?.length || 0;

  const res: number[][] = [];
  for (let r = 0; r < rA; r++) {
    const row: number[] = [];
    for (let c = 0; c < cB; c++) {
      let sum = 0;
      for (let k = 0; k < cA; k++) {
        sum += a[r][k] * b[k][c];
      }
      row.push(sum);
    }
    res.push(row);
  }
  return res;
}

/**
 * Scalar multiplication k * A
 */
export function matrixScalarMul(a: number[][], k: number): number[][] {
  return a.map((row) => row.map((val) => val * k));
}

/**
 * Matrix power A^p (for integer p >= 0)
 */
export function matrixPower(a: number[][], p: number): number[][] {
  const n = a.length;
  if (p === 0) {
    // Identity matrix
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => (r === c ? 1 : 0))
    );
  }

  let result = a.map((row) => [...row]);
  for (let i = 1; i < p; i++) {
    result = matrixMul(result, a);
  }
  return result;
}

/**
 * Inverse of square matrix A
 */
export function matrixInverse(m: number[][]): number[][] {
  const n = m.length;
  const det = matrixDet(m);
  if (Math.abs(det) < 1e-12) {
    throw new Error('Matrix is singular and non-invertible (det = 0).');
  }

  if (n === 1) return [[1 / m[0][0]]];

  if (n === 2) {
    return [
      [m[1][1] / det, -m[0][1] / det],
      [-m[1][0] / det, m[0][0] / det],
    ];
  }

  // Gaussian elimination on augmented matrix [A | I]
  const aug: number[][] = m.map((row, r) => [
    ...row,
    ...Array.from({ length: n }, (_, c) => (r === c ? 1 : 0)),
  ]);

  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(aug[j][i]) > Math.abs(aug[pivot][i])) pivot = j;
    }

    if (pivot !== i) {
      [aug[i], aug[pivot]] = [aug[pivot], aug[i]];
    }

    const pivotVal = aug[i][i];
    for (let c = 0; c < 2 * n; c++) {
      aug[i][c] /= pivotVal;
    }

    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = aug[r][i];
        for (let c = 0; c < 2 * n; c++) {
          aug[r][c] -= factor * aug[i][c];
        }
      }
    }
  }

  return aug.map((row) => row.slice(n));
}

/**
 * Compute Reduced Row Echelon Form (RREF) and Matrix Rank
 */
export function matrixRREF(m: number[][]): { rref: number[][]; rank: number } {
  const rows = m.length;
  const cols = m[0]?.length || 0;
  const a = m.map((row) => [...row]);
  let lead = 0;
  let rank = 0;

  for (let r = 0; r < rows; r++) {
    if (cols <= lead) break;
    let i = r;
    while (Math.abs(a[i][lead]) < 1e-12) {
      i++;
      if (rows === i) {
        i = r;
        lead++;
        if (cols === lead) return { rref: a, rank };
      }
    }

    [a[i], a[r]] = [a[r], a[i]];

    const val = a[r][lead];
    if (Math.abs(val) > 1e-12) {
      for (let c = 0; c < cols; c++) {
        a[r][c] /= val;
      }
    }

    for (let j = 0; j < rows; j++) {
      if (j !== r) {
        const factor = a[j][lead];
        for (let c = 0; c < cols; c++) {
          a[j][c] -= factor * a[r][c];
        }
      }
    }
    lead++;
    rank++;
  }

  // Clean tiny floating point noise
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.abs(a[r][c]) < 1e-10) a[r][c] = 0;
    }
  }

  return { rref: a, rank };
}

/**
 * Eigenvalues of a 2x2 or 3x3 matrix
 */
export function matrixEigenvalues(m: number[][]): EigenResult[] {
  const n = m.length;
  if (n === 2) {
    const a = m[0][0];
    const b = m[0][1];
    const c = m[1][0];
    const d = m[1][1];

    const tr = a + d;
    const det = a * d - b * c;
    const disc = tr * tr - 4 * det;

    if (disc >= 0) {
      const sqrtD = Math.sqrt(disc);
      return [
        { real: (tr + sqrtD) / 2, imag: 0 },
        { real: (tr - sqrtD) / 2, imag: 0 },
      ];
    } else {
      const sqrtD = Math.sqrt(-disc);
      return [
        { real: tr / 2, imag: sqrtD / 2 },
        { real: tr / 2, imag: -sqrtD / 2 },
      ];
    }
  } else if (n === 3) {
    // Characteristic polynomial: λ³ - tr(A)λ² + M_trace λ - det(A) = 0
    const tr = matrixTrace(m);
    const det = matrixDet(m);
    // Sum of principal 2x2 minors
    const m1 = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    const m2 = m[1][1] * m[2][2] - m[1][2] * m[2][1];
    const m3 = m[0][0] * m[2][2] - m[0][2] * m[2][0];
    const sumMinors = m1 + m2 + m3;

    // Solve λ³ - c2 λ² + c1 λ - c0 = 0 with c2=tr, c1=sumMinors, c0=det
    // Use Cardano method for cubic equation
    const a = 1;
    const b = -tr;
    const c = sumMinors;
    const d = -det;

    // Depressed cubic t³ + pt + q = 0
    const p = (3 * a * c - b * b) / (3 * a * a);
    const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
    const delta = (q * q) / 4 + (p * p * p) / 27;

    const shift = -b / (3 * a);

    if (delta > 1e-12) {
      const u = Math.cbrt(-q / 2 + Math.sqrt(delta));
      const v = Math.cbrt(-q / 2 - Math.sqrt(delta));
      const realRoot = u + v + shift;
      const re = -(u + v) / 2 + shift;
      const im = ((u - v) * Math.sqrt(3)) / 2;
      return [
        { real: realRoot, imag: 0 },
        { real: re, imag: im },
        { real: re, imag: -im },
      ];
    } else if (Math.abs(delta) <= 1e-12) {
      const u = Math.cbrt(-q / 2);
      return [
        { real: 2 * u + shift, imag: 0 },
        { real: -u + shift, imag: 0 },
        { real: -u + shift, imag: 0 },
      ];
    } else {
      const r = Math.sqrt(-Math.pow(p / 3, 3));
      const phi = Math.acos(-q / (2 * r));
      const mVal = 2 * Math.cbrt(r);
      return [
        { real: mVal * Math.cos(phi / 3) + shift, imag: 0 },
        { real: mVal * Math.cos((phi + 2 * Math.PI) / 3) + shift, imag: 0 },
        { real: mVal * Math.cos((phi + 4 * Math.PI) / 3) + shift, imag: 0 },
      ];
    }
  }

  return [];
}
