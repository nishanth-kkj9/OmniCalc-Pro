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

export interface SampleParametricOptions {
  tMin?: number;
  tMax?: number;
  steps?: number;
  scope?: Record<string, number>;
  viewport?: GraphViewport;
}

/**
 * Samples a parametric curve x = f(t), y = g(t) over [tMin, tMax].
 */
export function sampleParametricCurve(
  compiledX: CompiledSafeExpression,
  compiledY: CompiledSafeExpression,
  options: SampleParametricOptions = {}
): CurveSegment[] {
  const {
    tMin = 0,
    tMax = 2 * Math.PI,
    steps = 600,
    scope = {},
    viewport,
  } = options;

  if (tMin >= tMax || !Number.isFinite(tMin) || !Number.isFinite(tMax)) return [];

  const dt = (tMax - tMin) / steps;
  const segments: CurveSegment[] = [];
  let currentSegment: Point2D[] = [];

  const ySpan = viewport ? Math.abs(viewport.yMax - viewport.yMin) * 5 : 1e4;
  const xSpan = viewport ? Math.abs(viewport.xMax - viewport.xMin) * 5 : 1e4;

  for (let i = 0; i <= steps; i++) {
    const t = tMin + i * dt;
    try {
      const xVal = compiledX.evaluate({ ...scope, t });
      const yVal = compiledY.evaluate({ ...scope, t });

      if (
        xVal !== null &&
        yVal !== null &&
        Number.isFinite(xVal) &&
        Number.isFinite(yVal) &&
        Math.abs(xVal) < xSpan &&
        Math.abs(yVal) < ySpan
      ) {
        currentSegment.push({ x: xVal, y: yVal });
      } else {
        if (currentSegment.length > 0) {
          segments.push({ points: currentSegment });
          currentSegment = [];
        }
      }
    } catch {
      if (currentSegment.length > 0) {
        segments.push({ points: currentSegment });
        currentSegment = [];
      }
    }
  }

  if (currentSegment.length > 0) {
    segments.push({ points: currentSegment });
  }

  return segments;
}

export interface SamplePolarOptions {
  thetaMin?: number;
  thetaMax?: number;
  steps?: number;
  scope?: Record<string, number>;
  viewport?: GraphViewport;
}

/**
 * Samples a polar curve r = f(theta) over [thetaMin, thetaMax], mapping to x = r*cos(theta), y = r*sin(theta).
 */
export function samplePolarCurve(
  compiledR: CompiledSafeExpression,
  options: SamplePolarOptions = {}
): CurveSegment[] {
  const {
    thetaMin = 0,
    thetaMax = 2 * Math.PI,
    steps = 800,
    scope = {},
    viewport,
  } = options;

  if (thetaMin >= thetaMax || !Number.isFinite(thetaMin) || !Number.isFinite(thetaMax)) return [];

  const dTheta = (thetaMax - thetaMin) / steps;
  const segments: CurveSegment[] = [];
  let currentSegment: Point2D[] = [];

  const bound = viewport ? Math.max(Math.abs(viewport.xMax - viewport.xMin), Math.abs(viewport.yMax - viewport.yMin)) * 4 : 1e4;

  for (let i = 0; i <= steps; i++) {
    const theta = thetaMin + i * dTheta;
    try {
      const r = compiledR.evaluate({ ...scope, theta, 'θ': theta, t: theta, x: theta });
      if (r !== null && Number.isFinite(r) && Math.abs(r) < bound) {
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          currentSegment.push({ x, y });
        }
      } else {
        if (currentSegment.length > 0) {
          segments.push({ points: currentSegment });
          currentSegment = [];
        }
      }
    } catch {
      if (currentSegment.length > 0) {
        segments.push({ points: currentSegment });
        currentSegment = [];
      }
    }
  }

  if (currentSegment.length > 0) {
    segments.push({ points: currentSegment });
  }

  return segments;
}

/**
 * Generates inequality shaded polygon boundaries as multiple independent segments
 * across each continuous curve segment, strictly preventing bridging across discontinuities or asymptotes.
 */
