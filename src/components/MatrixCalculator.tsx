import React, { useState } from 'react';
import { addHistory } from '../utils/history';
import { AppSettings } from '../types';
import {
  Matrix,
  computeDeterminant,
  invertMatrix,
  transposeMatrix,
  addMatrices,
  subtractMatrices,
  multiplyMatrices,
} from '../utils/matrix';
import { Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';

interface MatrixCalculatorProps {
  settings: AppSettings;
}

export const MatrixCalculator: React.FC<MatrixCalculatorProps> = ({ settings }) => {
  const [rowsA, setRowsA] = useState<number>(3);
  const [colsA, setColsA] = useState<number>(3);
  const [matA, setMatA] = useState<Matrix>([
    [1, 2, 3],
    [0, 1, 4],
    [5, 6, 0],
  ]);

  const [rowsB, setRowsB] = useState<number>(3);
  const [colsB, setColsB] = useState<number>(3);
  const [matB, setMatB] = useState<Matrix>([
    [2, 0, -1],
    [1, 3, 2],
    [0, -2, 1],
  ]);

  const [resultMat, setResultMat] = useState<Matrix | number | null>(null);
  const [resultLabel, setResultLabel] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [showSteps, setShowSteps] = useState<boolean>(true);
  const [exportData, setExportData] = useState<ExportReportData | null>(null);

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : isOled
      ? 'bg-zinc-950 border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl';

  const inputBg = isLight
    ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-sky-500'
    : isOled
      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-sky-500'
      : 'bg-slate-800 border-slate-700 text-slate-100 focus:border-sky-500';

  const formatLatexMatrix = (m: Matrix): string => {
    const rowsStr = m.map((row) => row.map((c) => Number(c.toFixed(4))).join(' & ')).join(' \\\\ ');
    return `\\begin{pmatrix} ${rowsStr} \\end{pmatrix}`;
  };

  // Resize matrix
  const resizeMatrix = (target: 'A' | 'B', newR: number, newC: number) => {
    if (newR < 1 || newR > 5 || newC < 1 || newC > 5) return;

    if (target === 'A') {
      setRowsA(newR);
      setColsA(newC);
      const newM = Array.from({ length: newR }, (_, r) =>
        Array.from({ length: newC }, (_, c) => matA[r]?.[c] ?? 0)
      );
      setMatA(newM);
    } else {
      setRowsB(newR);
      setColsB(newC);
      const newM = Array.from({ length: newR }, (_, r) =>
        Array.from({ length: newC }, (_, c) => matB[r]?.[c] ?? 0)
      );
      setMatB(newM);
    }
  };

  const updateCell = (target: 'A' | 'B', r: number, c: number, val: number) => {
    if (target === 'A') {
      const copy = matA.map((row) => [...row]);
      copy[r][c] = val;
      setMatA(copy);
    } else {
      const copy = matB.map((row) => [...row]);
      copy[r][c] = val;
      setMatB(copy);
    }
  };

  // Matrix Operations
  const handleAdd = () => {
    setErrorMsg(null);
    const res = addMatrices(matA, matB);
    if (!res) {
      setErrorMsg('Matrices must have the same dimensions for addition.');
      return;
    }
    setResultMat(res);
    setResultLabel('A + B (Addition)');
    setSteps([
      `Dimension Match: Both matrices are ${rowsA} × ${colsA}`,
      `Element-wise addition: C[i, j] = A[i, j] + B[i, j]`,
      `Computed ${rowsA * colsA} element additions successfully.`,
    ]);
    addHistory('A + B', 'Matrix Addition Result', 'matrix');
  };

  const handleSub = () => {
    setErrorMsg(null);
    const res = subtractMatrices(matA, matB);
    if (!res) {
      setErrorMsg('Matrices must have the same dimensions for subtraction.');
      return;
    }
    setResultMat(res);
    setResultLabel('A − B (Subtraction)');
    setSteps([
      `Dimension Match: Both matrices are ${rowsA} × ${colsA}`,
      `Element-wise subtraction: C[i, j] = A[i, j] - B[i, j]`,
      `Computed ${rowsA * colsA} element subtractions successfully.`,
    ]);
    addHistory('A − B', 'Matrix Subtraction Result', 'matrix');
  };

  const handleMul = () => {
    setErrorMsg(null);
    const res = multiplyMatrices(matA, matB);
    if (!res) {
      setErrorMsg(
        'Columns of A must equal Rows of B for multiplication (A: r_a × c_a, B: r_b × c_b with c_a = r_b).'
      );
      return;
    }
    setResultMat(res);
    setResultLabel('A × B (Multiplication)');
    setSteps([
      `Matrix Product Dimensions: (${rowsA} × ${colsA}) × (${rowsB} × ${colsB}) ➔ Result (${rowsA} × ${colsB})`,
      `Dot Product Formula: C[i, j] = ∑ (A[i, k] · B[k, j]) for k from 1 to ${colsA}`,
      `Sample C[0,0] = ${matA[0].map((a, k) => `(${a} · ${matB[k]?.[0] ?? 0})`).join(' + ')} = ${res[0][0]}`,
    ]);
    addHistory('A × B', 'Matrix Multiplication Result', 'matrix');
  };

  const handleDet = (target: 'A' | 'B') => {
    setErrorMsg(null);
    const m = target === 'A' ? matA : matB;
    const r = target === 'A' ? rowsA : rowsB;
    const c = target === 'A' ? colsA : colsB;

    if (r !== c) {
      setErrorMsg(`Matrix ${target} must be square (N × N) to compute determinant.`);
      return;
    }

    const { det, singular } = computeDeterminant(m);
    if (isNaN(det)) {
      setErrorMsg(`Could not calculate determinant for Matrix ${target}.`);
      return;
    }
    setResultMat(det);
    setResultLabel(`det(${target}) ${singular ? '(Singular Matrix)' : ''}`);
    setSteps([
      `Square Matrix Size: ${r} × ${r}`,
      `Computed via Gaussian row-reduction / Laplace cofactor expansion.`,
      `Determinant value: det(${target}) = ${det}`,
      singular
        ? `det = 0 ➔ Matrix is singular, non-invertible, and has linearly dependent rows.`
        : `det ≠ 0 ➔ Matrix is non-singular and has a unique inverse.`,
    ]);
    addHistory(`det(${target})`, String(det), 'matrix');
  };

  const handleInverse = (target: 'A' | 'B') => {
    setErrorMsg(null);
    const m = target === 'A' ? matA : matB;
    const r = target === 'A' ? rowsA : rowsB;
    const c = target === 'A' ? colsA : colsB;

    if (r !== c) {
      setErrorMsg(`Matrix ${target} must be square (N × N) to compute inverse.`);
      return;
    }

    const inv = invertMatrix(m);
    if (!inv) {
      setErrorMsg(`Matrix ${target} is singular (det = 0) and cannot be inverted.`);
      return;
    }

    setResultMat(inv);
    setResultLabel(`${target}⁻¹ (Inverse Matrix)`);
    setSteps([
      `Dimension: ${r} × ${r}`,
      `Gauss-Jordan elimination with augmented identity [ ${target} | I_${r} ] ➔ [ I_${r} | ${target}⁻¹ ]`,
      `Verification: ${target} · ${target}⁻¹ = I_${r}`,
    ]);
    addHistory(`${target}⁻¹`, 'Matrix Inverse', 'matrix');
  };

  const handleTranspose = (target: 'A' | 'B') => {
    setErrorMsg(null);
    const m = target === 'A' ? matA : matB;
    const res = transposeMatrix(m);
    setResultMat(res);
    setResultLabel(`${target}ᵀ (Transpose)`);
    setSteps([
      `Reflected across main diagonal: (Mᵀ)[i, j] = M[j, i]`,
      `Original dimensions: ${m.length} × ${m[0].length} ➔ Transposed dimensions: ${res.length} × ${res[0].length}`,
    ]);
    addHistory(`${target}ᵀ`, 'Matrix Transpose', 'matrix');
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Matrix A & B Grid Containers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matrix A Card */}
        <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-sky-400">
              Matrix A ({rowsA} × {colsA})
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Rows:</span>
              <button
                onClick={() => resizeMatrix('A', rowsA - 1, colsA)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
              >
                -
              </button>
              <span className="font-bold text-slate-200">{rowsA}</span>
              <button
                onClick={() => resizeMatrix('A', rowsA + 1, colsA)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
              >
                +
              </button>
              <span className="ml-1 sm:ml-2">Cols:</span>
              <button
                onClick={() => resizeMatrix('A', rowsA, colsA - 1)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
              >
                -
              </button>
              <span className="font-bold text-slate-200">{colsA}</span>
              <button
                onClick={() => resizeMatrix('A', rowsA, colsA + 1)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-center p-2 overflow-x-auto">
            <div
              className="grid gap-2 border-x-2 border-sky-500/80 px-3 py-2 rounded-lg"
              style={{ gridTemplateColumns: `repeat(${colsA}, minmax(0, 1fr))` }}
            >
              {matA.map((row, r) =>
                row.map((cell, c) => (
                  <input
                    key={`a_${r}_${c}`}
                    type="number"
                    value={cell}
                    onChange={(e) => updateCell('A', r, c, parseFloat(e.target.value) || 0)}
                    className={`w-12 sm:w-14 h-10 ${inputBg} rounded-xl text-center font-mono font-bold text-sm`}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleDet('A')}
              className="flex-1 min-w-[70px] py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
            >
              det(A)
            </button>
            <button
              onClick={() => handleInverse('A')}
              className="flex-1 min-w-[70px] py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
            >
              A⁻¹
            </button>
            <button
              onClick={() => handleTranspose('A')}
              className="flex-1 min-w-[70px] py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
            >
              Aᵀ
            </button>
          </div>
        </div>

        {/* Matrix B Card */}
        <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-indigo-400">
              Matrix B ({rowsB} × {colsB})
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Rows:</span>
              <button
                onClick={() => resizeMatrix('B', rowsB - 1, colsB)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
              >
                -
              </button>
              <span className="font-bold text-slate-200">{rowsB}</span>
              <button
                onClick={() => resizeMatrix('B', rowsB + 1, colsB)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
              >
                +
              </button>
              <span className="ml-1 sm:ml-2">Cols:</span>
              <button
                onClick={() => resizeMatrix('B', rowsB, colsB - 1)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
              >
                -
              </button>
              <span className="font-bold text-slate-200">{colsB}</span>
              <button
                onClick={() => resizeMatrix('B', rowsB, colsB + 1)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-center p-2 overflow-x-auto">
            <div
              className="grid gap-2 border-x-2 border-indigo-500/80 px-3 py-2 rounded-lg"
              style={{ gridTemplateColumns: `repeat(${colsB}, minmax(0, 1fr))` }}
            >
              {matB.map((row, r) =>
                row.map((cell, c) => (
                  <input
                    key={`b_${r}_${c}`}
                    type="number"
                    value={cell}
                    onChange={(e) => updateCell('B', r, c, parseFloat(e.target.value) || 0)}
                    className={`w-12 sm:w-14 h-10 ${inputBg} rounded-xl text-center font-mono font-bold text-sm`}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleDet('B')}
              className="flex-1 min-w-[70px] py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
            >
              det(B)
            </button>
            <button
              onClick={() => handleInverse('B')}
              className="flex-1 min-w-[70px] py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
            >
              B⁻¹
            </button>
            <button
              onClick={() => handleTranspose('B')}
              className="flex-1 min-w-[70px] py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
            >
              Bᵀ
            </button>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleAdd}
          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-sky-600/25 transition-all flex-shrink-0"
        >
          A + B
        </button>
        <button
          onClick={handleSub}
          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-sky-600/25 transition-all flex-shrink-0"
        >
          A − B
        </button>
        <button
          onClick={handleMul}
          className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-sky-500/20 transition-all flex-shrink-0"
        >
          A × B
        </button>
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-rose-300 text-xs font-semibold text-center">
          {errorMsg}
        </div>
      )}

      {/* Result Display */}
      {resultMat !== null && (
        <div className={`${cardBg} border rounded-3xl p-6 shadow-xl flex flex-col gap-4`}>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {resultLabel}
            </h4>

            <button
              onClick={() => {
                const latex =
                  typeof resultMat === 'number'
                    ? `${resultLabel} = ${resultMat}`
                    : `${resultLabel} = ${formatLatexMatrix(resultMat)}`;

                const tableHeaders =
                  typeof resultMat === 'number'
                    ? ['Metric', 'Value']
                    : Array.from({ length: resultMat[0]?.length || 1 }, (_, i) => `Col ${i + 1}`);

                const tableRows =
                  typeof resultMat === 'number'
                    ? [[resultLabel, String(resultMat)]]
                    : resultMat.map((row) => row.map((c) => Number(c.toFixed(4))));

                setExportData({
                  title: `Matrix Computation (${resultLabel})`,
                  engine: 'Matrix Calculator',
                  timestamp: Date.now(),
                  inputDescription: `Matrix A (${rowsA}×${colsA}), Matrix B (${rowsB}×${colsB})`,
                  resultSummary:
                    typeof resultMat === 'number' ? `${resultMat}` : 'Computed Result Matrix',
                  latex,
                  steps,
                  tableHeaders,
                  tableRows,
                  metadata: {
                    Operation: resultLabel,
                    'Matrix A': `${rowsA}×${colsA}`,
                    'Matrix B': `${rowsB}×${colsB}`,
                  },
                });
              }}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
            >
              <Download className="w-3.5 h-3.5" /> Export Result & LaTeX
            </button>
          </div>

          <div className="flex justify-center my-2">
            {typeof resultMat === 'number' ? (
              <div className="text-3xl font-mono font-bold text-sky-400">{resultMat}</div>
            ) : (
              <div className="border-x-2 border-emerald-400 px-4 py-3 rounded-xl bg-slate-950/70 shadow-inner">
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${resultMat[0]?.length || 1}, minmax(0, 1fr))`,
                  }}
                >
                  {resultMat.map((row, r) =>
                    row.map((cell, c) => (
                      <div
                        key={`res_${r}_${c}`}
                        className="w-14 h-10 flex items-center justify-center bg-slate-900 rounded-xl font-mono font-bold text-emerald-300 text-sm border border-slate-800"
                      >
                        {Math.round(cell * 10000) / 10000}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Steps Breakdown */}
          {steps.length > 0 && (
            <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2">
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Derivation Steps & Method Details
                </span>
                {showSteps ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showSteps && (
                <div className="flex flex-col gap-1.5 mt-1 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  {steps.map((step, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-300">
                      • {step}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Export Modal */}
      {exportData && (
        <ExportModal
          isOpen={!!exportData}
          onClose={() => setExportData(null)}
          data={exportData}
          settings={settings}
        />
      )}
    </div>
  );
};
