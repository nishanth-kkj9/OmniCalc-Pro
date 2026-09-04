import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { AppSettings } from '../types';
import { evaluateExpression } from '../utils/calculator';
import { MAX_ITERATIONS } from '../constants/limits';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import {
  calculateDerivative,
  calculateSecondDerivative,
  calculateTangentLine,
  calculateNormalLine,
  integrateDefinite,
  solveNewtonRaphson,
} from '../utils/numericalAnalysis';

interface CalculusCalculatorProps {
  settings: AppSettings;
}

export const CalculusCalculator: React.FC<CalculusCalculatorProps> = ({ settings }) => {
  const [calcTab, setCalcTab] = useState<'integral' | 'derivative' | 'root'>('integral');
  const [copied, setCopied] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState<boolean>(true);
  const [exportData, setExportData] = useState<ExportReportData | null>(null);

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

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : isOled
      ? 'bg-zinc-950 border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl';

  const subCardBg = isLight
    ? 'bg-slate-50 border-slate-200'
    : isOled
      ? 'bg-zinc-900 border-zinc-800'
      : 'bg-slate-950 border-slate-800';

  const inputBg = isLight
    ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-sky-500'
    : isOled
      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-sky-500'
      : 'bg-slate-800 border-slate-700 text-slate-100 focus:border-sky-500';

  // Numerical Definite Integration (Simpson's 1/3 Rule & Trapezoid)
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

    const fn = (x: number) => evalAt(intFunc, x);
    const simpsonRes = integrateDefinite(fn, a, b, { method: 'simpson', subdivisions: n });
    const trapRes = integrateDefinite(fn, a, b, { method: 'trapezoid', subdivisions: n });

    if (!simpsonRes || !trapRes) {
      return { error: 'Function is undefined or discontinuous across integration interval.' };
    }

    const simpsonTotal = simpsonRes.value;
    const trapTotal = trapRes.value;

    return {
      result: formatNum(simpsonTotal),
      trapResult: formatNum(trapTotal),
      h: formatNum(h),
      n,
      steps: [
        `Interval: [a = ${a}, b = ${b}] with n = ${n} subdivisions (step size h = ${formatNum(h)})`,
        `Simpson's 1/3 Formula: (h / 3) · [f(x₀) + 4∑f(x_odd) + 2∑f(x_even) + f(x_n)]`,
        `Boundary Values: f(${a}) = ${formatNum(fa)}, f(${b}) = ${formatNum(fb)}`,
        `Simpson Integral = (${formatNum(h)} / 3) · Weighted Sum = ${formatNum(simpsonTotal)}`,
        `Trapezoidal Rule Comparison = ${formatNum(trapTotal)}`,
      ],
      latex: `\\int_{${a}}^{${b}} \\left( ${intFunc} \\right) dx \\approx ${formatNum(simpsonTotal)}`,
    };
  }, [intA, intB, intFunc, intSubdiv, evalAt, formatNum]);

  // Numerical Derivative with Central Difference & Richardson Extrapolation
  const diffData = useMemo(() => {
    const x0 = parseFloat(diffX0);
    if (isNaN(x0)) return { error: 'Invalid x₀ value.' };

    const f0 = evalAt(diffFunc, x0);
    if (f0 === null) return { error: 'Function undefined at point x₀.' };

    const fn = (x: number) => evalAt(diffFunc, x);
    const d1 = calculateDerivative(fn, x0);
    const d2 = calculateSecondDerivative(fn, x0);
    const tangent = calculateTangentLine(fn, x0);
    const normal = calculateNormalLine(fn, x0);

    if (d1 === null || d2 === null || !tangent || !normal) {
      return { error: 'Could not compute derivative in the neighborhood of x₀.' };
    }

    const tangentLine = tangent.equation;
    const normalLine = normal.equation;

    return {
      f0: formatNum(f0),
      d1: formatNum(d1),
      d2: formatNum(d2),
      tangentLine,
      normalLine,
      steps: [
        `Evaluation Point: x₀ = ${x0}`,
        `Base Function Value: f(${x0}) = ${formatNum(f0)}`,
        `High-Order Five-Point Central Stencil:`,
        `   f'(x₀) = ${formatNum(d1)}`,
        `Second Derivative Concavity Check:`,
        `   f''(x₀) = ${formatNum(d2)} (${d2 > 0 ? 'Concave Upwards / Local Minima' : d2 < 0 ? 'Concave Downwards / Local Maxima' : 'Inflection candidate'})`,
        `Tangent Line at (x₀, f(x₀)): Point-Slope form y - f(x₀) = f'(x₀)(x - x₀)`,
        `   ${tangentLine}`,
        `Normal (Perpendicular) Line:`,
        `   ${normalLine}`,
      ],
      latex: `\\left. \\frac{d}{dx} \\left( ${diffFunc} \\right) \\right|_{x = ${x0}} = ${formatNum(d1)}`,
    };
  }, [diffX0, diffFunc, evalAt, formatNum]);

  // Newton-Raphson Root Solver
  const rootData = useMemo(() => {
    const currentX = parseFloat(rootGuess);
    if (isNaN(currentX)) return { error: 'Invalid initial guess x₀.' };

    const boundedMaxIter = Math.min(Math.max(1, maxIter), MAX_ITERATIONS);
    const fn = (x: number) => evalAt(rootFunc, x);
    const res = solveNewtonRaphson(fn, currentX, { maxIterations: boundedMaxIter });

    if (!res.converged && res.iterations.length === 0) {
      return { error: res.error || 'Function undefined at initial guess.', iterations: [] };
    }

    return {
      root: formatNum(res.root),
      iterations: res.iterations,
      steps: res.iterations.map(
        (it) =>
          `Iteration ${it.iter}: x_${it.iter - 1} = ${formatNum(it.x)}, f(x) = ${formatNum(it.fx)}, f'(x) = ${formatNum(it.fPrime)} ➔ x_${it.iter} = ${formatNum(it.nextX)} (Error: ${it.error.toExponential(2)})`
      ),
      latex: `f(x) = ${rootFunc} = 0 \\implies x \\approx ${formatNum(res.root)}`,
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
          { id: 'derivative', label: "Derivative & Tangents f'(x)" },
          { id: 'root', label: 'Newton-Raphson Root Finder' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCalcTab(tab.id as any)}
            className={`
              px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm flex-shrink-0
              ${
                calcTab === tab.id
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
      <div className={`${cardBg} border rounded-3xl p-6 shadow-xl flex flex-col gap-6`}>
        {/* INTEGRAL CALCULATOR */}
        {calcTab === 'integral' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Definite Numerical Integral</h3>
                <p className="text-xs text-slate-400">
                  Calculates area under curve via Composite Simpson's 1/3 Rule & Trapezoidal sums
                </p>
              </div>

              {intData && !intData.error && (
                <button
                  onClick={() => {
                    setExportData({
                      title: 'Definite Numerical Integration',
                      engine: 'Calculus Suite',
                      timestamp: Date.now(),
                      inputDescription: `∫ [${intA} to ${intB}] (${intFunc}) dx`,
                      resultSummary: `${intData.result}`,
                      latex: intData.latex,
                      steps: intData.steps,
                      metadata: {
                        'Simpson Result': intData.result || '',
                        'Trapezoidal Result': intData.trapResult || '',
                        'Subdivisions n': `${intData.n}`,
                        'Step Size h': intData.h || '',
                      },
                    });
                  }}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Export Report
                </button>
              )}
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
                  className={`${inputBg} rounded-2xl p-3 font-mono text-sm font-bold focus:outline-none`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Lower Bound (a)</label>
                <input
                  type="number"
                  value={intA}
                  onChange={(e) => setIntA(e.target.value)}
                  className={`${inputBg} rounded-2xl p-3 font-mono text-sm font-bold focus:outline-none`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Upper Bound (b)</label>
                <input
                  type="number"
                  value={intB}
                  onChange={(e) => setIntB(e.target.value)}
                  className={`${inputBg} rounded-2xl p-3 font-mono text-sm font-bold focus:outline-none`}
                />
              </div>
            </div>

            {/* Formatted Integral */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-center font-mono text-lg font-bold text-sky-400">
              ∫<sub className="text-xs font-normal">{intA}</sub>
              <sup className="text-xs font-normal">{intB}</sup> ({intFunc}) dx
            </div>

            {/* Results */}
            {intData && (
              <div className={`flex flex-col gap-4 ${subCardBg} border rounded-2xl p-5`}>
                {intData.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{intData.error}</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Definite Integral Result
                      </span>
                      <button
                        onClick={() => handleCopy('int', intData.result || '')}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {copied === 'int' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied === 'int' ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-1">
                        <span className="text-xs text-slate-400">
                          Simpson's 1/3 Rule (High Accuracy)
                        </span>
                        <span className="text-3xl font-mono font-bold text-emerald-400">
                          {intData.result}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-1">
                        <span className="text-xs text-slate-400">
                          Trapezoidal Rule Approximation
                        </span>
                        <span className="text-3xl font-mono font-bold text-sky-400">
                          {intData.trapResult}
                        </span>
                      </div>
                    </div>

                    {/* Step by Step Breakdown */}
                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
                      <button
                        onClick={() => setShowSteps(!showSteps)}
                        className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-sky-400" />
                          Step-by-Step Integration Derivation
                        </span>
                        {showSteps ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {showSteps && (
                        <div className="flex flex-col gap-1.5 mt-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                          {intData.steps?.map((step, idx) => (
                            <div key={idx} className="text-xs font-mono text-slate-300">
                              • {step}
                            </div>
                          ))}
                        </div>
                      )}
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
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Numerical Derivative & Tangent Line
                </h3>
                <p className="text-xs text-slate-400">
                  Calculates 1st & 2nd order derivatives, tangent line, and normal line equations
                </p>
              </div>

              {diffData && !diffData.error && (
                <button
                  onClick={() => {
                    setExportData({
                      title: 'Derivative & Tangent Analysis',
                      engine: 'Calculus Suite',
                      timestamp: Date.now(),
                      inputDescription: `d/dx (${diffFunc}) at x₀ = ${diffX0}`,
                      resultSummary: `f'(x₀) = ${diffData.d1}, Tangent: ${diffData.tangentLine}`,
                      latex: diffData.latex,
                      steps: diffData.steps,
                      metadata: {
                        '1st Derivative': diffData.d1 || '',
                        '2nd Derivative': diffData.d2 || '',
                        'Tangent Line': diffData.tangentLine || '',
                        'Normal Line': diffData.normalLine || '',
                      },
                    });
                  }}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                >
                  <Download className="w-3.5 h-3.5" /> Export Report
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Function f(x)</label>
                <input
                  type="text"
                  value={diffFunc}
                  onChange={(e) => setDiffFunc(e.target.value)}
                  placeholder="e.g. sin(x) + x^2"
                  className={`${inputBg} rounded-2xl p-3 font-mono text-sm font-bold focus:outline-none`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Point x₀</label>
                <input
                  type="number"
                  value={diffX0}
                  onChange={(e) => setDiffX0(e.target.value)}
                  className={`${inputBg} rounded-2xl p-3 font-mono text-sm font-bold focus:outline-none`}
                />
              </div>
            </div>

            {diffData && (
              <div className={`flex flex-col gap-4 ${subCardBg} border rounded-2xl p-5`}>
                {diffData.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{diffData.error}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">Value f(x₀)</span>
                        <span className="text-xl font-mono font-bold text-slate-100">
                          {diffData.f0}
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">
                          1st Derivative f'(x₀) [Slope]
                        </span>
                        <span className="text-xl font-mono font-bold text-emerald-400">
                          {diffData.d1}
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">2nd Derivative f''(x₀)</span>
                        <span className="text-xl font-mono font-bold text-sky-400">
                          {diffData.d2}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-xs text-slate-400 block mb-1">
                          Tangent Line Equation:
                        </span>
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          {diffData.tangentLine}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-xs text-slate-400 block mb-1">
                          Normal Line Equation:
                        </span>
                        <span className="font-mono text-sm font-bold text-sky-400">
                          {diffData.normalLine}
                        </span>
                      </div>
                    </div>

                    {/* Step-by-Step Breakdown */}
                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-slate-400">
                        Derivative Derivation Steps:
                      </span>
                      {diffData.steps?.map((step, idx) => (
                        <div key={idx} className="text-xs font-mono text-slate-300">
                          • {step}
                        </div>
                      ))}
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
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Newton-Raphson Method</h3>
                <p className="text-xs text-slate-400">
                  Iterative algorithm for finding roots where f(x) = 0
                </p>
              </div>

              {rootData && !rootData.error && (
                <button
                  onClick={() => {
                    const headers = ['Iteration', 'x_n', 'f(x_n)', "f'(x_n)", 'x_(n+1)', '|Δx|'];
                    const rows = (rootData.iterations || []).map((it) => [
                      it.iter,
                      formatNum(it.x),
                      formatNum(it.fx),
                      formatNum(it.fPrime),
                      formatNum(it.nextX),
                      it.error.toExponential(4),
                    ]);

                    setExportData({
                      title: 'Newton-Raphson Root Convergence',
                      engine: 'Calculus Suite',
                      timestamp: Date.now(),
                      inputDescription: `${rootFunc} = 0, initial guess x₀ = ${rootGuess}`,
                      resultSummary: `x ≈ ${rootData.root}`,
                      latex: rootData.latex,
                      steps: rootData.steps,
                      tableHeaders: headers,
                      tableRows: rows,
                      metadata: {
                        'Initial Guess x₀': rootGuess,
                        'Total Iterations': `${rows.length}`,
                        'Final Root': rootData.root || '',
                      },
                    });
                  }}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                >
                  <Download className="w-3.5 h-3.5" /> Export Table & Report
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Function f(x)</label>
                <input
                  type="text"
                  value={rootFunc}
                  onChange={(e) => setRootFunc(e.target.value)}
                  placeholder="e.g. cos(x) - x"
                  className={`${inputBg} rounded-2xl p-3 font-mono text-sm font-bold`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Initial Guess (x₀)</label>
                <input
                  type="number"
                  value={rootGuess}
                  onChange={(e) => setRootGuess(e.target.value)}
                  className={`${inputBg} rounded-2xl p-3 font-mono text-sm font-bold`}
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
                  className={`${inputBg} rounded-2xl p-3 font-mono text-sm font-bold`}
                />
              </div>
            </div>

            {rootData && (
              <div className={`flex flex-col gap-4 ${subCardBg} border rounded-2xl p-5`}>
                {rootData.error && (
                  <div className="text-amber-400 text-xs font-semibold">{rootData.error}</div>
                )}

                {rootData.root && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">
                        Converged Root (f(x) ≈ 0)
                      </span>
                      <span className="text-2xl font-mono font-bold text-emerald-400">
                        x ≈ {rootData.root}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy('root', rootData.root || '')}
                      className="px-3 py-1.5 bg-slate-800 text-xs text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5"
                    >
                      {copied === 'root' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
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
                          <td className="p-2.5 text-emerald-400 font-bold">
                            {formatNum(row.nextX)}
                          </td>
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
