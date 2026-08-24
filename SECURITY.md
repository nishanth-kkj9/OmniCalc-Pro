# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

We take the security of OmniCalc Pro seriously. If you discover a security vulnerability, please report it responsibly:

1. **Do not create a public issue.**
2. Email your findings directly to the maintainers or report via GitHub Security Advisories.
3. Include detailed steps to reproduce the issue, proof of concept, and affected components (e.g., Python Engine, Web Calculator).

We will acknowledge receipt within 48 hours and work with you to patch and disclose the issue responsibly.

---

## Security Architecture & Threat Model

OmniCalc Pro executes arbitrary mathematical calculations across two platforms:

### 1. Python Engine (`core/safe_evaluator.py`)
- **No `eval()` or `exec()`**: AST-based parsing with SymPy's restricted parser transformations.
- **Strict Keyword Allowlists**: Only verified mathematical functions and constants are accessible.
- **Execution Hardening & Timeouts**: Expressions run with worker isolation and hard execution timeouts to prevent denial-of-service.
- **Complexity Limits**: Maximum input length (500 chars), nesting depth (10 levels), maximum operator limits, exponent size limits (≤ 10,000), and factorial limits (≤ 170 float64 representation limit).

### 2. Web Application (`src/utils/calculator.ts`)
- **True AST Allowlist Validation (`validateMathAst`)**: Parses expressions into MathJS AST representation, traversing nodes to strictly allow only approved AST types (`OperatorNode`, `ConstantNode`, `SymbolNode`, `FunctionNode`, `ParenthesisNode`, `BlockNode`).
- **Forbidden Constructs**: Explicitly rejects object creation (`ObjectNode`), property access (`AccessorNode`), variable assignments (`AssignmentNode`), function definitions (`FunctionAssignmentNode`), and arbitrary global lookups.
- **Strict Function & Symbol Whitelist**: Only approved mathematical functions (e.g., `sin`, `cos`, `log`, `sqrt`, `mod`) and recognized mathematical constants/variables (`pi`, `e`, `x`) are allowed.
- **Resource Exhaustion Guardrails**:
  - `MAX_EXPRESSION_LENGTH`: 500 characters
  - `MAX_NESTING_DEPTH`: 25 levels
  - `MAX_EXPONENT`: 10,000
  - Matrix Dimension Limit: 5x5 with O(N^3) LU decomposition
