import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { compileSafeExpression, evaluateExpression } from '../utils/calculator';
import { AppSettings } from '../types';
import {
  Plus,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Table as TableIcon,
  Layers,
  Sparkles,
  Compass,
  Box,
  TrendingUp,
  Play,
  Pause,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Crosshair,
} from 'lucide-react';
import { MAX_GRAPH_SAMPLES } from '../constants/limits';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';

interface GraphingCalculatorProps {
  settings: AppSettings;
}

export interface FunctionItem {
  id: string;
  expression: string;
  color: string;
  enabled: boolean;
  showDerivative?: boolean;
}

const COLORS = [
  '#38bdf8', // Sky Blue
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

// Preset definitions for all modes
const CARTESIAN_PRESETS = [
  { group: 'Trigonometric', label: 'sin(x) & cos(x)', exprs: ['sin(x)', 'cos(x)'] },
  { group: 'Trigonometric', label: 'Damped Oscillation', exprs: ['exp(-0.2*x) * sin(3*x)'] },
  { group: 'Trigonometric', label: 'Wave Interference', exprs: ['sin(2*x) + sin(2.4*x)'] },
  { group: 'Polynomial', label: 'Cubic & Extrema', exprs: ['x^3 - 3*x', '3*x^2 - 3'] },
  { group: 'Polynomial', label: 'Quartic Double-Well', exprs: ['x^4 - 4*x^2 + 1'] },
  { group: 'Rational', label: 'Asymptote Rational', exprs: ['1 / (x^2 - 1)'] },
  { group: 'Exponential', label: 'Gaussian Bell Curve', exprs: ['exp(-x^2 / 2)'] },
  { group: 'Exponential', label: 'Logistic Growth', exprs: ['1 / (1 + exp(-x))'] },
];

const POLAR_PRESETS = [
  { label: 'Cardioid', expr: '2 * (1 - cos(theta))', thetaMax: 6.2831853 },
  { label: 'Rose (4 Petals)', expr: '3 * sin(2*theta)', thetaMax: 6.2831853 },
  { label: 'Rose (3 Petals)', expr: '3 * cos(3*theta)', thetaMax: 3.1415926 },
  { label: 'Archimedes Spiral', expr: '0.4 * theta', thetaMax: 25.13274 },
  { label: 'Lemniscate (Loop)', expr: 'sqrt(abs(9 * cos(2*theta)))', thetaMax: 6.2831853 },
  { label: 'Limaçon with Loop', expr: '1 + 2 * cos(theta)', thetaMax: 6.2831853 },
  { label: 'Logarithmic Spiral', expr: 'exp(0.15 * theta)', thetaMax: 18.84955 },
];

const PARAMETRIC_PRESETS = [
  { label: 'Lissajous (3:2)', x: 'cos(3*t)', y: 'sin(2*t)', tMin: 0, tMax: 6.2831853 },
  { label: 'Lissajous (5:4)', x: 'sin(5*t)', y: 'cos(4*t)', tMin: 0, tMax: 6.2831853 },
  { label: 'Astroid (Star)', x: '3 * cos(t)^3', y: '3 * sin(t)^3', tMin: 0, tMax: 6.2831853 },
  { label: 'Trefoil Knot Projection', x: 'sin(t) + 2*sin(2*t)', y: 'cos(t) - 2*cos(2*t)', tMin: 0, tMax: 6.2831853 },
  { label: 'Hypocycloid (Deltoid)', x: '2*cos(t) + cos(2*t)', y: '2*sin(t) - sin(2*t)', tMin: 0, tMax: 6.2831853 },
  { label: 'Spiral of Archimedes', x: '0.5 * t * cos(t)', y: '0.5 * t * sin(t)', tMin: 0, tMax: 18.84955 },
];

const SURFACE_3D_PRESETS = [
  { label: 'Sombrero / Sinc', expr: 'sin(sqrt(x^2 + y^2)) / (sqrt(x^2 + y^2) + 0.1)' },
  { label: 'Monkey Saddle', expr: '(x^3 - 3*x*y^2) / 12' },
  { label: 'Hyperbolic Paraboloid', expr: '(x^2 - y^2) / 6' },
  { label: 'Paraboloid Bowl', expr: '(x^2 + y^2) / 8' },
  { label: 'Eggcrate Waves', expr: 'cos(x) * sin(y)' },
  { label: 'Gaussian Peak', expr: '3 * exp(-(x^2 + y^2)/4)' },
];

const REGRESSION_PRESETS = [
  {
    label: "Hooke's Law (Spring)",
    points: '0.0, 0.0\n0.5, 2.45\n1.0, 5.1\n1.5, 7.35\n2.0, 9.9\n2.5, 12.4\n3.0, 14.85',
  },
  {
    label: "Ohm's Law (V vs I)",
    points: '1.0, 0.05\n2.0, 0.105\n3.0, 0.148\n4.0, 0.201\n5.0, 0.252\n6.0, 0.298',
  },
  {
    label: 'Exponential Growth',
    points: '0.0, 1.2\n1.0, 2.7\n2.0, 7.5\n3.0, 20.1\n4.0, 54.6\n5.0, 148.0',
  },
  {
    label: 'Projectile Trajectory',
    points: '0.0, 0.0\n1.0, 8.5\n2.0, 14.2\n3.0, 17.1\n4.0, 16.9\n5.0, 13.8\n6.0, 7.8\n7.0, 0.2',
  },
];

export const GraphingCalculator: React.FC<GraphingCalculatorProps> = ({ settings }) => {
  const [graphMode, setGraphMode] = useState<'cartesian' | 'polar' | 'parametric' | '3d' | 'regression'>('cartesian');
  const [exportData, setExportData] = useState<ExportReportData | null>(null);

  // 2D Cartesian State
  const [functions, setFunctions] = useState<FunctionItem[]>([
    { id: 'f1', expression: 'sin(x)', color: COLORS[0], enabled: true, showDerivative: false },
    { id: 'f2', expression: 'x^2 - 4', color: COLORS[1], enabled: true, showDerivative: false },
  ]);
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-10);
  const [yMax, setYMax] = useState<number>(10);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [snappedPoint, setSnappedPoint] = useState<{ x: number; y: number; fnId: string; slope: number } | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [showExtremaRoots, setShowExtremaRoots] = useState<boolean>(true);
  const [showIntersections, setShowIntersections] = useState<boolean>(true);
  const [showTangentAtCursor, setShowTangentAtCursor] = useState<boolean>(true);
  const [shadeArea, setShadeArea] = useState<boolean>(false);
  const [shadeBetweenCurves, setShadeBetweenCurves] = useState<boolean>(false);
  const [shadeA, setShadeA] = useState<number>(-2);
  const [shadeB, setShadeB] = useState<number>(2);

  // Dragging / Pan State for 2D
  const [isPanning2D, setIsPanning2D] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; xMin: number; xMax: number; yMin: number; yMax: number }>({
    x: 0,
    y: 0,
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
  });

  // Polar State: r = f(theta)
  const [polarExpr, setPolarExpr] = useState<string>('2 * (1 - cos(theta))');
  const [thetaMax, setThetaMax] = useState<number>(6.2831853); // 2*pi
  const [isPolarAnimating, setIsPolarAnimating] = useState<boolean>(false);
  const [polarAnimProgress, setPolarAnimProgress] = useState<number>(1);

  // Parametric State: x(t), y(t)
  const [paramX, setParamX] = useState<string>('cos(3*t)');
  const [paramY, setParamY] = useState<string>('sin(2*t)');
  const [tMin, setTMin] = useState<number>(0);
  const [tMax, setTMax] = useState<number>(6.2831853);
  const [isParamAnimating, setIsParamAnimating] = useState<boolean>(false);
  const [paramCurrentT, setParamCurrentT] = useState<number>(0);

  // 3D Surface State: z = f(x, y)
  const [surfaceExpr, setSurfaceExpr] = useState<string>('sin(sqrt(x^2 + y^2)) / (sqrt(x^2 + y^2) + 0.1)');
  const [rotAlpha, setRotAlpha] = useState<number>(35); // Azimuth deg
  const [rotBeta, setRotBeta] = useState<number>(45); // Elevation deg
  const [isDragging3D, setIsDragging3D] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [is3DAutoRotating, setIs3DAutoRotating] = useState<boolean>(false);
  const [surfaceGridDensity, setSurfaceGridDensity] = useState<'coarse' | 'medium' | 'fine'>('medium');

  // Data Regression State
  const [regressionModelType, setRegressionModelType] = useState<'linear' | 'quadratic' | 'exponential' | 'power'>('linear');
  const [scatterPoints, setScatterPoints] = useState<string>(
    '1.0, 2.1\n2.0, 3.9\n3.0, 6.2\n4.0, 8.1\n5.0, 9.8\n6.0, 12.3'
  );

  // Table Custom Step Size
  const [tableStep, setTableStep] = useState<number>(1);
  const [tableStart, setTableStart] = useState<number>(-5);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : isOled
      ? 'bg-zinc-950 border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl';

  const subCardBg = isLight
    ? 'bg-slate-50 border-slate-200'
    : isOled
      ? 'bg-zinc-900 border-zinc-800'
      : 'bg-slate-950/80 border-slate-800/80';

  const inputBg = isLight
    ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-sky-500'
    : isOled
      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-sky-500'
      : 'bg-slate-800 border-slate-700 text-slate-100 focus:border-sky-500';

  // Fast Compiled Expressions for real-time evaluation
  const compiledCartesianFns = useMemo(() => {
    return functions.map((fn) => {
      if (!fn.enabled || !fn.expression.trim()) return null;
      const res = compileSafeExpression(fn.expression, settings.angleMode, ['x']);
      return res.ok ? res.compiled : null;
    });
  }, [functions, settings.angleMode]);

  const compiledPolarFn = useMemo(() => {
    if (!polarExpr.trim()) return null;
    const res = compileSafeExpression(polarExpr, settings.angleMode, ['theta', 'θ', 't', 'x']);
    return res.ok ? res.compiled : null;
  }, [polarExpr, settings.angleMode]);

  const compiledParamX = useMemo(() => {
    if (!paramX.trim()) return null;
    const res = compileSafeExpression(paramX, settings.angleMode, ['t', 'x', 'theta']);
    return res.ok ? res.compiled : null;
  }, [paramX, settings.angleMode]);

  const compiledParamY = useMemo(() => {
    if (!paramY.trim()) return null;
    const res = compileSafeExpression(paramY, settings.angleMode, ['t', 'x', 'theta']);
    return res.ok ? res.compiled : null;
  }, [paramY, settings.angleMode]);

  const compiledSurfaceFn = useMemo(() => {
    if (!surfaceExpr.trim()) return null;
    const res = compileSafeExpression(surfaceExpr, settings.angleMode, ['x', 'y']);
    return res.ok ? res.compiled : null;
  }, [surfaceExpr, settings.angleMode]);

  // Safe expression evaluator using compiled functions or fallback
  const evalCompiled = useCallback(
    (compiled: { evaluate: (scope?: any) => number | null } | null, scope: Record<string, number>): number | null => {
      if (!compiled) return null;
      try {
        const val = compiled.evaluate(scope);
        return val !== null && isFinite(val) ? val : null;
      } catch {
        return null;
      }
    },
    []
  );

  const evalExprFallback = useCallback(
    (expr: string, scope: Record<string, number>): number | null => {
      try {
        const resStr = evaluateExpression(expr, settings.angleMode, 8, scope);
        const num = parseFloat(resStr);
        return isNaN(num) || !isFinite(num) ? null : num;
      } catch {
        return null;
      }
    },
    [settings.angleMode]
  );

  const addFunction = () => {
    if (functions.length >= 6) return;
    const newId = 'f' + (functions.length + 1);
    const color = COLORS[functions.length % COLORS.length];
    setFunctions([...functions, { id: newId, expression: '', color, enabled: true, showDerivative: false }]);
  };

  const removeFunction = (id: string) => {
    if (functions.length <= 1) return;
    setFunctions(functions.filter((f) => f.id !== id));
  };

  const updateFunction = (id: string, updates: Partial<FunctionItem>) => {
    setFunctions(functions.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  // Compute Multiple Regression Models
  const regressionResults = useMemo(() => {
    const lines = scatterPoints.split('\n');
    const pts: { x: number; y: number }[] = [];
    lines.forEach((l) => {
      const parts = l.split(/[, \t]+/);
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
          pts.push({ x, y });
        }
      }
    });

    if (pts.length < 2) return null;

    const n = pts.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    pts.forEach((p) => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    });

    const denom = n * sumX2 - sumX * sumX;
    const denomY = n * sumY2 - sumY * sumY;
    if (Math.abs(denom) < 1e-12) return null;

    // Linear fit
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const rPearson = denomY > 0 ? (n * sumXY - sumX * sumY) / Math.sqrt(denom * denomY) : 1;
    const meanY = sumY / n;

    let ssTot = 0, ssResLin = 0;
    pts.forEach((p) => {
      const yPred = slope * p.x + intercept;
      ssTot += Math.pow(p.y - meanY, 2);
      ssResLin += Math.pow(p.y - yPred, 2);
    });
    const r2Lin = ssTot > 1e-12 ? Math.max(0, 1 - ssResLin / ssTot) : 1;

    // Quadratic fit: y = a x^2 + b x + c via normal equations
    let sumX3 = 0, sumX4 = 0, sumX2Y = 0;
    pts.forEach((p) => {
      const x2 = p.x * p.x;
      sumX3 += x2 * p.x;
      sumX4 += x2 * x2;
      sumX2Y += x2 * p.y;
    });

    let quadA = 0, quadB = 0, quadC = 0, r2Quad = 0, hasQuad = false;
    // 3x3 determinant system for quadratic
    const dQuad =
      sumX4 * (sumX2 * n - sumX * sumX) -
      sumX3 * (sumX3 * n - sumX * sumX2) +
      sumX2 * (sumX3 * sumX - sumX2 * sumX2);

    if (Math.abs(dQuad) > 1e-10 && pts.length >= 3) {
      const da =
        sumX2Y * (sumX2 * n - sumX * sumX) -
        sumX3 * (sumXY * n - sumX * sumY) +
        sumX2 * (sumXY * sumX - sumX2 * sumY);
      const db =
        sumX4 * (sumXY * n - sumX * sumY) -
        sumX2Y * (sumX3 * n - sumX * sumX2) +
        sumX2 * (sumX3 * sumY - sumXY * sumX2);
      const dc =
        sumX4 * (sumX2 * sumY - sumXY * sumX) -
        sumX3 * (sumX3 * sumY - sumXY * sumX2) +
        sumX2Y * (sumX3 * sumX - sumX2 * sumX2);

      quadA = da / dQuad;
      quadB = db / dQuad;
      quadC = dc / dQuad;
      hasQuad = true;

      let ssResQuad = 0;
      pts.forEach((p) => {
        const yPred = quadA * p.x * p.x + quadB * p.x + quadC;
        ssResQuad += Math.pow(p.y - yPred, 2);
      });
      r2Quad = ssTot > 1e-12 ? Math.max(0, 1 - ssResQuad / ssTot) : 1;
    }

    // Exponential fit: y = a * exp(b * x) -> ln(y) = ln(a) + b * x
    let expA = 0, expB = 0, r2Exp = 0, hasExp = false;
    const validExpPts = pts.filter((p) => p.y > 0);
    if (validExpPts.length >= 2) {
      const nExp = validExpPts.length;
      let sX = 0, sLnY = 0, sXLnY = 0, sX2 = 0;
      validExpPts.forEach((p) => {
        const lnY = Math.log(p.y);
        sX += p.x;
        sLnY += lnY;
        sXLnY += p.x * lnY;
        sX2 += p.x * p.x;
      });
      const denomExp = nExp * sX2 - sX * sX;
      if (Math.abs(denomExp) > 1e-12) {
        expB = (nExp * sXLnY - sX * sLnY) / denomExp;
        const lnA = (sLnY - expB * sX) / nExp;
        expA = Math.exp(lnA);
        hasExp = true;

        let ssResExp = 0;
        pts.forEach((p) => {
          const yPred = expA * Math.exp(expB * p.x);
          ssResExp += Math.pow(p.y - yPred, 2);
        });
        r2Exp = ssTot > 1e-12 ? Math.max(0, 1 - ssResExp / ssTot) : 1;
      }
    }

    return {
      points: pts,
      linear: {
        slope,
        intercept,
        rPearson,
        r2: r2Lin,
        formula: `y = ${slope.toFixed(4)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept).toFixed(4)}`,
        eval: (x: number) => slope * x + intercept,
      },
      quadratic: hasQuad
        ? {
            a: quadA,
            b: quadB,
            c: quadC,
            r2: r2Quad,
            formula: `y = ${quadA.toFixed(4)}x² ${quadB >= 0 ? '+' : '-'} ${Math.abs(quadB).toFixed(4)}x ${
              quadC >= 0 ? '+' : '-'
            } ${Math.abs(quadC).toFixed(4)}`,
            eval: (x: number) => quadA * x * x + quadB * x + quadC,
          }
        : null,
      exponential: hasExp
        ? {
            a: expA,
            b: expB,
            r2: r2Exp,
            formula: `y = ${expA.toFixed(4)} · e^(${expB.toFixed(4)}x)`,
            eval: (x: number) => expA * Math.exp(expB * x),
          }
        : null,
    };
  }, [scatterPoints]);

  // Detected Critical Points across Cartesian functions
  const criticalAnalysis = useMemo(() => {
    if (graphMode !== 'cartesian') return null;

    const roots: { fnId: string; color: string; x: number; y: number }[] = [];
    const extrema: { fnId: string; color: string; x: number; y: number; type: 'min' | 'max' }[] = [];
    const intersections: { fn1: string; fn2: string; x: number; y: number }[] = [];

    const activeFns = functions
      .map((f, idx) => ({ fn: f, compiled: compiledCartesianFns[idx] }))
      .filter((item) => item.fn.enabled && item.compiled !== null);

    if (activeFns.length === 0) return null;

    const steps = 300;
    const dx = (xMax - xMin) / steps;

    // Analyze individual active functions
    activeFns.forEach(({ fn, compiled }) => {
      let prevX = xMin;
      let prevY = evalCompiled(compiled, { x: prevX });

      for (let i = 1; i <= steps; i++) {
        const curX = xMin + i * dx;
        const curY = evalCompiled(compiled, { x: curX });

        if (prevY !== null && curY !== null) {
          // Zero / Root Crossing
          if (prevY * curY <= 0 && Math.abs(curY - prevY) < 10) {
            // Newton-Raphson or Bisection refine
            let rX = curX;
            let low = prevX, high = curX;
            for (let b = 0; b < 10; b++) {
              const mid = (low + high) / 2;
              const yMid = evalCompiled(compiled, { x: mid }) ?? 0;
              if (Math.abs(yMid) < 1e-6) {
                rX = mid;
                break;
              }
              if (yMid * (evalCompiled(compiled, { x: low }) ?? 0) <= 0) {
                high = mid;
              } else {
                low = mid;
              }
              rX = mid;
            }
            const rY = evalCompiled(compiled, { x: rX }) ?? 0;
            if (Math.abs(rY) < 0.1) {
              roots.push({ fnId: fn.expression || fn.id, color: fn.color, x: Math.round(rX * 1000) / 1000, y: 0 });
            }
          }

          // Extrema using derivative sign changes
          if (i > 1 && i < steps) {
            const nextX = curX + dx;
            const nextY = evalCompiled(compiled, { x: nextX });
            if (nextY !== null) {
              if (curY > prevY && curY > nextY && Math.abs(curY - prevY) < 15) {
                extrema.push({
                  fnId: fn.expression || fn.id,
                  color: fn.color,
                  x: Math.round(curX * 1000) / 1000,
                  y: Math.round(curY * 1000) / 1000,
                  type: 'max',
                });
              } else if (curY < prevY && curY < nextY && Math.abs(curY - prevY) < 15) {
                extrema.push({
                  fnId: fn.expression || fn.id,
                  color: fn.color,
                  x: Math.round(curX * 1000) / 1000,
                  y: Math.round(curY * 1000) / 1000,
                  type: 'min',
                });
              }
            }
          }
        }
        prevX = curX;
        prevY = curY;
      }
    });

    // Intersections between pairs of active functions
    if (activeFns.length >= 2) {
      for (let a = 0; a < activeFns.length; a++) {
        for (let b = a + 1; b < activeFns.length; b++) {
          const fnA = activeFns[a];
          const fnB = activeFns[b];

          let prevDiff: number | null = null;
          for (let i = 0; i <= steps; i++) {
            const x = xMin + i * dx;
            const yA = evalCompiled(fnA.compiled, { x });
            const yB = evalCompiled(fnB.compiled, { x });

            if (yA !== null && yB !== null) {
              const diff = yA - yB;
              if (prevDiff !== null && prevDiff * diff <= 0 && Math.abs(diff - prevDiff) < 10) {
                const ix = x;
                const iy = yA;
                intersections.push({
                  fn1: fnA.fn.expression || fnA.fn.id,
                  fn2: fnB.fn.expression || fnB.fn.id,
                  x: Math.round(ix * 1000) / 1000,
                  y: Math.round(iy * 1000) / 1000,
                });
              }
              prevDiff = diff;
            } else {
              prevDiff = null;
            }
          }
        }
      }
    }

    // Deduplicate close roots and extrema
    const uniqueRoots = roots.filter(
      (r, idx, arr) => arr.findIndex((t) => Math.abs(t.x - r.x) < 0.05 && t.fnId === r.fnId) === idx
    );
    const uniqueExtrema = extrema.filter(
      (e, idx, arr) => arr.findIndex((t) => Math.abs(t.x - e.x) < 0.05 && t.fnId === e.fnId) === idx
    );
    const uniqueIntersections = intersections.filter(
      (i, idx, arr) => arr.findIndex((t) => Math.abs(t.x - i.x) < 0.05) === idx
    );

    return {
      roots: uniqueRoots.slice(0, 10),
      extrema: uniqueExtrema.slice(0, 10),
      intersections: uniqueIntersections.slice(0, 8),
    };
  }, [graphMode, functions, compiledCartesianFns, xMin, xMax, evalCompiled]);

  // Numerical Area Computation for Shaded Region
  const computedAreaResult = useMemo(() => {
    if (!shadeArea || graphMode !== 'cartesian') return null;

    const startX = Math.min(shadeA, shadeB);
    const endX = Math.max(shadeA, shadeB);
    const nSteps = 200;
    const h = (endX - startX) / nSteps;

    const activeFns = functions
      .map((f, idx) => ({ fn: f, compiled: compiledCartesianFns[idx] }))
      .filter((item) => item.fn.enabled && item.compiled !== null);

    if (activeFns.length === 0) return null;

    if (shadeBetweenCurves && activeFns.length >= 2) {
      let sum = 0;
      for (let i = 0; i <= nSteps; i++) {
        const x = startX + i * h;
        const y1 = evalCompiled(activeFns[0].compiled, { x }) ?? 0;
        const y2 = evalCompiled(activeFns[1].compiled, { x }) ?? 0;
        const diff = Math.abs(y1 - y2);
        const weight = i === 0 || i === nSteps ? 1 : i % 2 === 1 ? 4 : 2;
        sum += weight * diff;
      }
      const area = (h / 3) * sum;
      return {
        type: 'between',
        label: `Area between ${activeFns[0].fn.expression} & ${activeFns[1].fn.expression}`,
        area: Math.abs(area),
      };
    } else {
      let sum = 0;
      for (let i = 0; i <= nSteps; i++) {
        const x = startX + i * h;
        const y = evalCompiled(activeFns[0].compiled, { x }) ?? 0;
        const weight = i === 0 || i === nSteps ? 1 : i % 2 === 1 ? 4 : 2;
        sum += weight * y;
      }
      const netIntegral = (h / 3) * sum;
      return {
        type: 'single',
        label: `∫ [${startX}, ${endX}] (${activeFns[0].fn.expression}) dx`,
        area: netIntegral,
      };
    }
  }, [shadeArea, shadeBetweenCurves, shadeA, shadeB, graphMode, functions, compiledCartesianFns, evalCompiled]);

  // Master Render Canvas Loop with High-DPI Support
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 450;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background Canvas
    ctx.fillStyle = isLight ? '#ffffff' : isOled ? '#000000' : '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    // ==========================================
    // 1. 3D SURFACE MODE
    // ==========================================
    if (graphMode === '3d') {
      const radA = (rotAlpha * Math.PI) / 180;
      const radB = (rotBeta * Math.PI) / 180;

      const cosA = Math.cos(radA), sinA = Math.sin(radA);
      const cosB = Math.cos(radB), sinB = Math.sin(radB);

      const project = (x: number, y: number, z: number) => {
        const xRot = x * cosA - y * sinA;
        const yRot = x * sinA + y * cosA;
        const zRot = z;

        const xFinal = xRot;
        const yFinal = yRot * cosB - zRot * sinB;

        const scale = Math.min(width, height) / 22;
        const screenX = width / 2 + xFinal * scale;
        const screenY = height / 2 - yFinal * scale;
        return { x: screenX, y: screenY, depth: yRot * sinB + zRot * cosB };
      };

      const gridSize = surfaceGridDensity === 'fine' ? 38 : surfaceGridDensity === 'medium' ? 28 : 20;
      const range = 6;
      const step = (2 * range) / gridSize;

      const gridPoints: { x: number; y: number; z: number; proj: { x: number; y: number; depth: number } }[][] = [];

      for (let i = 0; i <= gridSize; i++) {
        const row = [];
        const x = -range + i * step;
        for (let j = 0; j <= gridSize; j++) {
          const y = -range + j * step;
          const zVal = compiledSurfaceFn ? (evalCompiled(compiledSurfaceFn, { x, y }) ?? 0) : (evalExprFallback(surfaceExpr, { x, y }) ?? 0);
          const proj = project(x, y, zVal * 1.8);
          row.push({ x, y, z: zVal, proj });
        }
        gridPoints.push(row);
      }

      // Collect Quads and sort by depth for painters algorithm
      interface Quad {
        p1: { x: number; y: number };
        p2: { x: number; y: number };
        p3: { x: number; y: number };
        p4: { x: number; y: number };
        avgZ: number;
        avgDepth: number;
      }
      const quads: Quad[] = [];

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const pt1 = gridPoints[i][j];
          const pt2 = gridPoints[i + 1][j];
          const pt3 = gridPoints[i + 1][j + 1];
          const pt4 = gridPoints[i][j + 1];

          quads.push({
            p1: pt1.proj,
            p2: pt2.proj,
            p3: pt3.proj,
            p4: pt4.proj,
            avgZ: (pt1.z + pt2.z + pt3.z + pt4.z) / 4,
            avgDepth: (pt1.proj.depth + pt2.proj.depth + pt3.proj.depth + pt4.proj.depth) / 4,
          });
        }
      }

      // Sort by depth back-to-front
      quads.sort((a, b) => a.avgDepth - b.avgDepth);

      quads.forEach((q) => {
        const hue = Math.max(170, Math.min(340, 240 + q.avgZ * 50));
        ctx.fillStyle = `hsla(${hue}, 85%, ${isLight ? '55%' : '42%'}, 0.55)`;
        ctx.strokeStyle = `hsla(${hue}, 95%, ${isLight ? '40%' : '70%'}, 0.85)`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(q.p1.x, q.p1.y);
        ctx.lineTo(q.p2.x, q.p2.y);
        ctx.lineTo(q.p3.x, q.p3.y);
        ctx.lineTo(q.p4.x, q.p4.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // 3D Axis Legend
      ctx.font = '11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('3D Multivariable Surface: Drag anywhere on canvas to Orbit', 16, 24);
      ctx.restore();
      return;
    }

    // ==========================================
    // 2. 2D COORDINATE PROJECTIONS (Cartesian, Polar, Parametric, Regression)
    // ==========================================
    const toCanvasX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Background Cartesian Grid
    ctx.strokeStyle = isLight ? '#e2e8f0' : isOled ? '#18181b' : '#1e293b';
    ctx.lineWidth = 1;

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xStep = Math.pow(10, Math.floor(Math.log10(xRange / 6)));
    const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 6)));

    // Vertical grid lines
    const firstX = Math.ceil(xMin / xStep) * xStep;
    for (let x = firstX; x <= xMax; x += xStep) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      if (Math.abs(x) > 1e-6) {
        ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
        ctx.font = '10px monospace';
        const yAxisY = Math.max(14, Math.min(height - 6, toCanvasY(0) + 12));
        ctx.fillText(Number(x.toFixed(2)).toString(), cx + 2, yAxisY);
      }
    }

    // Horizontal grid lines
    const firstY = Math.ceil(yMin / yStep) * yStep;
    for (let y = firstY; y <= yMax; y += yStep) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      if (Math.abs(y) > 1e-6) {
        ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
        ctx.font = '10px monospace';
        const xAxisX = Math.max(4, Math.min(width - 32, toCanvasX(0) + 4));
        ctx.fillText(Number(y.toFixed(2)).toString(), xAxisX, cy - 2);
      }
    }

    // Primary Zero Axes
    ctx.strokeStyle = isLight ? '#64748b' : '#475569';
    ctx.lineWidth = 2;

    const zeroY = toCanvasY(0);
    if (zeroY >= 0 && zeroY <= height) {
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(width, zeroY);
      ctx.stroke();
    }

    const zeroX = toCanvasX(0);
    if (zeroX >= 0 && zeroX <= width) {
      ctx.beginPath();
      ctx.moveTo(zeroX, 0);
      ctx.lineTo(zeroX, height);
      ctx.stroke();
    }

    // ==========================================
    // 3. POLAR MODE
    // ==========================================
    if (graphMode === 'polar') {
      // Concentric Polar Rings
      const maxRadius = Math.max(Math.abs(xMax), Math.abs(xMin), Math.abs(yMax), Math.abs(yMin));
      const ringStep = Math.max(1, Math.round(maxRadius / 5));
      ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      for (let r = ringStep; r <= maxRadius; r += ringStep) {
        const rx = toCanvasX(r) - toCanvasX(0);
        ctx.beginPath();
        ctx.arc(toCanvasX(0), toCanvasY(0), Math.abs(rx), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radial angle rays (30, 45, 60, 90 deg)
      [Math.PI / 6, Math.PI / 4, Math.PI / 3, (2 * Math.PI) / 3, (3 * Math.PI) / 4, (5 * Math.PI) / 6].forEach((angle) => {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), toCanvasY(0));
        ctx.lineTo(toCanvasX(maxRadius * Math.cos(angle)), toCanvasY(maxRadius * Math.sin(angle)));
        ctx.moveTo(toCanvasX(0), toCanvasY(0));
        ctx.lineTo(toCanvasX(maxRadius * Math.cos(angle + Math.PI)), toCanvasY(maxRadius * Math.sin(angle + Math.PI)));
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Draw Polar Curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();

      const polarSteps = 600;
      const effectiveMaxTheta = isPolarAnimating ? thetaMax * polarAnimProgress : thetaMax;
      let isDrawing = false;

      for (let i = 0; i <= polarSteps; i++) {
        const theta = (i / polarSteps) * effectiveMaxTheta;
        const rVal = compiledPolarFn
          ? (evalCompiled(compiledPolarFn, { theta, θ: theta, t: theta, x: theta }) ?? 0)
          : (evalExprFallback(polarExpr, { theta }) ?? 0);

        if (rVal !== null && isFinite(rVal)) {
          const px = rVal * Math.cos(theta);
          const py = rVal * Math.sin(theta);
          const cx = toCanvasX(px);
          const cy = toCanvasY(py);

          if (!isDrawing) {
            ctx.moveTo(cx, cy);
            isDrawing = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        } else {
          isDrawing = false;
        }
      }
      ctx.stroke();

      // Sweeping trace particle if animated
      if (isPolarAnimating && polarAnimProgress < 1) {
        const curTheta = effectiveMaxTheta;
        const rCur = compiledPolarFn ? (evalCompiled(compiledPolarFn, { theta: curTheta }) ?? 0) : 0;
        const px = rCur * Math.cos(curTheta);
        const py = rCur * Math.sin(curTheta);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(toCanvasX(px), toCanvasY(py), 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ==========================================
    // 4. PARAMETRIC MODE
    // ==========================================
    if (graphMode === 'parametric') {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();

      const paramSteps = 600;
      let isDrawing = false;
      const effectiveTMax = isParamAnimating ? paramCurrentT : tMax;

      for (let i = 0; i <= paramSteps; i++) {
        const t = tMin + (i / paramSteps) * (effectiveTMax - tMin);
        const px = compiledParamX ? evalCompiled(compiledParamX, { t, x: t }) : evalExprFallback(paramX, { t });
        const py = compiledParamY ? evalCompiled(compiledParamY, { t, x: t }) : evalExprFallback(paramY, { t });

        if (px !== null && py !== null && isFinite(px) && isFinite(py)) {
          const cx = toCanvasX(px);
          const cy = toCanvasY(py);

          if (!isDrawing) {
            ctx.moveTo(cx, cy);
            isDrawing = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        } else {
          isDrawing = false;
        }
      }
      ctx.stroke();

      // Particle tracer if playing animation
      if (isParamAnimating) {
        const curX = compiledParamX ? (evalCompiled(compiledParamX, { t: paramCurrentT }) ?? 0) : 0;
        const curY = compiledParamY ? (evalCompiled(compiledParamY, { t: paramCurrentT }) ?? 0) : 0;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(toCanvasX(curX), toCanvasY(curY), 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // ==========================================
    // 5. REGRESSION MODE
    // ==========================================
    if (graphMode === 'regression' && regressionResults) {
      // Draw Scatter Points
      regressionResults.points.forEach((p) => {
        const cx = toCanvasX(p.x);
        const cy = toCanvasY(p.y);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw Selected Regression Trendline
      const activeModel =
        regressionModelType === 'quadratic' && regressionResults.quadratic
          ? regressionResults.quadratic
          : regressionModelType === 'exponential' && regressionResults.exponential
            ? regressionResults.exponential
            : regressionResults.linear;

      if (activeModel) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const samples = 200;
        let isDrawing = false;
        for (let i = 0; i <= samples; i++) {
          const xVal = xMin + (i / samples) * (xMax - xMin);
          const yVal = activeModel.eval(xVal);

          if (isFinite(yVal) && yVal >= yMin - 100 && yVal <= yMax + 100) {
            const cx = toCanvasX(xVal);
            const cy = toCanvasY(yVal);
            if (!isDrawing) {
              ctx.moveTo(cx, cy);
              isDrawing = true;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            isDrawing = false;
          }
        }
        ctx.stroke();
      }
    }

    // ==========================================
    // 6. CARTESIAN MODE
    // ==========================================
    if (graphMode === 'cartesian') {
      const samples = Math.min(width, MAX_GRAPH_SAMPLES);
      const step = (xMax - xMin) / samples;

      // Area Shading
      if (shadeArea && functions.length > 0) {
        const activeFns = functions
          .map((f, idx) => ({ fn: f, compiled: compiledCartesianFns[idx] }))
          .filter((item) => item.fn.enabled && item.compiled !== null);

        const startX = Math.min(shadeA, shadeB);
        const endX = Math.max(shadeA, shadeB);

        if (shadeBetweenCurves && activeFns.length >= 2) {
          // Shading between function 1 and function 2
          ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
          ctx.beginPath();
          ctx.moveTo(toCanvasX(startX), toCanvasY(evalCompiled(activeFns[0].compiled, { x: startX }) ?? 0));

          for (let x = startX; x <= endX; x += step) {
            const y = evalCompiled(activeFns[0].compiled, { x }) ?? 0;
            ctx.lineTo(toCanvasX(x), toCanvasY(y));
          }
          for (let x = endX; x >= startX; x -= step) {
            const y = evalCompiled(activeFns[1].compiled, { x }) ?? 0;
            ctx.lineTo(toCanvasX(x), toCanvasY(y));
          }
          ctx.closePath();
          ctx.fill();
        } else if (activeFns.length >= 1) {
          // Single function integral shading to x-axis
          ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
          ctx.beginPath();
          ctx.moveTo(toCanvasX(startX), toCanvasY(0));

          for (let x = startX; x <= endX; x += step) {
            const y = evalCompiled(activeFns[0].compiled, { x }) ?? 0;
            ctx.lineTo(toCanvasX(x), toCanvasY(y));
          }
          ctx.lineTo(toCanvasX(endX), toCanvasY(0));
          ctx.closePath();
          ctx.fill();
        }
      }

      // Plot All Active Cartesian Curves
      functions.forEach((fn, idx) => {
        if (!fn.enabled || !fn.expression.trim()) return;
        const compiled = compiledCartesianFns[idx];

        ctx.strokeStyle = fn.color;
        ctx.lineWidth = 2.8;
        ctx.beginPath();

        let isDrawing = false;
        let lastY: number | null = null;

        for (let i = 0; i <= samples; i++) {
          const xVal = xMin + i * step;
          const yVal = compiled ? evalCompiled(compiled, { x: xVal }) : evalExprFallback(fn.expression, { x: xVal });

          // Asymptote jump suppression: if yVal explodes or jumps across poles, lift the pen
          const isJump = lastY !== null && yVal !== null && Math.abs(yVal - lastY) > (yMax - yMin) * 0.8;

          if (yVal !== null && isFinite(yVal) && yVal >= yMin - 100 && yVal <= yMax + 100 && !isJump) {
            const cx = toCanvasX(xVal);
            const cy = toCanvasY(yVal);
            if (!isDrawing) {
              ctx.moveTo(cx, cy);
              isDrawing = true;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            isDrawing = false;
          }
          lastY = yVal;
        }
        ctx.stroke();

        // Optional Numerical Derivative Curve Overlay y' = d/dx f(x)
        if (fn.showDerivative && compiled) {
          ctx.strokeStyle = fn.color;
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.8;
          ctx.beginPath();

          let isDerivDrawing = false;
          const hDeriv = 1e-4;

          for (let i = 0; i <= samples; i += 2) {
            const xVal = xMin + i * step;
            const yp = evalCompiled(compiled, { x: xVal + hDeriv });
            const ym = evalCompiled(compiled, { x: xVal - hDeriv });

            if (yp !== null && ym !== null) {
              const dy = (yp - ym) / (2 * hDeriv);
              if (isFinite(dy) && dy >= yMin - 50 && dy <= yMax + 50) {
                const cx = toCanvasX(xVal);
                const cy = toCanvasY(dy);
                if (!isDerivDrawing) {
                  ctx.moveTo(cx, cy);
                  isDerivDrawing = true;
                } else {
                  ctx.lineTo(cx, cy);
                }
              } else {
                isDerivDrawing = false;
              }
            } else {
              isDerivDrawing = false;
            }
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Render Detected Critical Points (Roots & Extrema)
      if (showExtremaRoots && criticalAnalysis) {
        // Roots (Emerald)
        criticalAnalysis.roots.forEach((r) => {
          const rx = toCanvasX(r.x);
          const ry = toCanvasY(0);
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(rx, ry, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        // Extrema (Amber)
        criticalAnalysis.extrema.forEach((e) => {
          const ex = toCanvasX(e.x);
          const ey = toCanvasY(e.y);
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(ex, ey, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }

      // Render Detected Intersections (Purple)
      if (showIntersections && criticalAnalysis && criticalAnalysis.intersections.length > 0) {
        criticalAnalysis.intersections.forEach((intr) => {
          const ix = toCanvasX(intr.x);
          const iy = toCanvasY(intr.y);
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(ix, iy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }

      // Live Tangent Line at Cursor for primary function
      if (showTangentAtCursor && hoverCoords && functions.length > 0 && functions[0].enabled) {
        const compiled = compiledCartesianFns[0];
        const x0 = hoverCoords.x;
        const y0 = compiled ? evalCompiled(compiled, { x: x0 }) : evalExprFallback(functions[0].expression, { x: x0 });

        if (y0 !== null && isFinite(y0)) {
          const h = 1e-4;
          const yp = compiled ? evalCompiled(compiled, { x: x0 + h }) : evalExprFallback(functions[0].expression, { x: x0 + h });
          const ym = compiled ? evalCompiled(compiled, { x: x0 - h }) : evalExprFallback(functions[0].expression, { x: x0 - h });

          if (yp !== null && ym !== null) {
            const slope = (yp - ym) / (2 * h);
            const tSpan = (xMax - xMin) * 0.2;
            const tX1 = x0 - tSpan;
            const tY1 = y0 + slope * (tX1 - x0);
            const tX2 = x0 + tSpan;
            const tY2 = y0 + slope * (tX2 - x0);

            ctx.strokeStyle = '#f43f5e';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(toCanvasX(tX1), toCanvasY(tY1));
            ctx.lineTo(toCanvasX(tX2), toCanvasY(tY2));
            ctx.stroke();
            ctx.setLineDash([]);

            // Tracer point
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(toCanvasX(x0), toCanvasY(y0), 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }, [
    graphMode,
    functions,
    compiledCartesianFns,
    xMin,
    xMax,
    yMin,
    yMax,
    shadeArea,
    shadeBetweenCurves,
    shadeA,
    shadeB,
    showExtremaRoots,
    showIntersections,
    showTangentAtCursor,
    hoverCoords,
    polarExpr,
    compiledPolarFn,
    thetaMax,
    isPolarAnimating,
    polarAnimProgress,
    paramX,
    paramY,
    compiledParamX,
    compiledParamY,
    tMin,
    tMax,
    isParamAnimating,
    paramCurrentT,
    surfaceExpr,
    compiledSurfaceFn,
    rotAlpha,
    rotBeta,
    surfaceGridDensity,
    regressionResults,
    regressionModelType,
    criticalAnalysis,
    evalCompiled,
    evalExprFallback,
    isLight,
    isOled,
  ]);

  // Request Animation Frame loop for continuous animation (3D auto-orbit, polar sweep, parametric trace)
  useEffect(() => {
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (graphMode === '3d' && is3DAutoRotating) {
        setRotAlpha((prev) => (prev + dt * 25) % 360);
      }

      if (graphMode === 'polar' && isPolarAnimating) {
        setPolarAnimProgress((prev) => {
          const next = prev + dt * 0.4;
          if (next >= 1) {
            setIsPolarAnimating(false);
            return 1;
          }
          return next;
        });
      }

      if (graphMode === 'parametric' && isParamAnimating) {
        setParamCurrentT((prev) => {
          const range = tMax - tMin;
          const next = prev + dt * (range / 4);
          if (next >= tMax) {
            return tMin;
          }
          return next;
        });
      }

      drawGraph();
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawGraph, graphMode, is3DAutoRotating, isPolarAnimating, isParamAnimating, tMin, tMax]);

  // Mouse & Touch Pan / Orbit Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (graphMode === '3d') {
      setIsDragging3D(true);
      setDragStart({ x: cx, y: cy });
    } else {
      setIsPanning2D(true);
      setPanStart({
        x: cx,
        y: cy,
        xMin,
        xMax,
        yMin,
        yMax,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (graphMode === '3d' && isDragging3D) {
      const deltaX = cx - dragStart.x;
      const deltaY = cy - dragStart.y;
      setRotAlpha((prev) => prev + deltaX * 0.6);
      setRotBeta((prev) => Math.max(5, Math.min(85, prev + deltaY * 0.6)));
      setDragStart({ x: cx, y: cy });
      return;
    }

    if (isPanning2D) {
      const dxPixels = cx - panStart.x;
      const dyPixels = cy - panStart.y;
      const xSpan = panStart.xMax - panStart.xMin;
      const ySpan = panStart.yMax - panStart.yMin;

      const dxUnits = (dxPixels / rect.width) * xSpan;
      const dyUnits = (dyPixels / rect.height) * ySpan;

      setXMin(panStart.xMin - dxUnits);
      setXMax(panStart.xMax - dxUnits);
      setYMin(panStart.yMin + dyUnits);
      setYMax(panStart.yMax + dyUnits);
      return;
    }

    // Coordinate hover readout
    const xVal = xMin + (cx / rect.width) * (xMax - xMin);
    const yVal = yMax - (cy / rect.height) * (yMax - yMin);

    setHoverCoords({
      x: Math.round(xVal * 100) / 100,
      y: Math.round(yVal * 100) / 100,
    });

    // Check snapping to active curve
    if (graphMode === 'cartesian' && functions.length > 0 && functions[0].enabled) {
      const compiled = compiledCartesianFns[0];
      const fnY = compiled ? evalCompiled(compiled, { x: xVal }) : null;
      if (fnY !== null && Math.abs(fnY - yVal) < (yMax - yMin) * 0.1) {
        const h = 1e-4;
        const yp = evalCompiled(compiled, { x: xVal + h }) ?? 0;
        const ym = evalCompiled(compiled, { x: xVal - h }) ?? 0;
        const slope = (yp - ym) / (2 * h);
        setSnappedPoint({
          x: Math.round(xVal * 100) / 100,
          y: Math.round(fnY * 100) / 100,
          fnId: functions[0].expression || functions[0].id,
          slope: Math.round(slope * 1000) / 1000,
        });
      } else {
        setSnappedPoint(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging3D(false);
    setIsPanning2D(false);
  };

  // Scroll Wheel Zoom centered at cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || graphMode === '3d') return;

    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const mouseX = xMin + (cx / rect.width) * (xMax - xMin);
    const mouseY = yMax - (cy / rect.height) * (yMax - yMin);

    const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;

    setXMin(mouseX - (mouseX - xMin) * zoomFactor);
    setXMax(mouseX + (xMax - mouseX) * zoomFactor);
    setYMin(mouseY - (mouseY - yMin) * zoomFactor);
    setYMax(mouseY + (yMax - mouseY) * zoomFactor);
  };

  const handleZoom = (factor: number) => {
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const xSpan = ((xMax - xMin) / 2) * factor;
    const ySpan = ((yMax - yMin) / 2) * factor;

    setXMin(xCenter - xSpan);
    setXMax(xCenter + xSpan);
    setYMin(yCenter - ySpan);
    setYMax(yCenter + ySpan);
  };

  const resetView = () => {
    setXMin(-10);
    setXMax(10);
    setYMin(-10);
    setYMax(10);
    setRotAlpha(35);
    setRotBeta(45);
    setIs3DAutoRotating(false);
    setIsPolarAnimating(false);
    setPolarAnimProgress(1);
    setIsParamAnimating(false);
  };

  const downloadGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `omnicalc-${graphMode}-plot.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToast(label);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  // Table Data generator with customizable range and step
  const tableRowsData = useMemo(() => {
    const rows = [];
    const count = 15;
    for (let i = 0; i < count; i++) {
      const xv = tableStart + i * tableStep;
      rows.push(xv);
    }
    return rows;
  }, [tableStart, tableStep]);

  return (
    <div className="max-w-5xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'cartesian', label: '2D Cartesian (y = f(x))', icon: <Layers className="w-4 h-4 flex-shrink-0" /> },
          { id: '3d', label: '3D Surface (z = f(x, y))', icon: <Box className="w-4 h-4 flex-shrink-0" /> },
          { id: 'polar', label: 'Polar Curves (r = f(θ))', icon: <Compass className="w-4 h-4 flex-shrink-0" /> },
          { id: 'parametric', label: 'Parametric (x(t), y(t))', icon: <Sparkles className="w-4 h-4 flex-shrink-0" /> },
          { id: 'regression', label: 'Data Scatter & Regression', icon: <TrendingUp className="w-4 h-4 flex-shrink-0" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setGraphMode(tab.id as any);
              setIsPolarAnimating(false);
              setIsParamAnimating(false);
            }}
            className={`
              px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm flex items-center gap-2 flex-shrink-0
              ${
                graphMode === tab.id
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Equations Builder Controls per Mode */}
      <div className={`${cardBg} border rounded-3xl p-5 flex flex-col gap-4`}>
        {/* ========================================== */}
        {/* 1. 2D CARTESIAN CONTROLS */}
        {/* ========================================== */}
        {graphMode === 'cartesian' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Cartesian Functions y = f(x)</h3>
                <p className="text-xs text-slate-400">Add multiple functions, derivative overlays, roots & critical points</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={addFunction}
                  disabled={functions.length >= 6}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50 flex-shrink-0 shadow-md shadow-sky-600/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Function
                </button>
              </div>
            </div>

            {/* Presets Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-slate-400 font-bold px-1 whitespace-nowrap flex-shrink-0">Presets:</span>
              {CARTESIAN_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    const newFns: FunctionItem[] = p.exprs.map((expr, idx) => ({
                      id: 'f' + (idx + 1),
                      expression: expr,
                      color: COLORS[idx % COLORS.length],
                      enabled: true,
                      showDerivative: false,
                    }));
                    setFunctions(newFns);
                  }}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/60 font-semibold whitespace-nowrap flex-shrink-0 transition-all text-xs"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Function inputs list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {functions.map((fn, idx) => (
                <div
                  key={fn.id}
                  className={`flex flex-col gap-2 ${subCardBg} p-3 rounded-2xl border`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateFunction(fn.id, { enabled: !fn.enabled })}
                      className="text-slate-400 hover:text-white"
                      title={fn.enabled ? 'Disable Curve' : 'Enable Curve'}
                    >
                      {fn.enabled ? <Eye className="w-4 h-4 text-sky-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                    </button>
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: fn.color }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-400">y{idx + 1} =</span>
                    <input
                      type="text"
                      value={fn.expression}
                      onChange={(e) => updateFunction(fn.id, { expression: e.target.value })}
                      placeholder="e.g. sin(x), x^2 - 4"
                      className={`flex-1 ${inputBg} rounded-xl px-2.5 py-1.5 text-sm font-mono focus:outline-none`}
                    />
                    {functions.length > 1 && (
                      <button
                        onClick={() => removeFunction(fn.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Remove Function"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!fn.showDerivative}
                        onChange={(e) => updateFunction(fn.id, { showDerivative: e.target.checked })}
                        className="rounded accent-sky-500"
                      />
                      <span>Show Derivative y'</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Analysis Toggles & Area Settings */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showExtremaRoots}
                  onChange={(e) => setShowExtremaRoots(e.target.checked)}
                  className="accent-emerald-500 rounded"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Roots & Extrema
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showIntersections}
                  onChange={(e) => setShowIntersections(e.target.checked)}
                  className="accent-purple-500 rounded"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> Intersections
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTangentAtCursor}
                  onChange={(e) => setShowTangentAtCursor(e.target.checked)}
                  className="accent-rose-500 rounded"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Live Cursor Tangent
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shadeArea}
                  onChange={(e) => setShadeArea(e.target.checked)}
                  className="accent-sky-500 rounded"
                />
                <span>Shade Definite Integral:</span>
              </label>

              {shadeArea && (
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span>[</span>
                  <input
                    type="number"
                    value={shadeA}
                    onChange={(e) => setShadeA(parseFloat(e.target.value) || 0)}
                    className={`w-14 ${inputBg} rounded-lg p-1 text-center`}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    value={shadeB}
                    onChange={(e) => setShadeB(parseFloat(e.target.value) || 0)}
                    className={`w-14 ${inputBg} rounded-lg p-1 text-center`}
                  />
                  <span>]</span>

                  {functions.length >= 2 && (
                    <label className="flex items-center gap-1.5 ml-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shadeBetweenCurves}
                        onChange={(e) => setShadeBetweenCurves(e.target.checked)}
                        className="accent-purple-500 rounded"
                      />
                      <span>Between y1 & y2</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Computed Integral Value Badge */}
            {computedAreaResult && (
              <div className="flex items-center justify-between bg-sky-950/40 border border-sky-800/60 p-3 rounded-2xl text-xs text-sky-200">
                <span className="font-semibold">{computedAreaResult.label}</span>
                <span className="font-mono font-bold text-sm text-sky-300">
                  Value ≈ {computedAreaResult.area.toFixed(5)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* 2. 3D SURFACE CONTROLS */}
        {/* ========================================== */}
        {graphMode === '3d' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100">3D Multivariable Surface Plotter</h3>
                <p className="text-xs text-slate-400">Plot z = f(x, y) with depth-sorted shading & 360° interactive orbit</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIs3DAutoRotating(!is3DAutoRotating)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                    is3DAutoRotating
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {is3DAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {is3DAutoRotating ? 'Pause Orbit' : 'Auto Orbit'}
                </button>
              </div>
            </div>

            {/* 3D Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-slate-400 font-bold px-1 whitespace-nowrap flex-shrink-0">Presets:</span>
              {SURFACE_3D_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setSurfaceExpr(p.expr)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 whitespace-nowrap flex-shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-mono font-bold text-sky-400">z = f(x, y) =</span>
              <input
                type="text"
                value={surfaceExpr}
                onChange={(e) => setSurfaceExpr(e.target.value)}
                className={`flex-1 min-w-[200px] ${inputBg} rounded-2xl p-3 font-mono text-sm font-bold focus:outline-none`}
              />

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                <span className="text-slate-400 px-1 font-semibold">Mesh:</span>
                {(['coarse', 'medium', 'fine'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => setSurfaceGridDensity(density)}
                    className={`px-2 py-1 rounded-lg capitalize font-semibold ${
                      surfaceGridDensity === density ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 3. POLAR CONTROLS */}
        {/* ========================================== */}
        {graphMode === 'polar' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Polar Coordinate Curves</h3>
                <p className="text-xs text-slate-400">Plot r = f(θ) with polar rings & animated angular sweep</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPolarAnimating(true);
                    setPolarAnimProgress(0);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20"
                >
                  <Play className="w-3.5 h-3.5" /> Sweep Animation
                </button>
              </div>
            </div>

            {/* Polar Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-slate-400 font-bold px-1 whitespace-nowrap flex-shrink-0">Presets:</span>
              {POLAR_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setPolarExpr(p.expr);
                    setThetaMax(p.thetaMax);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 whitespace-nowrap flex-shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              <div className="sm:col-span-3 flex gap-2 items-center">
                <span className="text-xs font-mono font-bold text-sky-400">r(θ) =</span>
                <input
                  type="text"
                  value={polarExpr}
                  onChange={(e) => setPolarExpr(e.target.value)}
                  className={`flex-1 ${inputBg} rounded-2xl p-3 font-mono text-sm font-bold focus:outline-none`}
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-slate-400 whitespace-nowrap">θ Max:</span>
                <input
                  type="number"
                  value={thetaMax}
                  onChange={(e) => setThetaMax(parseFloat(e.target.value) || 6.28)}
                  className={`w-full ${inputBg} rounded-2xl p-3 font-mono text-sm font-bold`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 4. PARAMETRIC CONTROLS */}
        {/* ========================================== */}
        {graphMode === 'parametric' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Parametric Curve System</h3>
                <p className="text-xs text-slate-400">Define system (x(t), y(t)) over parameter interval t with live particle tracer</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsParamAnimating(!isParamAnimating)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                    isParamAnimating
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isParamAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isParamAnimating ? 'Pause Tracer' : 'Play Tracer'}
                </button>
              </div>
            </div>

            {/* Parametric Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-slate-400 font-bold px-1 whitespace-nowrap flex-shrink-0">Presets:</span>
              {PARAMETRIC_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setParamX(p.x);
                    setParamY(p.y);
                    setTMin(p.tMin);
                    setTMax(p.tMax);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 whitespace-nowrap flex-shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sky-400">x(t) =</span>
                <input
                  type="text"
                  value={paramX}
                  onChange={(e) => setParamX(e.target.value)}
                  className={`flex-1 ${inputBg} rounded-2xl p-3 font-mono text-sm font-bold`}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-400">y(t) =</span>
                <input
                  type="text"
                  value={paramY}
                  onChange={(e) => setParamY(e.target.value)}
                  className={`flex-1 ${inputBg} rounded-2xl p-3 font-mono text-sm font-bold`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>t_min:</span>
                <input
                  type="number"
                  value={tMin}
                  onChange={(e) => setTMin(parseFloat(e.target.value) || 0)}
                  className={`w-20 ${inputBg} rounded-xl px-2 py-1 text-center font-bold`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>t_max:</span>
                <input
                  type="number"
                  value={tMax}
                  onChange={(e) => setTMax(parseFloat(e.target.value) || 6.2831853)}
                  className={`w-24 ${inputBg} rounded-xl px-2 py-1 text-center font-bold`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 5. DATA REGRESSION CONTROLS */}
        {/* ========================================== */}
        {graphMode === 'regression' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Scatter Points & Curve Fitting</h3>
                <p className="text-xs text-slate-400">Least-squares regression with Pearson correlation & R² goodness of fit</p>
              </div>

              {/* Model Type Selector */}
              <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 gap-1 text-xs">
                <span className="text-slate-400 px-2 font-semibold">Model:</span>
                {(['linear', 'quadratic', 'exponential'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setRegressionModelType(m)}
                    className={`px-3 py-1.5 rounded-xl capitalize font-bold transition-all ${
                      regressionModelType === m
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Regression Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-slate-400 font-bold px-1 whitespace-nowrap flex-shrink-0">Datasets:</span>
              {REGRESSION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setScatterPoints(p.points)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 whitespace-nowrap flex-shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Data Points (x, y per line)</label>
                <textarea
                  rows={5}
                  value={scatterPoints}
                  onChange={(e) => setScatterPoints(e.target.value)}
                  className={`w-full ${inputBg} rounded-2xl p-3 font-mono text-xs font-bold focus:outline-none`}
                />
              </div>

              {regressionResults && (
                <div className="md:col-span-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-center gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {regressionModelType} Best-Fit Model
                    </span>
                    <button
                      onClick={() => {
                        const formula =
                          regressionModelType === 'quadratic'
                            ? regressionResults.quadratic?.formula
                            : regressionModelType === 'exponential'
                              ? regressionResults.exponential?.formula
                              : regressionResults.linear.formula;
                        if (formula) copyToClipboard(formula, 'Regression Equation Copied!');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy Equation
                    </button>
                  </div>

                  <div className="text-xl font-mono font-bold text-emerald-400">
                    {regressionModelType === 'quadratic'
                      ? regressionResults.quadratic?.formula ?? 'Need ≥ 3 points'
                      : regressionModelType === 'exponential'
                        ? regressionResults.exponential?.formula ?? 'Need y > 0 points'
                        : regressionResults.linear.formula}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">R² Score:</span>
                      <strong className="text-sky-400">
                        {(
                          (regressionModelType === 'quadratic'
                            ? regressionResults.quadratic?.r2
                            : regressionModelType === 'exponential'
                              ? regressionResults.exponential?.r2
                              : regressionResults.linear.r2) ?? 0
                        ).toFixed(4)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Pearson r:</span>
                      <strong>{regressionResults.linear.rPearson.toFixed(4)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Data Count:</span>
                      <strong>{regressionResults.points.length} pts</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fit Quality:</span>
                      <strong className="text-emerald-400">
                        {((regressionModelType === 'quadratic'
                          ? regressionResults.quadratic?.r2
                          : regressionModelType === 'exponential'
                            ? regressionResults.exponential?.r2
                            : regressionResults.linear.r2) ?? 0) > 0.95
                          ? 'Excellent'
                          : 'Moderate'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Display Card */}
      <div className={`${cardBg} border rounded-3xl p-4 flex flex-col gap-3 relative`}>
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleZoom(0.8)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 shadow-sm flex-shrink-0"
              title="Zoom In (or Scroll Wheel on Canvas)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(1.25)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 shadow-sm flex-shrink-0"
              title="Zoom Out (or Scroll Wheel on Canvas)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 shadow-sm flex-shrink-0"
              title="Reset View Bounds & Pan"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTable(!showTable)}
              className={`p-2 rounded-xl border transition-all shadow-sm flex-shrink-0 ${
                showTable ? 'bg-sky-600 text-white border-sky-500' : 'bg-slate-800 text-slate-200 border-slate-700'
              }`}
              title="Toggle Evaluation Table"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={downloadGraph}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 shadow-sm flex-shrink-0"
              title="Download High-Res PNG Plot"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const tableHeaders = ['x', ...functions.filter((f) => f.enabled).map((f) => `y = ${f.expression}`)];
                const tableRows = tableRowsData.map((xv) => [
                  xv.toFixed(2),
                  ...functions
                    .filter((f) => f.enabled)
                    .map((f, idx) => {
                      const compiled = compiledCartesianFns[idx];
                      const yv = compiled ? evalCompiled(compiled, { x: xv }) : evalExprFallback(f.expression, { x: xv });
                      return yv !== null ? yv.toFixed(4) : 'undefined';
                    }),
                ]);

                setExportData({
                  title: `Interactive Graph Analysis (${graphMode.toUpperCase()})`,
                  engine: 'Advanced Graphing & Calculus Suite',
                  timestamp: Date.now(),
                  inputDescription:
                    graphMode === 'cartesian'
                      ? functions.filter((f) => f.enabled).map((f) => `y = ${f.expression}`).join('; ')
                      : graphMode === '3d'
                        ? `z = ${surfaceExpr}`
                        : graphMode === 'polar'
                          ? `r = ${polarExpr}`
                          : `Parametric: x=${paramX}, y=${paramY}`,
                  resultSummary: `Plotted across domain [${xMin.toFixed(2)}, ${xMax.toFixed(2)}]`,
                  tableHeaders,
                  tableRows,
                  metadata: {
                    'Graph Mode': graphMode,
                    'X-Domain': `[${xMin.toFixed(2)}, ${xMax.toFixed(2)}]`,
                    'Y-Range': `[${yMin.toFixed(2)}, ${yMax.toFixed(2)}]`,
                    ...(computedAreaResult ? { 'Integral Area': computedAreaResult.area.toFixed(5) } : {}),
                  },
                });
              }}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Export Report & Table
            </button>
          </div>

          {/* Bound Inputs for 2D */}
          {graphMode !== '3d' && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="font-semibold text-slate-300">X:</span>
              <input
                type="number"
                value={Number(xMin.toFixed(2))}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setXMin(v);
                }}
                className={`w-16 ${inputBg} rounded-lg px-1.5 py-0.5 text-center text-xs font-bold`}
              />
              <span>to</span>
              <input
                type="number"
                value={Number(xMax.toFixed(2))}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setXMax(v);
                }}
                className={`w-16 ${inputBg} rounded-lg px-1.5 py-0.5 text-center text-xs font-bold`}
              />
            </div>
          )}

          {/* Cursor Coordinates Readout & Snap Badge */}
          {hoverCoords && graphMode !== '3d' && (
            <div className="flex items-center gap-2 text-xs font-mono font-semibold">
              <div className="bg-slate-800 text-sky-400 border border-slate-700 px-2.5 py-1 rounded-xl">
                (X: {hoverCoords.x}, Y: {hoverCoords.y})
              </div>
              {snappedPoint && (
                <div className="bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-xl">
                  f({snappedPoint.x}) = {snappedPoint.y} (m = {snappedPoint.slope})
                </div>
              )}
            </div>
          )}
        </div>

        {/* Canvas Element with Pan & Zoom Gestures */}
        <div className="relative w-full aspect-[16/9] max-h-[480px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Interactive Graphing Display"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setHoverCoords(null);
              setSnappedPoint(null);
              setIsDragging3D(false);
              setIsPanning2D(false);
            }}
            onWheel={handleWheel}
            className={`w-full h-full block ${isPanning2D || isDragging3D ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          />

          {/* Canvas Interactive Overlay Prompt */}
          <div className="absolute bottom-3 left-3 pointer-events-none bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span>🖱️ Drag to Pan · Scroll to Zoom</span>
          </div>
        </div>
      </div>

      {/* Critical Points & Roots Analysis Card (Cartesian) */}
      {graphMode === 'cartesian' && criticalAnalysis && (
        <div className={`${cardBg} border rounded-3xl p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-sky-400" />
              Detected Critical Points & Geometric Features
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Roots */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Roots (x-intercepts)
              </div>
              {criticalAnalysis.roots.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No roots found in domain</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {criticalAnalysis.roots.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-mono"
                    >
                      x = {r.x}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Extrema */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Local Extrema (Peaks/Valleys)
              </div>
              {criticalAnalysis.extrema.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No local extrema in domain</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {criticalAnalysis.extrema.map((e, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-mono"
                    >
                      {e.type === 'max' ? 'Max' : 'Min'} ({e.x}, {e.y})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Intersections */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Curve Intersections
              </div>
              {criticalAnalysis.intersections.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No curve intersections</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {criticalAnalysis.intersections.map((intr, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-mono"
                    >
                      ({intr.x}, {intr.y})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Values Evaluation Table */}
      {showTable && graphMode === 'cartesian' && (
        <div className={`${cardBg} border rounded-3xl p-5 overflow-x-auto flex flex-col gap-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-100">Function Evaluation Table</h4>

            {/* Step Controls */}
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Start X:</span>
                <input
                  type="number"
                  value={tableStart}
                  onChange={(e) => setTableStart(parseFloat(e.target.value) || 0)}
                  className={`w-16 ${inputBg} rounded-lg p-1 text-center font-bold`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>Step Δx:</span>
                <input
                  type="number"
                  value={tableStep}
                  step={0.1}
                  onChange={(e) => setTableStep(Math.max(0.01, parseFloat(e.target.value) || 1))}
                  className={`w-16 ${inputBg} rounded-lg p-1 text-center font-bold`}
                />
              </div>
            </div>
          </div>

          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2 text-left">x</th>
                {functions.map((fn, idx) => (
                  <th key={fn.id} className="p-2 text-left" style={{ color: fn.color }}>
                    y{idx + 1} = {fn.expression || fn.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRowsData.map((xv) => (
                <tr key={xv} className="border-b border-slate-800/40 hover:bg-slate-800/40 text-slate-300">
                  <td className="p-2 font-bold text-slate-100">{xv.toFixed(2)}</td>
                  {functions.map((fn, idx) => {
                    const compiled = compiledCartesianFns[idx];
                    const yv = fn.expression
                      ? compiled
                        ? evalCompiled(compiled, { x: xv })
                        : evalExprFallback(fn.expression, { x: xv })
                      : null;
                    return (
                      <td key={fn.id} className="p-2">
                        {yv !== null && isFinite(yv) ? yv.toFixed(4) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Copy Toast */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-500 text-xs font-bold flex items-center gap-2 animate-fade-in z-50">
          <CheckCircle2 className="w-4 h-4" />
          {copiedToast}
        </div>
      )}

      {/* Export Modal */}
      {exportData && (
        <ExportModal
          isOpen={!!exportData}
          onClose={() => setExportData(null)}
          data={exportData}
          settings={settings}
        />
      )}
    </div>
  );
};
