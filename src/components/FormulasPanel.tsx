import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Search, 
  BookOpen, 
  Sparkles,
  Hash,
  Layers,
  HelpCircle
} from 'lucide-react';
import { AppSettings, CalcMode } from '../types';

export interface FormulaConstantItem {
  id: string;
  name: string;
  symbol?: string;
  formula: string;
  description: string;
  category: 
    | 'Constants' 
    | 'Calculus' 
    | 'Algebra' 
    | 'Geometry & Trig' 
    | 'Matrix & Vectors' 
    | 'Statistics' 
    | 'Physics & Chem' 
    | 'Computer Science' 
    | 'Finance' 
    | 'Health & Bio' 
    | 'Unit Factors';
  numericValue?: string;
  unit?: string;
  relatedModes: CalcMode[];
  notes?: string;
}

interface FormulasPanelProps {
  settings?: AppSettings;
  onNavigateMode?: (mode: CalcMode) => void;
}

export const FORMULAS_AND_CONSTANTS_DATABASE: FormulaConstantItem[] = [
  // ==================== UNIVERSAL & MATHEMATICAL CONSTANTS ====================
  {
    id: 'const_pi',
    name: 'Pi (Archimedes Constant)',
    symbol: 'π',
    formula: 'π = 3.141592653589793...',
    numericValue: '3.14159265358979323846',
    description: 'Ratio of a circle circumference to its diameter in Euclidean space',
    category: 'Constants',
    relatedModes: ['basic', 'scientific', 'geometry', 'calculus', 'graphing'],
    notes: 'Used in circle geometry, trigonometric radians, Fourier transforms, and Gaussian distributions.'
  },
  {
    id: 'const_e',
    name: "Euler's Number (Natural Base)",
    symbol: 'e',
    formula: 'e = lim(1 + 1/n)^n = 2.718281828459...',
    numericValue: '2.71828182845904523536',
    description: 'Base of the natural logarithm; rate of continuous growth',
    category: 'Constants',
    relatedModes: ['scientific', 'calculus', 'finance', 'graphing', 'statistics'],
    notes: 'Derivative of e^x is e^x; essential for exponential decay, continuous compounding, and calculus.'
  },
  {
    id: 'const_phi',
    name: 'Golden Ratio',
    symbol: 'φ (phi)',
    formula: 'φ = (1 + √5) / 2 ≈ 1.6180339887...',
    numericValue: '1.61803398874989484820',
    description: 'Geometric proportion where (a+b)/a = a/b',
    category: 'Constants',
    relatedModes: ['scientific', 'geometry', 'fractions'],
    notes: 'Occurs in Fibonacci sequences, pentagram geometry, and aesthetic design scaling.'
  },
  {
    id: 'const_c',
    name: 'Speed of Light in Vacuum',
    symbol: 'c',
    formula: 'c = 299,792,458 m/s (Exact)',
    numericValue: '299792458',
    unit: 'm/s',
    description: 'Universal physical constant; maximum speed at which energy and matter travel',
    category: 'Constants',
    relatedModes: ['scientific', 'converter'],
    notes: 'Defines the meter in SI units; foundational in Einstein relativity (E = mc²).'
  },
  {
    id: 'const_h',
    name: "Planck's Constant",
    symbol: 'h',
    formula: 'h = 6.62607015 × 10⁻³⁴ J·s (Exact)',
    numericValue: '6.62607015e-34',
    unit: 'J·s',
    description: 'Quantum of electromagnetic action relating photon energy to frequency (E = hf)',
    category: 'Constants',
    relatedModes: ['scientific', 'calculus'],
    notes: 'Defines the kilogram in the revised SI system.'
  },
  {
    id: 'const_hbar',
    name: 'Reduced Planck Constant (Dirac)',
    symbol: 'ℏ',
    formula: 'ℏ = h / (2π) ≈ 1.054571817 × 10⁻³⁴ J·s',
    numericValue: '1.054571817e-34',
    unit: 'J·s',
    description: 'Action quantum per radian, central to quantum mechanics and angular momentum',
    category: 'Constants',
    relatedModes: ['scientific', 'calculus']
  },
  {
    id: 'const_g',
    name: 'Standard Gravitational Acceleration',
    symbol: 'g₀',
    formula: 'g = 9.80665 m/s² (Exact)',
    numericValue: '9.80665',
    unit: 'm/s²',
    description: 'Nominal acceleration of free fall at Earth sea level at 45° latitude',
    category: 'Constants',
    relatedModes: ['scientific', 'converter', 'health'],
    notes: 'Used in weight = mass × g, projectile kinematics, and hydrostatic pressure.'
  },
  {
    id: 'const_G_big',
    name: 'Universal Gravitational Constant',
    symbol: 'G',
    formula: 'G = 6.67430(15) × 10⁻¹¹ N·m²/kg²',
    numericValue: '6.67430e-11',
    unit: 'N·m²/kg²',
    description: 'Proportionality factor in Newton law of universal gravitation and Einstein field equations',
    category: 'Constants',
    relatedModes: ['scientific', 'calculus']
  },
  {
    id: 'const_na',
    name: 'Avogadro Constant',
    symbol: 'N_A',
    formula: 'N_A = 6.02214076 × 10²³ mol⁻¹ (Exact)',
    numericValue: '6.02214076e23',
    unit: 'mol⁻¹',
    description: 'Number of constituent particles per mole of substance',
    category: 'Constants',
    relatedModes: ['scientific', 'converter']
  },
  {
    id: 'const_kb',
    name: 'Boltzmann Constant',
    symbol: 'k_B',
    formula: 'k_B = 1.380649 × 10⁻²³ J/K (Exact)',
    numericValue: '1.380649e-23',
    unit: 'J/K',
    description: 'Relates mean kinetic energy of gas particles with thermodynamic temperature',
    category: 'Constants',
    relatedModes: ['scientific', 'statistics']
  },
  {
    id: 'const_gas_r',
    name: 'Ideal Gas Constant',
    symbol: 'R',
    formula: 'R = N_A × k_B = 8.314462618 J/(mol·K)',
    numericValue: '8.314462618',
    unit: 'J/(mol·K)',
    description: 'Molar gas constant used in PV = nRT state equations',
    category: 'Constants',
    relatedModes: ['scientific', 'converter']
  },
  {
    id: 'const_charge_e',
    name: 'Elementary Charge',
    symbol: 'e⁻',
    formula: 'e = 1.602176634 × 10⁻¹⁹ C (Exact)',
    numericValue: '1.602176634e-19',
    unit: 'C',
    description: 'Electric charge carried by a single proton or electron magnitude',
    category: 'Constants',
    relatedModes: ['scientific', 'converter', 'programmer']
  },
  {
    id: 'const_atm',
    name: 'Standard Atmosphere',
    symbol: 'atm',
    formula: '1 atm = 101,325 Pa = 760 mmHg',
    numericValue: '101325',
    unit: 'Pa',
    description: 'Standard reference atmospheric pressure at sea level',
    category: 'Constants',
    relatedModes: ['converter', 'scientific']
  },
  {
    id: 'const_sqrt2',
    name: 'Pythagoras Constant (√2)',
    symbol: '√2',
    formula: '√2 ≈ 1.4142135623730950488',
    numericValue: '1.41421356237309504880',
    description: 'Length of the hypotenuse of an isosceles right triangle with unit legs',
    category: 'Constants',
    relatedModes: ['basic', 'scientific', 'geometry', 'fractions']
  },
  {
    id: 'const_gamma',
    name: 'Euler–Mascheroni Constant',
    symbol: 'γ',
    formula: 'γ = lim(∑(1/k) - ln(n)) ≈ 0.5772156649...',
    numericValue: '0.57721566490153286060',
    description: 'Limiting difference between harmonic series and natural logarithm',
    category: 'Constants',
    relatedModes: ['calculus', 'scientific']
  },

  // ==================== CALCULUS & NUMERICAL ANALYSIS ====================
  {
    id: 'calc_deriv_power',
    name: 'Power Rule of Differentiation',
    formula: 'd/dx [x^n] = n · x^(n - 1)',
    description: 'Derivative of polynomial terms for any real exponent n',
    category: 'Calculus',
    relatedModes: ['calculus', 'scientific', 'graphing'],
    notes: 'Fundamental building block for differentiating polynomial expressions.'
  },
  {
    id: 'calc_deriv_product',
    name: 'Product Rule (Leibniz)',
    formula: 'd/dx [u · v] = u\' · v + u · v\'',
    description: 'Derivative of the product of two differentiable functions',
    category: 'Calculus',
    relatedModes: ['calculus', 'graphing']
  },
  {
    id: 'calc_deriv_quotient',
    name: 'Quotient Rule',
    formula: 'd/dx [u / v] = (u\' · v - u · v\') / v²',
    description: 'Derivative of ratio of two functions where denominator v ≠ 0',
    category: 'Calculus',
    relatedModes: ['calculus', 'graphing']
  },
  {
    id: 'calc_deriv_chain',
    name: 'Chain Rule (Composite Functions)',
    formula: 'd/dx [f(g(x))] = f\'(g(x)) · g\'(x)',
    description: 'Derivative of nested or composite functions',
    category: 'Calculus',
    relatedModes: ['calculus', 'graphing']
  },
  {
    id: 'calc_integ_power',
    name: 'Power Rule of Integration',
    formula: '∫ x^n dx = (x^(n+1)) / (n+1) + C, (n ≠ -1)',
    description: 'Indefinite integral of polynomial powers; for n = -1, integral is ln|x| + C',
    category: 'Calculus',
    relatedModes: ['calculus', 'graphing']
  },
  {
    id: 'calc_integ_parts',
    name: 'Integration by Parts',
    formula: '∫ u dv = u·v - ∫ v du',
    description: 'Transforms integration of product into simpler integrals',
    category: 'Calculus',
    relatedModes: ['calculus']
  },
  {
    id: 'calc_simpson',
    name: "Simpson's 1/3 Rule (Numerical Quadrature)",
    formula: '∫[a,b] f(x)dx ≈ (h/3) [f(x₀) + 4∑f(x_odd) + 2∑f(x_even) + f(x_n)]',
    description: 'High-accuracy numerical integration approximating curves via parabolic arcs',
    category: 'Calculus',
    relatedModes: ['calculus', 'scientific']
  },
  {
    id: 'calc_newton',
    name: 'Newton–Raphson Root Finding',
    formula: 'x_(n+1) = x_n - f(x_n) / f\'(x_n)',
    description: 'Iterative quadratic convergence algorithm for finding equation roots f(x) = 0',
    category: 'Calculus',
    relatedModes: ['calculus', 'equation', 'scientific']
  },
  {
    id: 'calc_taylor',
    name: 'Taylor Series Expansion',
    formula: 'f(x) = ∑[k=0..∞] (f^(k)(a) / k!) · (x - a)^k',
    description: 'Representation of a smooth function as an infinite sum of polynomial derivatives',
    category: 'Calculus',
    relatedModes: ['calculus', 'scientific', 'graphing']
  },

  // ==================== ALGEBRA & POLYNOMIALS ====================
  {
    id: 'alg_quad',
    name: 'Quadratic Formula & Discriminant',
    formula: 'x = (-b ± √(b² - 4ac)) / (2a), Δ = b² - 4ac',
    description: 'Exact roots for ax² + bx + c = 0; Δ > 0 (2 real), Δ = 0 (1 real), Δ < 0 (complex)',
    category: 'Algebra',
    relatedModes: ['equation', 'basic', 'scientific', 'graphing']
  },
  {
    id: 'alg_vieta',
    name: "Vieta's Formulas (Quadratic & Cubic)",
    formula: 'x₁ + x₂ = -b/a,  x₁ · x₂ = c/a',
    description: 'Relates polynomial coefficients directly to sums and products of roots',
    category: 'Algebra',
    relatedModes: ['equation', 'fractions']
  },
  {
    id: 'alg_binomial',
    name: 'Binomial Theorem',
    formula: '(a + b)^n = ∑[k=0..n] (n C k) · a^(n-k) · b^k',
    description: 'Algebraic expansion of powers of a binomial using combination coefficients',
    category: 'Algebra',
    relatedModes: ['fractions', 'statistics', 'scientific']
  },
  {
    id: 'alg_log_rules',
    name: 'Logarithm Product & Quotient Laws',
    formula: 'log(xy) = log(x) + log(y),  log(x/y) = log(x) - log(y),  log(x^k) = k·log(x)',
    description: 'Fundamental algebraic simplification identities for logarithms across any base',
    category: 'Algebra',
    relatedModes: ['scientific', 'calculus', 'graphing']
  },
  {
    id: 'alg_ap_gp',
    name: 'Arithmetic & Geometric Series Sums',
    formula: 'S_AP = (n/2)[2a + (n-1)d],  S_GP = a(1 - r^n) / (1 - r)',
    description: 'Formulas for finite sum of arithmetic progression and geometric progression',
    category: 'Algebra',
    relatedModes: ['scientific', 'finance', 'fractions']
  },

  // ==================== GEOMETRY & TRIGONOMETRY ====================
  {
    id: 'geo_pythagoras',
    name: 'Pythagorean Theorem & Distance',
    formula: 'a² + b² = c²,  d = √((x₂ - x₁)² + (y₂ - y₁)²)',
    description: 'Fundamental relation among sides in right triangle and Cartesian 2D distance',
    category: 'Geometry & Trig',
    relatedModes: ['geometry', 'scientific', 'graphing', 'basic']
  },
  {
    id: 'geo_trig_identity',
    name: 'Pythagorean Trigonometric Identities',
    formula: 'sin²(θ) + cos²(θ) = 1,  1 + tan²(θ) = sec²(θ),  1 + cot²(θ) = csc²(θ)',
    description: 'Core identities connecting sine, cosine, tangent, and secant functions',
    category: 'Geometry & Trig',
    relatedModes: ['geometry', 'scientific', 'calculus']
  },
  {
    id: 'geo_double_angle',
    name: 'Double Angle Formulas',
    formula: 'sin(2θ) = 2sin(θ)cos(θ),  cos(2θ) = cos²(θ) - sin²(θ) = 2cos²(θ) - 1',
    description: 'Simplifies trigonometric terms with doubled frequency angles',
    category: 'Geometry & Trig',
    relatedModes: ['geometry', 'scientific', 'calculus']
  },
  {
    id: 'geo_law_sines_cosines',
    name: 'Law of Sines & Law of Cosines',
    formula: 'a/sin(A) = b/sin(B) = c/sin(C),  c² = a² + b² - 2ab·cos(C)',
    description: 'Solves arbitrary oblique non-right triangles given side/angle combinations (SAS, SSS, ASA)',
    category: 'Geometry & Trig',
    relatedModes: ['geometry', 'scientific']
  },
  {
    id: 'geo_heron',
    name: "Heron's Formula for Triangle Area",
    formula: 'Area = √(s(s - a)(s - b)(s - c)),  s = (a + b + c) / 2',
    description: 'Computes exact triangle area given only the three side lengths without heights',
    category: 'Geometry & Trig',
    relatedModes: ['geometry', 'scientific']
  },
  {
    id: 'geo_sphere_cylinder',
    name: 'Sphere & Cylinder Volumes',
    formula: 'V_sphere = (4/3)πr³,  V_cylinder = πr²h,  V_cone = (1/3)πr²h',
    description: 'Standard 3D solid geometry volume and surface area equations',
    category: 'Geometry & Trig',
    relatedModes: ['geometry', 'scientific', 'converter']
  },

  // ==================== MATRIX & LINEAR ALGEBRA ====================
  {
    id: 'mat_det_2x2_3x3',
    name: 'Matrix Determinant (2×2 & 3×3)',
    formula: 'det([a b; c d]) = ad - bc,  det(A) = a(ei-fh) - b(di-fg) + c(dh-eg)',
    description: 'Scalar value characterizing linear transformation scale and invertibility (det ≠ 0)',
    category: 'Matrix & Vectors',
    relatedModes: ['matrix', 'equation', 'scientific']
  },
  {
    id: 'mat_inverse',
    name: 'Matrix Inversion & Adjugate',
    formula: 'A⁻¹ = (1 / det(A)) · adj(A),  A · A⁻¹ = I',
    description: 'Multiplicative inverse matrix exists if and only if determinant is non-zero',
    category: 'Matrix & Vectors',
    relatedModes: ['matrix', 'equation']
  },
  {
    id: 'mat_dot_cross',
    name: 'Vector Dot Product & Cross Product',
    formula: 'A · B = |A||B|cos(θ) = ∑(a_i·b_i),  |A × B| = |A||B|sin(θ)',
    description: 'Dot product yields scalar projection; cross product yields orthogonal normal vector in 3D',
    category: 'Matrix & Vectors',
    relatedModes: ['matrix', 'geometry', 'scientific']
  },
  {
    id: 'mat_eigen',
    name: 'Eigenvalues Characteristic Equation',
    formula: 'det(A - λI) = 0,  A · v = λ · v',
    description: 'Scalar roots λ for which non-zero eigenvector v undergoes pure scaling',
    category: 'Matrix & Vectors',
    relatedModes: ['matrix', 'equation']
  },

  // ==================== STATISTICS & PROBABILITY ====================
  {
    id: 'stat_variance_sd',
    name: 'Sample & Population Standard Deviation',
    formula: 's = √[ ∑(x_i - x̄)² / (n - 1) ],  σ = √[ ∑(x_i - μ)² / N ]',
    description: 'Measure of the amount of variation or dispersion of a set of values from mean',
    category: 'Statistics',
    relatedModes: ['statistics', 'scientific']
  },
  {
    id: 'stat_zscore',
    name: 'Z-Score Normalization',
    formula: 'Z = (X - μ) / σ',
    description: 'Number of standard deviations an observation X is from the distribution mean μ',
    category: 'Statistics',
    relatedModes: ['statistics', 'health']
  },
  {
    id: 'stat_bayes',
    name: "Bayes' Theorem",
    formula: 'P(A|B) = [ P(B|A) · P(A) ] / P(B)',
    description: 'Determines conditional probability of event A given prior knowledge and new evidence B',
    category: 'Statistics',
    relatedModes: ['statistics', 'fractions']
  },
  {
    id: 'stat_comb_perm',
    name: 'Combinations & Permutations',
    formula: 'nCr = n! / (r!(n - r)!),  nPr = n! / (n - r)!',
    description: 'Selection count where order does not matter (combinations) or matters (permutations)',
    category: 'Statistics',
    relatedModes: ['statistics', 'fractions', 'scientific']
  },
  {
    id: 'stat_pearson',
    name: "Pearson's Correlation Coefficient",
    formula: 'r = ∑((x - x̄)(y - ȳ)) / [ √(∑(x - x̄)²) · √(∑(y - ȳ)²) ]',
    description: 'Linear correlation metric bounded between -1 (negative) and +1 (perfect positive)',
    category: 'Statistics',
    relatedModes: ['statistics', 'graphing']
  },

  // ==================== COMPUTER SCIENCE & BINARY ====================
  {
    id: 'cs_twos_comp',
    name: "Two's Complement Signed Negation",
    formula: '-X = ~X + 1 = (NOT X) + 1',
    description: 'Standard binary representation for signed integers in computer hardware arithmetic',
    category: 'Computer Science',
    relatedModes: ['programmer']
  },
  {
    id: 'cs_bit_shifts',
    name: 'Bitwise Shift Scaling',
    formula: 'X << k = X · 2^k,  X >> k = ⌊X / 2^k⌋',
    description: 'Left shift multiplies by powers of two; right shift performs unsigned integer division',
    category: 'Computer Science',
    relatedModes: ['programmer']
  },
  {
    id: 'cs_shannon',
    name: 'Shannon Information Entropy',
    formula: 'H(X) = -∑[i=1..n] P(x_i) · log₂(P(x_i))',
    description: 'Average level of information, surprise, or uncertainty in random variable outcome',
    category: 'Computer Science',
    relatedModes: ['programmer', 'statistics', 'scientific']
  },
  {
    id: 'cs_powers2',
    name: 'Common Powers of 2 Table',
    formula: '2¹⁰ = 1,024 (1 KiB), 2²⁰ = 1,048,576 (1 MiB), 2³² = 4,294,967,296, 2⁶⁴ ≈ 1.844×10¹⁹',
    description: 'Key binary memory boundaries, word limits, and address space capacities',
    category: 'Computer Science',
    relatedModes: ['programmer', 'converter']
  },

  // ==================== FINANCE & ECONOMICS ====================
  {
    id: 'fin_emi_loan',
    name: 'Loan EMI / Amortization Formula',
    formula: 'EMI = [ P · r · (1 + r)^n ] / [ (1 + r)^n - 1 ]',
    description: 'Fixed monthly installment on principal P at monthly interest rate r over n periods',
    category: 'Finance',
    relatedModes: ['finance', 'scientific']
  },
  {
    id: 'fin_compound_int',
    name: 'Compound Interest & Continuous Compounding',
    formula: 'A = P(1 + r/n)^(nt),  A_continuous = P · e^(rt)',
    description: 'Total accrued balance with periodic frequency compounding or continuous exponential growth',
    category: 'Finance',
    relatedModes: ['finance', 'scientific']
  },
  {
    id: 'fin_rule_72',
    name: 'Rule of 72 (Doubling Time)',
    formula: 'Years to Double ≈ 72 / (Annual Interest Rate %)',
    description: 'Quick accurate mental estimation for investment capital doubling period',
    category: 'Finance',
    relatedModes: ['finance', 'basic']
  },
  {
    id: 'fin_cagr',
    name: 'Compound Annual Growth Rate (CAGR)',
    formula: 'CAGR = (Ending Value / Beginning Value)^(1 / Years) - 1',
    description: 'Smoothed annualized rate of return across multiple investment holding periods',
    category: 'Finance',
    relatedModes: ['finance', 'statistics']
  },

  // ==================== HEALTH & BIOMETRICS ====================
  {
    id: 'hlth_bmi',
    name: 'Body Mass Index (BMI)',
    formula: 'BMI = weight(kg) / (height(m))² = [weight(lbs) / (height(in))²] × 703',
    description: 'Standard screening metric categorizing underweight (<18.5), normal (18.5-24.9), overweight (25-29.9), obese (≥30)',
    category: 'Health & Bio',
    relatedModes: ['health', 'converter']
  },
  {
    id: 'hlth_mifflin',
    name: 'Mifflin-St Jeor BMR Equation',
    formula: 'BMR_men = 10w + 6.25h - 5a + 5,  BMR_women = 10w + 6.25h - 5a - 161',
    description: 'Gold-standard formula predicting basal metabolic rate (weight in kg, height in cm, age in years)',
    category: 'Health & Bio',
    relatedModes: ['health', 'basic']
  },
  {
    id: 'hlth_karvonen',
    name: 'Karvonen Target Heart Rate Zone',
    formula: 'Target HR = [ (HR_max - HR_rest) × Intensity% ] + HR_rest,  HR_max = 220 - Age',
    description: 'Calculates cardio training heart rate training zones factoring individual resting heart rate',
    category: 'Health & Bio',
    relatedModes: ['health']
  },

  // ==================== UNIT FACTORS & CONVERSIONS ====================
  {
    id: 'unit_length',
    name: 'Length Conversion Ratios',
    formula: '1 inch = 2.54 cm (Exact),  1 foot = 0.3048 m,  1 mile = 1.609344 km',
    numericValue: '0.0254',
    unit: 'm/inch',
    description: 'Precise international imperial to metric conversion multipliers',
    category: 'Unit Factors',
    relatedModes: ['converter', 'basic']
  },
  {
    id: 'unit_mass',
    name: 'Mass Conversion Ratios',
    formula: '1 lb (avoirdupois) = 0.45359237 kg (Exact),  1 oz = 28.349523125 g',
    numericValue: '0.45359237',
    unit: 'kg/lb',
    description: 'Standard international mass definition relating pounds to kilograms',
    category: 'Unit Factors',
    relatedModes: ['converter']
  },
  {
    id: 'unit_temp',
    name: 'Temperature Scale Conversions',
    formula: '°F = (°C × 9/5) + 32,  °C = (°F - 32) × 5/9,  K = °C + 273.15',
    description: 'Equations converting between Celsius, Fahrenheit, and absolute Kelvin',
    category: 'Unit Factors',
    relatedModes: ['converter', 'scientific']
  },
  {
    id: 'unit_energy',
    name: 'Energy & Work Conversion Multipliers',
    formula: '1 eV = 1.602176634×10⁻¹⁹ J,  1 cal = 4.184 J,  1 kWh = 3,600,000 J',
    numericValue: '4.184',
    unit: 'J/cal',
    description: 'Conversion rates across electron-volts, thermochemical calories, and kilowatt-hours',
    category: 'Unit Factors',
    relatedModes: ['converter', 'scientific']
  }
];

