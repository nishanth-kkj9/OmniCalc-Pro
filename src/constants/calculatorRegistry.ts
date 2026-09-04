/**
 * Authoritative Central Calculator Registry for OmniCalc Pro.
 * Provides the single source of truth for calculator modes, metadata,
 * categorization, keywords, capabilities, and desktop/web parity status.
 */

import { CalcMode } from '../types';

export type CalculatorCategory =
  | 'Core & Math'
  | 'Advanced & Science'
  | 'Data & Probability'
  | 'Practical & Life'
  | 'Tools & Reference';

export interface CalculatorEntry {
  id: CalcMode;
  label: string;
  shortLabel?: string;
  category: CalculatorCategory;
  description: string;
  keywords: string[];
  capabilities: string[];
  webSupported: boolean;
  desktopSupported: boolean;
  status: 'stable' | 'beta' | 'new';
  badge?: string;
  iconName: string;
}

export const CALCULATOR_REGISTRY: CalculatorEntry[] = [
  // Core & Math
  {
    id: 'basic',
    label: 'Basic Calculator',
    shortLabel: 'Basic',
    category: 'Core & Math',
    description: 'Standard arithmetic calculations, percentage adjustments, and multi-value memory banks.',
    keywords: ['arithmetic', 'standard', 'memory', 'plus', 'minus', 'percent', 'percentage'],
    capabilities: ['Addition/Subtraction', 'Multiplication/Division', 'Percentage', 'Memory M+/M-/MR/MC'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Calculator',
  },
  {
    id: 'scientific',
    label: 'Scientific Calculator',
    shortLabel: 'Scientific',
    category: 'Core & Math',
    description: 'Trigonometry, hyperbolic functions, logarithms, powers, factorials, and physical constants with multi-angle support.',
    keywords: ['trig', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'exp', 'power', 'factorial', 'angle'],
    capabilities: ['Trig/Hyperbolic', 'Logarithms ln/log10/log2', 'Arbitrary Powers & Roots', 'Angle Modes DEG/RAD/GRAD', 'Constants π/e/φ'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Sparkles',
  },
  {
    id: 'graph',
    label: 'Graphing Calculator',
    shortLabel: 'Graphing',
    category: 'Core & Math',
    description: 'Interactive multi-function graphing, polar/parametric plotting, numerical calculus overlay, roots, extrema, and trace.',
    keywords: ['graph', 'plot', 'curve', 'cartesian', 'polar', 'parametric', 'inequality', 'roots', 'extrema', 'intersections', 'trace', 'table'],
    capabilities: ['Cartesian y=f(x)', 'Polar r=f(θ)', 'Parametric (x(t), y(t))', 'Inequalities', 'Roots & Extrema', 'Intersections', 'Derivative Overlay', 'Definite Integral Shading'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'TrendingUp',
  },
  {
    id: 'fractions',
    label: 'Fractions & Number Theory',
    shortLabel: 'Fractions',
    category: 'Core & Math',
    description: 'Exact rational arithmetic, auto-simplification, GCD/LCM trees, prime factorization, and decimal conversion.',
    keywords: ['fraction', 'rational', 'simplify', 'gcd', 'lcm', 'prime', 'factorization', 'mixed fraction', 'divisors'],
    capabilities: ['Exact Rational Arithmetic', 'GCD / LCM Decomposition', 'Prime Factorization', 'Fraction to Decimal', 'Mixed Fraction Form'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Divide',
  },
  {
    id: 'geometry',
    label: 'Geometry & Vectors',
    shortLabel: 'Geometry',
    category: 'Core & Math',
    description: 'Triangle solver (SSS/SAS/ASA/AAS/SSA), 2D/3D shapes mensuration, 2D line analysis, and 3D vector cross/dot products.',
    keywords: ['triangle', 'trigonometry', 'area', 'perimeter', 'volume', 'heron', 'inradius', 'circumradius', '2d line', 'vector', 'dot product', 'cross product'],
    capabilities: ['Triangle Solver', '2D Shape Mensuration', '3D Solid Geometry', '2D Line Analysis', '3D Vector Operations'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Triangle',
  },

  // Advanced & Science
  {
    id: 'equation',
    label: 'Equation & System Solver',
    shortLabel: 'Equations',
    category: 'Advanced & Science',
    description: 'Linear, quadratic with discriminant steps, cubic root solver, 2x2/3x3 linear systems via Cramer\'s rule, and Newton-Raphson nonlinear solving.',
    keywords: ['equation', 'solve', 'linear', 'quadratic', 'cubic', 'cramer', 'system of equations', 'roots', 'newton'],
    capabilities: ['Linear 1-Variable', 'Quadratic with Discriminant', 'Cubic Cardano Solver', '2x2 & 3x3 Linear Systems', 'Nonlinear Numerical Root Solver'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Equal',
  },
  {
    id: 'calculus',
    label: 'Calculus & Numerical Suite',
    shortLabel: 'Calculus',
    category: 'Advanced & Science',
    description: 'Definite numerical integration (Simpson & Romberg), adaptive derivatives, tangent & normal line formulas, and root finding.',
    keywords: ['calculus', 'integral', 'derivative', 'simpson', 'romberg', 'tangent', 'normal', 'newton raphson', 'extrema', 'inflection'],
    capabilities: ['Simpson/Romberg Quadrature', 'Central-Difference Derivatives', 'Tangent & Normal Equations', 'Newton-Raphson Solver', 'Extrema Isolation'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Sigma',
  },
  {
    id: 'matrix',
    label: 'Matrix & Linear Algebra',
    shortLabel: 'Matrix',
    category: 'Advanced & Science',
    description: 'Matrix arithmetic, Gauss-Jordan inverse with partial pivoting, determinants, transpose, trace, rank, nullity, RREF, powers, and eigenvalues.',
    keywords: ['matrix', 'linear algebra', 'determinant', 'inverse', 'transpose', 'trace', 'rref', 'rank', 'nullity', 'eigenvalue', 'matrix power'],
    capabilities: ['Matrix Arithmetic (+, -, *)', 'Determinant Analysis', 'Gauss-Jordan Inversion', 'RREF Decomposition', 'Rank & Nullity', 'Eigenvalues'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Grid',
  },
  {
    id: 'complex',
    label: 'Complex Numbers & Phasors',
    shortLabel: 'Complex',
    category: 'Advanced & Science',
    description: 'Rectangular, Polar, Euler forms, De Moivre n-th roots of unity, complex conjugate arithmetic, and AC RLC impedance modeling.',
    keywords: ['complex', 'imaginary', 'polar', 'euler', 'phasor', 'roots of unity', 'impedance', 'rlc', 'arg', 'modulus', 'conjugate'],
    capabilities: ['Rectangular / Polar / Euler Forms', 'De Moivre Roots', 'Complex Conjugate & Arithmetic', 'AC RLC Impedance & Phasors'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Compass',
  },
  {
    id: 'sequences',
    label: 'Sequences & Series',
    shortLabel: 'Sequences',
    category: 'Advanced & Science',
    description: 'Arithmetic, Geometric, Fibonacci, and Harmonic series generators with closed-form n-th terms, partial sums, limit approximations, and ratio convergence tests.',
    keywords: ['sequence', 'series', 'arithmetic', 'geometric', 'fibonacci', 'harmonic', 'partial sum', 'convergence', 'ratio test', 'recurrence'],
    capabilities: ['Arithmetic Sequence (an, Sn)', 'Geometric Sequence (an, Sn)', 'Fibonacci Generator', 'Harmonic Divergence Analysis', 'Convergence Ratio Test'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'ListOrdered',
  },

  // Data & Probability
  {
    id: 'statistics',
    label: 'Descriptive Statistics',
    shortLabel: 'Statistics',
    category: 'Data & Probability',
    description: 'Dataset statistics: mean, median, mode, sample/population variance, standard deviation, IQR, skewness, kurtosis, quartiles, and Z-scores.',
    keywords: ['statistics', 'mean', 'median', 'mode', 'variance', 'standard deviation', 'std dev', 'iqr', 'quartile', 'skewness', 'kurtosis', 'z-score'],
    capabilities: ['Central Tendency (Mean/Median/Mode)', 'Dispersion (Variance, StdDev, IQR)', 'Shape (Skewness, Kurtosis)', 'Quartile Breakdown', 'Z-Score Normalization'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'BarChart2',
  },
  {
    id: 'regression',
    label: 'Regression & Curve Fitting',
    shortLabel: 'Regression',
    category: 'Data & Probability',
    description: 'Linear, Polynomial (deg 2–5), Exponential, Power, and Logarithmic regressions with complete ANOVA metrics, R², residuals, and inverse predictions.',
    keywords: ['regression', 'curve fitting', 'linear regression', 'polynomial fit', 'exponential fit', 'power fit', 'r2', 'residuals', 'prediction', 'anova'],
    capabilities: ['Linear Fit (y = mx + b)', 'Polynomial Fit (Degree 2–5)', 'Exponential Fit (y = a*e^(bx))', 'Power Fit (y = a*x^b)', 'Logarithmic Fit (y = a + b*ln(x))', 'Residuals Analysis & Plot', 'Inverse Root-Finding Prediction'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Activity',
  },
  {
    id: 'probability',
    label: 'Probability Distributions',
    shortLabel: 'Probability',
    category: 'Data & Probability',
    description: 'Discrete and continuous probability distributions: Normal, Binomial, Poisson, Student\'s t, Chi-Square, Exponential, and Uniform with PDF/PMF, CDF, quantiles, and moments.',
    keywords: ['probability', 'distribution', 'normal', 'gaussian', 'binomial', 'poisson', 'student t', 'chi square', 'exponential', 'pdf', 'pmf', 'cdf', 'quantile'],
    capabilities: ['PDF / PMF Analytical Curves', 'Cumulative Distribution CDF', 'Inverse CDF / Quantile (p-value)', 'Moments (Mean, Variance, Skew, Kurtosis)', 'Interval Probability P(a <= X <= b)'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Layers',
  },
  {
    id: 'inference',
    label: 'Statistical Inference & Tests',
    shortLabel: 'Inference',
    category: 'Data & Probability',
    description: 'Confidence intervals (1/2 means, proportions, variance), hypothesis testing (z-test, t-test, paired t, ANOVA), Chi-Square tests, and effect size calculations.',
    keywords: ['inference', 'hypothesis test', 'confidence interval', 'z test', 't test', 'anova', 'chi square test', 'p value', 'effect size', 'cohen d', 'welch'],
    capabilities: ['1-Sample & 2-Sample Z-Tests', 'Student\'s t & Welch\'s t-Tests', 'Paired Differences t-Test', '1-Sample & 2-Sample Proportion Tests', 'Chi-Square Goodness-of-Fit', 'Chi-Square Test of Independence', 'One-Way ANOVA (F-Test)', 'Confidence Intervals (Mean, Prop, Var)', 'Effect Sizes (Cohen\'s d, η²)'],
    webSupported: true,
    desktopSupported: true,
    status: 'new',
    badge: 'New',
    iconName: 'Layers',
  },

  // Practical & Life
  {
    id: 'programmer',
    label: 'Programmer Calculator',
    shortLabel: 'Programmer',
    category: 'Practical & Life',
    description: 'Multi-radix arithmetic (HEX, DEC, OCT, BIN), bit width toggles (64/32/16/8-bit), bitwise logic gates, bit shifts, and 2\'s complement.',
    keywords: ['hex', 'bin', 'oct', 'dec', 'bitwise', 'and', 'or', 'xor', 'not', 'shift', 'twos complement', 'byte', 'word'],
    capabilities: ['Radix Conversions (HEX/DEC/OCT/BIN)', 'Word Size (64/32/16/8-bit)', 'Bitwise Operations (AND/OR/XOR/NOT/NAND/NOR)', 'Bit Shifts (LSH/RSH/ROTL/ROTR)', 'Interactive Bitfield Matrix'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Binary',
  },
  {
    id: 'converter',
    label: 'Unit Converter',
    shortLabel: 'Units',
    category: 'Practical & Life',
    description: 'Standard unit conversions across 13 everyday categories with real-time bidirectional calculation and SI prefix scaling.',
    keywords: ['unit', 'converter', 'length', 'mass', 'weight', 'temperature', 'speed', 'time', 'area', 'volume', 'pressure', 'energy', 'power', 'storage'],
    capabilities: ['13 Standard Categories', 'Length, Mass, Temperature, Speed, Storage', 'Time, Area, Volume, Pressure, Energy, Power', 'Bidirectional Live Updates'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'ArrowLeftRight',
  },
  {
    id: 'physical_units',
    label: 'Physical Units & Dimensional Engine',
    shortLabel: 'Physics Units',
    category: 'Practical & Life',
    description: 'Compound dimensional physical units evaluator, SI prefix engine, fundamental physics constants, and interactive formulas.',
    keywords: ['physics', 'physical units', 'dimensions', 'compound units', 'constants', 'dimensional analysis', 'si units', 'newtons', 'joules', 'watts'],
    capabilities: ['Dimensional Vector Analysis (M, L, T, I, Θ, N, J)', 'Compound Expression Evaluation', 'Physics Constants Database', 'Interactive Physics Formula Solvers'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Sparkles',
  },
  {
    id: 'finance',
    label: 'Finance & Loan EMI',
    shortLabel: 'Finance',
    category: 'Practical & Life',
    description: 'Mortgage/Loan EMI amortization schedules, compound interest wealth builder, GST/Sales Tax calculator, and percentage discounts.',
    keywords: ['finance', 'loan', 'emi', 'mortgage', 'compound interest', 'sip', 'tax', 'gst', 'discount', 'amortization'],
    capabilities: ['Loan / Mortgage EMI Amortization', 'Compound Interest SIP Wealth Forecaster', 'GST & Sales Tax Calculations', 'Commercial Markup & Discount'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'DollarSign',
  },
  {
    id: 'datetime',
    label: 'Date & Time Calculator',
    shortLabel: 'Date/Time',
    category: 'Practical & Life',
    description: 'Date span difference (days, weeks, months, years), business working days excluding weekends/holidays, event countdown, and work shift hours.',
    keywords: ['date', 'time', 'duration', 'calendar', 'working days', 'business days', 'countdown', 'shift', 'hours', 'wages'],
    capabilities: ['Date Span Duration', 'Business Working Days', 'Event Target Countdown', 'Work Shift Wage Tracker'],
    webSupported: true,
    desktopSupported: false,
    status: 'stable',
    iconName: 'Calendar',
  },
  {
    id: 'health',
    label: 'Health & Fitness Suite',
    shortLabel: 'Health',
    category: 'Practical & Life',
    description: 'Body Mass Index (BMI) with category visualizer, Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), and Karvonen heart rate zones.',
    keywords: ['health', 'bmi', 'bmr', 'tdee', 'heart rate', 'calories', 'fitness', 'body mass', 'karvonen'],
    capabilities: ['BMI Visual Scale', 'BMR (Harris-Benedict & Mifflin-St Jeor)', 'TDEE Activity Level Multiplier', 'Karvonen Target Heart Rate Training Zones'],
    webSupported: true,
    desktopSupported: false,
    status: 'stable',
    iconName: 'Heart',
  },

  // Tools & Reference
  {
    id: 'formulas',
    label: 'Formulas & Reference Library',
    shortLabel: 'Formulas',
    category: 'Tools & Reference',
    description: 'Fundamental physical constants catalog and searchable interactive cheat sheet for algebra, trigonometry, calculus, and geometry identities.',
    keywords: ['formula', 'constants', 'reference', 'physics constants', 'trig identities', 'calculus formulas', 'geometry reference'],
    capabilities: ['Fundamental Constants Catalog', 'Algebra, Trig, Calculus Reference', 'One-Click Direct Bridge to Calculator'],
    webSupported: true,
    desktopSupported: false,
    status: 'stable',
    iconName: 'BookOpen',
  },
  {
    id: 'history',
    label: 'Calculation History',
    shortLabel: 'History',
    category: 'Tools & Reference',
    description: 'Searchable audit trail with engine filter tags, timestamps, copy buttons, and one-click JSON/CSV data export.',
    keywords: ['history', 'audit', 'log', 'export', 'csv', 'json', 'timestamps', 'saved calculations'],
    capabilities: ['Searchable Audit Trail', 'Filter by Calculator Mode', 'Copy Expression/Result', 'Export to JSON & CSV'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'History',
  },
  {
    id: 'settings',
    label: 'Preferences & Settings',
    shortLabel: 'Settings',
    category: 'Tools & Reference',
    description: 'Custom themes (Dark Slate, Light, OLED True Black), accent colors, synthesized mechanical audio feedback, precision, and default angle units.',
    keywords: ['settings', 'preferences', 'theme', 'dark mode', 'oled', 'accent color', 'audio', 'sound', 'precision', 'angle mode'],
    capabilities: ['Dark / Light / OLED True Black Themes', '6 Accent Color Presets', 'Synthesized Web Audio Feedback', 'Precision & Number Formatting Controls', 'Default Angle Unit Selection'],
    webSupported: true,
    desktopSupported: true,
    status: 'stable',
    iconName: 'Settings',
  },
];

/**
 * Returns the metadata for a given CalcMode.
 */
export function getCalculatorEntry(mode: CalcMode): CalculatorEntry | undefined {
  return CALCULATOR_REGISTRY.find((calc) => calc.id === mode);
}

/**
 * Groups all registered calculators by category.
 */
export function getCalculatorsByCategory(): Record<CalculatorCategory, CalculatorEntry[]> {
  const grouped: Record<CalculatorCategory, CalculatorEntry[]> = {
    'Core & Math': [],
    'Advanced & Science': [],
    'Data & Probability': [],
    'Practical & Life': [],
    'Tools & Reference': [],
  };

  CALCULATOR_REGISTRY.forEach((calc) => {
    grouped[calc.category].push(calc);
  });

  return grouped;
}

/**
 * Validates if a mode string corresponds to a valid registered calculator.
 */
export function isValidCalcMode(mode: string): mode is CalcMode {
  return CALCULATOR_REGISTRY.some((calc) => calc.id === mode);
}
