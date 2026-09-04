import { describe, it, expect } from 'vitest';
import {
  sampleGraphCurve,
  sampleParametricCurve,
  samplePolarCurve,
  generateInequalitySegments,
  sampleDerivativeCurve,
  detectVerticalAsymptotes,
  sampleAreaBetweenCurves,
  computeAutoFitViewport,
} from './graphSampling';
import { compileSafeExpression, CompiledSafeExpression } from './calculator';
import { GraphViewport } from '../types';

function safeCompile(expr: string, vars: string[] = ['x', 't', 'theta', 'θ']): CompiledSafeExpression | null {
  const res = compileSafeExpression(expr, 'RAD', vars);
  return res.ok ? res.compiled : null;
}

describe('graphSampling Engine', () => {
  const defaultViewport: GraphViewport = {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
  };

  it('samples continuous Cartesian function smoothly', () => {
    const compiled = safeCompile('x^2 - 4');
    expect(compiled).not.toBeNull();
    const segments = sampleGraphCurve(compiled!, {
      viewport: defaultViewport,
      pixelWidth: 400,
    });
    expect(segments.length).toBeGreaterThan(0);
    // Continuous parabola should yield 1 continuous segment
    expect(segments.length).toBe(1);
    expect(segments[0].points.length).toBeGreaterThan(20);
  });

  it('strictly splits 1/x across x = 0 discontinuity', () => {
    const compiled = safeCompile('1 / x');
    expect(compiled).not.toBeNull();
    const segments = sampleGraphCurve(compiled!, {
      viewport: defaultViewport,
      pixelWidth: 600,
    });
    // Must be split into at least 2 disconnected segments (left branch x < 0 and right branch x > 0)
    expect(segments.length).toBeGreaterThanOrEqual(2);
    for (const seg of segments) {
      // Check that no segment bridges across negative and positive x with huge jump
      for (let i = 1; i < seg.points.length; i++) {
        const p0 = seg.points[i - 1];
        const p1 = seg.points[i];
        if (p0.x < 0 && p1.x > 0) {
          throw new Error(`Segment bridged across x=0: (${p0.x}, ${p0.y}) to (${p1.x}, ${p1.y})`);
        }
      }
    }
  });

  it('samples parametric curves correctly', () => {
    const compX = safeCompile('5 * cos(t)');
    const compY = safeCompile('5 * sin(t)');
    expect(compX).not.toBeNull();
    expect(compY).not.toBeNull();

    const segments = sampleParametricCurve(compX!, compY!, {
      tMin: 0,
      tMax: 2 * Math.PI,
      steps: 100,
      viewport: defaultViewport,
    });
    expect(segments.length).toBe(1);
    expect(segments[0].points.length).toBeGreaterThan(50);
    // First point should be close to (5, 0)
    expect(segments[0].points[0].x).toBeCloseTo(5, 1);
    expect(segments[0].points[0].y).toBeCloseTo(0, 1);
  });

  it('samples polar curves correctly', () => {
    const compR = safeCompile('2 + 2 * cos(theta)');
    expect(compR).not.toBeNull();

    const segments = samplePolarCurve(compR!, {
      thetaMin: 0,
      thetaMax: 2 * Math.PI,
      steps: 100,
      viewport: defaultViewport,
    });
    expect(segments.length).toBe(1);
    expect(segments[0].points.length).toBeGreaterThan(50);
  });

  it('generates inequality polygons without bridging across discontinuities', () => {
    const compiled = safeCompile('x^2');
    const segments = sampleGraphCurve(compiled!, {
      viewport: { xMin: -2, xMax: 2, yMin: 0, yMax: 5 },
      pixelWidth: 200,
    });
    const polygons = generateInequalitySegments(segments, '<=', {
      xMin: -2,
      xMax: 2,
      yMin: 0,
      yMax: 5,
    });
    expect(polygons.length).toBe(1);
    expect(polygons[0].length).toBeGreaterThan(10);
  });

  it('computes numerical first and second derivative curves accurately', () => {
    // f(x) = x^2 -> f'(x) = 2x, f''(x) = 2
    const compiled = safeCompile('x^2');
    expect(compiled).not.toBeNull();

    const d1Segs = sampleDerivativeCurve(compiled!, {
      viewport: { xMin: -5, xMax: 5, yMin: -10, yMax: 10 },
      pixelWidth: 200,
    }, 1);
    expect(d1Segs.length).toBe(1);
    // Test a point near x=3 -> f'(x) should equal 2*x
    const ptAt3 = d1Segs[0].points.find((p) => Math.abs(p.x - 3) < 0.1);
    expect(ptAt3).toBeDefined();
    expect(ptAt3!.y).toBeCloseTo(2 * ptAt3!.x, 1);

    const d2Segs = sampleDerivativeCurve(compiled!, {
      viewport: { xMin: -5, xMax: 5, yMin: -10, yMax: 10 },
      pixelWidth: 200,
    }, 2);
    expect(d2Segs.length).toBe(1);
    const pt2At0 = d2Segs[0].points.find((p) => Math.abs(p.x) < 0.1);
    expect(pt2At0).toBeDefined();
    expect(pt2At0!.y).toBeCloseTo(2, 0.5);
  });

  it('detects vertical asymptotes for 1/x near x=0', () => {
    const compiled = safeCompile('1 / x');
    const asyms = detectVerticalAsymptotes(compiled!, {
      xMin: -5,
      xMax: 5,
      yMin: -10,
      yMax: 10,
    });
    expect(asyms.length).toBeGreaterThan(0);
    expect(Math.abs(asyms[0])).toBeLessThan(0.2);
  });

  it('samples area between two intersecting curves', () => {
    const comp1 = safeCompile('4 - x^2');
    const comp2 = safeCompile('0');
    expect(comp1).not.toBeNull();
    expect(comp2).not.toBeNull();

    const polys = sampleAreaBetweenCurves(comp1!, comp2!, -2, 2);
    expect(polys.length).toBeGreaterThan(0);
    expect(polys[0].length).toBeGreaterThan(10);
  });

  it('computes auto-fit viewport correctly', () => {
    const segments = [
      {
        points: [
          { x: -2, y: 0 },
          { x: 0, y: 4 },
          { x: 2, y: 0 },
        ],
      },
    ];
    const vp = computeAutoFitViewport(segments, defaultViewport);
    expect(vp.xMin).toBeLessThan(-2);
    expect(vp.xMax).toBeGreaterThan(2);
    expect(vp.yMin).toBeLessThan(0);
    expect(vp.yMax).toBeGreaterThan(4);
  });
});
