import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Plus, Trash2, Eye, EyeOff, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { evaluateExpression } from '../utils/calculator';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import { AppSettings } from '../types';

interface FunctionItem {
  id: string;
  expr: string;
  color: string;
  visible: boolean;
}

const DEFAULT_COLORS = ['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a78bfa'];

interface GraphingCalculatorProps {
  settings: AppSettings;
}

export const GraphingCalculator: React.FC<GraphingCalculatorProps> = ({ settings }) => {
  const [functions, setFunctions] = useState<FunctionItem[]>([
    { id: '1', expr: 'sin(x)', color: '#38bdf8', visible: true },
    { id: '2', expr: 'x^2 - 4', color: '#34d399', visible: true },
  ]);

  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-10);
  const [yMax, setYMax] = useState<number>(10);

  const [hoverPos, setHoverPos] = useState<{
    xMath: number;
    yMath: number;
    pixelX: number;
    pixelY: number;
  } | null>(null);
  const [showValueTable, setShowValueTable] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw canvas
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // Coordinate conversion
    const toPixelX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toPixelY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Draw Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b'; // slate-800

    // Grid X lines
    const xStep = Math.max(1, Math.pow(10, Math.floor(Math.log10(xMax - xMin)))) / 2;
    for (
      let x = Math.ceil(xMin / xStep) * xStep;
      x <= xMax;
      x += xStep
    ) {
      const px = toPixelX(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }

    // Grid Y lines
    const yStep = Math.max(1, Math.pow(10, Math.floor(Math.log10(yMax - yMin)))) / 2;
    for (
      let y = Math.ceil(yMin / yStep) * yStep;
      y <= yMax;
      y += yStep
    ) {
      const py = toPixelY(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }

    // Draw Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#64748b'; // slate-500

    // X Axis
    const yZeroPixel = toPixelY(0);
    ctx.beginPath();
    ctx.moveTo(0, yZeroPixel);
    ctx.lineTo(width, yZeroPixel);
    ctx.stroke();

    // Y Axis
    const xZeroPixel = toPixelX(0);
    ctx.beginPath();
    ctx.moveTo(xZeroPixel, 0);
    ctx.lineTo(xZeroPixel, height);
    ctx.stroke();

    // Axis Labels & Ticks
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';

    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) > 1e-9) {
        const px = toPixelX(x);
        ctx.fillText(x.toString(), px - 8, Math.min(height - 5, Math.max(15, yZeroPixel + 15)));
      }
    }

    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (Math.abs(y) > 1e-9) {
        const py = toPixelY(y);
        ctx.fillText(y.toString(), Math.min(width - 25, Math.max(5, xZeroPixel + 5)), py + 3);
      }
    }

    // Plot Functions
    const numPoints = width * 2;
    const dx = (xMax - xMin) / numPoints;

    functions.forEach((fn) => {
      if (!fn.visible || !fn.expr.trim()) return;

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = fn.color;
      ctx.beginPath();

      let isDrawing = false;

      for (let i = 0; i <= numPoints; i++) {
        const xMath = xMin + i * dx;
        const exprWithX = fn.expr.replace(/x/g, `(${xMath})`);
        const resStr = evaluateExpression(exprWithX, settings.angleMode, settings.precision);
        const yMath = parseFloat(resStr);

        if (!isNaN(yMath) && isFinite(yMath)) {
          const px = toPixelX(xMath);
          const py = toPixelY(yMath);

          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            // Prevent drawing extreme asymptote jumps
            if (Math.abs(py - toPixelY(yMin)) < height * 3) {
              ctx.lineTo(px, py);
            } else {
              isDrawing = false;
            }
          }
        } else {
          isDrawing = false;
        }
      }

      ctx.stroke();
    });

    // Draw hover cursor circle
    if (hoverPos) {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(hoverPos.pixelX, hoverPos.pixelY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [functions, xMin, xMax, yMin, yMax, hoverPos, settings]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Handle Canvas Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    const xMath = xMin + (pixelX / canvas.width) * (xMax - xMin);
    const yMath = yMax - (pixelY / canvas.height) * (yMax - yMin);

    setHoverPos({
      xMath: Math.round(xMath * 100) / 100,
      yMath: Math.round(yMath * 100) / 100,
      pixelX,
      pixelY,
    });
  };

  const addFunction = () => {
    const nextColor = DEFAULT_COLORS[functions.length % DEFAULT_COLORS.length];
    setFunctions((prev) => [
      ...prev,
      { id: Date.now().toString(), expr: '', color: nextColor, visible: true },
    ]);
  };

  const removeFunction = (id: string) => {
    setFunctions((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFunction = (id: string, key: keyof FunctionItem, val: any) => {
    setFunctions((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'omnicalc_graph.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // Generate Table of Values (-5 to 5)
  const generateTableData = () => {
    const rows = [];
    for (let x = -5; x <= 5; x += 1) {
      const row: { x: number; [key: string]: number | string } = { x };
      functions.forEach((fn, idx) => {
        if (fn.expr.trim()) {
          const exprWithX = fn.expr.replace(/x/g, `(${x})`);
          const res = evaluateExpression(exprWithX, settings.angleMode, settings.precision);
          row[`f${idx + 1}`] = res !== 'Error' ? parseFloat(res) : 'Error';
        }
      });
      rows.push(row);
    }
    return rows;
  };

  const tableData = generateTableData();

  // Export Data Builder
  const activeFns = functions.filter((f) => f.expr.trim());
  const exportReportData: ExportReportData = {
    title: 'Multi-Function Cartesian Graphing Analysis',
    engine: 'Graphing Engine',
    timestamp: Date.now(),
    inputDescription: activeFns.map((f, i) => `f${i + 1}(x) = ${f.expr}`).join(', ') || 'No functions',
    resultSummary: `Domain [${xMin}, ${xMax}], Range [${yMin}, ${yMax}]`,
    tableHeaders: ['x', ...activeFns.map((_, i) => `f${i + 1}(x)`)],
    tableRows: tableData.map((row) => [
      row.x.toString(),
      ...activeFns.map((_, i) => (row[`f${i + 1}`] !== undefined ? String(row[`f${i + 1}`]) : '-')),
    ]),
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 flex flex-col lg:flex-row gap-6">
      {/* Control Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-5">
        {/* Function Inputs */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100">Functions y = f(x)</h3>
            <button
              onClick={addFunction}
              className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
            {functions.map((fn, idx) => (
              <div key={fn.id} className="flex items-center gap-2">
                <button
                  onClick={() => updateFunction(fn.id, 'visible', !fn.visible)}
                  className="p-1.5 text-slate-400 hover:text-slate-200"
                  aria-label={fn.visible ? "Hide function" : "Show function"}
                >
                  {fn.visible ? (
                    <Eye className="w-4 h-4 text-sky-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <input
                  type="color"
                  value={fn.color}
                  onChange={(e) => updateFunction(fn.id, 'color', e.target.value)}
                  className="w-6 h-6 rounded-lg bg-transparent border-none cursor-pointer"
                  aria-label={`Color for function ${idx + 1}`}
                />

                <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 focus-within:border-sky-500 rounded-xl px-2.5 py-1.5">
                  <span className="text-xs font-mono text-slate-400 mr-1.5 font-bold">
                    f{idx + 1}(x)=
                  </span>
                  <input
                    type="text"
                    value={fn.expr}
                    onChange={(e) => updateFunction(fn.id, 'expr', e.target.value)}
                    placeholder="e.g. sin(x) or x^2"
                    aria-label={`Expression for function ${idx + 1}`}
                    className="w-full bg-transparent text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>

                {functions.length > 1 && (
                  <button
                    onClick={() => removeFunction(fn.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                    aria-label="Remove function"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Viewport Bounds */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200">Window Bounds</span>
            <button
              onClick={() => {
                setXMin(-10);
                setXMax(10);
                setYMin(-10);
                setYMax(10);
              }}
              className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Standard
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <label className="text-slate-400 block text-[10px] mb-1">xMin</label>
              <input
                type="number"
                value={xMin}
                onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block text-[10px] mb-1">xMax</label>
              <input
                type="number"
                value={xMax}
                onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block text-[10px] mb-1">yMin</label>
              <input
                type="number"
                value={yMin}
                onChange={(e) => setYMin(parseFloat(e.target.value) || -10)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block text-[10px] mb-1">yMax</label>
              <input
                type="number"
                value={yMax}
                onChange={(e) => setYMax(parseFloat(e.target.value) || 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowValueTable(!showValueTable)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            {showValueTable ? 'Hide Table of Values' : 'View Numerical Table'}
          </button>

          <button
            onClick={downloadCanvasImage}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-sky-400" /> Export Plot PNG
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-600/20"
          >
            <Download className="w-4 h-4" /> Full Report & LaTeX
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Hover Coordinates:{' '}
              {hoverPos ? (
                <span className="text-sky-400 font-bold">
                  x = {hoverPos.xMath}, y = {hoverPos.yMath}
                </span>
              ) : (
                'Move cursor over graph'
              )}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500">
              Interactive HTML5 Canvas
            </span>
          </div>

          <div className="relative w-full aspect-square max-h-[520px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverPos(null)}
              className="w-full h-full cursor-crosshair"
            />
          </div>
        </div>

        {/* Value Table Drawer */}
        {showValueTable && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sampled Function Table (-5 ≤ x ≤ 5)
            </h4>
            <div className="overflow-x-auto max-h-52 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-2">x</th>
                    {activeFns.map((f, i) => (
                      <th key={i} className="p-2" style={{ color: f.color }}>
                        f{i + 1}(x) = {f.expr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.x} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-slate-100">{row.x}</td>
                      {activeFns.map((_, i) => (
                        <td key={i} className="p-2">
                          {row[`f${i + 1}`]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={exportReportData}
        settings={settings}
      />
    </div>
  );
};
