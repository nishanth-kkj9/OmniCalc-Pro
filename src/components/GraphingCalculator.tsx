import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppSettings, GraphExpression, GraphViewport, GraphSettings as IGraphSettings, GraphSlider, GraphSession, Point2D, CurveSegment, CalcMode } from '../types';
import { DEFAULT_VIEWPORT, GRAPH_PALETTE, getOrCompileGraphExpression, zoomViewportAroundPoint } from '../utils/graph';
import {
  sampleGraphCurve,
  sampleParametricCurve,
  samplePolarCurve,
  generateInequalitySegments,
  sampleDerivativeCurve,
  detectVerticalAsymptotes,
  computeAutoFitViewport,
} from '../utils/graphSampling';
import {
  DEFAULT_GRAPH_SETTINGS,
  loadGraphSessions,
  saveGraphSession,
  deleteGraphSession,
  PRESET_SESSIONS,
} from '../utils/graphStorage';
import {
  exportCanvasAsPng,
  downloadSvgGraph,
  downloadSessionJson,
  downloadTableAsCsv,
} from '../utils/graphExport';
import { GraphCanvas } from './graph/GraphCanvas';
import { GraphToolbar } from './graph/GraphToolbar';
import { ExpressionList } from './graph/ExpressionList';
import { GraphAnalysisPanel } from './graph/GraphAnalysisPanel';
import { GraphTable } from './graph/GraphTable';
import { GraphSliderPanel } from './graph/GraphSliderPanel';
import { GraphSessionsPanel } from './graph/GraphSessionsPanel';
import { GraphSettings } from './graph/GraphSettings';
import { GraphStatusBar } from './graph/GraphStatusBar';
import { CompiledSafeExpression } from '../utils/calculator';
import { MAX_GRAPH_EXPRESSIONS } from '../constants/limits';

export interface GraphingCalculatorProps {
  settings: AppSettings;
  onNavigate?: (mode: CalcMode) => void;
}

