import { compileSafeExpression } from './calculator';
import { findRoots } from './numericalAnalysis';

export interface ComplexNumber {
  re: number;
  im: number;
}

export function formatComplex(c: ComplexNumber, precision: number = 4): string {
  if (Math.abs(c.im) < 1e-10) {
    return Number(c.re.toFixed(precision)).toString();
  }
  if (Math.abs(c.re) < 1e-10) {
    return `${Number(c.im.toFixed(precision))}i`;
  }
  const sign = c.im >= 0 ? '+' : '-';
  return `${Number(c.re.toFixed(precision))} ${sign} ${Number(Math.abs(c.im).toFixed(precision))}i`;
}

export interface QuadraticSolution {
  a: number;
  b: number;
  c: number;
  discriminant: number;
  nature: 'two-real' | 'one-real' | 'two-complex' | 'linear' | 'degenerate';
  roots: ComplexNumber[];
  vertex: { x: number; y: number };
  steps: string[];
}

/**
 * Solves ax^2 + bx + c = 0 with complete derivation steps.
 */
export function solveQuadratic(a: number, b: number, c: number): QuadraticSolution {
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) {
      return {
        a, b, c,
        discriminant: 0,
        nature: 'degenerate',
        roots: [],
        vertex: { x: 0, y: c },
        steps: ['Degenerate equation: 0 = 0 or c = 0 with no variable dependence.'],
      };
    }
    const root = -c / b;
    return {
      a, b, c,
      discriminant: 0,
      nature: 'linear',
      roots: [{ re: root, im: 0 }],
      vertex: { x: root, y: 0 },
      steps: [
        'Coefficient a is zero; reduces to linear equation bx + c = 0.',
        `x = -c / b = -(${c}) / (${b}) = ${root}`,
      ],
    };
  }

  const d = b * b - 4 * a * c;
  const vx = -b / (2 * a);
  const vy = c - (b * b) / (4 * a);

  if (Math.abs(d) < 1e-12) {
    const root = -b / (2 * a);
    return {
      a, b, c,
      discriminant: 0,
      nature: 'one-real',
      roots: [{ re: root, im: 0 }],
      vertex: { x: vx, y: vy },
      steps: [
        `Calculate discriminant Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = 0`,
        'Δ = 0 indicates exactly one repeated real root.',
        `x = -b / (2a) = -(${b}) / (2 · ${a}) = ${root}`,
      ],
    };
  }

  if (d > 0) {
    const sqrtD = Math.sqrt(d);
    const r1 = (-b + sqrtD) / (2 * a);
    const r2 = (-b - sqrtD) / (2 * a);
    return {
      a, b, c,
      discriminant: d,
      nature: 'two-real',
      roots: [
        { re: Math.min(r1, r2), im: 0 },
        { re: Math.max(r1, r2), im: 0 },
      ],
      vertex: { x: vx, y: vy },
      steps: [
        `Calculate discriminant Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${d}`,
        'Δ > 0 indicates two distinct real roots.',
        `√Δ = √${d} ≈ ${sqrtD.toFixed(6)}`,
        `x₁ = (-b - √Δ) / 2a = (${-b} - ${sqrtD.toFixed(4)}) / ${2 * a} = ${Math.min(r1, r2).toFixed(6)}`,
        `x₂ = (-b + √Δ) / 2a = (${-b} + ${sqrtD.toFixed(4)}) / ${2 * a} = ${Math.max(r1, r2).toFixed(6)}`,
      ],
    };
  }

  // Complex conjugate roots
  const sqrtAbsD = Math.sqrt(-d);
  const re = -b / (2 * a);
  const im = sqrtAbsD / (2 * Math.abs(a));

  return {
    a, b, c,
    discriminant: d,
    nature: 'two-complex',
    roots: [
      { re, im },
      { re, im: -im },
    ],
    vertex: { x: vx, y: vy },
    steps: [
      `Calculate discriminant Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${d}`,
      'Δ < 0 indicates a complex conjugate pair of roots.',
      `Real part = -b / (2a) = ${re.toFixed(6)}`,
      `Imaginary part = ±√(–Δ) / (2a) = ±${im.toFixed(6)}i`,
      `Roots: x = ${re.toFixed(4)} ± ${im.toFixed(4)}i`,
    ],
  };
}

export interface CubicSolution {
  a: number;
  b: number;
  c: number;
  d: number;
  roots: ComplexNumber[];
  steps: string[];
}

/**
 * Solves ax^3 + bx^2 + cx + d = 0 using Cardano's method and Vieta's substitution.
 */
