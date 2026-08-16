# Changelog

All notable changes to **OmniCalc Pro** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-08-16

### Added
- **17 Dedicated Mathematical Engines**: Integrated Basic, Scientific, Fractions, Geometry, Equations, Calculus, Graphing, Matrix, Statistics, Programmer, Unit Converter, Finance EMI, Date & Time, Health/BMI, Formulas, History, and Preferences.
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
