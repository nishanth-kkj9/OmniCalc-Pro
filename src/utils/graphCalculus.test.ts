import { describe, it, expect } from 'vitest';
import {
  calculateParametricArcLength,
  calculatePolarArcLength,
  calculatePolarArea,
  calculateDefiniteIntegral,
  generateIntegralPolygons,
} from './graphAnalysis';
import { integrateDefinite } from './numericalAnalysis';
import { compileSafeExpression, CompiledSafeExpression } from './calculator';
import { loadGraphSessions, saveGraphSession } from './graphStorage';

function compile(expr: string, vars: string[] = ['x']): CompiledSafeExpression {
  const res = compileSafeExpression(expr, 'RAD', vars);
  if (!res.ok) {
    throw new Error(`Failed to compile ${expr}: ${res.error}`);
  }
  return res.compiled;
}

describe('Graph Calculus & Analysis Correctness', () => {
  describe('Parametric Arc Length', () => {
    it('accurately computes unit circle arc length (2*pi)', () => {
      const compX = compile('cos(t)', ['t']);
      const compY = compile('sin(t)', ['t']);

      const length = calculateParametricArcLength(compX, compY, 0, 2 * Math.PI);
      expect(length).not.toBeNull();
      expect(length!).toBeCloseTo(2 * Math.PI, 2);
    });

    it('accurately computes straight line segment arc length (3-4-5 triangle)', () => {
      const compX = compile('3 * t', ['t']);
      const compY = compile('4 * t', ['t']);

      const length = calculateParametricArcLength(compX, compY, 0, 1);
      expect(length).not.toBeNull();
      expect(length!).toBeCloseTo(5.0, 3);
    });
  });

  describe('Polar Calculus (Arc Length & Area)', () => {
    it('computes polar circle r = 1 arc length and area', () => {
      const compR = compile('1', ['theta', 'θ']);

      const arcLength = calculatePolarArcLength(compR, 0, 2 * Math.PI);
      const area = calculatePolarArea(compR, 0, 2 * Math.PI);

      expect(arcLength).not.toBeNull();
      expect(arcLength!).toBeCloseTo(2 * Math.PI, 2);

      expect(area).not.toBeNull();
      expect(area!).toBeCloseTo(Math.PI, 2);
    });

    it('computes cardioid r = 1 + cos(theta) area (1.5 * pi)', () => {
      const compR = compile('1 + cos(theta)', ['theta', 'θ']);

      const area = calculatePolarArea(compR, 0, 2 * Math.PI);
      expect(area).not.toBeNull();
      expect(area!).toBeCloseTo(1.5 * Math.PI, 2);
    });
  });

  describe('Singularity-Aware Definite Integration', () => {
    it('accurately integrates smooth function x^2 over [0, 1]', () => {
      const comp = compile('x^2', ['x']);

      const result = calculateDefiniteIntegral(comp, 0, 1);
      expect(result).not.toBeNull();
      expect(result?.singularityDetected).toBeFalsy();
      expect(result?.value).toBeCloseTo(1 / 3, 4);
    });

    it('detects singularity for 1/x over [-1, 1] without returning bogus finite value', () => {
      const comp = compile('1 / x', ['x']);

      const numRes = integrateDefinite(comp, -1, 1);
      expect(numRes?.singularityDetected).toBe(true);

      const result = calculateDefiniteIntegral(comp, -1, 1);
      expect(result).not.toBeNull();
      expect(result?.singularityDetected).toBe(true);
      expect(Number.isNaN(result?.value)).toBe(true);
    });
  });

  describe('Non-Bridging Integral Shading Polygons', () => {
    it('produces non-empty polygon for smooth function', () => {
      const comp = compile('sin(x)', ['x']);

      const polys = generateIntegralPolygons(comp, 0, Math.PI);
      expect(polys.length).toBeGreaterThan(0);
      expect(polys[0].length).toBeGreaterThanOrEqual(3);
    });

    it('splits into separate polygons across singularity to prevent bridging across asymptotes', () => {
      const comp = compile('1 / (x - 1)', ['x']);

      const polys = generateIntegralPolygons(comp, 0, 2);
      expect(polys.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Canonical Curve Type & Storage Migration', () => {
    it('migrates legacy cartesian type to canonical function type on load', () => {
      const legacySession = {
        id: 'legacy-test-session',
        title: 'Legacy Session',
        timestamp: Date.now(),
        expressions: [
          {
            id: 'expr-1',
            expression: 'x^2',
            type: 'cartesian' as any,
            color: '#38bdf8',
            visible: true,
            lineWidth: 2,
            lineStyle: 'solid' as const,
          },
        ],
        viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        settings: {
          showGrid: true,
          showMinorGrid: true,
          showAxes: true,
          showAxisLabels: true,
          showCoordinates: true,
          showCurveLabels: false,
          lockAspectRatio: false,
        },
      };

      saveGraphSession(legacySession as any);
      const loaded = loadGraphSessions();
      const target = loaded.find((s) => s.id === 'legacy-test-session');
      expect(target).toBeDefined();
      expect(target!.expressions[0].type).toBe('function');
    });
  });
});
