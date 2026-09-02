import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import { AppSettings } from '../types';

type MatrixSize = '2x2' | '3x3';

type MatrixResult =
  | { type: 'matrix'; data: number[][]; label: string }
  | { type: 'scalar'; val: number; label: string }
  | { type: 'error'; msg: string; label?: string };

interface MatrixCalculatorProps {
  settings: AppSettings;
}

export const MatrixCalculator: React.FC<MatrixCalculatorProps> = ({ settings }) => {
  const [size, setSize] = useState<MatrixSize>('2x2');

  // Matrix A state
  const [mA, setMA] = useState<number[][]>([
    [1, 2, 0],
    [3, 4, 1],
    [0, 1, 5],
  ]);

  // Matrix B state
  const [mB, setMB] = useState<number[][]>([
    [5, 6, 1],
    [7, 8, 0],
    [1, 0, 2],
  ]);

  const [operation, setOperation] = useState<'add' | 'sub' | 'mul' | 'detA' | 'invA' | 'transA'>(
    'add'
  );

  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const dim = size === '2x2' ? 2 : 3;

  const handleCellChange = (
    matrix: 'A' | 'B',
    r: number,
    c: number,
    valStr: string
  ) => {
    const val = parseFloat(valStr) || 0;
    if (matrix === 'A') {
      const next = mA.map((row, ri) =>
        row.map((col, ci) => (ri === r && ci === c ? val : col))
      );
      setMA(next);
    } else {
      const next = mB.map((row, ri) =>
        row.map((col, ci) => (ri === r && ci === c ? val : col))
      );
      setMB(next);
    }
  };

  // Determinant helper
  const det2x2 = (m: number[][]) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const det3x3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  const getDetA = () => {
    return dim === 2 ? det2x2(mA) : det3x3(mA);
  };

  // Matrix Operations
  const computeResult = (): MatrixResult => {
    if (operation === 'add') {
      const res: number[][] = [];
      for (let r = 0; r < dim; r++) {
        const row: number[] = [];
        for (let c = 0; c < dim; c++) {
          row.push(mA[r][c] + mB[r][c]);
        }
        res.push(row);
      }
      return { type: 'matrix', data: res, label: 'A + B' };
    } else if (operation === 'sub') {
      const res: number[][] = [];
      for (let r = 0; r < dim; r++) {
        const row: number[] = [];
        for (let c = 0; c < dim; c++) {
          row.push(mA[r][c] - mB[r][c]);
        }
        res.push(row);
      }
      return { type: 'matrix', data: res, label: 'A - B' };
    } else if (operation === 'mul') {
      const res: number[][] = [];
      for (let r = 0; r < dim; r++) {
        const row: number[] = [];
        for (let c = 0; c < dim; c++) {
          let sum = 0;
          for (let k = 0; k < dim; k++) {
            sum += mA[r][k] * mB[k][c];
          }
          row.push(sum);
        }
        res.push(row);
      }
      return { type: 'matrix', data: res, label: 'A × B' };
    } else if (operation === 'transA') {
      const res: number[][] = [];
      for (let r = 0; r < dim; r++) {
        const row: number[] = [];
        for (let c = 0; c < dim; c++) {
          row.push(mA[c][r]);
        }
        res.push(row);
      }
      return { type: 'matrix', data: res, label: 'Transpose (Aᵀ)' };
    } else if (operation === 'detA') {
      const det = getDetA();
      return { type: 'scalar', val: det, label: 'Determinant det(A)' };
    } else if (operation === 'invA') {
      const det = getDetA();
      if (Math.abs(det) < 1e-12) {
        return { type: 'error', msg: 'Matrix A is singular (det(A) = 0) and has no inverse.' };
      }
      if (dim === 2) {
        const inv = [
          [mA[1][1] / det, -mA[0][1] / det],
          [-mA[1][0] / det, mA[0][0] / det],
        ];
        return { type: 'matrix', data: inv, label: 'Inverse (A⁻¹)' };
      } else {
        // 3x3 Inverse via adjugate
        const m = mA;
        const adj = [
          [
            det2x2([
              [m[1][1], m[1][2]],
              [m[2][1], m[2][2]],
            ]),
            -det2x2([
              [m[0][1], m[0][2]],
              [m[2][1], m[2][2]],
            ]),
            det2x2([
              [m[0][1], m[0][2]],
              [m[1][1], m[1][2]],
            ]),
          ],
          [
            -det2x2([
              [m[1][0], m[1][2]],
              [m[2][0], m[2][2]],
            ]),
            det2x2([
              [m[0][0], m[0][2]],
              [m[2][0], m[2][2]],
            ]),
            -det2x2([
              [m[0][0], m[0][2]],
              [m[1][0], m[1][2]],
            ]),
          ],
          [
            det2x2([
              [m[1][0], m[1][1]],
              [m[2][0], m[2][1]],
            ]),
            -det2x2([
              [m[0][0], m[0][1]],
              [m[2][0], m[2][1]],
            ]),
            det2x2([
              [m[0][0], m[0][1]],
              [m[1][0], m[1][1]],
            ]),
          ],
        ];
        const inv = adj.map((row) => row.map((col) => col / det));
        return { type: 'matrix', data: inv, label: 'Inverse (A⁻¹)' };
      }
    }
    return { type: 'error', msg: 'Invalid operation' };
  };

  const resObj = computeResult();

  // Export Data Builder
  const exportReportData: ExportReportData = {
    title: `Linear Algebra Matrix Operations (${size})`,
    engine: 'Matrix Engine',
    timestamp: Date.now(),
    inputDescription: `Operation: ${operation}, Dim: ${size}, A: [${mA.slice(0, dim).map((r) => r.slice(0, dim).join(' ')).join(' ; ')}]`,
    resultSummary:
      resObj.type === 'scalar'
        ? String(resObj.val)
        : resObj.type === 'matrix'
          ? resObj.data.map((r) => r.map((n) => n.toFixed(3)).join(', ')).join(' | ')
          : resObj.msg,
    tableHeaders:
      resObj.type === 'matrix'
        ? Array.from({ length: dim }, (_, i) => `Col ${i + 1}`)
        : undefined,
    tableRows:
      resObj.type === 'matrix'
        ? resObj.data.map((r) => r.map((n) => (Math.round(n * 1000) / 1000).toString()))
        : undefined,
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Header & Dimensions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100">Linear Algebra & Matrix Suite</h2>
          <p className="text-xs text-slate-400">
            Operations on 2×2 and 3×3 real matrices: addition, determinant, inverse, transpose
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSize('2x2')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              size === '2x2'
                ? 'bg-sky-600 text-white border-sky-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            2 × 2
          </button>
          <button
            onClick={() => setSize('3x3')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              size === '3x3'
                ? 'bg-sky-600 text-white border-sky-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            3 × 3
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl border border-slate-700 transition-all ml-2"
            title="Export Report"
            aria-label="Export report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Matrix Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matrix A */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Matrix A</span>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: dim }).map((_, r) =>
              Array.from({ length: dim }).map((_, c) => (
                <input
                  key={`A-${r}-${c}`}
                  type="number"
                  aria-label={`Matrix A row ${r + 1} column ${c + 1}`}
                  value={mA[r][c]}
                  onChange={(e) => handleCellChange('A', r, c, e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-center font-mono text-base font-bold text-slate-100 focus:outline-none"
                />
              ))
            )}
          </div>
        </div>

        {/* Matrix B */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Matrix B
          </span>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: dim }).map((_, r) =>
              Array.from({ length: dim }).map((_, c) => (
                <input
                  key={`B-${r}-${c}`}
                  type="number"
                  aria-label={`Matrix B row ${r + 1} column ${c + 1}`}
                  value={mB[r][c]}
                  onChange={(e) => handleCellChange('B', r, c, e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-center font-mono text-base font-bold text-slate-100 focus:outline-none"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Operation Selector */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { id: 'add', label: 'A + B' },
          { id: 'sub', label: 'A − B' },
          { id: 'mul', label: 'A × B' },
          { id: 'detA', label: 'det(A)' },
          { id: 'invA', label: 'A⁻¹' },
          { id: 'transA', label: 'Aᵀ' },
        ].map((op) => (
          <button
            key={op.id}
            onClick={() => setOperation(op.id as any)}
            className={`py-2.5 rounded-2xl font-bold text-xs transition-all border ${
              operation === op.id
                ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Output Display */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Result: {resObj.label}
        </span>

        {resObj.type === 'error' && (
          <div role="alert" className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-2xl">
            {resObj.msg}
          </div>
        )}

        {resObj.type === 'scalar' && (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center">
            <span className="text-4xl font-mono font-bold text-sky-400">{resObj.val}</span>
          </div>
        )}

        {resObj.type === 'matrix' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex items-center justify-center">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
            >
              {resObj.data.map((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`res-${r}-${c}`}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center font-mono text-base font-bold text-emerald-400"
                  >
                    {Number(val.toFixed(3))}
                  </div>
                ))
              )}
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
