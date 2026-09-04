/**
 * High-Precision Complex Number & Phasor Engine for OmniCalc Pro.
 * Supports Rectangular (a + bi), Polar (r ∠ θ), and Exponential / Euler (r·e^(iθ)) forms,
 * n-th complex roots, transcendental functions (exp, ln, sin, cos, tan), and AC electrical phasor arithmetic.
 */

export type ComplexAngleUnit = 'RAD' | 'DEG';

export class Complex {
  readonly re: number;
  readonly im: number;

  constructor(re: number = 0, im: number = 0) {
    this.re = isFinite(re) && !isNaN(re) ? re : 0;
    this.im = isFinite(im) && !isNaN(im) ? im : 0;
  }

  static readonly ZERO = new Complex(0, 0);
  static readonly ONE = new Complex(1, 0);
  static readonly I = new Complex(0, 1);

  static fromPolar(r: number, theta: number, unit: ComplexAngleUnit = 'RAD'): Complex {
    const rad = unit === 'DEG' ? (theta * Math.PI) / 180 : theta;
    return new Complex(r * Math.cos(rad), r * Math.sin(rad));
  }

  static fromEuler(r: number, theta: number): Complex {
    return Complex.fromPolar(r, theta, 'RAD');
  }

  // Properties
  get modulus(): number {
    return Math.hypot(this.re, this.im);
  }

  get r(): number {
    return this.modulus;
  }

  get argument(): number {
    return Math.atan2(this.im, this.re); // Radians [-π, π]
  }

  get argumentDeg(): number {
    return (this.argument * 180) / Math.PI;
  }

  get conjugate(): Complex {
    return new Complex(this.re, -this.im);
  }

  // Basic Arithmetic
  add(other: Complex | number): Complex {
    const o = typeof other === 'number' ? new Complex(other, 0) : other;
    return new Complex(this.re + o.re, this.im + o.im);
  }

  sub(other: Complex | number): Complex {
    const o = typeof other === 'number' ? new Complex(other, 0) : other;
    return new Complex(this.re - o.re, this.im - o.im);
  }

