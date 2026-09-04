import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  MoreVertical,
  Trash2,
  Copy,
  TrendingUp,
  AlertCircle,
  Check,
} from 'lucide-react';
import { GraphExpression, LineStyle } from '../../types';
import { GRAPH_PALETTE } from '../../utils/graph';

export interface ExpressionRowProps {
  expression: GraphExpression;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (updated: Partial<GraphExpression>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAnalyze: () => void;
  isValid: boolean;
  theme: 'dark' | 'light' | 'oled';
}

export const ExpressionRow: React.FC<ExpressionRowProps> = ({
  expression,
  isActive,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onAnalyze,
  isValid,
  theme,
}) => {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLight = theme === 'light';
  const isOled = theme === 'oled';

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rowBg = isActive
    ? isLight
      ? 'bg-sky-50/80 border-sky-300 shadow-xs'
      : isOled
        ? 'bg-zinc-900 border-zinc-700 shadow-xs'
        : 'bg-slate-800/90 border-sky-500/40 shadow-xs'
    : isLight
      ? 'bg-white border-slate-200 hover:border-slate-300'
      : isOled
        ? 'bg-zinc-950 border-zinc-850 hover:border-zinc-750'
        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700/80';

  const inputClass = isLight
    ? 'text-slate-900 placeholder-slate-400 focus:bg-white'
    : 'text-slate-100 placeholder-slate-500 focus:bg-slate-950/40';

  return (
    <div
      onClick={onSelect}
      className={`relative w-full p-2.5 rounded-2xl border transition-all flex flex-col gap-1.5 cursor-pointer ${rowBg}`}
    >
      <div className="flex items-center gap-2">
        {/* Color Indicator & Picker Trigger */}
        <div className="relative group">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOptionsOpen(true);
            }}
            className="w-4 h-4 rounded-full border-2 border-white/80 shadow-xs flex-shrink-0 transition-transform group-hover:scale-110"
            style={{ backgroundColor: expression.color }}
            title="Change curve styling"
            aria-label="Change curve color and styling"
          />
        </div>

        {/* Math input: y = f(x) */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0 bg-transparent">
          <span className="font-mono text-xs font-bold text-slate-400 select-none">y =</span>
          <input
            ref={inputRef}
            type="text"
            value={expression.expression}
            onChange={(e) => onUpdate({ expression: e.target.value })}
            placeholder="e.g. x^2 - 4"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            className={`flex-1 bg-transparent border-none text-xs font-mono font-semibold focus:outline-none min-w-0 ${inputClass}`}
          />
        </div>

        {/* Syntax Error Warning icon */}
        {!isValid && expression.expression.trim() && (
          <div title="Invalid mathematical expression" className="text-rose-400 flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}

        {/* Visibility Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ visible: !expression.visible });
          }}
          className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
            expression.visible ? 'text-sky-400 hover:text-sky-300' : 'text-slate-500 hover:text-slate-400'
          }`}
          title={expression.visible ? 'Hide Curve' : 'Show Curve'}
          aria-label={expression.visible ? 'Hide curve' : 'Show curve'}
        >
          {expression.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* More Options Dropdown Trigger */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOptionsOpen((prev) => !prev);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
            title="Curve options"
            aria-label="Curve options menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Options Popover */}
          {optionsOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute right-0 top-full mt-1.5 w-60 rounded-2xl border p-3 z-50 shadow-2xl ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : isOled ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Curve Options
              </div>

              {/* Color Palette Selection */}
              <div className="mb-3">
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Color</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {GRAPH_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onUpdate({ color })}
                      style={{ backgroundColor: color }}
                      className="w-6 h-6 rounded-full flex items-center justify-center border border-white/20 hover:scale-110 transition-transform"
                    >
                      {expression.color === color && <Check className="w-3 h-3 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Style */}
              <div className="mb-3">
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Line Style</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-800/40 p-1 rounded-xl">
                  {(['solid', 'dashed', 'dotted'] as LineStyle[]).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => onUpdate({ lineStyle: style })}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg capitalize transition-colors ${
                        expression.lineStyle === style ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Width */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Line Width</span>
                  <span className="font-mono font-bold text-sky-400">{expression.lineWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="0.5"
                  value={expression.lineWidth}
                  onChange={(e) => onUpdate({ lineWidth: parseFloat(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Domain Restriction */}
              <div className="mb-3">
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Domain Restriction [min, max]</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={expression.domainMin !== undefined ? expression.domainMin : ''}
                    onChange={(e) =>
                      onUpdate({
                        domainMin: e.target.value !== '' ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-1.5 rounded-lg text-xs font-mono bg-slate-800/60 border border-slate-700/60 focus:outline-none"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={expression.domainMax !== undefined ? expression.domainMax : ''}
                    onChange={(e) =>
                      onUpdate({
                        domainMax: e.target.value !== '' ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-1.5 rounded-lg text-xs font-mono bg-slate-800/60 border border-slate-700/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Curve Label */}
              <div className="mb-3">
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Curve Label</label>
                <input
                  type="text"
                  placeholder="e.g. Parabola"
                  value={expression.label || ''}
                  onChange={(e) => onUpdate({ label: e.target.value || undefined })}
                  className="w-full p-1.5 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 focus:outline-none"
                />
              </div>

              <div className="h-px bg-slate-800/80 my-2" />

              {/* Action Buttons */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setOptionsOpen(false);
                    onAnalyze();
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 flex items-center gap-2 transition-colors"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Analyze Roots & Extrema</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOptionsOpen(false);
                    onDuplicate();
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-slate-500/10 flex items-center gap-2 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate Expression</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOptionsOpen(false);
                    onDelete();
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Expression</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Domain restriction badge if set */}
      {(expression.domainMin !== undefined || expression.domainMax !== undefined || expression.label) && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400 pl-6">
          {expression.label && <span className="font-semibold text-slate-300 truncate">{expression.label}</span>}
          {(expression.domainMin !== undefined || expression.domainMax !== undefined) && (
            <span className="font-mono bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/60">
              {expression.domainMin !== undefined ? expression.domainMin : '-∞'} ≤ x ≤ {expression.domainMax !== undefined ? expression.domainMax : '+∞'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
