import { GraphViewport, Point2D, AngleMode } from '../types';
import { compileSafeExpression, CompiledSafeExpression } from './calculator';

export const DEFAULT_VIEWPORT: GraphViewport = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
};

export const GRAPH_PALETTE = [
  '#38bdf8', // Sky 400
  '#f43f5e', // Rose 500
  '#10b981', // Emerald 500
  '#a855f7', // Purple 500
  '#f59e0b', // Amber 500
  '#06b6d4', // Cyan 500
  '#ec4899', // Pink 500
  '#6366f1', // Indigo 500
  '#84cc16', // Lime 500
  '#14b8a6', // Teal 500
  '#eab308', // Yellow 500
  '#d946ef', // Fuchsia 500
];

export interface ScreenDimensions {
  width: number;
  height: number;
}

/**
 * Transforms mathematical Cartesian coordinates (x, y) to screen pixel coordinates (px, py).
 * In screen coordinates: (0, 0) is top-left, y increases downward.
 */
export function graphToScreen(
  gx: number,
  gy: number,
  viewport: GraphViewport,
  dimensions: ScreenDimensions
): Point2D {
  const { xMin, xMax, yMin, yMax } = viewport;
  const { width, height } = dimensions;

  const sx = ((gx - xMin) / (xMax - xMin)) * width;
  const sy = ((yMax - gy) / (yMax - yMin)) * height;

  return { x: sx, y: sy };
}

/**
 * Transforms screen pixel coordinates (px, py) to mathematical Cartesian coordinates (x, y).
 */
export function screenToGraph(
  sx: number,
  sy: number,
  viewport: GraphViewport,
  dimensions: ScreenDimensions
): Point2D {
  const { xMin, xMax, yMin, yMax } = viewport;
  const { width, height } = dimensions;

  const gx = xMin + (sx / width) * (xMax - xMin);
  const gy = yMax - (sy / height) * (yMax - yMin);

  return { x: gx, y: gy };
}

/**
 * Calculates a human-friendly step (1, 2, 5 * 10^k) for grid lines and tick marks.
 */
