import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Copy, Check, History, ChevronUp, ChevronDown, Download, RotateCcw } from 'lucide-react';
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

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [rawResult, setRawResult] = useState<string>('0');
  const [displayResult, setDisplayResult] = useState<string>('0');
  const [lastAnswer, setLastAnswer] = useState<string>('0');
  const [is2nd, setIs2nd] = useState<boolean>(false);
  const [isHyp, setIsHyp] = useState<boolean>(false);
  const [angleMode, setAngleMode] = useState<AngleMode>(settings.angleMode || 'DEG');
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [undoStack, setUndoStack] = useState<string[]>([]);
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
    if (settings.angleMode) {
      setAngleMode(settings.angleMode);
    }
  }, [settings.angleMode]);

  const handleAngleModeChange = (mode: AngleMode) => {
    setAngleMode(mode);
    if (onUpdateSettings) {
      onUpdateSettings({ angleMode: mode });
    }
  };

  // Live preview evaluation
  useEffect(() => {
    if (!expression.trim()) {
      setRawResult('0');
      setDisplayResult('0');
      return;
    }
    const ansNum = parseFloat(lastAnswer) || 0;
    const evaluated = evaluateExpression(expression, angleMode, settings.precision, {
      ans: ansNum,
      Ans: ansNum,
    });
    setRawResult(evaluated);
    setDisplayResult(formatNumberWithSettings(evaluated, settings));
  }, [expression, angleMode, settings, lastAnswer]);

  const pushUndo = useCallback((currentExpr: string) => {
    setUndoStack((prev) => [...prev.slice(-49), currentExpr]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setExpression(prev);
    setIsEvaluated(false);
  }, [undoStack]);

  const handleCopy = useCallback(() => {
    const valToCopy = displayResult || rawResult || '0';
    navigator.clipboard.writeText(valToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [displayResult, rawResult]);

  const handleInput = useCallback(
    (val: string) => {
      pushUndo(expression);

      if (isEvaluated) {
        if (['+', '−', '×', '÷', '%', '^'].includes(val)) {
          // Continue expression from previous result
          setExpression(rawResult + val);
        } else if (val === '.') {
          setExpression('0.');
        } else {
          // Fresh start
          setExpression(val);
        }
        setIsEvaluated(false);
      } else {
        // Prevent consecutive multiple dots in active number token
        if (val === '.') {
          const match = expression.match(/(\d+\.?\d*)$/);
          if (match && match[0].includes('.')) {
            return;
          }
          if (!expression || /[\+\−\-\×\*\÷\/\^\(\,]\s*$/.test(expression)) {
            setExpression((prev) => prev + '0.');
            return;
          }
        }

        // Replace consecutive binary operators
        const binaryOps = ['+', '−', '×', '÷', '^'];
        if (
          binaryOps.includes(val) &&
          expression.length > 0 &&
          binaryOps.includes(expression.slice(-1))
        ) {
          setExpression((prev) => prev.slice(0, -1) + val);
          return;
        }

        setExpression((prev) => prev + val);
      }
    },
    [isEvaluated, rawResult, expression, pushUndo]
  );

  const handleToggleSign = useCallback(() => {
    pushUndo(expression);

    if (isEvaluated) {
      if (rawResult && rawResult !== '0' && rawResult !== 'Error' && rawResult !== 'NaN') {
        const toggled = rawResult.startsWith('-') ? rawResult.slice(1) : '-' + rawResult;
        setExpression(toggled);
        setIsEvaluated(false);
      }
      return;
    }

    if (!expression) {
      setExpression('-');
      return;
    }

    // Trailing parenthesized negative number e.g. 12+(-5) -> 12+5
    const parenMatch = expression.match(/\(-(\d+(?:\.\d+)?)\)$/);
    if (parenMatch) {
      setExpression(expression.slice(0, parenMatch.index) + parenMatch[1]);
      return;
    }

    // Trailing (- e.g. 12+(- -> 12+
    if (expression.endsWith('(-')) {
      setExpression(expression.slice(0, -2));
      return;
    }

    // Single number
    if (/^-?\d+(?:\.\d+)?$/.test(expression)) {
      setExpression(expression.startsWith('-') ? expression.slice(1) : '-' + expression);
      return;
    }

    // Number preceded by operator
    const opNumMatch = expression.match(/([\+\−\-\×\*\÷\/\^\(])(\d+(?:\.\d+)?)$/);
    if (opNumMatch && opNumMatch.index !== undefined) {
      const op = opNumMatch[1];
      const num = opNumMatch[2];
      setExpression(expression.slice(0, opNumMatch.index) + op + `(-${num})`);
      return;
    }

    // Trailing operator
    if (/[\+\−\-\×\*\÷\/\^\(]$/.test(expression)) {
      setExpression(expression + '(-');
      return;
    }

    setExpression(`-(${expression})`);
  }, [expression, isEvaluated, rawResult, pushUndo]);

  const handleClear = useCallback(() => {
    if (expression) {
      pushUndo(expression);
      setExpression('');
      setRawResult('0');
      setDisplayResult('0');
      setIsEvaluated(false);
    } else {
      setExpression('');
      setRawResult('0');
      setDisplayResult('0');
      setIsEvaluated(false);
      setIs2nd(false);
      setIsHyp(false);
    }
  }, [expression, pushUndo]);

  const handleBackspace = useCallback(() => {
    if (isEvaluated) {
      setExpression('');
      setRawResult('0');
      setDisplayResult('0');
      setIsEvaluated(false);
      return;
    }

    pushUndo(expression);

    // Multi-char function removal e.g. sinh(, asin(, cbrt(, sqrt(, log(, ln(, etc.
    const fnMatch = expression.match(/(asinh|acosh|atanh|sinh|cosh|tanh|asin|acos|atan|sqrt|cbrt|log10|log|ln|exp|abs|fact|ncr|npr)\($/);
    if (fnMatch) {
      setExpression((prev) => prev.slice(0, -fnMatch[0].length));
      return;
    }

    setExpression((prev) => prev.slice(0, -1));
  }, [isEvaluated, expression, pushUndo]);

  const handleEquals = useCallback(() => {
    if (!expression.trim()) return;
    const ansNum = parseFloat(lastAnswer) || 0;
    const finalVal = evaluateExpression(expression, angleMode, settings.precision, {
      ans: ansNum,
      Ans: ansNum,
    });

    if (finalVal !== 'Error' && finalVal !== 'NaN') {
      const formatted = formatNumberWithSettings(finalVal, settings);
      addHistory(expression, formatted, 'scientific', settings);
      setLastAnswer(finalVal);
      setRawResult(finalVal);
      setDisplayResult(formatted);
      setIsEvaluated(true);
      refreshHistory();
    } else {
      setRawResult('Error');
      setDisplayResult('Error');
      setIsEvaluated(true);
    }
  }, [expression, angleMode, settings, lastAnswer, refreshHistory]);

  const handleMemory = (action: 'MC' | 'MR' | 'M+' | 'M-') => {
    const currentVal = parseFloat(rawResult) || 0;
    switch (action) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        handleInput(String(memory));
        break;
      case 'M+':
        setMemory((prev) => prev + currentVal);
        break;
      case 'M-':
        setMemory((prev) => prev - currentVal);
        break;
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      // Undo shortcut
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Copy shortcut
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
        e.preventDefault();
        handleCopy();
        return;
      }

      if (e.key >= '0' && e.key <= '9') handleInput(e.key);
      else if (e.key === '.') handleInput('.');
      else if (e.key === ',') handleInput(',');
      else if (e.key === '+') handleInput('+');
      else if (e.key === '-') handleInput('−');
      else if (e.key === '*') handleInput('×');
      else if (e.key === '/') handleInput('÷');
      else if (e.key === '%') handleInput('%');
      else if (e.key === '(' || e.key === ')') handleInput(e.key);
      else if (e.key === '^') handleInput('^');
      else if (e.key === '!') handleInput('!');
      else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, handleEquals, handleBackspace, handleUndo, handleClear, handleCopy]);

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
    ? `${btnClass} bg-slate-100/80 hover:bg-slate-200 text-slate-700 border border-slate-300/80 font-mono text-xs sm:text-sm`
    : isOled
      ? `${btnClass} bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-xs sm:text-sm`
      : `${btnClass} bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-mono text-xs sm:text-sm`;

  const memBtnClass = `px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all select-none ${
    isLight
      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
      : isOled
        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
  }`;

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

  // Determine Trig Labels based on 2nd and Hyp states
  const getSinLabel = () => {
    if (isHyp && is2nd) return 'sinh⁻¹';
    if (isHyp) return 'sinh';
    if (is2nd) return 'sin⁻¹';
    return 'sin';
  };
  const getSinInput = () => {
    if (isHyp && is2nd) return 'asinh(';
    if (isHyp) return 'sinh(';
    if (is2nd) return 'asin(';
    return 'sin(';
  };

  const getCosLabel = () => {
    if (isHyp && is2nd) return 'cosh⁻¹';
    if (isHyp) return 'cosh';
    if (is2nd) return 'cos⁻¹';
    return 'cos';
  };
  const getCosInput = () => {
    if (isHyp && is2nd) return 'acosh(';
    if (isHyp) return 'cosh(';
    if (is2nd) return 'acos(';
    return 'cos(';
  };

  const getTanLabel = () => {
    if (isHyp && is2nd) return 'tanh⁻¹';
    if (isHyp) return 'tanh';
    if (is2nd) return 'tan⁻¹';
    return 'tan';
  };
  const getTanInput = () => {
    if (isHyp && is2nd) return 'atanh(';
    if (isHyp) return 'tanh(';
    if (is2nd) return 'atan(';
    return 'tan(';
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
            {/* 3-Way Segmented Angle Mode Selector */}
            <div className="flex items-center rounded-xl p-0.5 border border-sky-500/30 bg-sky-500/10">
              {(['DEG', 'RAD', 'GRAD'] as AngleMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleAngleModeChange(mode)}
                  aria-pressed={angleMode === mode}
                  aria-label={`Switch to ${mode} mode`}
                  className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide transition-all ${
                    angleMode === mode
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-sky-400/80 hover:text-sky-300'
                  }`}
                  title={`Switch to ${mode} mode`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Quick History Tape Button */}
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

            {/* Memory Active Badge */}
            {memory !== 0 && (
              <span
                className="px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1"
                title={`Memory Register: ${memory}`}
              >
                M = {memory}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Undo Button */}
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`p-1.5 px-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/80'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Export Button */}
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

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`p-1.5 px-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/80'
              }`}
              title="Copy Result (Ctrl+C)"
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
          className={`text-sm font-mono h-6 overflow-x-auto whitespace-nowrap scrollbar-none my-1 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {isEvaluated ? `${expression} =` : expression || ' '}
        </div>

        {/* Main Display Output */}
        <output
          id="scientific-calc-output"
          aria-live="polite"
          className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none py-0.5 tabular-nums ${
            rawResult === 'Error'
              ? 'text-rose-400'
              : isLight
                ? 'text-slate-900'
                : 'text-slate-100'
          }`}
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

      {/* Memory Register Action Bar */}
      <div className="flex items-center justify-between gap-1.5 px-0.5">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => handleMemory('MC')}
            disabled={memory === 0}
            aria-label="Memory Clear"
            className={`${memBtnClass} disabled:opacity-40`}
            title="Memory Clear"
          >
            MC
          </button>
          <button
            onClick={() => handleMemory('MR')}
            disabled={memory === 0}
            aria-label="Memory Recall"
            className={`${memBtnClass} disabled:opacity-40`}
            title="Memory Recall"
          >
            MR
          </button>
          <button
            onClick={() => handleMemory('M+')}
            aria-label="Memory Add"
            className={memBtnClass}
            title="Memory Add"
          >
            M+
          </button>
          <button
            onClick={() => handleMemory('M-')}
            aria-label="Memory Subtract"
            className={memBtnClass}
            title="Memory Subtract"
          >
            M-
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => handleInput(lastAnswer || '0')}
            className={memBtnClass}
            title="Insert Last Answer (Ans)"
          >
            Ans ({lastAnswer})
          </button>
        </div>
      </div>

      {/* Scientific Keypad Grid (5 Columns x 7 Rows) */}
      <div className="grid grid-cols-5 gap-2">
        {/* Row 1: Mode Switches & Primary Trig Functions */}
        <button
          onClick={() => setIs2nd(!is2nd)}
          aria-pressed={is2nd}
          aria-label={is2nd ? 'Primary functions' : 'Secondary functions'}
          className={`${fnBtnClass} ${
            is2nd
              ? 'bg-amber-500/25 text-amber-400 border-amber-500/50 font-bold shadow-xs'
              : ''
          }`}
        >
          2nd
        </button>
        <button
          onClick={() => setIsHyp(!isHyp)}
          aria-pressed={isHyp}
          aria-label={isHyp ? 'Standard trigonometry' : 'Hyperbolic trigonometry'}
          className={`${fnBtnClass} ${
            isHyp
              ? 'bg-cyan-500/25 text-cyan-400 border-cyan-500/50 font-bold shadow-xs'
              : ''
          }`}
        >
          hyp
        </button>
        <button
          onClick={() => handleInput(getSinInput())}
          aria-label={getSinLabel()}
          className={fnBtnClass}
          style={{ color: 'var(--accent)' }}
        >
          {getSinLabel()}
        </button>
        <button
          onClick={() => handleInput(getCosInput())}
          aria-label={getCosLabel()}
          className={fnBtnClass}
          style={{ color: 'var(--accent)' }}
        >
          {getCosLabel()}
        </button>
        <button
          onClick={() => handleInput(getTanInput())}
          aria-label={getTanLabel()}
          className={fnBtnClass}
          style={{ color: 'var(--accent)' }}
        >
          {getTanLabel()}
        </button>

        {/* Row 2: Logs, Exponents, Roots & Clear */}
        <button
          onClick={() => handleInput(is2nd ? 'e^(' : 'ln(')}
          aria-label={is2nd ? 'e to the power of x' : 'Natural logarithm'}
          className={fnBtnClass}
        >
          {is2nd ? 'eˣ' : 'ln'}
        </button>
        <button
          onClick={() => handleInput(is2nd ? '10^(' : 'log(')}
          aria-label={is2nd ? '10 to the power of x' : 'Base 10 logarithm'}
          className={fnBtnClass}
        >
          {is2nd ? '10ˣ' : 'log'}
        </button>
        <button
          onClick={() => handleInput(is2nd ? '^2' : '^')}
          aria-label={is2nd ? 'x squared' : 'x to the power of y'}
          className={fnBtnClass}
        >
          {is2nd ? 'x²' : 'xʸ'}
        </button>
        <button
          onClick={() => handleInput(is2nd ? 'cbrt(' : 'sqrt(')}
          aria-label={is2nd ? 'Cube root' : 'Square root'}
          className={fnBtnClass}
        >
          {is2nd ? '∛x' : '√x'}
        </button>
        <button
          onClick={handleClear}
          aria-label={expression ? 'Clear input' : 'Clear all'}
          className={`${btnClass} bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30 font-bold`}
        >
          {expression ? 'C' : 'AC'}
        </button>

        {/* Row 3: Parentheses, Combinatorics, Reciprocal/Abs & Divide */}
        <button
          onClick={() => handleInput('(')}
          aria-label="Open parenthesis"
          className={fnBtnClass}
        >
          (
        </button>
        <button
          onClick={() => handleInput(')')}
          aria-label="Close parenthesis"
          className={fnBtnClass}
        >
          )
        </button>
        <button
          onClick={() => handleInput(is2nd ? 'ncr(' : '!')}
          aria-label={is2nd ? 'Combinations nCr' : 'Factorial'}
          className={fnBtnClass}
        >
          {is2nd ? 'nCr' : 'n!'}
        </button>
        <button
          onClick={() => handleInput(is2nd ? 'abs(' : '^(-1)')}
          aria-label={is2nd ? 'Absolute value' : 'Reciprocal 1/x'}
          className={fnBtnClass}
        >
          {is2nd ? '|x|' : '1/x'}
        </button>
        <button
          onClick={() => handleInput('÷')}
          aria-label="Divide"
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          ÷
        </button>

        {/* Row 4: Constants, 7, 8, 9, Multiply */}
        <button
          onClick={() => handleInput(is2nd ? 'tau' : 'π')}
          aria-label={is2nd ? 'Tau' : 'Pi'}
          className={fnBtnClass}
        >
          {is2nd ? 'τ' : 'π'}
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
          onClick={() => handleInput('×')}
          aria-label="Multiply"
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          ×
        </button>

        {/* Row 5: Euler/2^x, 4, 5, 6, Subtract */}
        <button
          onClick={() => handleInput(is2nd ? '2^(' : 'e')}
          aria-label={is2nd ? '2 to the power of x' : "Euler's constant e"}
          className={fnBtnClass}
        >
          {is2nd ? '2ˣ' : 'e'}
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
          onClick={() => handleInput('−')}
          aria-label="Subtract"
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          −
        </button>

        {/* Row 6: Modulo/nPr, 1, 2, 3, Add */}
        <button
          onClick={() => handleInput(is2nd ? 'npr(' : ' mod ')}
          aria-label={is2nd ? 'Permutations nPr' : 'Modulo'}
          className={fnBtnClass}
        >
          {is2nd ? 'nPr' : 'mod'}
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
          onClick={() => handleInput('+')}
          aria-label="Add"
          className={opBtnClass}
          style={!isLight ? { color: 'var(--accent)' } : undefined}
        >
          +
        </button>

        {/* Row 7: Sign Toggle, 0, Decimal, Backspace, Equals */}
        <button
          onClick={handleToggleSign}
          aria-label="Toggle sign"
          className={fnBtnClass}
        >
          ±
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
          onClick={handleEquals}
          aria-label="Calculate equals"
          style={{ backgroundColor: 'var(--accent)' }}
          className={`${btnClass} text-white font-bold text-xl shadow-md hover:brightness-110 active:brightness-95`}
        >
          =
        </button>
      </div>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={exportReportData}
        settings={settings}
      />
    </div>
  );
};
