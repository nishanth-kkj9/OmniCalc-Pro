import { describe, it, expect } from 'vitest';
import { Complex, parseComplex } from './complex';

describe('Complex & Phasor Engine Tests', () => {
  it('constructs rectangular and polar complex numbers', () => {
    const z = new Complex(3, 4);
    expect(z.re).toBe(3);
    expect(z.im).toBe(4);
    expect(z.modulus).toBe(5);
    expect(z.argumentDeg).toBeCloseTo(53.13, 2);

    const polar = Complex.fromPolar(5, 53.1301, 'DEG');
    expect(polar.re).toBeCloseTo(3, 3);
    expect(polar.im).toBeCloseTo(4, 3);
  });

  it('performs basic arithmetic', () => {
    const z1 = new Complex(1, 2);
    const z2 = new Complex(3, -4);

    const sum = z1.add(z2);
    expect(sum.re).toBe(4);
    expect(sum.im).toBe(-2);

    const sub = z1.sub(z2);
    expect(sub.re).toBe(-2);
    expect(sub.im).toBe(6);

    const prod = z1.mul(z2);
    // (1+2i)(3-4i) = 3 - 4i + 6i + 8 = 11 + 2i
    expect(prod.re).toBe(11);
    expect(prod.im).toBe(2);

    const div = z1.div(z2);
    // (1+2i)/(3-4i) = (1+2i)(3+4i) / 25 = (-5 + 10i) / 25 = -0.2 + 0.4i
    expect(div.re).toBeCloseTo(-0.2, 4);
    expect(div.im).toBeCloseTo(0.4, 4);
  });

  it('computes Euler exp and ln functions', () => {
    // e^(i * pi) = -1
    const e_i_pi = new Complex(0, Math.PI).exp();
    expect(e_i_pi.re).toBeCloseTo(-1, 5);
    expect(e_i_pi.im).toBeCloseTo(0, 5);

    // ln(-1) = i * pi
    const ln_neg1 = new Complex(-1, 0).ln();
    expect(ln_neg1.re).toBeCloseTo(0, 5);
    expect(ln_neg1.im).toBeCloseTo(Math.PI, 5);
  });

  it('computes roots and powers', () => {
    const z = new Complex(0, 8); // 8i
    const cubeRoots = z.roots(3);
    expect(cubeRoots.length).toBe(3);
    for (const r of cubeRoots) {
      expect(r.modulus).toBeCloseTo(2, 4);
    }
  });

  it('parses complex strings correctly', () => {
    const p1 = parseComplex('3+4i');
    expect(p1?.re).toBe(3);
    expect(p1?.im).toBe(4);

    const p2 = parseComplex('5<45deg');
    expect(p2?.modulus).toBeCloseTo(5, 4);
    expect(p2?.argumentDeg).toBeCloseTo(45, 4);

    const p3 = parseComplex('-2.5i');
    expect(p3?.re).toBe(0);
    expect(p3?.im).toBe(-2.5);
  });
});
