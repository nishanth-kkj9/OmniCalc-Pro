import React, { useState, useEffect } from 'react';
import { Delete, Copy, Check, Download } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import { AppSettings } from '../types';

type Base = 'HEX' | 'DEC' | 'OCT' | 'BIN';
type BitWordSize = 64 | 32 | 16 | 8;

interface ProgrammerCalculatorProps {
  settings: AppSettings;
}

export const ProgrammerCalculator: React.FC<ProgrammerCalculatorProps> = ({ settings }) => {
  const [currentBase, setCurrentBase] = useState<Base>('DEC');
  const [wordSize, setWordSize] = useState<BitWordSize>(64);
  const [valBig, setValBig] = useState<bigint>(BigInt(0));
  const [inputStr, setInputStr] = useState<string>('0');
  const [copied, setCopied] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // Sync bigint from input string when base changes or key typed
  const updateValueFromInput = (str: string, base: Base) => {
    try {
      let parsed = BigInt(0);
      if (!str || str === '0') {
        parsed = BigInt(0);
      } else if (base === 'HEX') {
        parsed = BigInt('0x' + str);
      } else if (base === 'DEC') {
        parsed = BigInt(str);
      } else if (base === 'OCT') {
        parsed = BigInt('0o' + str);
      } else if (base === 'BIN') {
        parsed = BigInt('0b' + str);
      }

      // Mask to word size
      const mask = (BigInt(1) << BigInt(wordSize)) - BigInt(1);
      parsed = parsed & mask;

      setValBig(parsed);
      setInputStr(str);
    } catch {
      // Invalid parse ignored
    }
  };

  const handleBaseChange = (newBase: Base) => {
    setCurrentBase(newBase);
    // Format inputStr into new base
    if (newBase === 'HEX') setInputStr(valBig.toString(16).toUpperCase());
    else if (newBase === 'DEC') setInputStr(valBig.toString(10));
    else if (newBase === 'OCT') setInputStr(valBig.toString(8));
    else if (newBase === 'BIN') setInputStr(valBig.toString(2));
  };

  const handleHexDigit = (digit: string) => {
    const nextStr = inputStr === '0' ? digit : inputStr + digit;
    updateValueFromInput(nextStr, currentBase);
  };

  const handleBackspace = () => {
    if (inputStr.length <= 1) {
      updateValueFromInput('0', currentBase);
    } else {
      updateValueFromInput(inputStr.slice(0, -1), currentBase);
    }
  };

  const handleClear = () => {
    setValBig(BigInt(0));
    setInputStr('0');
  };

  const handleToggleBit = (bitIndex: number) => {
    const mask = BigInt(1) << BigInt(bitIndex);
    const nextVal = valBig ^ mask;
    setValBig(nextVal);
    // Update string representation
    if (currentBase === 'HEX') setInputStr(nextVal.toString(16).toUpperCase());
    else if (currentBase === 'DEC') setInputStr(nextVal.toString(10));
    else if (currentBase === 'OCT') setInputStr(nextVal.toString(8));
    else if (currentBase === 'BIN') setInputStr(nextVal.toString(2));
  };

  // Representations
  const hexStr = valBig.toString(16).toUpperCase();
  const decStr = valBig.toString(10);
  const octStr = valBig.toString(8);
  const binRaw = valBig.toString(2).padStart(wordSize, '0');

  // Format binary into 4-bit nibble chunks
  const formattedBin =
    binRaw
      .match(/.{1,4}/g)
      ?.join(' ') || binRaw;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const k = e.key.toUpperCase();
      if (currentBase === 'HEX' && '0123456789ABCDEF'.includes(k)) {
        handleHexDigit(k);
      } else if (currentBase === 'DEC' && '0123456789'.includes(k)) {
        handleHexDigit(k);
      } else if (currentBase === 'OCT' && '01234567'.includes(k)) {
        handleHexDigit(k);
      } else if (currentBase === 'BIN' && '01'.includes(k)) {
        handleHexDigit(k);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Export Data
  const exportReportData: ExportReportData = {
    title: 'Programmer Bitwise & Base Conversion Report',
    engine: 'Programmer Engine',
    timestamp: Date.now(),
    inputDescription: `Base: ${currentBase}, Word Size: ${wordSize}-bit, Input: ${inputStr}`,
    resultSummary: `HEX: 0x${hexStr} | DEC: ${decStr} | OCT: 0o${octStr} | BIN: ${formattedBin}`,
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100">64-Bit Programmer Calculator</h2>
          <p className="text-xs text-slate-400">
            Real-time HEX / DEC / OCT / BIN conversions with interactive bit toggles
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Word Size Selectors */}
          <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700">
            {([64, 32, 16, 8] as BitWordSize[]).map((w) => (
              <button
                key={w}
                onClick={() => {
                  setWordSize(w);
                  const mask = (BigInt(1) << BigInt(w)) - BigInt(1);
                  setValBig((prev) => prev & mask);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  wordSize === w ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w}-bit
              </button>
            ))}
          </div>

          <button
            onClick={() => setExportModalOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl border border-slate-700 transition-all ml-1"
            title="Export Report"
            aria-label="Export report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Base Display Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        {[
          { base: 'HEX', val: hexStr, prefix: '0x' },
          { base: 'DEC', val: decStr, prefix: '' },
          { base: 'OCT', val: octStr, prefix: '0o' },
          { base: 'BIN', val: formattedBin, prefix: '0b' },
        ].map((item) => {
          const isActive = currentBase === item.base;
          return (
            <div
              key={item.base}
              role="button"
              tabIndex={0}
              onClick={() => handleBaseChange(item.base as Base)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBaseChange(item.base as Base);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:outline-none ${
                isActive
                  ? 'bg-sky-950/60 border-sky-500/60 text-white shadow-lg shadow-sky-950/40'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-xs font-bold font-mono px-2 py-1 rounded-lg uppercase ${
                    isActive ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.base}
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-slate-100 truncate">
                  <span className="text-slate-500 mr-1">{item.prefix}</span>
                  {item.val || '0'}
                </span>
              </div>

              {isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(item.val);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800"
                  aria-label={`Copy ${item.base} value`}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive 64-Bit Binary Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Interactive Bit Field (Click Bit to Flip)
        </span>

        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 font-mono text-center">
          {Array.from({ length: wordSize }).map((_, i) => {
            const bitIndex = wordSize - 1 - i;
            const bitVal = (valBig & (BigInt(1) << BigInt(bitIndex))) !== BigInt(0);
            return (
              <button
                key={bitIndex}
                onClick={() => handleToggleBit(bitIndex)}
                className={`p-2 rounded-xl border flex flex-col items-center justify-between transition-all ${
                  bitVal
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[9px] text-slate-500 font-bold">{bitIndex}</span>
                <span className="text-sm font-bold mt-0.5">{bitVal ? '1' : '0'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Programmer Keypad */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl grid grid-cols-4 sm:grid-cols-6 gap-2 font-mono">
        {['A', 'B', 'C', 'D', 'E', 'F'].map((hexDigit) => {
          const disabled = currentBase !== 'HEX';
          return (
            <button
              key={hexDigit}
              disabled={disabled}
              onClick={() => handleHexDigit(hexDigit)}
              className={`p-3.5 rounded-2xl font-bold text-base transition-all border ${
                disabled
                  ? 'bg-slate-950/40 border-slate-900 text-slate-700 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 active:scale-95'
              }`}
            >
              {hexDigit}
            </button>
          );
        })}

        {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'].map((digit) => {
          let disabled = false;
          if (currentBase === 'BIN' && !['0', '1'].includes(digit)) disabled = true;
          if (currentBase === 'OCT' && ['8', '9'].includes(digit)) disabled = true;

          return (
            <button
              key={digit}
              disabled={disabled}
              onClick={() => handleHexDigit(digit)}
              className={`p-3.5 rounded-2xl font-bold text-base transition-all border ${
                disabled
                  ? 'bg-slate-950/40 border-slate-900 text-slate-700 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 active:scale-95'
              }`}
            >
              {digit}
            </button>
          );
        })}

        <button
          onClick={handleBackspace}
          className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl font-bold flex items-center justify-center transition-all active:scale-95"
          aria-label="Backspace"
        >
          <Delete className="w-5 h-5" />
        </button>

        <button
          onClick={handleClear}
          className="p-3.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-2xl font-bold transition-all active:scale-95"
        >
          AC
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
