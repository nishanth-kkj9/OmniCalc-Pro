import React from 'react';
import { Crosshair, Move } from 'lucide-react';
import { GraphViewport, Point2D } from '../../types';

export interface GraphStatusBarProps {
  viewport: GraphViewport;
  tracePoint: Point2D | null;
  isTraceActive: boolean;
  activeExprLabel?: string;
  angleMode: string;
  theme: 'dark' | 'light' | 'oled';
}

export const GraphStatusBar: React.FC<GraphStatusBarProps> = ({
  viewport,
  tracePoint,
  isTraceActive,
  activeExprLabel,
  angleMode,
  theme,
}) => {
  const isLight = theme === 'light';

  const xRangeStr = `[${viewport.xMin.toFixed(2)}, ${viewport.xMax.toFixed(2)}]`;
  const yRangeStr = `[${viewport.yMin.toFixed(2)}, ${viewport.yMax.toFixed(2)}]`;

  return (
    <div
      className={`w-full px-3 py-1.5 border-t text-[11px] font-mono flex items-center justify-between gap-2 overflow-x-auto select-none flex-shrink-0 ${
        isLight
          ? 'bg-slate-100/90 border-slate-200 text-slate-600'
          : 'bg-slate-950/90 border-slate-800/80 text-slate-400'
      }`}
    >
      {/* Left: Viewport Bounds */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Move className="w-3 h-3 text-slate-400" />
          <span>
            X: <strong className="text-slate-300 font-semibold">{xRangeStr}</strong>
          </span>
        </div>
        <div>
          <span>
            Y: <strong className="text-slate-300 font-semibold">{yRangeStr}</strong>
          </span>
        </div>
      </div>

      {/* Center/Right: Trace Readout & Angle Mode */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {isTraceActive && tracePoint ? (
          <div className="flex items-center gap-1 text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/30">
            <Crosshair className="w-3 h-3 animate-pulse" />
            <span>
              {activeExprLabel ? `${activeExprLabel}: ` : ''}({tracePoint.x.toFixed(4)}, {tracePoint.y.toFixed(4)})
            </span>
          </div>
        ) : (
          <span className="text-slate-400 hidden sm:inline">Pan: Drag | Zoom: Scroll</span>
        )}

        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
            {angleMode}
          </span>
        </div>
      </div>
    </div>
  );
};
