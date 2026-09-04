import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Activity } from 'lucide-react';
import { AppSettings } from '../types';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import {
  DistributionType,
  DistributionParams,
  DISTRIBUTIONS_MAP,
  calculateRangeProbability,
} from '../utils/distributions';

interface ProbabilityCalculatorProps {
  settings?: AppSettings;
}

export const ProbabilityCalculator: React.FC<ProbabilityCalculatorProps> = ({ settings: _settings }) => {
  const [distType, setDistType] = useState<DistributionType>('normal');
  const [params, setParams] = useState<DistributionParams>({
    mu: 0,
    sigma: 1,
    n: 10,
    p: 0.5,
    lambda: 4,
    a: 0,
    b: 10,
    df: 10,
  });

  const [calcMode, setCalcMode] = useState<'range' | 'lessThan' | 'greaterThan' | 'quantile'>('range');
  const [xMin, setXMin] = useState<string>('-1.96');
  const [xMax, setXMax] = useState<string>('1.96');
  const [quantileP, setQuantileP] = useState<string>('0.95');
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dist = useMemo(() => DISTRIBUTIONS_MAP[distType], [distType]);

  const moments = useMemo(() => {
    return dist.moments(params);
  }, [dist, params]);

  const domain = useMemo(() => {
    return dist.suggestedDomain(params);
  }, [dist, params]);

  const calculatedProb = useMemo(() => {
    const minVal = parseFloat(xMin) || 0;
    const maxVal = parseFloat(xMax) || 0;

    if (calcMode === 'lessThan') {
      return dist.cdf(maxVal, params);
    }
    if (calcMode === 'greaterThan') {
      return 1 - dist.cdf(minVal, params);
    }
    if (calcMode === 'range') {
      return calculateRangeProbability(dist, params, minVal, maxVal);
    }
    return 0;
  }, [dist, params, calcMode, xMin, xMax]);

  const calculatedQuantile = useMemo(() => {
    const pVal = parseFloat(quantileP);
    if (isNaN(pVal) || pVal <= 0 || pVal >= 1) return NaN;
    return dist.inverseCdf(pVal, params);
  }, [dist, params, quantileP]);

  // Update parameters handler
  const handleParamChange = (name: keyof DistributionParams, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setParams((prev) => ({ ...prev, [name]: num }));
    }
  };

  // Canvas PDF/PMF + Shaded Area Rendering
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
    const curveColor = '#3b82f6';
    const shadeColor = isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.25)';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const dMin = domain.min;
    const dMax = domain.max;

    // Evaluate peak value for scaling Y
    let maxDensity = 0;
    const sampleCount = 200;
    for (let i = 0; i <= sampleCount; i++) {
      const x = dMin + (i * (dMax - dMin)) / sampleCount;
      const dens = dist.pdfOrPmf(dist.isDiscrete ? Math.round(x) : x, params);
      if (dens > maxDensity && isFinite(dens)) maxDensity = dens;
    }
    if (maxDensity <= 0) maxDensity = 1;
    maxDensity *= 1.15; // padding top

    const toScreenX = (x: number) => ((x - dMin) / (dMax - dMin)) * (width - 70) + 45;
    const toScreenY = (y: number) => height - 35 - (y / maxDensity) * (height - 60);

    // Draw Grid & Ticks
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const numTicks = 6;
    for (let i = 0; i <= numTicks; i++) {
      const gx = dMin + (i * (dMax - dMin)) / numTicks;
      const sx = toScreenX(gx);
      ctx.beginPath();
      ctx.moveTo(sx, 15);
      ctx.lineTo(sx, height - 30);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(gx.toFixed(1), sx, height - 15);
    }

    // Axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(45, 15);
    ctx.lineTo(45, height - 35);
    ctx.lineTo(width - 20, height - 35);
    ctx.stroke();

    const minShade = calcMode === 'lessThan' ? dMin : parseFloat(xMin) || dMin;
    const maxShade = calcMode === 'greaterThan' ? dMax : parseFloat(xMax) || dMax;

    if (dist.isDiscrete) {
      // Discrete PMF Stem / Bar chart
      const startK = Math.max(0, Math.ceil(dMin));
      const endK = Math.floor(dMax);

      for (let k = startK; k <= endK; k++) {
        const prob = dist.pdfOrPmf(k, params);
        const sx = toScreenX(k);
        const sy = toScreenY(prob);
        const isShaded = k >= minShade && k <= maxShade;

        // Bar / Stem
        ctx.strokeStyle = isShaded ? '#2563eb' : (isDark ? '#475569' : '#94a3b8');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, toScreenY(0));
        ctx.lineTo(sx, sy);
        ctx.stroke();

        // Point circle
        ctx.fillStyle = isShaded ? '#2563eb' : (isDark ? '#64748b' : '#cbd5e1');
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    } else {
      // Continuous PDF Curve with Shaded Integral
      // Shaded area path
      ctx.fillStyle = shadeColor;
      ctx.beginPath();
      let startedShade = false;

      for (let i = 0; i <= sampleCount; i++) {
        const x = dMin + (i * (dMax - dMin)) / sampleCount;
        if (x >= minShade && x <= maxShade) {
          const dens = dist.pdfOrPmf(x, params);
          const sx = toScreenX(x);
          const sy = toScreenY(dens);

          if (!startedShade) {
            ctx.moveTo(sx, toScreenY(0));
            ctx.lineTo(sx, sy);
            startedShade = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        }
      }

      if (startedShade) {
        const endX = Math.min(dMax, maxShade);
        ctx.lineTo(toScreenX(endX), toScreenY(0));
        ctx.closePath();
        ctx.fill();
      }

      // PDF line
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= sampleCount; i++) {
        const x = dMin + (i * (dMax - dMin)) / sampleCount;
        const dens = dist.pdfOrPmf(x, params);
        const sx = toScreenX(x);
        const sy = toScreenY(dens);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  }, [dist, params, domain, calcMode, xMin, xMax]);

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const exportData: ExportReportData = {
    title: 'Probability Distribution Report',
    engine: 'Probability Engine',
    timestamp: Date.now(),
    inputDescription: `Distribution: ${dist.name}, Bounds: [${xMin}, ${xMax}]`,
    resultSummary: `P(X in range) = ${calculatedProb !== null ? calculatedProb.toFixed(6) : 'N/A'}, Mean = ${moments.mean.toFixed(4)}, Variance = ${moments.variance.toFixed(4)}`,
    metadata: {
      distribution: dist.name,
      mean: moments.mean,
      variance: moments.variance,
      stdDev: moments.stdDev,
      calculatedProbability: calculatedProb !== null ? calculatedProb : 0,
    },
  };

  return (
    <div id="probability-calculator-root" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4 lg:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Probability & Statistical Distributions
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Exact PMF/PDF, CDF, inverse quantiles, intervals, and analytical moments
          </p>
        </div>

        <button
          id="prob-export-btn"
          onClick={handleExport}
          className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Distribution selection & parameters (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Distribution Selector */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">
              Select Distribution
            </span>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DISTRIBUTIONS_MAP) as DistributionType[]).map((key) => {
                const item = DISTRIBUTIONS_MAP[key];
                const active = distType === key;
                return (
                  <button
                    key={key}
                    id={`dist-select-${key}`}
                    onClick={() => setDistType(key)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      active
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div>{item.name.replace(' Distribution', '')}</div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {item.isDiscrete ? 'Discrete (PMF)' : 'Continuous (PDF)'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameters configuration */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">
              Distribution Parameters
            </span>

            <div className="space-y-3">
              {dist.paramNames.includes('mu') && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">Mean (μ)</span>
                    <span className="font-mono text-slate-500">{params.mu}</span>
                  </div>
                  <input
                    id="param-mu"
                    type="number"
                    step="any"
                    value={params.mu ?? 0}
                    onChange={(e) => handleParamChange('mu', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                  />
                </div>
              )}

              {dist.paramNames.includes('sigma') && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">Standard Deviation (σ &gt; 0)</span>
                    <span className="font-mono text-slate-500">{params.sigma}</span>
                  </div>
                  <input
                    id="param-sigma"
                    type="number"
                    step="any"
                    min="0.001"
                    value={params.sigma ?? 1}
                    onChange={(e) => handleParamChange('sigma', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                  />
                </div>
              )}

              {dist.paramNames.includes('n') && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">Trials (n)</span>
                    <span className="font-mono text-slate-500">{params.n}</span>
                  </div>
                  <input
                    id="param-n"
                    type="number"
                    min="1"
                    step="1"
                    value={params.n ?? 10}
                    onChange={(e) => handleParamChange('n', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                  />
                </div>
              )}

              {dist.paramNames.includes('p') && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">Success Probability (p ∈ [0, 1])</span>
                    <span className="font-mono text-slate-500">{params.p}</span>
                  </div>
                  <input
                    id="param-p"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={params.p ?? 0.5}
                    onChange={(e) => handleParamChange('p', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                  />
                </div>
              )}

              {dist.paramNames.includes('lambda') && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">Rate (λ &gt; 0)</span>
                    <span className="font-mono text-slate-500">{params.lambda}</span>
                  </div>
                  <input
                    id="param-lambda"
                    type="number"
                    min="0.001"
                    step="any"
                    value={params.lambda ?? 4}
                    onChange={(e) => handleParamChange('lambda', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                  />
                </div>
              )}

              {dist.paramNames.includes('df') && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">Degrees of Freedom (ν / df)</span>
                    <span className="font-mono text-slate-500">{params.df}</span>
                  </div>
                  <input
                    id="param-df"
                    type="number"
                    min="1"
                    step="1"
                    value={params.df ?? 10}
                    onChange={(e) => handleParamChange('df', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Density Curve, Probability Interval Solver & Moments (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Chart Display */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {dist.name} ({dist.isDiscrete ? 'PMF' : 'PDF'})
              </span>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-medium">
                P(Shaded) = {calculatedProb.toFixed(5)}
              </span>
            </div>

            <div className="w-full flex justify-center bg-slate-50 dark:bg-zinc-950 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800">
              <canvas
                ref={canvasRef}
                width={650}
                height={300}
                className="w-full max-w-full h-auto"
              />
            </div>
          </div>

          {/* Probability & Quantile Calculator */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                id="prob-mode-range"
                onClick={() => setCalcMode('range')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  calcMode === 'range'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                P(x₁ ≤ X ≤ x₂)
              </button>
              <button
                id="prob-mode-lessthan"
                onClick={() => setCalcMode('lessThan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  calcMode === 'lessThan'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                P(X ≤ x) [CDF]
              </button>
              <button
                id="prob-mode-greaterthan"
                onClick={() => setCalcMode('greaterThan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  calcMode === 'greaterThan'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                P(X ≥ x) [Upper Tail]
              </button>
              <button
                id="prob-mode-quantile"
                onClick={() => setCalcMode('quantile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  calcMode === 'quantile'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                Quantile / Critical Value (InvCDF)
              </button>
            </div>

            {calcMode === 'range' && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700">
                <span className="text-xs font-mono">P(</span>
                <input
                  id="prob-x-min"
                  type="number"
                  step="any"
                  value={xMin}
                  onChange={(e) => setXMin(e.target.value)}
                  className="w-20 px-2 py-1 text-xs font-mono rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                />
                <span className="text-xs font-mono">≤ X ≤</span>
                <input
                  id="prob-x-max"
                  type="number"
                  step="any"
                  value={xMax}
                  onChange={(e) => setXMax(e.target.value)}
                  className="w-20 px-2 py-1 text-xs font-mono rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                />
                <span className="text-xs font-mono">) =</span>
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                  {calculatedProb.toFixed(6)}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({(calculatedProb * 100).toFixed(2)}%)
                </span>
              </div>
            )}

            {calcMode === 'lessThan' && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700">
                <span className="text-xs font-mono">P(X ≤</span>
                <input
                  id="prob-x-max-only"
                  type="number"
                  step="any"
                  value={xMax}
                  onChange={(e) => setXMax(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                />
                <span className="text-xs font-mono">) =</span>
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                  {calculatedProb.toFixed(6)}
                </span>
              </div>
            )}

            {calcMode === 'greaterThan' && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700">
                <span className="text-xs font-mono">P(X ≥</span>
                <input
                  id="prob-x-min-only"
                  type="number"
                  step="any"
                  value={xMin}
                  onChange={(e) => setXMin(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                />
                <span className="text-xs font-mono">) =</span>
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                  {calculatedProb.toFixed(6)}
                </span>
              </div>
            )}

            {calcMode === 'quantile' && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700">
                <span className="text-xs font-mono">P(X ≤ x) =</span>
                <input
                  id="prob-quantile-p"
                  type="number"
                  min="0.0001"
                  max="0.9999"
                  step="0.01"
                  value={quantileP}
                  onChange={(e) => setQuantileP(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                />
                <span className="text-xs font-mono">⟹ x ≈</span>
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {isNaN(calculatedQuantile) ? 'Invalid' : calculatedQuantile.toFixed(5)}
                </span>
              </div>
            )}
          </div>

          {/* Analytical Moments Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Mean (E[X] = μ)</span>
              <p className="text-base font-bold font-mono text-slate-800 dark:text-zinc-100 mt-0.5">
                {isNaN(moments.mean) ? 'Undefined' : moments.mean.toFixed(4)}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Variance (Var(X) = σ²)</span>
              <p className="text-base font-bold font-mono text-slate-800 dark:text-zinc-100 mt-0.5">
                {isNaN(moments.variance) ? 'Undefined' : moments.variance.toFixed(4)}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Std Deviation (σ)</span>
              <p className="text-base font-bold font-mono text-slate-800 dark:text-zinc-100 mt-0.5">
                {isNaN(moments.stdDev) ? 'Undefined' : moments.stdDev.toFixed(4)}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Skewness (γ₁)</span>
              <p className="text-base font-bold font-mono text-slate-800 dark:text-zinc-100 mt-0.5">
                {moments.skewness !== undefined && !isNaN(moments.skewness)
                  ? moments.skewness.toFixed(4)
                  : 'N/A'}
              </p>
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
export default ProbabilityCalculator;
