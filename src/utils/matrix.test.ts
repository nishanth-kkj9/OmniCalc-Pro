import { describe, it, expect } from 'vitest';
import {
  computeDeterminant,
  invertMatrix,
  transposeMatrix,
  addMatrices,
  subtractMatrices,
  multiplyMatrices,
  validateMatrix,
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
      const huge = Array.from({ length: 6 }, () => Array(6).fill(1));
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

  describe('Matrix Inversion (Gauss-Jordan with Pivoting)', () => {
    it('inverts 2x2 matrix correctly', () => {
      const m = [
        [4, 7],
        [2, 6],
      ];
      // det = 24 - 14 = 10. Inv = [[0.6, -0.7], [-0.2, 0.4]]
      const inv = invertMatrix(m);
      expect(inv).not.toBeNull();
      expect(inv![0][0]).toBeCloseTo(0.6, 6);
      expect(inv![0][1]).toBeCloseTo(-0.7, 6);
      expect(inv![1][0]).toBeCloseTo(-0.2, 6);
      expect(inv![1][1]).toBeCloseTo(0.4, 6);
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
  });
});
