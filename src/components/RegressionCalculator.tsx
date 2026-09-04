import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Plus, Trash2, ArrowRight, Play, Layers } from 'lucide-react';
import { AppSettings } from '../types';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import {
  fitModel,
  evaluateAllModels,
  DataPoint,
  RegressionType,
  RegressionModelResult,
} from '../utils/regression';

interface RegressionCalculatorProps {
  settings?: AppSettings;
  onNavigateToGraph?: (expression: string) => void;
}

const SAMPLE_PRESETS: { name: string; type: RegressionType; data: DataPoint[] }[] = [
  {
    name: "Hooke's Law (Linear)",
    type: 'linear',
    data: [
      { x: 10, y: 1.95 },
      { x: 20, y: 4.02 },
      { x: 30, y: 6.11 },
      { x: 40, y: 7.98 },
      { x: 50, y: 10.05 },
      { x: 60, y: 12.14 },
    ],
  },
  {
    name: 'Trajectory (Quadratic)',
    type: 'quadratic',
    data: [
      { x: 0, y: 0.5 },
      { x: 1, y: 8.2 },
      { x: 2, y: 13.1 },
      { x: 3, y: 14.8 },
      { x: 4, y: 13.5 },
      { x: 5, y: 8.9 },
      { x: 6, y: 1.2 },
    ],
  },
  {
    name: 'Bacterial Growth (Exponential)',
    type: 'exponential',
    data: [
      { x: 0, y: 100 },
      { x: 1, y: 165 },
      { x: 2, y: 270 },
      { x: 3, y: 448 },
      { x: 4, y: 740 },
      { x: 5, y: 1220 },
    ],
  },
  {
    name: 'Sound Attenuation (Logarithmic)',
    type: 'logarithmic',
    data: [
      { x: 1, y: 90 },
      { x: 2, y: 84 },
      { x: 5, y: 76 },
      { x: 10, y: 70 },
      { x: 20, y: 64 },
      { x: 50, y: 56 },
    ],
  },
];

