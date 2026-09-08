"""
Formulas & Constants Knowledge Base Engine for OmniCalc Pro.
Provides pure, standard-library-based access, search, and category filtering
for universal physical constants, calculus, algebra, geometry, matrix algebra,
statistics, computer science, finance, and unit conversion factors.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class FormulaConstantItem:
    id: str
    name: str
    formula: str
    description: str
    category: str
    related_modes: List[str]
    symbol: Optional[str] = None
    numeric_value: Optional[str] = None
    unit: Optional[str] = None
    notes: Optional[str] = None

    @property
    def relatedModes(self) -> List[str]:
        return self.related_modes

    @property
    def numericValue(self) -> Optional[str]:
        return self.numeric_value


CATEGORIES: List[str] = [
    "All",
    "Constants",
    "Calculus",
    "Algebra",
    "Geometry & Trig",
    "Matrix & Vectors",
    "Statistics",
    "Computer Science",
    "Finance",
    "Health & Bio",
    "Unit Factors",
]


FORMULAS_AND_CONSTANTS_DATABASE: List[FormulaConstantItem] = [
    FormulaConstantItem(
        id="const_pi",
        name="Pi (Archimedes Constant)",
        symbol="π",
        formula="π = 3.141592653589793...",
        description="Ratio of a circle circumference to its diameter in Euclidean space",
        category="Constants",
        numeric_value="3.14159265358979323846",
        related_modes=["basic","scientific","geometry","calculus"],
        notes="Used in circle geometry, trigonometric radians, Fourier transforms, and Gaussian distributions.",
    ),
    FormulaConstantItem(
        id="const_e",
        name="Euler's Number (Natural Base)",
        symbol="e",
        formula="e = lim(1 + 1/n)^n = 2.718281828459...",
        description="Base of the natural logarithm; rate of continuous growth",
        category="Constants",
        numeric_value="2.71828182845904523536",
        related_modes=["scientific","calculus","finance","statistics"],
        notes="Derivative of e^x is e^x; essential for exponential decay, continuous compounding, and calculus.",
    ),
    FormulaConstantItem(
        id="const_phi",
        name="Golden Ratio",
        symbol="φ (phi)",
        formula="φ = (1 + √5) / 2 ≈ 1.6180339887...",
        description="Geometric proportion where (a+b)/a = a/b",
        category="Constants",
        numeric_value="1.61803398874989484820",
        related_modes=["scientific","geometry","fractions"],
        notes="Occurs in Fibonacci sequences, pentagram geometry, and aesthetic design scaling.",
    ),
    FormulaConstantItem(
        id="const_c",
        name="Speed of Light in Vacuum",
        symbol="c",
        formula="c = 299,792,458 m/s (Exact)",
        description="Universal physical constant; maximum speed at which energy and matter travel",
        category="Constants",
        numeric_value="299792458",
        unit="m/s",
        related_modes=["scientific","converter"],
        notes="Defines the meter in SI units; foundational in Einstein relativity (E = mc²).",
    ),
    FormulaConstantItem(
        id="const_h",
        name="Planck's Constant",
        symbol="h",
        formula="h = 6.62607015 × 10⁻³⁴ J·s (Exact)",
        description="Quantum of electromagnetic action relating photon energy to frequency (E = hf)",
        category="Constants",
        numeric_value="6.62607015e-34",
        unit="J·s",
        related_modes=["scientific","calculus"],
        notes="Defines the kilogram in the revised SI system.",
    ),
    FormulaConstantItem(
        id="const_hbar",
        name="Reduced Planck Constant (Dirac)",
        symbol="ℏ",
        formula="ℏ = h / (2π) ≈ 1.054571817 × 10⁻³⁴ J·s",
        description="Action quantum per radian, central to quantum mechanics and angular momentum",
        category="Constants",
        numeric_value="1.054571817e-34",
        unit="J·s",
        related_modes=["scientific","calculus"],
    ),
    FormulaConstantItem(
        id="const_g",
        name="Standard Gravitational Acceleration",
        symbol="g₀",
        formula="g = 9.80665 m/s² (Exact)",
        description="Nominal acceleration of free fall at Earth sea level at 45° latitude",
        category="Constants",
        numeric_value="9.80665",
        unit="m/s²",
        related_modes=["scientific","converter","health"],
        notes="Used in weight = mass × g, projectile kinematics, and hydrostatic pressure.",
    ),
    FormulaConstantItem(
        id="const_G_big",
        name="Universal Gravitational Constant",
        symbol="G",
        formula="G = 6.67430(15) × 10⁻¹¹ N·m²/kg²",
        description="Proportionality factor in Newton law of universal gravitation and Einstein field equations",
        category="Constants",
        numeric_value="6.67430e-11",
        unit="N·m²/kg²",
        related_modes=["scientific","calculus"],
    ),
    FormulaConstantItem(
        id="const_na",
        name="Avogadro Constant",
        symbol="N_A",
        formula="N_A = 6.02214076 × 10²³ mol⁻¹ (Exact)",
        description="Number of constituent particles per mole of substance",
        category="Constants",
        numeric_value="6.02214076e23",
        unit="mol⁻¹",
        related_modes=["scientific","converter"],
    ),
    FormulaConstantItem(
        id="const_kb",
        name="Boltzmann Constant",
        symbol="k_B",
        formula="k_B = 1.380649 × 10⁻²³ J/K (Exact)",
        description="Relates mean kinetic energy of gas particles with thermodynamic temperature",
        category="Constants",
        numeric_value="1.380649e-23",
        unit="J/K",
        related_modes=["scientific","statistics"],
    ),
    FormulaConstantItem(
        id="const_gas_r",
        name="Ideal Gas Constant",
        symbol="R",
        formula="R = N_A × k_B = 8.314462618 J/(mol·K)",
        description="Molar gas constant used in PV = nRT state equations",
        category="Constants",
        numeric_value="8.314462618",
        unit="J/(mol·K)",
        related_modes=["scientific","converter"],
    ),
    FormulaConstantItem(
        id="const_charge_e",
        name="Elementary Charge",
        symbol="e⁻",
        formula="e = 1.602176634 × 10⁻¹⁹ C (Exact)",
        description="Electric charge carried by a single proton or electron magnitude",
        category="Constants",
        numeric_value="1.602176634e-19",
        unit="C",
        related_modes=["scientific","converter","programmer"],
    ),
    FormulaConstantItem(
        id="const_atm",
        name="Standard Atmosphere",
        symbol="atm",
        formula="1 atm = 101,325 Pa = 760 mmHg",
        description="Standard reference atmospheric pressure at sea level",
        category="Constants",
        numeric_value="101325",
        unit="Pa",
        related_modes=["converter","scientific"],
    ),
    FormulaConstantItem(
        id="const_sqrt2",
        name="Pythagoras Constant (√2)",
        symbol="√2",
        formula="√2 ≈ 1.4142135623730950488",
        description="Length of the hypotenuse of an isosceles right triangle with unit legs",
        category="Constants",
        numeric_value="1.41421356237309504880",
        related_modes=["basic","scientific","geometry","fractions"],
    ),
    FormulaConstantItem(
        id="const_gamma",
        name="Euler–Mascheroni Constant",
        symbol="γ",
        formula="γ = lim(∑(1/k) - ln(n)) ≈ 0.5772156649...",
        description="Limiting difference between harmonic series and natural logarithm",
        category="Constants",
        numeric_value="0.57721566490153286060",
        related_modes=["calculus","scientific"],
    ),
    FormulaConstantItem(
        id="calc_deriv_power",
        name="Power Rule of Differentiation",
        formula="d/dx [x^n] = n · x^(n - 1)",
        description="Derivative of polynomial terms for any real exponent n",
        category="Calculus",
        related_modes=["calculus","scientific"],
        notes="Fundamental building block for differentiating polynomial expressions.",
    ),
    FormulaConstantItem(
        id="calc_deriv_product",
        name="Product Rule (Leibniz)",
        formula="d/dx [u · v] = u' · v + u · v'",
        description="Derivative of the product of two differentiable functions",
        category="Calculus",
        related_modes=["calculus"],
    ),
    FormulaConstantItem(
        id="calc_deriv_quotient",
        name="Quotient Rule",
        formula="d/dx [u / v] = (u' · v - u · v') / v²",
        description="Derivative of ratio of two functions where denominator v ≠ 0",
        category="Calculus",
        related_modes=["calculus"],
    ),
    FormulaConstantItem(
        id="calc_deriv_chain",
        name="Chain Rule (Composite Functions)",
        formula="d/dx [f(g(x))] = f'(g(x)) · g'(x)",
        description="Derivative of nested or composite functions",
        category="Calculus",
        related_modes=["calculus"],
    ),
    FormulaConstantItem(
        id="calc_integ_power",
        name="Power Rule of Integration",
        formula="∫ x^n dx = (x^(n+1)) / (n+1) + C, (n ≠ -1)",
        description="Indefinite integral of polynomial powers; for n = -1, integral is ln|x| + C",
        category="Calculus",
        related_modes=["calculus"],
    ),
    FormulaConstantItem(
        id="calc_integ_parts",
        name="Integration by Parts",
        formula="∫ u dv = u·v - ∫ v du",
        description="Transforms integration of product into simpler integrals",
        category="Calculus",
        related_modes=["calculus"],
    ),
    FormulaConstantItem(
        id="calc_simpson",
        name="Simpson's 1/3 Rule (Numerical Quadrature)",
        formula="∫[a,b] f(x)dx ≈ (h/3) [f(x₀) + 4∑f(x_odd) + 2∑f(x_even) + f(x_n)]",
        description="High-accuracy numerical integration approximating curves via parabolic arcs",
        category="Calculus",
        related_modes=["calculus","scientific"],
    ),
    FormulaConstantItem(
        id="calc_newton",
        name="Newton–Raphson Root Finding",
        formula="x_(n+1) = x_n - f(x_n) / f'(x_n)",
        description="Iterative quadratic convergence algorithm for finding equation roots f(x) = 0",
        category="Calculus",
        related_modes=["calculus","equation","scientific"],
    ),
    FormulaConstantItem(
        id="calc_taylor",
        name="Taylor Series Expansion",
        formula="f(x) = ∑[k=0..∞] (f^(k)(a) / k!) · (x - a)^k",
        description="Representation of a smooth function as an infinite sum of polynomial derivatives",
        category="Calculus",
        related_modes=["calculus","scientific"],
    ),
    FormulaConstantItem(
        id="alg_quad",
        name="Quadratic Formula & Discriminant",
        formula="x = (-b ± √(b² - 4ac)) / (2a), Δ = b² - 4ac",
        description="Exact roots for ax² + bx + c = 0; Δ > 0 (2 real), Δ = 0 (1 real), Δ < 0 (complex)",
        category="Algebra",
        related_modes=["equation","basic","scientific"],
    ),
    FormulaConstantItem(
        id="alg_vieta",
        name="Vieta's Formulas (Quadratic & Cubic)",
        formula="x₁ + x₂ = -b/a,  x₁ · x₂ = c/a",
        description="Relates polynomial coefficients directly to sums and products of roots",
        category="Algebra",
        related_modes=["equation","fractions"],
    ),
    FormulaConstantItem(
        id="alg_binomial",
        name="Binomial Theorem",
        formula="(a + b)^n = ∑[k=0..n] (n C k) · a^(n-k) · b^k",
        description="Algebraic expansion of powers of a binomial using combination coefficients",
        category="Algebra",
        related_modes=["fractions","statistics","scientific"],
    ),
    FormulaConstantItem(
        id="alg_log_rules",
        name="Logarithm Product & Quotient Laws",
        formula="log(xy) = log(x) + log(y),  log(x/y) = log(x) - log(y),  log(x^k) = k·log(x)",
        description="Fundamental algebraic simplification identities for logarithms across any base",
        category="Algebra",
        related_modes=["scientific","calculus"],
    ),
    FormulaConstantItem(
        id="alg_ap_gp",
        name="Arithmetic & Geometric Series Sums",
        formula="S_AP = (n/2)[2a + (n-1)d],  S_GP = a(1 - r^n) / (1 - r)",
        description="Formulas for finite sum of arithmetic progression and geometric progression",
        category="Algebra",
        related_modes=["scientific","finance","fractions"],
    ),
    FormulaConstantItem(
        id="geo_pythagoras",
        name="Pythagorean Theorem & Distance",
        formula="a² + b² = c²,  d = √((x₂ - x₁)² + (y₂ - y₁)²)",
        description="Fundamental relation among sides in right triangle and Cartesian 2D distance",
        category="Geometry & Trig",
        related_modes=["geometry","scientific","basic"],
    ),
    FormulaConstantItem(
        id="geo_trig_identity",
        name="Pythagorean Trigonometric Identities",
        formula="sin²(θ) + cos²(θ) = 1,  1 + tan²(θ) = sec²(θ),  1 + cot²(θ) = csc²(θ)",
        description="Core identities connecting sine, cosine, tangent, and secant functions",
        category="Geometry & Trig",
        related_modes=["geometry","scientific","calculus"],
    ),
    FormulaConstantItem(
        id="geo_double_angle",
        name="Double Angle Formulas",
        formula="sin(2θ) = 2sin(θ)cos(θ),  cos(2θ) = cos²(θ) - sin²(θ) = 2cos²(θ) - 1",
        description="Simplifies trigonometric terms with doubled frequency angles",
        category="Geometry & Trig",
        related_modes=["geometry","scientific","calculus"],
    ),
    FormulaConstantItem(
        id="geo_law_sines_cosines",
        name="Law of Sines & Law of Cosines",
        formula="a/sin(A) = b/sin(B) = c/sin(C),  c² = a² + b² - 2ab·cos(C)",
        description="Solves arbitrary oblique non-right triangles given side/angle combinations (SAS, SSS, ASA)",
        category="Geometry & Trig",
        related_modes=["geometry","scientific"],
    ),
    FormulaConstantItem(
        id="geo_heron",
        name="Heron's Formula for Triangle Area",
        formula="Area = √(s(s - a)(s - b)(s - c)),  s = (a + b + c) / 2",
        description="Computes exact triangle area given only the three side lengths without heights",
        category="Geometry & Trig",
        related_modes=["geometry","scientific"],
    ),
    FormulaConstantItem(
        id="geo_sphere_cylinder",
        name="Sphere & Cylinder Volumes",
        formula="V_sphere = (4/3)πr³,  V_cylinder = πr²h,  V_cone = (1/3)πr²h",
        description="Standard 3D solid geometry volume and surface area equations",
        category="Geometry & Trig",
        related_modes=["geometry","scientific","converter"],
    ),
    FormulaConstantItem(
        id="mat_det_2x2_3x3",
        name="Matrix Determinant (2×2 & 3×3)",
        formula="det([a b; c d]) = ad - bc,  det(A) = a(ei-fh) - b(di-fg) + c(dh-eg)",
        description="Scalar value characterizing linear transformation scale and invertibility (det ≠ 0)",
        category="Matrix & Vectors",
        related_modes=["matrix","equation","scientific"],
    ),
    FormulaConstantItem(
        id="mat_inverse",
        name="Matrix Inversion & Adjugate",
        formula="A⁻¹ = (1 / det(A)) · adj(A),  A · A⁻¹ = I",
        description="Multiplicative inverse matrix exists if and only if determinant is non-zero",
        category="Matrix & Vectors",
        related_modes=["matrix","equation"],
    ),
    FormulaConstantItem(
        id="mat_dot_cross",
        name="Vector Dot Product & Cross Product",
        formula="A · B = |A||B|cos(θ) = ∑(a_i·b_i),  |A × B| = |A||B|sin(θ)",
        description="Dot product yields scalar projection; cross product yields orthogonal normal vector in 3D",
        category="Matrix & Vectors",
        related_modes=["matrix","geometry","scientific"],
    ),
    FormulaConstantItem(
        id="mat_eigen",
        name="Eigenvalues Characteristic Equation",
        formula="det(A - λI) = 0,  A · v = λ · v",
        description="Scalar roots λ for which non-zero eigenvector v undergoes pure scaling",
        category="Matrix & Vectors",
        related_modes=["matrix","equation"],
    ),
    FormulaConstantItem(
        id="stat_variance_sd",
        name="Sample & Population Standard Deviation",
        formula="s = √[ ∑(x_i - x̄)² / (n - 1) ],  σ = √[ ∑(x_i - μ)² / N ]",
        description="Measure of the amount of variation or dispersion of a set of values from mean",
        category="Statistics",
        related_modes=["statistics","scientific"],
    ),
    FormulaConstantItem(
        id="stat_zscore",
        name="Z-Score Normalization",
        formula="Z = (X - μ) / σ",
        description="Number of standard deviations an observation X is from the distribution mean μ",
        category="Statistics",
        related_modes=["statistics","health"],
    ),
    FormulaConstantItem(
        id="stat_bayes",
        name="Bayes' Theorem",
        formula="P(A|B) = [ P(B|A) · P(A) ] / P(B)",
        description="Determines conditional probability of event A given prior knowledge and new evidence B",
        category="Statistics",
        related_modes=["statistics","fractions"],
    ),
    FormulaConstantItem(
        id="stat_comb_perm",
        name="Combinations & Permutations",
        formula="nCr = n! / (r!(n - r)!),  nPr = n! / (n - r)!",
        description="Selection count where order does not matter (combinations) or matters (permutations)",
        category="Statistics",
        related_modes=["statistics","fractions","scientific"],
    ),
    FormulaConstantItem(
        id="stat_pearson",
        name="Pearson's Correlation Coefficient",
        formula="r = ∑((x - x̄)(y - ȳ)) / [ √(∑(x - x̄)²) · √(∑(y - ȳ)²) ]",
        description="Linear correlation metric bounded between -1 (negative) and +1 (perfect positive)",
        category="Statistics",
        related_modes=["statistics"],
    ),
    FormulaConstantItem(
        id="cs_twos_comp",
        name="Two's Complement Signed Negation",
        formula="-X = ~X + 1 = (NOT X) + 1",
        description="Standard binary representation for signed integers in computer hardware arithmetic",
        category="Computer Science",
        related_modes=["programmer"],
    ),
    FormulaConstantItem(
        id="cs_bit_shifts",
        name="Bitwise Shift Scaling",
        formula="X << k = X · 2^k,  X >> k = ⌊X / 2^k⌋",
        description="Left shift multiplies by powers of two; right shift performs unsigned integer division",
        category="Computer Science",
        related_modes=["programmer"],
    ),
    FormulaConstantItem(
        id="cs_shannon",
        name="Shannon Information Entropy",
        formula="H(X) = -∑[i=1..n] P(x_i) · log₂(P(x_i))",
        description="Average level of information, surprise, or uncertainty in random variable outcome",
        category="Computer Science",
        related_modes=["programmer","statistics","scientific"],
    ),
    FormulaConstantItem(
        id="cs_powers2",
        name="Common Powers of 2 Table",
        formula="2¹⁰ = 1,024 (1 KiB), 2²⁰ = 1,048,576 (1 MiB), 2³² = 4,294,967,296, 2⁶⁴ ≈ 1.844×10¹⁹",
        description="Key binary memory boundaries, word limits, and address space capacities",
        category="Computer Science",
        related_modes=["programmer","converter"],
    ),
    FormulaConstantItem(
        id="fin_emi_loan",
        name="Loan EMI / Amortization Formula",
        formula="EMI = [ P · r · (1 + r)^n ] / [ (1 + r)^n - 1 ]",
        description="Fixed monthly installment on principal P at monthly interest rate r over n periods",
        category="Finance",
        related_modes=["finance","scientific"],
    ),
    FormulaConstantItem(
        id="fin_compound_int",
        name="Compound Interest & Continuous Compounding",
        formula="A = P(1 + r/n)^(nt),  A_continuous = P · e^(rt)",
        description="Total accrued balance with periodic frequency compounding or continuous exponential growth",
        category="Finance",
        related_modes=["finance","scientific"],
    ),
    FormulaConstantItem(
        id="fin_rule_72",
        name="Rule of 72 (Doubling Time)",
        formula="Years to Double ≈ 72 / (Annual Interest Rate %)",
        description="Quick accurate mental estimation for investment capital doubling period",
        category="Finance",
        related_modes=["finance","basic"],
    ),
    FormulaConstantItem(
        id="fin_cagr",
        name="Compound Annual Growth Rate (CAGR)",
        formula="CAGR = (Ending Value / Beginning Value)^(1 / Years) - 1",
        description="Smoothed annualized rate of return across multiple investment holding periods",
        category="Finance",
        related_modes=["finance","statistics"],
    ),
    FormulaConstantItem(
        id="hlth_bmi",
        name="Body Mass Index (BMI)",
        formula="BMI = weight(kg) / (height(m))² = [weight(lbs) / (height(in))²] × 703",
        description="Standard screening metric categorizing underweight (<18.5), normal (18.5-24.9), overweight (25-29.9), obese (≥30)",
        category="Health & Bio",
        related_modes=["health","converter"],
    ),
    FormulaConstantItem(
        id="hlth_mifflin",
        name="Mifflin-St Jeor BMR Equation",
        formula="BMR_men = 10w + 6.25h - 5a + 5,  BMR_women = 10w + 6.25h - 5a - 161",
        description="Gold-standard formula predicting basal metabolic rate (weight in kg, height in cm, age in years)",
        category="Health & Bio",
        related_modes=["health","basic"],
    ),
    FormulaConstantItem(
        id="hlth_karvonen",
        name="Karvonen Target Heart Rate Zone",
        formula="Target HR = [ (HR_max - HR_rest) × Intensity% ] + HR_rest,  HR_max = 220 - Age",
        description="Calculates cardio training heart rate training zones factoring individual resting heart rate",
        category="Health & Bio",
        related_modes=["health"],
    ),
    FormulaConstantItem(
        id="unit_length",
        name="Length Conversion Ratios",
        formula="1 inch = 2.54 cm (Exact),  1 foot = 0.3048 m,  1 mile = 1.609344 km",
        description="Precise international imperial to metric conversion multipliers",
        category="Unit Factors",
        numeric_value="0.0254",
        unit="m/inch",
        related_modes=["converter","basic"],
    ),
    FormulaConstantItem(
        id="unit_mass",
        name="Mass Conversion Ratios",
        formula="1 lb (avoirdupois) = 0.45359237 kg (Exact),  1 oz = 28.349523125 g",
        description="Standard international mass definition relating pounds to kilograms",
        category="Unit Factors",
        numeric_value="0.45359237",
        unit="kg/lb",
        related_modes=["converter"],
    ),
    FormulaConstantItem(
        id="unit_temp",
        name="Temperature Scale Conversions",
        formula="°F = (°C × 9/5) + 32,  °C = (°F - 32) × 5/9,  K = °C + 273.15",
        description="Equations converting between Celsius, Fahrenheit, and absolute Kelvin",
        category="Unit Factors",
        related_modes=["converter","scientific"],
    ),
    FormulaConstantItem(
        id="unit_energy",
        name="Energy & Work Conversion Multipliers",
        formula="1 eV = 1.602176634×10⁻¹⁹ J,  1 cal = 4.184 J,  1 kWh = 3,600,000 J",
        description="Conversion rates across electron-volts, thermochemical calories, and kilowatt-hours",
        category="Unit Factors",
        numeric_value="4.184",
        unit="J/cal",
        related_modes=["converter","scientific"],
    ),
]


class FormulasEngine:
    """Core domain search and query engine for the Formulas Knowledge Base."""

    @staticmethod
    def get_categories() -> List[str]:
        return list(CATEGORIES)

    @staticmethod
    def get_all_items() -> List[FormulaConstantItem]:
        return list(FORMULAS_AND_CONSTANTS_DATABASE)

    @staticmethod
    def get_item_by_id(item_id: str) -> Optional[FormulaConstantItem]:
        for item in FORMULAS_AND_CONSTANTS_DATABASE:
            if item.id == item_id:
                return item
        return None

    @staticmethod
    def filter_items(
        category: str = "All",
        search: str = "",
        database: Optional[List[FormulaConstantItem]] = None,
    ) -> List[FormulaConstantItem]:
        """
        Filter items matching selected category and search query.
        Matches exact web filtering semantics from FormulasPanel.tsx:
        - Category matches if category == "All" or item.category == category
        - Search query (trimmed, lowercase) matches if substring of:
          * name
          * symbol
          * formula
          * description
          * numeric_value
          * related_modes
        """
        if database is None:
            database = FORMULAS_AND_CONSTANTS_DATABASE

        q = search.strip().lower()
        results: List[FormulaConstantItem] = []

        for item in database:
            match_cat = category == "All" or item.category == category
            if not match_cat:
                continue

            if not q:
                results.append(item)
                continue

            if (
                q in item.name.lower()
                or (item.symbol is not None and q in item.symbol.lower())
                or q in item.formula.lower()
                or q in item.description.lower()
                or (item.numeric_value is not None and q in item.numeric_value.lower())
                or any(q in mode.lower() for mode in item.related_modes)
            ):
                results.append(item)

        return results
