# OmniCalc Pro

**An all-in-one advanced professional calculator for Windows, built with Python & PySide6.**

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![PySide6](https://img.shields.io/badge/PySide6-6.6%2B-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![CI](https://github.com/nishanth-kkj9/-OmniCalc-Pro/actions/workflows/ci.yml/badge.svg)

---

## Features

| Module | Description |
|---|---|
| **Basic** | Arithmetic, percentages, memory functions |
| **Scientific** | Trigonometry, logarithms, exponentials, constants (π, e) |
| **Graph** | Plot equations, zoom, export as PNG |
| **Unit Converter** | Length, weight, temperature, speed, storage, time |
| **Programmer** | Binary/hex/octal/decimal conversion, bitwise operations, shifts |
| **Matrix** | Add, subtract, multiply, determinant, inverse, transpose |
| **Statistics** | Mean, median, mode, std dev, variance, min/max |
| **Finance** | EMI, compound interest, GST, discount |
| **History** | Auto-saved to SQLite, searchable |

### UI Highlights
- Windows 11 Fluent Design (Mica backdrop, acrylic blur)
- Dark/Light theme toggle
- Collapsible sidebar with animated transitions
- Keyboard shortcuts (Ctrl+1-0 for pages, theme toggle, fullscreen)
- Toast notifications

---

## Setup

### Prerequisites
- Python 3.10 or higher
- Windows 10/11 (recommended for Mica/acrylic effects)

### Installation

```bash
# Clone the repository
git clone https://github.com/nishanth-kkj9/-OmniCalc-Pro.git
cd OmniCalc-Pro

# Install runtime dependencies
pip install -r requirements.txt

# Run the application
python main.py
```

### Development installation

```bash
pip install -e ".[dev]"          # includes pytest, ruff, mypy
```

---

## Running Tests

```bash
pytest tests/ -v
```

---

## Building an Executable

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --icon=assets/icons/app_icon.svg main.py
```

The executable will be in the `dist/` folder.

---

## Project Structure

```
omnicalc_pro/
├── core/               # Calculation engines
│   ├── safe_evaluator.py   # AST-based math evaluator (no eval)
│   ├── parser.py           # Sympy expression parser
│   ├── calculator_engine.py
│   ├── scientific_engine.py
│   ├── finance_engine.py
│   ├── matrix_engine.py
│   ├── programmer_engine.py
│   ├── converter_engine.py
│   ├── statistics_engine.py
│   ├── graph_engine.py
│   ├── history_manager.py  # SQLite history with WAL mode
│   ├── error_handler.py    # Global exception handling
│   └── services.py         # DI Service Locator
├── ui/                 # UI components
│   ├── main_window.py
│   ├── sidebar.py
│   ├── widgets.py          # CalcButton, DisplayPanel
│   ├── fluent_theme.py     # Semantic color tokens
│   ├── win11_effects.py    # Mica/Acrylic DWM integration
│   ├── toast.py            # Animated notifications
│   └── ...
├── utils/              # Utilities
│   ├── constants.py
│   ├── helpers.py
│   ├── logger.py
│   ├── validators.py
│   └── themes.py
├── tests/              # Test suite
│   ├── test_safe_evaluator.py
│   ├── test_parser.py
│   ├── test_calculator_engine.py
│   ├── test_scientific_engine.py
│   ├── test_finance_engine.py
│   ├── test_matrix_engine.py
│   ├── test_programmer_engine.py
│   ├── test_converter_engine.py
│   ├── test_statistics_engine.py
│   ├── test_helpers.py
│   └── test_validators.py
├── assets/icons/       # SVG icons
├── main.py             # Application entry point
├── requirements.txt
├── pyproject.toml
└── .github/workflows/ci.yml
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+1`-`Ctrl+0` | Switch pages |
| `Ctrl+T` | Toggle theme |
| `Ctrl+C` | Copy result |
| `Ctrl+V` | Paste |
| `Ctrl+F` | Fullscreen |
| `Ctrl+Q` | Quit |

---

## Security

- **No `eval()`**: All mathematical expressions are parsed via AST (Abstract Syntax Tree) using `sympy` with a restricted whitelist of allowed functions and constants
- **Input validation**: Expression length limited to 500 characters, sanitized against unknown identifiers
- **Structured logging**: All errors are logged with context via the error handler

---

## License

MIT
