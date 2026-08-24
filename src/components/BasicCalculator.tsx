import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Copy, Check, History, ChevronUp, ChevronDown, Keyboard } from 'lucide-react';
import { evaluateExpression } from '../utils/calculator';
import { addHistory, getHistory } from '../utils/history';
import { formatNumberWithSettings } from '../utils/formatting';
import { AppSettings, HistoryItem } from '../types';

interface BasicCalculatorProps {
  settings: AppSettings;
}

export const BasicCalculator: React.FC<BasicCalculatorProps> = ({ settings }) => {
  const [expression, setExpression] = useState<string>('');
  const [rawResult, setRawResult] = useState<string>('0');
  const [displayResult, setDisplayResult] = useState<string>('0');
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

  // Live preview evaluation
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
    navigator.clipboard.writeText(valToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      // Fallback or ignore clipboard error silently
    });
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
      addHistory(expression, formatted, 'basic', settings);
      setRawResult(finalVal);
      setDisplayResult(formatted);
      setIsEvaluated(true);
      refreshHistory();
    } else {
      setRawResult('Error');
      setDisplayResult('Error');
      setIsEvaluated(true);
    }
  }, [expression, settings, refreshHistory]);

  const handlePlusMinus = () => {
    if (!expression) return;
    if (expression.startsWith('-')) {
      setExpression(expression.substring(1));
    } else {
      setExpression('-' + expression);
    }
  };

  // Memory Functions
  const handleMemory = (action: 'MC' | 'MR' | 'M+' | 'M-') => {
    const currentVal = parseFloat(rawResult) || 0;
    if (action === 'MC') setMemory(0);
    else if (action === 'MR') handleInput(String(memory));
    else if (action === 'M+') setMemory((prev) => prev + currentVal);
    else if (action === 'M-') setMemory((prev) => prev - currentVal);
  };

  const handleRecallHistory = (item: HistoryItem) => {
    setExpression(item.expression);
    setRawResult(item.result);
    setDisplayResult(item.result);
    setIsEvaluated(true);
  };

  // Keyboard handler
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
    'h-13 sm:h-14 font-semibold text-lg rounded-2xl transition-all duration-150 active:scale-95 active:translate-y-0.5 flex items-center justify-center select-none shadow-xs';

  const numBtnClass = isLight
    ? `${btnClass} bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 border border-slate-200 shadow-xs hover:border-slate-300`
    : isOled
      ? `${btnClass} bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700`
      : `${btnClass} bg-slate-800/90 hover:bg-slate-700/90 active:bg-slate-700 text-slate-100 border border-slate-700/60 hover:border-slate-600`;

  const opBtnClass = isLight
    ? `${btnClass} bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 font-bold text-xl`
    : isOled
      ? `${btnClass} bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-sky-400 border border-zinc-800 font-bold text-xl`
      : `${btnClass} bg-sky-600/20 hover:bg-sky-600/30 active:bg-sky-600/40 text-sky-400 border border-sky-500/30 font-bold text-xl`;

  const fnBtnClass = isLight
    ? `${btnClass} bg-slate-100/80 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 border border-slate-300/80`
    : isOled
      ? `${btnClass} bg-zinc-900/80 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 border border-zinc-800`
      : `${btnClass} bg-slate-800/80 hover:bg-slate-700 active:bg-slate-700 text-slate-200 border border-slate-700/60`;

  const memBtnClass = isLight
    ? 'h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-xs active:scale-95'
    : isOled
      ? 'h-9 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-800 active:scale-95'
      : 'h-9 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700/60 active:scale-95';

  const screenBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : isOled
      ? 'bg-black border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl';

  const fontSizeClass =
    settings.fontSize === 'large'
      ? 'text-4xl sm:text-5xl'
      : settings.fontSize === 'compact'
        ? 'text-2xl sm:text-3xl'
        : 'text-3xl sm:text-4xl';

  return (
    <div className="max-w-md mx-auto w-full p-2 sm:p-4 flex flex-col gap-3.5">
      {/* Display Screen */}
      <div
        className={`${screenBg} border rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[145px] text-right overflow-hidden relative group transition-colors shadow-lg`}
      >
        {/* Top Badges and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {memory !== 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs"
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
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
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
              {showHistoryTape ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
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
          className={`${fontSizeClass} font-bold font-mono tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none py-0.5 tabular-nums ${isLight ? 'text-slate-900' : 'text-slate-100'}`}
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
            <span className="text-[10px] text-slate-500 font-mono">{recentHistory.length} items</span>
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

      {/* Memory Bar */}
      <div className="grid grid-cols-4 gap-2">
        {['MC', 'MR', 'M+', 'M-'].map((m) => (
          <button key={m} onClick={() => handleMemory(m as any)} className={memBtnClass}>
            {m}
          </button>
        ))}
      </div>

      {/* Main Keyboard */}
      <div className="grid grid-cols-4 gap-2.5">
        <button
          onClick={handleClear}
          className={`${btnClass} bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-500 border border-rose-500/30`}
        >
          {expression ? 'C' : 'AC'}
        </button>
        <button onClick={() => handleInput('(')} className={fnBtnClass}>
          (
        </button>
        <button onClick={() => handleInput(')')} className={fnBtnClass}>
          )
        </button>
        <button onClick={handleBackspace} className={fnBtnClass}>
          <Delete className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleInput('√(')}
          className={fnBtnClass}
          style={{ color: 'var(--accent)' }}
        >
          √
        </button>
        <button
          onClick={() => handleInput('%')}
          className={fnBtnClass}
          style={{ color: 'var(--accent)' }}
        >
          %
        </button>
        <button
          onClick={() => handleInput('^')}
          className={fnBtnClass}
          style={{ color: 'var(--accent)' }}
        >
          xʸ
        </button>
        <button
          onClick={() => handleInput('÷')}
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          ÷
        </button>

        <button onClick={() => handleInput('7')} className={numBtnClass}>
          7
        </button>
        <button onClick={() => handleInput('8')} className={numBtnClass}>
          8
        </button>
        <button onClick={() => handleInput('9')} className={numBtnClass}>
          9
        </button>
        <button
          onClick={() => handleInput('×')}
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          ×
        </button>

        <button onClick={() => handleInput('4')} className={numBtnClass}>
          4
        </button>
        <button onClick={() => handleInput('5')} className={numBtnClass}>
          5
        </button>
        <button onClick={() => handleInput('6')} className={numBtnClass}>
          6
        </button>
        <button
          onClick={() => handleInput('−')}
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          −
        </button>

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
          onClick={() => handleInput('+')}
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          +
        </button>

        <button onClick={handlePlusMinus} className={numBtnClass}>
          ±
        </button>
        <button onClick={() => handleInput('0')} className={numBtnClass}>
          0
        </button>
        <button onClick={() => handleInput('.')} className={numBtnClass}>
          .
        </button>
        <button
          onClick={handleEquals}
          style={{ backgroundColor: 'var(--accent)' }}
          className={`${btnClass} text-white font-bold text-2xl shadow-md hover:brightness-110 active:brightness-95`}
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
          <span>{showKeyboardHints ? 'Hide Shortcuts' : 'Keyboard Hints'}</span>
        </button>
        <span className="font-mono text-[10px]">Enter = Calculate • Esc = Clear</span>
      </div>

      {showKeyboardHints && (
        <div
          className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
            isLight
              ? 'bg-slate-100/90 border-slate-200 text-slate-700'
              : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}
        >
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div><kbd className="font-bold text-sky-400">0-9</kbd> : Numbers</div>
            <div><kbd className="font-bold text-sky-400">+ - * /</kbd> : Operators</div>
            <div><kbd className="font-bold text-sky-400">Enter / =</kbd> : Solve</div>
            <div><kbd className="font-bold text-sky-400">Backspace</kbd> : Delete</div>
            <div><kbd className="font-bold text-sky-400">Esc</kbd> : Clear</div>
            <div><kbd className="font-bold text-sky-400">%</kbd> : Modulo / Percent</div>
          </div>
        </div>
      )}
    </div>
  );
};
