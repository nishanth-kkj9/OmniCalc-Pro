import { describe, it, expect } from 'vitest';
import {
  DEFAULT_VIEWPORT,
  graphToScreen,
  screenToGraph,
  calculateNiceStep,
  formatTickLabel,
  zoomViewportAroundPoint,
  panViewport,
  getOrCompileGraphExpression,
} from './graph';
import { sampleGraphCurve } from './graphSampling';
import {
  findRoots,
  findExtrema,
  findIntersections,
  calculateDerivative,
  calculateTangentLine,
  calculateNormalLine,
  calculateDefiniteIntegral,
} from './graphAnalysis';
import { sanitizeGraphSession, PRESET_SESSIONS } from './graphStorage';
import { exportGraphAsSvg } from './graphExport';

describe('Graph Coordinates and Viewport Math', () => {
  const dimensions = { width: 800, height: 600 };
  const viewport = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

  it('correctly maps origin (0, 0) to center of canvas', () => {
    const screen = graphToScreen(0, 0, viewport, dimensions);
    expect(screen.x).toBe(400);
    expect(screen.y).toBe(300);

    const graph = screenToGraph(400, 300, viewport, dimensions);
    expect(graph.x).toBeCloseTo(0, 5);
    expect(graph.y).toBeCloseTo(0, 5);
  });

  it('correctly roundtrips arbitrary Cartesian coordinates', () => {
    const original = { x: 3.5, y: -4.2 };
    const screen = graphToScreen(original.x, original.y, viewport, dimensions);
    const back = screenToGraph(screen.x, screen.y, viewport, dimensions);
    expect(back.x).toBeCloseTo(original.x, 5);
    expect(back.y).toBeCloseTo(original.y, 5);
  });

  it('calculates human-friendly tick steps', () => {
    expect(calculateNiceStep(20, 10)).toBe(2);
    expect(calculateNiceStep(100, 10)).toBe(10);
    expect(calculateNiceStep(1, 10)).toBe(0.1);
  });

  it('formats tick labels without floating point noise', () => {
    expect(formatTickLabel(0)).toBe('0');
    expect(formatTickLabel(2)).toBe('2');
    expect(formatTickLabel(-3.5)).toBe('-3.5');
  });

  it('zooms viewport centered around cursor', () => {
    const center = { x: 2, y: 3 };
    const zoomedIn = zoomViewportAroundPoint(viewport, center.x, center.y, 0.5);

    expect(zoomedIn.xMax - zoomedIn.xMin).toBe(10); // halved from 20
    expect(zoomedIn.yMax - zoomedIn.yMin).toBe(10);
    // Center point remains invariant
    const ratioX = (center.x - zoomedIn.xMin) / (zoomedIn.xMax - zoomedIn.xMin);
    const origRatioX = (center.x - viewport.xMin) / (viewport.xMax - viewport.xMin);
    expect(ratioX).toBeCloseTo(origRatioX, 5);
  });

  it('pans viewport by screen delta', () => {
    const panned = panViewport(viewport, 40, 30, dimensions);
    // 40 screen px out of 800 width = 1 unit in graph
    expect(panned.xMin).toBeCloseTo(-11, 4);
    expect(panned.xMax).toBeCloseTo(9, 4);
  });
});

describe('Graph Compilation & Adaptive Sampling', () => {
  it('safely compiles expressions and rejects dangerous ones', () => {
    const valid = getOrCompileGraphExpression('x^2 - 4', 'DEG');
    expect(valid).not.toBeNull();
    expect(valid?.evaluate({ x: 3 })).toBe(5);

    const sliderCompiled = getOrCompileGraphExpression('a*x + b', 'DEG', ['a', 'b']);
    expect(sliderCompiled).not.toBeNull();
    expect(sliderCompiled?.evaluate({ x: 4, a: 2, b: 3 })).toBe(11);

    const dangerous = getOrCompileGraphExpression('window.alert(1)', 'DEG');
    expect(dangerous).toBeNull();
  });

  it('adaptively samples continuous curves like parabolas', () => {
    const compiled = getOrCompileGraphExpression('x^2', 'DEG');
    expect(compiled).not.toBeNull();

    const segments = sampleGraphCurve(compiled!, {
      viewport: { xMin: -5, xMax: 5, yMin: 0, yMax: 25 },
      pixelWidth: 500,
    });

    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].points.length).toBeGreaterThan(20);
    // Check vertex is captured near (0, 0)
    const hasNearZero = segments[0].points.some((p) => Math.abs(p.x) < 0.1 && Math.abs(p.y) < 0.1);
    expect(hasNearZero).toBe(true);
  });

  it('detects asymptotes in rational functions and separates segments', () => {
    const compiled = getOrCompileGraphExpression('1/x', 'DEG');
    expect(compiled).not.toBeNull();

    const segments = sampleGraphCurve(compiled!, {
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      pixelWidth: 500,
    });

    // 1/x must be split into at least 2 distinct segments across vertical asymptote x=0
    expect(segments.length).toBeGreaterThanOrEqual(2);
  });

  it('respects domain restrictions [min, max]', () => {
    const compiled = getOrCompileGraphExpression('x^2', 'DEG');
    const segments = sampleGraphCurve(compiled!, {
      viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      domainMin: -2,
      domainMax: 3,
    });

    for (const seg of segments) {
      for (const pt of seg.points) {
        expect(pt.x).toBeGreaterThanOrEqual(-2.01);
        expect(pt.x).toBeLessThanOrEqual(3.01);
      }
    }
  });
});