export function generateInequalitySegments(
  segments: CurveSegment[],
  op: '<' | '<=' | '>' | '>=',
  viewport: GraphViewport
): Point2D[][] {
  const isBelow = op === '<' || op === '<=';
  const baselineY = isBelow ? viewport.yMin : viewport.yMax;
  const polygons: Point2D[][] = [];

  for (const seg of segments) {
    if (seg.points.length < 2) continue;
    const poly: Point2D[] = [];

    // Follow the curve along the segment
    for (const pt of seg.points) {
      poly.push({ x: pt.x, y: pt.y });
    }

    // Drop down/up to the baseline at the right edge
    const last = seg.points[seg.points.length - 1];
    const first = seg.points[0];
    poly.push({ x: last.x, y: baselineY });
    poly.push({ x: first.x, y: baselineY });

    polygons.push(poly);
  }

  return polygons;
}

/**
 * Backward compatibility wrapper returning primary or combined polygon points.
 */
export function generateInequalityPolygon(
  compiled: CompiledSafeExpression,
  op: '<' | '<=' | '>' | '>=',
  viewport: GraphViewport,
  scope: Record<string, number> = {},
  samples: number = 200
): Point2D[] {
  const segments = sampleGraphCurve(compiled, {
    viewport,
    scope,
    pixelWidth: samples * 3,
  });
  const polys = generateInequalitySegments(segments, op, viewport);
  return polys.length > 0 ? polys[0] : [];
}

/**
 * Samples the 1st or 2nd derivative curve of f(x) across the viewport.
 */
export function sampleDerivativeCurve(
  compiled: CompiledSafeExpression,
  options: SampleCurveOptions,
  order: 1 | 2 = 1
): CurveSegment[] {
  const {
    viewport,
    domainMin,
    domainMax,
    scope = {},
    pixelWidth = 800,
  } = options;

  const rawXMin = viewport.xMin;
  const rawXMax = viewport.xMax;
  if (rawXMin >= rawXMax) return [];

  const effectiveXMin = domainMin !== undefined ? Math.max(rawXMin, domainMin) : rawXMin;
  const effectiveXMax = domainMax !== undefined ? Math.min(rawXMax, domainMax) : rawXMax;
  if (effectiveXMin >= effectiveXMax) return [];

  const baseSteps = Math.min(800, Math.max(100, Math.round(pixelWidth / 2.5)));
  const dx = (effectiveXMax - effectiveXMin) / baseSteps;
  const segments: CurveSegment[] = [];
  let currentSegment: Point2D[] = [];

  const evalAt = (x: number): number | null => {
    try {
      const val = compiled.evaluate({ ...scope, x });
      return val !== null && Number.isFinite(val) ? val : null;
    } catch {
      return null;
    }
  };

  const evalDeriv = (x: number): number | null => {
    const h = Math.max(1e-6, Math.abs(x) * 1e-6);
    if (order === 1) {
      // 5-point stencil central difference
      const fm2 = evalAt(x - 2 * h);
      const fm1 = evalAt(x - h);
      const fp1 = evalAt(x + h);
      const fp2 = evalAt(x + 2 * h);
      if (fm2 !== null && fm1 !== null && fp1 !== null && fp2 !== null) {
        return (-fp2 + 8 * fp1 - 8 * fm1 + fm2) / (12 * h);
      }
      // Fallback 2-point central difference
      if (fm1 !== null && fp1 !== null) {
        return (fp1 - fm1) / (2 * h);
      }
    } else {
      // 2nd derivative central difference
      const f0 = evalAt(x);
      const fm1 = evalAt(x - h);
      const fp1 = evalAt(x + h);
      if (f0 !== null && fm1 !== null && fp1 !== null) {
        return (fp1 - 2 * f0 + fm1) / (h * h);
      }
    }
    return null;
  };

  const ySpan = Math.abs(viewport.yMax - viewport.yMin);
  const jumpThreshold = Math.max(20, ySpan * 4);

  for (let i = 0; i <= baseSteps; i++) {
    const x = effectiveXMin + i * dx;
    const y = evalDeriv(x);
    if (y !== null && Number.isFinite(y) && Math.abs(y) < 1e6) {
      if (currentSegment.length > 0) {
        const lastY = currentSegment[currentSegment.length - 1].y;
        if (Math.abs(y - lastY) > jumpThreshold && ((y > 0 && lastY < 0) || (y < 0 && lastY > 0))) {
          segments.push({ points: currentSegment });
          currentSegment = [];
        }
      }
      currentSegment.push({ x, y });
    } else {
      if (currentSegment.length > 0) {
        segments.push({ points: currentSegment });
        currentSegment = [];
      }
    }
  }

  if (currentSegment.length > 0) {
    segments.push({ points: currentSegment });
  }

  return segments;
}

