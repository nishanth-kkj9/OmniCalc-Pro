import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Play, Pause, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { GraphSlider } from '../../types';

export interface GraphSliderPanelProps {
  sliders: GraphSlider[];
  onAddSlider: (name: string) => void;
  onUpdateSlider: (id: string, updated: Partial<GraphSlider>) => void;
  onDeleteSlider: (id: string) => void;
  theme: 'dark' | 'light' | 'oled';
}

export const GraphSliderPanel: React.FC<GraphSliderPanelProps> = ({
  sliders,
  onAddSlider,
  onUpdateSlider,
  onDeleteSlider,
  theme: _theme,
}) => {
  const [newVarName, setNewVarName] = useState('a');
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const animDirectionRef = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);

  // Animation loop for sliders
  useEffect(() => {
    if (!animatingId) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const slider = sliders.find((s) => s.id === animatingId);
    if (!slider) {
      setAnimatingId(null);
      return;
    }

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const span = slider.max - slider.min;
      const speed = span / 4; // traverse span in 4 seconds
      let nextVal = slider.value + animDirectionRef.current * speed * dt;

      if (nextVal >= slider.max) {
        nextVal = slider.max;
        animDirectionRef.current = -1;
      } else if (nextVal <= slider.min) {
        nextVal = slider.min;
        animDirectionRef.current = 1;
      }

      onUpdateSlider(slider.id, { value: Number(nextVal.toFixed(3)) });
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animatingId, sliders, onUpdateSlider]);

  const handleCreate = () => {
    const clean = newVarName.trim().toLowerCase();
    if (!clean || clean === 'x' || clean.length !== 1 || !/^[a-z]$/.test(clean)) return;
    if (sliders.some((s) => s.name === clean)) return;
    onAddSlider(clean);

    // Pick next unused letter
    const letters = 'abcdefkmnpqrstuvw';
    for (const ch of letters) {
      if (!sliders.some((s) => s.name === ch) && ch !== clean) {
        setNewVarName(ch);
        break;
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header & Add Form */}
      <div className="p-3 border-b border-slate-700/50 bg-slate-900/40 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <span>Variable Sliders</span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            maxLength={1}
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value.toLowerCase())}
            placeholder="var"
            className="w-10 text-center py-1 rounded-xl text-xs font-mono font-bold bg-slate-800 border border-slate-700 focus:outline-none uppercase"
          />
          <button
            onClick={handleCreate}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 transition-colors shadow-xs"
            title="Create slider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Sliders List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sliders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-2xl border-slate-800">
            <p className="font-semibold text-slate-300 mb-1">No variable sliders defined</p>
            <p className="text-[11px] text-slate-400">
              Create parameters like <code className="text-purple-400 font-mono font-bold">a</code> or{' '}
              <code className="text-purple-400 font-mono font-bold">b</code> to use in expressions like{' '}
              <code className="text-sky-400 font-mono">y = a*x^2 + b</code>.
            </p>
          </div>
        ) : (
          sliders.map((s) => {
            const isPlaying = animatingId === s.id;
            return (
              <div
                key={s.id}
                className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/50 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs flex items-center justify-center">
                      {s.name}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-slate-100">
                      = {s.value}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Play/Pause loop */}
                    <button
                      onClick={() => setAnimatingId(isPlaying ? null : s.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPlaying ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title={isPlaying ? 'Pause animation' : 'Animate parameter'}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    {/* Reset to 1 or 0 */}
                    <button
                      onClick={() => onUpdateSlider(s.id, { value: 1 })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Reset value to 1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete slider */}
                    <button
                      onClick={() => {
                        if (animatingId === s.id) setAnimatingId(null);
                        onDeleteSlider(s.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete parameter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={s.value}
                  onChange={(e) => onUpdateSlider(s.id, { value: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500"
                />

                {/* Min, Max, Step Configuration */}
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-1">
                    <span>Min:</span>
                    <input
                      type="number"
                      value={s.min}
                      onChange={(e) => onUpdateSlider(s.id, { min: parseFloat(e.target.value) || -10 })}
                      className="w-12 px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200 text-center"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span>Step:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      value={s.step}
                      onChange={(e) => onUpdateSlider(s.id, { step: Math.max(0.01, parseFloat(e.target.value) || 0.1) })}
                      className="w-12 px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200 text-center"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span>Max:</span>
                    <input
                      type="number"
                      value={s.max}
                      onChange={(e) => onUpdateSlider(s.id, { max: parseFloat(e.target.value) || 10 })}
                      className="w-12 px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200 text-center"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
