import React, { useState } from 'react';
import { X, Sparkles, PlusCircle } from 'lucide-react';
import { GRAPHING_PRESETS, PresetFunction } from '../../utils/graphingEngine';

interface GraphPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetFunction) => void;
  isLight?: boolean;
}

export const GraphPresetsModal: React.FC<GraphPresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  isLight = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Trigonometry', 'Polynomials', 'Calculus', 'Waves & Physics', 'Special'];

  const filteredPresets =
    selectedCategory === 'All'
      ? GRAPHING_PRESETS
      : GRAPHING_PRESETS.filter((p) => p.category === selectedCategory);

  const containerBg = isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100';
  const cardBg = isLight ? 'bg-slate-50 hover:bg-sky-50 border-slate-200' : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/70';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="presets-title"
    >
      <div className={`relative w-full max-w-2xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${containerBg}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="presets-title" className="text-base font-bold">
                Function Presets & Classic Curves
              </h3>
              <p className="text-xs text-slate-400">
                Instantly load standard mathematical curves with ideal viewport bounds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
            aria-label="Close presets modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 p-3 px-5 border-b border-inherit overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Presets Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 group ${cardBg}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">
                    {preset.category}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 font-mono text-slate-300">
                    Preset
                  </span>
                </div>
                <h4 className="text-sm font-bold mb-1">{preset.name}</h4>
                <div className="font-mono text-xs text-sky-300 bg-black/20 p-1.5 px-2.5 rounded-lg border border-sky-500/20 mb-2">
                  y = {preset.expr}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <button
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-sky-600/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Load Function & Bounds
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
