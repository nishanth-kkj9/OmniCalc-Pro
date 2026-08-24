import React, { useState, useMemo, useCallback } from 'react';
import { BitWordSize, NumberBase, AppSettings } from '../types';
import { addHistory } from '../utils/history';
import { Download, Copy, Check, RotateCcw, RotateCw, Sliders, Cpu, Layers } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';

interface ProgrammerCalculatorProps {
  settings: AppSettings;
}

export const ProgrammerCalculator: React.FC<ProgrammerCalculatorProps> = ({ settings }) => {
  const [val, setVal] = useState<bigint>(0n);
  const [activeBase, setActiveBase] = useState<NumberBase>('HEX');
  const [wordSize, setWordSize] = useState<BitWordSize>(64);
  const [inputBuffer, setInputBuffer] = useState<string>('0');
  const [firstOperand, setFirstOperand] = useState<bigint | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [exportData, setExportData] = useState<ExportReportData | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'bitfield' | 'encoding'>('matrix');

  // Helper mask for BigInt according to wordSize
  const getMask = useCallback((bits: BitWordSize): bigint => {
    return (1n << BigInt(bits)) - 1n;
  }, []);

  const maskedVal = val & getMask(wordSize);

  // Signed 2's complement value
  const signedVal = useMemo(() => {
    const signBit = 1n << BigInt(wordSize - 1);
    if ((maskedVal & signBit) !== 0n) {
      // Negative in 2's complement
      return (maskedVal - (1n << BigInt(wordSize))).toString(10);
    }
    return maskedVal.toString(10);
  }, [maskedVal, wordSize]);

  // Formatted representations
  const hexString = useMemo(() => {
    const hex = maskedVal.toString(16).toUpperCase();
    // Group in pairs of 2 or 4 chars for readability
    return hex.padStart(wordSize / 4, '0');
  }, [maskedVal, wordSize]);

  const decUnsignedString = maskedVal.toString(10);
  const octString = maskedVal.toString(8);
  const binString = maskedVal.toString(2).padStart(wordSize, '0');

  // ASCII string representation
  const asciiString = useMemo(() => {
    let s = '';
    let temp = maskedVal;
    const bytes = wordSize / 8;
    for (let i = 0; i < bytes; i++) {
      const byteVal = Number(temp & 0xffn);
      if (byteVal >= 32 && byteVal <= 126) {
        s = String.fromCharCode(byteVal) + s;
      } else if (byteVal === 0) {
        s = '·' + s;
      } else {
        s = '?' + s;
      }
      temp >>= 8n;
    }
    return s;
  }, [maskedVal, wordSize]);

  // Handle number digit typing
  const handleDigit = (digit: string) => {
    const newBuf = inputBuffer === '0' ? digit : inputBuffer + digit;
    try {
      let parsed = 0n;
      if (activeBase === 'HEX') parsed = BigInt('0x' + newBuf);
      else if (activeBase === 'DEC') parsed = BigInt(newBuf);
      else if (activeBase === 'OCT') parsed = BigInt('0o' + newBuf);
      else if (activeBase === 'BIN') parsed = BigInt('0b' + newBuf);

      setVal(parsed & getMask(wordSize));
      setInputBuffer(newBuf);
    } catch {
      // Ignore invalid key combinations
    }
  };

  // Toggle specific bit in array
  const toggleBit = (bitIndex: number) => {
    const bitMask = 1n << BigInt(bitIndex);
    const newVal = (val ^ bitMask) & getMask(wordSize);
    setVal(newVal);
    updateBufferFromVal(newVal, activeBase);
  };

  const updateBufferFromVal = (v: bigint, base: NumberBase) => {
    const masked = v & getMask(wordSize);
    if (base === 'HEX') setInputBuffer(masked.toString(16).toUpperCase());
    else if (base === 'DEC') setInputBuffer(masked.toString(10));
    else if (base === 'OCT') setInputBuffer(masked.toString(8));
    else if (base === 'BIN') setInputBuffer(masked.toString(2));
  };

  const switchBase = (newBase: NumberBase) => {
    setActiveBase(newBase);
    updateBufferFromVal(val, newBase);
  };

  const handleClear = () => {
    setVal(0n);
    setInputBuffer('0');
    setFirstOperand(null);
    setOperator(null);
  };

  // Bit manipulation operations
  const setAllBits = () => {
    const newVal = getMask(wordSize);
    setVal(newVal);
    updateBufferFromVal(newVal, activeBase);
  };

  const invertAllBits = () => {
    const newVal = ~val & getMask(wordSize);
    setVal(newVal);
    updateBufferFromVal(newVal, activeBase);
  };

  const rotateLeft = () => {
    const msb = (val >> BigInt(wordSize - 1)) & 1n;
    const newVal = ((val << 1n) | msb) & getMask(wordSize);
    setVal(newVal);
    updateBufferFromVal(newVal, activeBase);
  };

  const rotateRight = () => {
    const lsb = val & 1n;
    const newVal = ((val >> 1n) | (lsb << BigInt(wordSize - 1))) & getMask(wordSize);
    setVal(newVal);
    updateBufferFromVal(newVal, activeBase);
  };

  const handleOp = (op: string) => {
    if (op === 'NOT') {
      const res = ~val & getMask(wordSize);
      setVal(res);
      updateBufferFromVal(res, activeBase);
      addHistory(`NOT(${decUnsignedString})`, res.toString(10), 'programmer');
      return;
    }
    setFirstOperand(val);
    setOperator(op);
    setInputBuffer('0');
  };

  const handleEquals = () => {
    if (firstOperand === null || operator === null) return;
    let res = 0n;
    const a = firstOperand;
    const b = val;

    switch (operator) {
      case 'AND':
        res = a & b;
        break;
      case 'OR':
        res = a | b;
        break;
      case 'XOR':
        res = a ^ b;
        break;
      case 'NAND':
        res = ~(a & b);
        break;
      case 'NOR':
        res = ~(a | b);
        break;
      case 'XNOR':
        res = ~(a ^ b);
        break;
      case 'LSH':
        res = a << b;
        break;
      case 'RSH':
        res = a >> b;
        break;
      case '+':
        res = a + b;
        break;
      case '-':
        res = a - b;
        break;
      case '*':
        res = a * b;
        break;
      case '/':
        res = b !== 0n ? a / b : 0n;
        break;
      case '%':
        res = b !== 0n ? a % b : 0n;
        break;
      default:
        return;
    }

    res = res & getMask(wordSize);
    setVal(res);
    updateBufferFromVal(res, activeBase);
    addHistory(`${a.toString(10)} ${operator} ${b.toString(10)}`, res.toString(10), 'programmer');
    setFirstOperand(null);
    setOperator(null);
  };

  const isKeyDisabled = (key: string) => {
    if (['A', 'B', 'C', 'D', 'E', 'F'].includes(key)) return activeBase !== 'HEX';
    if (['8', '9'].includes(key)) return activeBase === 'BIN' || activeBase === 'OCT';
    if (['2', '3', '4', '5', '6', '7'].includes(key)) return activeBase === 'BIN';
    return false;
  };

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

  const btnClass =
    'h-11 font-mono font-bold text-xs sm:text-sm rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center select-none shadow-sm disabled:opacity-20 disabled:pointer-events-none';

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-5">
      {/* Top Multi-Base Interactive Overview */}
      <div className={`${cardBg} border rounded-3xl p-5 shadow-xl flex flex-col gap-3`}>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Multi-Base Programmer Sandbox</h3>
              <p className="text-xs text-slate-400">
                Arbitrary precision integer arithmetic & memory bitfield inspector
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const tableHeaders = ['Base', 'Representation', 'Value'];
              const tableRows = [
                ['HEX', 'Hexadecimal', `0x${hexString}`],
                ['DEC (Unsigned)', 'Unsigned Decimal', decUnsignedString],
                ['DEC (Signed)', "Two's Complement Signed", signedVal],
                ['OCT', 'Octal', `0o${octString}`],
                ['BIN', 'Binary (Nibbles)', binString.match(/.{1,4}/g)?.join(' ') || binString],
                ['ASCII', 'Decoded Char String', asciiString],
              ];

              setExportData({
                title: 'Programmer Sandbox Bitfield Report',
                engine: 'Programmer Engine',
                timestamp: Date.now(),
                inputDescription: `Word Size: ${wordSize}-bit (${wordSize === 64 ? 'QWORD' : wordSize === 32 ? 'DWORD' : wordSize === 16 ? 'WORD' : 'BYTE'})`,
                resultSummary: `0x${hexString} = ${decUnsignedString} (DEC)`,
                tableHeaders,
                tableRows,
                metadata: {
                  'Word Size': `${wordSize} bits`,
                  'Unsigned Dec': decUnsignedString,
                  'Signed (2s Comp)': signedVal,
                  'Hex Value': `0x${hexString}`,
                  'ASCII Preview': asciiString,
                },
              });
            }}
            className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Download className="w-3.5 h-3.5" /> Export Bit Report
          </button>
        </div>

        {/* Base Grid Displays */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { base: 'HEX' as NumberBase, val: `0x${hexString}`, label: 'HEX' },
            { base: 'DEC' as NumberBase, val: decUnsignedString, label: 'DEC (Unsigned)' },
            { base: 'OCT' as NumberBase, val: `0o${octString}`, label: 'OCT' },
            { base: 'BIN' as NumberBase, val: binString, label: 'BIN' },
          ].map(({ base, val: displayVal, label }) => (
            <div
              key={label}
              onClick={() => switchBase(base)}
              className={`
                flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all border
                ${
                  activeBase === base
                    ? 'bg-sky-950/70 border-sky-500/70 text-sky-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }
              `}
            >
              <span className="text-xs font-bold font-mono w-24">{label}</span>
              <span className="text-sm font-mono font-semibold truncate tracking-wider">
                {displayVal}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(label, displayVal);
                }}
                className="ml-2 p-1 text-slate-500 hover:text-sky-400"
              >
                {copied === label ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Signed & ASCII Inspection Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Signed (2's Complement):</span>
            <span className="font-bold text-amber-400 text-sm">{signedVal}</span>
          </div>
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Decoded ASCII:</span>
            <span className="font-bold text-emerald-400 text-sm tracking-widest">
              "{asciiString}"
            </span>
          </div>
        </div>
      </div>

      {/* Word Size & Sandbox Modes */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Word Size Selector */}
        <div className="flex flex-wrap items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1">
          <span className="text-xs font-semibold text-slate-400 px-1 sm:px-2">Size:</span>
          {[
            { size: 64 as BitWordSize, label: 'QWORD (64)' },
            { size: 32 as BitWordSize, label: 'DWORD (32)' },
            { size: 16 as BitWordSize, label: 'WORD (16)' },
            { size: 8 as BitWordSize, label: 'BYTE (8)' },
          ].map(({ size, label }) => (
            <button
              key={size}
              onClick={() => {
                setWordSize(size);
                setVal(val & getMask(size));
              }}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex-shrink-0 ${
                wordSize === size
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Quick Bitwise Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={setAllBits}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex-shrink-0"
            title="Set all bits to 1"
          >
            Set All 1s
          </button>
          <button
            onClick={invertAllBits}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex-shrink-0"
            title="Invert all bits (~NOT)"
          >
            Invert
          </button>
          <button
            onClick={rotateLeft}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 flex-shrink-0"
            title="Circular Rotate Left (ROL)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={rotateRight}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 flex-shrink-0"
            title="Circular Rotate Right (ROR)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inspector Tabs */}
      <div className="flex items-center gap-2">
        {[
          {
            id: 'matrix',
            label: 'Interactive Bit Matrix',
            icon: <Layers className="w-3.5 h-3.5" />,
          },
          {
            id: 'bitfield',
            label: 'Byte / Bitfield Packer',
            icon: <Sliders className="w-3.5 h-3.5" />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              activeTab === tab.id
                ? 'bg-slate-800 text-sky-400 border-sky-500/50'
                : 'bg-slate-900/60 text-slate-400 border-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 64-Bit Interactive Matrix */}
      {activeTab === 'matrix' && (
        <div className={`${subCardBg} border rounded-3xl p-5 flex flex-col gap-3 shadow-md`}>
          <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>Click any bit to toggle state (0 ⟷ 1):</span>
            <span className="text-sky-400 font-mono">MSB (Bit {wordSize - 1}) ➔ LSB (Bit 0)</span>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 pt-1">
            {Array.from({ length: wordSize }).map((_, idx) => {
              const bitPos = wordSize - 1 - idx;
              const isBitSet = ((val >> BigInt(bitPos)) & 1n) === 1n;
              return (
                <button
                  key={bitPos}
                  onClick={() => toggleBit(bitPos)}
                  className={`
                    flex flex-col items-center justify-center p-1.5 rounded-xl border text-xs font-mono transition-all duration-100
                    ${
                      isBitSet
                        ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm shadow-sky-500/30 scale-105'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }
                  `}
                  title={`Bit ${bitPos} (Weight: 2^${bitPos} = ${1n << BigInt(bitPos)})`}
                >
                  <span className="font-bold">{isBitSet ? '1' : '0'}</span>
                  <span className="text-[9px] opacity-60">{bitPos}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Byte & Bitfield Range Packer */}
      {activeTab === 'bitfield' && (
        <div className={`${subCardBg} border rounded-3xl p-5 flex flex-col gap-3 shadow-md`}>
          <h4 className="text-xs font-bold text-slate-300">
            Byte Breakdown (RGBA / Network Packets):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {Array.from({ length: Math.min(4, wordSize / 8) }).map((_, bIdx) => {
              const byteShift = BigInt((Math.min(4, wordSize / 8) - 1 - bIdx) * 8);
              const byteVal = Number((val >> byteShift) & 0xffn);
              return (
                <div
                  key={bIdx}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-1 font-mono"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Byte {Math.min(4, wordSize / 8) - 1 - bIdx} [Bits {Number(byteShift) + 7}:
                    {Number(byteShift)}]
                  </span>
                  <span className="text-lg font-bold text-sky-400">
                    0x{byteVal.toString(16).toUpperCase().padStart(2, '0')}
                  </span>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Dec: {byteVal}</span>
                    <span>
                      Char: '{byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : '·'}'
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Programmer Keypad */}
      <div className="grid grid-cols-6 gap-2">
        {/* Bitwise Row */}
        {['AND', 'OR', 'XOR', 'NOT', 'LSH', 'RSH'].map((op) => (
          <button
            key={op}
            onClick={() => handleOp(op)}
            className={`${btnClass} bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60`}
          >
            {op}
          </button>
        ))}

        {/* Hex Letters A-F */}
        {['A', 'B', 'C', 'D', 'E', 'F'].map((hexKey) => (
          <button
            key={hexKey}
            disabled={isKeyDisabled(hexKey)}
            onClick={() => handleDigit(hexKey)}
            className={`${btnClass} bg-slate-800 text-amber-300 border border-slate-700/60 hover:bg-slate-700`}
          >
            {hexKey}
          </button>
        ))}

        {/* 7 8 9 and Arithmetic */}
        <button
          disabled={isKeyDisabled('7')}
          onClick={() => handleDigit('7')}
          className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          7
        </button>
        <button
          disabled={isKeyDisabled('8')}
          onClick={() => handleDigit('8')}
          className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          8
        </button>
        <button
          disabled={isKeyDisabled('9')}
          onClick={() => handleDigit('9')}
          className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          9
        </button>
        <button
          onClick={() => handleOp('+')}
          className={`${btnClass} bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}
        >
          +
        </button>
        <button
          onClick={handleClear}
          className={`${btnClass} col-span-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30`}
        >
          CLEAR
        </button>

        {/* 4 5 6 */}
        <button
          disabled={isKeyDisabled('4')}
          onClick={() => handleDigit('4')}
          className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          4
        </button>
        <button
          disabled={isKeyDisabled('5')}
          onClick={() => handleDigit('5')}
          className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          5
        </button>
        <button
          disabled={isKeyDisabled('6')}
          onClick={() => handleDigit('6')}
          className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          6
        </button>
        <button
          onClick={() => handleOp('-')}
          className={`${btnClass} bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}
        >
          −
        </button>
        <button
          onClick={() => handleOp('NAND')}
          className={`${btnClass} bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}
        >
          NAND
        </button>
        <button
          onClick={() => handleOp('NOR')}
          className={`${btnClass} bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}
        >
          NOR
        </button>

        {/* 1 2 3 */}
        <button
          disabled={isKeyDisabled('1')}
          onClick={() => handleDigit('1')}
          className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          1
        </button>
        <button
          disabled={isKeyDisabled('2')}
          onClick={() => handleDigit('2')}
          className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          2
        </button>
        <button
          disabled={isKeyDisabled('3')}
          onClick={() => handleDigit('3')}
          className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          3
        </button>
        <button
          onClick={() => handleOp('*')}
          className={`${btnClass} bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}
        >
          ×
        </button>
        <button
          onClick={() => handleOp('XNOR')}
          className={`${btnClass} col-span-2 bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}
        >
          XNOR
        </button>

        {/* 0 and Equals */}
        <button
          disabled={isKeyDisabled('0')}
          onClick={() => handleDigit('0')}
          className={`${btnClass} col-span-3 bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}
        >
          0
        </button>
        <button
          onClick={() => handleOp('/')}
          className={`${btnClass} bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}
        >
          ÷
        </button>
        <button
          onClick={handleEquals}
          className={`${btnClass} col-span-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-base hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/20`}
        >
          =
        </button>
      </div>

      {/* Export Modal */}
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
