import React, { useState, useMemo } from 'react';
import { TrendingUp, Target, Maximize, Minimize, Activity, Layers, Calculator } from 'lucide-react';
import { GraphExpression, GraphViewport, Point2D } from '../../types';
import { CompiledSafeExpression } from '../../utils/calculator';
import {
  findRoots,
  findExtrema,
  findIntersections,
  calculateTangentLine,
  calculateNormalLine,
  calculateDefiniteIntegral,
  generateIntegralPolygons,
  calculateParametricArcLength,
  calculatePolarArcLength,
  calculatePolarArea,
} from '../../utils/graphAnalysis';

export interface GraphAnalysisPanelProps {
  activeExpression: GraphExpression | null;
  allExpressions: GraphExpression[];
  compiledMap: Map<string, CompiledSafeExpression>;
  compiledParametricYMap?: Map<string, CompiledSafeExpression>;
  viewport: GraphViewport;
  sliderScope: Record<string, number>;
  onSelectPoint: (pt: Point2D) => void;
  onSendToCalculus?: (expression: string) => void;
  onSetTangentLine: (line: { x0: number; y0: number; slope: number } | null) => void;
  onSetNormalLine: (
    line: { x0: number; y0: number; slope: number | null; isVertical: boolean } | null
  ) => void;
  onSetIntegralPolygon: (
    polygon: Point2D[] | null,
    label?: string | null,
    polygons?: Point2D[][] | null
  ) => void;
  theme: 'dark' | 'light' | 'oled';
}