export function solveCubic(a: number, b: number, c: number, d: number): CubicSolution {
  if (Math.abs(a) < 1e-12) {
    const q = solveQuadratic(b, c, d);
    return {
      a, b, c, d,
      roots: q.roots,
      steps: ['Leading coefficient a = 0. Reduced to quadratic equation.', ...q.steps],
    };
  }

  // Normalize to x^3 + Ax^2 + Bx + C = 0
  const A = b / a;
  const B = c / a;
  const C = d / a;

  // Substitute x = t - A/3 => depressed cubic t^3 + pt + q = 0
  const p = B - (A * A) / 3;
  const q = (2 * A * A * A) / 27 - (A * B) / 3 + C;
  const delta = (q * q) / 4 + (p * p * p) / 27;

  const roots: ComplexNumber[] = [];
  const steps: string[] = [
    `Depressed cubic substitution: x = t - b/(3a) with shift = -${(A / 3).toFixed(4)}`,
    `Depressed form: t³ + pt + q = 0, where p = ${p.toFixed(5)}, q = ${q.toFixed(5)}`,
    `Cardano discriminant Δ = (q/2)² + (p/3)³ = ${delta.toFixed(6)}`,
  ];

  if (Math.abs(delta) < 1e-10) {
    // All roots real, at least two are equal
    if (Math.abs(q) < 1e-10) {
      // Triple root
      const r = -A / 3;
      roots.push({ re: r, im: 0 }, { re: r, im: 0 }, { re: r, im: 0 });
      steps.push('Triple real root at t = 0.');
    } else {
      const u = Math.cbrt(-q / 2);
      const t1 = 2 * u;
      const t2 = -u;
      roots.push({ re: t1 - A / 3, im: 0 }, { re: t2 - A / 3, im: 0 }, { re: t2 - A / 3, im: 0 });
      steps.push('Multiple real roots.');
    }
  } else if (delta > 0) {
    // One real root, two complex conjugate roots
    const sqrtDelta = Math.sqrt(delta);
    const u = Math.cbrt(-q / 2 + sqrtDelta);
    const v = Math.cbrt(-q / 2 - sqrtDelta);
    const tReal = u + v;
    const xReal = tReal - A / 3;
    roots.push({ re: xReal, im: 0 });

    const imPart = (Math.sqrt(3) / 2) * (u - v);
    const rePart = -(u + v) / 2 - A / 3;
    roots.push({ re: rePart, im: Math.abs(imPart) });
    roots.push({ re: rePart, im: -Math.abs(imPart) });

    steps.push('One real root and two complex conjugate roots.');
  } else {
    // Casus irreducibilis: three distinct real roots via trigonometry
    const m = 2 * Math.sqrt(-p / 3);
    const theta = Math.acos(-q / (2 * Math.sqrt(-Math.pow(p / 3, 3)))) / 3;
    const t1 = m * Math.cos(theta);
    const t2 = m * Math.cos(theta + (2 * Math.PI) / 3);
    const t3 = m * Math.cos(theta + (4 * Math.PI) / 3);

    const rList = [t1 - A / 3, t2 - A / 3, t3 - A / 3].sort((x, y) => x - y);
    for (const r of rList) {
      roots.push({ re: r, im: 0 });
    }
    steps.push('Casus irreducibilis: three distinct real roots resolved via trigonometric identity.');
  }

  return { a, b, c, d, roots, steps };
}

export interface LinearSystem2x2Solution {
  det: number;
  isSolvable: boolean;
  x?: number;
  y?: number;
  message?: string;
  steps: string[];
}

/**
 * Solves 2x2 linear system via Cramer's Rule:
 * a1*x + b1*y = c1
 * a2*x + b2*y = c2
 */
export function solveLinearSystem2x2(
  a1: number, b1: number, c1: number,
  a2: number, b2: number, c2: number
): LinearSystem2x2Solution {
  const det = a1 * b2 - a2 * b1;
  const detX = c1 * b2 - c2 * b1;
  const detY = a1 * c2 - a2 * c1;

  if (Math.abs(det) < 1e-12) {
    if (Math.abs(detX) < 1e-12 && Math.abs(detY) < 1e-12) {
      return {
        det: 0,
        isSolvable: false,
        message: 'Infinite solutions (dependent equations represent the same line).',
        steps: ['Determinant D = 0 and Dx = Dy = 0: Infinitely many collinear solutions.'],
      };
    }
    return {
      det: 0,
      isSolvable: false,
      message: 'No solution (parallel inconsistent lines).',
      steps: ['Determinant D = 0 but Dx or Dy ≠ 0: Parallel lines with no intersection.'],
    };
  }

  const x = detX / det;
  const y = detY / det;

  return {
    det,
    isSolvable: true,
    x,
    y,
    steps: [
      `Main determinant D = (${a1})(${b2}) - (${a2})(${b1}) = ${det}`,
      `x-determinant Dx = (${c1})(${b2}) - (${c2})(${b1}) = ${detX}`,
      `y-determinant Dy = (${a1})(${c2}) - (${a2})(${c1}) = ${detY}`,
      `x = Dx / D = ${detX} / ${det} = ${x}`,
      `y = Dy / D = ${detY} / ${det} = ${y}`,
    ],
  };
}

