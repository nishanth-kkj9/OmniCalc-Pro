import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  Copy,
  Check,
  Download,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { AppSettings } from '../types';
import { handleTablistKeydown } from '../utils/ariaTabs';
import {
  oneSampleZTest,
  oneSampleTTest,
  twoSampleTTest,
  pairedTTest,
  oneSampleProportionTest,
  twoSampleProportionsTest,
  chiSquareGoodnessOfFitTest,
  chiSquareIndependenceTest,
  oneWayAnova,
  HypothesisTestResult,
  AlternativeHypothesis,
} from '../utils/inferenceEngine';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';

interface InferenceCalculatorProps {
  settings: AppSettings;
  onNavigateToStats?: () => void;
  onNavigateToGraph?: () => void;
}

export const InferenceCalculator: React.FC<InferenceCalculatorProps> = ({
  onNavigateToStats,
}) => {
  const [activeTab, setActiveTab] = useState<'1sample' | '2sample' | 'chisquare' | 'anova'>('1sample');
  const [copied, setCopied] = useState<boolean>(false);
  const [exportData, setExportData] = useState<ExportReportData | null>(null);

  // Common Significance Level & Alternative
  const [alpha, setAlpha] = useState<string>('0.05');
  const [alternative, setAlternative] = useState<AlternativeHypothesis>('two-sided');

  // 1-Sample State
  const [oneSampleType, setOneSampleType] = useState<'z_mean' | 't_mean' | 'prop_z'>('t_mean');
  const [sampleMean1, setSampleMean1] = useState<string>('105');
  const [sampleStdDev1, setSampleStdDev1] = useState<string>('12');
  const [popStdDev1, setPopStdDev1] = useState<string>('15');
  const [sampleSize1, setSampleSize1] = useState<string>('30');
  const [hypoMean1, setHypoMean1] = useState<string>('100');
  const [successes1, setSuccesses1] = useState<string>('58');
  const [trials1, setTrials1] = useState<string>('100');
  const [hypoP1, setHypoP1] = useState<string>('0.5');

  // 2-Sample State
  const [twoSampleType, setTwoSampleType] = useState<'2t_indep' | 'paired_t' | '2prop_z'>('2t_indep');
  const [meanA, setMeanA] = useState<string>('78.5');
  const [sdA, setSdA] = useState<string>('8.4');
  const [nA, setNA] = useState<string>('25');
  const [meanB, setMeanB] = useState<string>('72.1');
  const [sdB, setSdB] = useState<string>('9.2');
  const [nB, setNB] = useState<string>('28');
  const [equalVar, setEqualVar] = useState<boolean>(false);
  const [pairedMeanDiff, setPairedMeanDiff] = useState<string>('4.2');
  const [pairedSdDiff, setPairedSdDiff] = useState<string>('3.1');
  const [pairedN, setPairedN] = useState<string>('20');
  const [x2A, setX2A] = useState<string>('42');
  const [n2A, setN2A] = useState<string>('100');
  const [x2B, setX2B] = useState<string>('28');
  const [n2B, setN2B] = useState<string>('100');

  // Chi-Square State
  const [chiType, setChiType] = useState<'gof' | 'indep'>('gof');
  const [gofObserved, setGofObserved] = useState<string>('18, 22, 19, 25, 16');
  const [gofExpected, setGofExpected] = useState<string>('20, 20, 20, 20, 20');
  const [contingencyText, setContingencyText] = useState<string>('50, 20\n30, 40');

  // ANOVA State
  const [anovaGroup1, setAnovaGroup1] = useState<string>('82, 85, 87, 86, 88');
  const [anovaGroup2, setAnovaGroup2] = useState<string>('75, 78, 77, 80, 79');
  const [anovaGroup3, setAnovaGroup3] = useState<string>('91, 93, 90, 92, 94');

  const INFERENCE_TABS = ['1sample', '2sample', 'chisquare', 'anova'];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Test Calculation
  const result: HypothesisTestResult | null = useMemo(() => {
    try {
      const parsedAlpha = parseFloat(alpha) || 0.05;

      if (activeTab === '1sample') {
        if (oneSampleType === 'z_mean') {
          return oneSampleZTest({
            sampleMean: parseFloat(sampleMean1) || 0,
            sampleSize: parseInt(sampleSize1, 10) || 1,
            popStdDev: parseFloat(popStdDev1) || 1,
            hypothesizedMean: parseFloat(hypoMean1) || 0,
            alpha: parsedAlpha,
            alternative,
          });
        } else if (oneSampleType === 't_mean') {
          return oneSampleTTest({
            sampleMean: parseFloat(sampleMean1) || 0,
            sampleStdDev: parseFloat(sampleStdDev1) || 1,
            sampleSize: parseInt(sampleSize1, 10) || 2,
            hypothesizedMean: parseFloat(hypoMean1) || 0,
            alpha: parsedAlpha,
            alternative,
          });
        } else {
          return oneSampleProportionTest({
            successes: parseInt(successes1, 10) || 0,
            trials: parseInt(trials1, 10) || 1,
            hypothesizedP: parseFloat(hypoP1) || 0.5,
            alpha: parsedAlpha,
            alternative,
          });
        }
      } else if (activeTab === '2sample') {
        if (twoSampleType === '2t_indep') {
          return twoSampleTTest({
            mean1: parseFloat(meanA) || 0,
            stdDev1: parseFloat(sdA) || 1,
            n1: parseInt(nA, 10) || 2,
            mean2: parseFloat(meanB) || 0,
            stdDev2: parseFloat(sdB) || 1,
            n2: parseInt(nB, 10) || 2,
            equalVariances: equalVar,
            alpha: parsedAlpha,
            alternative,
          });
        } else if (twoSampleType === 'paired_t') {
          return pairedTTest({
            meanDifference: parseFloat(pairedMeanDiff) || 0,
            stdDevDifference: parseFloat(pairedSdDiff) || 1,
            sampleSize: parseInt(pairedN, 10) || 2,
            alpha: parsedAlpha,
            alternative,
          });
        } else {
          return twoSampleProportionsTest({
            x1: parseInt(x2A, 10) || 0,
            n1: parseInt(n2A, 10) || 1,
            x2: parseInt(x2B, 10) || 0,
            n2: parseInt(n2B, 10) || 1,
            alpha: parsedAlpha,
            alternative,
          });
        }
      } else if (activeTab === 'chisquare') {
        if (chiType === 'gof') {
          const obs = gofObserved.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
          const exp = gofExpected.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
          return chiSquareGoodnessOfFitTest({
            observed: obs,
            expected: exp.length === obs.length ? exp : undefined,
            alpha: parsedAlpha,
          });
        } else {
          const rows = contingencyText
            .trim()
            .split('\n')
            .map((r) => r.split(',').map((c) => parseFloat(c.trim())).filter((n) => !isNaN(n)))
            .filter((r) => r.length > 0);
          return chiSquareIndependenceTest({
            contingencyMatrix: rows,
            alpha: parsedAlpha,
          });
        }
      } else {
        // ANOVA
        const parseNums = (str: string) =>
          str.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
        const groups = [
          { name: 'Group 1', data: parseNums(anovaGroup1) },
          { name: 'Group 2', data: parseNums(anovaGroup2) },
          { name: 'Group 3', data: parseNums(anovaGroup3) },
        ].filter((g) => g.data.length > 0);

        return oneWayAnova({
          groups,
          alpha: parsedAlpha,
        });
      }
    } catch {
      return null;
    }
  }, [
    activeTab,
    alpha,
    alternative,
    oneSampleType,
    sampleMean1,
    sampleStdDev1,
    popStdDev1,
    sampleSize1,
    hypoMean1,
    successes1,
    trials1,
    hypoP1,
    twoSampleType,
    meanA,
    sdA,
    nA,
    meanB,
    sdB,
    nB,
    equalVar,
    pairedMeanDiff,
    pairedSdDiff,
    pairedN,
    x2A,
    n2A,
    x2B,
    n2B,
    chiType,
    gofObserved,
    gofExpected,
    contingencyText,
    anovaGroup1,
    anovaGroup2,
    anovaGroup3,
  ]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 lg:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Statistical Inference & Hypothesis Testing
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Z-tests, Student's t-tests, ANOVA, Chi-Square independence, confidence intervals & effect sizes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToStats && (
            <button
              onClick={onNavigateToStats}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Descriptive Stats
            </button>
          )}
          {result && (
            <button
              onClick={() => {
                setExportData({
                  title: result.testName,
                  engine: 'Statistical Inference Suite',
                  timestamp: Date.now(),
                  inputDescription: `Test: ${result.testName}, α = ${result.alpha}`,
                  resultSummary: `${result.statisticName} = ${result.testStatistic.toFixed(4)}, p = ${result.pValue.toFixed(5)} (${result.rejectNull ? 'Reject H₀' : 'Fail to Reject H₀'})`,
                  steps: [
                    `Test Statistic: ${result.statisticName} = ${result.testStatistic.toFixed(4)}`,
                    `p-value: ${result.pValue.toFixed(5)}`,
                    result.interpretation,
                  ],
                  tableHeaders: ['Parameter / Metric', 'Value'],
                  tableRows: [
                    [`Test Statistic (${result.statisticName})`, result.testStatistic.toFixed(4)],
                    ['p-Value', result.pValue.toFixed(6)],
                    ['Significance (α)', result.alpha.toString()],
                    ['Decision', result.rejectNull ? 'Reject Null (H₀)' : 'Fail to Reject H₀'],
                    ...(result.confidenceInterval
                      ? [['Confidence Interval', `[${result.confidenceInterval.lower.toFixed(4)}, ${result.confidenceInterval.upper.toFixed(4)}]`]]
                      : []),
                    ...(result.effectSize
                      ? [[`Effect Size (${result.effectSize.name})`, result.effectSize.value.toFixed(4)]]
                      : []),
                  ],
                });
              }}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Report
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div
        role="tablist"
        aria-label="Statistical inference test categories"
        onKeyDown={(e) => handleTablistKeydown(e, INFERENCE_TABS, activeTab, (tab) => setActiveTab(tab as typeof activeTab))}
        className="flex border-b border-slate-800 gap-2 mb-6 overflow-x-auto pb-2"
      >
        {[
          { id: '1sample', label: '1-Sample Tests' },
          { id: '2sample', label: '2-Sample Tests' },
          { id: 'chisquare', label: 'Chi-Square Suite' },
          { id: 'anova', label: 'One-Way ANOVA' },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-inference-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-inference-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Significance level & alternative */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-400">Significance (α):</label>
              <select
                value={alpha}
                onChange={(e) => setAlpha(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200"
              >
                <option value="0.01">0.01 (99% CI)</option>
                <option value="0.05">0.05 (95% CI)</option>
                <option value="0.10">0.10 (90% CI)</option>
              </select>
            </div>

            {activeTab !== 'chisquare' && activeTab !== 'anova' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400">Alternative (H₁):</label>
                <select
                  value={alternative}
                  onChange={(e) => setAlternative(e.target.value as AlternativeHypothesis)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200"
                >
                  <option value="two-sided">Two-Sided (≠)</option>
                  <option value="less">Left-Tailed (&lt;)</option>
                  <option value="greater">Right-Tailed (&gt;)</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: 1-Sample Tests */}
          {activeTab === '1sample' && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setOneSampleType('t_mean')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${oneSampleType === 't_mean' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  1-Sample t (Mean)
                </button>
                <button
                  onClick={() => setOneSampleType('z_mean')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${oneSampleType === 'z_mean' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  1-Sample z (Known σ)
                </button>
                <button
                  onClick={() => setOneSampleType('prop_z')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${oneSampleType === 'prop_z' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  1-Proportion z
                </button>
              </div>

              {oneSampleType === 't_mean' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Sample Mean (x̄)</label>
                    <input
                      type="number"
                      value={sampleMean1}
                      onChange={(e) => setSampleMean1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Sample Std Dev (s)</label>
                    <input
                      type="number"
                      value={sampleStdDev1}
                      onChange={(e) => setSampleStdDev1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Sample Size (n)</label>
                    <input
                      type="number"
                      value={sampleSize1}
                      onChange={(e) => setSampleSize1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Hypothesized (μ₀)</label>
                    <input
                      type="number"
                      value={hypoMean1}
                      onChange={(e) => setHypoMean1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                </div>
              )}

              {oneSampleType === 'z_mean' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Sample Mean (x̄)</label>
                    <input
                      type="number"
                      value={sampleMean1}
                      onChange={(e) => setSampleMean1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Known Pop. σ</label>
                    <input
                      type="number"
                      value={popStdDev1}
                      onChange={(e) => setPopStdDev1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Sample Size (n)</label>
                    <input
                      type="number"
                      value={sampleSize1}
                      onChange={(e) => setSampleSize1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Hypothesized (μ₀)</label>
                    <input
                      type="number"
                      value={hypoMean1}
                      onChange={(e) => setHypoMean1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                </div>
              )}

              {oneSampleType === 'prop_z' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Successes (x)</label>
                    <input
                      type="number"
                      value={successes1}
                      onChange={(e) => setSuccesses1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Total Trials (n)</label>
                    <input
                      type="number"
                      value={trials1}
                      onChange={(e) => setTrials1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Hypothesized (p₀)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={hypoP1}
                      onChange={(e) => setHypoP1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 2-Sample Tests */}
          {activeTab === '2sample' && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setTwoSampleType('2t_indep')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${twoSampleType === '2t_indep' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  2-Sample t (Independent)
                </button>
                <button
                  onClick={() => setTwoSampleType('paired_t')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${twoSampleType === 'paired_t' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Paired t-Test
                </button>
                <button
                  onClick={() => setTwoSampleType('2prop_z')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${twoSampleType === '2prop_z' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  2-Proportions z
                </button>
              </div>

              {twoSampleType === '2t_indep' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="col-span-3 text-xs font-bold text-indigo-400">Sample 1 (Group A)</span>
                    <input
                      type="number"
                      placeholder="Mean x̄₁"
                      value={meanA}
                      onChange={(e) => setMeanA(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Std Dev s₁"
                      value={sdA}
                      onChange={(e) => setSdA(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Size n₁"
                      value={nA}
                      onChange={(e) => setNA(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="col-span-3 text-xs font-bold text-emerald-400">Sample 2 (Group B)</span>
                    <input
                      type="number"
                      placeholder="Mean x̄₂"
                      value={meanB}
                      onChange={(e) => setMeanB(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Std Dev s₂"
                      value={sdB}
                      onChange={(e) => setSdB(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Size n₂"
                      value={nB}
                      onChange={(e) => setNB(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={equalVar}
                      onChange={(e) => setEqualVar(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                    />
                    Assume Equal Variances (Pooled t-test)
                  </label>
                </div>
              )}

              {twoSampleType === 'paired_t' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Mean Diff (d̄)</label>
                    <input
                      type="number"
                      value={pairedMeanDiff}
                      onChange={(e) => setPairedMeanDiff(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Std Dev Diff (s_d)</label>
                    <input
                      type="number"
                      value={pairedSdDiff}
                      onChange={(e) => setPairedSdDiff(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Pairs Count (n)</label>
                    <input
                      type="number"
                      value={pairedN}
                      onChange={(e) => setPairedN(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                </div>
              )}

              {twoSampleType === '2prop_z' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
                    <span className="text-xs font-bold text-indigo-400">Group 1 (x₁, n₁)</span>
                    <input
                      type="number"
                      placeholder="Successes x₁"
                      value={x2A}
                      onChange={(e) => setX2A(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Total n₁"
                      value={n2A}
                      onChange={(e) => setN2A(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
                    <span className="text-xs font-bold text-emerald-400">Group 2 (x₂, n₂)</span>
                    <input
                      type="number"
                      placeholder="Successes x₂"
                      value={x2B}
                      onChange={(e) => setX2B(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Total n₂"
                      value={n2B}
                      onChange={(e) => setN2B(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Chi-Square Suite */}
          {activeTab === 'chisquare' && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setChiType('gof')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${chiType === 'gof' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Goodness-of-Fit Test
                </button>
                <button
                  onClick={() => setChiType('indep')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${chiType === 'indep' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Test of Independence
                </button>
              </div>

              {chiType === 'gof' ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Observed Frequencies (comma separated)</label>
                    <input
                      type="text"
                      value={gofObserved}
                      onChange={(e) => setGofObserved(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Expected Frequencies (optional, comma separated)</label>
                    <input
                      type="text"
                      value={gofExpected}
                      onChange={(e) => setGofExpected(e.target.value)}
                      placeholder="Leave equal or enter custom frequencies"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-bold block">Contingency Matrix (comma rows, newline separated)</label>
                  <textarea
                    rows={4}
                    value={contingencyText}
                    onChange={(e) => setContingencyText(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ANOVA */}
          {activeTab === 'anova' && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-300">Enter Sample Observations per Group (comma separated)</span>
              <div>
                <label className="text-xs text-indigo-400 font-bold block mb-1">Group 1</label>
                <input
                  type="text"
                  value={anovaGroup1}
                  onChange={(e) => setAnovaGroup1(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-xs font-bold text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-emerald-400 font-bold block mb-1">Group 2</label>
                <input
                  type="text"
                  value={anovaGroup2}
                  onChange={(e) => setAnovaGroup2(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-xs font-bold text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-amber-400 font-bold block mb-1">Group 3</label>
                <input
                  type="text"
                  value={anovaGroup3}
                  onChange={(e) => setAnovaGroup3(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-xs font-bold text-slate-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Output & Decision Panel */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {result ? (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">{result.testName}</h3>
                  <button
                    onClick={() => handleCopy(`${result.testName}: ${result.statisticName}=${result.testStatistic.toFixed(4)}, p=${result.pValue.toFixed(5)}. ${result.interpretation}`)}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy result summary"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-full ${
                    result.rejectNull ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {result.rejectNull ? 'Reject Null (H₀)' : 'Fail to Reject H₀'}
                </span>
              </div>

              {/* Primary Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-0.5">Test Statistic ({result.statisticName})</span>
                  <span className="font-mono text-base font-bold text-indigo-400">{result.testStatistic.toFixed(4)}</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-0.5">p-Value</span>
                  <span
                    className={`font-mono text-base font-bold ${
                      result.pValue < result.alpha ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {result.pValue < 0.0001 ? '< 0.0001' : result.pValue.toFixed(5)}
                  </span>
                </div>

                {result.degreesOfFreedom !== undefined && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Deg. of Freedom (df)</span>
                    <span className="font-mono text-base font-bold text-slate-200">
                      {Array.isArray(result.degreesOfFreedom)
                        ? `${result.degreesOfFreedom[0]}, ${result.degreesOfFreedom[1]}`
                        : result.degreesOfFreedom}
                    </span>
                  </div>
                )}
              </div>

              {/* Confidence Interval & Effect Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.confidenceInterval && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">
                      {(result.confidenceInterval.confidenceLevel * 100).toFixed(0)}% Confidence Interval
                    </span>
                    <span className="font-mono text-xs font-bold text-sky-400">
                      [{result.confidenceInterval.lower.toFixed(4)}, {result.confidenceInterval.upper.toFixed(4)}]
                    </span>
                  </div>
                )}

                {result.effectSize && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Effect Size ({result.effectSize.name})</span>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {result.effectSize.value.toFixed(4)}{' '}
                      {result.effectSize.interpretation && (
                        <span className="text-slate-400 font-sans font-normal text-xs">
                          ({result.effectSize.interpretation})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Statistical Decision Narrative */}
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{result.interpretation}</p>
              </div>

              {/* Detailed Breakdown */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Breakdown Details</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(result.details).map(([k, v]) => (
                    <div key={k} className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg flex justify-between">
                      <span className="text-slate-400">{k}:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {typeof v === 'number' ? v.toFixed(4) : v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500/60" />
              <p className="text-xs">Invalid inputs. Please verify all sample fields are strictly positive.</p>
            </div>
          )}
        </div>
      </div>

      {exportData && (
        <ExportModal
          isOpen={!!exportData}
          data={exportData}
          onClose={() => setExportData(null)}
        />
      )}
    </div>
  );
};