describe('Mathematical Analysis Engine', () => {
  it('finds numerical roots accurately', () => {
    const compiled = getOrCompileGraphExpression('x^2 - 4', 'DEG')!;
    const roots = findRoots(compiled, { min: -5, max: 5 });

    expect(roots.length).toBe(2);
    expect(roots[0]).toBeCloseTo(-2, 3);
    expect(roots[1]).toBeCloseTo(2, 3);
  });

  it('finds local extrema (minima and maxima)', () => {
    // f(x) = x^3 - 3x has max at x = -1, min at x = 1
    const compiled = getOrCompileGraphExpression('x^3 - 3*x', 'DEG')!;
    const extrema = findExtrema(compiled, { min: -3, max: 3 });

    const maxPt = extrema.find((e) => e.type === 'max');
    const minPt = extrema.find((e) => e.type === 'min');

    expect(maxPt).toBeDefined();
    expect(maxPt?.x).toBeCloseTo(-1, 2);
    expect(maxPt?.y).toBeCloseTo(2, 2);

    expect(minPt).toBeDefined();
    expect(minPt?.x).toBeCloseTo(1, 2);
    expect(minPt?.y).toBeCloseTo(-2, 2);
  });

  it('finds intersections between two functions', () => {
    // Intersect y = x^2 and y = 4
    const fn1 = getOrCompileGraphExpression('x^2', 'DEG')!;
    const fn2 = getOrCompileGraphExpression('4', 'DEG')!;

    const intersections = findIntersections(fn1, fn2, { min: -5, max: 5 });
    expect(intersections.length).toBe(2);
    expect(intersections[0].x).toBeCloseTo(-2, 2);
    expect(intersections[0].y).toBeCloseTo(4, 2);
    expect(intersections[1].x).toBeCloseTo(2, 2);
    expect(intersections[1].y).toBeCloseTo(4, 2);
  });

  it('calculates numerical derivative and tangent line equation', () => {
    // For y = x^2, derivative at x=2 is 2*x = 4. Tangent equation: y = 4x - 4
    const compiled = getOrCompileGraphExpression('x^2', 'DEG')!;
    const deriv = calculateDerivative(compiled, 2);
    expect(deriv).toBeCloseTo(4, 3);

    const tangent = calculateTangentLine(compiled, 2);
    expect(tangent).not.toBeNull();
    expect(tangent?.slope).toBeCloseTo(4, 3);
    expect(tangent?.equation).toContain('y = 4.000x - 4.000');

    const normal = calculateNormalLine(compiled, 2);
    expect(normal).not.toBeNull();
    expect(normal?.slope).toBeCloseTo(-0.25, 3);
  });

  it('calculates definite integral using Simpson rule', () => {
    // Integral of x^2 from 0 to 3 is [x^3 / 3]_0^3 = 9
    const compiled = getOrCompileGraphExpression('x^2', 'DEG')!;
    const integral = calculateDefiniteIntegral(compiled, 0, 3);
    expect(integral).not.toBeNull();
    expect(integral?.value).toBeCloseTo(9, 3);
  });
});

describe('Graph Storage and Export', () => {
  it('validates and sanitizes imported graph sessions', () => {
    const raw = {
      id: 'test-1',
      title: 'Valid Session',
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      expressions: [{ expression: 'sin(x)', color: '#10b981' }],
    };

    const sanitized = sanitizeGraphSession(raw);
    expect(sanitized).not.toBeNull();
    expect(sanitized?.title).toBe('Valid Session');
    expect(sanitized?.expressions[0].expression).toBe('sin(x)');
  });

  it('rejects malformed payloads safely', () => {
    expect(sanitizeGraphSession(null)).toBeNull();
    expect(sanitizeGraphSession('not-json')).toBeNull();
  });

  it('contains valid curated presets', () => {
    expect(PRESET_SESSIONS.length).toBeGreaterThan(4);
    for (const preset of PRESET_SESSIONS) {
      expect(preset.expressions.length).toBeGreaterThan(0);
      expect(preset.viewport.xMin).toBeLessThan(preset.viewport.xMax);
    }
  });

  it('generates valid vector SVG markup', () => {
    const compiled = getOrCompileGraphExpression('x', 'DEG')!;
    const segs = sampleGraphCurve(compiled, {
      viewport: DEFAULT_VIEWPORT,
    });

    const svg = exportGraphAsSvg({
      viewport: DEFAULT_VIEWPORT,
      settings: {
        showGrid: true,
        showMinorGrid: true,
        showAxes: true,
        showAxisLabels: true,
        showCoordinates: true,
        showCurveLabels: true,
        lockAspectRatio: false,
      },
      expressions: [
        {
          id: '1',
          expression: 'x',
          visible: true,
          color: '#38bdf8',
          lineWidth: 2,
          lineStyle: 'solid',
        },
      ],
      segmentsMap: new Map([['1', segs]]),
      theme: 'dark',
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('<path');
  });
});
