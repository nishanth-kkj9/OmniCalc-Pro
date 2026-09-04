import { describe, it, expect } from 'vitest';
import {
  matrixDet,
  matrixTrace,
  matrixTranspose,
  matrixAdd,
  matrixSub,
  matrixMul,
  matrixScalarMul,
  matrixPower,
  matrixInverse,
  matrixRREF,
  matrixEigenvalues,
} from './matrixEngine';

describe('Matrix Engine', () => {
  const m2x2 = [
    [1, 2],
    [3, 4],
  ];

  const m3x3 = [
    [1, 2, 3],
    [0, 1, 4],
    [5, 6, 0],
  ];

  it('computes determinant correctly for 2x2 and 3x3', () => {
    expect(matrixDet(m2x2)).toBe(-2);
    expect(matrixDet(m3x3)).toBe(1);
  });

  it('computes trace correctly', () => {
    expect(matrixTrace(m2x2)).toBe(5);
    expect(matrixTrace(m3x3)).toBe(2);
  });

  it('computes transpose correctly', () => {
    expect(matrixTranspose(m2x2)).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });

  it('performs matrix addition, subtraction, scalar mul, and multiplication', () => {
    const a = [
      [1, 2],
      [3, 4],
    ];
    const b = [
      [2, 0],
      [1, 2],
    ];

    expect(matrixAdd(a, b)).toEqual([
      [3, 2],
      [4, 6],
    ]);
    expect(matrixSub(a, b)).toEqual([
      [-1, 2],
      [2, 2],
    ]);
    expect(matrixScalarMul(a, 3)).toEqual([
      [3, 6],
      [9, 12],
    ]);
    expect(matrixMul(a, b)).toEqual([
      [4, 4],
      [10, 8],
    ]);
  });

  it('computes matrix power correctly', () => {
    const a = [
      [1, 1],
      [1, 0],
    ];
    const a2 = matrixPower(a, 2);
    expect(a2).toEqual([
      [2, 1],
      [1, 1],
    ]);
  });

  it('computes matrix inverse correctly and verifies A * A^-1 = I', () => {
    const inv = matrixInverse(m2x2);
    const prod = matrixMul(m2x2, inv);
    expect(prod[0][0]).toBeCloseTo(1, 10);
    expect(prod[0][1]).toBeCloseTo(0, 10);
    expect(prod[1][0]).toBeCloseTo(0, 10);
    expect(prod[1][1]).toBeCloseTo(1, 10);
  });

  it('computes matrix rank and RREF', () => {
    const singular = [
      [1, 2],
      [2, 4],
    ];
    const { rank: rankSingular } = matrixRREF(singular);
    expect(rankSingular).toBe(1);

    const { rank: rankFull } = matrixRREF(m3x3);
    expect(rankFull).toBe(3);
  });

  it('computes 2x2 eigenvalues correctly', () => {
    const diag = [
      [2, 0],
      [0, 5],
    ];
    const eigs = matrixEigenvalues(diag);
    const reals = eigs.map((e) => e.real).sort((a, b) => a - b);
    expect(reals[0]).toBeCloseTo(2, 5);
    expect(reals[1]).toBeCloseTo(5, 5);
  });
});
