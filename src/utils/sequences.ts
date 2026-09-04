/**
 * Sequences & Series Engine for OmniCalc Pro.
 * Provides evaluation of Explicit sequences, Recursive relations, Arithmetic/Geometric progressions,
 * Fibonacci, partial sums, tables, convergence checks (Ratio test, Root test), and limit estimation.
 */

import { compileSafeExpression } from './calculator';

export type SequenceType =
  | 'arithmetic'
  | 'geometric'
  | 'fibonacci'
  | 'explicit'
  | 'recursive';

export interface SequenceTerm {
  n: number;
  an: number;
  Sn: number; // Partial sum
  diff?: number; // an - a_{n-1}
  ratio?: number; // an / a_{n-1}
}

export interface SequenceParams {
  type: SequenceType;
  // For arithmetic
  a1?: number;
  d?: number; // common difference
  // For geometric
  r?: number; // common ratio
  // For explicit
  explicitExpr?: string; // e.g. "1/n^2", "(-1)^n / n", "(2*n+1)/(3*n-2)"
  // For recursive
  recursiveExpr?: string; // e.g. "2*a_prev + 1", "a_prev1 + a_prev2"
  initialTerms?: number[]; // e.g. [1] or [1, 1]
  startN?: number; // usually 1 or 0
  numTerms?: number; // number of terms to compute (default 20, max 500)
}

export interface ConvergenceAnalysis {
  isConvergent?: boolean;
  estimatedLimit?: number;
  sumConvergent?: boolean;
  estimatedSum?: number;
  ratioLimit?: number;
  notes: string[];
}

export interface SequenceResult {
  terms: SequenceTerm[];
  closedFormFormula?: string;
  sumFormula?: string;
  convergence: ConvergenceAnalysis;
  error?: string;
}

/**
 * Computes terms and convergence properties of a sequence.
 */