export const GraphingCalculator: React.FC<GraphingCalculatorProps> = ({
  settings,
  onNavigate,
}) => {
  const [expressions, setExpressions] = useState<GraphExpression[]>(() => {
    // Start with a clean default quadratic parabola
    return [
      {
        id: 'expr_1',
        expression: 'x^2 - 4',
        visible: true,
        color: '#38bdf8',
        lineWidth: 2.5,
        lineStyle: 'solid',
        label: 'Parabola',
      },
    ];
  });

  const [activeExpressionId, setActiveExpressionId] = useState<string>('expr_1');
  const [viewport, setViewport] = useState<GraphViewport>({ ...DEFAULT_VIEWPORT });
  const [graphSettings, setGraphSettings] = useState<IGraphSettings>({ ...DEFAULT_GRAPH_SETTINGS });
  const [sliders, setSliders] = useState<GraphSlider[]>([]);
  const [activeTab, setActiveTab] = useState<'expressions' | 'table' | 'analysis' | 'sliders' | 'sessions'>('expressions');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Trace mode
  const [isTraceActive, setIsTraceActive] = useState(false);
  const [tracePoint, setTracePoint] = useState<Point2D | null>(null);

  // Undo / Redo history for viewport & expressions
  const [undoStack, setUndoStack] = useState<GraphViewport[]>([]);
  const [redoStack, setRedoStack] = useState<GraphViewport[]>([]);

  // Saved user sessions
  const [userSessions, setUserSessions] = useState<GraphSession[]>([]);

  // Analysis markers on canvas
  const [tangentLine, setTangentLine] = useState<{ x0: number; y0: number; slope: number } | null>(null);
  const [normalLine, setNormalLine] = useState<{ x0: number; y0: number; slope: number | null; isVertical: boolean } | null>(null);
  const [integralPolygon, setIntegralPolygon] = useState<Point2D[] | null>(null);
  const [integralLabel, setIntegralLabel] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load saved sessions on mount
  useEffect(() => {
    setUserSessions(loadGraphSessions());
  }, []);

  // Update viewport with history push
  const handleUpdateViewport = useCallback((newVp: GraphViewport) => {
    setUndoStack((prev) => [...prev.slice(-20), viewport]);
    setRedoStack([]);
    setViewport(newVp);
  }, [viewport]);

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((r) => [...r, viewport]);
    setViewport(prev);
  }, [undoStack, viewport]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((s) => [...s, viewport]);
    setViewport(next);
  }, [redoStack, viewport]);

  // Slider variable scope
  const sliderScope = useMemo<Record<string, number>>(() => {
    const scope: Record<string, number> = {};
    for (const s of sliders) {
      scope[s.name] = s.value;
    }
    return scope;
  }, [sliders]);

  const sliderNames = useMemo(() => sliders.map((s) => s.name), [sliders]);

  // Safe compilation of all expressions (including parametric Y)
  const { compiledMap, compiledParametricYMap, validExpressionIds } = useMemo(() => {
    const map = new Map<string, CompiledSafeExpression>();
    const yMap = new Map<string, CompiledSafeExpression>();
    const validIds = new Set<string>();

    for (const expr of expressions) {
      const compiled = getOrCompileGraphExpression(expr.expression, settings.angleMode, sliderNames);
      if (compiled) {
        map.set(expr.id, compiled);
        validIds.add(expr.id);
      }

      if (expr.type === 'parametric' && expr.parametricY) {
        const compY = getOrCompileGraphExpression(expr.parametricY, settings.angleMode, sliderNames);
        if (compY) {
          yMap.set(expr.id, compY);
        }
      }
    }

    return { compiledMap: map, compiledParametricYMap: yMap, validExpressionIds: validIds };
  }, [expressions, settings.angleMode, sliderNames]);

  // Curve sampling with adaptive subdivision, parametric, polar, and asymptote detection
  const { segmentsMap, inequalityPolygonsMap, derivativeSegmentsMap, detectedAsymptotes } = useMemo(() => {
    const segMap = new Map<string, CurveSegment[]>();
    const ineqMap = new Map<string, Point2D[][]>();
    const derivMap = new Map<string, { d1?: CurveSegment[]; d2?: CurveSegment[] }>();
    const allAsymptotes: number[] = [];

    for (const expr of expressions) {
      if (!expr.visible) continue;
      const compiled = compiledMap.get(expr.id);
      if (!compiled) continue;

      let segments: CurveSegment[] = [];

      if (expr.type === 'parametric') {
        const compY = compiledParametricYMap.get(expr.id);
        if (compY) {
          segments = sampleParametricCurve(compiled, compY, {
            tMin: expr.tMin ?? 0,
            tMax: expr.tMax ?? 2 * Math.PI,
            viewport,
            scope: sliderScope,
          });
        }
      } else if (expr.type === 'polar') {
        segments = samplePolarCurve(compiled, {
          thetaMin: expr.thetaMin ?? 0,
          thetaMax: expr.thetaMax ?? 2 * Math.PI,
          viewport,
          scope: sliderScope,
        });
      } else {
        // Cartesian Function or Inequality
        segments = sampleGraphCurve(compiled, {
          viewport,
          domainMin: expr.domainMin,
          domainMax: expr.domainMax,
          scope: sliderScope,
          pixelWidth: 900,
        });

        if (expr.type === 'inequality') {
          const polys = generateInequalitySegments(segments, expr.inequalityOp || '<=', viewport);
          ineqMap.set(expr.id, polys);
        }

        // Derivative curves if toggled
        if (expr.showDerivative || expr.showSecondDerivative) {
          const d1 = expr.showDerivative
            ? sampleDerivativeCurve(compiled, { viewport, domainMin: expr.domainMin, domainMax: expr.domainMax, scope: sliderScope }, 1)
            : undefined;
          const d2 = expr.showSecondDerivative
            ? sampleDerivativeCurve(compiled, { viewport, domainMin: expr.domainMin, domainMax: expr.domainMax, scope: sliderScope }, 2)
            : undefined;
          derivMap.set(expr.id, { d1, d2 });
        }

        // Detect vertical asymptotes for active or function curves
        if (expr.id === activeExpressionId || expressions.length <= 2) {
          const asyms = detectVerticalAsymptotes(compiled, viewport, sliderScope);
          allAsymptotes.push(...asyms);
        }
      }

      segMap.set(expr.id, segments);
    }

    return {
      segmentsMap: segMap,
      inequalityPolygonsMap: ineqMap,
      derivativeSegmentsMap: derivMap,
      detectedAsymptotes: allAsymptotes,
    };
  }, [expressions, compiledMap, compiledParametricYMap, viewport, sliderScope, activeExpressionId]);

  // Toolbar Actions
  const handleZoomIn = useCallback(() => {
    const centerGx = (viewport.xMin + viewport.xMax) / 2;
    const centerGy = (viewport.yMin + viewport.yMax) / 2;
    const newVp = zoomViewportAroundPoint(viewport, centerGx, centerGy, 0.75);
    handleUpdateViewport(newVp);
  }, [viewport, handleUpdateViewport]);

  const handleZoomOut = useCallback(() => {
    const centerGx = (viewport.xMin + viewport.xMax) / 2;
    const centerGy = (viewport.yMin + viewport.yMax) / 2;
    const newVp = zoomViewportAroundPoint(viewport, centerGx, centerGy, 1.33);
    handleUpdateViewport(newVp);
  }, [viewport, handleUpdateViewport]);

  const handleResetView = useCallback(() => {
    handleUpdateViewport({ ...DEFAULT_VIEWPORT });
  }, [handleUpdateViewport]);

  const handleFitAll = useCallback(() => {
    const allSegments: CurveSegment[] = [];
    segmentsMap.forEach((segs) => allSegments.push(...segs));
    const fitted = computeAutoFitViewport(allSegments, viewport);
    handleUpdateViewport(fitted);
  }, [segmentsMap, viewport, handleUpdateViewport]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleResetView();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFitAll();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsTraceActive((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetView, handleFitAll, handleUndo, handleRedo]);

  // Expression Management
  const handleAddExpression = (initialExpr: string = '') => {
    if (expressions.length >= MAX_GRAPH_EXPRESSIONS) return;

    const newId = `expr_${Date.now()}`;
    const nextColor = GRAPH_PALETTE[expressions.length % GRAPH_PALETTE.length];
    const newExpr: GraphExpression = {
      id: newId,
      expression: initialExpr || 'x',
      visible: true,
      color: nextColor,
      lineWidth: 2.5,
      lineStyle: 'solid',
    };

    setExpressions((prev) => [...prev, newExpr]);
    setActiveExpressionId(newId);
  };

  const handleUpdateExpression = (id: string, updated: Partial<GraphExpression>) => {
    setExpressions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );
  };

  const handleDuplicateExpression = (id: string) => {
    if (expressions.length >= MAX_GRAPH_EXPRESSIONS) return;
    const target = expressions.find((e) => e.id === id);
    if (!target) return;

    const newId = `expr_${Date.now()}`;
    const nextColor = GRAPH_PALETTE[expressions.length % GRAPH_PALETTE.length];
    const duplicated: GraphExpression = {
      ...target,
      id: newId,
      color: nextColor,
      label: target.label ? `${target.label} (Copy)` : undefined,
    };

    setExpressions((prev) => [...prev, duplicated]);
    setActiveExpressionId(newId);
  };

  const handleDeleteExpression = (id: string) => {
    setExpressions((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      if (activeExpressionId === id && filtered.length > 0) {
        setActiveExpressionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Sliders Management
  const handleAddSlider = (name: string) => {
    const newSlider: GraphSlider = {
      id: `sl_${name}`,
      name,
      value: 1,
      min: -10,
      max: 10,
      step: 0.1,
    };
    setSliders((prev) => [...prev, newSlider]);
  };

  const handleUpdateSlider = (id: string, updated: Partial<GraphSlider>) => {
    setSliders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  };

  const handleDeleteSlider = (id: string) => {
    setSliders((prev) => prev.filter((s) => s.id !== id));
  };

  // Sessions Management
  const currentSession: GraphSession = useMemo(
    () => ({
      id: `sess_${Date.now()}`,
      title: 'Current Workspace',
      version: 1,
      timestamp: Date.now(),
      viewport,
      settings: graphSettings,
      sliders,
      expressions,
    }),
    [viewport, graphSettings, sliders, expressions]
  );

  const handleSaveCurrentSession = (title: string) => {
    const sess: GraphSession = {
      ...currentSession,
      id: `sess_${Date.now()}`,
      title,
      timestamp: Date.now(),
    };
    saveGraphSession(sess);
    setUserSessions(loadGraphSessions());
  };

  const handleLoadSession = (session: GraphSession) => {
    setExpressions(session.expressions);
    setSliders(session.sliders || []);
    setViewport(session.viewport);
    setGraphSettings(session.settings);
    if (session.expressions.length > 0) {
      setActiveExpressionId(session.expressions[0].id);
    }
  };

  const handleDeleteSession = (id: string) => {
    deleteGraphSession(id);
    setUserSessions(loadGraphSessions());
  };

  // Export handlers
  const handleExportPng = () => {
    if (canvasRef.current) {
      exportCanvasAsPng(canvasRef.current, 'omnicalc-graph.png');
    }
  };

  const handleExportSvg = () => {
    downloadSvgGraph({
      viewport,
      settings: graphSettings,
      expressions,
      segmentsMap,
      theme: settings.theme,
      width: 1000,
      height: 650,
    });
  };

  const handleExportJson = () => {
    downloadSessionJson(currentSession);
  };

  const handleExportCsv = () => {
    const visibleExprs = expressions.filter((e) => e.visible);
    const headers = ['x', ...visibleExprs.map((e) => e.label || `y = ${e.expression}`)];
    const rows: (number | string)[][] = [];

    for (let x = viewport.xMin; x <= viewport.xMax; x += 0.5) {
      const row: (number | string)[] = [Number(x.toFixed(4))];
      for (const expr of visibleExprs) {
        const comp = compiledMap.get(expr.id);
        if (!comp) {
          row.push('Err');
        } else {
          try {
            const y = comp.evaluate({ ...sliderScope, x });
            row.push(y !== null && Number.isFinite(y) ? Number(y.toFixed(4)) : 'Undefined');
          } catch {
            row.push('Err');
          }
        }
      }
      rows.push(row);
    }

    downloadTableAsCsv(headers, rows);
  };

  const activeExpression = expressions.find((e) => e.id === activeExpressionId) || null;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Toolbar */}
      <GraphToolbar
        settings={settings}
        isTraceActive={isTraceActive}
        onToggleTrace={() => setIsTraceActive((prev) => !prev)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onFitAll={handleFitAll}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        sessions={PRESET_SESSIONS}
        onLoadSession={handleLoadSession}
      />

      {/* Main Workspace (Canvas + Side Drawer) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Graph Canvas Container */}
        <div className="flex-1 relative h-full min-h-[340px] flex flex-col">
          <GraphCanvas
            viewport={viewport}
            onUpdateViewport={handleUpdateViewport}
            settings={graphSettings}
            expressions={expressions}
            segmentsMap={segmentsMap}
            inequalityPolygonsMap={inequalityPolygonsMap}
            derivativeSegmentsMap={derivativeSegmentsMap}
            asymptotes={detectedAsymptotes}
            activeExpressionId={activeExpressionId}
            theme={settings.theme}
            accentColor={settings.accentColor}
            isTraceActive={isTraceActive}
            tracePoint={tracePoint}
            onTraceMove={(pt) => setTracePoint(pt)}
            analysisMarkers={{
              roots: [],
              extrema: [],
              intersections: [],
              tangentLine,
              normalLine,
              integralPolygon,
              integralLabel,
            }}
            canvasRef={canvasRef}
          />

          {/* Bottom Status Bar */}
          <GraphStatusBar
            viewport={viewport}
            tracePoint={tracePoint}
            isTraceActive={isTraceActive}
            activeExprLabel={activeExpression?.label || (activeExpression ? `y = ${activeExpression.expression}` : undefined)}
            angleMode={settings.angleMode}
            theme={settings.theme}
          />
        </div>

        {/* Side Panel (Desktop: Sidebar, Mobile: bottom sheet / expandable) */}
        <div
          className={`w-full md:w-84 lg:w-96 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col flex-shrink-0 max-h-[48vh] md:max-h-full overflow-hidden ${
            settings.theme === 'light'
              ? 'bg-slate-50 text-slate-900 border-slate-200'
              : settings.theme === 'oled'
                ? 'bg-black text-white border-zinc-800'
                : 'bg-slate-900/90 text-slate-100 border-slate-800'
          }`}
        >
          {activeTab === 'expressions' && (
            <ExpressionList
              expressions={expressions}
              activeExpressionId={activeExpressionId}
              onSelectExpression={setActiveExpressionId}
              onAddExpression={handleAddExpression}
              onUpdateExpression={handleUpdateExpression}
              onDuplicateExpression={handleDuplicateExpression}
              onDeleteExpression={handleDeleteExpression}
              onAnalyzeExpression={(id) => {
                setActiveExpressionId(id);
                setActiveTab('analysis');
              }}
              validExpressionIds={validExpressionIds}
              theme={settings.theme}
            />
          )}

          {activeTab === 'analysis' && (
            <GraphAnalysisPanel
              activeExpression={activeExpression}
              allExpressions={expressions}
              compiledMap={compiledMap}
              viewport={viewport}
              sliderScope={sliderScope}
              onSelectPoint={(pt) => {
                setIsTraceActive(true);
                setTracePoint(pt);
              }}
              onSendToCalculus={() => {
                if (onNavigate) {
                  onNavigate('calculus');
                }
              }}
              onSetTangentLine={setTangentLine}
              onSetNormalLine={setNormalLine}
              onSetIntegralPolygon={(poly, label) => {
                setIntegralPolygon(poly);
                setIntegralLabel(label || null);
              }}
              theme={settings.theme}
            />
          )}

          {activeTab === 'table' && (
            <GraphTable
              expressions={expressions}
              compiledMap={compiledMap}
              sliderScope={sliderScope}
              onSelectRowPoint={(pt) => {
                setIsTraceActive(true);
                setTracePoint(pt);
              }}
              theme={settings.theme}
            />
          )}

          {activeTab === 'sliders' && (
            <GraphSliderPanel
              sliders={sliders}
              onAddSlider={handleAddSlider}
              onUpdateSlider={handleUpdateSlider}
              onDeleteSlider={handleDeleteSlider}
              theme={settings.theme}
            />
          )}

          {activeTab === 'sessions' && (
            <GraphSessionsPanel
              currentSession={currentSession}
              userSessions={userSessions}
              onLoadSession={handleLoadSession}
              onSaveCurrentSession={handleSaveCurrentSession}
              onDeleteSession={handleDeleteSession}
              onImportSession={handleLoadSession}
              theme={settings.theme}
            />
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <GraphSettings
          settings={graphSettings}
          onUpdateSettings={(updated) =>
            setGraphSettings((prev) => ({ ...prev, ...updated }))
          }
          viewport={viewport}
          onUpdateViewport={handleUpdateViewport}
          onClose={() => setSettingsOpen(false)}
          theme={settings.theme}
        />
      )}
    </div>
  );
};
