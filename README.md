# OmniCalc Pro 🧮

**An advanced, multi-paradigm calculation suite featuring 17 specialized mathematical engines, interactive visualizations, and modern desktop & web interfaces.**

[![CI & Build](https://github.com/nishanth-kkj9/-OmniCalc-Pro/actions/workflows/ci.yml/badge.svg)](https://github.com/nishanth-kkj9/-OmniCalc-Pro/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38b2ac?logo=tailwind-css)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python)](https://www.python.org/)
[![PySide6](https://img.shields.io/badge/PySide6-6.6%2B-41CD52?logo=qt)](https://pypi.org/project/PySide6/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Overview

**OmniCalc Pro** bridges the gap between everyday arithmetic, scientific exploration, computational algebra, and practical everyday tools. It is available as:
1. **Interactive Web Application**: Built with React 18, TypeScript, Tailwind CSS, Lucide icons, and MathJS with responsive layouts, tactile audio synthesis, and dark/light/OLED themes.
2. **Native Desktop Suite**: Built with Python 3.10+ and PySide6 featuring Windows 11 Mica/Acrylic effects, SQLite history caching, and AST-safe symbolic mathematics.

---

## ⚡ Mathematical & Calculation Engines

| Category | Engine | Capabilities |
|---|---|---|
| **Core & Math** | **Basic Calculator** | Arithmetic (`+`, `-`, `×`, `÷`), parentheses, percentage conversion, and memory bank (`M+`, `M-`, `MR`, `MC`). |
| | **Scientific Calculator** | Trigonometry (`sin`, `cos`, `tan`, `asin`, `acos`, `atan`), hyperbolic, logarithms (`ln`, `log10`, `log2`), powers (`xʸ`, `√x`, `³√x`), factorials, and physical constants (`π`, `e`, `φ`). Angle modes: **DEG**, **RAD**, **GRAD**. |
| | **Fractions & Number Theory** | Exact rational arithmetic (`a/b ± c/d`), auto-simplification, GCD / LCM decomposition tree, prime factorization, and decimal-to-fraction conversions. |
| | **Geometry & Triangle Solver** | Complete triangle solver (SSS, SAS, ASA, AAS, SSA) with dynamic vector preview, area, perimeter, inradius, circumradius, and 2D/3D shape mensuration. |
| **Advanced & Science** | **Equation & System Solver** | Linear equation solver, Quadratic ($ax^2 + bx + c = 0$) with discriminant breakdown, Cubic solver, and $2\times2$ / $3\times3$ Linear System Solver via Cramer's Rule. |
| | **Calculus & Numerical Suite** | Numerical integration using Simpson's Composite Rule ($\int_a^b f(x)dx$), tangent line derivative calculator ($f'(x_0)$), and Newton-Raphson root finder. |
| | **Graphing Calculator** | Multi-function plotting (up to 5 simultaneous functions), adaptive coordinate bounds, dynamic zoom/pan, hover coordinate tracker, table of values, and PNG image export. |
| | **Matrix Calculator** | Matrix addition, subtraction, multiplication, determinant ($2\times2$, $3\times3$), matrix inverse, transpose, trace, and eigenvalue estimates. |
| | **Statistics Calculator** | Descriptive stats: Mean, Median, Mode, Sample/Population Variance, Standard Deviation, IQR, Range, Sum, Min/Max, and single-value Z-Score computation. |
| | **Programmer Calculator** | Live radix conversions (**HEX**, **DEC**, **OCT**, **BIN**), bit width toggles (64-bit, 32-bit, 16-bit, 8-bit), Bitwise logic (`AND`, `OR`, `XOR`, `NOT`, `NAND`, `NOR`), bit-shifts (`LSH`, `RSH`), and 2's complement. |
| **Practical & Life** | **Unit Converter** | 8 categories: Length, Mass & Weight, Temperature, Digital Data Storage, Speed, Time, Pressure, and Area with instant bidirectional updates. |
| | **Finance & Loan EMI** | Mortgage & Car Loan amortization scheduler, Compound Interest (FD/SIP wealth builder), GST / Sales Tax calculator, and percentage Discount/Markup. |
| | **Date & Time Calculator** | Date span/duration, Business working days (excluding custom weekends/holidays), Target event countdown, and hourly work shift wage logger. |
| | **Health & Fitness Suite** | Body Mass Index (BMI) with category visualizer, Basal Metabolic Rate (BMR: Harris-Benedict & Mifflin-St Jeor), Total Daily Energy Expenditure (TDEE), and Karvonen Target Heart Rate training zones. |
| **Tools & Reference** | **Formulas & Constants** | Curated catalog of fundamental physical constants ($c, G, h, k_B, e, m_e, N_A$) and interactive cheat sheet for algebra, trigonometry, calculus, and geometry identities. |
| | **Calculation History** | Searchable audit trail with engine tags, timestamps, copy expression/result buttons, and one-click JSON / CSV data export. |
| | **Preferences & Settings** | Custom themes (Dark Slate, Light, OLED True Black), 6 accent color presets, synthesized mechanical audio feedback, precision controls (2–12 decimals), and default angle units. |

---

## 🎨 UI/UX Features

- **Command Palette (`Ctrl+K` / `⌘K`)**: Instant search and navigation across all 17 engines, formula cheat sheets, quick theme switches, and audio controls.
- **Dynamic Theming**:
  - **Light Theme**: High-contrast, clean slate aesthetic optimized for daylight visibility.
  - **Dark Slate Theme**: Deep eye-safe twilight navy palette.
  - **OLED True Black Theme**: Pure black (`#000000`) for OLED power efficiency.
  - **Accent Colors**: Electric Sky, Emerald Teal, Royal Violet, Solar Amber, Rose Magenta, and Cyber Slate.
- **Audio Synthesizer & Haptics**: Built-in Web Audio API synthesizer for tactile mechanical keypress feedback with zero external asset latency.
- **Responsive Layout**: Fluid desktop sidebar with collapsible mobile drawers, responsive quick-switch pills, and touch-optimized keypad targets.
- **One-Click Copy & Export**: Dedicated copy buttons on digital displays and comprehensive CSV/JSON history logs.

---

## 🚀 Quick Start

### 🌐 1. Web Application (React + Vite + TypeScript)

#### Prerequisites
- Node.js 18.x or 20.x+
- npm or bun

#### Setup & Development
```bash
# Clone the repository
git clone https://github.com/nishanth-kkj9/-OmniCalc-Pro.git
cd OmniCalc-Pro

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Visit `http://localhost:3000` (or the port displayed in your terminal) to view the app.

#### Production Build
```bash
# Type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

### 🖥️ 2. Desktop Application (Python + PySide6)

#### Prerequisites
- Python 3.10 or higher
- Windows 10/11 (recommended for Windows Fluent / Mica effects), macOS, or Linux

#### Installation
```bash
# Set up a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install runtime dependencies
pip install -r requirements.txt

# Launch the desktop app
python main.py
```

#### Development & Testing
```bash
# Install development dependencies (pytest, ruff, mypy)
pip install -e ".[dev]"

# Run test suite
pytest tests/ -v

# Run linter
ruff check .

# Type-check core modules
mypy core/ utils/ --ignore-missing-imports
```

#### Packaging Desktop Executable
```bash
pip install pyinstaller
pyinstaller --onefile --windowed --icon=assets/icons/app_icon.svg main.py
```
The compiled standalone executable will be located in the `dist/` directory.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action | Scope |
|---|---|---|
| `Ctrl+K` / `Cmd+K` | Open Command Palette & Quick Jump | Global (Web & Desktop) |
| `0` – `9`, `.` | Enter Digits and Decimal point | Calculators |
| `+`, `-`, `*`, `/` | Arithmetic Operators (`+`, `−`, `×`, `÷`) | Calculators |
| `Enter` / `=` | Calculate & Evaluate Expression | Calculators |
| `Backspace` | Delete last character | Calculators |
| `Escape` / `C` | Clear active expression / Close palette | Calculators / Modals |
| `(` / `)` | Open / Close Parentheses | Calculators |
| `^` | Exponentiation ($x^y$) | Scientific & Calculus |
| `Ctrl+1` – `Ctrl+0` | Direct Engine Page Switching | Desktop |
| `Ctrl+T` | Toggle Color Theme | Desktop & Web |
| `Ctrl+C` | Copy Active Result to Clipboard | Global |

---

## 📂 Project Architecture

```
OmniCalc-Pro/
├── .github/
│   └── workflows/
│       └── ci.yml              # Multi-platform CI (Web typecheck/build + Python matrix test/lint)
├── src/                        # Web Application (React 18 + TypeScript + Tailwind)
│   ├── components/             # 17 Calculation modules & UI components
│   │   ├── BasicCalculator.tsx
│   │   ├── ScientificCalculator.tsx
│   │   ├── FractionsCalculator.tsx
│   │   ├── GeometryCalculator.tsx
│   │   ├── EquationSolver.tsx
│   │   ├── CalculusCalculator.tsx
│   │   ├── GraphingCalculator.tsx
│   │   ├── MatrixCalculator.tsx
│   │   ├── StatisticsCalculator.tsx
│   │   ├── ProgrammerCalculator.tsx
│   │   ├── ConverterCalculator.tsx
│   │   ├── FinanceCalculator.tsx
│   │   ├── DateTimeCalculator.tsx
│   │   ├── HealthCalculator.tsx
│   │   ├── FormulasPanel.tsx
│   │   ├── HistoryPanel.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── utils/                  # Core calculation & formatting helpers
│   │   ├── calculator.ts       # Expression parser & MathJS evaluator
│   │   ├── formatting.ts       # Number formatting, SI suffixes, theme tokens
│   │   ├── history.ts          # Local storage history persistence
│   │   └── sound.ts            # Web Audio API procedural sound synthesizer
│   ├── types.ts                # Application data types & interfaces
│   ├── App.tsx                 # Root application component
│   └── main.tsx                # Client entry point
├── core/                       # Desktop Engine Modules (Python)
│   ├── safe_evaluator.py       # AST-based mathematical evaluator (no eval)
│   ├── parser.py               # Sympy symbolic parser
│   ├── calculator_engine.py    # Basic arithmetic engine
│   ├── scientific_engine.py    # Advanced scientific engine
│   ├── finance_engine.py       # Loan, interest, and tax engine
│   ├── matrix_engine.py        # Matrix linear algebra engine
│   ├── programmer_engine.py    # Bitwise & radix engine
│   ├── converter_engine.py     # Unit conversion tables
│   ├── statistics_engine.py    # Descriptive statistics engine
│   ├── graph_engine.py         # Matplotlib graphing engine
│   └── history_manager.py      # SQLite history database
├── ui/                         # Desktop UI Components (PySide6)
├── utils/                      # Desktop Python utility modules
├── tests/                      # Python Test Suite
├── package.json                # Web NPM dependencies & scripts
├── pyproject.toml              # Python project metadata & tool configurations
└── requirements.txt            # Python dependencies
```

---

## 🔒 Security & Precision Guardrails

- **AST-Based Evaluation**: Python calculation engines strictly employ Abstract Syntax Tree (AST) parsing with Sympy whitelists, eliminating arbitrary code execution risks.
- **Sandboxed Web Evaluation**: Web mathematical evaluation passes sanitized expression strings through MathJS within controlled trigonometric and logarithmic function scopes.
- **Edge Case Protection**: Guarded against divide-by-zero, non-converging Newton-Raphson iterations, negative square roots in real mode, and trigonometric singularities (e.g., $\tan(90^\circ)$).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
