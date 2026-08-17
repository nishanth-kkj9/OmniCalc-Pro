import React, { useState } from 'react';
import { BitWordSize, NumberBase, AppSettings } from '../types';
import { addHistory } from '../utils/history';

interface ProgrammerCalculatorProps {
  settings?: AppSettings;
}

export const ProgrammerCalculator: React.FC<ProgrammerCalculatorProps> = ({ settings: _settings }) => {
  const [val, setVal] = useState<bigint>(0n);
  const [activeBase, setActiveBase] = useState<NumberBase>('DEC');
  const [wordSize, setWordSize] = useState<BitWordSize>(64);
  const [inputBuffer, setInputBuffer] = useState<string>('0');
  const [firstOperand, setFirstOperand] = useState<bigint | null>(null);
  const [operator, setOperator] = useState<string | null>(null);

  // Mask value according to word size (signed 64-bit BigInt math)
  const getMask = (bits: BitWordSize): bigint => {
    return (1n << BigInt(bits)) - 1n;
  };

  const maskedVal = val & getMask(wordSize);

  // Helper formatting for base displays
  const hexString = maskedVal.toString(16).toUpperCase();
  const decString = maskedVal.toString(10);
  const octString = maskedVal.toString(8);
  const binString = maskedVal.toString(2).padStart(wordSize, '0');

  // Handle number input
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
      // Invalid input ignored
    }
  };

  // Toggle specific bit in 64-bit array
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

  const handleOp = (op: string) => {
    if (op === 'NOT') {
      const res = (~val) & getMask(wordSize);
      setVal(res);
      updateBufferFromVal(res, activeBase);
      addHistory(`NOT(${decString})`, res.toString(10), 'programmer');
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
      case 'AND': res = a & b; break;
      case 'OR': res = a | b; break;
      case 'XOR': res = a ^ b; break;
      case 'NAND': res = ~(a & b); break;
      case 'NOR': res = ~(a | b); break;
      case 'XNOR': res = ~(a ^ b); break;
      case 'LSH': res = a << b; break;
      case 'RSH': res = a >> b; break;
      default: return;
    }

    res = res & getMask(wordSize);
    setVal(res);
    updateBufferFromVal(res, activeBase);
    addHistory(`${a.toString(10)} ${operator} ${b.toString(10)}`, res.toString(10), 'programmer');
    setFirstOperand(null);
    setOperator(null);
  };

  // Determine key availability by active base
  const isKeyDisabled = (key: string) => {
    if (['A', 'B', 'C', 'D', 'E', 'F'].includes(key)) return activeBase !== 'HEX';
    if (['8', '9'].includes(key)) return activeBase === 'BIN' || activeBase === 'OCT';
    if (['2', '3', '4', '5', '6', '7'].includes(key)) return activeBase === 'BIN';
    return false;
  };

  const btnClass = "h-11 font-mono font-bold text-sm sm:text-base rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center select-none shadow-sm disabled:opacity-30 disabled:pointer-events-none";

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-5">
      {/* Top Displays for Hex, Dec, Oct, Bin */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-2">
        {[
          { base: 'HEX' as NumberBase, val: hexString, label: 'HEX' },
          { base: 'DEC' as NumberBase, val: decString, label: 'DEC' },
          { base: 'OCT' as NumberBase, val: octString, label: 'OCT' },
          { base: 'BIN' as NumberBase, val: binString, label: 'BIN' },
        ].map(({ base, val: displayVal, label }) => (
          <div
            key={base}
            onClick={() => switchBase(base)}
            className={`
              flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border
              ${activeBase === base 
                ? 'bg-sky-950/80 border-sky-500/60 text-sky-300 shadow-sm' 
                : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }
            `}
          >
            <span className="text-xs font-bold font-mono w-12">{label}</span>
            <span className="text-sm sm:text-base font-mono font-semibold truncate tracking-wider">
              {displayVal}
            </span>
          </div>
        ))}
      </div>

      {/* Bit Word Size Selector */}
      <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
        <span className="text-xs font-semibold text-slate-400 px-2">Word Size:</span>
        <div className="flex gap-1">
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
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                wordSize === size
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive 64-Bit Toggle Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
          <span>Binary Bit Matrix (Click to toggle bit)</span>
          <span className="text-sky-400 font-mono">MSB ← LSB</span>
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
                  flex flex-col items-center justify-center p-1 rounded-lg border text-xs font-mono transition-all duration-100
                  ${isBitSet 
                    ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm shadow-sky-500/30' 
                    : 'bg-slate-800/80 text-slate-500 border-slate-700/60 hover:bg-slate-700 hover:text-slate-300'
                  }
                `}
                title={`Bit ${bitPos} (Value: ${1n << BigInt(bitPos)})`}
              >
                <span>{isBitSet ? '1' : '0'}</span>
                <span className="text-[9px] opacity-60">{bitPos}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bitwise & Keypad Controls */}
      <div className="grid grid-cols-6 gap-2">
        {/* Row 1: Bitwise */}
        {['AND', 'OR', 'XOR', 'NOT', 'LSH', 'RSH'].map((op) => (
          <button
            key={op}
            onClick={() => handleOp(op)}
            className={`${btnClass} bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60`}
          >
            {op}
          </button>
        ))}

        {/* Row 2: Hex A-F */}
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

        {/* Row 3: Numbers 7 8 9 + Controls */}
        <button disabled={isKeyDisabled('7')} onClick={() => handleDigit('7')} className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>7</button>
        <button disabled={isKeyDisabled('8')} onClick={() => handleDigit('8')} className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>8</button>
        <button disabled={isKeyDisabled('9')} onClick={() => handleDigit('9')} className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>9</button>
        <button onClick={() => handleOp('NAND')} className={`${btnClass} bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}>NAND</button>
        <button onClick={handleClear} className={`${btnClass} col-span-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30`}>CLEAR</button>

        {/* Row 4: Numbers 4 5 6 */}
        <button disabled={isKeyDisabled('4')} onClick={() => handleDigit('4')} className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>4</button>
        <button disabled={isKeyDisabled('5')} onClick={() => handleDigit('5')} className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>5</button>
        <button disabled={isKeyDisabled('6')} onClick={() => handleDigit('6')} className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>6</button>
        <button onClick={() => handleOp('NOR')} className={`${btnClass} bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}>NOR</button>
        <button onClick={() => handleOp('XNOR')} className={`${btnClass} col-span-2 bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900`}>XNOR</button>

        {/* Row 5: Numbers 1 2 3 */}
        <button disabled={isKeyDisabled('1')} onClick={() => handleDigit('1')} className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>1</button>
        <button disabled={isKeyDisabled('2')} onClick={() => handleDigit('2')} className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>2</button>
        <button disabled={isKeyDisabled('3')} onClick={() => handleDigit('3')} className={`${btnClass} bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>3</button>
        <button disabled={isKeyDisabled('0')} onClick={() => handleDigit('0')} className={`${btnClass} col-span-2 bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700`}>0</button>
        <button onClick={handleEquals} className={`${btnClass} bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-lg hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/20`}>=</button>
      </div>
    </div>
  );
};
