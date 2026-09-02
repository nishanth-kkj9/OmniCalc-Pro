import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import { AppSettings } from '../types';

interface StatisticsCalculatorProps {
  settings: AppSettings;
}

export const StatisticsCalculator: React.FC<StatisticsCalculatorProps> = ({ settings }) => {
  const [dataInput, setDataInput] = useState<string>('12, 15, 18, 22, 25, 28, 30, 35, 40, 42');
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // Parse Numbers
  const parseNumbers = () => {
    return dataInput
      .split(/[,;\s]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
  };

  const nums = parseNumbers();

  // Statistics Computations
  const computeStats = () => {
    if (nums.length === 0) return null;

    const n = nums.length;
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Median
    let median = 0;
    if (n % 2 === 0) {
      median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    } else {
      median = sorted[Math.floor(n / 2)];
    }

    // Mode
    const freqMap: { [key: number]: number } = {};
    let maxFreq = 0;
    nums.forEach((v) => {
      freqMap[v] = (freqMap[v] || 0) + 1;
      if (freqMap[v] > maxFreq) maxFreq = freqMap[v];
    });
    const modes = Object.keys(freqMap)
      .filter((k) => freqMap[Number(k)] === maxFreq && maxFreq > 1)
      .map(Number);

    // Min & Max & Range
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    // Variance & Std Dev (Sample n-1, Population n)
    const ss = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
    const popVariance = ss / n;
    const popStdDev = Math.sqrt(popVariance);

    const sampleVariance = n > 1 ? ss / (n - 1) : 0;
    const sampleStdDev = Math.sqrt(sampleVariance);

    // Quartiles & IQR
    const getPercentile = (arr: number[], p: number) => {
      const idx = p * (arr.length - 1);
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      const weight = idx - lower;
      return arr[lower] * (1 - weight) + arr[upper] * weight;
    };

    const q1 = getPercentile(sorted, 0.25);
    const q3 = getPercentile(sorted, 0.75);
    const iqr = q3 - q1;

    return {
      n,
      sum: Math.round(sum * 1000) / 1000,
      mean: Math.round(mean * 1000) / 1000,
      median: Math.round(median * 1000) / 1000,
      modes: modes.length > 0 ? modes.join(', ') : 'No unique mode',
      min,
      max,
      range,
      popVariance: Math.round(popVariance * 10000) / 10000,
      popStdDev: Math.round(popStdDev * 10000) / 10000,
      sampleVariance: Math.round(sampleVariance * 10000) / 10000,
      sampleStdDev: Math.round(sampleStdDev * 10000) / 10000,
      q1: Math.round(q1 * 1000) / 1000,
      q3: Math.round(q3 * 1000) / 1000,
      iqr: Math.round(iqr * 1000) / 1000,
    };
  };

  const stats = computeStats();

  // Export Data Builder
  const exportReportData: ExportReportData = {
    title: 'Descriptive Statistical Analysis Report',
    engine: 'Statistics Engine',
    timestamp: Date.now(),
    inputDescription: `N = ${nums.length}, Data: [${dataInput}]`,
    resultSummary: stats
      ? `Mean: ${stats.mean}, Median: ${stats.median}, StdDev: ${stats.sampleStdDev}`
      : 'No data',
    tableHeaders: ['Index', 'Value (x)', 'Dev from Mean (x - μ)', 'Sq Dev (x - μ)²'],
    tableRows: stats
      ? nums.map((v, i) => {
          const dev = v - stats.mean;
          return [
            String(i + 1),
            String(v),
            (Math.round(dev * 1000) / 1000).toString(),
            (Math.round(dev * dev * 1000) / 1000).toString(),
          ];
        })
      : [],
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Header & Preset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100">
            Descriptive Statistics & Data Analysis
          </h2>
          <p className="text-xs text-slate-400">
            Compute mean, median, mode, sample variance, standard deviation, and quartiles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDataInput('12, 15, 18, 22, 25, 28, 30, 35, 40, 42')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Sample Data
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            disabled={!stats}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 disabled:opacity-50 rounded-xl border border-slate-700 transition-all"
            title="Export Report"
            aria-label="Export report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dataset Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Enter Numbers (Comma, space, or semicolon separated)
        </label>
        <textarea
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          rows={3}
          placeholder="e.g. 10, 20, 30, 40, 50..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-2xl p-3.5 font-mono text-sm font-bold text-slate-100 focus:outline-none resize-none"
        />
        <div className="text-[11px] text-slate-500 flex justify-between px-1">
          <span>Parsed Sample Count (N): {nums.length} items</span>
          <span>Automatic real-time statistical processing</span>
        </div>
      </div>

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-xs text-slate-400 font-semibold">Mean (Average)</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">{stats.mean}</span>
            <span className="text-[10px] text-slate-500 font-mono">Sum: {stats.sum}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-xs text-slate-400 font-semibold">Median</span>
            <span className="text-2xl font-mono font-bold text-sky-400">{stats.median}</span>
            <span className="text-[10px] text-slate-500 font-mono">Mode: {stats.modes}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-xs text-slate-400 font-semibold">Sample Std Dev (s)</span>
            <span className="text-2xl font-mono font-bold text-amber-400">{stats.sampleStdDev}</span>
            <span className="text-[10px] text-slate-500 font-mono">Var s²: {stats.sampleVariance}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-xs text-slate-400 font-semibold">Population Std Dev (σ)</span>
            <span className="text-2xl font-mono font-bold text-rose-400">{stats.popStdDev}</span>
            <span className="text-[10px] text-slate-500 font-mono">Var σ²: {stats.popVariance}</span>
          </div>
        </div>
      )}

      {/* Five Number Summary Breakdown */}
      {stats && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Quartiles & Five-Number Summary
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center font-mono">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase">Min</span>
              <span className="text-base font-bold text-slate-200">{stats.min}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase">Q1 (25%)</span>
              <span className="text-base font-bold text-sky-400">{stats.q1}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase">Q2 (Median)</span>
              <span className="text-base font-bold text-emerald-400">{stats.median}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase">Q3 (75%)</span>
              <span className="text-base font-bold text-sky-400">{stats.q3}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase">Max</span>
              <span className="text-base font-bold text-slate-200">{stats.max}</span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between text-xs font-mono text-slate-400">
            <span>Interquartile Range (IQR): {stats.iqr}</span>
            <span>Total Range (Max - Min): {stats.range}</span>
          </div>
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
