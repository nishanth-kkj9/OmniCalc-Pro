import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check, RefreshCw, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { AppSettings } from '../types';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';

interface EquationSolverProps {
  settings: AppSettings;
}

export const EquationSolver: React.FC<EquationSolverProps> = ({ settings }) => {
  const [solverType, setSolverType] = useState<'quadratic' | 'cubic' | 'linear2' | 'linear3'>(
    'quadratic'
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [showDetailedSteps, setShowDetailedSteps] = useState<boolean>(true);
  const [exportData, setExportData] = useState<ExportReportData | null>(null);

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
    a1: '2',
    b1: '3',
    c1: '13',
    a2: '1',
    b2: '-2',
    c2: '-4',
  });

  // Linear 3x3
  const [l3, setL3] = useState({
    a1: '1',
    b1: '2',
    c1: '3',
    d1: '14',
    a2: '2',
    b2: '-1',
    c2: '1',
    d2: '3',
    a3: '3',
    b3: '1',
    c3: '-1',
    d3: '2',
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatNum = useCallback(
    (n: number) => {
      if (Math.abs(n) < 1e-12) return '0';
      const prec = settings.precision || 6;
      return Number(n.toFixed(prec)).toString();
    },
    [settings.precision]
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

  // Quadratic Calculation with Complete Algebraic Derivation
  const quadRes = useMemo(() => {
    const a = parseFloat(quadA);
    const b = parseFloat(quadB);
    const c = parseFloat(quadC);

    if (isNaN(a) || isNaN(b) || isNaN(c)) return null;
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) < 1e-12) {
        return { error: 'Degenerate equation: both a and b are 0.' };
      }
      const x = -c / b;
      return {
        type: 'linear',
        roots: [`x = ${formatNum(x)}`],
        steps: [
          `Degenerate quadratic: coefficient a = 0 reduces equation to linear form: ${b}x + ${c} = 0`,
          `Subtract ${c} from both sides: ${b}x = -(${c})`,
          `Divide by ${b}: x = -(${c}) / ${b} = ${formatNum(x)}`,
        ],
        latex: `${b}x + (${c}) = 0 \\implies x = ${formatNum(x)}`,
      };
    }

    const disc = b * b - 4 * a * c;
    const vertexX = -b / (2 * a);
    const vertexY = c - (b * b) / (4 * a);
    const axisSymmetry = `x = ${formatNum(vertexX)}`;
    const concavity = a > 0 ? 'Upward (Minimum at vertex)' : 'Downward (Maximum at vertex)';

    if (disc > 1e-12) {
      const sqrtD = Math.sqrt(disc);
      const r1 = (-b + sqrtD) / (2 * a);
      const r2 = (-b - sqrtD) / (2 * a);
      return {
        type: 'real_distinct',
        discriminant: disc,
        roots: [`x₁ = ${formatNum(r1)}`, `x₂ = ${formatNum(r2)}`],
        vertex: `(${formatNum(vertexX)}, ${formatNum(vertexY)})`,
        axisSymmetry,
        concavity,
        steps: [
          `Standard Form: (${a})x² + (${b})x + (${c}) = 0`,
          `Step 1: Compute the Discriminant Δ = b² - 4ac`,
          `   Δ = (${b})² - 4·(${a})·(${c}) = ${b * b} - (${4 * a * c}) = ${formatNum(disc)}`,
          `   Since Δ > 0, the equation has two distinct real roots.`,
          `Step 2: Apply the Quadratic Formula: x = (-b ± √Δ) / (2a)`,
          `   x₁ = (-(${b}) + √${formatNum(disc)}) / (2·${a}) = (${-b} + ${formatNum(sqrtD)}) / (${2 * a}) = ${formatNum(r1)}`,
          `   x₂ = (-(${b}) - √${formatNum(disc)}) / (2·${a}) = (${-b} - ${formatNum(sqrtD)}) / (${2 * a}) = ${formatNum(r2)}`,
          `Step 3: Parabola Geometry`,
          `   Vertex (h, k) = (-b/(2a), f(h)) = (${formatNum(vertexX)}, ${formatNum(vertexY)})`,
          `   Axis of Symmetry: ${axisSymmetry}`,
          `   Parabola opens: ${concavity}`,
          `Step 4: Factored Form: ${a !== 1 ? `${a}` : ''}(x - ${formatNum(r1)})(x - ${formatNum(r2)}) = 0`,
        ],
        latex: `ax^2 + bx + c = 0 \\implies x_{1,2} = \\frac{-(${b}) \\pm \\sqrt{${formatNum(disc)}}}{2(${a})} = \\{ ${formatNum(r1)}, \\, ${formatNum(r2)} \\}`,
      };
    } else if (Math.abs(disc) <= 1e-12) {
      const r = -b / (2 * a);
      return {
        type: 'real_repeated',
        discriminant: 0,
        roots: [`x₁ = x₂ = ${formatNum(r)} (Multiplicity 2)`],
        vertex: `(${formatNum(vertexX)}, ${formatNum(vertexY)})`,
        axisSymmetry,
        concavity,
        steps: [
          `Standard Form: (${a})x² + (${b})x + (${c}) = 0`,
          `Step 1: Compute Discriminant Δ = b² - 4ac = (${b})² - 4·(${a})·(${c}) = 0`,
          `   Since Δ = 0, the parabola touches the x-axis at a single repeated root (tangent point).`,
          `Step 2: Apply Formula x = -b / (2a)`,
          `   x = -(${b}) / (2·${a}) = ${formatNum(r)}`,
          `Step 3: Factored Form: ${a !== 1 ? `${a}` : ''}(x - ${formatNum(r)})² = 0`,
        ],
        latex: `ax^2 + bx + c = 0 \\implies x_1 = x_2 = -\\frac{${b}}{2(${a})} = ${formatNum(r)}`,
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
        axisSymmetry,
        concavity,
        steps: [
          `Standard Form: (${a})x² + (${b})x + (${c}) = 0`,
          `Step 1: Compute Discriminant Δ = b² - 4ac = ${formatNum(disc)} < 0`,
          `   Since Δ < 0, the equation has two complex conjugate roots (no real x-intercepts).`,
          `Step 2: Complex Root Extraction: x = (-b ± i√|Δ|) / (2a)`,
          `   Real Part: Re(x) = -b / (2a) = -(${b}) / (2·${a}) = ${formatNum(realPart)}`,
          `   Imaginary Part: Im(x) = √|${formatNum(disc)}| / (2·${a}) = ${formatNum(Math.abs(imagPart))}`,
          `   x₁ = ${formatNum(realPart)} + ${formatNum(Math.abs(imagPart))}i`,
          `   x₂ = ${formatNum(realPart)} - ${formatNum(Math.abs(imagPart))}i`,
        ],
        latex: `ax^2 + bx + c = 0 \\implies x_{1,2} = ${formatNum(realPart)} \\pm ${formatNum(Math.abs(imagPart))} i`,
      };
    }
  }, [quadA, quadB, quadC, formatNum]);

  // Cubic Calculation (Cardano's Method)
  const cubRes = useMemo(() => {
    const a = parseFloat(cubA);
    const b = parseFloat(cubB);
    const c = parseFloat(cubC);
    const d = parseFloat(cubD);

    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) return null;
    if (Math.abs(a) < 1e-12) {
      return { error: 'Leading coefficient a cannot be 0 for a cubic equation.' };
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
    const steps: string[] = [
      `Step 1: Normalization (divide by a = ${a}): x³ + (${formatNum(A)})x² + (${formatNum(B)})x + (${formatNum(C)}) = 0`,
      `Step 2: Tschirnhaus Depression substitution: x = t - (${formatNum(A / 3)})`,
      `   Depressed cubic form: t³ + pt + q = 0`,
      `   p = B - A²/3 = ${formatNum(p)}`,
      `   q = 2A³/27 - AB/3 + C = ${formatNum(q)}`,
      `   Depressed equation: t³ + (${formatNum(p)})t + (${formatNum(q)}) = 0`,
      `Step 3: Cardano Discriminant Δ = (q/2)² + (p/3)³ = ${formatNum(delta)}`,
    ];

    if (Math.abs(delta) < 1e-12) {
      if (Math.abs(p) < 1e-12 && Math.abs(q) < 1e-12) {
        roots.push(`x₁ = x₂ = x₃ = ${formatNum(shift)} (Triple real root)`);
        steps.push(`   All roots are equal: x = ${formatNum(shift)}`);
      } else {
        const u = Math.cbrt(-q / 2);
        const r1 = 2 * u + shift;
        const r2 = -u + shift;
        roots.push(`x₁ = ${formatNum(r1)}`, `x₂ = x₃ = ${formatNum(r2)} (Double root)`);
        steps.push(
          `   Two real roots (one single, one double root): x₁ = ${formatNum(r1)}, x₂,₃ = ${formatNum(r2)}`
        );
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
      steps.push(
        `   Since Δ > 0, there is 1 real root and 2 complex conjugate roots.`,
        `   Cardano radicals: u = ∛(-q/2 + √Δ) = ${formatNum(u)}, v = ∛(-q/2 - √Δ) = ${formatNum(v)}`,
        `   x₁ = u + v - A/3 = ${formatNum(r1)}`,
        `   x₂,₃ = -(u+v)/2 - A/3 ± i(u-v)√3/2 = ${formatNum(realPart)} ± ${formatNum(Math.abs(imagPart))}i`
      );
    } else {
      // 3 distinct real roots (Casus Irreducibilis)
      const r = Math.sqrt(-(p * p * p) / 27);
      const phi = Math.acos(Math.max(-1, Math.min(1, -q / (2 * r))));
      const factor = 2 * Math.cbrt(r);
      const r1 = factor * Math.cos(phi / 3) + shift;
      const r2 = factor * Math.cos((phi + 2 * Math.PI) / 3) + shift;
      const r3 = factor * Math.cos((phi + 4 * Math.PI) / 3) + shift;
      roots.push(`x₁ = ${formatNum(r1)}`, `x₂ = ${formatNum(r2)}`, `x₃ = ${formatNum(r3)}`);
      steps.push(
        `   Since Δ < 0, there are 3 distinct real roots (Casus Irreducibilis resolved via trigonometry).`,
        `   Angle φ = arccos(-q / (2√(-p³/27))) = ${((phi * 180) / Math.PI).toFixed(2)}°`,
        `   x₁ = 2√(-p/3)·cos(φ/3) + shift = ${formatNum(r1)}`,
        `   x₂ = 2√(-p/3)·cos((φ+2π)/3) + shift = ${formatNum(r2)}`,
        `   x₃ = 2√(-p/3)·cos((φ+4π)/3) + shift = ${formatNum(r3)}`
      );
    }

    return {
      roots,
      steps,
      depressed: `t³ + (${formatNum(p)})t + (${formatNum(q)}) = 0`,
      shift: `Substitution: x = t - (${formatNum(A / 3)})`,
      latex: `(${a})x^3 + (${b})x^2 + (${c})x + (${d}) = 0 \\implies x = \\{ ${roots.join(', ')} \\}`,
    };
  }, [cubA, cubB, cubC, cubD, formatNum]);

  // Solve 2x2 with Cramer's Determinants & Gaussian Elimination
  const l2Res = useMemo(() => {
    const a1 = parseFloat(l2.a1),
      b1 = parseFloat(l2.b1),
      c1 = parseFloat(l2.c1);
    const a2 = parseFloat(l2.a2),
      b2 = parseFloat(l2.b2),
      c2 = parseFloat(l2.c2);

    if ([a1, b1, c1, a2, b2, c2].some(isNaN)) return null;

    const D = a1 * b2 - a2 * b1;
    const Dx = c1 * b2 - c2 * b1;
    const Dy = a1 * c2 - a2 * c1;

    if (Math.abs(D) < 1e-12) {
      if (Math.abs(Dx) < 1e-12 && Math.abs(Dy) < 1e-12) {
        return {
          status: 'infinite',
          msg: 'Infinitely many solutions (dependent/coincident lines).',
        };
      }
      return { status: 'none', msg: 'No solution (inconsistent/parallel lines).' };
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
      steps: [
        `System:`,
        `  (1) ${a1}x + ${b1}y = ${c1}`,
        `  (2) ${a2}x + ${b2}y = ${c2}`,
        `Step 1: Compute Main Determinant |D| = a₁b₂ - a₂b₁`,
        `   |D| = (${a1})(${b2}) - (${a2})(${b1}) = ${formatNum(D)}`,
        `Step 2: Compute x-Determinant |Dx| (replace x column with constants)`,
        `   |Dx| = (${c1})(${b2}) - (${c2})(${b1}) = ${formatNum(Dx)}`,
        `Step 3: Compute y-Determinant |Dy| (replace y column with constants)`,
        `   |Dy| = (${a1})(${c2}) - (${a2})(${c1}) = ${formatNum(Dy)}`,
        `Step 4: Solve via Cramer's Rule`,
        `   x = |Dx| / |D| = ${formatNum(Dx)} / ${formatNum(D)} = ${formatNum(x)}`,
        `   y = |Dy| / |D| = ${formatNum(Dy)} / ${formatNum(D)} = ${formatNum(y)}`,
      ],
      latex: `\\begin{cases} ${a1}x + ${b1}y = ${c1} \\\\ ${a2}x + ${b2}y = ${c2} \\end{cases} \\implies (x, y) = (${formatNum(x)}, \\, ${formatNum(y)})`,
    };
  }, [l2, formatNum]);

  // Solve 3x3 Determinant and Matrix Reduction
  const det3 = (
    m11: number,
    m12: number,
    m13: number,
    m21: number,
    m22: number,
    m23: number,
    m31: number,
    m32: number,
    m33: number
  ) => {
    return (
      m11 * (m22 * m33 - m23 * m32) - m12 * (m21 * m33 - m23 * m31) + m13 * (m21 * m32 - m22 * m31)
    );
  };

  const l3Res = useMemo(() => {
    const a1 = parseFloat(l3.a1),
      b1 = parseFloat(l3.b1),
      c1 = parseFloat(l3.c1),
      d1 = parseFloat(l3.d1);
    const a2 = parseFloat(l3.a2),
      b2 = parseFloat(l3.b2),
      c2 = parseFloat(l3.c2),
      d2 = parseFloat(l3.d2);
    const a3 = parseFloat(l3.a3),
      b3 = parseFloat(l3.b3),
      c3 = parseFloat(l3.c3),
      d3 = parseFloat(l3.d3);

    if ([a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3].some(isNaN)) return null;

    const D = det3(a1, b1, c1, a2, b2, c2, a3, b3, c3);
    const Dx = det3(d1, b1, c1, d2, b2, c2, d3, b3, c3);
    const Dy = det3(a1, d1, c1, a2, d2, c2, a3, d3, c3);
    const Dz = det3(a1, b1, d1, a2, b2, d2, a3, b3, d3);

    if (Math.abs(D) < 1e-12) {
      if (Math.abs(Dx) < 1e-12 && Math.abs(Dy) < 1e-12 && Math.abs(Dz) < 1e-12) {
        return { status: 'infinite', msg: 'Infinitely many solutions (dependent 3D planes).' };
      }
      return { status: 'none', msg: 'No solution (inconsistent 3D system).' };
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
      steps: [
        `System:`,
        `  (1) ${a1}x + ${b1}y + ${c1}z = ${d1}`,
        `  (2) ${a2}x + ${b2}y + ${c2}z = ${d2}`,
        `  (3) ${a3}x + ${b3}y + ${c3}z = ${d3}`,
        `Step 1: Coefficient Determinant |D| via Laplace expansion = ${formatNum(D)}`,
        `Step 2: Substituted Determinants:`,
        `   |Dx| = ${formatNum(Dx)}`,
        `   |Dy| = ${formatNum(Dy)}`,
        `   |Dz| = ${formatNum(Dz)}`,
        `Step 3: Cramer's Solutions:`,
        `   x = |Dx| / |D| = ${formatNum(Dx)} / ${formatNum(D)} = ${formatNum(x)}`,
        `   y = |Dy| / |D| = ${formatNum(Dy)} / ${formatNum(D)} = ${formatNum(y)}`,
        `   z = |Dz| / |D| = ${formatNum(Dz)} / ${formatNum(D)} = ${formatNum(z)}`,
      ],
      latex: `\\begin{cases} ${a1}x + ${b1}y + ${c1}z = ${d1} \\\\ ${a2}x + ${b2}y + ${c2}z = ${d2} \\\\ ${a3}x + ${b3}y + ${c3}z = ${d3} \\end{cases} \\implies (x, y, z) = (${formatNum(x)}, \\, ${formatNum(y)}, \\, ${formatNum(z)})`,
    };
  }, [l3, formatNum]);

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
              px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm flex-shrink-0
              ${
                solverType === tab.id
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
      <div className={`${cardBg} border rounded-3xl p-6 flex flex-col gap-6`}>
        {/* QUADRATIC SOLVER */}
        {solverType === 'quadratic' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Quadratic Equation Solver</h3>
                <p className="text-xs text-slate-400">
                  Complete algebraic derivation, vertex geometry, and roots
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setQuadA('1');
                    setQuadB('-5');
                    setQuadC('6');
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                  title="Reset to example"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Example
                </button>
                {quadRes && !quadRes.error && (
                  <button
                    onClick={() => {
                      setExportData({
                        title: 'Quadratic Equation Resolution',
                        engine: 'Equation Solver',
                        timestamp: Date.now(),
                        inputDescription: `(${quadA})x² + (${quadB})x + (${quadC}) = 0`,
                        resultSummary: (quadRes.roots || []).join(', '),
                        latex: quadRes.latex,
                        steps: quadRes.steps,
                        metadata: {
                          'Discriminant Δ':
                            quadRes.discriminant !== undefined ? `${quadRes.discriminant}` : '0',
                          'Vertex (h, k)': quadRes.vertex || '',
                          'Axis of Symmetry': quadRes.axisSymmetry || '',
                        },
                      });
                    }}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Report
                  </button>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Coefficient a</label>
                <input
                  type="number"
                  value={quadA}
                  onChange={(e) => setQuadA(e.target.value)}
                  className={`w-full ${inputBg} rounded-2xl p-3.5 text-lg font-mono font-bold focus:outline-none`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Coefficient b</label>
                <input
                  type="number"
                  value={quadB}
                  onChange={(e) => setQuadB(e.target.value)}
                  className={`w-full ${inputBg} rounded-2xl p-3.5 text-lg font-mono font-bold focus:outline-none`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Constant c</label>
                <input
                  type="number"
                  value={quadC}
                  onChange={(e) => setQuadC(e.target.value)}
                  className={`w-full ${inputBg} rounded-2xl p-3.5 text-lg font-mono font-bold focus:outline-none`}
                />
              </div>
            </div>

            {/* Formatted Equation */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center font-mono text-base font-bold text-sky-400">
              ({quadA || 0})x² + ({quadB || 0})x + ({quadC || 0}) = 0
            </div>

            {/* Results */}
            {quadRes && (
              <div className={`flex flex-col gap-4 ${subCardBg} border rounded-2xl p-5`}>
                {quadRes.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{quadRes.error}</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Calculated Roots
                      </span>
                      <button
                        onClick={() => handleCopy('quad', (quadRes.roots || []).join(', '))}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {copied === 'quad' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied === 'quad' ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quadRes.roots?.map((root, i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-lg font-bold text-emerald-400"
                        >
                          {root}
                        </div>
                      ))}
                    </div>

                    {quadRes.vertex && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs border-t border-slate-800 pt-3 text-slate-400">
                        <div>
                          <span>Parabola Vertex (h, k):</span>
                          <p className="font-mono font-bold text-slate-200 text-sm mt-0.5">
                            {quadRes.vertex}
                          </p>
                        </div>
                        <div>
                          <span>Axis of Symmetry:</span>
                          <p className="font-mono font-bold text-slate-200 text-sm mt-0.5">
                            {quadRes.axisSymmetry}
                          </p>
                        </div>
                        <div>
                          <span>Opening Orientation:</span>
                          <p className="font-bold text-sky-400 text-xs mt-0.5">
                            {quadRes.concavity}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step-by-Step Toggle & Breakdown */}
                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
                      <button
                        onClick={() => setShowDetailedSteps(!showDetailedSteps)}
                        className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-sky-400" />
                          Step-by-Step Formal Mathematical Derivation
                        </span>
                        {showDetailedSteps ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {showDetailedSteps && (
                        <div className="flex flex-col gap-1.5 mt-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                          {quadRes.steps?.map((step, idx) => (
                            <div key={idx} className="text-xs font-mono text-slate-300">
                              {step}
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

        {/* CUBIC SOLVER */}
        {solverType === 'cubic' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Cubic Equation Solver (Cardano's Method)
                </h3>
                <p className="text-xs text-slate-400">Standard form: ax³ + bx² + cx + d = 0</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCubA('1');
                    setCubB('-6');
                    setCubC('11');
                    setCubD('-6');
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Example
                </button>
                {cubRes && !cubRes.error && (
                  <button
                    onClick={() => {
                      setExportData({
                        title: 'Cubic Equation Resolution (Cardano)',
                        engine: 'Equation Solver',
                        timestamp: Date.now(),
                        inputDescription: `(${cubA})x³ + (${cubB})x² + (${cubC})x + (${cubD}) = 0`,
                        resultSummary: (cubRes.roots || []).join(', '),
                        latex: cubRes.latex,
                        steps: cubRes.steps,
                        metadata: {
                          'Depressed Form': cubRes.depressed || '',
                          Shift: cubRes.shift || '',
                        },
                      });
                    }}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Report
                  </button>
                )}
              </div>
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
                    className={`w-full ${inputBg} rounded-2xl p-3.5 text-lg font-mono font-bold focus:outline-none`}
                  />
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center font-mono text-base font-bold text-sky-400">
              ({cubA || 0})x³ + ({cubB || 0})x² + ({cubC || 0})x + ({cubD || 0}) = 0
            </div>

            {cubRes && (
              <div className={`flex flex-col gap-4 ${subCardBg} border rounded-2xl p-5`}>
                {cubRes.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{cubRes.error}</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        All 3 Roots
                      </span>
                      <button
                        onClick={() => handleCopy('cub', (cubRes.roots || []).join(', '))}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {copied === 'cub' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied === 'cub' ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {cubRes.roots?.map((root, i) => (
                        <div
                          key={i}
                          className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-base font-bold text-emerald-400"
                        >
                          {root}
                        </div>
                      ))}
                    </div>

                    {/* Step-by-Step Breakdown */}
                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-slate-400">
                        Cardano Method Derivation:
                      </span>
                      {cubRes.steps?.map((step, idx) => (
                        <div key={idx} className="text-xs font-mono text-slate-300">
                          {step}
                        </div>
                      ))}
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
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  2×2 System of Linear Equations
                </h3>
                <p className="text-xs text-slate-400">
                  Solved via Cramer's Rule determinants & Gaussian Elimination
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setL2({ a1: '2', b1: '3', c1: '13', a2: '1', b2: '-2', c2: '-4' })}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Example
                </button>
                {l2Res && l2Res.status === 'unique' && (
                  <button
                    onClick={() => {
                      setExportData({
                        title: '2×2 Linear System Resolution',
                        engine: 'Equation Solver',
                        timestamp: Date.now(),
                        inputDescription: `${l2.a1}x + ${l2.b1}y = ${l2.c1}; ${l2.a2}x + ${l2.b2}y = ${l2.c2}`,
                        resultSummary: `x = ${l2Res.x}, y = ${l2Res.y}`,
                        latex: l2Res.latex,
                        steps: l2Res.steps,
                        metadata: {
                          'Determinant |D|': l2Res.D || '',
                          'Determinant |Dx|': l2Res.Dx || '',
                          'Determinant |Dy|': l2Res.Dy || '',
                        },
                      });
                    }}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Report
                  </button>
                )}
              </div>
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
                  className={`${inputBg} rounded-2xl p-3 text-base font-mono font-bold`}
                />
                <input
                  type="number"
                  placeholder="b1"
                  value={l2.b1}
                  onChange={(e) => setL2({ ...l2, b1: e.target.value })}
                  className={`${inputBg} rounded-2xl p-3 text-base font-mono font-bold`}
                />
                <input
                  type="number"
                  placeholder="c1"
                  value={l2.c1}
                  onChange={(e) => setL2({ ...l2, c1: e.target.value })}
                  className={`${inputBg} rounded-2xl p-3 text-base font-mono font-bold text-sky-300`}
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
                  className={`${inputBg} rounded-2xl p-3 text-base font-mono font-bold`}
                />
                <input
                  type="number"
                  placeholder="b2"
                  value={l2.b2}
                  onChange={(e) => setL2({ ...l2, b2: e.target.value })}
                  className={`${inputBg} rounded-2xl p-3 text-base font-mono font-bold`}
                />
                <input
                  type="number"
                  placeholder="c2"
                  value={l2.c2}
                  onChange={(e) => setL2({ ...l2, c2: e.target.value })}
                  className={`${inputBg} rounded-2xl p-3 text-base font-mono font-bold text-sky-300`}
                />
              </div>
            </div>

            {/* Results */}
            {l2Res && (
              <div className={`flex flex-col gap-4 ${subCardBg} border rounded-2xl p-5`}>
                {l2Res.status !== 'unique' ? (
                  <div className="text-amber-400 font-semibold text-sm">{l2Res.msg}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">Value of x</span>
                        <span className="text-2xl font-mono font-bold text-emerald-400">
                          x = {l2Res.x}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">Value of y</span>
                        <span className="text-2xl font-mono font-bold text-emerald-400">
                          y = {l2Res.y}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-slate-400">
                        Step-by-Step Cramer's Determinants:
                      </span>
                      {l2Res.steps?.map((s, idx) => (
                        <div key={idx} className="text-xs font-mono text-slate-300">
                          {s}
                        </div>
                      ))}
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
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  3×3 System of Linear Equations
                </h3>
                <p className="text-xs text-slate-400">
                  Enter coefficients for x, y, z and constants
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setL3({
                      a1: '1',
                      b1: '2',
                      c1: '3',
                      d1: '14',
                      a2: '2',
                      b2: '-1',
                      c2: '1',
                      d2: '3',
                      a3: '3',
                      b3: '1',
                      c3: '-1',
                      d3: '2',
                    })
                  }
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Example
                </button>
                {l3Res && l3Res.status === 'unique' && (
                  <button
                    onClick={() => {
                      setExportData({
                        title: '3×3 Linear System Resolution',
                        engine: 'Equation Solver',
                        timestamp: Date.now(),
                        inputDescription: `3x3 System (D=${l3Res.D})`,
                        resultSummary: `x = ${l3Res.x}, y = ${l3Res.y}, z = ${l3Res.z}`,
                        latex: l3Res.latex,
                        steps: l3Res.steps,
                        metadata: {
                          'Main Determinant |D|': l3Res.D || '',
                          'Determinant |Dx|': l3Res.Dx || '',
                          'Determinant |Dy|': l3Res.Dy || '',
                          'Determinant |Dz|': l3Res.Dz || '',
                        },
                      });
                    }}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Report
                  </button>
                )}
              </div>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-2.5">
              {[
                {
                  r: '1',
                  a: l3.a1,
                  b: l3.b1,
                  c: l3.c1,
                  d: l3.d1,
                  sa: (v: string) => setL3({ ...l3, a1: v }),
                  sb: (v: string) => setL3({ ...l3, b1: v }),
                  sc: (v: string) => setL3({ ...l3, c1: v }),
                  sd: (v: string) => setL3({ ...l3, d1: v }),
                },
                {
                  r: '2',
                  a: l3.a2,
                  b: l3.b2,
                  c: l3.c2,
                  d: l3.d2,
                  sa: (v: string) => setL3({ ...l3, a2: v }),
                  sb: (v: string) => setL3({ ...l3, b2: v }),
                  sc: (v: string) => setL3({ ...l3, c2: v }),
                  sd: (v: string) => setL3({ ...l3, d2: v }),
                },
                {
                  r: '3',
                  a: l3.a3,
                  b: l3.b3,
                  c: l3.c3,
                  d: l3.d3,
                  sa: (v: string) => setL3({ ...l3, a3: v }),
                  sb: (v: string) => setL3({ ...l3, b3: v }),
                  sc: (v: string) => setL3({ ...l3, c3: v }),
                  sd: (v: string) => setL3({ ...l3, d3: v }),
                },
              ].map((row) => (
                <div key={row.r} className="grid grid-cols-4 gap-2.5 items-center">
                  <input
                    type="number"
                    placeholder={`a${row.r}`}
                    value={row.a}
                    onChange={(e) => row.sa(e.target.value)}
                    className={`${inputBg} rounded-xl p-2.5 font-mono text-sm font-bold`}
                  />
                  <input
                    type="number"
                    placeholder={`b${row.r}`}
                    value={row.b}
                    onChange={(e) => row.sb(e.target.value)}
                    className={`${inputBg} rounded-xl p-2.5 font-mono text-sm font-bold`}
                  />
                  <input
                    type="number"
                    placeholder={`c${row.r}`}
                    value={row.c}
                    onChange={(e) => row.sc(e.target.value)}
                    className={`${inputBg} rounded-xl p-2.5 font-mono text-sm font-bold`}
                  />
                  <input
                    type="number"
                    placeholder={`= d${row.r}`}
                    value={row.d}
                    onChange={(e) => row.sd(e.target.value)}
                    className={`${inputBg} border-sky-500/50 rounded-xl p-2.5 font-mono text-sm font-bold text-sky-300`}
                  />
                </div>
              ))}
            </div>

            {/* Results */}
            {l3Res && (
              <div className={`flex flex-col gap-4 ${subCardBg} border rounded-2xl p-5`}>
                {l3Res.status !== 'unique' ? (
                  <div className="text-amber-400 font-semibold text-sm">{l3Res.msg}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">x</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">
                          x = {l3Res.x}
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">y</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">
                          y = {l3Res.y}
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400">z</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">
                          z = {l3Res.z}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-slate-400">
                        3×3 Cramer Determinant Steps:
                      </span>
                      {l3Res.steps?.map((s, idx) => (
                        <div key={idx} className="text-xs font-mono text-slate-300">
                          {s}
                        </div>
                      ))}
                    </div>
                  </>
                )}
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
