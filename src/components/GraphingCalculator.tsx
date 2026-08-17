import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { create, all } from 'mathjs';
import { evaluateExpression } from '../utils/calculator';
import { AppSettings } from '../types';
import { Plus, Trash2, Download, ZoomIn, ZoomOut, RefreshCw, Table } from 'lucide-react';

const math = create(all, {});

interface GraphingCalculatorProps {
  settings: AppSettings;
}

interface FunctionItem {
  id: string;
  expression: string;
  color: string;
  enabled: boolean;
}

const COLORS = ['#38bdf8', '#f43f5e', '#10b981', '#a855f7', '#f59e0b'];

export const GraphingCalculator: React.FC<GraphingCalculatorProps> = ({ settings }) => {
  const [functions, setFunctions] = useState<FunctionItem[]>([
    { id: 'f1', expression: 'sin(x)', color: COLORS[0], enabled: true },
    { id: 'f2', expression: 'x^2 - 4', color: COLORS[1], enabled: true },
  ]);

  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-10);
  const [yMax, setYMax] = useState<number>(10);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const addFunction = () => {
    if (functions.length >= 5) return;
    const newId = 'f' + (functions.length + 1);
    const color = COLORS[functions.length % COLORS.length];
    setFunctions([...functions, { id: newId, expression: '', color, enabled: true }]);
  };

  const removeFunction = (id: string) => {
    setFunctions(functions.filter((f) => f.id !== id));
  };

  const updateFunction = (id: string, field: 'expression' | 'enabled', val: string | boolean) => {
    setFunctions(
      functions.map((f) => (f.id === id ? { ...f, [field]: val } : f))
    );
  };

  // Compile expressions once to avoid re-parsing per pixel on every frame
  const compiledFns = useMemo(() => {
    return functions.map((fn) => {
      if (!fn.enabled || !fn.expression.trim()) return null;
      try {
        const sanitized = fn.expression
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/π/g, 'pi')
          .replace(/−/g, '-')
          .replace(/√\(/g, 'sqrt(')
          .replace(/√([0-9a-zA-Z.]+)/g, 'sqrt($1)')
          .replace(/(\d+(?:\.\d+)?)%/g, '($1 * 0.01)');
        const parsed = math.parse(sanitized);
        return {
          ...fn,
          compiled: parsed.compile(),
        };
      } catch {
        return null;
      }
    });
  }, [functions]);

  // Evaluate function f(x) safely for table
  const evalFuncAtX = useCallback(
    (expr: string, xVal: number): number | null => {
      try {
        const resStr = evaluateExpression(expr, settings.angleMode, 8, { x: xVal });
        const num = parseFloat(resStr);
        return isNaN(num) || !isFinite(num) ? null : num;
      } catch {
        return null;
      }
    },
    [settings.angleMode]
  );

  // Render Canvas
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const isLight = settings.theme === 'light';
    const isOled = settings.theme === 'oled';

    // Clear background
    ctx.fillStyle = isLight ? '#ffffff' : isOled ? '#000000' : '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Coordinate mapping functions
    const toCanvasX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Draw Grid
    ctx.strokeStyle = isLight ? '#e2e8f0' : isOled ? '#1f1f23' : '#1e293b';
    ctx.lineWidth = 1;

    // Vertical grid lines
    const xStep = Math.max(1, Math.round((xMax - xMin) / 10));
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      // Label
      if (x !== 0) {
        ctx.fillStyle = isLight ? '#64748b' : '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(String(x), cx + 2, toCanvasY(0) + 12);
      }
    }

    // Horizontal grid lines
    const yStep = Math.max(1, Math.round((yMax - yMin) / 10));
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      if (y !== 0) {
        ctx.fillStyle = isLight ? '#64748b' : '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(String(y), toCanvasX(0) + 4, cy - 2);
      }
    }

    // Zero Axes (X and Y main axes)
    ctx.strokeStyle = isLight ? '#94a3b8' : '#475569';
    ctx.lineWidth = 2;

    // X Axis (y = 0)
    const zeroY = toCanvasY(0);
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();

    // Y Axis (x = 0)
    const zeroX = toCanvasX(0);
    ctx.beginPath();
    ctx.moveTo(zeroX, 0);
    ctx.lineTo(zeroX, height);
    ctx.stroke();

    // Plot Functions using precompiled nodes and capped points (800)
    const MAX_POINTS = Math.min(Math.round(width), 800);
    const step = (xMax - xMin) / MAX_POINTS;

    compiledFns.forEach((c) => {
      if (!c) return;

      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let isDrawing = false;

      for (let i = 0; i <= MAX_POINTS; i++) {
        const xVal = xMin + i * step;
        let yVal: number | null = null;
        try {
          const r = c.compiled.evaluate({ x: xVal });
          if (typeof r === 'number' && isFinite(r)) {
            yVal = r;
          }
        } catch {
          yVal = null;
        }

        if (yVal !== null && yVal >= yMin - 100 && yVal <= yMax + 100) {
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
    });
  }, [xMin, xMax, yMin, yMax, compiledFns, settings.theme]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Handle Mouse Hover to inspect coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const xVal = xMin + (cx / canvas.width) * (xMax - xMin);
    const yVal = yMax - (cy / canvas.height) * (yMax - yMin);

    setHoverCoords({
      x: Math.round(xVal * 100) / 100,
      y: Math.round(yVal * 100) / 100,
    });
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
  };

  const downloadGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'omnicalc-graph.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // Generate Table of Values
  const tableXValues = Array.from({ length: 11 }, (_, i) => xMin + (i * (xMax - xMin)) / 10);

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const cardBg = isLight
    ? 'bg-white border-slate-200 shadow-sm'
    : isOled
    ? 'bg-black border-zinc-800'
    : 'bg-slate-900 border-slate-800 shadow-xl';

  const subCardBg = isLight
    ? 'bg-slate-50 border-slate-200'
    : isOled
    ? 'bg-zinc-950 border-zinc-800/80'
    : 'bg-slate-800/60 border-slate-700/60';

  const textHeading = isLight ? 'text-slate-900' : 'text-slate-100';
  const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';

  const btnSecondary = isLight
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
    : isOled
    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80';

  const inputBg = isLight
    ? 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
    : isOled
    ? 'bg-zinc-900 border-zinc-700 text-slate-100 focus:border-sky-500'
    : 'bg-slate-900 border-slate-700/80 text-slate-100 focus:border-sky-500';

  return (
    <div className="max-w-5xl mx-auto w-full p-4 flex flex-col gap-5">
      {/* Function Input List */}
      <div className={`${cardBg} border rounded-3xl p-4 flex flex-col gap-3 transition-colors`}>
        <div className={`flex items-center justify-between border-b ${isLight ? 'border-slate-200' : 'border-slate-800'} pb-3`}>
          <h3 className={`text-sm font-bold ${textHeading}`}>Equations (y = f(x))</h3>
          <button
            onClick={addFunction}
            disabled={functions.length >= 5}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Equation
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {functions.map((fn) => (
            <div key={fn.id} className={`flex items-center gap-2 ${subCardBg} p-2 rounded-2xl border transition-colors`}>
              <input
                type="checkbox"
                checked={fn.enabled}
                onChange={(e) => updateFunction(fn.id, 'enabled', e.target.checked)}
                className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
              />
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: fn.color }} />
              <span className={`text-xs font-mono font-bold ${textMuted}`}>y =</span>
              <input
                type="text"
                value={fn.expression}
                onChange={(e) => updateFunction(fn.id, 'expression', e.target.value)}
                placeholder="e.g. sin(x), x^2 - 4"
                className={`flex-1 ${inputBg} border rounded-xl px-2.5 py-1 text-sm font-mono focus:outline-none transition-colors`}
              />
              {functions.length > 1 && (
                <button
                  onClick={() => removeFunction(fn.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas Graph Display */}
      <div className={`${cardBg} border rounded-3xl p-4 flex flex-col gap-3 relative transition-colors`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'} pb-3`}>
          {/* Controls Bar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleZoom(0.8)}
              className={`p-2 ${btnSecondary} rounded-xl border transition-all shadow-xs`}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(1.25)}
              className={`p-2 ${btnSecondary} rounded-xl border transition-all shadow-xs`}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className={`p-2 ${btnSecondary} rounded-xl border transition-all shadow-xs`}
              title="Reset View Bounds"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTable(!showTable)}
              className={`p-2 rounded-xl border transition-all shadow-xs ${
                showTable ? 'bg-sky-600 text-white border-sky-500' : `${btnSecondary}`
              }`}
              title="Toggle Value Table"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={downloadGraph}
              className={`p-2 ${btnSecondary} rounded-xl border transition-all shadow-xs`}
              title="Export PNG Image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Bound Inputs */}
          <div className={`flex items-center gap-2 text-xs font-mono ${textMuted}`}>
            <span>X:</span>
            <input
              type="number"
              value={xMin}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) setXMin(v);
              }}
              className={`w-16 ${inputBg} border rounded-lg px-1.5 py-0.5 text-center text-xs`}
            />
            <span>to</span>
            <input
              type="number"
              value={xMax}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) setXMax(v);
              }}
              className={`w-16 ${inputBg} border rounded-lg px-1.5 py-0.5 text-center text-xs`}
            />
          </div>

          {/* Cursor readout */}
          {hoverCoords && (
            <div className={`text-xs font-mono font-semibold ${isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-800/80 text-sky-400 border-slate-700/60'} px-2.5 py-1 rounded-xl border`}>
              (X: {hoverCoords.x}, Y: {hoverCoords.y})
            </div>
          )}
        </div>

        {/* Canvas Element */}
        <div className={`relative w-full aspect-[16/9] max-h-[460px] rounded-2xl overflow-hidden border ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            role="img"
            aria-label={`Interactive 2D Cartesian Function Graph displaying plotted functions from X: ${xMin} to ${xMax}, Y: ${yMin} to ${yMax}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverCoords(null)}
            className="w-full h-full cursor-crosshair block"
          />
        </div>
      </div>

      {/* Values Table */}
      {showTable && (
        <div className={`${cardBg} border rounded-3xl p-4 overflow-x-auto transition-colors`}>
          <h4 className={`text-sm font-bold ${textHeading} mb-3`}>Function Evaluation Table</h4>
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
                <th className="p-2 text-left">x</th>
                {functions.map((fn) => (
                  <th key={fn.id} className="p-2 text-left" style={{ color: fn.color }}>
                    y = {fn.expression || fn.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableXValues.map((xv) => (
                <tr key={xv} className={`border-b ${isLight ? 'border-slate-100 hover:bg-slate-50 text-slate-800' : 'border-slate-800/40 hover:bg-slate-800/40 text-slate-300'}`}>
                  <td className={`p-2 font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{xv.toFixed(2)}</td>
                  {functions.map((fn) => {
                    const yv = fn.expression ? evalFuncAtX(fn.expression, xv) : null;
                    return (
                      <td key={fn.id} className="p-2">
                        {yv !== null ? yv.toFixed(4) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
