import React, { useState, useMemo } from 'react';
import { Download, RefreshCw, BarChart2, Activity, TrendingUp } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import { AppSettings } from '../types';
import {
  computeDescriptiveStats,
  normalPdf,
  normalCdf,
  normalInvCdf,
  binomialPmf,
  poissonPmf,
} from '../utils/statisticsEngine';
import {
  fitLinearRegression,
  fitPolynomialRegression,
  fitExponentialRegression,
  fitLogarithmicRegression,
  fitPowerRegression,
  DataPoint,
} from '../utils/regressionEngine';

interface StatisticsCalculatorProps {
  settings: AppSettings;
}

export const StatisticsCalculator: React.FC<StatisticsCalculatorProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'descriptive' | 'distributions' | 'regression'>('descriptive');
  const [dataInput, setDataInput] = useState<string>('12, 15, 18, 22, 25, 28, 30, 35, 40, 42');
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // Probability Distribution State
  const [distType, setDistType] = useState<'normal' | 'binomial' | 'poisson'>('normal');
  const [normMean, setNormMean] = useState<string>('0');
  const [normStd, setNormStd] = useState<string>('1');
  const [normX, setNormX] = useState<string>('1.96');
  const [normP, setNormP] = useState<string>('0.975');

  const [binomN, setBinomN] = useState<string>('10');
  const [binomK, setBinomK] = useState<string>('5');
  const [binomP, setBinomP] = useState<string>('0.5');

  const [poissonLambda, setPoissonLambda] = useState<string>('3');
  const [poissonK, setPoissonK] = useState<string>('2');

  // Regression State
  const [regDataInput, setRegDataInput] = useState<string>(
    '1, 2.1\n2, 3.9\n3, 6.2\n4, 8.1\n5, 10.3'
  );
  const [regModel, setRegModel] = useState<'linear' | 'poly2' | 'poly3' | 'exp' | 'log' | 'power'>('linear');
  const [predictX, setPredictX] = useState<string>('6');

  // Parse Numbers for Descriptive Stats
  const nums = useMemo(() => {
    return dataInput
      .split(/[,;\s]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && Number.isFinite(n));
  }, [dataInput]);

  const stats = useMemo(() => {
    if (nums.length === 0) return null;
    return computeDescriptiveStats(nums);
  }, [nums]);

  // Parse Data Points for Regression
  const regPoints: DataPoint[] = useMemo(() => {
    return regDataInput
      .split('\n')
      .map((line) => {
        const parts = line.split(/[,;\s]+/).filter((p) => p.trim() !== '');
        if (parts.length >= 2) {
          const x = parseFloat(parts[0]);
          const y = parseFloat(parts[1]);
          if (!isNaN(x) && !isNaN(y)) return { x, y };
        }
        return null;
      })
      .filter((p): p is DataPoint => p !== null);
  }, [regDataInput]);

  const regressionResult = useMemo(() => {
    if (regPoints.length < 2) return null;
    switch (regModel) {
      case 'linear':
        return fitLinearRegression(regPoints);
      case 'poly2':
        return fitPolynomialRegression(regPoints, 2);
      case 'poly3':
        return fitPolynomialRegression(regPoints, 3);
      case 'exp':
        return fitExponentialRegression(regPoints);
      case 'log':
        return fitLogarithmicRegression(regPoints);
      case 'power':
        return fitPowerRegression(regPoints);
      default:
        return fitLinearRegression(regPoints);
    }
  }, [regPoints, regModel]);

  // Distribution calculations
  const normalResults = useMemo(() => {
    const m = parseFloat(normMean);
    const s = parseFloat(normStd);
    const x = parseFloat(normX);
    const p = parseFloat(normP);
    if (isNaN(m) || isNaN(s) || s <= 0) return null;
    return {
      pdf: !isNaN(x) ? normalPdf(x, m, s) : null,
      cdf: !isNaN(x) ? normalCdf(x, m, s) : null,
      invCdf: !isNaN(p) && p > 0 && p < 1 ? normalInvCdf(p, m, s) : null,
    };
  }, [normMean, normStd, normX, normP]);

  const binomResult = useMemo(() => {
    const n = parseInt(binomN, 10);
    const k = parseInt(binomK, 10);
    const p = parseFloat(binomP);
    if (isNaN(n) || isNaN(k) || isNaN(p)) return null;
    return binomialPmf(n, k, p);
  }, [binomN, binomK, binomP]);

  const poissonResult = useMemo(() => {
    const l = parseFloat(poissonLambda);
    const k = parseInt(poissonK, 10);
    if (isNaN(l) || isNaN(k)) return null;
    return poissonPmf(l, k);
  }, [poissonLambda, poissonK]);

  // Export Data Builder
  const exportReportData: ExportReportData = {
    title: 'Statistical & Regression Analysis Report',
    engine: 'Statistics Suite',
    timestamp: Date.now(),
    inputDescription: `Sample size N = ${nums.length}`,
    resultSummary: stats
      ? `Mean: ${stats.mean.toFixed(4)}, Median: ${stats.median.toFixed(4)}, StdDev: ${stats.sampleStdDev.toFixed(4)}`
      : 'No data',
    tableHeaders: ['Index', 'Value (x)', 'Dev from Mean (x - μ)', 'Sq Dev (x - μ)²'],
    tableRows: stats
      ? nums.map((v, i) => {
          const dev = v - stats.mean;
          return [
            String(i + 1),
            String(v),
            dev.toFixed(4),
            (dev * dev).toFixed(4),
          ];
        })
      : [],
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100">
            Statistics, Probability & Regression Suite
          </h2>
          <p className="text-xs text-slate-400">
            Descriptive metrics, shape parameters, probability distributions, & OLS curve fitting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportModalOpen(true)}
            disabled={!stats && !regressionResult}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 disabled:opacity-50 rounded-xl border border-slate-700 transition-all"
            title="Export Report"
            aria-label="Export report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'descriptive', label: 'Descriptive Stats & Outliers', icon: <BarChart2 className="w-4 h-4" /> },
          { id: 'distributions', label: 'Probability Distributions', icon: <Activity className="w-4 h-4" /> },
          { id: 'regression', label: 'Regression & Curve Fitting', icon: <TrendingUp className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'descriptive' && (
        <>
          {/* Dataset Input Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Enter Dataset (Comma, space, or newline separated)
              </label>
              <button
                onClick={() => setDataInput('12, 15, 18, 22, 25, 28, 30, 35, 40, 42, 95')}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" /> Load Sample with Outlier
              </button>
            </div>
            <textarea
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              rows={3}
              placeholder="e.g. 10, 20, 30, 40, 50..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-2xl p-3.5 font-mono text-sm font-bold text-slate-100 focus:outline-none resize-none"
            />
            <div className="text-[11px] text-slate-500 flex justify-between px-1">
              <span>Parsed Elements (N): {nums.length} items</span>
              <span>Full IEEE 754 precision summary</span>
            </div>
          </div>

          {/* Stats Summary Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold">Mean (Average)</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">{stats.mean.toFixed(3)}</span>
                <span className="text-[10px] text-slate-500 font-mono">Sum: {stats.sum.toFixed(2)}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold">Median</span>
                <span className="text-2xl font-mono font-bold text-sky-400">{stats.median.toFixed(3)}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Mode: {stats.modes.length > 0 ? stats.modes.join(', ') : 'None'}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold">Sample Std Dev (s)</span>
                <span className="text-2xl font-mono font-bold text-amber-400">{stats.sampleStdDev.toFixed(3)}</span>
                <span className="text-[10px] text-slate-500 font-mono">SE: {stats.standardError.toFixed(3)}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold">Shape & Skewness</span>
                <span className="text-2xl font-mono font-bold text-rose-400">{stats.skewness.toFixed(3)}</span>
                <span className="text-[10px] text-slate-500 font-mono">Excess Kurtosis: {stats.kurtosis.toFixed(3)}</span>
              </div>
            </div>
          )}

          {/* Outliers & Five-Number Summary */}
          {stats && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Quartiles & Tukey Outlier Detection
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center font-mono">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">Min</span>
                  <span className="text-base font-bold text-slate-200">{stats.min}</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">Q1 (25%)</span>
                  <span className="text-base font-bold text-sky-400">{stats.q1.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">Q2 (Median)</span>
                  <span className="text-base font-bold text-emerald-400">{stats.median.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">Q3 (75%)</span>
                  <span className="text-base font-bold text-sky-400">{stats.q3.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">Max</span>
                  <span className="text-base font-bold text-slate-200">{stats.max}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex flex-wrap justify-between gap-2 text-xs font-mono text-slate-400">
                <span>Interquartile Range (IQR): {stats.iqr.toFixed(3)}</span>
                <span>
                  Detected Outliers:{' '}
                  {stats.outliers.mild.length + stats.outliers.extreme.length > 0 ? (
                    <span className="text-rose-400 font-bold">
                      {[...stats.outliers.mild, ...stats.outliers.extreme].join(', ')}
                    </span>
                  ) : (
                    <span className="text-emerald-400">None detected</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'distributions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-5">
          <div className="flex gap-2">
            {[
              { id: 'normal', label: 'Normal (Gaussian)' },
              { id: 'binomial', label: 'Binomial' },
              { id: 'poisson', label: 'Poisson' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDistType(d.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  distType === d.id
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {distType === 'normal' && (
            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block">Mean (μ)</label>
                  <input
                    type="number"
                    value={normMean}
                    onChange={(e) => setNormMean(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Std Dev (σ)</label>
                  <input
                    type="number"
                    value={normStd}
                    onChange={(e) => setNormStd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Point x</label>
                  <input
                    type="number"
                    value={normX}
                    onChange={(e) => setNormX(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Probability p (for Inv CDF)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.001"
                    max="0.999"
                    value={normP}
                    onChange={(e) => setNormP(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
                  />
                </div>
              </div>

              {normalResults && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div>
                    <span className="text-slate-500 text-[10px] block">PDF f(x)</span>
                    <span className="text-lg font-bold text-sky-400">
                      {normalResults.pdf !== null ? normalResults.pdf.toFixed(5) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">CDF P(X ≤ x)</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {normalResults.cdf !== null ? normalResults.cdf.toFixed(5) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Inverse CDF Φ⁻¹(p)</span>
                    <span className="text-lg font-bold text-amber-400">
                      {normalResults.invCdf !== null ? normalResults.invCdf.toFixed(4) : '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {distType === 'binomial' && (
            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block">Trials n</label>
                  <input
                    type="number"
                    value={binomN}
                    onChange={(e) => setBinomN(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Successes k</label>
                  <input
                    type="number"
                    value={binomK}
                    onChange={(e) => setBinomK(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Prob p</label>
                  <input
                    type="number"
                    step="0.05"
                    value={binomP}
                    onChange={(e) => setBinomP(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                <span className="text-slate-400">Probability P(X = {binomK}):</span>
                <span className="text-xl font-bold text-emerald-400">
                  {binomResult !== null ? binomResult.toFixed(6) : '—'}
                </span>
              </div>
            </div>
          )}

          {distType === 'poisson' && (
            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block">Rate λ</label>
                  <input
                    type="number"
                    value={poissonLambda}
                    onChange={(e) => setPoissonLambda(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Occurrences k</label>
                  <input
                    type="number"
                    value={poissonK}
                    onChange={(e) => setPoissonK(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                <span className="text-slate-400">Probability P(X = {poissonK}):</span>
                <span className="text-xl font-bold text-emerald-400">
                  {poissonResult !== null ? poissonResult.toFixed(6) : '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'regression' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Data Points (x, y per line)
            </span>
            <div className="flex gap-2">
              {[
                { id: 'linear', label: 'Linear' },
                { id: 'poly2', label: 'Quadratic' },
                { id: 'poly3', label: 'Cubic' },
                { id: 'exp', label: 'Exp' },
                { id: 'log', label: 'Log' },
                { id: 'power', label: 'Power' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setRegModel(m.id as any)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    regModel === m.id
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={regDataInput}
            onChange={(e) => setRegDataInput(e.target.value)}
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-2xl p-3.5 font-mono text-sm font-bold text-slate-100 focus:outline-none resize-none"
          />

          {regressionResult && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3 font-mono">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Best-fit Model Equation:</span>
                <span className="text-base font-bold text-sky-400">{regressionResult.equation}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t border-slate-800 pt-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">R² Determination</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {regressionResult.rSquared.toFixed(5)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Correlation r</span>
                  <span className="text-sm font-bold text-slate-200">
                    {regressionResult.r.toFixed(5)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Std Error (residuals)</span>
                  <span className="text-sm font-bold text-amber-400">
                    {regressionResult.standardError.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Prediction tool */}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Predict y at x =</span>
                  <input
                    type="number"
                    value={predictX}
                    onChange={(e) => setPredictX(e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-bold"
                  />
                </div>
                <div className="text-xs">
                  <span className="text-slate-400">Predicted y ≈ </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {!isNaN(parseFloat(predictX))
                      ? regressionResult.predict(parseFloat(predictX)).toFixed(4)
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={exportReportData}
        settings={settings}
      />
    </div>
  );
};

