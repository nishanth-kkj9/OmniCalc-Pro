import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  BookOpen,
  ArrowLeftRight,
  Copy,
  Check,
  Download,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AppSettings } from '../types';
import {
  PHYSICS_CONSTANTS,
  PHYSICS_FORMULAS,
  UNIT_DICTIONARY,
  convertPhysicalUnit,
  getCompatibleUnits,
  identifyDimensionName,
  formatDimensionVector,
  PhysicsFormula,
} from '../utils/unitsEngine';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';

interface PhysicalUnitsCalculatorProps {
  settings: AppSettings;
}

export const PhysicalUnitsCalculator: React.FC<PhysicalUnitsCalculatorProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'evaluator' | 'formulas' | 'constants' | 'converter'>(
    'evaluator'
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [exportData, setExportData] = useState<ExportReportData | null>(null);

  // Expression Evaluator State
  const [val1, setVal1] = useState<string>('15');
  const [unit1, setUnit1] = useState<string>('kg');
  const [op, setOp] = useState<'*' | '/' | '+' | '-'>('*');
  const [val2, setVal2] = useState<string>('9.80665');
  const [unit2, setUnit2] = useState<string>('m/s');
  const [targetUnit, setTargetUnit] = useState<string>('N');

  // Multi-Step Compound Expression State
  const [compoundPreset, setCompoundPreset] = useState<string>('work');

  // Formula State
  const [selectedFormula, setSelectedFormula] = useState<PhysicsFormula>(PHYSICS_FORMULAS[0]);
  const [formulaInputs, setFormulaInputs] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    PHYSICS_FORMULAS[0].variables.forEach((v) => {
      init[v.symbol] = v.defaultValue;
    });
    return init;
  });

  // Constants Filter State
  const [constantFilter, setConstantFilter] = useState<string>('');

  // Converter State
  const [convVal, setConvVal] = useState<string>('100');
  const [convFrom, setConvFrom] = useState<string>('km/h');
  const [convTo, setConvTo] = useState<string>('m/s');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

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
      : 'bg-slate-950/80 border-slate-800/80';

  const inputBg = isLight
    ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-sky-500'
    : isOled
      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-sky-500'
      : 'bg-slate-800 border-slate-700 text-slate-100 focus:border-sky-500';

  // Evaluate 2-Quantity Unit Expression with Dimensional Analysis
  const evalResult = useMemo(() => {
    const v1 = parseFloat(val1);
    const v2 = parseFloat(val2);
    const u1 = UNIT_DICTIONARY[unit1];
    const u2 = UNIT_DICTIONARY[unit2];

    if (isNaN(v1) || isNaN(v2) || !u1 || !u2) {
      return { error: 'Invalid numeric input or unrecognized unit.' };
    }

    // SI Base Values
    const base1 = v1 * u1.scale;
    const base2 = v2 * u2.scale;

    let resBaseVal = 0;
    const resDims = [...u1.dimensions] as [number, number, number, number, number, number, number];

    if (op === '+' || op === '-') {
      // Check dimensional consistency!
      let dimsMatch = true;
      for (let i = 0; i < 7; i++) {
        if (u1.dimensions[i] !== u2.dimensions[i]) {
          dimsMatch = false;
          break;
        }
      }

      if (!dimsMatch) {
        return {
          error: `Dimensional Inconsistency: Cannot ${op === '+' ? 'add' : 'subtract'} ${u1.category} (${formatDimensionVector(u1.dimensions)}) with ${u2.category} (${formatDimensionVector(u2.dimensions)}). Physical quantities must possess identical dimensions for addition or subtraction.`,
          isDimError: true,
        };
      }

      resBaseVal = op === '+' ? base1 + base2 : base1 - base2;
    } else if (op === '*') {
      resBaseVal = base1 * base2;
      for (let i = 0; i < 7; i++) {
        resDims[i] = u1.dimensions[i] + u2.dimensions[i];
      }
    } else if (op === '/') {
      if (Math.abs(base2) < 1e-18) return { error: 'Division by zero.' };
      resBaseVal = base1 / base2;
      for (let i = 0; i < 7; i++) {
        resDims[i] = u1.dimensions[i] - u2.dimensions[i];
      }
    }

    const dimensionName = identifyDimensionName(resDims);
    const compatibleUnits = getCompatibleUnits(resDims);

    // Target unit conversion
    let targetConverted = resBaseVal;
    let activeTarget = targetUnit;
    const matchedTargetUnit = UNIT_DICTIONARY[targetUnit];

    if (matchedTargetUnit && compatibleUnits.some((u) => u.symbol === targetUnit)) {
      targetConverted = resBaseVal / matchedTargetUnit.scale;
    } else if (compatibleUnits.length > 0) {
      activeTarget = compatibleUnits[0].symbol;
      targetConverted = resBaseVal / compatibleUnits[0].scale;
    }

    return {
      value: resBaseVal,
      formattedBase: `${resBaseVal.toPrecision(7).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1')}`,
      targetValue: targetConverted,
      targetSymbol: activeTarget,
      dimensions: resDims,
      dimensionName,
      compatibleUnits,
      steps: [
        `Base Conversion: (${v1} ${u1.symbol}) = ${base1} SI Base`,
        `Base Conversion: (${v2} ${u2.symbol}) = ${base2} SI Base`,
        `Dimensional Combination: ${formatDimensionVector(u1.dimensions)} ${op} ${formatDimensionVector(u2.dimensions)} = ${formatDimensionVector(resDims)}`,
        `Classified Quantity: ${dimensionName}`,
        `Calculated SI Magnitude: ${resBaseVal.toPrecision(6)} [SI Base]`,
        `Target Conversion (${activeTarget}): ${targetConverted.toPrecision(6)} ${activeTarget}`,
      ],
    };
  }, [val1, unit1, op, val2, unit2, targetUnit]);

  // Load Compound Presets
  const applyPreset = (presetKey: string) => {
    setCompoundPreset(presetKey);
    if (presetKey === 'force') {
      setVal1('50');
      setUnit1('kg');
      setOp('*');
      setVal2('9.80665');
      setUnit2('m/s');
      setTargetUnit('N');
    } else if (presetKey === 'work') {
      setVal1('250');
      setUnit1('N');
      setOp('*');
      setVal2('12');
      setUnit2('m');
      setTargetUnit('J');
    } else if (presetKey === 'power') {
      setVal1('230');
      setUnit1('V');
      setOp('*');
      setVal2('16');
      setUnit2('A');
      setTargetUnit('W');
    } else if (presetKey === 'energy_time') {
      setVal1('5');
      setUnit1('kW');
      setOp('*');
      setVal2('4');
      setUnit2('h');
      setTargetUnit('kWh');
    } else if (presetKey === 'pressure') {
      setVal1('10000');
      setUnit1('N');
      setOp('/');
      setVal2('2');
      setUnit2('m2');
      setTargetUnit('kPa');
    }
  };

  // Convert Result
  const convResult = useMemo<{ success: boolean; result?: number; error?: string }>(() => {
    const val = parseFloat(convVal);
    if (isNaN(val)) return { success: false, error: 'Invalid numeric value' };
    return convertPhysicalUnit(val, convFrom, convTo);
  }, [convVal, convFrom, convTo]);

  // Compatible Units for current convFrom
  const compatibleConvTargets = useMemo(() => {
    const u = UNIT_DICTIONARY[convFrom];
    if (!u) return [];
    return getCompatibleUnits(u.dimensions);
  }, [convFrom]);

  // Filtered Constants
  const filteredConstants = useMemo(() => {
    if (!constantFilter.trim()) return PHYSICS_CONSTANTS;
    const q = constantFilter.toLowerCase();
    return PHYSICS_CONSTANTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [constantFilter]);

  // Selected Formula Result
  const formulaResult = useMemo(() => {
    try {
      return selectedFormula.calculate(formulaInputs);
    } catch {
      return null;
    }
  }, [selectedFormula, formulaInputs]);

  return (
    <div className="max-w-5xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Engine Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          {
            id: 'evaluator',
            label: 'Unit Arithmetic & Dimensional Check',
            icon: <Zap className="w-4 h-4 flex-shrink-0" />,
          },
          {
            id: 'formulas',
            label: 'Physics Formulas & Derivations',
            icon: <Sparkles className="w-4 h-4 flex-shrink-0" />,
          },
          {
            id: 'converter',
            label: 'Dimension-Safe Converter',
            icon: <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />,
          },
          {
            id: 'constants',
            label: 'Universal Physical Constants',
            icon: <BookOpen className="w-4 h-4 flex-shrink-0" />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm flex items-center gap-2 flex-shrink-0
              ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: UNIT ARITHMETIC & DIMENSIONAL CHECK */}
      {activeTab === 'evaluator' && (
        <div className="flex flex-col gap-6">
          {/* Presets Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold px-1 whitespace-nowrap flex-shrink-0">
              Presets:
            </span>
            {[
              { id: 'work', label: 'Force × Distance (Work = Joules)' },
              { id: 'force', label: 'Mass × Acceleration (Force = Newtons)' },
              { id: 'power', label: 'Voltage × Current (Power = Watts)' },
              { id: 'energy_time', label: 'Power × Time (Energy = kWh)' },
              { id: 'pressure', label: 'Force ÷ Area (Pressure = Pa)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  compoundPreset === p.id
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className={`${cardBg} border rounded-3xl p-6 flex flex-col gap-6`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Dimensional Consistency & Compound Unit Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Calculates unit operations, analyzes SI base dimensions [M, L, T, I, Θ, N, J], and
                  flags dimensional errors
                </p>
              </div>
              <button
                onClick={() => {
                  setVal1('15');
                  setUnit1('kg');
                  setOp('*');
                  setVal2('9.80665');
                  setUnit2('m/s');
                  setTargetUnit('N');
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Arithmetic Expression Builder */}
            <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-3">
              {/* Quantity 1 */}
              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">First Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={val1}
                    onChange={(e) => setVal1(e.target.value)}
                    className={`flex-1 ${inputBg} rounded-2xl p-3 text-lg font-mono font-bold focus:outline-none`}
                  />
                  <select
                    value={unit1}
                    onChange={(e) => setUnit1(e.target.value)}
                    className={`w-36 ${inputBg} rounded-2xl p-3 text-xs font-bold font-mono focus:outline-none cursor-pointer`}
                  >
                    {Object.values(UNIT_DICTIONARY).map((u) => (
                      <option key={u.symbol} value={u.symbol}>
                        {u.symbol} ({u.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Operator */}
              <div className="md:col-span-1 flex flex-col items-center justify-center gap-1">
                <label className="text-xs font-bold text-slate-400">Operation</label>
                <div className="flex md:flex-col gap-1">
                  {(['*', '/', '+', '-'] as const).map((operation) => (
                    <button
                      key={operation}
                      onClick={() => setOp(operation)}
                      className={`w-9 h-9 rounded-xl font-bold font-mono text-base flex items-center justify-center transition-all ${
                        op === operation
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {operation === '*' ? '×' : operation === '/' ? '÷' : operation}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity 2 */}
              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Second Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={val2}
                    onChange={(e) => setVal2(e.target.value)}
                    className={`flex-1 ${inputBg} rounded-2xl p-3 text-lg font-mono font-bold focus:outline-none`}
                  />
                  <select
                    value={unit2}
                    onChange={(e) => setUnit2(e.target.value)}
                    className={`w-36 ${inputBg} rounded-2xl p-3 text-xs font-bold font-mono focus:outline-none cursor-pointer`}
                  >
                    {Object.values(UNIT_DICTIONARY).map((u) => (
                      <option key={u.symbol} value={u.symbol}>
                        {u.symbol} ({u.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Formatted Equation Display */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl text-center font-mono text-base font-bold text-sky-400 flex items-center justify-center gap-2">
              <span>
                {val1} {unit1}
              </span>
              <span className="text-white">{op === '*' ? '×' : op === '/' ? '÷' : op}</span>
              <span>
                {val2} {unit2}
              </span>
              <span className="text-white">=</span>
              <span className="text-emerald-400">
                {evalResult.error
                  ? '—'
                  : `${evalResult.targetValue?.toFixed(4)} ${evalResult.targetSymbol}`}
              </span>
            </div>

            {/* Results Panel */}
            {evalResult.error ? (
              <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-400">
                    {evalResult.isDimError ? 'Dimensional Consistency Error' : 'Calculation Error'}
                  </h4>
                  <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                    {evalResult.error}
                  </p>
                </div>
              </div>
            ) : (
              <div className={`${subCardBg} border rounded-2xl p-5 flex flex-col gap-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Identified Dimension
                    </span>
                    <h4 className="text-xl font-bold text-sky-400">{evalResult.dimensionName}</h4>
                    <span className="text-xs font-mono text-slate-400">
                      SI Vector: {formatDimensionVector(evalResult.dimensions!)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopy(
                          'eval',
                          `${val1} ${unit1} ${op} ${val2} ${unit2} = ${evalResult.targetValue} ${evalResult.targetSymbol}`
                        )
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700"
                    >
                      {copied === 'eval' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied === 'eval' ? 'Copied' : 'Copy'}
                    </button>

                    <button
                      onClick={() => {
                        setExportData({
                          title: `Physical Unit Calculation: ${evalResult.dimensionName}`,
                          engine: 'Physical Unit Engine',
                          timestamp: Date.now(),
                          inputDescription: `${val1} ${unit1} ${op} ${val2} ${unit2}`,
                          resultSummary: `${evalResult.targetValue} ${evalResult.targetSymbol}`,
                          latex: `(${val1} \\, \\text{${unit1}}) ${op === '*' ? '\\cdot' : op === '/' ? '/' : op} (${val2} \\, \\text{${unit2}}) = ${evalResult.targetValue} \\, \\text{${evalResult.targetSymbol}}`,
                          steps: evalResult.steps,
                          metadata: {
                            'SI Base Value': evalResult.formattedBase || '',
                            'Dimension Formula': formatDimensionVector(evalResult.dimensions!),
                            'Classified Quantity': evalResult.dimensionName || '',
                          },
                        });
                      }}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Report
                    </button>
                  </div>
                </div>

                {/* Target Unit Convert Pills */}
                {evalResult.compatibleUnits && evalResult.compatibleUnits.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-slate-400">
                      Equivalent Units for this Dimension:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {evalResult.compatibleUnits.map((u) => {
                        const valInThisUnit = evalResult.value! / u.scale;
                        return (
                          <button
                            key={u.symbol}
                            onClick={() => setTargetUnit(u.symbol)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                              evalResult.targetSymbol === u.symbol
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            <span>
                              {valInThisUnit < 0.001 || valInThisUnit > 1e6
                                ? valInThisUnit.toExponential(4)
                                : valInThisUnit.toFixed(4)}
                            </span>
                            <span className="text-sky-400">{u.symbol}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step by step */}
                <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3">
                  <span className="text-xs font-bold text-slate-400">
                    Dimensional Reduction Steps:
                  </span>
                  {evalResult.steps?.map((step, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-300">
                      • {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PHYSICS FORMULAS & DERIVATIONS */}
      {activeTab === 'formulas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formula Selector Sidebar */}
          <div className={`${cardBg} border rounded-3xl p-4 flex flex-col gap-2 md:col-span-1`}>
            <span className="text-xs font-bold text-slate-400 uppercase px-2 mb-1">
              Standard Physics Formulas
            </span>
            {PHYSICS_FORMULAS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFormula(f);
                  const init: Record<string, number> = {};
                  f.variables.forEach((v) => {
                    init[v.symbol] = v.defaultValue;
                  });
                  setFormulaInputs(init);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  selectedFormula.id === f.id
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{f.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${selectedFormula.id === f.id ? 'bg-sky-700 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {f.category}
                  </span>
                </div>
                <span className="text-xs font-mono opacity-80">{f.formulaLatex}</span>
              </button>
            ))}
          </div>

          {/* Formula Interactive Workspace */}
          <div className={`${cardBg} border rounded-3xl p-6 flex flex-col gap-6 md:col-span-2`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">{selectedFormula.name}</h3>
                <p className="text-xs text-slate-400">{selectedFormula.description}</p>
              </div>
              <span className="px-2.5 py-1 bg-sky-950 text-sky-400 border border-sky-800/60 rounded-xl text-xs font-bold">
                {selectedFormula.category}
              </span>
            </div>

            {/* Variables Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedFormula.variables.map((v) => (
                <div key={v.symbol} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">
                    {v.name} ({v.symbol}) in [{v.unit}]
                  </label>
                  <input
                    type="number"
                    value={formulaInputs[v.symbol] ?? v.defaultValue}
                    onChange={(e) =>
                      setFormulaInputs({
                        ...formulaInputs,
                        [v.symbol]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={`w-full ${inputBg} rounded-2xl p-3 text-base font-mono font-bold focus:outline-none`}
                  />
                </div>
              ))}
            </div>

            {/* Computation Result */}
            {formulaResult && (
              <div className={`${subCardBg} border rounded-2xl p-5 flex flex-col gap-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Calculated Result
                    </span>
                    <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                      {formulaResult.value < 0.001 || formulaResult.value > 1e6
                        ? formulaResult.value.toExponential(6)
                        : formulaResult.value.toFixed(4)}{' '}
                      <span className="text-sky-400 text-lg">{formulaResult.unit}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setExportData({
                        title: `Physics Formula: ${selectedFormula.name}`,
                        engine: 'Physics Formula Solver',
                        timestamp: Date.now(),
                        inputDescription: Object.entries(formulaInputs)
                          .map(([k, v]) => `${k} = ${v}`)
                          .join(', '),
                        resultSummary: `${formulaResult.value} ${formulaResult.unit}`,
                        latex: selectedFormula.formulaLatex,
                        steps: formulaResult.steps,
                        metadata: {
                          Category: selectedFormula.category,
                          Formula: selectedFormula.formulaLatex,
                        },
                      });
                    }}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Derivation
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400">Step-by-Step Derivation:</span>
                  {formulaResult.steps.map((s, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-300">
                      • {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DIMENSION-SAFE CONVERTER */}
      {activeTab === 'converter' && (
        <div className={`${cardBg} border rounded-3xl p-6 flex flex-col gap-6`}>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Dimension-Safe Physical Unit Converter
            </h3>
            <p className="text-xs text-slate-400">
              Converts magnitudes across physically compatible dimensions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
            {/* From */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase">
                From Value & Unit
              </label>
              <input
                type="number"
                value={convVal}
                onChange={(e) => setConvVal(e.target.value)}
                className={`w-full ${inputBg} rounded-2xl p-4 text-2xl font-mono font-bold focus:outline-none`}
              />
              <select
                value={convFrom}
                onChange={(e) => {
                  const newFrom = e.target.value;
                  setConvFrom(newFrom);
                  const u = UNIT_DICTIONARY[newFrom];
                  if (u) {
                    const comp = getCompatibleUnits(u.dimensions);
                    if (comp.length > 1) setConvTo(comp[1].symbol);
                    else if (comp.length > 0) setConvTo(comp[0].symbol);
                  }
                }}
                className={`w-full ${inputBg} rounded-xl p-3 text-sm font-semibold cursor-pointer focus:outline-none`}
              >
                {Object.values(UNIT_DICTIONARY).map((u) => (
                  <option key={u.symbol} value={u.symbol}>
                    {u.name} ({u.symbol}) — {u.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Arrow */}
            <div className="flex justify-center md:col-span-1">
              <button
                onClick={() => {
                  setConvFrom(convTo);
                  setConvTo(convFrom);
                }}
                className="p-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-2xl transition-all"
                title="Swap Units"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
            </div>

            {/* To */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase">
                Converted Outcome
              </label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-2xl font-mono font-bold text-emerald-400 truncate">
                {convResult.success ? (
                  convResult.result! < 0.0001 || convResult.result! > 1e6 ? (
                    convResult.result!.toExponential(6)
                  ) : (
                    convResult.result!.toFixed(6).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1')
                  )
                ) : (
                  <span className="text-rose-400 text-sm">{convResult.error}</span>
                )}
              </div>
              <select
                value={convTo}
                onChange={(e) => setConvTo(e.target.value)}
                className={`w-full ${inputBg} rounded-xl p-3 text-sm font-semibold cursor-pointer focus:outline-none`}
              >
                {compatibleConvTargets.map((u) => (
                  <option key={u.symbol} value={u.symbol}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <span className="text-xs font-semibold text-slate-400">
              {convVal} {convFrom} ={' '}
              <strong className="text-emerald-400 font-mono text-sm">
                {convResult.success ? convResult.result : '—'}
              </strong>{' '}
              {convTo}
            </span>

            <button
              onClick={() =>
                handleCopy(
                  'conv',
                  `${convVal} ${convFrom} = ${convResult.success ? convResult.result : ''} ${convTo}`
                )
              }
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700"
            >
              {copied === 'conv' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied === 'conv' ? 'Copied!' : 'Copy Conversion'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: UNIVERSAL PHYSICAL CONSTANTS */}
      {activeTab === 'constants' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex-1 flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs ${inputBg}`}
            >
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={constantFilter}
                onChange={(e) => setConstantFilter(e.target.value)}
                placeholder="Search physical constants by name, symbol (e.g. c, G, Planck, Boltzmann)..."
                className="w-full bg-transparent border-none text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredConstants.map((c) => (
              <div
                key={c.symbol}
                className={`${cardBg} border rounded-2xl p-4 flex flex-col justify-between gap-2 shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-400 font-mono text-xs font-bold border border-sky-500/30">
                        {c.symbol}
                      </span>
                      {c.name}
                    </span>
                    <button
                      onClick={() => handleCopy(c.symbol, `${c.value}`)}
                      className="text-slate-400 hover:text-slate-200 p-1 text-xs"
                      title="Copy numeric value"
                    >
                      {copied === c.symbol ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{c.description}</p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-xs font-mono">
                  <span className="text-emerald-400 font-bold">{c.value}</span>
                  <span className="text-sky-400">{c.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Export Modal */}
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