export const GraphAnalysisPanel: React.FC<GraphAnalysisPanelProps> = ({
  activeExpression,
  allExpressions,
  compiledMap,
  compiledParametricYMap,
  viewport,
  sliderScope,
  onSelectPoint,
  onSendToCalculus,
  onSetTangentLine,
  onSetNormalLine,
  onSetIntegralPolygon,
  theme: _theme,
}) => {
  const [tangentX, setTangentX] = useState<number>(0);
  const [showTangent, setShowTangent] = useState(false);
  const [showNormal, setShowNormal] = useState(false);

  // Integral bounds
  const [integralA, setIntegralA] = useState<number>(0);
  const [integralB, setIntegralB] = useState<number>(2);
  const [showIntegralShading, setShowIntegralShading] = useState(false);

  const compiled = activeExpression ? compiledMap.get(activeExpression.id) : null;

  const curveType = activeExpression?.type || 'function';

  // 1. Calculate Roots (function or Inequality boundary)
  const roots = useMemo<number[]>(() => {
    if (!compiled || !activeExpression || (curveType !== 'function' && curveType !== 'inequality'))
      return [];
    const min =
      activeExpression.domainMin !== undefined
        ? Math.max(viewport.xMin, activeExpression.domainMin)
        : viewport.xMin;
    const max =
      activeExpression.domainMax !== undefined
        ? Math.min(viewport.xMax, activeExpression.domainMax)
        : viewport.xMax;
    return findRoots(compiled, { min, max }, sliderScope, 120);
  }, [compiled, activeExpression, curveType, viewport, sliderScope]);

  // 2. Calculate Extrema (function or Inequality boundary)
  const extrema = useMemo<{ x: number; y: number; type: 'min' | 'max' }[]>(() => {
    if (!compiled || !activeExpression || (curveType !== 'function' && curveType !== 'inequality'))
      return [];
    const min =
      activeExpression.domainMin !== undefined
        ? Math.max(viewport.xMin, activeExpression.domainMin)
        : viewport.xMin;
    const max =
      activeExpression.domainMax !== undefined
        ? Math.min(viewport.xMax, activeExpression.domainMax)
        : viewport.xMax;
    return findExtrema(compiled, { min, max }, sliderScope, 120);
  }, [compiled, activeExpression, curveType, viewport, sliderScope]);

  // 3. Calculate Y-Intercept (x=0)
  const yIntercept = useMemo<{ x: number; y: number } | null>(() => {
    if (!compiled || !activeExpression || (curveType !== 'function' && curveType !== 'inequality'))
      return null;
    if (activeExpression.domainMin !== undefined && activeExpression.domainMin > 0) return null;
    if (activeExpression.domainMax !== undefined && activeExpression.domainMax < 0) return null;
    try {
      const y = compiled.evaluate({ ...sliderScope, x: 0 });
      return y !== null && Number.isFinite(y) ? { x: 0, y: Number(y.toFixed(5)) } : null;
    } catch {
      return null;
    }
  }, [compiled, activeExpression, curveType, sliderScope]);

  // 4. Parametric Analysis Metrics
  const parametricAnalysis = useMemo(() => {
    if (curveType !== 'parametric' || !activeExpression) return null;
    const tMin = activeExpression.tMin ?? 0;
    const tMax = activeExpression.tMax ?? 2 * Math.PI;

    const compiledX = compiledMap.get(activeExpression.id);
    const compiledY =
      compiledParametricYMap?.get(activeExpression.id) ||
      compiledMap.get(`${activeExpression.id}_y`);
    if (!compiledX || !compiledY) return null;

    try {
      const x0 = compiledX.evaluate({ ...sliderScope, t: tMin });
      const y0 = compiledY.evaluate({ ...sliderScope, t: tMin });
      const x1 = compiledX.evaluate({ ...sliderScope, t: tMax });
      const y1 = compiledY.evaluate({ ...sliderScope, t: tMax });

      // Arc length via genuine adaptive Simpson quadrature
      const arcLength = calculateParametricArcLength(compiledX, compiledY, tMin, tMax, sliderScope);

      const steps = 100;
      const dt = (tMax - tMin) / steps;
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

      for (let i = 0; i <= steps; i++) {
        const t = tMin + i * dt;
        const curX = compiledX.evaluate({ ...sliderScope, t });
        const curY = compiledY.evaluate({ ...sliderScope, t });
        if (curX !== null && curY !== null && Number.isFinite(curX) && Number.isFinite(curY)) {
          minX = Math.min(minX, curX);
          maxX = Math.max(maxX, curX);
          minY = Math.min(minY, curY);
          maxY = Math.max(maxY, curY);
        }
      }

      return {
        tMin,
        tMax,
        initialPoint:
          x0 !== null && y0 !== null && Number.isFinite(x0) && Number.isFinite(y0)
            ? { x: Number(x0.toFixed(4)), y: Number(y0.toFixed(4)) }
            : null,
        terminalPoint:
          x1 !== null && y1 !== null && Number.isFinite(x1) && Number.isFinite(y1)
            ? { x: Number(x1.toFixed(4)), y: Number(y1.toFixed(4)) }
            : null,
        arcLength: arcLength !== null && arcLength > 0 ? Number(arcLength.toFixed(4)) : null,
        boundingBox:
          Number.isFinite(minX) && Number.isFinite(maxX)
            ? {
                xMin: Number(minX.toFixed(3)),
                xMax: Number(maxX.toFixed(3)),
                yMin: Number(minY.toFixed(3)),
                yMax: Number(maxY.toFixed(3)),
              }
            : null,
      };
    } catch {
      return null;
    }
  }, [curveType, activeExpression, compiledMap, compiledParametricYMap, sliderScope]);

  // 5. Polar Analysis Metrics
  const polarAnalysis = useMemo(() => {
    if (curveType !== 'polar' || !activeExpression || !compiled) return null;
    const thetaMin = activeExpression.thetaMin ?? 0;
    const thetaMax = activeExpression.thetaMax ?? 2 * Math.PI;

    try {
      let rMin = Infinity;
      let rMax = -Infinity;
      let rMinTheta = 0;
      let rMaxTheta = 0;
      let passesOrigin = false;

      const steps = 150;
      const dTheta = (thetaMax - thetaMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const th = thetaMin + i * dTheta;
        const r = compiled.evaluate({
          ...sliderScope,
          theta: th,
          θ: th,
          t: th,
          x: th,
        });

        if (r !== null && Number.isFinite(r)) {
          const absR = Math.abs(r);
          if (absR < 1e-4) passesOrigin = true;
          if (r > rMax) {
            rMax = r;
            rMaxTheta = th;
          }
          if (r < rMin) {
            rMin = r;
            rMinTheta = th;
          }
        }
      }

      const arcLength = calculatePolarArcLength(compiled, thetaMin, thetaMax, sliderScope);
      const enclosedArea = calculatePolarArea(compiled, thetaMin, thetaMax, sliderScope);

      return {
        thetaMin,
        thetaMax,
        rMax: Number.isFinite(rMax) ? Number(rMax.toFixed(4)) : null,
        rMaxTheta: Number.isFinite(rMax) ? Number(rMaxTheta.toFixed(3)) : null,
        rMin: Number.isFinite(rMin) ? Number(rMin.toFixed(4)) : null,
        rMinTheta: Number.isFinite(rMin) ? Number(rMinTheta.toFixed(3)) : null,
        passesOrigin,
        arcLength: arcLength !== null && arcLength > 0 ? Number(arcLength.toFixed(4)) : null,
        enclosedArea: enclosedArea !== null && enclosedArea > 0 ? Number(enclosedArea.toFixed(4)) : null,
      };
    } catch {
      return null;
    }
  }, [curveType, activeExpression, compiled, sliderScope]);

  // 4. Calculate Intersections with other visible curves
  const intersections = useMemo<
    { otherLabel: string; otherColor: string; points: Point2D[] }[]
  >(() => {
    if (!compiled || !activeExpression || (curveType !== 'function' && curveType !== 'inequality'))
      return [];
    const list: { otherLabel: string; otherColor: string; points: Point2D[] }[] = [];
    const range = {
      min:
        activeExpression.domainMin !== undefined
          ? Math.max(viewport.xMin, activeExpression.domainMin)
          : viewport.xMin,
      max:
        activeExpression.domainMax !== undefined
          ? Math.min(viewport.xMax, activeExpression.domainMax)
          : viewport.xMax,
    };

    for (const other of allExpressions) {
      if (other.id === activeExpression.id || !other.visible) continue;
      const otherType = other.type || 'function';
      if (otherType !== 'function' && otherType !== 'inequality') continue;
      const otherCompiled = compiledMap.get(other.id);
      if (!otherCompiled) continue;

      const pts = findIntersections(compiled, otherCompiled, range, sliderScope, 100);
      if (pts.length > 0) {
        list.push({
          otherLabel: other.label || other.expression,
          otherColor: other.color,
          points: pts,
        });
      }
    }
    return list;
  }, [compiled, activeExpression, curveType, allExpressions, compiledMap, viewport, sliderScope]);

  // 5. Tangent & Normal Lines
  const tangentResult = useMemo(() => {
    if (!compiled || !showTangent || curveType !== 'function') return null;
    return calculateTangentLine(compiled, tangentX, sliderScope);
  }, [compiled, tangentX, showTangent, curveType, sliderScope]);

  const normalResult = useMemo(() => {
    if (!compiled || !showNormal || curveType !== 'function') return null;
    return calculateNormalLine(compiled, tangentX, sliderScope);
  }, [compiled, tangentX, showNormal, curveType, sliderScope]);

  // Update canvas markers for tangent and normal
  React.useEffect(() => {
    onSetTangentLine(tangentResult);
  }, [tangentResult, onSetTangentLine]);

  React.useEffect(() => {
    onSetNormalLine(normalResult);
  }, [normalResult, onSetNormalLine]);

  // 6. Definite Integral
  const integralResult = useMemo(() => {
    if (!compiled || curveType !== 'function') return null;
    return calculateDefiniteIntegral(compiled, integralA, integralB, sliderScope);
  }, [compiled, integralA, integralB, curveType, sliderScope]);

  // Update canvas shading polygon (splits across singularities, never bridging asymptotes)
  React.useEffect(() => {
    if (showIntegralShading && compiled && activeExpression && curveType === 'function') {
      const polys = generateIntegralPolygons(compiled, integralA, integralB, sliderScope, 160);
      onSetIntegralPolygon(polys[0] || null, `∫ f(x)dx`, polys);
    } else {
      onSetIntegralPolygon(null, null, null);
    }
  }, [
    showIntegralShading,
    compiled,
    activeExpression,
    curveType,
    integralA,
    integralB,
    sliderScope,
    onSetIntegralPolygon,
  ]);

  if (!activeExpression) {
    return (
      <div className="p-6 text-center text-slate-400">
        <Activity className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
        <p className="text-xs font-semibold text-slate-300">No active function selected</p>
        <p className="text-[11px] text-slate-400 mt-1">
          Select an expression from the Functions tab to analyze.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto p-3 space-y-4">
      {/* Active Curve Header */}
      <div className="p-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: activeExpression.color }}
          />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              Active Curve ({curveType})
            </span>
            <div className="text-xs font-mono font-bold text-slate-100 truncate">
              {curveType === 'function' && `y = ${activeExpression.expression}`}
              {curveType === 'parametric' &&
                `(x(t), y(t)) = (${activeExpression.expression}, ${activeExpression.parametricY || '0'})`}
              {curveType === 'polar' && `r(θ) = ${activeExpression.expression}`}
              {curveType === 'inequality' &&
                `y ${activeExpression.inequalityOperator || '<='} ${activeExpression.expression}`}
            </div>
          </div>
        </div>

        {onSendToCalculus && curveType === 'function' && (
          <button
            onClick={() => onSendToCalculus(activeExpression.expression)}
            className="px-2 py-1 rounded-xl text-[11px] font-semibold bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-1 flex-shrink-0 transition-colors shadow-xs"
            title="Open in Calculus & Numerical Suite"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calculus</span>
          </button>
        )}
      </div>

      {/* PARAMETRIC CURVE ANALYSIS */}
      {curveType === 'parametric' && parametricAnalysis && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-300">Parametric Curve Analysis</span>
              <span className="text-[10px] font-mono text-indigo-400">
                t ∈ [{parametricAnalysis.tMin.toFixed(2)}, {parametricAnalysis.tMax.toFixed(2)}]
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {parametricAnalysis.initialPoint && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Initial P(t₀):</span>
                  <button
                    onClick={() => onSelectPoint(parametricAnalysis.initialPoint!)}
                    className="font-mono text-indigo-300 hover:underline"
                  >
                    ({parametricAnalysis.initialPoint.x}, {parametricAnalysis.initialPoint.y})
                  </button>
                </div>
              )}

              {parametricAnalysis.terminalPoint && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Terminal P(t₁):</span>
                  <button
                    onClick={() => onSelectPoint(parametricAnalysis.terminalPoint!)}
                    className="font-mono text-indigo-300 hover:underline"
                  >
                    ({parametricAnalysis.terminalPoint.x}, {parametricAnalysis.terminalPoint.y})
                  </button>
                </div>
              )}

              {parametricAnalysis.arcLength !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Estimated Arc Length:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {parametricAnalysis.arcLength}
                  </span>
                </div>
              )}

              {parametricAnalysis.boundingBox && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bounding Box:</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    [{parametricAnalysis.boundingBox.xMin}, {parametricAnalysis.boundingBox.xMax}] × [
                    {parametricAnalysis.boundingBox.yMin}, {parametricAnalysis.boundingBox.yMax}]
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 text-[11px] text-slate-400">
            Note: Cartesian single-variable calculus tools (roots, tangents, 1D integrals) apply to
            functions in y = f(x) form.
          </div>
        </div>
      )}

      {/* POLAR CURVE ANALYSIS */}
      {curveType === 'polar' && polarAnalysis && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl border border-teal-500/30 bg-teal-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-300">Polar Curve Analysis</span>
              <span className="text-[10px] font-mono text-teal-400">
                θ ∈ [{polarAnalysis.thetaMin.toFixed(2)}, {polarAnalysis.thetaMax.toFixed(2)}]
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Passes Origin (r = 0):</span>
                <span
                  className={`font-semibold ${polarAnalysis.passesOrigin ? 'text-emerald-400' : 'text-slate-400'}`}
                >
                  {polarAnalysis.passesOrigin ? 'Yes' : 'No'}
                </span>
              </div>

              {polarAnalysis.rMax !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Max Radius (r_max):</span>
                  <span className="font-mono font-bold text-teal-300">
                    {polarAnalysis.rMax} (at θ = {polarAnalysis.rMaxTheta} rad)
                  </span>
                </div>
              )}

              {polarAnalysis.rMin !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Min Radius (r_min):</span>
                  <span className="font-mono font-bold text-teal-300">
                    {polarAnalysis.rMin} (at θ = {polarAnalysis.rMinTheta} rad)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 text-[11px] text-slate-400">
            Note: Cartesian single-variable calculus tools apply to standard Cartesian y = f(x)
            functions.
          </div>
        </div>
      )}

      {/* INEQUALITY REGION ANALYSIS */}
      {curveType === 'inequality' && (
        <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300">Inequality Region</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-200">
              {activeExpression.inequalityOperator === '<' ||
              activeExpression.inequalityOperator === '<='
                ? 'Shaded Below'
                : 'Shaded Above'}
            </span>
          </div>

          <div className="text-slate-300 space-y-1">
            <div>
              <span className="text-slate-400">Boundary Curve: </span>
              <span className="font-mono font-semibold">y = {activeExpression.expression}</span>
            </div>
            <div>
              <span className="text-slate-400">Boundary Type: </span>
              <span className="font-semibold">
                {activeExpression.inequalityOperator === '<' ||
                activeExpression.inequalityOperator === '>'
                  ? 'Strict (Dashed line - excluded)'
                  : 'Inclusive (Solid line - included)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FUNCTION & INEQUALITY BOUNDARY CALCULUS TOOLS */}
      {(curveType === 'function' || curveType === 'inequality') && (
        <>
          {/* 1. Roots (Zeros) */}
          <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Target className="w-4 h-4" />
                <span>
                  {curveType === 'inequality' ? 'Boundary Roots' : 'Roots / X-Intercepts'} (
                  {roots.length})
                </span>
              </div>
              <span className="text-[10px] text-slate-400">f(x) = 0</span>
            </div>

            {roots.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No real roots found within current viewport.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {roots.map((rx) => (
                  <button
                    key={rx}
                    onClick={() => onSelectPoint({ x: rx, y: 0 })}
                    className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                    title={`Root at x = ${rx}. Click to locate.`}
                  >
                    <span>x = {rx}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Extrema (Minima / Maxima) */}
          <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <TrendingUp className="w-4 h-4" />
                <span>
                  {curveType === 'inequality' ? 'Boundary Extrema' : 'Local Extrema'} (
                  {extrema.length})
                </span>
              </div>
              <span className="text-[10px] text-slate-400">f'(x) = 0</span>
            </div>

            {extrema.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No local extrema found within current viewport.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {extrema.map((e, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectPoint({ x: e.x, y: e.y })}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
                      e.type === 'max'
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/30'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                    }`}
                    title={`Local ${e.type} at (${e.x}, ${e.y})`}
                  >
                    {e.type === 'max' ? (
                      <Maximize className="w-3 h-3" />
                    ) : (
                      <Minimize className="w-3 h-3" />
                    )}
                    <span>
                      {e.type}: ({e.x}, {e.y})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Y-Intercept */}
          <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-cyan-400">
                {curveType === 'inequality' ? 'Boundary Y-Intercept' : 'Y-Intercept'} (x = 0)
              </span>
              <span className="text-[10px] text-slate-400">f(0)</span>
            </div>
            {yIntercept ? (
              <button
                onClick={() => onSelectPoint(yIntercept)}
                className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all inline-flex items-center gap-1"
              >
                <span>(0, {yIntercept.y})</span>
              </button>
            ) : (
              <p className="text-xs text-slate-400 italic">Undefined at x = 0</p>
            )}
          </div>

          {/* 4. Intersections */}
          {intersections.length > 0 && (
            <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                  <Layers className="w-4 h-4" />
                  <span>Intersections with other curves</span>
                </div>
              </div>
              <div className="space-y-2">
                {intersections.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.otherColor }}
                      />
                      <span>with {item.otherLabel}:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-4">
                      {item.points.map((pt, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => onSelectPoint(pt)}
                          className="px-2 py-0.5 rounded-lg text-xs font-mono bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/30 transition-colors"
                        >
                          ({pt.x}, {pt.y})
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Tangent & Normal Line Analyzer (Function only) */}
          {curveType === 'function' && (
            <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400">Tangent & Normal Lines</span>
                <span className="text-[10px] text-slate-400">Calculus Tools</span>
              </div>

              <div className="flex items-center gap-2 mb-2.5">
                <label className="text-xs text-slate-400 font-medium">At x₀ =</label>
                <input
                  type="number"
                  step="0.5"
                  value={tangentX}
                  onChange={(e) => setTangentX(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded-xl text-xs font-mono bg-slate-800 border border-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTangent}
                    onChange={(e) => setShowTangent(e.target.checked)}
                    className="accent-yellow-500 rounded"
                  />
                  <span className="text-yellow-400 font-semibold">Tangent Line</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNormal}
                    onChange={(e) => setShowNormal(e.target.checked)}
                    className="accent-pink-500 rounded"
                  />
                  <span className="text-pink-400 font-semibold">Normal Line</span>
                </label>
              </div>

              {tangentResult && (
                <div className="text-[11px] font-mono text-yellow-300 bg-yellow-500/10 p-2 rounded-xl border border-yellow-500/20 mb-1">
                  Slope m = {tangentResult.slope.toFixed(4)} | {tangentResult.equation}
                </div>
              )}

              {normalResult && (
                <div className="text-[11px] font-mono text-pink-300 bg-pink-500/10 p-2 rounded-xl border border-pink-500/20">
                  {normalResult.isVertical
                    ? 'Vertical Line'
                    : `Slope m⊥ = ${normalResult.slope?.toFixed(4)}`}{' '}
                  | {normalResult.equation}
                </div>
              )}
            </div>
          )}

          {/* 6. Definite Integral & Area Shading (Function only) */}
          {curveType === 'function' && (
            <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-400">Definite Integral & Area</span>
                <span className="text-[10px] font-mono text-slate-400">∫ₐᵇ f(x) dx</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-slate-400">a =</label>
                <input
                  type="number"
                  step="0.5"
                  value={integralA}
                  onChange={(e) => setIntegralA(parseFloat(e.target.value) || 0)}
                  className="w-18 px-2 py-1 rounded-xl text-xs font-mono bg-slate-800 border border-slate-700 focus:outline-none"
                />
                <label className="text-xs text-slate-400">b =</label>
                <input
                  type="number"
                  step="0.5"
                  value={integralB}
                  onChange={(e) => setIntegralB(parseFloat(e.target.value) || 0)}
                  className="w-18 px-2 py-1 rounded-xl text-xs font-mono bg-slate-800 border border-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showIntegralShading}
                    onChange={(e) => setShowIntegralShading(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  <span>Shade Area on Canvas</span>
                </label>
              </div>

              {integralResult && (
                <div className="text-xs font-mono font-bold text-sky-300 bg-sky-500/10 p-2 rounded-xl border border-sky-500/20">
                  ∫ ({integralA} to {integralB}) f(x)dx = {integralResult.formatted}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
