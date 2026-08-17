import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AppSettings } from '../types';

interface StatisticsCalculatorProps {
  settings?: AppSettings;
}

export const StatisticsCalculator: React.FC<StatisticsCalculatorProps> = ({ settings: _settings }) => {
  const [rawInput, setRawInput] = useState<string>('12, 15, 18, 22, 25, 25, 28, 30, 32, 35, 40, 45, 50');

  // Parse numbers safely
  const parseNumbers = (text: string): number[] => {
    return text
      .split(/[\s,;\n]+/)
      .map((val) => parseFloat(val))
      .filter((num) => !isNaN(num));
  };

  const numbers = parseNumbers(rawInput);

  // Stats Calculations
  const calculateStats = () => {
    if (numbers.length === 0) return null;

    const n = numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Median
    let median = 0;
    const mid = Math.floor(n / 2);
    if (n % 2 === 0) {
      median = (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      median = sorted[mid];
    }

    // Mode
    const freqMap: Record<number, number> = {};
    let maxFreq = 0;
    numbers.forEach((v) => {
      freqMap[v] = (freqMap[v] || 0) + 1;
      if (freqMap[v] > maxFreq) maxFreq = freqMap[v];
    });
    const modes = Object.keys(freqMap)
      .filter((k) => freqMap[parseFloat(k)] === maxFreq && maxFreq > 1)
      .map((k) => parseFloat(k));

    // Variance & Std Dev
    const sqDiffSum = numbers.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
    const popVar = sqDiffSum / n;
    const popStdDev = Math.sqrt(popVar);
    const sampleVar = n > 1 ? sqDiffSum / (n - 1) : 0;
    const sampleStdDev = Math.sqrt(sampleVar);

    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    // Histogram bins
    const binCount = Math.min(8, Math.max(3, Math.floor(Math.sqrt(n))));
    const binWidth = range > 0 ? range / binCount : 1;
    const histogramData = Array.from({ length: binCount }, (_, i) => {
      const bMin = min + i * binWidth;
      const bMax = bMin + binWidth;
      const count = numbers.filter((v) => v >= bMin && (i === binCount - 1 ? v <= bMax : v < bMax)).length;
      return {
        bin: `${bMin.toFixed(1)}-${bMax.toFixed(1)}`,
        count,
      };
    });

    return {
      n,
      sum,
      mean,
      median,
      mode: modes.length > 0 ? modes.join(', ') : 'No unique mode',
      popStdDev,
      sampleStdDev,
      popVar,
      sampleVar,
      min,
      max,
      range,
      histogramData,
    };
  };

  const stats = calculateStats();

  const loadPreset = (preset: 'scores' | 'temps' | 'sales') => {
    if (preset === 'scores') setRawInput('78, 85, 92, 65, 88, 95, 72, 80, 85, 90, 88, 76, 94');
    else if (preset === 'temps') setRawInput('22.5, 24.1, 23.8, 25.0, 26.2, 24.5, 22.9, 21.8, 25.4');
    else if (preset === 'sales') setRawInput('120, 150, 180, 130, 210, 250, 300, 280, 220, 190, 160');
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Input Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <label className="text-sm font-bold text-slate-200">Dataset Input (Comma or Space Separated)</label>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Presets:</span>
            <button onClick={() => loadPreset('scores')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg">Scores</button>
            <button onClick={() => loadPreset('temps')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg">Temps</button>
            <button onClick={() => loadPreset('sales')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg">Sales</button>
          </div>
        </div>

        <textarea
          rows={3}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Enter numerical values, e.g., 10, 20, 30, 40..."
          className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-3 font-mono text-sm text-slate-100 focus:outline-none focus:border-sky-500"
        />

        <div className="text-xs text-slate-400 font-mono">
          Parsed Values Count: <span className="text-sky-400 font-bold">{numbers.length}</span>
        </div>
      </div>

      {/* Summary Cards Grid */}
      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { label: 'Count (n)', val: stats.n },
              { label: 'Sum (Σx)', val: stats.sum.toFixed(2) },
              { label: 'Mean (μ)', val: stats.mean.toFixed(4) },
              { label: 'Median', val: stats.median.toFixed(4) },
              { label: 'Mode', val: stats.mode },
              { label: 'Sample Std Dev (s)', val: stats.sampleStdDev.toFixed(4) },
              { label: 'Pop Std Dev (σ)', val: stats.popStdDev.toFixed(4) },
              { label: 'Sample Variance (s²)', val: stats.sampleVar.toFixed(4) },
              { label: 'Min Value', val: stats.min },
              { label: 'Max Value', val: stats.max },
              { label: 'Range', val: stats.range.toFixed(2) },
            ].map(({ label, val }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <span className="text-base sm:text-lg font-mono font-bold text-sky-300 mt-1 truncate">{val}</span>
              </div>
            ))}
          </div>

          {/* Distribution Histogram Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              Data Distribution Frequency Histogram
            </h4>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.histogramData}>
                  <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.histogramData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#0284c7" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
