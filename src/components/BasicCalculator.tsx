import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Copy, Check } from 'lucide-react';
import { evaluateExpression } from '../utils/calculator';
import { addHistory } from '../utils/history';
import { formatNumberWithSettings } from '../utils/formatting';
import { AppSettings } from '../types';

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
    navigator.clipboard.writeText(valToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleInput = useCallback(
    (val: string) => {
      if (isEvaluated) {
        if (['+', '−', '×', '÷', '%'].includes(val)) {
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
    }
  }, [expression, settings]);

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
    'h-14 font-semibold text-lg rounded-2xl transition-all duration-150 active:scale-95 active:translate-y-0.5 flex items-center justify-center shadow-xs select-none';

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
    <div className="max-w-md mx-auto w-full p-2 sm:p-4 flex flex-col gap-4">
      {/* Display Screen */}
      <div
        className={`${screenBg} border rounded-3xl p-5 flex flex-col justify-end min-h-[140px] text-right overflow-hidden relative group transition-colors shadow-lg`}
      >
        {/* Top Badges and Copy Action */}
        <div className="flex items-center justify-between absolute top-3.5 left-4 right-4">
          <div className="flex items-center gap-2">
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
          </div>

          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all opacity-80 group-hover:opacity-100 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/80'
            }`}
            title="Copy Result to Clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] text-emerald-500 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Expression Crumb */}
        <div
          className={`text-sm font-mono h-6 overflow-x-auto whitespace-nowrap scrollbar-none mt-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
        >
          {expression || ' '}
        </div>

        {/* Main Display Output */}
        <div
          className={`${fontSizeClass} font-bold font-mono tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none py-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}
        >
          {displayResult || '0'}
        </div>
      </div>

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
          C
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
    </div>
  );
};
