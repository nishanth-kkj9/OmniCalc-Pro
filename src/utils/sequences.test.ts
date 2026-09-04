import { describe, it, expect } from 'vitest';
import { computeSequence } from './sequences';

describe('Sequences & Series Engine Tests', () => {
  it('computes Arithmetic sequence a1=3, d=2', () => {
    const res = computeSequence({
      type: 'arithmetic',
      a1: 3,
      d: 2,
      numTerms: 5,
    });

    expect(res.terms.length).toBe(5);
    expect(res.terms.map((t) => t.an)).toEqual([3, 5, 7, 9, 11]);
    expect(res.terms[4].Sn).toBe(3 + 5 + 7 + 9 + 11); // 35
  });

  it('computes Geometric sequence a1=1, r=0.5', () => {
    const res = computeSequence({
      type: 'geometric',
      a1: 1,
      r: 0.5,
      numTerms: 10,
    });

    expect(res.terms.length).toBe(10);
    expect(res.terms[0].an).toBe(1);
    expect(res.terms[1].an).toBe(0.5);
    expect(res.terms[2].an).toBe(0.25);
    expect(res.convergence.sumConvergent).toBe(true);
    expect(res.convergence.estimatedSum).toBeCloseTo(2.0, 4); // a1 / (1-r) = 1/0.5 = 2
  });

  it('computes Fibonacci sequence', () => {
    const res = computeSequence({
      type: 'fibonacci',
      numTerms: 8,
    });

    expect(res.terms.map((t) => t.an)).toEqual([1, 1, 2, 3, 5, 8, 13, 21]);
    expect(res.convergence.ratioLimit).toBeCloseTo(1.6180339, 4);
  });

  it('computes Explicit sequence an = 1 / n^2', () => {
    const res = computeSequence({
      type: 'explicit',
      explicitExpr: '1 / n^2',
      numTerms: 20,
    });

    expect(res.terms.length).toBe(20);
    expect(res.terms[0].an).toBe(1);
    expect(res.terms[1].an).toBe(0.25);
    expect(res.terms[2].an).toBeCloseTo(1 / 9, 5);
  });

  it('computes Recursive sequence an = 2 * a_prev + 1', () => {
    const res = computeSequence({
      type: 'recursive',
      recursiveExpr: '2 * a_prev + 1',
      initialTerms: [1],
      numTerms: 5,
    });

    // a1 = 1, a2 = 2*1+1=3, a3 = 2*3+1=7, a4 = 2*7+1=15, a5 = 31
    expect(res.terms.map((t) => t.an)).toEqual([1, 3, 7, 15, 31]);
  });
});
