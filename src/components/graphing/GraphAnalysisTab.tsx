import React from 'react';
import { CriticalPoint } from '../../utils/graphingEngine';
import { Target, CheckCircle2, Crosshair, ArrowUpRight, ArrowDownRight, GitCommit } from 'lucide-react';

interface GraphAnalysisTabProps {
  showCriticalPoints: boolean;
  onToggleShowCriticalPoints: (val: boolean) => void;
  criticalPoints: CriticalPoint[];
  onCenterPoint: (x: number, y: number) => void;
  isLight?: boolean;
}

export const GraphAnalysisTab: React.FC<GraphAnalysisTabProps> = ({
  showCriticalPoints,
  onToggleShowCriticalPoints,
  criticalPoints,
  onCenterPoint,
  isLight = false,
}) => {
  const cardBg = isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/70';

  const getPointIcon = (type: CriticalPoint['type']) => {
    switch (type) {
      case 'root':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'max':
        return <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />;
      case 'min':
        return <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />;
      case 'y-intercept':
        return <GitCommit className="w-3.5 h-3.5 text-sky-400" />;
      case 'intersection':
        return <Crosshair className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getBadgeColor = (type: CriticalPoint['type']) => {
    switch (type) {
      case 'root':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'max':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'min':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'y-intercept':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'intersection':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Master Toggle */}
      <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${cardBg}`}>
        <div>
          <span className="text-xs font-bold block">Show Critical Points on Graph</span>
          <span className="text-[11px] text-slate-400 block">
            Visual markers for roots, extrema, intercepts & intersections
          </span>
        </div>
        <button
          role="switch"
          aria-checked={showCriticalPoints}
          aria-label="Toggle critical points overlay"
          onClick={() => onToggleShowCriticalPoints(!showCriticalPoints)}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-all ${
            showCriticalPoints ? 'bg-sky-600 justify-end' : 'bg-slate-700 justify-start'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
        </button>
      </div>

      {/* Discovered Points List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            Detected Features ({criticalPoints.length})
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">In Viewport</span>
        </div>

        {criticalPoints.length === 0 ? (
          <div className={`p-5 rounded-2xl border text-center text-xs text-slate-400 ${cardBg}`}>
            No critical points detected in the current window domain. Try expanding your bounds or zooming out.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
            {criticalPoints.map((pt) => (
              <div
                key={pt.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all hover:border-sky-500/50 ${cardBg}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`p-1 rounded-lg border flex items-center justify-center ${getBadgeColor(pt.type)}`}>
                    {getPointIcon(pt.type)}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-200">{pt.label}</span>
                    <span className="block font-mono text-[11px] text-slate-400">
                      ({pt.x}, {pt.y})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onCenterPoint(pt.x, pt.y)}
                  className="p-1.5 px-2 rounded-lg bg-slate-700/50 hover:bg-sky-600 hover:text-white text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                  title="Center graph on this point"
                >
                  <Target className="w-3 h-3" />
                  Center
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
