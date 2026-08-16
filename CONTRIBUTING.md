# Contributing to OmniCalc Pro 🧮

Thank you for your interest in contributing to OmniCalc Pro! We welcome contributions to both our web calculation engine and native desktop suite.

## Development Setup

### Web App (React + TypeScript)
1. Install Node.js 20+
2. Run `npm install`
3. Run `npm test` to run Vitest unit tests
4. Run `npm run lint` to check for style/linter issues
5. Run `npm run build` to verify production compilation

### Desktop App (Python + PySide6)
1. Install Python 3.10+
2. Create and activate a virtual environment: `python -m venv venv && source venv/bin/activate`
3. Install dependencies: `pip install -e ".[dev]"`
4. Run tests: `pytest tests/ -v`
5. Run linter and type-checker: `ruff check . && mypy core/ utils/`

## Pull Request Guidelines

1. Ensure all CI jobs pass locally before opening a pull request:
   - `npm run lint && npm run test && npm run build`
   - `pytest tests/ -v`
   - `ruff check .`
2. Follow semantic commit messages (`feat:`, `fix:`, `docs:`, `perf:`, `test:`).
3. If adding a new calculation engine or formula, provide accompanying unit test coverage.
