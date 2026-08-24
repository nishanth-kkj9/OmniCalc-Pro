import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Copy, Check, History, ChevronUp, ChevronDown, Keyboard } from 'lucide-react';
import { evaluateExpression } from '../utils/calculator';
import { addHistory, getHistory } from '../utils/history';
import { formatNumberWithSettings } from '../utils/formatting';
import { AppSettings, AngleMode, HistoryItem } from '../types';

interface ScientificCalculatorProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [rawResult, setRawResult] = useState<string>('0');
  const [displayResult, setDisplayResult] = useState<string>('0');
  const [isSecond, setIsSecond] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showHistoryTape, setShowHistoryTape] = useState<boolean>(false);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [showKeyboardHints, setShowKeyboardHints] = useState<boolean>(false);

  const refreshHistory = useCallback(() => {
    const list = getHistory().filter((h) => h.mode === 'basic' || h.mode === 'scientific');
    setRecentHistory(list.slice(0, 8));
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    if (!expression.trim()) {
      setRawResult('0');
      setDisplayResult('0');
      return;
    }
    const evaluated = evaluateExpression(expression, settings.angleMode, settings.precision);
    setRawResult(evaluated);
    setDisplayResult(formatNumberWithSettings(evaluated, settings));
  }, [expression, settings]);

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
    const finalVal = evaluateExpression(expression, settings.angleMode, settings.precision);
    if (finalVal !== 'Error') {
      const formatted = formatNumberWithSettings(finalVal, settings);
      addHistory(expression, formatted, 'scientific', settings);
      setRawResult(finalVal);
      setDisplayResult(formatted);
      setIsEvaluated(true);
      refreshHistory();
    }
  }, [expression, settings, refreshHistory]);

  const handleRecallHistory = (item: HistoryItem) => {
    setExpression(item.expression);
    setRawResult(item.result);
    setDisplayResult(item.result);
    setIsEvaluated(true);
  };

  const openParens = (expression.match(/\(/g) || []).length;
  const closeParens = (expression.match(/\)/g) || []).length;
  const unclosedParens = Math.max(0, openParens - closeParens);

  // Physical Keyboard Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if focus is in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleInput(key);
      } else if (key === '.') {
        e.preventDefault();
        handleInput('.');
      } else if (key === '+' || key === '-') {
        e.preventDefault();
        handleInput(key === '-' ? '−' : '+');
      } else if (key === '*') {
        e.preventDefault();
        handleInput('×');
      } else if (key === '/') {
        e.preventDefault();
        handleInput('÷');
      } else if (key === '^') {
        e.preventDefault();
        handleInput('^');
      } else if (key === '(' || key === ')') {
        e.preventDefault();
        handleInput(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape' || key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, handleEquals, handleBackspace]);

  const toggleAngleMode = () => {
    const next: AngleMode =
      settings.angleMode === 'DEG' ? 'RAD' : settings.angleMode === 'RAD' ? 'GRAD' : 'DEG';
    onUpdateSettings({ angleMode: next });
  };

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const btnClass =
    'h-11 sm:h-12 font-semibold text-sm sm:text-base rounded-xl transition-all duration-150 active:scale-95 active:translate-y-0.5 flex items-center justify-center shadow-xs select-none';

  const numBtnClass = isLight
    ? `${btnClass} bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 border border-slate-200 shadow-xs hover:border-slate-300`
    : isOled
      ? `${btnClass} bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700`
      : `${btnClass} bg-slate-800/90 hover:bg-slate-700/90 active:bg-slate-700 text-slate-100 border border-slate-700/50 hover:border-slate-600`;

  const opBtnClass = isLight
    ? `${btnClass} bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 font-bold text-lg sm:text-xl`
    : isOled
      ? `${btnClass} bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-sky-400 border border-zinc-800 font-bold text-lg sm:text-xl`
      : `${btnClass} bg-sky-600/20 hover:bg-sky-600/30 active:bg-sky-600/40 text-sky-400 border border-sky-500/30 font-bold text-lg sm:text-xl`;

  const fnBtnClass = isLight
    ? `${btnClass} bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-300`
    : isOled
      ? `${btnClass} bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 border border-zinc-800`
      : `${btnClass} bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700/60`;

  const sciFnBtnClass = isLight
    ? `${btnClass} bg-slate-100/90 hover:bg-slate-200 active:bg-slate-300 text-sky-600 border border-slate-300 font-medium`
    : isOled
      ? `${btnClass} bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-sky-400 border border-zinc-800 font-medium`
      : `${btnClass} bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-sky-300 border border-slate-700/60 font-medium`;

  const constBtnClass = isLight
    ? `${btnClass} bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-700 border border-amber-200 font-medium`
    : isOled
      ? `${btnClass} bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-amber-400 border border-zinc-800 font-medium`
      : `${btnClass} bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-amber-300 border border-slate-700/60 font-medium`;

  const screenBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : isOled
      ? 'bg-black border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl';

  const controlBarBg = isLight
    ? 'bg-slate-100/90 border-slate-200'
    : isOled
      ? 'bg-zinc-950 border-zinc-800'
      : 'bg-slate-900/60 border-slate-800';

  const memBtnClass = isLight
    ? 'px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors active:scale-95'
    : isOled
      ? 'px-2.5 py-1 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 active:bg-zinc-700 rounded-lg transition-colors active:scale-95'
      : 'px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-lg transition-colors active:scale-95';

  const fontSizeClass =
    settings.fontSize === 'large'
      ? 'text-4xl sm:text-5xl'
      : settings.fontSize === 'compact'
        ? 'text-2xl sm:text-3xl'
        : 'text-3xl sm:text-4xl';

  return (
    <div className="max-w-2xl mx-auto w-full p-2 sm:p-4 flex flex-col gap-3.5">
      {/* Display Screen */}
      <div
        className={`${screenBg} border rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[145px] text-right overflow-hidden relative transition-colors shadow-lg group`}
      >
        {/* Top Badges and Copy Action */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={toggleAngleMode}
              className="px-2.5 py-0.5 rounded-full border shadow-xs text-xs font-bold hover:opacity-80 transition-opacity flex-shrink-0"
              style={{
                backgroundColor: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.2)',
                color: 'var(--accent)',
                borderColor: 'var(--accent)',
              }}
              title="Click to switch angle mode"
            >
              {settings.angleMode}
            </button>

            {unclosedParens > 0 && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                ( {unclosedParens} open
              </span>
            )}

            {memory !== 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs flex-shrink-0"
                style={{
                  backgroundColor: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.25)',
                  color: 'var(--accent)',
                  borderColor: 'var(--accent)',
                }}
              >
                M = {memory}
              </span>
            )}

            <button
              onClick={() => setShowHistoryTape(!showHistoryTape)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                showHistoryTape
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                  : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700/80'
              }`}
              title="Toggle Quick History Tape"
            >
              <History className="w-3 h-3 flex-shrink-0" />
              <span className="hidden sm:inline">Tape</span>
              {showHistoryTape ? (
                <ChevronUp className="w-3 h-3 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleCopy}
              className={`p-1.5 px-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all opacity-85 group-hover:opacity-100 ${
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
        <div
          className={`${fontSizeClass} font-bold font-mono tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none py-1 tabular-nums ${isLight ? 'text-slate-900' : 'text-slate-100'}`}
        >
          {displayResult || '0'}
        </div>
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
            <span className="text-[10px] text-slate-500 font-mono">
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
                  onClick={() => handleRecallHistory(item)}
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

      {/* Control Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl border ${controlBarBg}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSecond(!isSecond)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all active:scale-95 flex-shrink-0 ${
              isSecond
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            2nd {isSecond && '●'}
          </button>
          <button
            onClick={toggleAngleMode}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all active:scale-95 flex-shrink-0 ${
              isLight
                ? 'bg-white text-sky-600 border-slate-300 hover:bg-slate-50'
                : isOled
                  ? 'bg-zinc-900 text-sky-400 border-zinc-700 hover:bg-zinc-800'
                  : 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {settings.angleMode}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['MC', 'MR', 'M+', 'M-'].map((m) => (
            <button
              key={m}
              onClick={() => {
                const currentVal = parseFloat(rawResult) || 0;
                if (m === 'MC') setMemory(0);
                else if (m === 'MR') handleInput(String(memory));
                else if (m === 'M+') setMemory((p) => p + currentVal);
                else if (m === 'M-') setMemory((p) => p - currentVal);
              }}
              className={`${memBtnClass} flex-shrink-0`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Scientific Keypad Grid */}
      <div className="grid grid-cols-5 gap-2">
        {/* Row 1 */}
        <button onClick={() => handleInput(isSecond ? 'asin(' : 'sin(')} className={sciFnBtnClass}>
          {isSecond ? 'sin⁻¹' : 'sin'}
        </button>
        <button onClick={() => handleInput(isSecond ? 'acos(' : 'cos(')} className={sciFnBtnClass}>
          {isSecond ? 'cos⁻¹' : 'cos'}
        </button>
        <button onClick={() => handleInput(isSecond ? 'atan(' : 'tan(')} className={sciFnBtnClass}>
          {isSecond ? 'tan⁻¹' : 'tan'}
        </button>
        <button onClick={() => handleInput('π')} className={constBtnClass}>
          π
        </button>
        <button onClick={() => handleInput('e')} className={constBtnClass}>
          e
        </button>

        {/* Row 2 */}
        <button onClick={() => handleInput('^2')} className={sciFnBtnClass}>
          x²
        </button>
        <button onClick={() => handleInput('^3')} className={sciFnBtnClass}>
          x³
        </button>
        <button onClick={() => handleInput('^')} className={sciFnBtnClass}>
          xʸ
        </button>
        <button onClick={() => handleInput(isSecond ? '10^' : 'e^')} className={sciFnBtnClass}>
          {isSecond ? '10ˣ' : 'eˣ'}
        </button>
        <button onClick={() => handleInput('!')} className={sciFnBtnClass}>
          n!
        </button>

        {/* Row 3 */}
        <button onClick={() => handleInput('√(')} className={sciFnBtnClass}>
          √x
        </button>
        <button onClick={() => handleInput(isSecond ? 'log2(' : 'log(')} className={sciFnBtnClass}>
          {isSecond ? 'log₂' : 'log'}
        </button>
        <button onClick={() => handleInput('ln(')} className={sciFnBtnClass}>
          ln
        </button>
        <button onClick={() => handleInput('(')} className={fnBtnClass}>
          (
        </button>
        <button onClick={() => handleInput(')')} className={fnBtnClass}>
          )
        </button>

        {/* Row 4 */}
        <button
          onClick={handleClear}
          className={`${btnClass} bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-500 border border-rose-500/30 font-bold`}
        >
          {expression ? 'C' : 'AC'}
        </button>
        <button onClick={handleBackspace} className={fnBtnClass}>
          <Delete className="w-5 h-5" />
        </button>
        <button onClick={() => handleInput('%')} className={sciFnBtnClass}>
          %
        </button>
        <button onClick={() => handleInput('abs(')} className={sciFnBtnClass}>
          |x|
        </button>
        <button
          onClick={() => handleInput('÷')}
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          ÷
        </button>

        {/* Row 5 */}
        <button onClick={() => handleInput('7')} className={numBtnClass}>
          7
        </button>
        <button onClick={() => handleInput('8')} className={numBtnClass}>
          8
        </button>
        <button onClick={() => handleInput('9')} className={numBtnClass}>
          9
        </button>
        <button onClick={() => handleInput('1/(')} className={sciFnBtnClass}>
          1/x
        </button>
        <button
          onClick={() => handleInput('×')}
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          ×
        </button>

        {/* Row 6 */}
        <button onClick={() => handleInput('4')} className={numBtnClass}>
          4
        </button>
        <button onClick={() => handleInput('5')} className={numBtnClass}>
          5
        </button>
        <button onClick={() => handleInput('6')} className={numBtnClass}>
          6
        </button>
        <button onClick={() => handleInput('mod')} className={sciFnBtnClass}>
          mod
        </button>
        <button
          onClick={() => handleInput('−')}
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          −
        </button>

        {/* Row 7 */}
        <button onClick={() => handleInput('1')} className={numBtnClass}>
          1
        </button>
        <button onClick={() => handleInput('2')} className={numBtnClass}>
          2
        </button>
        <button onClick={() => handleInput('3')} className={numBtnClass}>
          3
        </button>
        <button
          onClick={() => {
            if (expression.startsWith('-')) {
              setExpression(expression.substring(1));
            } else if (expression) {
              setExpression('-(' + expression + ')');
            } else {
              setExpression('-');
            }
          }}
          className={numBtnClass}
        >
          ±
        </button>
        <button
          onClick={() => handleInput('+')}
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          +
        </button>

        {/* Row 8 */}
        <button onClick={() => handleInput('0')} className={`${numBtnClass} col-span-2`}>
          0
        </button>
        <button onClick={() => handleInput('.')} className={numBtnClass}>
          .
        </button>
        <button
          onClick={handleEquals}
          style={{ backgroundColor: 'var(--accent)' }}
          className={`${btnClass} col-span-2 text-white font-bold text-xl shadow-md hover:brightness-110 active:brightness-95`}
        >
          =
        </button>
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
        <button
          onClick={() => setShowKeyboardHints(!showKeyboardHints)}
          className="flex items-center gap-1.5 hover:text-slate-400 transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>{showKeyboardHints ? 'Hide Shortcuts' : 'Scientific Shortcuts'}</span>
        </button>
        <span className="font-mono text-[10px]">sin, cos, tan, log, ln, ^ supported</span>
      </div>

      {showKeyboardHints && (
        <div
          className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
            isLight
              ? 'bg-slate-100/90 border-slate-200 text-slate-700'
              : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[10px]">
            <div>
              <kbd className="font-bold text-sky-400">0-9</kbd> : Numbers
            </div>
            <div>
              <kbd className="font-bold text-sky-400">+ - * /</kbd> : Operators
            </div>
            <div>
              <kbd className="font-bold text-sky-400">^</kbd> : Power / Exponent
            </div>
            <div>
              <kbd className="font-bold text-sky-400">( )</kbd> : Parentheses
            </div>
            <div>
              <kbd className="font-bold text-sky-400">Enter / =</kbd> : Solve
            </div>
            <div>
              <kbd className="font-bold text-sky-400">Backspace</kbd> : Delete
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