export function calculateNiceStep(range: number, targetTicks: number = 10): number {
  if (range <= 0 || !Number.isFinite(range)) return 1;
  const rawStep = range / Math.max(1, targetTicks);
  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / Math.pow(10, exponent);

  let niceFraction = 1;
  if (fraction < 1.5) {
    niceFraction = 1;
  } else if (fraction < 3.5) {
    niceFraction = 2;
  } else if (fraction < 7.5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

export interface TickInfo {
  value: number;
  screenPos: number;
  label: string;
  isMajor: boolean;
}

/**
 * Generates ticks and labels for an axis within the viewport range.
 */
export function generateAxisTicks(
  min: number,
  max: number,
  screenSize: number,
  isXAxis: boolean,
  viewport: GraphViewport,
  dimensions: ScreenDimensions
): TickInfo[] {
  const range = max - min;
  if (range <= 0 || !Number.isFinite(range)) return [];

  // Approximate 8-12 ticks across the dimension
  const targetCount = Math.max(4, Math.floor(screenSize / 80));
  const step = calculateNiceStep(range, targetCount);
  if (step <= 0) return [];

  const startTick = Math.ceil(min / step) * step;
  const ticks: TickInfo[] = [];

  // Calculate precision for clean labels without float drift (e.g. 0.30000000000000004)
  const stepStr = String(step);
  const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;

  for (let val = startTick; val <= max + step * 0.1; val += step) {
    // Avoid precision drift
    const cleanVal = Number(val.toFixed(Math.min(10, Math.max(0, decimals + 1))));
    if (cleanVal < min - step * 0.1 || cleanVal > max + step * 0.1) continue;

    let screenPos: number;
    if (isXAxis) {
      screenPos = graphToScreen(cleanVal, 0, viewport, dimensions).x;
    } else {
      screenPos = graphToScreen(0, cleanVal, viewport, dimensions).y;
    }

    const label = formatTickLabel(cleanVal);
    ticks.push({
      value: cleanVal,
      screenPos,
      label,
      isMajor: Math.abs(cleanVal) < 1e-10 || cleanVal % (step * 2) === 0,
    });

    if (ticks.length > 200) break; // Safety bound
  }

  return ticks;
}

/**
 * Formats a numerical tick label cleanly (handles scientific notation for very large/small numbers).
 */
export function formatTickLabel(value: number): string {
  if (Math.abs(value) < 1e-12) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e6 || (abs < 1e-3 && abs > 0)) {
    return value.toExponential(2).replace('e+', 'e');
  }
  // Trim trailing zeros after decimal
  const str = Number(value.toFixed(6)).toString();
  return str;
}

/**
 * Zooms the viewport in or out, focused precisely around a Cartesian center point.
 * Zoom factor > 1 zooms out, < 1 zooms in.
 */
export function zoomViewportAroundPoint(
  viewport: GraphViewport,
  centerGx: number,
  centerGy: number,
  factor: number
): GraphViewport {
  // Clamp zoom factor to prevent extreme zoom locks
  const clampedFactor = Math.max(0.1, Math.min(10, factor));

  const xSpan = (viewport.xMax - viewport.xMin) * clampedFactor;
  const ySpan = (viewport.yMax - viewport.yMin) * clampedFactor;

  // Protect against infinite zoom or overflow
  if (xSpan < 1e-8 || xSpan > 1e12 || ySpan < 1e-8 || ySpan > 1e12) {
    return viewport;
  }

  const xRatio = (centerGx - viewport.xMin) / (viewport.xMax - viewport.xMin);
  const yRatio = (centerGy - viewport.yMin) / (viewport.yMax - viewport.yMin);

  return {
    xMin: centerGx - xRatio * xSpan,
    xMax: centerGx + (1 - xRatio) * xSpan,
    yMin: centerGy - yRatio * ySpan,
    yMax: centerGy + (1 - yRatio) * ySpan,
  };
}

/**
 * Pans the viewport by delta screen pixels.
 */
export function panViewport(
  viewport: GraphViewport,
  deltaScreenX: number,
  deltaScreenY: number,
  dimensions: ScreenDimensions
): GraphViewport {
  const { width, height } = dimensions;
  if (width <= 0 || height <= 0) return viewport;

  const dxGraph = (deltaScreenX / width) * (viewport.xMax - viewport.xMin);
  const dyGraph = (deltaScreenY / height) * (viewport.yMax - viewport.yMin);

  return {
    xMin: viewport.xMin - dxGraph,
    xMax: viewport.xMax - dxGraph,
    yMin: viewport.yMin + dyGraph,
    yMax: viewport.yMax + dyGraph,
  };
}

// In-memory cache for compiled expressions
const compiledCache = new Map<string, CompiledSafeExpression | null>();

/**
 * Compiles a mathematical expression for repeated evaluations with x and optional sliders.
 * Returns null if the expression is invalid or rejected by AST allowlists.
 */
export function getOrCompileGraphExpression(
  expression: string,
  angleMode: AngleMode = 'DEG',
  sliderNames: string[] = []
): CompiledSafeExpression | null {
  const cleanExpr = expression.trim();
  if (!cleanExpr) return null;

  const cacheKey = `${cleanExpr}|${angleMode}|${sliderNames.sort().join(',')}`;
  if (compiledCache.has(cacheKey)) {
    return compiledCache.get(cacheKey) || null;
  }

  const allowedVars = ['x', ...sliderNames];
  const compileResult = compileSafeExpression(cleanExpr, angleMode, allowedVars);

  if (compileResult.ok) {
    compiledCache.set(cacheKey, compileResult.compiled);
    return compileResult.compiled;
  }

  compiledCache.set(cacheKey, null);
  return null;
}

/**
 * Clears the compilation cache (e.g. on settings/angle mode reset).
 */
export function clearGraphCompileCache(): void {
  compiledCache.clear();
}
