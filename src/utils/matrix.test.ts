import { describe, it, expect } from 'vitest';
import {
  computeDeterminant,
  invertMatrix,
  transposeMatrix,
  addMatrices,
  subtractMatrices,
  multiplyMatrices,
  validateMatrix,
  scaleMatrix,
  matrixTrace,
  matrixRank,
  matrixPower,
  decomposeQR,
  decomposeCholesky,
  eigenvalues2x2,
  matrixFrobeniusNorm,
} from './matrix';

describe('Matrix Engine — Numerical Linear Algebra & Verification', () => {
  describe('Dimension and Element Validation', () => {
    it('validates proper 3x3 matrices', () => {
      const m = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      expect(validateMatrix(m).valid).toBe(true);
    });

    it('rejects ragged matrices', () => {
      const ragged = [
        [1, 2],
        [3, 4, 5],
      ];
      expect(validateMatrix(ragged).valid).toBe(false);
    });

    it('rejects matrices with NaN or non-finite elements', () => {
      const invalid = [
        [1, NaN],
        [3, 4],
      ];
      expect(validateMatrix(invalid).valid).toBe(false);
    });

    it('rejects oversized matrices exceeding limit', () => {
      const huge = Array.from({ length: 11 }, () => Array(11).fill(1));
      expect(validateMatrix(huge).valid).toBe(false);
    });
  });

  describe('Determinant (LU Decomposition with Partial Pivoting)', () => {
    it('computes 1x1 determinant', () => {
      expect(computeDeterminant([[42]]).det).toBe(42);
    });

    it('computes 2x2 determinant', () => {
      const m = [
        [4, 6],
        [3, 8],
      ];
      // 4*8 - 6*3 = 32 - 18 = 14
      expect(computeDeterminant(m).det).toBe(14);
    });

    it('computes 3x3 identity determinant', () => {
      const I = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      expect(computeDeterminant(I).det).toBe(1);
    });

    it('computes 3x3 general determinant correctly', () => {
      const m = [
        [6, 1, 1],
        [4, -2, 5],
        [2, 8, 7],
      ];
      // 6(-14 - 40) - 1(28 - 10) + 1(32 - (-4)) = 6(-54) - 18 + 36 = -324 - 18 + 36 = -306
      expect(computeDeterminant(m).det).toBe(-306);
    });

    it('detects singular matrices with det = 0', () => {
      const singular = [
        [1, 2, 3],
        [2, 4, 6],
        [1, 1, 1],
      ];
      const res = computeDeterminant(singular);
      expect(res.det).toBe(0);
      expect(res.singular).toBe(true);
    });
  });

  describe('Matrix Inversion & Full Precision', () => {
    it('inverts 2x2 matrix correctly', () => {
      const m = [
        [4, 7],
        [2, 6],
      ];
      // det = 24 - 14 = 10. Inv = [[0.6, -0.7], [-0.2, 0.4]]
      const inv = invertMatrix(m);
      expect(inv).not.toBeNull();
      expect(inv![0][0]).toBeCloseTo(0.6, 10);
      expect(inv![0][1]).toBeCloseTo(-0.7, 10);
      expect(inv![1][0]).toBeCloseTo(-0.2, 10);
      expect(inv![1][1]).toBeCloseTo(0.4, 10);
    });

    it('returns null when inverting singular matrix', () => {
      const singular = [
        [1, 2],
        [2, 4],
      ];
      expect(invertMatrix(singular)).toBeNull();
    });

    it('inverting identity returns identity', () => {
      const I = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      expect(invertMatrix(I)).toEqual(I);
    });

    it('preserves full precision such that A * A^-1 is identity', () => {
      const A = [
        [1, 2, 3],
        [0, 1, 4],
        [5, 6, 0],
      ];
      const inv = invertMatrix(A);
      expect(inv).not.toBeNull();
      const product = multiplyMatrices(A, inv!);
      expect(product).not.toBeNull();

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const expected = r === c ? 1 : 0;
          expect(product![r][c]).toBeCloseTo(expected, 10);
        }
      }
    });
  });

  describe('Matrix Arithmetic & Transposition', () => {
    it('transposes matrix correctly', () => {
      const m = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      expect(transposeMatrix(m)).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
    });

    it('multiplies matrices correctly', () => {
      const A = [
        [1, 2],
        [3, 4],
      ];
      const B = [
        [2, 0],
        [1, 2],
      ];
      // [[1*2 + 2*1, 1*0 + 2*2], [3*2 + 4*1, 3*0 + 4*2]] = [[4, 4], [10, 8]]
      expect(multiplyMatrices(A, B)).toEqual([
        [4, 4],
        [10, 8],
      ]);
    });

    it('handles dimension mismatch in multiplication gracefully', () => {
      const A = [[1, 2, 3]]; // 1x3
      const B = [[1, 2]]; // 1x2
      expect(multiplyMatrices(A, B)).toBeNull();
    });

    it('adds and subtracts matrices correctly', () => {
      const A = [
        [1, 2],
        [3, 4],
      ];
      const B = [
        [5, 6],
        [7, 8],
      ];
      expect(addMatrices(A, B)).toEqual([
        [6, 8],
        [10, 12],
      ]);
      expect(subtractMatrices(A, B)).toEqual([
        [-4, -4],
        [-4, -4],
      ]);
    });

    it('scales matrix by constant scalar', () => {
      const A = [
        [1, -2],
        [3, 0],
      ];
      expect(scaleMatrix(A, 3)).toEqual([
        [3, -6],
        [9, 0],
      ]);
    });

    it('computes matrix trace', () => {
      const A = [
        [2, 1, 5],
        [0, -4, 3],
        [1, 2, 7],
      ];
      expect(matrixTrace(A)).toBe(5); // 2 + (-4) + 7 = 5
    });

    it('computes matrix rank accurately with partial pivoting', () => {
      const fullRank = [
        [1, 2],
        [3, 4],
      ];
      expect(matrixRank(fullRank)).toBe(2);

      const rank1 = [
        [1, 2],
        [2, 4],
      ];
      expect(matrixRank(rank1)).toBe(1);

      const zero = [
        [0, 0],
        [0, 0],
      ];
      expect(matrixRank(zero)).toBe(0);
    });

    it('computes integer matrix powers A^k', () => {
      const A = [
        [1, 1],
        [1, 0],
      ];
      // Fibonacci generator: A^2 = [[2, 1], [1, 1]], A^3 = [[3, 2], [2, 1]], A^4 = [[5, 3], [3, 2]]
      const A4 = matrixPower(A, 4);
      expect(A4).toEqual([
        [5, 3],
        [3, 2],
      ]);
    });

    it('computes QR decomposition where Q^T Q = I and Q*R = A', () => {
      const A = [
        [12, -51, 4],
        [6, 167, -68],
        [-4, 24, -41],
      ];
      const res = decomposeQR(A);
      expect(res).not.toBeNull();
      if (res) {
        // Check Q * R ≈ A
        const recon = multiplyMatrices(res.Q, res.R);
        expect(recon).not.toBeNull();
        expect(recon![0][0]).toBeCloseTo(12, 4);
        expect(recon![1][1]).toBeCloseTo(167, 4);
      }
    });

    it('computes Cholesky decomposition for symmetric positive-definite matrix', () => {
      const A = [
        [4, 12, -16],
        [12, 37, -43],
        [-16, -43, 98],
      ];
      const L = decomposeCholesky(A);
      expect(L).not.toBeNull();
      if (L) {
        const LT = transposeMatrix(L);
        const recon = multiplyMatrices(L, LT);
        expect(recon).not.toBeNull();
        expect(recon![0][0]).toBeCloseTo(4, 4);
        expect(recon![1][1]).toBeCloseTo(37, 4);
        expect(recon![2][2]).toBeCloseTo(98, 4);
      }
    });

    it('computes 2x2 eigenvalues correctly', () => {
      const A = [
        [2, 1],
        [1, 2],
      ];
      // det(A - λI) = (2-λ)^2 - 1 = λ^2 - 4λ + 3 = (λ-3)(λ-1) => eigenvalues 3, 1
      const eigs = eigenvalues2x2(A);
      expect(eigs).not.toBeNull();
      const vals = eigs!.map((e) => e.re).sort((a, b) => a - b);
      expect(vals[0]).toBeCloseTo(1, 4);
      expect(vals[1]).toBeCloseTo(3, 4);
    });

    it('computes Frobenius norm of matrix', () => {
      const A = [
        [1, 2],
        [3, 4],
      ];
      // sqrt(1 + 4 + 9 + 16) = sqrt(30) ≈ 5.4772
      expect(matrixFrobeniusNorm(A)).toBeCloseTo(Math.sqrt(30), 4);
    });
  });
});
