import { GraphViewport, Point2D, CurveSegment } from '../types';
import { CompiledSafeExpression } from './calculator';
import { MAX_GRAPH_SAMPLES, MAX_ADAPTIVE_DEPTH } from '../constants/limits';

export interface SampleCurveOptions {
  viewport: GraphViewport;
  domainMin?: number;
  domainMax?: number;
  scope?: Record<string, number>;
  pixelWidth?: number;
  maxSamples?: number;
}

/**
 * Samples a compiled mathematical curve across the visible x-range using adaptive sampling
 * and rigorous asymptote/discontinuity detection.
 * Returns clean continuous segments that do not bridge across undefined intervals or asymptotes.
 */
export function sampleGraphCurve(
  compiled: CompiledSafeExpression,
  options: SampleCurveOptions
): CurveSegment[] {
  const {
    viewport,
    domainMin,
    domainMax,
    scope = {},
    pixelWidth = 800,
    maxSamples = MAX_GRAPH_SAMPLES,
  } = options;

  // Determine effective x domain
  const rawXMin = viewport.xMin;
  const rawXMax = viewport.xMax;

  if (rawXMin >= rawXMax || !Number.isFinite(rawXMin) || !Number.isFinite(rawXMax)) {
    return [];
  }

  const effectiveXMin = domainMin !== undefined ? Math.max(rawXMin, domainMin) : rawXMin;
  const effectiveXMax = domainMax !== undefined ? Math.min(rawXMax, domainMax) : rawXMax;

  if (effectiveXMin >= effectiveXMax) {
    return [];
  }

  const ySpan = Math.abs(viewport.yMax - viewport.yMin);
  // Asymptote jump threshold in mathematical units: values leaping more than 3x the viewport span
  const jumpThreshold = Math.max(10, ySpan * 3);

  // Baseline uniform grid step based on screen pixels (e.g. 1 point every 2-3 pixels)
  const baseSteps = Math.min(1000, Math.max(100, Math.round(pixelWidth / 2.5)));
  const dx = (effectiveXMax - effectiveXMin) / baseSteps;

  const segments: CurveSegment[] = [];
  let currentSegment: Point2D[] = [];
  let totalSampleCount = 0;

  // Helper evaluator
  const evalAt = (xVal: number): number | null => {
    try {
      const val = compiled.evaluate({ ...scope, x: xVal });
      if (val === null || !Number.isFinite(val) || isNaN(val)) {
        return null;
      }
      return val;
    } catch {
      return null;
    }
  };

  /**
   * Adaptive recursive subdivision between x0 and x1
   */
  const sampleInterval = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    depth: number
  ) => {
    if (totalSampleCount >= maxSamples || depth > MAX_ADAPTIVE_DEPTH) {
      currentSegment.push({ x: x1, y: y1 });
      totalSampleCount++;
      return;
    }

    const xMid = (x0 + x1) / 2;
    const yMid = evalAt(xMid);

    // If midpoint is undefined, we have a discontinuity
    if (yMid === null) {
      if (currentSegment.length > 0) {
        segments.push({ points: currentSegment });
        currentSegment = [];
      }
      return;
    }

    // Check for asymptotic jump across midpoint
    const jumpLeft = Math.abs(yMid - y0);
    const jumpRight = Math.abs(y1 - yMid);
    if (jumpLeft > jumpThreshold || jumpRight > jumpThreshold) {
      // Sign flip with large jump strongly implies an asymptote (e.g. 1/x, tan(x))
      if ((y0 > 0 && yMid < 0) || (y0 < 0 && yMid > 0) || (yMid > 0 && y1 < 0) || (yMid < 0 && y1 > 0)) {
        if (currentSegment.length > 0) {
          segments.push({ points: currentSegment });
          currentSegment = [];
        }
        return;
      }
    }

    // Check linearity: does yMid deviate significantly from linear interpolation between y0 and y1?
    const yLinear = (y0 + y1) / 2;
    const tolerance = Math.max(1e-4, ySpan / 500); // fraction of viewport height

    if (Math.abs(yMid - yLinear) > tolerance && (x1 - x0) > 1e-6) {
      // Subdivide both halves
      sampleInterval(x0, y0, xMid, yMid, depth + 1);
      sampleInterval(xMid, yMid, x1, y1, depth + 1);
    } else {
      currentSegment.push({ x: x1, y: y1 });
      totalSampleCount++;
    }
  };

  // Main sampling loop
  let prevX = effectiveXMin;
  let prevY = evalAt(prevX);
  if (prevY !== null) {
    currentSegment.push({ x: prevX, y: prevY });
    totalSampleCount++;
  }

  for (let i = 1; i <= baseSteps; i++) {
    if (totalSampleCount >= maxSamples) break;

    const curX = effectiveXMin + i * dx;
    const curY = evalAt(curX);

    if (prevY === null && curY !== null) {
      // Function becomes valid
      currentSegment = [{ x: curX, y: curY }];
      totalSampleCount++;
    } else if (prevY !== null && curY === null) {
      // Function becomes undefined
      if (currentSegment.length > 0) {
        segments.push({ points: currentSegment });
        currentSegment = [];
      }
    } else if (prevY !== null && curY !== null) {
      // Both points are valid, check for asymptote jump
      const dy = Math.abs(curY - prevY);
      const signChange = (prevY > 0 && curY < 0) || (prevY < 0 && curY > 0);

      if (dy > jumpThreshold && signChange) {
        // High steep jump across zero line - test midpoint
        const midVal = evalAt((prevX + curX) / 2);
        if (midVal === null || Math.abs(midVal) > jumpThreshold * 0.5) {
          // Asymptote detected! Cut segment.
          if (currentSegment.length > 0) {
            segments.push({ points: currentSegment });
            currentSegment = [];
          }
          currentSegment.push({ x: curX, y: curY });
          totalSampleCount++;
          prevX = curX;
          prevY = curY;
          continue;
        }
      }

      // Smooth curve or slight variation - adaptive refine
      sampleInterval(prevX, prevY, curX, curY, 0);
    }

    prevX = curX;
    prevY = curY;
  }

  if (currentSegment.length > 0) {
    segments.push({ points: currentSegment });
  }

  // Filter out any segments that have fewer than 2 points unless it's an isolated valid point
  return segments.filter((seg) => seg.points.length > 0);
}

/**
 * Computes an optimal auto-fit viewport that frames all visible curves nicely.
 */
export function computeAutoFitViewport(
  allSegments: CurveSegment[],
  fallback: GraphViewport
): GraphViewport {
  if (allSegments.length === 0) return fallback;

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  let validPointsCount = 0;

  for (const seg of allSegments) {
    for (const pt of seg.points) {
      // Exclude extreme numerical values
      if (Math.abs(pt.y) < 1e5 && Math.abs(pt.x) < 1e5) {
        validPointsCount++;
        if (pt.x < xMin) xMin = pt.x;
        if (pt.x > xMax) xMax = pt.x;
        if (pt.y < yMin) yMin = pt.y;
        if (pt.y > yMax) yMax = pt.y;
      }
    }
  }

  if (validPointsCount < 3 || !Number.isFinite(xMin) || !Number.isFinite(yMin)) {
    return fallback;
  }

  // Add 15% margin
  const xSpan = Math.max(2, xMax - xMin);
  const ySpan = Math.max(2, yMax - yMin);
  const xMargin = xSpan * 0.15;
  const yMargin = ySpan * 0.15;

  return {
    xMin: xMin - xMargin,
    xMax: xMax + xMargin,
    yMin: yMin - yMargin,
    yMax: yMax + yMargin,
  };
}