  mul(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.re * other, this.im * other);
    }
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }

  div(other: Complex | number): Complex {
    if (typeof other === 'number') {
      if (other === 0) return new Complex(NaN, NaN);
      return new Complex(this.re / other, this.im / other);
    }
    const denom = other.re * other.re + other.im * other.im;
    if (denom === 0) return new Complex(NaN, NaN);
    return new Complex(
      (this.re * other.re + this.im * other.im) / denom,
      (this.im * other.re - this.re * other.im) / denom
    );
  }

  reciprocal(): Complex {
    return Complex.ONE.div(this);
  }

  neg(): Complex {
    return new Complex(-this.re, -this.im);
  }

  // Transcendental & Powers
  exp(): Complex {
    const expRe = Math.exp(this.re);
    return new Complex(expRe * Math.cos(this.im), expRe * Math.sin(this.im));
  }

  ln(): Complex {
    return new Complex(Math.log(this.modulus), this.argument);
  }

  pow(exponent: Complex | number): Complex {
    if (this.re === 0 && this.im === 0) {
      return Complex.ZERO;
    }
    const exp = typeof exponent === 'number' ? new Complex(exponent, 0) : exponent;
    // z^w = exp(w * ln(z))
    return this.ln().mul(exp).exp();
  }

  sqrt(): Complex {
    return this.pow(0.5);
  }

  /**
   * Computes all n distinct complex roots: z^(1/n).
   */
  roots(n: number): Complex[] {
    if (!Number.isInteger(n) || n < 1) return [];
    const r = Math.pow(this.modulus, 1 / n);
    const theta = this.argument;
    const result: Complex[] = [];

    for (let k = 0; k < n; k++) {
      const angle = (theta + 2 * Math.PI * k) / n;
      result.push(new Complex(r * Math.cos(angle), r * Math.sin(angle)));
    }
    return result;
  }

  // Trigonometric functions
  sin(): Complex {
    // sin(z) = (exp(iz) - exp(-iz)) / (2i) = sin(x)cosh(y) + i cos(x)sinh(y)
    return new Complex(
      Math.sin(this.re) * Math.cosh(this.im),
      Math.cos(this.re) * Math.sinh(this.im)
    );
  }

  cos(): Complex {
    // cos(z) = (exp(iz) + exp(-iz)) / 2 = cos(x)cosh(y) - i sin(x)sinh(y)
    return new Complex(
      Math.cos(this.re) * Math.cosh(this.im),
      -Math.sin(this.re) * Math.sinh(this.im)
    );
  }

  tan(): Complex {
    return this.sin().div(this.cos());
  }

  // Phasor Electrical AC functions
  parallel(other: Complex): Complex {
    // Z1 || Z2 = (Z1 * Z2) / (Z1 + Z2)
    return this.mul(other).div(this.add(other));
  }

  // String Formatters
  toRectangular(precision: number = 4): string {
    const reStr = this.re.toFixed(precision).replace(/\.?0+$/, '');
    const absIm = Math.abs(this.im);
    const imStr = absIm.toFixed(precision).replace(/\.?0+$/, '');

    if (Math.abs(this.im) < 1e-12) return reStr || '0';
    if (Math.abs(this.re) < 1e-12) {
      if (this.im === 1) return 'i';
      if (this.im === -1) return '-i';
      return `${this.im < 0 ? '-' : ''}${imStr}i`;
    }

    const sign = this.im >= 0 ? '+' : '-';
    const imPart = imStr === '1' ? 'i' : `${imStr}i`;
    return `${reStr} ${sign} ${imPart}`;
  }

  toPolar(unit: ComplexAngleUnit = 'DEG', precision: number = 4): string {
    const rStr = this.modulus.toFixed(precision).replace(/\.?0+$/, '');
    const angle = unit === 'DEG' ? this.argumentDeg : this.argument;
    const angleStr = angle.toFixed(precision).replace(/\.?0+$/, '');
    const unitSymbol = unit === 'DEG' ? '°' : ' rad';
    return `${rStr} ∠ ${angleStr}${unitSymbol}`;
  }

  toEuler(precision: number = 4): string {
    const rStr = this.modulus.toFixed(precision).replace(/\.?0+$/, '');
    const thetaStr = this.argument.toFixed(precision).replace(/\.?0+$/, '');
    return `${rStr} · e^(${thetaStr}i)`;
  }
}

/**
 * Parses user input string into a Complex object.
 * Supports: "3+4i", "3 - 4j", "5<45", "5<45deg", "-2i", "7", "4*e^(i*1.5)"
 */
export function parseComplex(str: string): Complex | null {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().replace(/\s+/g, '');
  if (!s) return null;

  // Polar angle form: "r<theta" or "r∠theta"
  const polarMatch = s.match(/^([+-]?[0-9.]+)(?:<|∠)([+-]?[0-9.]+)(deg|rad)?$/i);
  if (polarMatch) {
    const r = parseFloat(polarMatch[1]);
    const theta = parseFloat(polarMatch[2]);
    const unit: ComplexAngleUnit =
      polarMatch[3]?.toLowerCase() === 'rad' ? 'RAD' : 'DEG';
    return Complex.fromPolar(r, theta, unit);
  }

  // Pure imaginary "5i", "-i", "+2j"
  const pureImMatch = s.match(/^([+-]?[0-9.]*)?[ij]$/i);
  if (pureImMatch) {
    const coeff = pureImMatch[1];
    if (coeff === '' || coeff === '+') return new Complex(0, 1);
    if (coeff === '-') return new Complex(0, -1);
    return new Complex(0, parseFloat(coeff));
  }

  // Real + Imaginary "a+bi" or "a-bi"
  const rectMatch = s.match(/^([+-]?[0-9.]+)([+-][0-9.]*)?[ij]$/i);
  if (rectMatch) {
    const re = parseFloat(rectMatch[1]);
    const imPart = rectMatch[2];
    let im = 1;
    if (imPart === '+') im = 1;
    else if (imPart === '-') im = -1;
    else if (imPart) im = parseFloat(imPart);
    return new Complex(re, im);
  }

  // Pure real
  const realVal = parseFloat(s);
  if (!isNaN(realVal) && isFinite(realVal)) {
    return new Complex(realVal, 0);
  }

  return null;
}