export const FormulasPanel: React.FC<FormulasPanelProps> = ({ settings, onNavigateMode }) => {
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    'All',
    'Constants',
    'Calculus',
    'Algebra',
    'Geometry & Trig',
    'Matrix & Vectors',
    'Statistics',
    'Computer Science',
    'Finance',
    'Health & Bio',
    'Unit Factors'
  ];

  const handleCopy = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FORMULAS_AND_CONSTANTS_DATABASE.filter((item) => {
      const matchCat = selectedCat === 'All' || item.category === selectedCat;
      if (!matchCat) return false;
      if (!q) return true;

      return (
        item.name.toLowerCase().includes(q) ||
        (item.symbol && item.symbol.toLowerCase().includes(q)) ||
        item.formula.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.numericValue && item.numericValue.toLowerCase().includes(q)) ||
        item.relatedModes.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [selectedCat, search]);

  const isLight = settings?.theme === 'light';
  const isOled = settings?.theme === 'oled';

  const cardBg = isLight 
    ? 'bg-white border-slate-200 shadow-sm' 
    : isOled 
    ? 'bg-black border-zinc-800' 
    : 'bg-slate-900 border-slate-800 shadow-xl';

  const innerBoxBg = isLight
    ? 'bg-slate-50 border-slate-200'
    : isOled
    ? 'bg-zinc-950 border-zinc-800/80'
    : 'bg-slate-950 border-slate-800';

  const textHeading = isLight ? 'text-slate-900' : 'text-slate-100';
  const textBody = isLight ? 'text-slate-600' : 'text-slate-400';
  const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';

  const btnAction = isLight
    ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
    : isOled
    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700';

  return (
    <div className="max-w-6xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Top Banner / Summary */}
      <div className={`${cardBg} border rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className={`text-lg font-bold ${textHeading}`}>
              Formulas & Constants Knowledge Base
            </h1>
          </div>
          <p className={`text-xs ${textBody} max-w-2xl`}>
            Comprehensive reference across physics, calculus, geometry, matrix algebra, statistics, computer science, finance, and unit constants supporting every section of OmniCalc Pro.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 rounded-2xl ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800/80 border-slate-700/80 text-slate-300'} border text-xs font-semibold flex items-center gap-2`}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{FORMULAS_AND_CONSTANTS_DATABASE.length} Curated Items</span>
          </div>
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div className={`${cardBg} border rounded-3xl p-4 flex flex-col gap-3 transition-colors`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className={`flex items-center gap-2 w-full md:w-80 ${isLight ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-800/90 border-slate-700/80 text-slate-100'} border px-3.5 py-2.5 rounded-2xl shadow-inner`}>
            <Search className={`w-4 h-4 ${textMuted}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, symbol (π, c, e), formula, or module..."
              className={`bg-transparent border-none text-xs ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-400'} focus:outline-none w-full`}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className={`text-xs font-medium ${textMuted}`}>
            Showing <strong className="text-sky-500 font-bold">{filtered.length}</strong> of {FORMULAS_AND_CONSTANTS_DATABASE.length}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`
                px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-xs flex-shrink-0
                ${selectedCat === cat
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                  : isOled
                  ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Formula & Constant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const hasNumeric = !!item.numericValue;
          return (
            <div
              key={item.id}
              className={`${cardBg} border rounded-3xl p-5 flex flex-col justify-between gap-3 transition-all`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {item.symbol && (
                      <span className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-mono font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {item.symbol}
                      </span>
                    )}
                    <div>
                      <h3 className={`text-sm font-bold ${textHeading} leading-tight`}>
                        {item.name}
                      </h3>
                      {item.unit && (
                        <span className={`text-[11px] font-mono ${textMuted}`}>
                          Unit: {item.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-800 text-sky-400 border-slate-700'} border whitespace-nowrap flex-shrink-0`}>
                    {item.category}
                  </span>
                </div>

                <p className={`text-xs ${textBody} mt-1 leading-relaxed`}>
                  {item.description}
                </p>

                {item.notes && (
                  <p className={`text-[11px] ${textMuted} italic ${isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-950/40 border-slate-800/60'} p-2 rounded-xl border mt-1`}>
                    💡 {item.notes}
                  </p>
                )}
              </div>

              {/* Formula & Values Box */}
              <div className={`${innerBoxBg} border rounded-2xl p-3 flex flex-col gap-2`}>
                <div className="flex items-center justify-between gap-2">
                  <div className={`overflow-x-auto scrollbar-none font-mono text-xs font-bold ${isLight ? 'text-sky-700' : 'text-sky-300'} py-0.5`}>
                    {item.formula}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {hasNumeric && (
                      <button
                        onClick={() => handleCopy(`${item.id}_val`, item.numericValue!)}
                        className={`px-2 py-1 ${btnAction} rounded-lg transition-all border text-[10px] font-mono font-bold flex items-center gap-1 shadow-xs`}
                        title="Copy exact numeric value"
                      >
                        {copiedId === `${item.id}_val` ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Hash className="w-3 h-3 text-sky-500" />
                        )}
                        Value
                      </button>
                    )}

                    <button
                      onClick={() => handleCopy(item.id, item.formula)}
                      className={`p-1.5 ${btnAction} rounded-lg transition-all border flex items-center justify-center shadow-xs`}
                      title="Copy formula text"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Connected Section Badges */}
                <div className={`flex items-center gap-1.5 flex-wrap pt-1.5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  <span className={`text-[10px] ${textMuted} font-semibold flex items-center gap-1`}>
                    <Layers className="w-3 h-3 text-sky-500" />
                    Works with:
                  </span>
                  {item.relatedModes.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onNavigateMode?.(mode)}
                      className={`text-[10px] px-2 py-0.5 rounded-md ${isLight ? 'bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border-slate-200' : 'bg-slate-800/90 hover:bg-sky-950/60 hover:text-sky-300 text-slate-300 border-slate-700/60'} font-medium border transition-colors shadow-2xs`}
                      title={`Jump to ${mode} calculator`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className={`${cardBg} border rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3`}>
          <HelpCircle className="w-10 h-10 text-slate-400" />
          <h4 className={`text-base font-bold ${textHeading}`}>No matching formulas or constants</h4>
          <p className={`text-xs ${textMuted} max-w-sm`}>
            Try searching for a different keyword like "integral", "derivative", "pi", "gravity", "EMI", or "binary".
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCat('All');
            }}
            className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20"
          >
            Clear Search Filter
          </button>
        </div>
      )}
    </div>
  );
};
