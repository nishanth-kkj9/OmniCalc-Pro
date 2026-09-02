import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Copy, Check, History, ChevronUp, ChevronDown, Download } from 'lucide-react';
import { evaluateExpression } from '../utils/calculator';
import { addHistory, getHistory } from '../utils/history';
import { formatNumberWithSettings } from '../utils/formatting';
import { ExportModal } from './ExportModal';
import { AppSettings, HistoryItem, AngleMode } from '../types';
import { ExportReportData } from '../utils/exportEngine';

interface ScientificCalculatorProps {
  settings: AppSettings;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({ settings }) => {
  const [expression, setExpression] = useState<string>('');
  const [rawResult, setRawResult] = useState<string>('0');
  const [displayResult, setDisplayResult] = useState<string>('0');
  const [is2nd, setIs2nd] = useState<boolean>(false);
  const [angleMode, setAngleMode] = useState<AngleMode>(settings.angleMode);
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showHistoryTape, setShowHistoryTape] = useState<boolean>(false);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const refreshHistory = useCallback(() => {
    const list = getHistory().filter((h) => h.mode === 'scientific' || h.mode === 'basic');
    setRecentHistory(list.slice(0, 8));
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Sync settings angleMode if prop updates
  useEffect(() => {
    setAngleMode(settings.angleMode);
  }, [settings.angleMode]);

  // Live preview evaluation
  useEffect(() => {
    if (!expression.trim()) {
      setRawResult('0');
      setDisplayResult('0');
      return;
    }
    const evaluated = evaluateExpression(expression, angleMode, settings.precision);
    setRawResult(evaluated);
    setDisplayResult(formatNumberWithSettings(evaluated, settings));
  }, [expression, angleMode, settings]);

  const handleCopy = () => {
    const valToCopy = displayResult || rawResult || '0';
    navigator.clipboard.writeText(valToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleInput = useCallback(
    (val: string) => {
      if (isEvaluated) {
        if (['+', '−', '×', '÷', '%', '^'].includes(val)) {
          setExpression(rawResult + val);
        } else {
          setExpression(val);
        }
        setIsEvaluated(false);
      } else {
        setExpression((prev) => prev + val);
      }
    },
    [isEvaluated, rawResult]
  );

  const handleClear = () => {
    setExpression('');
    setRawResult('0');
    setDisplayResult('0');
    setIsEvaluated(false);
  };

  const handleBackspace = useCallback(() => {
    if (isEvaluated) {
      setExpression('');
      setRawResult('0');
      setDisplayResult('0');
      setIsEvaluated(false);
    } else {
      setExpression((prev) => prev.slice(0, -1));
    }
  }, [isEvaluated]);

  const handleEquals = useCallback(() => {
    if (!expression.trim()) return;
    const finalVal = evaluateExpression(expression, angleMode, settings.precision);
    if (finalVal !== 'Error') {
      const formatted = formatNumberWithSettings(finalVal, settings);
      addHistory(expression, formatted, 'scientific', settings);
      setRawResult(finalVal);
      setDisplayResult(formatted);
      setIsEvaluated(true);
      refreshHistory();
    } else {
      setRawResult('Error');
      setDisplayResult('Error');
      setIsEvaluated(true);
    }
  }, [expression, angleMode, settings, refreshHistory]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') handleInput(e.key);
      else if (e.key === '.') handleInput('.');
      else if (e.key === '+') handleInput('+');
      else if (e.key === '-') handleInput('−');
      else if (e.key === '*') handleInput('×');
      else if (e.key === '/') handleInput('÷');
      else if (e.key === '%') handleInput('%');
      else if (e.key === '(' || e.key === ')') handleInput(e.key);
      else if (e.key === '^') handleInput('^');
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape') handleClear();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, handleEquals, handleBackspace]);

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const btnClass =
    'h-11 sm:h-12 font-semibold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all duration-150 active:scale-95 flex items-center justify-center select-none shadow-xs touch-manipulation focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-1 focus-visible:outline-none';

  const numBtnClass = isLight
    ? `${btnClass} bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 border border-slate-200 font-bold text-base`
    : isOled
      ? `${btnClass} bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 font-bold text-base`
      : `${btnClass} bg-slate-800/90 hover:bg-slate-700 active:bg-slate-700 text-slate-100 border border-slate-700/60 font-bold text-base`;

  const opBtnClass = isLight
    ? `${btnClass} bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-base`
    : isOled
      ? `${btnClass} bg-zinc-900 hover:bg-zinc-800 text-sky-400 border border-zinc-800 font-bold text-base`
      : `${btnClass} bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 font-bold text-base`;

  const fnBtnClass = isLight
    ? `${btnClass} bg-slate-100/80 hover:bg-slate-200 text-slate-700 border border-slate-300/80 font-mono`
    : isOled
      ? `${btnClass} bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono`
      : `${btnClass} bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-mono`;

  const screenBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : isOled
      ? 'bg-black border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl';

  // Export Report Data
  const exportReportData: ExportReportData = {
    title: 'Scientific & Trigonometric Evaluation',
    engine: 'Scientific Engine',
    timestamp: Date.now(),
    inputDescription: expression || '0',
    resultSummary: displayResult || '0',
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-2 sm:p-4 flex flex-col gap-3.5">
      {/* Display Screen */}
      <div
        className={`${screenBg} border rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[145px] text-right overflow-hidden relative group transition-colors shadow-lg`}
      >
        {/* Top Badges and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setAngleMode(angleMode === 'DEG' ? 'RAD' : 'DEG')}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-all bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30"
              title="Toggle Angle Mode (Degrees / Radians)"
            >
              {angleMode}
            </button>

            <button
              onClick={() => setShowHistoryTape(!showHistoryTape)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                showHistoryTape
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                  : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700/80'
              }`}
              title="Toggle Quick History Tape"
              aria-pressed={showHistoryTape}
            >
              <History className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Tape</span>
              {showHistoryTape ? (
                <ChevronUp className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setExportModalOpen(true)}
              className={`p-1.5 px-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/80'
              }`}
              title="Export Report"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleCopy}
              className={`p-1.5 px-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/80'
              }`}
              title="Copy Result to Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-[11px] text-emerald-500 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[11px] hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Expression Crumb */}
        <div
          className={`text-sm font-mono h-6 overflow-x-auto whitespace-nowrap scrollbar-none my-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
        >
          {expression || ' '}
        </div>

        {/* Main Display Output */}
        <output
          aria-live="polite"
          className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none py-0.5 tabular-nums ${rawResult === 'Error' ? 'text-rose-400' : isLight ? 'text-slate-900' : 'text-slate-100'}`}
        >
          {displayResult || '0'}
        </output>
      </div>

      {/* Quick History Tape Drawer */}
      {showHistoryTape && (
        <div
          className={`p-3 rounded-2xl border transition-all ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : isOled
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-3 h-3 text-sky-400" />
              Quick Tape (Click to Insert)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {recentHistory.length} items
            </span>
          </div>

          {recentHistory.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No recent calculations yet.</p>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {recentHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setExpression(item.expression);
                    setRawResult(item.result);
                    setDisplayResult(item.result);
                    setIsEvaluated(true);
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs font-mono flex items-center justify-between transition-all group ${
                    isLight
                      ? 'bg-white hover:bg-sky-50 text-slate-800 border border-slate-200'
                      : isOled
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60'
                  }`}
                >
                  <span className="truncate text-slate-400 group-hover:text-slate-200">
                    {item.expression} =
                  </span>
                  <span className="font-bold text-sky-400 ml-2 whitespace-nowrap">
                    {item.result}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scientific Grid (5 Columns) */}
      <div className="grid grid-cols-5 gap-2">
        {/* Row 1 */}
        <button
          onClick={() => setIs2nd(!is2nd)}
          aria-label={is2nd ? "Primary scientific functions" : "Secondary scientific functions"}
          className={`${fnBtnClass} ${is2nd ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold' : ''}`}
        >
          2nd
        </button>
        <button
          onClick={() => handleInput(is2nd ? 'asin(' : 'sin(')}
          aria-label={is2nd ? "Arcsine" : "Sine"}
          className={fnBtnClass}
          style={{ color: 'var(--accent)' }}
        >
          {is2nd ? 'sin⁻¹' : 'sin'}
        </button>
        <button
          onClick={() => handleInput(is2nd ? 'acos(' : 'cos(')}
          aria-label={is2nd ? "Arccosine" : "Cosine"}
          className={fnBtnClass}
          style={{ color: 'var(--accent)' }}
        >
          {is2nd ? 'cos⁻¹' : 'cos'}
        </button>
        <button
          onClick={() => handleInput(is2nd ? 'atan(' : 'tan(')}
          aria-label={is2nd ? "Arctangent" : "Tangent"}
          className={fnBtnClass}
          style={{ color: 'var(--accent)' }}
        >
          {is2nd ? 'tan⁻¹' : 'tan'}
        </button>

        <button
          onClick={handleClear}
          aria-label={expression ? 'Clear current input' : 'Clear all'}
          className={`${btnClass} bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30`}
        >
          {expression ? 'C' : 'AC'}
        </button>

        {/* Row 2 */}
        <button onClick={() => handleInput('^')} aria-label="Exponent" className={fnBtnClass}>
          xʸ
        </button>
        <button
          onClick={() => handleInput(is2nd ? '10^(' : 'log(')}
          aria-label={is2nd ? "10 to power of x" : "Logarithm base 10"}
          className={fnBtnClass}
        >
          {is2nd ? '10ˣ' : 'log'}
        </button>
        <button
          onClick={() => handleInput(is2nd ? 'e^(' : 'ln(')}
          aria-label={is2nd ? "e to power of x" : "Natural logarithm"}
          className={fnBtnClass}
        >
          {is2nd ? 'eˣ' : 'ln'}
        </button>
        <button onClick={() => handleInput('(')} aria-label="Open parenthesis" className={fnBtnClass}>
          (
        </button>
        <button onClick={() => handleInput(')')} aria-label="Close parenthesis" className={fnBtnClass}>
          )
        </button>

        {/* Row 3 */}
        <button onClick={() => handleInput('√(')} aria-label="Square root" className={fnBtnClass}>
          √x
        </button>
        <button onClick={() => handleInput('7')} aria-label="7" className={numBtnClass}>
          7
        </button>
        <button onClick={() => handleInput('8')} aria-label="8" className={numBtnClass}>
          8
        </button>
        <button onClick={() => handleInput('9')} aria-label="9" className={numBtnClass}>
          9
        </button>
        <button
          onClick={() => handleInput('÷')}
          aria-label="Divide"
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          ÷
        </button>

        {/* Row 4 */}
        <button onClick={() => handleInput('!')} aria-label="Factorial" className={fnBtnClass}>
          n!
        </button>
        <button onClick={() => handleInput('4')} aria-label="4" className={numBtnClass}>
          4
        </button>
        <button onClick={() => handleInput('5')} aria-label="5" className={numBtnClass}>
          5
        </button>
        <button onClick={() => handleInput('6')} aria-label="6" className={numBtnClass}>
          6
        </button>
        <button
          onClick={() => handleInput('×')}
          aria-label="Multiply"
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          ×
        </button>

        {/* Row 5 */}
        <button onClick={() => handleInput('π')} aria-label="Pi" className={fnBtnClass}>
          π
        </button>
        <button onClick={() => handleInput('1')} aria-label="1" className={numBtnClass}>
          1
        </button>
        <button onClick={() => handleInput('2')} aria-label="2" className={numBtnClass}>
          2
        </button>
        <button onClick={() => handleInput('3')} aria-label="3" className={numBtnClass}>
          3
        </button>
        <button
          onClick={() => handleInput('−')}
          aria-label="Subtract"
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          −
        </button>

        {/* Row 6 */}
        <button onClick={() => handleInput('e')} aria-label="Euler's number" className={fnBtnClass}>
          e
        </button>
        <button onClick={() => handleInput('0')} aria-label="0" className={numBtnClass}>
          0
        </button>
        <button onClick={() => handleInput('.')} aria-label="Decimal point" className={numBtnClass}>
          .
        </button>
        <button onClick={handleBackspace} aria-label="Backspace" className={fnBtnClass}>
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleInput('+')}
          aria-label="Add"
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          +
        </button>
      </div>

      {/* Equals Button Full Width Bar */}
      <button
        onClick={handleEquals}
        aria-label="Calculate equals"
        style={{ backgroundColor: 'var(--accent)' }}
        className={`${btnClass} h-12 text-white font-bold text-2xl shadow-md hover:brightness-110 active:brightness-95 w-full mt-1`}
      >
        =
      </button>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={exportReportData}
        settings={settings}
      />
    </div>
  );
};
