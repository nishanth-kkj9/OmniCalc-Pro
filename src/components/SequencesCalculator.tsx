import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, ListOrdered, CheckCircle, Play } from 'lucide-react';
import { AppSettings } from '../types';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import {
  computeSequence,
  SequenceType,
  SequenceParams,
  SequenceResult,
} from '../utils/sequences';

interface SequencesCalculatorProps {
  settings?: AppSettings;
  onNavigateToGraph?: (expression: string) => void;
}

export const SequencesCalculator: React.FC<SequencesCalculatorProps> = ({
  settings: _settings,
  onNavigateToGraph,
}) => {
  const [seqType, setSeqType] = useState<SequenceType>('arithmetic');
  const [a1, setA1] = useState<string>('2');
  const [d, setD] = useState<string>('3');
  const [r, setR] = useState<string>('0.5');
  const [explicitExpr, setExplicitExpr] = useState<string>('1 / (n^2)');
  const [recursiveExpr, setRecursiveExpr] = useState<string>('2 * a_prev + 1');
  const [initialTermsStr, setInitialTermsStr] = useState<string>('1');
  const [numTerms, setNumTerms] = useState<number>(20);
  const [chartMode, setChartMode] = useState<'terms' | 'sums'>('terms');
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sequenceResult: SequenceResult = useMemo(() => {
    const initVals = initialTermsStr
      .split(/[,;\s]+/)
      .map((s) => parseFloat(s))
      .filter((n) => !isNaN(n));

    const params: SequenceParams = {
      type: seqType,
      a1: parseFloat(a1) || 1,
      d: parseFloat(d) || 1,
      r: parseFloat(r) || 0.5,
      explicitExpr,
      recursiveExpr,
      initialTerms: initVals.length > 0 ? initVals : [1],
      numTerms,
      startN: 1,
    };

    return computeSequence(params);
  }, [seqType, a1, d, r, explicitExpr, recursiveExpr, initialTermsStr, numTerms]);

  // Canvas Sequence Plotting
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
    const primaryColor = chartMode === 'terms' ? '#3b82f6' : '#10b981';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const terms = sequenceResult.terms;
    if (!terms || terms.length === 0) return;

    const values = terms.map((t) => (chartMode === 'terms' ? t.an : t.Sn));
    let minY = Math.min(0, ...values);
    let maxY = Math.max(0, ...values);
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }
    const padY = (maxY - minY) * 0.15 || 1;
    minY -= padY;
    maxY += padY;

    const minX = terms[0].n - 0.5;
    const maxX = terms[terms.length - 1].n + 0.5;

    const toScreenX = (n: number) => ((n - minX) / (maxX - minX)) * (width - 70) + 45;
    const toScreenY = (y: number) => height - 35 - ((y - minY) / (maxY - minY)) * (height - 60);

    // Draw Grid & Axes
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const numYTicks = 5;
    for (let i = 0; i <= numYTicks; i++) {
      const gy = minY + (i * (maxY - minY)) / numYTicks;
      const sy = toScreenY(gy);
      ctx.beginPath();
      ctx.moveTo(45, sy);
      ctx.lineTo(width - 20, sy);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(gy.toFixed(2), 40, sy + 3);
    }

    // Zero horizontal line if visible
    if (minY <= 0 && maxY >= 0) {
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1.5;
      const zeroY = toScreenY(0);
      ctx.beginPath();
      ctx.moveTo(45, zeroY);
      ctx.lineTo(width - 20, zeroY);
      ctx.stroke();
    }

    // Draw Stems and Points
    for (let i = 0; i < terms.length; i++) {
      const t = terms[i];
      const val = chartMode === 'terms' ? t.an : t.Sn;
      const sx = toScreenX(t.n);
      const sy = toScreenY(val);
      const sZero = toScreenY(0);

      // Vertical stem
      ctx.strokeStyle = isDark ? '#3f3f46' : '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(sx, sZero);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // X labels
      if (terms.length <= 25 || i % Math.ceil(terms.length / 15) === 0) {
        ctx.fillStyle = textColor;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`n=${t.n}`, sx, height - 15);
      }
    }

    // Connect line between points
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < terms.length; i++) {
      const t = terms[i];
      const val = chartMode === 'terms' ? t.an : t.Sn;
      const sx = toScreenX(t.n);
      const sy = toScreenY(val);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }, [sequenceResult, chartMode]);

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const exportData: ExportReportData = {
    title: 'Sequences & Series Analysis Report',
    engine: 'Sequences Engine',
    timestamp: Date.now(),
    inputDescription: `Sequence Type: ${seqType}, Terms computed: ${sequenceResult.terms.length}`,
    resultSummary: `Formula: ${sequenceResult.closedFormFormula || 'N/A'}, Convergence: ${sequenceResult.convergence.isConvergent ? 'Convergent' : 'Divergent'}, Limit: ${sequenceResult.convergence.estimatedLimit !== undefined ? sequenceResult.convergence.estimatedLimit.toFixed(6) : 'N/A'}`,
    tableHeaders: ['n', 'a_n', 'S_n', 'diff', 'ratio'],
    tableRows: sequenceResult.terms.map((t) => [
      t.n,
      t.an,
      t.Sn,
      t.diff !== undefined ? t.diff : '',
      t.ratio !== undefined ? t.ratio.toFixed(4) : '',
    ]),
  };

  return (
    <div id="sequences-calculator-root" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4 lg:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Sequences & Series Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Explicit & recursive progressions, partial sums, tables, and convergence testing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {seqType === 'explicit' && onNavigateToGraph && (
            <button
              id="seq-plot-graph-btn"
              onClick={() => onNavigateToGraph(explicitExpr.replace(/\bn\b/g, 'x'))}
              className="px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-4 h-4" /> Graph as f(x)
            </button>
          )}

          <button
            id="seq-export-btn"
            onClick={handleExport}
            className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Sequence Configuration (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Sequence Type Selector */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">
              Sequence Type
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'arithmetic', label: 'Arithmetic', desc: 'a + (n-1)d' },
                { id: 'geometric', label: 'Geometric', desc: 'a · r^(n-1)' },
                { id: 'fibonacci', label: 'Fibonacci', desc: 'F_n-1 + F_n-2' },
                { id: 'explicit', label: 'Explicit f(n)', desc: 'Formula in n' },
                { id: 'recursive', label: 'Recursive', desc: 'f(a_prev, n)' },
              ].map((item) => (
                <button
                  key={item.id}
                  id={`seq-type-${item.id}`}
                  onClick={() => setSeqType(item.id as SequenceType)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    seqType === item.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div>{item.label}</div>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters Input */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">
              Sequence Parameters
            </span>

            <div className="space-y-3">
              {seqType === 'arithmetic' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block mb-1">
                      First Term (a₁)
                    </label>
                    <input
                      id="seq-a1"
                      type="number"
                      step="any"
                      value={a1}
                      onChange={(e) => setA1(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block mb-1">
                      Common Diff (d)
                    </label>
                    <input
                      id="seq-d"
                      type="number"
                      step="any"
                      value={d}
                      onChange={(e) => setD(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {seqType === 'geometric' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block mb-1">
                      First Term (a₁)
                    </label>
                    <input
                      id="seq-geo-a1"
                      type="number"
                      step="any"
                      value={a1}
                      onChange={(e) => setA1(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block mb-1">
                      Common Ratio (r)
                    </label>
                    <input
                      id="seq-geo-r"
                      type="number"
                      step="any"
                      value={r}
                      onChange={(e) => setR(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {seqType === 'explicit' && (
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block mb-1">
                    Expression a_n = f(n)
                  </label>
                  <input
                    id="seq-explicit-expr"
                    type="text"
                    value={explicitExpr}
                    placeholder="e.g. 1/n^2, (-1)^n / (2*n + 1)"
                    onChange={(e) => setExplicitExpr(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                  />
                </div>
              )}

              {seqType === 'recursive' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block mb-1">
                      Recurrence Relation a_n = f(a_prev, a_prev2, n)
                    </label>
                    <input
                      id="seq-recursive-expr"
                      type="text"
                      value={recursiveExpr}
                      placeholder="e.g. 2 * a_prev + 1, a_prev1 + a_prev2"
                      onChange={(e) => setRecursiveExpr(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block mb-1">
                      Initial Seed Values (comma separated)
                    </label>
                    <input
                      id="seq-initial-seeds"
                      type="text"
                      value={initialTermsStr}
                      placeholder="e.g. 1 or 1, 1"
                      onChange={(e) => setInitialTermsStr(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {/* Number of terms slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-zinc-300">
                    Number of Terms (N)
                  </span>
                  <span className="font-mono text-slate-500">{numTerms}</span>
                </div>
                <input
                  id="seq-num-terms"
                  type="range"
                  min="5"
                  max="100"
                  value={numTerms}
                  onChange={(e) => setNumTerms(parseInt(e.target.value) || 20)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Formulas & Convergence Notes */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              Formulas & Convergence
            </span>

            {sequenceResult.closedFormFormula && (
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
                <span className="text-[11px] text-slate-400 block">General Term:</span>
                <span className="text-xs font-mono font-semibold text-slate-800 dark:text-zinc-100">
                  {sequenceResult.closedFormFormula}
                </span>
              </div>
            )}

            {sequenceResult.sumFormula && (
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
                <span className="text-[11px] text-slate-400 block">Sum of First n Terms:</span>
                <span className="text-xs font-mono font-semibold text-slate-800 dark:text-zinc-100">
                  {sequenceResult.sumFormula}
                </span>
              </div>
            )}

            {sequenceResult.convergence.notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-400">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Visualization Plot & Terms Data Table (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Chart Display */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Sequence Plot
              </span>

              <div className="flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5 text-xs font-medium">
                <button
                  id="seq-view-terms"
                  onClick={() => setChartMode('terms')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    chartMode === 'terms'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Terms (a_n)
                </button>
                <button
                  id="seq-view-sums"
                  onClick={() => setChartMode('sums')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    chartMode === 'sums'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Partial Sums (S_n)
                </button>
              </div>
            </div>

            <div className="w-full flex justify-center bg-slate-50 dark:bg-zinc-950 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800">
              <canvas
                ref={canvasRef}
                width={650}
                height={280}
                className="w-full max-w-full h-auto"
              />
            </div>
          </div>

          {/* Computed Table */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">
              Computed Values Table ({sequenceResult.terms.length} terms)
            </span>

            <div className="max-h-72 overflow-y-auto border border-slate-100 dark:border-zinc-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 text-slate-500 font-medium">n</th>
                    <th className="py-2 px-3 text-slate-500 font-medium">a_n (Term)</th>
                    <th className="py-2 px-3 text-slate-500 font-medium">S_n (Sum)</th>
                    <th className="py-2 px-3 text-slate-500 font-medium">Δ a_n (Diff)</th>
                    <th className="py-2 px-3 text-slate-500 font-medium">Ratio (a_n / a_n-1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {sequenceResult.terms.map((t) => (
                    <tr key={t.n} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                      <td className="py-1.5 px-3 text-slate-400">{t.n}</td>
                      <td className="py-1.5 px-3 font-semibold text-blue-600 dark:text-blue-400">
                        {t.an.toFixed(5).replace(/\.?0+$/, '')}
                      </td>
                      <td className="py-1.5 px-3 text-emerald-600 dark:text-emerald-400">
                        {t.Sn.toFixed(5).replace(/\.?0+$/, '')}
                      </td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-zinc-400">
                        {t.diff !== undefined ? t.diff.toFixed(4) : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-zinc-400">
                        {t.ratio !== undefined && isFinite(t.ratio) ? t.ratio.toFixed(5) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
export default SequencesCalculator;
