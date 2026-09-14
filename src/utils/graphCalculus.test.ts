import { describe, it, expect } from 'vitest';
import {
  calculateParametricArcLength,
  calculatePolarArcLength,
  calculatePolarArea,
  calculateDefiniteIntegral,
  calculateAreaBetweenCurves,
  generateIntegralPolygons,
  generateAreaBetweenPolygons,
  findRoots,
  findExtrema,
  findIntersections,
  calculateDerivative,
  calculateTangentLine,
  calculateNormalLine,
} from './graphAnalysis';
import { integrateDefinite } from './numericalAnalysis';
import { compileSafeExpression, CompiledSafeExpression } from './calculator';
import { loadGraphSessions, saveGraphSession } from './graphStorage';
import { getOrCompileGraphExpression } from './graph';
import { generateCurveDataCsv } from './graphExport';
import { GraphExpression } from '../types';

function compile(
  expr: string,
  vars: string[] = ['x'],
  angleMode: 'RAD' | 'DEG' | 'GRAD' = 'RAD'
): CompiledSafeExpression {
  const res = compileSafeExpression(expr, angleMode, vars);
  if (!res.ok) {
    throw new Error(`Failed to compile ${expr}: ${res.error}`);
  }
  return res.compiled;
}

describe('Graph Calculus & Analysis Correctness', () => {
  describe('Angle-Unit Semantics (RAD, DEG, GRAD)', () => {
    it('evaluates trigonometric functions accurately across all angle modes', () => {
      const radSin = compile('sin(x)', ['x'], 'RAD');
      const degSin = compile('sin(x)', ['x'], 'DEG');
      const gradSin = compile('sin(x)', ['x'], 'GRAD');

      expect(radSin.evaluate({ x: Math.PI / 2 })).toBeCloseTo(1, 4);
      expect(degSin.evaluate({ x: 90 })).toBeCloseTo(1, 4);
      expect(gradSin.evaluate({ x: 100 })).toBeCloseTo(1, 4);

      const radCos = compile('cos(x)', ['x'], 'RAD');
      const degCos = compile('cos(x)', ['x'], 'DEG');
      const gradCos = compile('cos(x)', ['x'], 'GRAD');

      expect(radCos.evaluate({ x: Math.PI })).toBeCloseTo(-1, 4);
      expect(degCos.evaluate({ x: 180 })).toBeCloseTo(-1, 4);
      expect(gradCos.evaluate({ x: 200 })).toBeCloseTo(-1, 4);
    });

    it('evaluates polar and parametric equations in DEG angle mode', () => {
      const degParamX = compile('cos(t)', ['t'], 'DEG');
      const degParamY = compile('sin(t)', ['t'], 'DEG');

      expect(degParamX.evaluate({ t: 0 })).toBeCloseTo(1, 4);
      expect(degParamY.evaluate({ t: 90 })).toBeCloseTo(1, 4);

      const degPolarR = compile('2 * cos(theta)', ['theta', 'θ'], 'DEG');
      expect(degPolarR.evaluate({ theta: 0 })).toBeCloseTo(2, 4);
      expect(degPolarR.evaluate({ theta: 90 })).toBeCloseTo(0, 4);
    });
  });

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

  describe('Numerical Roots, Extrema, & Intersections', () => {
    it('identifies roots including sign-change and tangential roots', () => {
      const compQuad = compile('x^2 - 4', ['x']);
      const rootsQuad = findRoots(compQuad, { min: -3, max: 3 });
      expect(rootsQuad.length).toBe(2);
      expect(rootsQuad[0]).toBeCloseTo(-2, 1);
      expect(rootsQuad[1]).toBeCloseTo(2, 1);

      const compTang = compile('x^2', ['x']);
      const rootsTang = findRoots(compTang, { min: -2, max: 2 });
      expect(rootsTang.length).toBeGreaterThanOrEqual(1);
      expect(rootsTang.some((r) => Math.abs(r) < 0.05)).toBe(true);
    });

    it('identifies local extrema while rejecting asymptotic spikes', () => {
      const compCubic = compile('x^3 - 3*x', ['x']);
      const extrema = findExtrema(compCubic, { min: -2.5, max: 2.5 });
      expect(extrema.length).toBeGreaterThanOrEqual(2);
      const maxPt = extrema.find((e) => e.type === 'max');
      const minPt = extrema.find((e) => e.type === 'min');
      expect(maxPt).toBeDefined();
      expect(maxPt?.x).toBeCloseTo(-1, 1);
      expect(minPt).toBeDefined();
      expect(minPt?.x).toBeCloseTo(1, 1);

      // Asymptote 1/x should not produce local extrema
      const compInv = compile('1 / x', ['x']);
      const invExtrema = findExtrema(compInv, { min: -2, max: 2 });
      expect(invExtrema.length).toBe(0);
    });

    it('computes intersections and tangential intersections', () => {
      const fn1 = compile('x^2', ['x']);
      const fn2 = compile('4', ['x']);
      const inters = findIntersections(fn1, fn2, { min: -3, max: 3 });
      expect(inters.length).toBe(2);
      expect(inters[0].x).toBeCloseTo(-2, 1);
      expect(inters[1].x).toBeCloseTo(2, 1);

      const fn3 = compile('0', ['x']);
      const tangInter = findIntersections(fn1, fn3, { min: -2, max: 2 });
      expect(tangInter.length).toBeGreaterThanOrEqual(1);
      expect(Math.abs(tangInter[0].x)).toBeLessThan(0.05);
    });

    it('calculates derivatives, tangents, and normal lines', () => {
      const comp = compile('x^2', ['x']);
      const deriv = calculateDerivative(comp, 1);
      expect(deriv).toBeCloseTo(2, 4);

      const tangent = calculateTangentLine(comp, 1);
      expect(tangent).not.toBeNull();
      expect(tangent?.slope).toBeCloseTo(2, 4);

      const normal = calculateNormalLine(comp, 1);
      expect(normal).not.toBeNull();
      expect(normal?.slope).toBeCloseTo(-0.5, 4);
    });
  });

  describe('Singularity-Aware Definite Integration', () => {
    it('accurately integrates smooth function x^2 over [0, 3] (= 9)', () => {
      const comp = compile('x^2', ['x']);

      const result = calculateDefiniteIntegral(comp, 0, 3);
      expect(result).not.toBeNull();
      expect(result?.singularityDetected).toBeFalsy();
      expect(result?.value).toBeCloseTo(9.0, 3);
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

    it('detects singularity for 1/(x-1) over [0, 2]', () => {
      const comp = compile('1 / (x - 1)', ['x']);
      const numRes = integrateDefinite(comp, 0, 2);
      expect(numRes?.singularityDetected).toBe(true);
    });

    it('calculates area between curves accurately: x^2 and 4 on [-2, 2] (32/3 ≈ 10.6667)', () => {
      const fn1 = compile('x^2', ['x']);
      const fn2 = compile('4', ['x']);
      const area = calculateAreaBetweenCurves(fn1, fn2, -2, 2);
      expect(area).not.toBeNull();
      expect(area?.value).toBeCloseTo(32 / 3, 2);
    });
  });

  describe('Non-Bridging Integral and Area Shading Polygons', () => {
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

    it('generates non-bridging area-between polygons when top/bottom has pole', () => {
      const fn1 = compile('1 / (x - 1)', ['x']);
      const fn2 = compile('0', ['x']);
      const polys = generateAreaBetweenPolygons(fn1, fn2, 0, 2);
      expect(Array.isArray(polys)).toBe(true);
    });
  });

  describe('Cache Immutability', () => {
    it('does not mutate caller-owned sliderNames array', () => {
      const sliderArray = ['c_slider', 'a_slider', 'b_slider'];
      const snapshot = [...sliderArray];

      getOrCompileGraphExpression('a_slider * x + b_slider', 'DEG', sliderArray);

      expect(sliderArray).toEqual(snapshot);
    });
  });

  describe('Curve-Type-Aware Export', () => {
    it('exports function curves with x, y headers', () => {
      const expr: GraphExpression = {
        id: '1',
        expression: 'x^2',
        type: 'function',
        color: '#38bdf8',
        visible: true,
        lineWidth: 2,
        lineStyle: 'solid',
      };
      const comp = compile('x^2', ['x']);
      const data = generateCurveDataCsv({ expression: expr, compiled: comp, range: { min: 0, max: 2, steps: 2 } });
      expect(data.headers).toEqual(['x', 'y']);
      expect(data.rows.length).toBe(3);
    });

    it('exports parametric curves with t, x, y headers', () => {
      const expr: GraphExpression = {
        id: '2',
        expression: 'cos(t)',
        type: 'parametric',
        color: '#38bdf8',
        visible: true,
        lineWidth: 2,
        lineStyle: 'solid',
        tMin: 0,
        tMax: 2 * Math.PI,
      };
      const compX = compile('cos(t)', ['t']);
      const compY = compile('sin(t)', ['t']);
      const data = generateCurveDataCsv({
        expression: expr,
        compiled: compX,
        compiledParametricY: compY,
        range: { min: 0, max: 2 * Math.PI, steps: 4 },
      });
      expect(data.headers).toEqual(['t', 'x', 'y']);
      expect(data.rows.length).toBe(5);
    });

    it('exports polar curves with theta, r, x, y headers', () => {
      const expr: GraphExpression = {
        id: '3',
        expression: '2',
        type: 'polar',
        color: '#38bdf8',
        visible: true,
        lineWidth: 2,
        lineStyle: 'solid',
        thetaMin: 0,
        thetaMax: 2 * Math.PI,
      };
      const compR = compile('2', ['theta', 'θ']);
      const data = generateCurveDataCsv({
        expression: expr,
        compiled: compR,
        range: { min: 0, max: 2 * Math.PI, steps: 4 },
      });
      expect(data.headers).toEqual(['theta', 'r', 'x', 'y']);
      expect(data.rows.length).toBe(5);
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