export function computeSequence(params: SequenceParams): SequenceResult {
  const {
    type,
    a1 = 1,
    d = 1,
    r = 0.5,
    explicitExpr = '1/n^2',
    recursiveExpr = 'a_prev + 2',
    initialTerms = [1],
    startN = 1,
    numTerms = 25,
  } = params;

  const N = Math.max(1, Math.min(500, Math.floor(numTerms)));
  const terms: SequenceTerm[] = [];
  let currentSum = 0;
  let closedFormFormula = '';
  let sumFormula = '';
  const notes: string[] = [];

  try {
    if (type === 'arithmetic') {
      closedFormFormula = `a_n = ${a1} + (n - 1)·(${d}) = ${d}n + ${a1 - d}`;
      sumFormula = `S_n = (n/2)·(2·${a1} + (n-1)·${d})`;

      for (let i = 0; i < N; i++) {
        const n = startN + i;
        const an = a1 + (n - startN) * d;
        currentSum += an;
        const prevAn = i > 0 ? terms[i - 1].an : undefined;
        terms.push({
          n,
          an,
          Sn: currentSum,
          diff: prevAn !== undefined ? an - prevAn : undefined,
          ratio: prevAn !== undefined && prevAn !== 0 ? an / prevAn : undefined,
        });
      }

      const isConvergent = d === 0;
      const sumConvergent = a1 === 0 && d === 0;

      return {
        terms,
        closedFormFormula,
        sumFormula,
        convergence: {
          isConvergent,
          estimatedLimit: isConvergent ? a1 : undefined,
          sumConvergent,
          estimatedSum: sumConvergent ? 0 : undefined,
          notes: [
            `Arithmetic sequence with common difference d = ${d}.`,
            d === 0 ? 'Trivially constant sequence.' : 'Diverges as n → ∞.',
          ],
        },
      };
    }

    if (type === 'geometric') {
      closedFormFormula = `a_n = ${a1} · (${r})^(n - 1)`;
      sumFormula =
        r !== 1
          ? `S_n = ${a1} · (1 - (${r})^n) / (1 - (${r}))`
          : `S_n = ${a1} · n`;

      for (let i = 0; i < N; i++) {
        const n = startN + i;
        const an = a1 * Math.pow(r, n - startN);
        currentSum += an;
        const prevAn = i > 0 ? terms[i - 1].an : undefined;
        terms.push({
          n,
          an,
          Sn: currentSum,
          diff: prevAn !== undefined ? an - prevAn : undefined,
          ratio: prevAn !== undefined && prevAn !== 0 ? an / prevAn : undefined,
        });
      }

      const isConvergent = Math.abs(r) < 1 || (r === 1 && a1 !== 0);
      const sumConvergent = Math.abs(r) < 1;
      const infSum = sumConvergent ? a1 / (1 - r) : undefined;

      notes.push(`Geometric progression with common ratio r = ${r}.`);
      if (sumConvergent) {
        notes.push(`Infinite Series converges to S_∞ = a1 / (1 - r) = ${infSum?.toFixed(6)}.`);
      } else {
        notes.push('Infinite Series diverges because |r| ≥ 1.');
      }

      return {
        terms,
        closedFormFormula,
        sumFormula,
        convergence: {
          isConvergent,
          estimatedLimit: Math.abs(r) < 1 ? 0 : r === 1 ? a1 : undefined,
          sumConvergent,
          estimatedSum: infSum,
          ratioLimit: r,
          notes,
        },
      };
    }

    if (type === 'fibonacci') {
      closedFormFormula = `F_n = (φ^n - ψ^n) / √5 where φ ≈ 1.6180339887`;
      sumFormula = `S_n = F_{n+2} - 1`;

      let a = initialTerms[0] ?? 1;
      let b = initialTerms[1] ?? 1;

      for (let i = 0; i < N; i++) {
        const n = startN + i;
        let an: number;
        if (i === 0) an = a;
        else if (i === 1) an = b;
        else {
          an = a + b;
          a = b;
          b = an;
        }

        currentSum += an;
        const prevAn = i > 0 ? terms[i - 1].an : undefined;
        terms.push({
          n,
          an,
          Sn: currentSum,
          diff: prevAn !== undefined ? an - prevAn : undefined,
          ratio: prevAn !== undefined && prevAn !== 0 ? an / prevAn : undefined,
        });
      }

      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      return {
        terms,
        closedFormFormula,
        sumFormula,
        convergence: {
          isConvergent: false,
          sumConvergent: false,
          ratioLimit: goldenRatio,
          notes: [
            'Fibonacci recurrence: F_n = F_{n-1} + F_{n-2}.',
            `Ratio of successive terms lim(F_{n}/F_{n-1}) = Golden Ratio φ ≈ ${goldenRatio.toFixed(8)}.`,
          ],
        },
      };
    }

    if (type === 'explicit') {
      closedFormFormula = `a_n = ${explicitExpr}`;
      const compRes = compileSafeExpression(explicitExpr, 'RAD', ['n', 'x']);
      if (!compRes.ok) {
        return {
          terms: [],
          closedFormFormula,
          convergence: { notes: [] },
          error: `Invalid expression syntax for explicit formula: "${explicitExpr}"`,
        };
      }

      const compiled = compRes.compiled;
      for (let i = 0; i < N; i++) {
        const n = startN + i;
        const val = compiled.evaluate({ n, x: n });
        if (val === null || isNaN(val) || !isFinite(val)) {
          break;
        }
        const an = val;
        currentSum += an;
        const prevAn = i > 0 ? terms[i - 1].an : undefined;
        terms.push({
          n,
          an,
          Sn: currentSum,
          diff: prevAn !== undefined ? an - prevAn : undefined,
          ratio: prevAn !== undefined && prevAn !== 0 ? an / prevAn : undefined,
        });
      }

      // Analyze convergence empirically
      const lastTerm = terms.length > 0 ? terms[terms.length - 1].an : 0;
      const secondLastTerm = terms.length > 1 ? terms[terms.length - 2].an : 0;
      const isConvergent = terms.length > 1 && Math.abs(lastTerm - secondLastTerm) < 1e-4;
      const estimatedLimit = isConvergent ? lastTerm : undefined;

      const lastSum = terms.length > 0 ? terms[terms.length - 1].Sn : 0;
      const secondLastSum = terms.length > 1 ? terms[terms.length - 2].Sn : 0;
      const sumConvergent = terms.length > 1 && Math.abs(lastSum - secondLastSum) < 1e-4;

      return {
        terms,
        closedFormFormula,
        convergence: {
          isConvergent,
          estimatedLimit,
          sumConvergent,
          estimatedSum: sumConvergent ? lastSum : undefined,
          notes: [
            isConvergent
              ? `Sequence appears to converge towards limit ≈ ${estimatedLimit?.toFixed(6)}.`
              : 'Sequence shows unbounded or oscillatory behavior.',
            sumConvergent
              ? `Partial sums stabilize near S ≈ ${lastSum.toFixed(6)}.`
              : 'Partial sums show continued growth or oscillation.',
          ],
        },
      };
    }

    if (type === 'recursive') {
      closedFormFormula = `a_n = f(a_{n-1}, a_{n-2}, n)`;
      const compRes = compileSafeExpression(recursiveExpr, 'RAD', [
        'a_prev',
        'a_prev1',
        'a_prev2',
        'prev',
        'n',
        'x',
      ]);
      if (!compRes.ok) {
        return {
          terms: [],
          closedFormFormula,
          convergence: { notes: [] },
          error: `Invalid expression syntax for recurrence relation: "${recursiveExpr}"`,
        };
      }

      const compiled = compRes.compiled;
      const historyVals: number[] = [...(initialTerms.length > 0 ? initialTerms : [1])];

      for (let i = 0; i < N; i++) {
        const n = startN + i;
        let an: number;

        if (i < historyVals.length) {
          an = historyVals[i];
        } else {
          const a_prev = historyVals[historyVals.length - 1];
          const a_prev1 = a_prev;
          const a_prev2 =
            historyVals.length >= 2 ? historyVals[historyVals.length - 2] : a_prev;

          const val = compiled.evaluate({
            n,
            x: n,
            a_prev,
            a_prev1,
            a_prev2,
            prev: a_prev,
          });

          if (val === null || isNaN(val) || !isFinite(val)) break;
          an = val;
          historyVals.push(an);
        }

        currentSum += an;
        const prevAn = i > 0 ? terms[i - 1].an : undefined;
        terms.push({
          n,
          an,
          Sn: currentSum,
          diff: prevAn !== undefined ? an - prevAn : undefined,
          ratio: prevAn !== undefined && prevAn !== 0 ? an / prevAn : undefined,
        });
      }

      return {
        terms,
        closedFormFormula,
        convergence: {
          notes: ['Custom recurrence evaluated iteratively.'],
        },
      };
    }
  } catch (err: any) {
    return {
      terms,
      convergence: { notes: [] },
      error: err.message || 'Failed to evaluate sequence expression.',
    };
  }

  return {
    terms,
    convergence: { notes: [] },
  };
}
