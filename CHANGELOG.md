# Changelog

All notable changes to **OmniCalc Pro** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-09-04

### Added
- **High-Value Mathematical Engineering Suites**:
  - **Regression & Curve Fitting**: Linear, Polynomial (degree 2–5), Exponential, Logarithmic, and Power models with complete ANOVA metrics ($R^2$, adjusted $R^2$, RMSE, MAE, $F$-statistic, $p$-value), residual tables, and root-finding inverse prediction.
  - **Probability Distributions Engine**: Normal, Binomial, Poisson, Student's $t$, Chi-Square, and Exponential distributions with exact PDF/PMF, CDF, inverse CDF (Quantiles), and statistical moments (mean, variance, skewness, kurtosis).
  - **Sequences & Series Analysis**: Arithmetic, Geometric, Fibonacci, and Harmonic sequence generators with closed-form $n$-th term formulas, partial sums $S_n$, limit approximations, and ratio convergence testing.
  - **Complex Numbers & Phasor Analysis**: Rectangular, Polar, and Euler forms, $n$-th complex roots via De Moivre's theorem, phasor addition/subtraction, and AC RLC impedance modeling ($\omega L$, $1/\omega C$).
  - **Advanced Matrix & Linear Algebra Engine**: Determinants, matrix inverse via Gauss-Jordan elimination with partial pivoting, matrix transpose, trace, rank, nullity, Reduced Row Echelon Form (RREF), matrix powers $A^n$, scalar multiplication, and exact eigenvalue solving ($\lambda$) with complex conjugate pair detection.
  - **Analytical & Vector Geometry Engine**: 2D Cartesian line analysis (distance, midpoint, slope, perpendicular bisector, line equation) and 2D/3D vector operations (magnitude, unit vector, dot product, cross product, projection vector, and enclosed angles).
- **Hardened Graphing & Calculus Engine**:
  - Scale-aware adaptive curve sampling (`graphSampling.ts`) eliminating false discontinuity bridging across asymptotes and singularities.
  - Robust multi-curve intersection solver and repeated root detection via hybrid Brent's method and central-difference derivatives.
  - High-performance canvas rendering with DPR synchronization, grid alignment, and smooth pan/zoom.
- **Enterprise-Grade Security Hardening**:
  - Unified Safe Expression Evaluator with strict AST parsing and zero dynamic code execution (`eval` / `new Function` completely banned).
  - Centralized security constraints (`limits.ts` and `constants.py`) enforcing maximum expression length, parse depth, loop bounds, and graph sample caps.
  - CSV formula injection protection neutralizing DDE execution characters (`=`, `+`, `-`, `@`, `\t`, `\r`) and HTML escaping preventing DOM-XSS.
- **Python Desktop Parity Engines & Tests**:
  - Added `core/regression_engine.py`, `core/distributions_engine.py`, `core/sequences_engine.py`, `core/complex_engine.py`, and expanded `core/matrix_engine.py`.
  - Added matching Python unit tests in `tests/test_regression_engine.py`, `tests/test_distributions_engine.py`, `tests/test_sequences_engine.py`, `tests/test_complex_engine.py`.
- **Global Command Palette (`Ctrl+K` / `⌘K`)**: Fast keyboard-driven engine search and quick actions.
- **Code-Splitting & Lazy Loading**: Async dynamic engine imports reducing initial bundle size.
- **Web Unit Testing Suite**: Vitest + Testing Library test suites for parser arithmetic, trigonometry, history management, and number formatting.
- **Result Evaluation Type**: Introduced strict `EvalResult` discriminated union (`{ ok: true, value } | { ok: false, error }`).
- **Comprehensive CI/CD Pipeline**: GitHub Actions workflow covering Web CI, Web Lint, Web Vitest with coverage, Python matrix tests (3.10–3.13), and Ruff/MyPy static analysis.
- **Desktop Entry Point**: Dedicated `main.py` root runner for PySide6 application.

### Changed
- Refactored `history.ts` to replace deprecated `.substr` with `.slice`.
- Enhanced `formatting.ts` with `Number.parseFloat(val.toFixed(precision))` eliminating precision roundoff drift.
- Modernized `pyproject.toml` configuration to contemporary `[tool.ruff.lint]` schema.
- Added strict Content-Security-Policy (CSP) headers in `index.html`.

### Fixed
- Fixed trigonometric singularity accuracy for $\tan(90^\circ)$ and $\tan(100\text{ grad})$.
- Fixed repository clone URL in documentation.
