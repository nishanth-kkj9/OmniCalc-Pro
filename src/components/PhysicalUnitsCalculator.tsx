import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowLeftRight,
  BookOpen,
  Copy,
  Check,
  Search,
  Zap,
  Calculator,
  Download,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { AppSettings } from '../types';
import { handleTablistKeydown } from '../utils/ariaTabs';
import {
  PHYSICAL_UNITS,
  PHYSICS_CONSTANTS,
  PHYSICS_FORMULAS,
  formatDimensionVector,
  convertUnit,
  evaluateDimensionalExpression,
  PhysicsFormula,
} from '../utils/unitsEngine';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';

interface PhysicalUnitsCalculatorProps {
  settings: AppSettings;
}

export const PhysicalUnitsCalculator: React.FC<PhysicalUnitsCalculatorProps> = () => {
  const [activeTab, setActiveTab] = useState<'expression' | 'converter' | 'constants' | 'formulas'>('expression');
  const [copied, setCopied] = useState<boolean>(false);
  const [exportData, setExportData] = useState<ExportReportData | null>(null);

  const TABS = ['expression', 'converter', 'constants', 'formulas'];

  // Tab 1: Dimensional Expression State
  const [expression, setExpression] = useState<string>('50 kg * 9.81 m/s^2');

  // Tab 2: Unit Converter State
  const [convertValue, setConvertValue] = useState<string>('100');
  const [selectedCategory, setSelectedCategory] = useState<string>('Energy');

  const categoryUnits = useMemo(() => {
    return PHYSICAL_UNITS.filter((u) => u.category === selectedCategory);
  }, [selectedCategory]);

  const [fromSymbol, setFromSymbol] = useState<string>('J');
  const [toSymbol, setToSymbol] = useState<string>('kWh');

  // Sync default units when category changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const units = PHYSICAL_UNITS.filter((u) => u.category === cat);
    if (units.length >= 2) {
      setFromSymbol(units[0].symbol);
      setToSymbol(units[1].symbol);
    } else if (units.length === 1) {
      setFromSymbol(units[0].symbol);
      setToSymbol(units[0].symbol);
    }
  };

  // Tab 3: Physics Constants Search
  const [constantSearch, setConstantSearch] = useState<string>('');

  const filteredConstants = useMemo(() => {
    if (!constantSearch.trim()) return PHYSICS_CONSTANTS;
    const query = constantSearch.toLowerCase();
    return PHYSICS_CONSTANTS.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query) ||
        c.unit.toLowerCase().includes(query)
    );
  }, [constantSearch]);

  // Tab 4: Physics Formulas State
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('kinetic_energy');
  const [formulaInputs, setFormulaInputs] = useState<Record<string, string>>({
    m: '70',
    v: '15',
  });

  const selectedFormula: PhysicsFormula | undefined = useMemo(() => {
    return PHYSICS_FORMULAS.find((f) => f.id === selectedFormulaId);
  }, [selectedFormulaId]);

  const handleFormulaSelect = (formula: PhysicsFormula) => {
    setSelectedFormulaId(formula.id);
    const defaults: Record<string, string> = {};
    formula.variables.forEach((v) => {
      defaults[v.symbol] = v.defaultValue.toString();
    });
    setFormulaInputs(defaults);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Expression Evaluation Result
  const expressionResult = useMemo(() => {
    try {
      if (!expression.trim()) return null;
      return evaluateDimensionalExpression(expression);
    } catch {
      return null;
    }
  }, [expression]);

  // Converter Calculation Result
  const conversionResult = useMemo(() => {
    try {
      const val = parseFloat(convertValue);
      if (isNaN(val)) return null;
      return convertUnit(val, fromSymbol, toSymbol);
    } catch {
      return null;
    }
  }, [convertValue, fromSymbol, toSymbol]);

  // Formula Calculation Result
  const formulaResult = useMemo(() => {
    if (!selectedFormula) return null;
    try {
      const numericInputs: Record<string, number> = {};
      selectedFormula.variables.forEach((v) => {
        numericInputs[v.symbol] = parseFloat(formulaInputs[v.symbol] || '0') || 0;
      });
      return selectedFormula.calculate(numericInputs);
    } catch {
      return null;
    }
  }, [selectedFormula, formulaInputs]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    PHYSICAL_UNITS.forEach((u) => set.add(u.category));
    return Array.from(set).sort();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 p-2 sm:p-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Physical Units & Dimensional Analysis
            </h2>
            <p className="text-xs text-slate-400">
              SI dimensional analysis, compound unit arithmetic, conversion matrices, physics constants & interactive formulas
            </p>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Physical Units Navigation"
        onKeyDown={(e) => handleTablistKeydown(e, TABS, activeTab, (tab) => setActiveTab(tab as typeof activeTab))}
        className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-2"
      >
        {[
          { id: 'expression', label: 'Dimensional Analysis', icon: <Calculator className="w-3.5 h-3.5" /> },
          { id: 'converter', label: 'Unit Converter', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
          { id: 'constants', label: 'Physics Constants', icon: <Zap className="w-3.5 h-3.5" /> },
          { id: 'formulas', label: 'Physics Formulas', icon: <BookOpen className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-units-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-units-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DIMENSIONAL EXPRESSION EVALUATOR */}
      {activeTab === 'expression' && (
        <div id="panel-units-expression" role="tabpanel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Compound Unit Expression
              </label>
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="e.g. 50 kg * 9.81 m/s^2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Examples: <code className="text-purple-400 font-mono">100 J / 5 s</code>, <code className="text-purple-400 font-mono">12 V / 2 A</code>, <code className="text-purple-400 font-mono">1000 kg * 2.5 m/s^2</code>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 self-center">Preset Expressions:</span>
              {[
                '50 kg * 9.81 m/s^2',
                '100 J / 5 s',
                '12 V / 2 A',
                '101325 Pa * 0.05 m^3',
                '0.5 * 70 kg * (15 m/s)^2',
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => setExpression(p)}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono transition-colors border border-slate-700/60"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            {expressionResult ? (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Evaluated Quantity
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopy(
                          `${expressionResult.value} ${expressionResult.unitSymbol} (${expressionResult.dimensionName})`
                        )
                      }
                      className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Copy result"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setExportData({
                          title: 'Dimensional Analysis Report',
                          engine: 'Physical Units Engine',
                          timestamp: Date.now(),
                          inputDescription: expression,
                          resultSummary: `${expressionResult.value} ${expressionResult.unitSymbol} (${expressionResult.dimensionName})`,
                          tableHeaders: ['Property', 'Value'],
                          tableRows: [
                            ['Evaluated Value', expressionResult.value.toString()],
                            ['SI Unit Symbol', expressionResult.unitSymbol],
                            ['Physical Quantity', expressionResult.dimensionName],
                            ['SI Base Dimensions', formatDimensionVector(expressionResult.dimensions)],
                          ],
                        });
                      }}
                      className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Export
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Numeric Magnitude</span>
                    <span className="font-mono text-xl font-extrabold text-purple-400">
                      {expressionResult.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">SI Unit Symbol</span>
                    <span className="font-mono text-xl font-extrabold text-emerald-400">
                      {expressionResult.unitSymbol}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block">Identified Physical Quantity</span>
                    <span className="text-sm font-bold text-slate-100">{expressionResult.dimensionName}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-slate-400">SI Base Dimensions [M][L][T][I][Θ][N][J]</span>
                  <span className="font-mono text-xs font-bold text-sky-400">
                    {formatDimensionVector(expressionResult.dimensions)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-2">
                <XCircle className="w-6 h-6 text-rose-500/60" />
                <p className="text-xs text-center">
                  Could not parse expression. Ensure units are valid SI symbols (kg, m, s, N, J, W, V, A, Pa).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UNIT CONVERTER */}
      {activeTab === 'converter' && (
        <div id="panel-units-converter" role="tabpanel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Select Physical Quantity Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-bold text-sm text-slate-100 focus:outline-none focus:border-purple-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Value to Convert</label>
              <input
                type="number"
                value={convertValue}
                onChange={(e) => setConvertValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">From Unit</label>
                <select
                  value={fromSymbol}
                  onChange={(e) => setFromSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {categoryUnits.map((u) => (
                    <option key={u.symbol} value={u.symbol}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">To Unit</label>
                <select
                  value={toSymbol}
                  onChange={(e) => setToSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {categoryUnits.map((u) => (
                    <option key={u.symbol} value={u.symbol}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            {conversionResult !== null ? (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Conversion Output</span>
                  <button
                    onClick={() => handleCopy(`${convertValue} ${fromSymbol} = ${conversionResult} ${toSymbol}`)}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Result</span>
                  <div className="font-mono text-2xl font-extrabold text-emerald-400">
                    {conversionResult.toLocaleString(undefined, { maximumFractionDigits: 8 })}{' '}
                    <span className="text-slate-200 text-lg font-bold">{toSymbol}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Scientific: {conversionResult.toExponential(6)} {toSymbol}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-400">Conversion Derivation</span>
                  <p className="text-xs font-mono text-slate-300">
                    {convertValue} {fromSymbol} × (Base SI Scale Factor) → {conversionResult} {toSymbol}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-2">
                <XCircle className="w-6 h-6 text-rose-500/60" />
                <p className="text-xs text-center">Incompatible unit dimensions. Ensure selected units belong to the same category.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PHYSICS CONSTANTS BROWSER */}
      {activeTab === 'constants' && (
        <div id="panel-units-constants" role="tabpanel" className="flex flex-col gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={constantSearch}
              onChange={(e) => setConstantSearch(e.target.value)}
              placeholder="Search fundamental constants (e.g. speed of light, Planck, electron mass)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredConstants.map((c) => (
              <div
                key={c.symbol}
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-extrabold text-purple-400">{c.symbol}</span>
                    <button
                      onClick={() => handleCopy(`${c.name} (${c.symbol}) = ${c.value} ${c.unit}`)}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Copy Constant"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 mb-1">{c.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                </div>

                <div className="p-2 bg-slate-950 border border-slate-800/80 rounded-lg flex flex-col gap-0.5">
                  <span className="font-mono text-xs font-bold text-emerald-400">{c.value.toExponential(6)}</span>
                  <span className="font-mono text-[10px] text-slate-400">{c.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PHYSICS FORMULAS */}
      {activeTab === 'formulas' && (
        <div id="panel-units-formulas" role="tabpanel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Physics Formula</span>
            {PHYSICS_FORMULAS.map((f) => (
              <button
                key={f.id}
                onClick={() => handleFormulaSelect(f)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  selectedFormulaId === f.id
                    ? 'bg-purple-600/20 border-purple-500/50 text-slate-100 shadow-md shadow-purple-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">{f.category}</span>
                  <span className="font-mono text-xs font-bold text-slate-200">{f.formulaLatex}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">{f.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-1">{f.description}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            {selectedFormula && (
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 mb-1">{selectedFormula.name}</h3>
                  <p className="text-xs text-slate-400">{selectedFormula.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedFormula.variables.map((v) => (
                    <div key={v.symbol}>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        {v.name} ({v.symbol}) <span className="text-purple-400 font-mono">[{v.unit}]</span>
                      </label>
                      <input
                        type="number"
                        value={formulaInputs[v.symbol] || ''}
                        onChange={(e) =>
                          setFormulaInputs((prev) => ({
                            ...prev,
                            [v.symbol]: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>

                {formulaResult && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Computed Output</span>
                      <button
                        onClick={() => handleCopy(`${selectedFormula.name} = ${formulaResult.value} ${formulaResult.unit}`)}
                        className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div>
                      <span className="font-mono text-2xl font-extrabold text-emerald-400">
                        {formulaResult.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
                        <span className="text-slate-200 text-lg font-bold">{formulaResult.unit}</span>
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                      <span className="text-xs font-bold text-slate-400">Step Derivation:</span>
                      {formulaResult.steps.map((step, idx) => (
                        <p key={idx} className="text-xs font-mono text-slate-300">
                          {step}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {exportData && <ExportModal isOpen={!!exportData} data={exportData} onClose={() => setExportData(null)} />}
    </div>
  );
};
