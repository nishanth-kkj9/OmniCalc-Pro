import React from 'react';
import { X, Sliders, RefreshCw } from 'lucide-react';
import { GraphSettings as IGraphSettings, GraphViewport } from '../../types';

export interface GraphSettingsProps {
  settings: IGraphSettings;
  onUpdateSettings: (updated: Partial<IGraphSettings>) => void;
  viewport: GraphViewport;
  onUpdateViewport: (updated: GraphViewport) => void;
  onClose: () => void;
  theme: 'dark' | 'light' | 'oled';
}

export const GraphSettings: React.FC<GraphSettingsProps> = ({
  settings,
  onUpdateSettings,
  viewport,
  onUpdateViewport,
  onClose,
  theme,
}) => {
  const isLight = theme === 'light';
  const isOled = theme === 'oled';

  const [localXMin, setLocalXMin] = React.useState(viewport.xMin.toString());
  const [localXMax, setLocalXMax] = React.useState(viewport.xMax.toString());
  const [localYMin, setLocalYMin] = React.useState(viewport.yMin.toString());
  const [localYMax, setLocalYMax] = React.useState(viewport.yMax.toString());

  const handleApplyBounds = () => {
    const xMin = parseFloat(localXMin);
    const xMax = parseFloat(localXMax);
    const yMin = parseFloat(localYMin);
    const yMax = parseFloat(localYMax);

    if (!isNaN(xMin) && !isNaN(xMax) && !isNaN(yMin) && !isNaN(yMax) && xMin < xMax && yMin < yMax) {
      onUpdateViewport({ xMin, xMax, yMin, yMax });
    }
  };

  const handleSquareAspectRatio = () => {
    const xSpan = viewport.xMax - viewport.xMin;
    const yCenter = (viewport.yMax + viewport.yMin) / 2;
    onUpdateViewport({
      xMin: viewport.xMin,
      xMax: viewport.xMax,
      yMin: yCenter - xSpan / 2,
      yMax: yCenter + xSpan / 2,
    });
    setLocalYMin((yCenter - xSpan / 2).toFixed(2));
    setLocalYMax((yCenter + xSpan / 2).toFixed(2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-md rounded-3xl border p-5 shadow-2xl space-y-4 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : isOled ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold">Graph Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Bounds */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Viewport Domain & Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">X Min</span>
              <input
                type="number"
                value={localXMin}
                onChange={(e) => setLocalXMin(e.target.value)}
                className="w-full p-2 rounded-xl text-xs font-mono bg-slate-800/80 border border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">X Max</span>
              <input
                type="number"
                value={localXMax}
                onChange={(e) => setLocalXMax(e.target.value)}
                className="w-full p-2 rounded-xl text-xs font-mono bg-slate-800/80 border border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Y Min</span>
              <input
                type="number"
                value={localYMin}
                onChange={(e) => setLocalYMin(e.target.value)}
                className="w-full p-2 rounded-xl text-xs font-mono bg-slate-800/80 border border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Y Max</span>
              <input
                type="number"
                value={localYMax}
                onChange={(e) => setLocalYMax(e.target.value)}
                className="w-full p-2 rounded-xl text-xs font-mono bg-slate-800/80 border border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleSquareAspectRatio}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Square 1:1 Aspect Ratio</span>
            </button>
            <button
              onClick={handleApplyBounds}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-xs"
            >
              Apply Bounds
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-800" />

        {/* Display Toggles */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Display Elements
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <input
                type="checkbox"
                checked={settings.showGrid}
                onChange={(e) => onUpdateSettings({ showGrid: e.target.checked })}
                className="accent-sky-500 rounded"
              />
              <span>Major Grid</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <input
                type="checkbox"
                checked={settings.showMinorGrid}
                onChange={(e) => onUpdateSettings({ showMinorGrid: e.target.checked })}
                className="accent-sky-500 rounded"
              />
              <span>Minor Grid</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <input
                type="checkbox"
                checked={settings.showAxes}
                onChange={(e) => onUpdateSettings({ showAxes: e.target.checked })}
                className="accent-sky-500 rounded"
              />
              <span>X / Y Axes</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <input
                type="checkbox"
                checked={settings.showAxisLabels}
                onChange={(e) => onUpdateSettings({ showAxisLabels: e.target.checked })}
                className="accent-sky-500 rounded"
              />
              <span>Axis Ticks</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <input
                type="checkbox"
                checked={settings.showCurveLabels}
                onChange={(e) => onUpdateSettings({ showCurveLabels: e.target.checked })}
                className="accent-sky-500 rounded"
              />
              <span>Curve Labels</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
