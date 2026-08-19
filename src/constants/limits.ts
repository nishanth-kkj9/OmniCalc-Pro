/**
 * Centralized evaluator and numerical resource limits for OmniCalc Pro.
 * Each constant documents the rationale for the limit to balance legitimate
 * advanced calculations against CPU/Memory Denial-of-Service and main-thread freezes.
 */

/** Maximum length in characters for mathematical expressions. Prevents ReDoS and excessive AST allocations. */
export const MAX_EXPRESSION_LENGTH = 500;

/** Maximum parenthesis/sub-expression nesting depth. Prevents call-stack exhaustion in AST traversal. */
export const MAX_NESTING_DEPTH = 25;

/** Maximum numerical exponent allowed in power operations. Prevents floating point / BigInt computing lockups. */
export const MAX_EXPONENT = 10000;

/** Maximum square matrix dimension (NxN) supported for linear algebra operations. */
export const MAX_MATRIX_DIMENSION = 5;

/** Maximum iterations for numerical root-finding algorithms (e.g. Newton-Raphson). */
export const MAX_ITERATIONS = 100;

/** Maximum sample points generated when plotting functions in Graphing mode. */
export const MAX_GRAPH_SAMPLES = 500;

/** Minimum convergence threshold for numerical calculus/root finding solvers. */
export const NUMERICAL_EPSILON = 1e-12;
