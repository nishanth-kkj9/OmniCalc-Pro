import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Compass, Zap } from 'lucide-react';
import { AppSettings } from '../types';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import { Complex, parseComplex, ComplexAngleUnit } from '../utils/complex';

interface ComplexCalculatorProps {
  settings?: AppSettings;
}

type BinaryOp = 'add' | 'sub' | 'mul' | 'div' | 'pow' | 'parallel';

export const ComplexCalculator: React.FC<ComplexCalculatorProps> = ({ settings: _settings }) => {
  const [z1Input, setZ1Input] = useState<string>('3 + 4i');
  const [z2Input, setZ2Input] = useState<string>('1 - 2i');
  const [angleUnit, setAngleUnit] = useState<ComplexAngleUnit>('DEG');
  const [activeBinaryOp, setActiveBinaryOp] = useState<BinaryOp>('add');
  const [rootN, setRootN] = useState<number>(3);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // Phasor Circuit Analysis Sub-tab state
  const [acFrequency, setAcFrequency] = useState<string>('60'); // Hz
  const [acResistance, setAcResistance] = useState<string>('100'); // Ohms
  const [acInductance, setAcInductance] = useState<string>('0.05'); // Henry
  const [acCapacitance, setAcCapacitance] = useState<string>('10'); // microFarad
  const [acVoltage, setAcVoltage] = useState<string>('120'); // V_rms

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const z1 = useMemo(() => parseComplex(z1Input) || new Complex(0, 0), [z1Input]);
  const z2 = useMemo(() => parseComplex(z2Input) || new Complex(0, 0), [z2Input]);

  // Compute binary result
  const binaryResult: Complex = useMemo(() => {
    switch (activeBinaryOp) {
      case 'add':
        return z1.add(z2);
      case 'sub':
        return z1.sub(z2);
      case 'mul':
        return z1.mul(z2);
      case 'div':
        return z1.div(z2);
      case 'pow':
        return z1.pow(z2);
      case 'parallel':
        return z1.parallel(z2);
      default:
        return z1.add(z2);
    }
  }, [z1, z2, activeBinaryOp]);

  // Compute roots for Argand display if needed
  const z1Roots = useMemo(() => {
    return z1.roots(rootN);
  }, [z1, rootN]);

  // AC Circuit Calculations
  const acCircuitResults = useMemo(() => {
    const f = parseFloat(acFrequency) || 60;
    const R = parseFloat(acResistance) || 0;
    const L = parseFloat(acInductance) || 0;
    const C_uF = parseFloat(acCapacitance) || 0;
    const V = parseFloat(acVoltage) || 120;

    const omega = 2 * Math.PI * f;
    const X_L = omega * L;
    const X_C = C_uF > 0 ? 1 / (omega * (C_uF * 1e-6)) : 0;
    const X_net = X_L - X_C;

    const Z = new Complex(R, X_net);
    const I = new Complex(V, 0).div(Z);
    const powerFactor = Math.cos(Z.argument);
    const S = V * I.modulus; // Apparent power VA
    const P = S * powerFactor; // Active power Watts
    const Q = S * Math.sin(Z.argument); // Reactive power VAR

    return {
      omega,
      X_L,
      X_C,
      Z,
      I,
      powerFactor,
      S,
      P,
      Q,
    };
  }, [acFrequency, acResistance, acInductance, acCapacitance, acVoltage]);

  // Canvas Argand Plane Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#18181b' : '#f8fafc';
    const gridColor = isDark ? '#27272a' : '#e2e8f0';
    const axisColor = isDark ? '#52525b' : '#94a3b8';
    const textColor = isDark ? '#a1a1aa' : '#64748b';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Determine scale based on max modulus
    const maxMod = Math.max(
      z1.modulus,
      z2.modulus,
      binaryResult.modulus,
      ...z1Roots.map((r) => r.modulus),
      4
    );
    const bound = maxMod * 1.25;

    const cx = width / 2;
    const cy = height / 2;
    const scale = (Math.min(width, height) / 2 - 30) / bound;

    const toScreen = (re: number, im: number) => ({
      x: cx + re * scale,
      y: cy - im * scale,
    });

    // Draw concentric circles & grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const circleSteps = 4;
    for (let i = 1; i <= circleSteps; i++) {
      const r = (bound * i) / circleSteps;
      ctx.beginPath();
      ctx.arc(cx, cy, r * scale, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(r.toFixed(1), cx + r * scale + 2, cy - 2);
    }

    // Axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, cy);
    ctx.lineTo(width - 20, cy);
    ctx.moveTo(cx, 20);
    ctx.lineTo(cx, height - 20);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = textColor;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Re', width - 25, cy - 8);
    ctx.fillText('Im', cx + 8, 25);

    // Draw Vector Helper
    const drawVector = (
      c: Complex,
      color: string,
      label: string,
      lineWidth: number = 2.5
    ) => {
      const p = toScreen(c.re, c.im);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(cy - p.y, p.x - cx);
      const headLen = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(
        p.x - headLen * Math.cos(angle - Math.PI / 6),
        p.y + headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        p.x - headLen * Math.cos(angle + Math.PI / 6),
        p.y + headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // Point & Label
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(label, p.x + 8, p.y - 4);
    };

    // Plot Z1 (Blue)
    drawVector(z1, '#3b82f6', 'Z₁');

    // Plot Z2 (Amber)
    drawVector(z2, '#f59e0b', 'Z₂');

    // Plot Result (Green)
    drawVector(binaryResult, '#10b981', 'Result', 3);

    // Plot Roots if applicable
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    for (let i = 0; i < z1Roots.length; i++) {
      const r = z1Roots[i];
      const p = toScreen(r.re, r.im);
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText(`w${i}`, p.x + 5, p.y - 3);
    }
    ctx.setLineDash([]);
  }, [z1, z2, binaryResult, z1Roots]);

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const exportData: ExportReportData = {
    title: 'Complex Numbers & Phasor Report',
    engine: 'Complex Engine',
    timestamp: Date.now(),
    inputDescription: `z1 = ${z1.toRectangular()} (${z1.toPolar(angleUnit)}), z2 = ${z2.toRectangular()} (${z2.toPolar(angleUnit)}), op: ${activeBinaryOp}`,
    resultSummary: `${binaryResult.toRectangular()} | Polar: ${binaryResult.toPolar(angleUnit)} | Euler: ${binaryResult.toEuler()}`,
    metadata: {
      operation: activeBinaryOp,
      z1: z1.toRectangular(),
      z2: z2.toRectangular(),
      resultRect: binaryResult.toRectangular(),
      resultPolar: binaryResult.toPolar(angleUnit),
    },
  };

  return (
    <div id="complex-calculator-root" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4 lg:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Compass className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Complex Numbers & Phasor Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Rectangular, Polar, Euler forms, Argand plane, n-th roots, and AC electrical phasors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5 text-xs font-medium">
            <button
              id="angle-deg"
              onClick={() => setAngleUnit('DEG')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                angleUnit === 'DEG'
                  ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              DEG (°)
            </button>
            <button
              id="angle-rad"
              onClick={() => setAngleUnit('RAD')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                angleUnit === 'RAD'
                  ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              RAD (rad)
            </button>
          </div>

          <button
            id="complex-export-btn"
            onClick={handleExport}
            className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Complex Numbers & Arithmetic (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Inputs for Z1 and Z2 */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              Complex Inputs (Rectangular: 3+4i, Polar: 5&lt;45deg)
            </span>

            {/* Z1 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Z₁ (First Complex Number)</span>
                <span className="font-mono text-slate-400">{z1.toPolar(angleUnit)}</span>
              </div>
              <input
                id="complex-z1-input"
                type="text"
                value={z1Input}
                onChange={(e) => setZ1Input(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
              />
            </div>

            {/* Z2 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-amber-600 dark:text-amber-400">Z₂ (Second Complex Number)</span>
                <span className="font-mono text-slate-400">{z2.toPolar(angleUnit)}</span>
              </div>
              <input
                id="complex-z2-input"
                type="text"
                value={z2Input}
                onChange={(e) => setZ2Input(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
              />
            </div>

            {/* Binary Operations Selector */}
            <div>
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 block mb-2">
                Binary Operation:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'add', label: 'Z₁ + Z₂' },
                  { id: 'sub', label: 'Z₁ − Z₂' },
                  { id: 'mul', label: 'Z₁ × Z₂' },
                  { id: 'div', label: 'Z₁ / Z₂' },
                  { id: 'pow', label: 'Z₁ ^ Z₂' },
                  { id: 'parallel', label: 'Z₁ ∥ Z₂ (AC)' },
                ].map((op) => (
                  <button
                    key={op.id}
                    id={`op-binary-${op.id}`}
                    onClick={() => setActiveBinaryOp(op.id as BinaryOp)}
                    className={`p-2 rounded-lg text-xs font-mono font-medium border transition-all ${
                      activeBinaryOp === op.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Operation Result Box */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">
              Calculated Result
            </span>

            <div className="space-y-2 font-mono">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-sans">
                  Rectangular Form:
                </span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {binaryResult.toRectangular()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
                <span className="text-[11px] text-slate-400 block font-sans">Polar Form (r ∠ θ):</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                  {binaryResult.toPolar(angleUnit)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
                <span className="text-[11px] text-slate-400 block font-sans">Exponential Form (r·e^(iθ)):</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                  {binaryResult.toEuler()}
                </span>
              </div>
            </div>
          </div>

          {/* Roots of Z1 */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                All {rootN} Complex Roots of Z₁ (ⁿ√Z₁)
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">n =</span>
                <input
                  id="complex-root-n"
                  type="number"
                  min="2"
                  max="12"
                  value={rootN}
                  onChange={(e) => setRootN(parseInt(e.target.value) || 3)}
                  className="w-12 px-2 py-0.5 text-xs font-mono rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {z1Roots.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-zinc-800/40 text-xs font-mono"
                >
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">w_{i}:</span>
                  <span className="text-slate-800 dark:text-zinc-200">{r.toRectangular()}</span>
                  <span className="text-slate-400 text-[11px]">{r.toPolar(angleUnit)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Argand Plane Canvas & AC Circuit Phasors (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Argand Plane */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Complex Argand Plane (Re vs Im)
              </span>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Z₁
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Z₂
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Result
                </span>
              </div>
            </div>

            <div className="w-full flex justify-center bg-slate-50 dark:bg-zinc-950 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800">
              <canvas
                ref={canvasRef}
                width={500}
                height={350}
                className="w-full max-w-full h-auto"
              />
            </div>
          </div>

          {/* AC Circuit Phasor Calculator */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              AC Electrical Phasor & RLC Impedance
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Freq (Hz)</label>
                <input
                  id="ac-freq"
                  type="number"
                  value={acFrequency}
                  onChange={(e) => setAcFrequency(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">R (Ω)</label>
                <input
                  id="ac-res"
                  type="number"
                  value={acResistance}
                  onChange={(e) => setAcResistance(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">L (Henry)</label>
                <input
                  id="ac-ind"
                  type="number"
                  step="0.01"
                  value={acInductance}
                  onChange={(e) => setAcInductance(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">C (μF)</label>
                <input
                  id="ac-cap"
                  type="number"
                  value={acCapacitance}
                  onChange={(e) => setAcCapacitance(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">V_rms (V)</label>
                <input
                  id="ac-volt"
                  type="number"
                  value={acVoltage}
                  onChange={(e) => setAcVoltage(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            {/* AC Output Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-50 dark:bg-zinc-800/40 rounded border border-slate-200 dark:border-zinc-700">
                <span className="text-[10px] text-slate-400 block font-sans">Total Impedance Z:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-100">
                  {acCircuitResults.Z.toPolar(angleUnit)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-zinc-800/40 rounded border border-slate-200 dark:border-zinc-700">
                <span className="text-[10px] text-slate-400 block font-sans">Current Phasor I:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {acCircuitResults.I.toPolar(angleUnit)} A
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-zinc-800/40 rounded border border-slate-200 dark:border-zinc-700">
                <span className="text-[10px] text-slate-400 block font-sans">Power Factor cos(θ):</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-100">
                  {acCircuitResults.powerFactor.toFixed(4)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-zinc-800/40 rounded border border-slate-200 dark:border-zinc-700">
                <span className="text-[10px] text-slate-400 block font-sans">Real Power P:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {acCircuitResults.P.toFixed(2)} W
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={exportData}
      />
    </div>
  );
};
export default ComplexCalculator;