export const RegressionCalculator: React.FC<RegressionCalculatorProps> = ({
  settings: _settings,
  onNavigateToGraph,
}) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(SAMPLE_PRESETS[0].data);
  const [selectedModelType, setSelectedModelType] = useState<RegressionType | 'auto'>('auto');
  const [pasteInput, setPasteInput] = useState<string>('');
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [predictX, setPredictX] = useState<string>('70');
  const [predictY, setPredictY] = useState<string>('');
  const [viewMode, setViewMode] = useState<'fit' | 'residuals'>('fit');
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Model evaluations
  const allEvaluations = useMemo(() => {
    return evaluateAllModels(dataPoints);
  }, [dataPoints]);

  const activeResult: RegressionModelResult | null = useMemo(() => {
    if (selectedModelType === 'auto') {
      return allEvaluations.length > 0 ? allEvaluations[0] : null;
    }
    return fitModel(selectedModelType, dataPoints);
  }, [selectedModelType, allEvaluations, dataPoints]);

  // Handle manual data point editing
  const handlePointChange = (index: number, field: 'x' | 'y', val: string) => {
    const num = parseFloat(val);
    setDataPoints((prev) =>
      prev.map((pt, i) => (i === index ? { ...pt, [field]: isNaN(num) ? 0 : num } : pt))
    );
  };

  const addPoint = () => {
    const last = dataPoints[dataPoints.length - 1];
    const newX = last ? last.x + 10 : 0;
    const newY = last ? last.y + 5 : 0;
    setDataPoints((prev) => [...prev, { x: newX, y: newY }]);
  };

  const removePoint = (index: number) => {
    if (dataPoints.length <= 2) return;
    setDataPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePasteImport = () => {
    if (!pasteInput.trim()) return;
    const lines = pasteInput.trim().split(/\r?\n/);
    const parsed: DataPoint[] = [];

    for (const line of lines) {
      const parts = line.split(/[,\t\s]+/).filter(Boolean);
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y)) {
          parsed.push({ x, y });
        }
      }
    }

    if (parsed.length >= 2) {
      setDataPoints(parsed);
      setShowPasteBox(false);
      setPasteInput('');
    }
  };

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#18181b' : '#f8fafc';
    const gridColor = isDark ? '#27272a' : '#e2e8f0';
    const axisColor = isDark ? '#52525b' : '#94a3b8';
    const textColor = isDark ? '#a1a1aa' : '#64748b';
    const pointColor = '#3b82f6';
    const curveColor = '#10b981';
    const residualColor = '#ef4444';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    if (dataPoints.length === 0) return;

    // Determine viewport
    const xVals = dataPoints.map((p) => p.x);
    const yVals = dataPoints.map((p) => p.y);
    let minX = Math.min(...xVals);
    let maxX = Math.max(...xVals);
    let minY = Math.min(...yVals);
    let maxY = Math.max(...yVals);

    const paddingX = (maxX - minX) * 0.15 || 5;
    const paddingY = (maxY - minY) * 0.15 || 5;
    minX -= paddingX;
    maxX += paddingX;
    minY -= paddingY;
    maxY += paddingY;

    const toScreenX = (x: number) => ((x - minX) / (maxX - minX)) * (width - 80) + 50;
    const toScreenY = (y: number) => height - 40 - ((y - minY) / (maxY - minY)) * (height - 80);

    // Draw grid & axes
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const numTicks = 6;
    for (let i = 0; i <= numTicks; i++) {
      const gx = minX + (i * (maxX - minX)) / numTicks;
      const sx = toScreenX(gx);
      ctx.beginPath();
      ctx.moveTo(sx, 20);
      ctx.lineTo(sx, height - 30);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(gx.toFixed(1), sx, height - 15);

      const gy = minY + (i * (maxY - minY)) / numTicks;
      const sy = toScreenY(gy);
      ctx.beginPath();
      ctx.moveTo(45, sy);
      ctx.lineTo(width - 20, sy);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.fillText(gy.toFixed(1), 40, sy + 3);
    }

    // Draw main axes lines
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(50, 20);
    ctx.lineTo(50, height - 35);
    ctx.lineTo(width - 20, height - 35);
    ctx.stroke();

    if (viewMode === 'fit' && activeResult) {
      // Draw smooth fitted curve
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      const steps = 200;
      for (let s = 0; s <= steps; s++) {
        const x = minX + (s * (maxX - minX)) / steps;
        const y = activeResult.predict(x);
        if (!isNaN(y) && isFinite(y)) {
          const sx = toScreenX(x);
          const sy = toScreenY(y);
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        }
      }
      ctx.stroke();
    }

    // Draw Data Points & Residuals
    for (const pt of dataPoints) {
      const sx = toScreenX(pt.x);
      const sy = toScreenY(pt.y);

      if (activeResult) {
        const yPred = activeResult.predict(pt.x);
        const sPredY = toScreenY(yPred);

        // Draw residual line
        ctx.strokeStyle = residualColor;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sPredY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw point dot
      ctx.fillStyle = pointColor;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [dataPoints, activeResult, viewMode]);

  // Export report
  const handleExport = () => {
    setExportModalOpen(true);
  };

  const exportData: ExportReportData = {
    title: 'Regression & Data Analysis Report',
    engine: 'Regression Engine',
    timestamp: Date.now(),
    inputDescription: `Data points: ${dataPoints.length} points, Selected Model: ${activeResult ? activeResult.modelType : 'None'}`,
    resultSummary: activeResult
      ? `Model: ${activeResult.modelType}, Equation: ${activeResult.equation}, R² = ${activeResult.rSquared.toFixed(4)}, RMSE = ${activeResult.rmse.toFixed(4)}`
      : 'No model fitted',
    tableHeaders: ['x', 'y', 'y_pred', 'residual'],
    tableRows: activeResult
      ? activeResult.residuals.map((r) => [r.x, r.yObserved, r.yPredicted, r.residual])
      : dataPoints.map((p) => [p.x, p.y, '', '']),
  };

  return (
    <div id="regression-calculator-root" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4 lg:p-6 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Regression & Curve Fitting
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            High-precision least-squares regression, ANOVA statistics, residuals & inverse prediction
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeResult && onNavigateToGraph && (
            <button
              id="regression-graph-handoff"
              onClick={() => onNavigateToGraph(activeResult.equation.replace(/y\s*=\s*/i, ''))}
              className="px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-4 h-4" /> Plot in Graph
            </button>
          )}

          <button
            id="regression-export-btn"
            onClick={handleExport}
            className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Data points & Model Settings (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Presets & Import */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Data Presets & Import
              </span>
              <button
                id="regression-toggle-paste"
                onClick={() => setShowPasteBox(!showPasteBox)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showPasteBox ? 'Hide Paste' : 'Paste CSV/TSV'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  id={`preset-${preset.type}`}
                  onClick={() => {
                    setDataPoints(preset.data);
                    setSelectedModelType(preset.type);
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {showPasteBox && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
                <textarea
                  id="regression-paste-area"
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder="Paste rows: X, Y or X [tab] Y&#10;1.0, 2.5&#10;2.0, 5.1"
                  rows={4}
                  className="w-full text-xs font-mono p-2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  id="regression-import-btn"
                  onClick={handlePasteImport}
                  className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                >
                  Load Data Points
                </button>
              </div>
            )}
          </div>

          {/* Data Points Table */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Data Points ({dataPoints.length})
              </span>
              <button
                id="regression-add-point"
                onClick={addPoint}
                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-medium rounded flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Point
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-100 dark:border-zinc-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 text-slate-500 dark:text-zinc-400 font-medium">#</th>
                    <th className="py-2 px-3 text-slate-500 dark:text-zinc-400 font-medium">X</th>
                    <th className="py-2 px-3 text-slate-500 dark:text-zinc-400 font-medium">Y</th>
                    <th className="py-2 px-3 text-right text-slate-500 dark:text-zinc-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {dataPoints.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                      <td className="py-1.5 px-3 text-slate-400 dark:text-zinc-500 font-mono">{idx + 1}</td>
                      <td className="py-1.5 px-3">
                        <input
                          id={`pt-x-${idx}`}
                          type="number"
                          step="any"
                          value={pt.x}
                          onChange={(e) => handlePointChange(idx, 'x', e.target.value)}
                          className="w-20 px-2 py-1 font-mono text-xs rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          id={`pt-y-${idx}`}
                          type="number"
                          step="any"
                          value={pt.y}
                          onChange={(e) => handlePointChange(idx, 'y', e.target.value)}
                          className="w-20 px-2 py-1 font-mono text-xs rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          id={`pt-del-${idx}`}
                          onClick={() => removePoint(idx)}
                          disabled={dataPoints.length <= 2}
                          className="text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Selector & Ranking */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">
              Model Comparison (Ranked by R²)
            </span>

            <div className="space-y-2">
              <div
                id="model-opt-auto"
                onClick={() => setSelectedModelType('auto')}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  selectedModelType === 'auto'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <span>⭐ Automatic Best Fit</span>
                {allEvaluations.length > 0 && (
                  <span className="font-mono text-slate-500 dark:text-zinc-400">
                    {allEvaluations[0].modelType} (R² = {allEvaluations[0].rSquared.toFixed(4)})
                  </span>
                )}
              </div>

              {allEvaluations.map((m) => (
                <div
                  key={m.modelType}
                  id={`model-opt-${m.modelType}`}
                  onClick={() => setSelectedModelType(m.modelType)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    selectedModelType === m.modelType
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div>
                    <span className="font-medium capitalize">{m.modelType}</span>
                    <span className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      {m.equation}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold">R² = {m.rSquared.toFixed(4)}</span>
                    <span className="block text-[10px] text-slate-400">RMSE: {m.rmse.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visualization, ANOVA Metrics, Predictions (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Plot Canvas */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Fitted Curve & Scatter Plot
                </span>
                {activeResult && (
                  <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {activeResult.equation}
                  </p>
                )}
              </div>

              <div className="flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5 text-xs font-medium">
                <button
                  id="view-fit"
                  onClick={() => setViewMode('fit')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    viewMode === 'fit'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Fitted Line
                </button>
                <button
                  id="view-residuals"
                  onClick={() => setViewMode('residuals')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    viewMode === 'residuals'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Residuals
                </button>
              </div>
            </div>

            <div className="w-full flex justify-center bg-slate-50 dark:bg-zinc-950 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800">
              <canvas
                ref={canvasRef}
                width={650}
                height={340}
                className="w-full max-w-full h-auto"
              />
            </div>
          </div>

          {/* Model Statistics Metrics Grid */}
          {activeResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">R² (Coeff of Det)</span>
                <p className="text-lg font-bold font-mono text-slate-800 dark:text-zinc-100">
                  {activeResult.rSquared.toFixed(5)}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Adjusted R²</span>
                <p className="text-lg font-bold font-mono text-slate-800 dark:text-zinc-100">
                  {activeResult.adjustedRSquared?.toFixed(5) ?? 'N/A'}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">RMSE</span>
                <p className="text-lg font-bold font-mono text-slate-800 dark:text-zinc-100">
                  {activeResult.rmse.toFixed(4)}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">MAE</span>
                <p className="text-lg font-bold font-mono text-slate-800 dark:text-zinc-100">
                  {activeResult.mae.toFixed(4)}
                </p>
              </div>
            </div>
          )}

          {/* Prediction & Inverse Prediction Section */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Forward Predict: Given X -> compute Y */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 block mb-2">
                Forward Predict (y from x)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono">x =</span>
                <input
                  id="regression-predict-x"
                  type="number"
                  step="any"
                  value={predictX}
                  onChange={(e) => setPredictX(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                />
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  y ={' '}
                  {activeResult && predictX !== ''
                    ? activeResult.predict(parseFloat(predictX)).toFixed(4)
                    : '—'}
                </span>
              </div>
            </div>

            {/* Inverse Predict: Given Y -> compute X roots */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 block mb-2">
                Inverse Predict (x from y)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono">y =</span>
                <input
                  id="regression-predict-y"
                  type="number"
                  step="any"
                  value={predictY}
                  placeholder="Target Y"
                  onChange={(e) => setPredictY(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                />
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  x ≈{' '}
                  {activeResult && predictY !== '' && activeResult.inversePredict
                    ? activeResult
                        .inversePredict(parseFloat(predictY))
                        .map((x: number) => x.toFixed(3))
                        .join(', ') || 'No real root'
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={exportData}
      />
    </div>
  );
};
export default RegressionCalculator;
