import React, { useState, useMemo } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { GraphExpression, Point2D } from '../../types';
import { CompiledSafeExpression } from '../../utils/calculator';
import { downloadTableAsCsv } from '../../utils/graphExport';
import { MAX_TABLE_ROWS } from '../../constants/limits';

export interface GraphTableProps {
  expressions: GraphExpression[];
  compiledMap: Map<string, CompiledSafeExpression>;
  compiledParametricYMap?: Map<string, CompiledSafeExpression>;
  sliderScope: Record<string, number>;
  onSelectRowPoint: (pt: Point2D) => void;
  theme: 'dark' | 'light' | 'oled';
}

export const GraphTable: React.FC<GraphTableProps> = ({
  expressions,
  compiledMap,
  compiledParametricYMap,
  sliderScope,
  onSelectRowPoint,
  theme: _theme,
}) => {
  const [xStart, setXStart] = useState<number>(-5);
  const [xEnd, setXEnd] = useState<number>(5);
  const [xStep, setXStep] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const visibleExpressions = useMemo(() => expressions.filter((e) => e.visible), [expressions]);

  // Determine parameter label based on active curve types
  const paramLabel = useMemo(() => {
    if (visibleExpressions.length === 0) return 'x';
    const allParametric = visibleExpressions.every((e) => e.type === 'parametric');
    if (allParametric) return 't';
    const allPolar = visibleExpressions.every((e) => e.type === 'polar');
    if (allPolar) return 'θ';
    return 'x';
  }, [visibleExpressions]);

  // Generate table rows
  const { headers, rows, rowGraphPoints } = useMemo(() => {
    const head = [paramLabel, ...visibleExpressions.map((e) => e.label || e.expression)];
    const dataRows: (number | string)[][] = [];
    const points: Point2D[] = [];

    const start = Math.min(xStart, xEnd);
    const end = Math.max(xStart, xEnd);
    const step = Math.max(0.001, Math.abs(xStep));

    let count = 0;
    for (let p = start; p <= end + step * 0.01 && count < MAX_TABLE_ROWS; p += step) {
      const cleanP = Number(p.toFixed(6));
      const row: (number | string)[] = [cleanP];
      let firstPoint: Point2D | null = null;

      for (const expr of visibleExpressions) {
        const type = expr.type || 'function';

        if (type === 'parametric') {
          const compX = compiledMap.get(expr.id);
          const compY =
            compiledParametricYMap?.get(expr.id) || compiledMap.get(`${expr.id}_y`);

          if (!compX || !compY) {
            row.push('Err');
            continue;
          }
          if (expr.tMin !== undefined && cleanP < expr.tMin) {
            row.push('–');
            continue;
          }
          if (expr.tMax !== undefined && cleanP > expr.tMax) {
            row.push('–');
            continue;
          }

          try {
            const xVal = compX.evaluate({ ...sliderScope, t: cleanP, x: cleanP });
            const yVal = compY.evaluate({ ...sliderScope, t: cleanP, x: cleanP });
            if (
              xVal === null ||
              yVal === null ||
              !Number.isFinite(xVal) ||
              !Number.isFinite(yVal)
            ) {
              row.push('Undefined');
            } else {
              row.push(`(${Number(xVal.toFixed(3))}, ${Number(yVal.toFixed(3))})`);
              if (!firstPoint) firstPoint = { x: xVal, y: yVal };
            }
          } catch {
            row.push('Err');
          }
        } else if (type === 'polar') {
          const compiled = compiledMap.get(expr.id);
          if (!compiled) {
            row.push('Err');
            continue;
          }
          if (expr.thetaMin !== undefined && cleanP < expr.thetaMin) {
            row.push('–');
            continue;
          }
          if (expr.thetaMax !== undefined && cleanP > expr.thetaMax) {
            row.push('–');
            continue;
          }

          try {
            const r = compiled.evaluate({
              ...sliderScope,
              theta: cleanP,
              θ: cleanP,
              t: cleanP,
              x: cleanP,
            });
            if (r === null || !Number.isFinite(r)) {
              row.push('Undefined');
            } else {
              const rClean = Number(r.toFixed(4));
              row.push(rClean);
              if (!firstPoint) {
                firstPoint = {
                  x: rClean * Math.cos(cleanP),
                  y: rClean * Math.sin(cleanP),
                };
              }
            }
          } catch {
            row.push('Err');
          }
        } else {
          // Standard function or inequality
          const compiled = compiledMap.get(expr.id);
          if (!compiled) {
            row.push('Err');
            continue;
          }
          if (expr.domainMin !== undefined && cleanP < expr.domainMin) {
            row.push('–');
            continue;
          }
          if (expr.domainMax !== undefined && cleanP > expr.domainMax) {
            row.push('–');
            continue;
          }

          try {
            const y = compiled.evaluate({ ...sliderScope, x: cleanP });
            if (y === null || !Number.isFinite(y)) {
              row.push('Undefined');
            } else {
              const yClean = Number(y.toFixed(5));
              row.push(yClean);
              if (!firstPoint) firstPoint = { x: cleanP, y: yClean };
            }
          } catch {
            row.push('Err');
          }
        }
      }

      dataRows.push(row);
      points.push(firstPoint || { x: cleanP, y: 0 });
      count++;
    }

    return { headers: head, rows: dataRows, rowGraphPoints: points };
  }, [
    paramLabel,
    xStart,
    xEnd,
    xStep,
    visibleExpressions,
    compiledMap,
    compiledParametricYMap,
    sliderScope,
  ]);

  const handleCopy = () => {
    const text = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');

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
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
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
                    onClick={() => onSelectRowPoint(rowGraphPoints[rIdx] || { x: xVal, y: firstY })}
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
