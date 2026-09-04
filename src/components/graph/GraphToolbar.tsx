import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Home,
  Maximize2,
  Crosshair,
  Settings,
  Download,
  Table as TableIcon,
  SlidersHorizontal,
  FolderOpen,
  Undo2,
  Redo2,
  ChevronDown,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AppSettings, GraphSession } from '../../types';

export interface GraphToolbarProps {
  settings: AppSettings;
  isTraceActive: boolean;
  onToggleTrace: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  activeTab: 'expressions' | 'table' | 'analysis' | 'sliders' | 'sessions';
  onSelectTab: (tab: 'expressions' | 'table' | 'analysis' | 'sliders' | 'sessions') => void;
  onOpenSettings: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  sessions: GraphSession[];
  onLoadSession: (session: GraphSession) => void;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  settings,
  isTraceActive,
  onToggleTrace,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitAll,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  activeTab,
  onSelectTab,
  onOpenSettings,
  onExportPng,
  onExportSvg,
  onExportJson,
  onExportCsv,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const toolbarBg = isLight
    ? 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
    : isOled
      ? 'bg-black/95 border-zinc-800 text-white'
      : 'bg-slate-900/90 border-slate-800 text-slate-100';

  const btnIdle = isLight
    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
    : isOled
      ? 'text-zinc-400 hover:text-white hover:bg-zinc-900 active:scale-95'
      : 'text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95';

  const btnActive = 'bg-sky-500/20 text-sky-400 border border-sky-500/30';

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`w-full px-3 py-2 border-b flex items-center justify-between gap-2 overflow-x-auto select-none ${toolbarBg}`}
    >
      {/* Left: View Modes & Tabs */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onSelectTab('expressions')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'expressions' ? btnActive : btnIdle
          }`}
          title="Function Expressions list"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Functions</span>
        </button>

        <button
          onClick={() => onSelectTab('analysis')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'analysis' ? btnActive : btnIdle
          }`}
          title="Analyze roots, extrema, intersections, derivative, integral"
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Analysis</span>
        </button>

        <button
          onClick={() => onSelectTab('table')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'table' ? btnActive : btnIdle
          }`}
          title="Table of numerical values (x, y)"
        >
          <TableIcon className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Table</span>
        </button>

        <button
          onClick={() => onSelectTab('sliders')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'sliders' ? btnActive : btnIdle
          }`}
          title="Parameter sliders (a, b, c, k)"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Sliders</span>
        </button>

        <button
          onClick={() => onSelectTab('sessions')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'sessions' ? btnActive : btnIdle
          }`}
          title="Saved sessions & mathematical presets"
        >
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Presets</span>
        </button>
      </div>

      {/* Right: Graph Interaction Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-xl transition-colors ${canUndo ? btnIdle : 'opacity-30 cursor-not-allowed text-slate-500'}`}
          title="Undo (Ctrl + Z)"
          aria-label="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-xl transition-colors ${canRedo ? btnIdle : 'opacity-30 cursor-not-allowed text-slate-500'}`}
          title="Redo (Ctrl + Shift + Z)"
          aria-label="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-700/50 mx-0.5" />

        {/* Trace Mode Toggle */}
        <button
          onClick={onToggleTrace}
          className={`px-2 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
            isTraceActive
              ? 'bg-sky-500 text-white font-semibold shadow-xs'
              : btnIdle
          }`}
          title="Trace Mode (T) - Inspect coordinates along curves"
          aria-label="Toggle trace mode"
        >
          <Crosshair className="w-4 h-4" />
          <span className="hidden md:inline">Trace</span>
        </button>

        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          className={`p-1.5 rounded-xl transition-colors ${btnIdle}`}
          title="Zoom In (+)"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          className={`p-1.5 rounded-xl transition-colors ${btnIdle}`}
          title="Zoom Out (−)"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Reset View */}
        <button
          onClick={onResetView}
          className={`p-1.5 rounded-xl transition-colors ${btnIdle}`}
          title="Reset to Default View (-10 to 10)"
          aria-label="Reset view"
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Fit All */}
        <button
          onClick={onFitAll}
          className={`p-1.5 rounded-xl transition-colors ${btnIdle}`}
          title="Fit All Curves into View (F)"
          aria-label="Fit all curves"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-700/50 mx-0.5" />

        {/* Export Dropdown */}
        <div ref={exportRef} className="relative">
          <button
            onClick={() => setExportOpen((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors ${btnIdle}`}
            title="Export Graph (PNG, SVG, JSON, CSV)"
            aria-label="Export menu"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {exportOpen && (
            <div
              className={`absolute right-0 top-full mt-1.5 w-44 rounded-2xl border p-1 z-50 shadow-xl ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : isOled ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}
            >
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExportPng();
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-sky-500/10 hover:text-sky-400 transition-colors flex items-center justify-between"
              >
                <span>Download PNG</span>
                <span className="text-[10px] font-mono text-slate-400">Bitmap</span>
              </button>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExportSvg();
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-sky-500/10 hover:text-sky-400 transition-colors flex items-center justify-between"
              >
                <span>Download SVG</span>
                <span className="text-[10px] font-mono text-slate-400">Vector</span>
              </button>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExportJson();
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-sky-500/10 hover:text-sky-400 transition-colors flex items-center justify-between"
              >
                <span>Export Session JSON</span>
                <span className="text-[10px] font-mono text-slate-400">File</span>
              </button>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExportCsv();
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-sky-500/10 hover:text-sky-400 transition-colors flex items-center justify-between"
              >
                <span>Export Table CSV</span>
                <span className="text-[10px] font-mono text-slate-400">Data</span>
              </button>
            </div>
          )}
        </div>

        {/* Graph Settings Toggle */}
        <button
          onClick={onOpenSettings}
          className={`p-1.5 rounded-xl transition-colors ${btnIdle}`}
          title="Graph Settings (Grid, Axes, Aspect Ratio)"
          aria-label="Graph settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
