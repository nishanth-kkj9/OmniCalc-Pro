import React, { useState, useMemo } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { GraphExpression, Point2D } from '../../types';
import { CompiledSafeExpression } from '../../utils/calculator';
import { downloadTableAsCsv } from '../../utils/graphExport';
import { MAX_TABLE_ROWS } from '../../constants/limits';

export interface GraphTableProps {
  expressions: GraphExpression[];
  compiledMap: Map<string, CompiledSafeExpression>;
  sliderScope: Record<string, number>;
  onSelectRowPoint: (pt: Point2D) => void;
  theme: 'dark' | 'light' | 'oled';
}

export const GraphTable: React.FC<GraphTableProps> = ({
  expressions,
  compiledMap,
  sliderScope,
  onSelectRowPoint,
  theme: _theme,
}) => {
  const [xStart, setXStart] = useState<number>(-5);
  const [xEnd, setXEnd] = useState<number>(5);
  const [xStep, setXStep] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const visibleExpressions = useMemo(
    () => expressions.filter((e) => e.visible),
    [expressions]
  );

  // Generate table rows
  const { headers, rows } = useMemo(() => {
    const head = ['x', ...visibleExpressions.map((e) => e.label || `y = ${e.expression}`)];
    const dataRows: (number | string)[][] = [];

    const start = Math.min(xStart, xEnd);
    const end = Math.max(xStart, xEnd);
    const step = Math.max(0.001, Math.abs(xStep));

    let count = 0;
    for (let x = start; x <= end + step * 0.01 && count < MAX_TABLE_ROWS; x += step) {
      const cleanX = Number(x.toFixed(6));
      const row: (number | string)[] = [cleanX];

      for (const expr of visibleExpressions) {
        const compiled = compiledMap.get(expr.id);
        if (!compiled) {
          row.push('Err');
          continue;
        }

        // Domain check
        if (expr.domainMin !== undefined && cleanX < expr.domainMin) {
          row.push('–');
          continue;
        }
        if (expr.domainMax !== undefined && cleanX > expr.domainMax) {
          row.push('–');
          continue;
        }

        try {
          const y = compiled.evaluate({ ...sliderScope, x: cleanX });
          if (y === null || !Number.isFinite(y)) {
            row.push('Undefined');
          } else {
            row.push(Number(y.toFixed(5)));
          }
        } catch {
          row.push('Err');
        }
      }

      dataRows.push(row);
      count++;
    }

    return { headers: head, rows: dataRows };
  }, [xStart, xEnd, xStep, visibleExpressions, compiledMap, sliderScope]);

  const handleCopy = () => {
    const text = [
      headers.join('\t'),
      ...rows.map((r) => r.join('\t')),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleExportCsv = () => {
    downloadTableAsCsv(headers, rows);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Table Parameters Header */}
      <div className="p-3 border-b border-slate-700/50 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Start:</span>
            <input
              type="number"
              value={xStart}
              onChange={(e) => setXStart(parseFloat(e.target.value) || 0)}
              className="w-16 px-1.5 py-0.5 rounded-lg text-xs font-mono bg-slate-800 border border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">End:</span>
            <input
              type="number"
              value={xEnd}
              onChange={(e) => setXEnd(parseFloat(e.target.value) || 0)}
              className="w-16 px-1.5 py-0.5 rounded-lg text-xs font-mono bg-slate-800 border border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Step:</span>
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={xStep}
              onChange={(e) => setXStep(Math.max(0.01, parseFloat(e.target.value) || 1))}
              className="w-16 px-1.5 py-0.5 rounded-lg text-xs font-mono bg-slate-800 border border-slate-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-1 transition-colors"
            title="Copy table to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-1 transition-colors shadow-xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table Data View */}
      <div className="flex-1 overflow-auto">
        {visibleExpressions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No visible expressions. Please enable or add a function in the Functions tab.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-xs border-b border-slate-700 z-10">
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-slate-300 font-bold border-r border-slate-700/60 last:border-r-0 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((row, rIdx) => {
                const xVal = row[0] as number;
                const firstY = typeof row[1] === 'number' ? (row[1] as number) : 0;
                return (
                  <tr
                    key={rIdx}
                    onClick={() => onSelectRowPoint({ x: xVal, y: firstY })}
                    className="hover:bg-sky-500/10 cursor-pointer transition-colors"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-3 py-1.5 border-r border-slate-800/40 last:border-r-0 whitespace-nowrap ${
                          cIdx === 0
                            ? 'font-bold text-sky-400 bg-slate-900/20'
                            : typeof cell === 'number'
                              ? 'text-slate-200'
                              : 'text-slate-500 italic'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      <div className="p-2 border-t border-slate-700/50 text-[10px] text-slate-400 flex items-center justify-between bg-slate-900/40 flex-shrink-0">
        <span>Showing {rows.length} points</span>
        <span>Click any row to trace point on graph</span>
      </div>
    </div>
  );
};