export interface LinearSystem3x3Solution {
  det: number;
  isSolvable: boolean;
  x?: number;
  y?: number;
  z?: number;
  message?: string;
  steps: string[];
}

/**
 * Solves 3x3 linear system via Cramer's Rule.
 */
export function solveLinearSystem3x3(
  a1: number, b1: number, c1: number, d1: number,
  a2: number, b2: number, c2: number, d2: number,
  a3: number, b3: number, c3: number, d3: number
): LinearSystem3x3Solution {
  const det3 = (
    m11: number, m12: number, m13: number,
    m21: number, m22: number, m23: number,
    m31: number, m32: number, m33: number
  ) =>
    m11 * (m22 * m33 - m23 * m32) -
    m12 * (m21 * m33 - m23 * m31) +
    m13 * (m21 * m32 - m22 * m31);

  const D = det3(a1, b1, c1, a2, b2, c2, a3, b3, c3);
  const Dx = det3(d1, b1, c1, d2, b2, c2, d3, b3, c3);
  const Dy = det3(a1, d1, c1, a2, d2, c2, a3, d3, c3);
  const Dz = det3(a1, b1, d1, a2, b2, d2, a3, b3, d3);

  if (Math.abs(D) < 1e-12) {
    return {
      det: 0,
      isSolvable: false,
      message: 'Determinant is 0: system has no unique solution (either inconsistent or dependent planes).',
      steps: ['Main determinant D = 0. No unique solution exists.'],
    };
  }

  const x = Dx / D;
  const y = Dy / D;
  const z = Dz / D;

  return {
    det: D,
    isSolvable: true,
    x,
    y,
    z,
    steps: [
      `Calculated 3×3 determinant D = ${D.toFixed(6)}`,
      `Dx = ${Dx.toFixed(6)}, Dy = ${Dy.toFixed(6)}, Dz = ${Dz.toFixed(6)}`,
      `x = Dx / D = ${x.toFixed(6)}`,
      `y = Dy / D = ${y.toFixed(6)}`,
      `z = Dz / D = ${z.toFixed(6)}`,
    ],
  };
}

/**
 * Solves general non-linear equation f(x) = 0 using AST parsing + numerical root finding.
 */
export function solveGeneralEquation(
  expression: string,
  range: { min: number; max: number } = { min: -10, max: 10 }
): { ok: boolean; roots: number[]; error?: string } {
  const compiled = compileSafeExpression(expression, 'RAD');
  if (!compiled.ok) {
    return { ok: false, roots: [], error: compiled.error };
  }

  const roots = findRoots(compiled.compiled, range, { samples: 200 });
  return { ok: true, roots };
}

/**
 * Solves general n-th degree polynomial a_n x^n + ... + a_0 = 0 using the Durand-Kerner (Weierstrass) method.
 * Returns all n complex roots.
 */
