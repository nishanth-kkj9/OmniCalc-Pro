import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { AppSettings } from '../types';
import { evaluateExpression } from '../utils/calculator';
import { MAX_ITERATIONS, NUMERICAL_EPSILON } from '../constants/limits';

interface CalculusCalculatorProps {
  settings: AppSettings;
}

export const CalculusCalculator: React.FC<CalculusCalculatorProps> = ({ settings }) => {
  const [calcTab, setCalcTab] = useState<'integral' | 'derivative' | 'root'>('integral');
  const [copied, setCopied] = useState<string | null>(null);

  // Definite Integral State
  const [intFunc, setIntFunc] = useState<string>('x^2 + 2*x + 1');
  const [intA, setIntA] = useState<string>('0');
  const [intB, setIntB] = useState<string>('3');
  const [intSubdiv] = useState<number>(100);

  // Derivative State
  const [diffFunc, setDiffFunc] = useState<string>('sin(x) + x^2');
  const [diffX0, setDiffX0] = useState<string>('2');

  // Root Finding (Newton-Raphson)
  const [rootFunc, setRootFunc] = useState<string>('cos(x) - x');
  const [rootGuess, setRootGuess] = useState<string>('0.5');
  const [maxIter, setMaxIter] = useState<number>(10);

  const formatNum = useCallback(
    (n: number) => {
      if (Math.abs(n) < 1e-12) return '0';
      const prec = settings.precision || 6;
      return Number(n.toFixed(prec)).toString();
    },
    [settings.precision]
  );

  const evalAt = useCallback(
    (expr: string, xVal: number): number | null => {
      try {
        const res = evaluateExpression(expr, settings.angleMode, 10, { x: xVal });
        const num = parseFloat(res);
        return isNaN(num) || !isFinite(num) ? null : num;
      } catch {
        return null;
      }
    },
    [settings.angleMode]
  );

  // Numerical Definite Integration (Simpson's 1/3 Rule)
  const intData = useMemo(() => {
    const a = parseFloat(intA);
    const b = parseFloat(intB);
    if (isNaN(a) || isNaN(b)) return { error: 'Invalid bounds.' };
    if (a === b) return { result: '0', trapResult: '0' };

    const n = Math.max(10, intSubdiv % 2 === 0 ? intSubdiv : intSubdiv + 1);
    const h = (b - a) / n;

    const fa = evalAt(intFunc, a);
    const fb = evalAt(intFunc, b);
    if (fa === null || fb === null) return { error: 'Function is undefined at boundary.' };

    let simpsonSum = fa + fb;
    let trapSum = 0.5 * (fa + fb);

    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      const fx = evalAt(intFunc, x);
      if (fx === null) return { error: `Function undefined at x = ${formatNum(x)}` };
      simpsonSum += (i % 2 === 0 ? 2 : 4) * fx;
      trapSum += fx;
    }

    const simpsonTotal = (h / 3) * simpsonSum;
    const trapTotal = h * trapSum;

    return {
      result: formatNum(simpsonTotal),
      trapResult: formatNum(trapTotal),
      h: formatNum(h),
      n,
    };
  }, [intA, intB, intFunc, intSubdiv, evalAt, formatNum]);

  // Numerical Derivative with Central Difference & Richardson Extrapolation
  const diffData = useMemo(() => {
    const x0 = parseFloat(diffX0);
    if (isNaN(x0)) return { error: 'Invalid x₀ value.' };

    const f0 = evalAt(diffFunc, x0);
    if (f0 === null) return { error: 'Function undefined at point x₀.' };

    const h = 1e-4;
    const fp2 = evalAt(diffFunc, x0 + 2 * h);
    const fp1 = evalAt(diffFunc, x0 + h);
    const fm1 = evalAt(diffFunc, x0 - h);
    const fm2 = evalAt(diffFunc, x0 - 2 * h);

    if (fp2 === null || fp1 === null || fm1 === null || fm2 === null) {
      return { error: 'Could not compute derivative in the neighborhood of x₀.' };
    }

    // Five-point stencil derivative: (-f(x+2h) + 8f(x+h) - 8f(x-h) + f(x-2h)) / (12h)
    const d1 = (-fp2 + 8 * fp1 - 8 * fm1 + fm2) / (12 * h);

    // Second derivative: (-f(x+2h) + 16f(x+h) - 30f(x) + 16f(x-h) - f(x-2h)) / (12h^2)
    const d2 = (-fp2 + 16 * fp1 - 30 * f0 + 16 * fm1 - fm2) / (12 * h * h);

    // Tangent line: y = m*x + (y0 - m*x0)
    const tangentIntercept = f0 - d1 * x0;
    const tangentLine = `y = ${formatNum(d1)}x ${tangentIntercept >= 0 ? '+' : '-'} ${formatNum(Math.abs(tangentIntercept))}`;

    // Normal line
    let normalLine = '';
    if (Math.abs(d1) > 1e-12) {
      const normalSlope = -1 / d1;
      const normalIntercept = f0 - normalSlope * x0;
      normalLine = `y = ${formatNum(normalSlope)}x ${normalIntercept >= 0 ? '+' : '-'} ${formatNum(Math.abs(normalIntercept))}`;
    } else {
      normalLine = `x = ${formatNum(x0)} (Vertical)`;
    }

    return {
      f0: formatNum(f0),
      d1: formatNum(d1),
      d2: formatNum(d2),
      tangentLine,
      normalLine,
    };
  }, [diffX0, diffFunc, evalAt, formatNum]);

  // Newton-Raphson Root Solver
  const rootData = useMemo(() => {
    let currentX = parseFloat(rootGuess);
    if (isNaN(currentX)) return { error: 'Invalid initial guess x₀.' };

    const iterations = [];
    const h = 1e-5;
    const boundedMaxIter = Math.min(Math.max(1, maxIter), MAX_ITERATIONS);

    for (let i = 0; i < boundedMaxIter; i++) {
      const fx = evalAt(rootFunc, currentX);
      if (fx === null) {
        return { error: `Function undefined at x = ${formatNum(currentX)}`, iterations };
      }

      // Derivative at currentX
      const fxh = evalAt(rootFunc, currentX + h);
      const fxmh = evalAt(rootFunc, currentX - h);
      if (fxh === null || fxmh === null) break;

      const fPrime = (fxh - fxmh) / (2 * h);
      if (Math.abs(fPrime) < 1e-14) {
        iterations.push({ iter: i + 1, x: currentX, fx, fPrime, nextX: currentX, error: 0 });
        return { error: 'Derivative reached 0 (tangent is horizontal). Cannot continue.', iterations };
      }

      const nextX = currentX - fx / fPrime;
      const err = Math.abs(nextX - currentX);

      iterations.push({
        iter: i + 1,
        x: currentX,
        fx,
        fPrime,
        nextX,
        error: err,
      });

      currentX = nextX;
      if (err < NUMERICAL_EPSILON || err < 1e-10) break;
    }

    return {
      root: formatNum(currentX),
      iterations,
    };
  }, [rootGuess, maxIter, rootFunc, evalAt, formatNum]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'integral', label: 'Definite Integral ∫ f(x) dx' },
          { id: 'derivative', label: 'Derivative & Tangents f\'(x)' },
          { id: 'root', label: 'Newton-Raphson Root Finder' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCalcTab(tab.id as any)}
            className={`
              px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm
              ${calcTab === tab.id
                ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        {/* INTEGRAL CALCULATOR */}
        {calcTab === 'integral' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">Definite Numerical Integral</h3>
              <p className="text-xs text-slate-400">Calculates area under the curve using Composite Simpson's 1/3 Rule and Trapezoidal rules</p>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Function f(x)</label>
                <input
                  type="text"
                  value={intFunc}
                  onChange={(e) => setIntFunc(e.target.value)}
                  placeholder="e.g. x^2 + 2*x + 1 or sin(x)"
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Lower Bound (a)</label>
                <input
                  type="number"
                  value={intA}
                  onChange={(e) => setIntA(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Upper Bound (b)</label>
                <input
                  type="number"
                  value={intB}
                  onChange={(e) => setIntB(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Formatted Integral */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-center font-mono text-lg font-bold text-sky-400">
              ∫<sub className="text-xs font-normal">{intA}</sub><sup className="text-xs font-normal">{intB}</sup> ({intFunc}) dx
            </div>

            {/* Results */}
            {intData && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {intData.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{intData.error}</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Definite Integral Result</span>
                      <button
                        onClick={() => handleCopy('int', intData.result || '')}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {copied === 'int' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === 'int' ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-1">
                        <span className="text-xs text-slate-400">Simpson's 1/3 Rule (High Accuracy)</span>
                        <span className="text-3xl font-mono font-bold text-emerald-400">{intData.result}</span>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-1">
                        <span className="text-xs text-slate-400">Trapezoidal Rule Approximation</span>
                        <span className="text-3xl font-mono font-bold text-sky-400">{intData.trapResult}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
                      <span>Subdivisions: {intData.n} intervals</span>
                      <span>Step Size h = {intData.h}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* DERIVATIVE CALCULATOR */}
        {calcTab === 'derivative' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">Numerical Derivative & Tangent Line</h3>
              <p className="text-xs text-slate-400">Calculates 1st & 2nd order derivatives, tangent line, and normal line equations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Function f(x)</label>
                <input
                  type="text"
                  value={diffFunc}
                  onChange={(e) => setDiffFunc(e.target.value)}
                  placeholder="e.g. sin(x) + x^2"
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Point x₀</label>
                <input
                  type="number"
                  value={diffX0}
                  onChange={(e) => setDiffX0(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {diffData && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {diffData.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{diffData.error}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">Value f(x₀)</span>
                        <span className="text-xl font-mono font-bold text-slate-100">{diffData.f0}</span>
                      </div>
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">1st Derivative f'(x₀) [Slope]</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">{diffData.d1}</span>
                      </div>
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">2nd Derivative f''(x₀)</span>
                        <span className="text-xl font-mono font-bold text-sky-400">{diffData.d2}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-xs text-slate-400 block mb-1">Tangent Line Equation:</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">{diffData.tangentLine}</span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-xs text-slate-400 block mb-1">Normal Line Equation:</span>
                        <span className="font-mono text-sm font-bold text-sky-400">{diffData.normalLine}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ROOT FINDER */}
        {calcTab === 'root' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">Newton-Raphson Method</h3>
              <p className="text-xs text-slate-400">Iterative algorithm for finding roots where f(x) = 0</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Function f(x)</label>
                <input
                  type="text"
                  value={rootFunc}
                  onChange={(e) => setRootFunc(e.target.value)}
                  placeholder="e.g. cos(x) - x"
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-sm font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Initial Guess (x₀)</label>
                <input
                  type="number"
                  value={rootGuess}
                  onChange={(e) => setRootGuess(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-sm font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Max Iterations</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxIter}
                  onChange={(e) => setMaxIter(parseInt(e.target.value) || 10)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-sm font-bold text-slate-100"
                />
              </div>
            </div>

            {rootData && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {rootData.error && (
                  <div className="text-amber-400 text-xs font-semibold">{rootData.error}</div>
                )}

                {rootData.root && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Converged Root (f(x) ≈ 0)</span>
                      <span className="text-2xl font-mono font-bold text-emerald-400">x ≈ {rootData.root}</span>
                    </div>
                    <button
                      onClick={() => handleCopy('root', rootData.root || '')}
                      className="px-3 py-1.5 bg-slate-800 text-xs text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5"
                    >
                      {copied === 'root' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === 'root' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}

                {/* Iterations Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Iter</th>
                        <th className="p-2.5">x_n</th>
                        <th className="p-2.5">f(x_n)</th>
                        <th className="p-2.5">f'(x_n)</th>
                        <th className="p-2.5">x_(n+1)</th>
                        <th className="p-2.5">|Δx|</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {rootData.iterations?.map((row) => (
                        <tr key={row.iter} className="hover:bg-slate-900/60">
                          <td className="p-2.5 text-slate-400 font-bold">{row.iter}</td>
                          <td className="p-2.5 text-slate-200">{formatNum(row.x)}</td>
                          <td className="p-2.5 text-sky-400">{formatNum(row.fx)}</td>
                          <td className="p-2.5 text-slate-300">{formatNum(row.fPrime)}</td>
                          <td className="p-2.5 text-emerald-400 font-bold">{formatNum(row.nextX)}</td>
                          <td className="p-2.5 text-slate-400">{row.error.toExponential(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
