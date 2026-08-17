import React, { useState } from 'react';
import { addHistory } from '../utils/history';
import { AppSettings } from '../types';

type Matrix = number[][];

interface MatrixCalculatorProps {
  settings?: AppSettings;
}

export const MatrixCalculator: React.FC<MatrixCalculatorProps> = ({ settings: _settings }) => {
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

  // Resize matrix
  const resizeMatrix = (
    target: 'A' | 'B',
    newR: number,
    newC: number
  ) => {
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
    if (rowsA !== rowsB || colsA !== colsB) {
      setErrorMsg('Matrices must have the same dimensions for addition.');
      return;
    }
    const res: Matrix = matA.map((r, i) => r.map((val, j) => val + matB[i][j]));
    setResultMat(res);
    setResultLabel('A + B');
    addHistory('A + B', 'Matrix Result', 'matrix');
  };

  const handleSub = () => {
    setErrorMsg(null);
    if (rowsA !== rowsB || colsA !== colsB) {
      setErrorMsg('Matrices must have the same dimensions for subtraction.');
      return;
    }
    const res: Matrix = matA.map((r, i) => r.map((val, j) => val - matB[i][j]));
    setResultMat(res);
    setResultLabel('A - B');
    addHistory('A - B', 'Matrix Result', 'matrix');
  };

  const handleMul = () => {
    setErrorMsg(null);
    if (colsA !== rowsB) {
      setErrorMsg('Columns of A must equal Rows of B for multiplication.');
      return;
    }
    const res: Matrix = Array.from({ length: rowsA }, () => Array(colsB).fill(0));
    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        for (let k = 0; k < colsA; k++) {
          res[i][j] += matA[i][k] * matB[k][j];
        }
      }
    }
    setResultMat(res);
    setResultLabel('A × B');
    addHistory('A × B', 'Matrix Result', 'matrix');
  };

  // Helper determinant function
  const calcDet = (m: Matrix): number => {
    const n = m.length;
    if (n === 1) return m[0][0];
    if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];

    let det = 0;
    for (let i = 0; i < n; i++) {
      const subMat = m.slice(1).map((row) => row.filter((_, colIdx) => colIdx !== i));
      det += Math.pow(-1, i) * m[0][i] * calcDet(subMat);
    }
    return det;
  };

  const handleDet = (target: 'A' | 'B') => {
    setErrorMsg(null);
    const m = target === 'A' ? matA : matB;
    const r = target === 'A' ? rowsA : rowsB;
    const c = target === 'A' ? colsA : colsB;

    if (r !== c) {
      setErrorMsg(`Matrix ${target} must be square (NxN) to compute determinant.`);
      return;
    }

    const detVal = calcDet(m);
    setResultMat(detVal);
    setResultLabel(`det(${target})`);
    addHistory(`det(${target})`, String(detVal), 'matrix');
  };

  const handleTranspose = (target: 'A' | 'B') => {
    setErrorMsg(null);
    const m = target === 'A' ? matA : matB;
    const r = target === 'A' ? rowsA : rowsB;
    const c = target === 'A' ? colsA : colsB;

    const res: Matrix = Array.from({ length: c }, (_, i) =>
      Array.from({ length: r }, (_, j) => m[j][i])
    );
    setResultMat(res);
    setResultLabel(`${target}ᵀ (Transpose)`);
    addHistory(`${target}ᵀ`, 'Matrix Transpose', 'matrix');
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Matrix A & B Grid Containers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matrix A Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-sky-400">Matrix A ({rowsA} × {colsA})</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Rows:</span>
              <button onClick={() => resizeMatrix('A', rowsA - 1, colsA)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold">-</button>
              <span>{rowsA}</span>
              <button onClick={() => resizeMatrix('A', rowsA + 1, colsA)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold">+</button>
              <span className="ml-2">Cols:</span>
              <button onClick={() => resizeMatrix('A', rowsA, colsA - 1)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold">-</button>
              <span>{colsA}</span>
              <button onClick={() => resizeMatrix('A', rowsA, colsA + 1)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold">+</button>
            </div>
          </div>

          <div className="flex justify-center p-2">
            <div className="grid gap-2 border-x-2 border-sky-500/80 px-3 py-2 rounded-lg" style={{ gridTemplateColumns: `repeat(${colsA}, minmax(0, 1fr))` }}>
              {matA.map((row, r) =>
                row.map((cell, c) => (
                  <input
                    key={`a_${r}_${c}`}
                    type="number"
                    value={cell}
                    onChange={(e) => updateCell('A', r, c, parseFloat(e.target.value) || 0)}
                    className="w-14 h-10 bg-slate-800 border border-slate-700/80 rounded-xl text-center font-mono font-bold text-slate-100 focus:outline-none focus:border-sky-500 text-sm"
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => handleDet('A')} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700">det(A)</button>
            <button onClick={() => handleTranspose('A')} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700">Aᵀ</button>
          </div>
        </div>

        {/* Matrix B Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-indigo-400">Matrix B ({rowsB} × {colsB})</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Rows:</span>
              <button onClick={() => resizeMatrix('B', rowsB - 1, colsB)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold">-</button>
              <span>{rowsB}</span>
              <button onClick={() => resizeMatrix('B', rowsB + 1, colsB)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold">+</button>
              <span className="ml-2">Cols:</span>
              <button onClick={() => resizeMatrix('B', rowsB, colsB - 1)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold">-</button>
              <span>{colsB}</span>
              <button onClick={() => resizeMatrix('B', rowsB, colsB + 1)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold">+</button>
            </div>
          </div>

          <div className="flex justify-center p-2">
            <div className="grid gap-2 border-x-2 border-indigo-500/80 px-3 py-2 rounded-lg" style={{ gridTemplateColumns: `repeat(${colsB}, minmax(0, 1fr))` }}>
              {matB.map((row, r) =>
                row.map((cell, c) => (
                  <input
                    key={`b_${r}_${c}`}
                    type="number"
                    value={cell}
                    onChange={(e) => updateCell('B', r, c, parseFloat(e.target.value) || 0)}
                    className="w-14 h-10 bg-slate-800 border border-slate-700/80 rounded-xl text-center font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => handleDet('B')} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700">det(B)</button>
            <button onClick={() => handleTranspose('B')} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700">Bᵀ</button>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={handleAdd} className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-sky-600/25 transition-all">
          A + B
        </button>
        <button onClick={handleSub} className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-sky-600/25 transition-all">
          A − B
        </button>
        <button onClick={handleMul} className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-sky-500/20 transition-all">
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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center gap-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{resultLabel}</h4>
          {typeof resultMat === 'number' ? (
            <div className="text-3xl font-mono font-bold text-sky-400">{resultMat}</div>
          ) : (
            <div className="border-x-2 border-emerald-400 px-4 py-3 rounded-xl bg-slate-800/60 shadow-inner">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${resultMat[0]?.length || 1}, minmax(0, 1fr))` }}
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
      )}
    </div>
  );
};