export function solvePolynomialRoots(coefficients: number[]): ComplexNumber[] {
  // Coefficients in descending order [a_n, a_{n-1}, ..., a_0]
  const clean = [...coefficients];
  // Trim leading zeros
  while (clean.length > 0 && Math.abs(clean[0]) < 1e-12) {
    clean.shift();
  }

  const n = clean.length - 1;
  if (n <= 0) return [];
  if (n === 1) {
    return [{ re: -clean[1] / clean[0], im: 0 }];
  }
  if (n === 2) {
    return solveQuadratic(clean[0], clean[1], clean[2]).roots;
  }
  if (n === 3) {
    return solveCubic(clean[0], clean[1], clean[2], clean[3]).roots;
  }

  // Normalize monic polynomial: x^n + b_{n-1} x^{n-1} + ... + b_0 = 0
  const monic: number[] = clean.map((c) => c / clean[0]);

  // Initial complex approximations spaced evenly on Aberth / Durand-Kerner circle
  const roots: { re: number; im: number }[] = [];
  const radius = 1.0;
  for (let k = 0; k < n; k++) {
    const angle = (2 * Math.PI * k + 0.5) / n;
    roots.push({
      re: Math.pow(radius, k) * Math.cos(angle),
      im: Math.pow(radius, k) * Math.sin(angle),
    });
  }

  // Iteration loop
  const maxIters = 60;
  for (let iter = 0; iter < maxIters; iter++) {
    let maxChange = 0;
    for (let i = 0; i < n; i++) {
      // Horner evaluation for complex z
      let zRe = 0;
      let zIm = 0;
      for (let j = 0; j <= n; j++) {
        const c = monic[j];
        if (j === 0) {
          zRe = 1;
          zIm = 0;
        } else {
          const nextRe = zRe * roots[i].re - zIm * roots[i].im + c;
          const nextIm = zRe * roots[i].im + zIm * roots[i].re;
          zRe = nextRe;
          zIm = nextIm;
        }
      }
      const pRe = zRe;
      const pIm = zIm;

      // Compute denominator: product_{j != i} (z_i - z_j)
      let denomRe = 1;
      let denomIm = 0;
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const diffRe = roots[i].re - roots[j].re;
          const diffIm = roots[i].im - roots[j].im;
          const nextRe = denomRe * diffRe - denomIm * diffIm;
          const nextIm = denomRe * diffIm + denomIm * diffRe;
          denomRe = nextRe;
          denomIm = nextIm;
        }
      }

      const denomMagSq = denomRe * denomRe + denomIm * denomIm;
      if (denomMagSq > 1e-24) {
        const deltaRe = (pRe * denomRe + pIm * denomIm) / denomMagSq;
        const deltaIm = (pIm * denomRe - pRe * denomIm) / denomMagSq;
        roots[i].re -= deltaRe;
        roots[i].im -= deltaIm;
        maxChange = Math.max(maxChange, Math.hypot(deltaRe, deltaIm));
      }
    }
    if (maxChange < 1e-10) break;
  }

  // Clean tiny imaginary parts
  return roots.map((r) => ({
    re: Math.abs(r.re) < 1e-10 ? 0 : r.re,
    im: Math.abs(r.im) < 1e-10 ? 0 : r.im,
  }));
}

export interface InequalitySolution {
  intervals: string;
  graphExpression: string;
}

/**
 * Solves polynomial quadratic inequality: ax^2 + bx + c (< | <= | > | >=) 0.
 */
export function solveQuadraticInequality(
  a: number,
  b: number,
  c: number,
  op: '<' | '<=' | '>' | '>='
): InequalitySolution {
  const quad = solveQuadratic(a, b, c);
  const expr = `${a}*x^2 + ${b}*x + ${c}`;

  if (quad.nature === 'two-real') {
    const r1 = quad.roots[0].re;
    const r2 = quad.roots[1].re;

    if (a > 0) {
      if (op === '<') return { intervals: `(${r1.toFixed(4)}, ${r2.toFixed(4)})`, graphExpression: expr };
      if (op === '<=') return { intervals: `[${r1.toFixed(4)}, ${r2.toFixed(4)}]`, graphExpression: expr };
      if (op === '>') return { intervals: `(-∞, ${r1.toFixed(4)}) ∪ (${r2.toFixed(4)}, ∞)`, graphExpression: expr };
      if (op === '>=') return { intervals: `(-∞, ${r1.toFixed(4)}] ∪ [${r2.toFixed(4)}, ∞)`, graphExpression: expr };
    } else {
      if (op === '<') return { intervals: `(-∞, ${r1.toFixed(4)}) ∪ (${r2.toFixed(4)}, ∞)`, graphExpression: expr };
      if (op === '<=') return { intervals: `(-∞, ${r1.toFixed(4)}] ∪ [${r2.toFixed(4)}, ∞)`, graphExpression: expr };
      if (op === '>') return { intervals: `(${r1.toFixed(4)}, ${r2.toFixed(4)})`, graphExpression: expr };
      if (op === '>=') return { intervals: `[${r1.toFixed(4)}, ${r2.toFixed(4)}]`, graphExpression: expr };
    }
  }

  if (quad.nature === 'one-real') {
    const r = quad.roots[0].re;
    if (a > 0) {
      if (op === '<') return { intervals: 'No real solutions (∅)', graphExpression: expr };
      if (op === '<=') return { intervals: `{${r.toFixed(4)}}`, graphExpression: expr };
      if (op === '>') return { intervals: `(-∞, ${r.toFixed(4)}) ∪ (${r.toFixed(4)}, ∞)`, graphExpression: expr };
      if (op === '>=') return { intervals: 'All real numbers (-∞, ∞)', graphExpression: expr };
    }
  }

  if (quad.nature === 'two-complex') {
    if (a > 0) {
      return op === '>' || op === '>='
        ? { intervals: 'All real numbers (-∞, ∞)', graphExpression: expr }
        : { intervals: 'No real solutions (∅)', graphExpression: expr };
    } else {
      return op === '<' || op === '<='
        ? { intervals: 'All real numbers (-∞, ∞)', graphExpression: expr }
        : { intervals: 'No real solutions (∅)', graphExpression: expr };
    }
  }

  return { intervals: 'Evaluated analytically', graphExpression: expr };
}

