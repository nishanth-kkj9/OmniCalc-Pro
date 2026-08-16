import React, { useState } from 'react';
import { Copy, Check, Sparkles, RefreshCw, Equal } from 'lucide-react';
import { AppSettings } from '../types';

interface EquationSolverProps {
  settings: AppSettings;
}

export const EquationSolver: React.FC<EquationSolverProps> = ({ settings }) => {
  const [solverType, setSolverType] = useState<'quadratic' | 'cubic' | 'linear2' | 'linear3'>('quadratic');
  const [copied, setCopied] = useState<string | null>(null);

  // Quadratic State (ax^2 + bx + c = 0)
  const [quadA, setQuadA] = useState<string>('1');
  const [quadB, setQuadB] = useState<string>('-5');
  const [quadC, setQuadC] = useState<string>('6');

  // Cubic State (ax^3 + bx^2 + cx + d = 0)
  const [cubA, setCubA] = useState<string>('1');
  const [cubB, setCubB] = useState<string>('-6');
  const [cubC, setCubC] = useState<string>('11');
  const [cubD, setCubD] = useState<string>('-6');

  // Linear 2x2
  const [l2, setL2] = useState({
    a1: '2', b1: '3', c1: '13',
    a2: '1', b2: '-2', c2: '-4',
  });

  // Linear 3x3
  const [l3, setL3] = useState({
    a1: '1', b1: '2', c1: '3', d1: '14',
    a2: '2', b2: '-1', c2: '1', d2: '3',
    a3: '3', b3: '1', c3: '-1', d3: '2',
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatNum = (n: number) => {
    if (Math.abs(n) < 1e-12) return '0';
    const prec = settings.precision || 6;
    return Number(n.toFixed(prec)).toString();
  };

  // Quadratic Calculation
  const solveQuadratic = () => {
    const a = parseFloat(quadA);
    const b = parseFloat(quadB);
    const c = parseFloat(quadC);

    if (isNaN(a) || isNaN(b) || isNaN(c)) return null;
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) < 1e-12) {
        return { error: 'Invalid equation: both a and b are 0.' };
      }
      // Linear bx + c = 0 => x = -c/b
      const x = -c / b;
      return {
        type: 'linear',
        roots: [`x = ${formatNum(x)}`],
        steps: [`Reduced to linear equation: ${b}x + ${c} = 0`, `x = -(${c}) / ${b} = ${formatNum(x)}`],
      };
    }

    const disc = b * b - 4 * a * c;
    const vertexX = -b / (2 * a);
    const vertexY = c - (b * b) / (4 * a);

    if (disc > 1e-12) {
      const r1 = (-b + Math.sqrt(disc)) / (2 * a);
      const r2 = (-b - Math.sqrt(disc)) / (2 * a);
      return {
        type: 'real_distinct',
        discriminant: disc,
        roots: [`x₁ = ${formatNum(r1)}`, `x₂ = ${formatNum(r2)}`],
        vertex: `(${formatNum(vertexX)}, ${formatNum(vertexY)})`,
        steps: [
          `Discriminant Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${formatNum(disc)} > 0`,
          `Two distinct real roots: x = (-b ± √Δ) / (2a)`,
          `x₁ = (-(${b}) + √${formatNum(disc)}) / (2·${a}) = ${formatNum(r1)}`,
          `x₂ = (-(${b}) - √${formatNum(disc)}) / (2·${a}) = ${formatNum(r2)}`,
        ],
      };
    } else if (Math.abs(disc) <= 1e-12) {
      const r = -b / (2 * a);
      return {
        type: 'real_repeated',
        discriminant: 0,
        roots: [`x₁ = x₂ = ${formatNum(r)}`],
        vertex: `(${formatNum(vertexX)}, ${formatNum(vertexY)})`,
        steps: [
          `Discriminant Δ = b² - 4ac = 0`,
          `One repeated real root: x = -b / (2a)`,
          `x = -(${b}) / (2·${a}) = ${formatNum(r)}`,
        ],
      };
    } else {
      const realPart = -b / (2 * a);
      const imagPart = Math.sqrt(-disc) / (2 * a);
      return {
        type: 'complex',
        discriminant: disc,
        roots: [
          `x₁ = ${formatNum(realPart)} + ${formatNum(Math.abs(imagPart))}i`,
          `x₂ = ${formatNum(realPart)} - ${formatNum(Math.abs(imagPart))}i`,
        ],
        vertex: `(${formatNum(vertexX)}, ${formatNum(vertexY)})`,
        steps: [
          `Discriminant Δ = b² - 4ac = ${formatNum(disc)} < 0`,
          `Two complex conjugate roots: x = (-b ± i√|Δ|) / (2a)`,
          `x₁ = ${formatNum(realPart)} + ${formatNum(Math.abs(imagPart))}i`,
          `x₂ = ${formatNum(realPart)} - ${formatNum(Math.abs(imagPart))}i`,
        ],
      };
    }
  };

  // Cubic Calculation (Cardano's Formula)
  const solveCubic = () => {
    const a = parseFloat(cubA);
    const b = parseFloat(cubB);
    const c = parseFloat(cubC);
    const d = parseFloat(cubD);

    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) return null;
    if (Math.abs(a) < 1e-12) {
      return { error: 'Coefficient a cannot be 0 for a cubic equation.' };
    }

    // Normalized: x^3 + Ax^2 + Bx + C = 0
    const A = b / a;
    const B = c / a;
    const C = d / a;

    // Depressed cubic: t^3 + pt + q = 0 where x = t - A/3
    const p = B - (A * A) / 3;
    const q = (2 * A * A * A) / 27 - (A * B) / 3 + C;
    const delta = (q * q) / 4 + (p * p * p) / 27;

    const shift = -A / 3;
    const roots: string[] = [];

    if (Math.abs(delta) < 1e-12) {
      if (Math.abs(p) < 1e-12 && Math.abs(q) < 1e-12) {
        roots.push(`x₁ = x₂ = x₃ = ${formatNum(shift)}`);
      } else {
        const u = Math.cbrt(-q / 2);
        const r1 = 2 * u + shift;
        const r2 = -u + shift;
        roots.push(`x₁ = ${formatNum(r1)}`, `x₂ = x₃ = ${formatNum(r2)}`);
      }
    } else if (delta > 0) {
      const u = Math.cbrt(-q / 2 + Math.sqrt(delta));
      const v = Math.cbrt(-q / 2 - Math.sqrt(delta));
      const r1 = u + v + shift;
      const realPart = -(u + v) / 2 + shift;
      const imagPart = ((u - v) * Math.sqrt(3)) / 2;
      roots.push(
        `x₁ = ${formatNum(r1)} (Real)`,
        `x₂ = ${formatNum(realPart)} + ${formatNum(Math.abs(imagPart))}i`,
        `x₃ = ${formatNum(realPart)} - ${formatNum(Math.abs(imagPart))}i`
      );
    } else {
      // 3 distinct real roots
      const r = Math.sqrt(-(p * p * p) / 27);
      const phi = Math.acos(Math.max(-1, Math.min(1, -q / (2 * r))));
      const factor = 2 * Math.cbrt(r);
      const r1 = factor * Math.cos(phi / 3) + shift;
      const r2 = factor * Math.cos((phi + 2 * Math.PI) / 3) + shift;
      const r3 = factor * Math.cos((phi + 4 * Math.PI) / 3) + shift;
      roots.push(`x₁ = ${formatNum(r1)}`, `x₂ = ${formatNum(r2)}`, `x₃ = ${formatNum(r3)}`);
    }

    return {
      roots,
      depressed: `t³ + (${formatNum(p)})t + (${formatNum(q)}) = 0`,
      shift: `Substitution: x = t - (${formatNum(A / 3)})`,
    };
  };

  // Solve 2x2
  const solveLinear2x2 = () => {
    const a1 = parseFloat(l2.a1), b1 = parseFloat(l2.b1), c1 = parseFloat(l2.c1);
    const a2 = parseFloat(l2.a2), b2 = parseFloat(l2.b2), c2 = parseFloat(l2.c2);

    if ([a1, b1, c1, a2, b2, c2].some(isNaN)) return null;

    const D = a1 * b2 - a2 * b1;
    const Dx = c1 * b2 - c2 * b1;
    const Dy = a1 * c2 - a2 * c1;

    if (Math.abs(D) < 1e-12) {
      if (Math.abs(Dx) < 1e-12 && Math.abs(Dy) < 1e-12) {
        return { status: 'infinite', msg: 'Infinitely many solutions (dependent system).' };
      }
      return { status: 'none', msg: 'No solution (parallel/inconsistent equations).' };
    }

    const x = Dx / D;
    const y = Dy / D;

    return {
      status: 'unique',
      x: formatNum(x),
      y: formatNum(y),
      D: formatNum(D),
      Dx: formatNum(Dx),
      Dy: formatNum(Dy),
    };
  };

  // Solve 3x3 Determinant
  const det3 = (
    m11: number, m12: number, m13: number,
    m21: number, m22: number, m23: number,
    m31: number, m32: number, m33: number
  ) => {
    return (
      m11 * (m22 * m33 - m23 * m32) -
      m12 * (m21 * m33 - m23 * m31) +
      m13 * (m21 * m32 - m22 * m31)
    );
  };

  const solveLinear3x3 = () => {
    const a1 = parseFloat(l3.a1), b1 = parseFloat(l3.b1), c1 = parseFloat(l3.c1), d1 = parseFloat(l3.d1);
    const a2 = parseFloat(l3.a2), b2 = parseFloat(l3.b2), c2 = parseFloat(l3.c2), d2 = parseFloat(l3.d2);
    const a3 = parseFloat(l3.a3), b3 = parseFloat(l3.b3), c3 = parseFloat(l3.c3), d3 = parseFloat(l3.d3);

    if ([a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3].some(isNaN)) return null;

    const D = det3(a1, b1, c1, a2, b2, c2, a3, b3, c3);
    const Dx = det3(d1, b1, c1, d2, b2, c2, d3, b3, c3);
    const Dy = det3(a1, d1, c1, a2, d2, c2, a3, d3, c3);
    const Dz = det3(a1, b1, d1, a2, b2, d2, a3, b3, d3);

    if (Math.abs(D) < 1e-12) {
      if (Math.abs(Dx) < 1e-12 && Math.abs(Dy) < 1e-12 && Math.abs(Dz) < 1e-12) {
        return { status: 'infinite', msg: 'Infinitely many solutions.' };
      }
      return { status: 'none', msg: 'No solution (system is inconsistent).' };
    }

    const x = Dx / D;
    const y = Dy / D;
    const z = Dz / D;

    return {
      status: 'unique',
      x: formatNum(x),
      y: formatNum(y),
      z: formatNum(z),
      D: formatNum(D),
      Dx: formatNum(Dx),
      Dy: formatNum(Dy),
      Dz: formatNum(Dz),
    };
  };

  const quadRes = solveQuadratic();
  const cubRes = solveCubic();
  const l2Res = solveLinear2x2();
  const l3Res = solveLinear3x3();

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'quadratic', label: 'Quadratic (ax² + bx + c = 0)' },
          { id: 'cubic', label: 'Cubic (ax³ + bx² + cx + d = 0)' },
          { id: 'linear2', label: '2×2 Linear System' },
          { id: 'linear3', label: '3×3 Linear System' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSolverType(tab.id as any)}
            className={`
              px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm
              ${solverType === tab.id
                ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Solver Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        {/* QUADRATIC SOLVER */}
        {solverType === 'quadratic' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Quadratic Equation Solver</h3>
                <p className="text-xs text-slate-400">Standard form: ax² + bx + c = 0</p>
              </div>
              <button
                onClick={() => { setQuadA('1'); setQuadB('-5'); setQuadC('6'); }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                title="Reset to example"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Example
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Coefficient a</label>
                <input
                  type="number"
                  value={quadA}
                  onChange={(e) => setQuadA(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Coefficient b</label>
                <input
                  type="number"
                  value={quadB}
                  onChange={(e) => setQuadB(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Constant c</label>
                <input
                  type="number"
                  value={quadC}
                  onChange={(e) => setQuadC(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Formatted Equation */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center font-mono text-base font-bold text-sky-400">
              ({quadA || 0})x² + ({quadB || 0})x + ({quadC || 0}) = 0
            </div>

            {/* Results */}
            {quadRes && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {quadRes.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{quadRes.error}</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calculated Roots</span>
                      <button
                        onClick={() => handleCopy('quad', (quadRes.roots || []).join(', '))}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {copied === 'quad' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === 'quad' ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quadRes.roots?.map((root, i) => (
                        <div key={i} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-lg font-bold text-emerald-400">
                          {root}
                        </div>
                      ))}
                    </div>

                    {quadRes.vertex && (
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>Parabola Vertex (h, k):</span>
                        <span className="font-mono font-bold text-slate-200">{quadRes.vertex}</span>
                      </div>
                    )}

                    {/* Step by step */}
                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-slate-400">Step-by-Step Breakdown:</span>
                      {quadRes.steps?.map((step, idx) => (
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

        {/* CUBIC SOLVER */}
        {solverType === 'cubic' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Cubic Equation Solver</h3>
                <p className="text-xs text-slate-400">Standard form: ax³ + bx² + cx + d = 0</p>
              </div>
              <button
                onClick={() => { setCubA('1'); setCubB('-6'); setCubC('11'); setCubD('-6'); }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Example
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'a (x³)', val: cubA, set: setCubA },
                { label: 'b (x²)', val: cubB, set: setCubB },
                { label: 'c (x)', val: cubC, set: setCubC },
                { label: 'd (const)', val: cubD, set: setCubD },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">{item.label}</label>
                  <input
                    type="number"
                    value={item.val}
                    onChange={(e) => item.set(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center font-mono text-base font-bold text-sky-400">
              ({cubA || 0})x³ + ({cubB || 0})x² + ({cubC || 0})x + ({cubD || 0}) = 0
            </div>

            {cubRes && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {cubRes.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{cubRes.error}</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">All 3 Roots</span>
                      <button
                        onClick={() => handleCopy('cub', (cubRes.roots || []).join(', '))}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {copied === 'cub' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === 'cub' ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {cubRes.roots?.map((root, i) => (
                        <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-base font-bold text-emerald-400">
                          {root}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-1 text-xs text-slate-400">
                      <p>• {cubRes.shift}</p>
                      <p>• Depressed form: {cubRes.depressed}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2X2 LINEAR SYSTEM */}
        {solverType === 'linear2' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">2×2 System of Linear Equations</h3>
                <p className="text-xs text-slate-400">Solved via Cramer's Rule determinants</p>
              </div>
              <button
                onClick={() => setL2({ a1: '2', b1: '3', c1: '13', a2: '1', b2: '-2', c2: '-4' })}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Example
              </button>
            </div>

            {/* Equation 1 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400">Equation 1: a₁·x + b₁·y = c₁</span>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="a1"
                  value={l2.a1}
                  onChange={(e) => setL2({ ...l2, a1: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-base font-mono font-bold text-slate-100"
                />
                <input
                  type="number"
                  placeholder="b1"
                  value={l2.b1}
                  onChange={(e) => setL2({ ...l2, b1: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-base font-mono font-bold text-slate-100"
                />
                <input
                  type="number"
                  placeholder="c1"
                  value={l2.c1}
                  onChange={(e) => setL2({ ...l2, c1: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-base font-mono font-bold text-sky-300"
                />
              </div>
            </div>

            {/* Equation 2 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400">Equation 2: a₂·x + b₂·y = c₂</span>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="a2"
                  value={l2.a2}
                  onChange={(e) => setL2({ ...l2, a2: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-base font-mono font-bold text-slate-100"
                />
                <input
                  type="number"
                  placeholder="b2"
                  value={l2.b2}
                  onChange={(e) => setL2({ ...l2, b2: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-base font-mono font-bold text-slate-100"
                />
                <input
                  type="number"
                  placeholder="c2"
                  value={l2.c2}
                  onChange={(e) => setL2({ ...l2, c2: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-base font-mono font-bold text-sky-300"
                />
              </div>
            </div>

            {/* Results */}
            {l2Res && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {l2Res.status !== 'unique' ? (
                  <div className="text-amber-400 font-semibold text-sm">{l2Res.msg}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">Value of x</span>
                        <span className="text-2xl font-mono font-bold text-emerald-400">x = {l2Res.x}</span>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">Value of y</span>
                        <span className="text-2xl font-mono font-bold text-emerald-400">y = {l2Res.y}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
                      <span>Cramer Determinants:</span>
                      <span className="font-mono text-slate-300">D = {l2Res.D}, Dx = {l2Res.Dx}, Dy = {l2Res.Dy}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3X3 LINEAR SYSTEM */}
        {solverType === 'linear3' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">3×3 System of Linear Equations</h3>
                <p className="text-xs text-slate-400">Enter coefficients for x, y, z and constants</p>
              </div>
              <button
                onClick={() => setL3({
                  a1: '1', b1: '2', c1: '3', d1: '14',
                  a2: '2', b2: '-1', c2: '1', d2: '3',
                  a3: '3', b3: '1', c3: '-1', d3: '2',
                })}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Example
              </button>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-4 gap-2.5 items-center">
              <input type="number" placeholder="a1" value={l3.a1} onChange={(e) => setL3({ ...l3, a1: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100" />
              <input type="number" placeholder="b1" value={l3.b1} onChange={(e) => setL3({ ...l3, b1: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100" />
              <input type="number" placeholder="c1" value={l3.c1} onChange={(e) => setL3({ ...l3, c1: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100" />
              <input type="number" placeholder="= d1" value={l3.d1} onChange={(e) => setL3({ ...l3, d1: e.target.value })} className="bg-slate-800 border border-sky-500/50 rounded-xl p-2.5 font-mono text-sm font-bold text-sky-300" />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-4 gap-2.5 items-center">
              <input type="number" placeholder="a2" value={l3.a2} onChange={(e) => setL3({ ...l3, a2: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100" />
              <input type="number" placeholder="b2" value={l3.b2} onChange={(e) => setL3({ ...l3, b2: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100" />
              <input type="number" placeholder="c2" value={l3.c2} onChange={(e) => setL3({ ...l3, c2: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100" />
              <input type="number" placeholder="= d2" value={l3.d2} onChange={(e) => setL3({ ...l3, d2: e.target.value })} className="bg-slate-800 border border-sky-500/50 rounded-xl p-2.5 font-mono text-sm font-bold text-sky-300" />
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-4 gap-2.5 items-center">
              <input type="number" placeholder="a3" value={l3.a3} onChange={(e) => setL3({ ...l3, a3: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100" />
              <input type="number" placeholder="b3" value={l3.b3} onChange={(e) => setL3({ ...l3, b3: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100" />
              <input type="number" placeholder="c3" value={l3.c3} onChange={(e) => setL3({ ...l3, c3: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100" />
              <input type="number" placeholder="= d3" value={l3.d3} onChange={(e) => setL3({ ...l3, d3: e.target.value })} className="bg-slate-800 border border-sky-500/50 rounded-xl p-2.5 font-mono text-sm font-bold text-sky-300" />
            </div>

            {/* Results */}
            {l3Res && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {l3Res.status !== 'unique' ? (
                  <div className="text-amber-400 font-semibold text-sm">{l3Res.msg}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">x</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">x = {l3Res.x}</span>
                      </div>
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">y</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">y = {l3Res.y}</span>
                      </div>
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">z</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">z = {l3Res.z}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
                      <span>Determinant |D|:</span>
                      <span className="font-mono text-slate-300">D = {l3Res.D}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
