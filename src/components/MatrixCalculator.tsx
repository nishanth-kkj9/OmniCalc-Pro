import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import { AppSettings } from '../types';
import {
  matrixDet,
  matrixTrace,
  matrixTranspose,
  matrixAdd,
  matrixSub,
  matrixMul,
  matrixScalarMul,
  matrixPower,
  matrixInverse,
  matrixRREF,
  matrixEigenvalues,
  EigenResult,
} from '../utils/matrixEngine';

type MatrixSize = '2x2' | '3x3';

type MatrixOperation =
  | 'add'
  | 'sub'
  | 'mul'
  | 'detA'
  | 'invA'
  | 'transA'
  | 'traceA'
  | 'rankA'
  | 'rrefA'
  | 'eigA'
  | 'powerA'
  | 'scalarA';

type MatrixResult =
  | { type: 'matrix'; data: number[][]; label: string }
  | { type: 'scalar'; val: number | string; label: string }
  | { type: 'eigen'; data: EigenResult[]; label: string }
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

  const [operation, setOperation] = useState<MatrixOperation>('add');
  const [scalarK, setScalarK] = useState<number>(2);
  const [powerN, setPowerN] = useState<number>(2);
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

  const currentA = mA.slice(0, dim).map((row) => row.slice(0, dim));
  const currentB = mB.slice(0, dim).map((row) => row.slice(0, dim));

  // Compute result using matrixEngine
  const computeResult = (): MatrixResult => {
    try {
      switch (operation) {
        case 'add':
          return {
            type: 'matrix',
            data: matrixAdd(currentA, currentB),
            label: 'A + B',
          };
        case 'sub':
          return {
            type: 'matrix',
            data: matrixSub(currentA, currentB),
            label: 'A − B',
          };
        case 'mul':
          return {
            type: 'matrix',
            data: matrixMul(currentA, currentB),
            label: 'A × B',
          };
        case 'transA':
          return {
            type: 'matrix',
            data: matrixTranspose(currentA),
            label: 'Transpose (Aᵀ)',
          };
        case 'detA':
          return {
            type: 'scalar',
            val: Number(matrixDet(currentA).toFixed(6)),
            label: 'Determinant det(A)',
          };
        case 'traceA':
          return {
            type: 'scalar',
            val: Number(matrixTrace(currentA).toFixed(6)),
            label: 'Trace Tr(A)',
          };
        case 'invA':
          return {
            type: 'matrix',
            data: matrixInverse(currentA),
            label: 'Inverse (A⁻¹)',
          };
        case 'rankA': {
          const { rank } = matrixRREF(currentA);
          return {
            type: 'scalar',
            val: `Rank(A) = ${rank} (Nullity = ${dim - rank})`,
            label: 'Matrix Rank & Nullity',
          };
        }
        case 'rrefA': {
          const { rref } = matrixRREF(currentA);
          return {
            type: 'matrix',
            data: rref,
            label: 'Reduced Row Echelon Form RREF(A)',
          };
        }
        case 'eigA':
          return {
            type: 'eigen',
            data: matrixEigenvalues(currentA),
            label: 'Eigenvalues λ of A',
          };
        case 'powerA':
          return {
            type: 'matrix',
            data: matrixPower(currentA, powerN),
            label: `Matrix Power (A^${powerN})`,
          };
        case 'scalarA':
          return {
            type: 'matrix',
            data: matrixScalarMul(currentA, scalarK),
            label: `Scalar Multiplication (${scalarK} × A)`,
          };
        default:
          return { type: 'error', msg: 'Invalid operation' };
      }
    } catch (err: any) {
      return { type: 'error', msg: err.message || 'Computation error' };
    }
  };

  const resObj = computeResult();

  // Export Data Builder
  const exportReportData: ExportReportData = {
    title: `Linear Algebra Matrix Operations (${size})`,
    engine: 'Matrix Engine',
    timestamp: Date.now(),
    inputDescription: `Operation: ${operation}, Dim: ${size}, A: [${currentA.map((r) => r.join(' ')).join(' ; ')}]`,
    resultSummary:
      resObj.type === 'scalar'
        ? String(resObj.val)
        : resObj.type === 'matrix'
          ? resObj.data.map((r) => r.map((n) => n.toFixed(3)).join(', ')).join(' | ')
          : resObj.type === 'eigen'
            ? resObj.data
                .map((e) =>
                  e.imag !== 0
                    ? `${e.real.toFixed(3)} ${e.imag > 0 ? '+' : '-'} ${Math.abs(e.imag).toFixed(3)}i`
                    : e.real.toFixed(3)
                )
                .join(', ')
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
            2×2 and 3×3 real matrices: arithmetic, determinant, inverse, eigenvalues, rank, RREF, power
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

        {/* Matrix B / Scalar Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Matrix B / Scalar Parameter
            </span>
            {operation === 'scalarA' && (
              <span className="text-xs text-slate-400 font-mono">k = {scalarK}</span>
            )}
            {operation === 'powerA' && (
              <span className="text-xs text-slate-400 font-mono">n = {powerN}</span>
            )}
          </div>

          {operation === 'scalarA' ? (
            <div className="flex flex-col gap-2 my-auto">
              <label className="text-xs text-slate-300">Scalar multiplier k:</label>
              <input
                type="number"
                value={scalarK}
                onChange={(e) => setScalarK(parseFloat(e.target.value) || 0)}
                className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-center font-mono text-base font-bold text-slate-100"
              />
            </div>
          ) : operation === 'powerA' ? (
            <div className="flex flex-col gap-2 my-auto">
              <label className="text-xs text-slate-300">Exponent n (integer ≥ 0):</label>
              <input
                type="number"
                min="0"
                max="10"
                value={powerN}
                onChange={(e) => setPowerN(parseInt(e.target.value) || 0)}
                className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-center font-mono text-base font-bold text-slate-100"
              />
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Operation Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {[
          { id: 'add', label: 'A + B' },
          { id: 'sub', label: 'A − B' },
          { id: 'mul', label: 'A × B' },
          { id: 'detA', label: 'det(A)' },
          { id: 'invA', label: 'A⁻¹' },
          { id: 'transA', label: 'Aᵀ' },
          { id: 'traceA', label: 'Tr(A)' },
          { id: 'rankA', label: 'Rank(A)' },
          { id: 'rrefA', label: 'RREF(A)' },
          { id: 'eigA', label: 'Eigen λ' },
          { id: 'powerA', label: 'Aⁿ Power' },
          { id: 'scalarA', label: 'k · A' },
        ].map((op) => (
          <button
            key={op.id}
            onClick={() => setOperation(op.id as MatrixOperation)}
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
            <span className="text-2xl sm:text-3xl font-mono font-bold text-sky-400">
              {resObj.val}
            </span>
          </div>
        )}

        {resObj.type === 'eigen' && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-2">
            {resObj.data.map((e, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-900 rounded-xl font-mono text-sm"
              >
                <span className="text-purple-400 font-bold">λ_{idx + 1}:</span>
                <span className="text-slate-100 font-semibold">
                  {e.imag !== 0
                    ? `${e.real.toFixed(4)} ${e.imag > 0 ? '+' : '-'} ${Math.abs(e.imag).toFixed(4)}i`
                    : e.real.toFixed(4)}
                </span>
              </div>
            ))}
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

export default MatrixCalculator;
