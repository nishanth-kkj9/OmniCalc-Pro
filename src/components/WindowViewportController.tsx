import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Maximize2,
  RotateCw,
  MoveHorizontal,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AppSettings } from '../types';

export type ViewportMode = 'fluid' | 'mobile' | 'tablet' | 'laptop' | 'desktop';
export type DeviceOrientation = 'portrait' | 'landscape';

interface WindowViewportControllerProps {
  children: React.ReactNode;
  settings: AppSettings;
  activeModeName: string;
}

const VIEWPORT_WIDTHS: Record<ViewportMode, { portrait: number; landscape: number }> = {
  fluid: { portrait: 0, landscape: 0 },
  mobile: { portrait: 390, landscape: 720 },
  tablet: { portrait: 768, landscape: 1024 },
  laptop: { portrait: 1024, landscape: 1280 },
  desktop: { portrait: 1440, landscape: 1440 },
};

export const WindowViewportController: React.FC<WindowViewportControllerProps> = ({
  children,
  settings,
  activeModeName,
}) => {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('fluid');
  const [orientation, setOrientation] = useState<DeviceOrientation>('portrait');
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showToolbar, setShowToolbar] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const initialWidth = useRef<number>(0);

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  // Handle Drag to Resize Window Width
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = (e.clientX - dragStartX.current) * 2; // dual-sided expansion from center
      const newWidth = Math.max(320, Math.min(window.innerWidth - 32, initialWidth.current + deltaX));
      setCustomWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const startResizeDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    const currentElem = containerRef.current;
    initialWidth.current = currentElem ? currentElem.offsetWidth : 800;
  };

  const handleSelectMode = (mode: ViewportMode) => {
    setViewportMode(mode);
    setCustomWidth(null);
  };

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
    setCustomWidth(null);
  };

  // Determine active frame width
  let targetWidthStyle: React.CSSProperties = { width: '100%' };
  let currentWidthPx = 0;

  if (customWidth !== null) {
    targetWidthStyle = { width: `${customWidth}px`, maxWidth: '100%' };
    currentWidthPx = customWidth;
  } else if (viewportMode !== 'fluid') {
    const w = VIEWPORT_WIDTHS[viewportMode][orientation];
    targetWidthStyle = { width: `${w}px`, maxWidth: '100%' };
    currentWidthPx = w;
  }

  // Device status header clock
  const [currentTime, setCurrentTime] = useState<string>('9:41');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const toolbarBg = isLight
    ? 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
    : isOled
      ? 'bg-zinc-950/90 border-zinc-800 text-zinc-100 shadow-md'
      : 'bg-slate-900/90 border-slate-800 text-slate-200 shadow-md';

  const activeBtnBg = 'bg-sky-600 text-white shadow-xs';
  const idleBtnBg = isLight
    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    : isOled
      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80';

  const isDeviceFramed = viewportMode === 'mobile' || viewportMode === 'tablet';

  return (
    <div className="flex flex-col w-full min-h-full items-center">
      {/* Top Floating Viewport / Window Resizer Bar */}
      {showToolbar && (
        <div className="w-full max-w-5xl px-2 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
          <div
            className={`flex flex-wrap items-center gap-1 sm:gap-1.5 p-1 rounded-2xl border backdrop-blur-md text-xs font-semibold ${toolbarBg}`}
          >
            <span className="text-[11px] text-slate-400 px-2 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">Screen Mode:</span>
            </span>

            {/* Fluid Auto Width */}
            <button
              onClick={() => handleSelectMode('fluid')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${
                viewportMode === 'fluid' && customWidth === null ? activeBtnBg : idleBtnBg
              }`}
              title="Full Fluid Responsive (100% Window Width)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Auto Fluid</span>
            </button>

            {/* Mobile View */}
            <button
              onClick={() => handleSelectMode('mobile')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${
                viewportMode === 'mobile' && customWidth === null ? activeBtnBg : idleBtnBg
              }`}
              title="Mobile Phone View (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>

            {/* Tablet View */}
            <button
              onClick={() => handleSelectMode('tablet')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${
                viewportMode === 'tablet' && customWidth === null ? activeBtnBg : idleBtnBg
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>

            {/* Laptop View */}
            <button
              onClick={() => handleSelectMode('laptop')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${
                viewportMode === 'laptop' && customWidth === null ? activeBtnBg : idleBtnBg
              }`}
              title="Laptop Display (1024px)"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Laptop</span>
            </button>

            {/* Desktop View */}
            <button
              onClick={() => handleSelectMode('desktop')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 hidden sm:flex ${
                viewportMode === 'desktop' && customWidth === null ? activeBtnBg : idleBtnBg
              }`}
              title="Desktop PC View (1440px)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>

            {/* Rotate Button (for mobile/tablet) */}
            {(viewportMode === 'mobile' || viewportMode === 'tablet') && (
              <button
                onClick={toggleOrientation}
                className={`p-1.5 rounded-xl border border-slate-700/60 ml-1 transition-all active:scale-95 ${idleBtnBg}`}
                title={`Rotate to ${orientation === 'portrait' ? 'Landscape' : 'Portrait'}`}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Live Width Badge */}
            {(viewportMode !== 'fluid' || customWidth !== null) && (
              <span className="font-mono text-[10px] text-sky-400 bg-sky-950/40 border border-sky-800/60 px-2 py-0.5 rounded-lg ml-1">
                {currentWidthPx ? `${currentWidthPx}px` : 'Auto'}
                {viewportMode !== 'fluid' ? ` · ${orientation}` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {customWidth !== null && (
              <button
                onClick={() => setCustomWidth(null)}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 bg-amber-950/30 border border-amber-800/60 px-2 py-1 rounded-xl transition-colors"
                title="Reset custom drag width"
              >
                Reset Width
              </button>
            )}

            <button
              onClick={() => setShowToolbar(false)}
              className={`p-1.5 rounded-xl border transition-colors ${idleBtnBg}`}
              title="Hide Screen Mode Toolbar (Click eye icon to restore)"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Reveal Button when toolbar is hidden */}
      {!showToolbar && (
        <button
          onClick={() => setShowToolbar(true)}
          className={`fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-2xl border text-xs font-semibold shadow-xl flex items-center gap-1.5 ${toolbarBg}`}
          title="Show Screen Mode Toolbar"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>Screen Mode</span>
        </button>
      )}

      {/* Main Resizable Workspace Container */}
      <div
        ref={containerRef}
        style={targetWidthStyle}
        className={`relative transition-[width] duration-200 ease-out flex flex-col items-center justify-start ${
          viewportMode !== 'fluid' || customWidth !== null ? 'my-3' : 'w-full'
        }`}
      >
        {/* Mobile / Tablet Simulated Device Bezel */}
        {isDeviceFramed && customWidth === null ? (
          <div
            className={`w-full rounded-[2.5rem] p-3 sm:p-4 border-4 shadow-2xl transition-all ${
              isLight
                ? 'bg-slate-900 border-slate-700 shadow-slate-400/20'
                : 'bg-black border-slate-800 shadow-black'
            }`}
          >
            {/* Phone Top Notch / Dynamic Island */}
            <div className="w-full flex items-center justify-between px-6 py-2 text-slate-400 text-xs font-mono select-none">
              <span>{currentTime}</span>
              <div className="w-24 h-4 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-slate-400 font-sans font-semibold">OmniCalc</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">5G</span>
                <div className="w-4 h-2 rounded-xs border border-slate-400 flex items-center p-0.5">
                  <div className="w-2.5 h-full bg-slate-400 rounded-xs" />
                </div>
              </div>
            </div>

            {/* Device Screen Frame */}
            <div className="w-full bg-slate-950 rounded-[2rem] overflow-hidden min-h-[560px] max-h-[82vh] overflow-y-auto border border-slate-800/80 p-2 sm:p-3">
              {children}
            </div>

            {/* Mobile Home Bar Indicator */}
            <div className="w-full flex justify-center py-2">
              <div className="w-32 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>
        ) : viewportMode === 'laptop' && customWidth === null ? (
          /* Laptop Window Frame */
          <div
            className={`w-full rounded-2xl border shadow-2xl overflow-hidden transition-all ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-800'
            }`}
          >
            {/* Laptop Window Header */}
            <div
              className={`px-4 py-2 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400">
                OmniCalc Pro · {activeModeName} (Laptop Mode · 1024px)
              </span>
              <div className="w-12" />
            </div>

            <div className="p-3 sm:p-4 overflow-x-hidden">{children}</div>
          </div>
        ) : (
          /* Fluid / Desktop / Custom Dragged Container */
          <div className="w-full relative">{children}</div>
        )}

        {/* Dual Interactive Drag-to-Resize Handles (Visible on PC / Laptop screens) */}
        <div
          onMouseDown={startResizeDrag}
          className="absolute -right-3 top-0 bottom-0 w-6 cursor-ew-resize hidden lg:flex items-center justify-center group z-30"
          title="Click and drag to resize window width"
        >
          <div className="w-1.5 h-16 rounded-full bg-slate-700/60 group-hover:bg-sky-500 transition-all flex items-center justify-center shadow-md">
            <MoveHorizontal className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div
          onMouseDown={startResizeDrag}
          className="absolute -left-3 top-0 bottom-0 w-6 cursor-ew-resize hidden lg:flex items-center justify-center group z-30"
          title="Click and drag to resize window width"
        >
          <div className="w-1.5 h-16 rounded-full bg-slate-700/60 group-hover:bg-sky-500 transition-all flex items-center justify-center shadow-md">
            <MoveHorizontal className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
};