/**
 * Detects vertical asymptotes within the viewport domain (e.g. at roots of denominators like 1/x or poles of tan(x)).
 */
export function detectVerticalAsymptotes(
  compiled: CompiledSafeExpression,
  viewport: GraphViewport,
  scope: Record<string, number> = {}
): number[] {
  const xMin = viewport.xMin;
  const xMax = viewport.xMax;
  const steps = 400;
  const dx = (xMax - xMin) / steps;
  const asymptotes: number[] = [];

  const evalAt = (x: number): number | null => {
    try {
      const val = compiled.evaluate({ ...scope, x });
      return val !== null && Number.isFinite(val) ? val : null;
    } catch {
      return null;
    }
  };

  const ySpan = Math.abs(viewport.yMax - viewport.yMin);
  const threshold = Math.max(20, ySpan * 1.5);

  for (let i = 0; i < steps; i++) {
    const x0 = xMin + i * dx;
    const x1 = x0 + dx;
    const xMid = (x0 + x1) / 2;

    const y0 = evalAt(x0);
    const y1 = evalAt(x1);

    // Case 1: Point at xMid evaluates to null (e.g. division by zero at x=0 for 1/x)
    const yMid = evalAt(xMid);
    if (yMid === null) {
      const yLeft = evalAt(xMid - dx * 0.1);
      const yRight = evalAt(xMid + dx * 0.1);
      if (
        (yLeft !== null && Math.abs(yLeft) > threshold) ||
        (yRight !== null && Math.abs(yRight) > threshold)
      ) {
        if (!asymptotes.some((a) => Math.abs(a - xMid) < dx * 2)) {
          asymptotes.push(xMid);
        }
        continue;
      }
    }

    // Case 2: Sign change with steep divergence (pole between x0 and x1)
    if (y0 !== null && y1 !== null) {
      if (
        (y0 > threshold && y1 < -threshold) ||
        (y0 < -threshold && y1 > threshold) ||
        (Math.abs(y1 - y0) > threshold * 2 && y0 * y1 < 0)
      ) {
        if (!asymptotes.some((a) => Math.abs(a - xMid) < dx * 2)) {
          asymptotes.push(xMid);
        }
      }
    }
  }

  return asymptotes;
}

/**
 * Computes multiple independent shaded polygon segments between two curves f(x) and g(x).
 */
export function sampleAreaBetweenCurves(
  compiled1: CompiledSafeExpression,
  compiled2: CompiledSafeExpression,
  xMin: number,
  xMax: number,
  scope: Record<string, number> = {},
  samples: number = 200
): Point2D[][] {
  const step = (xMax - xMin) / samples;
  const segments: { upper: Point2D[]; lower: Point2D[] }[] = [];
  let currentUpper: Point2D[] = [];
  let currentLower: Point2D[] = [];

  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * step;
    try {
      const y1 = compiled1.evaluate({ ...scope, x });
      const y2 = compiled2.evaluate({ ...scope, x });
      if (
        y1 !== null &&
        y2 !== null &&
        Number.isFinite(y1) &&
        Number.isFinite(y2)
      ) {
        currentUpper.push({ x, y: Math.max(y1, y2) });
        currentLower.push({ x, y: Math.min(y1, y2) });
      } else {
        if (currentUpper.length > 1) {
          segments.push({ upper: currentUpper, lower: currentLower });
          currentUpper = [];
          currentLower = [];
        }
      }
    } catch {
      if (currentUpper.length > 1) {
        segments.push({ upper: currentUpper, lower: currentLower });
        currentUpper = [];
        currentLower = [];
      }
    }
  }

  if (currentUpper.length > 1) {
    segments.push({ upper: currentUpper, lower: currentLower });
  }

  const polygons: Point2D[][] = [];
  for (const seg of segments) {
    const poly: Point2D[] = [];
    // Traverse upper curve left to right
    for (const pt of seg.upper) {
      poly.push(pt);
    }
    // Traverse lower curve right to left
    for (let j = seg.lower.length - 1; j >= 0; j--) {
      poly.push(seg.lower[j]);
    }
    polygons.push(poly);
  }

  return polygons;
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
