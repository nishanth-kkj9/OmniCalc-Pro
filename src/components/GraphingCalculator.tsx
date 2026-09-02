import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Sliders,
  Target,
  TrendingUp,
  Crosshair,
  Play,
  Pause,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { compileSafeExpression } from '../utils/calculator';
import {
  findRoots,
  findExtrema,
  findIntersections,
  computeTangentLine,
  computeDefiniteIntegral,
  CriticalPoint,
  PresetFunction,
} from '../utils/graphingEngine';
import { ExportModal } from './ExportModal';
import { ExportReportData } from '../utils/exportEngine';
import { AppSettings } from '../types';
import { GraphPresetsModal } from './graphing/GraphPresetsModal';
import { GraphAnalysisTab } from './graphing/GraphAnalysisTab';
import { GraphCalculusTab } from './graphing/GraphCalculusTab';

interface FunctionItem {
  id: string;
  expr: string;
  color: string;
  visible: boolean;
}

const DEFAULT_COLORS = ['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a78bfa', '#ec4899'];

interface GraphingCalculatorProps {
  settings: AppSettings;
}

export const GraphingCalculator: React.FC<GraphingCalculatorProps> = ({ settings }) => {
  // Functions state
  const [functions, setFunctions] = useState<FunctionItem[]>([
    { id: '1', expr: 'sin(x)', color: '#38bdf8', visible: true },
    { id: '2', expr: 'x^2 - 4', color: '#34d399', visible: true },
  ]);

  // Active control tab
  const [activeTab, setActiveTab] = useState<'functions' | 'analysis' | 'calculus' | 'table'>('functions');

  // Dynamic parameter k
  const [paramK, setParamK] = useState<number>(1.0);
  const [isAnimatingK, setIsAnimatingK] = useState<boolean>(false);

  // Viewport bounds
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-10);
  const [yMax, setYMax] = useState<number>(10);

  // Interaction states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [snapToCurve, setSnapToCurve] = useState<boolean>(true);
  const [hoverPos, setHoverPos] = useState<{
    xMath: number;
    yMath: number;
    pixelX: number;
    pixelY: number;
    snapped?: boolean;
    fnIndex?: number;
    fnColor?: string;
    slope?: number;
  } | null>(null);

  // Modals
  const [presetModalOpen, setPresetModalOpen] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // Analysis state
  const [showCriticalPoints, setShowCriticalPoints] = useState<boolean>(true);

  // Calculus tools state
  const [tangentEnabled, setTangentEnabled] = useState<boolean>(false);
  const [tangentFnIndex, setTangentFnIndex] = useState<number>(0);
  const [tangentX0, setTangentX0] = useState<number>(1.0);

  const [integralEnabled, setIntegralEnabled] = useState<boolean>(false);
  const [integralFnIndex, setIntegralFnIndex] = useState<number>(0);
  const [integralA, setIntegralA] = useState<number>(-2);
  const [integralB, setIntegralB] = useState<number>(2);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } | null>(null);

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  // Check if expression uses k parameter
  const usesParameterK = useMemo(() => {
    return functions.some((f) => /\bk\b/.test(f.expr));
  }, [functions]);

  // Compile active functions with allowed vars ['x', 'k']
  const compiledFunctions = useMemo(() => {
    return functions.map((fn) => {
      if (!fn.expr.trim()) return null;
      const res = compileSafeExpression(fn.expr, settings.angleMode, ['x', 'k']);
      return res.ok ? res.compiled : null;
    });
  }, [functions, settings.angleMode]);

  // Calculate Critical Points for visible functions within current [xMin, xMax]
  const criticalPoints = useMemo<CriticalPoint[]>(() => {
    if (!showCriticalPoints) return [];
    const pts: CriticalPoint[] = [];

    // Analyze individual functions
    functions.forEach((fn, idx) => {
      if (!fn.visible || !fn.expr.trim()) return;
      const compiled = compiledFunctions[idx];
      if (!compiled) return;

      const scope = { k: paramK };

      // 1. Roots (Zeros)
      const roots = findRoots(compiled, xMin, xMax, 160, scope);
      roots.forEach((r, rIdx) => {
        pts.push({
          id: `root-${idx}-${rIdx}-${r}`,
          type: 'root',
          x: r,
          y: 0,
          label: `f${idx + 1} Zero: x = ${r}`,
          fnIndex: idx,
        });
      });

      // 2. Y-Intercept
      if (xMin <= 0 && xMax >= 0) {
        const y0 = compiled.evaluate({ ...scope, x: 0 });
        if (y0 !== null && isFinite(y0)) {
          const y0Round = Number(y0.toFixed(4));
          pts.push({
            id: `yint-${idx}`,
            type: 'y-intercept',
            x: 0,
            y: y0Round,
            label: `f${idx + 1} Y-Intercept: (0, ${y0Round})`,
            fnIndex: idx,
          });
        }
      }

      // 3. Local Extrema
      const extrema = findExtrema(compiled, xMin, xMax, 160, scope);
      extrema.forEach((e, eIdx) => {
        pts.push({
          id: `extrema-${idx}-${eIdx}-${e.x}`,
          type: e.type,
          x: e.x,
          y: e.y,
          label: `f${idx + 1} Local ${e.type === 'max' ? 'Max' : 'Min'}: (${e.x}, ${e.y})`,
          fnIndex: idx,
        });
      });
    });

    // 4. Intersections between visible pairs
    for (let i = 0; i < functions.length; i++) {
      for (let j = i + 1; j < functions.length; j++) {
        if (!functions[i].visible || !functions[j].visible) continue;
        const c1 = compiledFunctions[i];
        const c2 = compiledFunctions[j];
        if (!c1 || !c2) continue;

        const inters = findIntersections(c1, c2, xMin, xMax, 160, { k: paramK });
        inters.forEach((pt, pIdx) => {
          pts.push({
            id: `inter-${i}-${j}-${pIdx}-${pt.x}`,
            type: 'intersection',
            x: pt.x,
            y: pt.y,
            label: `f${i + 1} ∩ f${j + 1}: (${pt.x}, ${pt.y})`,
          });
        });
      }
    }

    return pts;
  }, [functions, compiledFunctions, showCriticalPoints, xMin, xMax, paramK]);

  // Tangent line computation
  const tangentResult = useMemo(() => {
    if (!tangentEnabled || tangentFnIndex >= compiledFunctions.length) return null;
    const compiled = compiledFunctions[tangentFnIndex];
    if (!compiled) return null;
    return computeTangentLine(compiled, tangentX0, { k: paramK });
  }, [tangentEnabled, tangentFnIndex, compiledFunctions, tangentX0, paramK]);

  // Definite integral computation
  const integralResult = useMemo(() => {
    if (!integralEnabled || integralFnIndex >= compiledFunctions.length) return null;
    const compiled = compiledFunctions[integralFnIndex];
    if (!compiled) return null;
    return computeDefiniteIntegral(compiled, integralA, integralB, 100, { k: paramK });
  }, [integralEnabled, integralFnIndex, compiledFunctions, integralA, integralB, paramK]);

  // Animation loop for parameter k
  useEffect(() => {
    if (!isAnimatingK) return;
    let animId: number;
    let direction = 1;

    const loop = () => {
      setParamK((prev) => {
        let next = prev + 0.05 * direction;
        if (next > 5) {
          next = 5;
          direction = -1;
        } else if (next < -5) {
          next = -5;
          direction = 1;
        }
        return Number(next.toFixed(2));
      });
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isAnimatingK]);

  // Redraw Canvas
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Theme Palette
    const bgColor = isLight ? '#f8fafc' : isOled ? '#000000' : '#0f172a';
    const gridMajor = isLight ? '#cbd5e1' : isOled ? '#27272a' : '#1e293b';
    const axisColor = isLight ? '#475569' : isOled ? '#71717a' : '#64748b';
    const labelColor = isLight ? '#334155' : isOled ? '#a1a1aa' : '#94a3b8';

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Coordinate conversion
    const xSpan = Math.max(1e-6, xMax - xMin);
    const ySpan = Math.max(1e-6, yMax - yMin);
    const toPixelX = (x: number) => ((x - xMin) / xSpan) * width;
    const toPixelY = (y: number) => height - ((y - yMin) / ySpan) * height;

    // Grid spacing calculation
    const getGridStep = (span: number) => {
      const rough = span / 10;
      const mag = Math.pow(10, Math.floor(Math.log10(rough)));
      const norm = rough / mag;
      let step = mag;
      if (norm >= 5) step = 5 * mag;
      else if (norm >= 2) step = 2 * mag;
      return step;
    };

    const xStep = getGridStep(xSpan);
    const yStep = getGridStep(ySpan);

    // 1. Draw Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridMajor;

    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const px = toPixelX(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }

    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const py = toPixelY(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }

    // 2. Draw Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = axisColor;

    const yZeroPixel = toPixelY(0);
    const xZeroPixel = toPixelX(0);

    // X-Axis
    ctx.beginPath();
    ctx.moveTo(0, yZeroPixel);
    ctx.lineTo(width, yZeroPixel);
    ctx.stroke();

    // Y-Axis
    ctx.beginPath();
    ctx.moveTo(xZeroPixel, 0);
    ctx.lineTo(xZeroPixel, height);
    ctx.stroke();

    // 3. Axis Ticks & Numerical Labels
    ctx.fillStyle = labelColor;
    ctx.font = '10px monospace';

    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) > 1e-9) {
        const px = toPixelX(x);
        const text = Number(x.toFixed(3)).toString();
        const textY = Math.min(height - 6, Math.max(14, yZeroPixel + 14));
        ctx.fillText(text, px - 8, textY);
      }
    }

    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (Math.abs(y) > 1e-9) {
        const py = toPixelY(y);
        const text = Number(y.toFixed(3)).toString();
        const textX = Math.min(width - 28, Math.max(6, xZeroPixel + 6));
        ctx.fillText(text, textX, py + 3);
      }
    }

    // 4. Shaded Definite Integral Area (if enabled)
    if (integralEnabled && integralFnIndex < compiledFunctions.length) {
      const cFn = compiledFunctions[integralFnIndex];
      if (cFn) {
        const startX = Math.min(integralA, integralB);
        const endX = Math.max(integralA, integralB);
        const slices = 200;
        const subDx = (endX - startX) / slices;

        ctx.save();
        for (let i = 0; i < slices; i++) {
          const x1 = startX + i * subDx;
          const x2 = x1 + subDx;
          const y1 = cFn.evaluate({ k: paramK, x: x1 });
          const y2 = cFn.evaluate({ k: paramK, x: x2 });

          if (y1 !== null && y2 !== null && isFinite(y1) && isFinite(y2)) {
            const px1 = toPixelX(x1);
            const px2 = toPixelX(x2);
            const py1 = toPixelY(y1);
            const py2 = toPixelY(y2);
            const pyZero = toPixelY(0);

            ctx.beginPath();
            ctx.moveTo(px1, pyZero);
            ctx.lineTo(px1, py1);
            ctx.lineTo(px2, py2);
            ctx.lineTo(px2, pyZero);
            ctx.closePath();

            // Green for positive area, red/rose for negative
            const avgY = (y1 + y2) / 2;
            ctx.fillStyle = avgY >= 0 ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.28)';
            ctx.fill();
          }
        }

        // Boundary vertical dashed lines at a and b
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#10b981';

        [integralA, integralB].forEach((boundX) => {
          const px = toPixelX(boundX);
          ctx.beginPath();
          ctx.moveTo(px, 0);
          ctx.lineTo(px, height);
          ctx.stroke();
        });
        ctx.restore();
      }
    }

    // 5. Plot Functions
    const numPoints = width * 2;
    const dx = xSpan / numPoints;

    functions.forEach((fn, idx) => {
      if (!fn.visible || !fn.expr.trim()) return;
      const compiled = compiledFunctions[idx];
      if (!compiled) return;

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = fn.color;
      ctx.beginPath();

      let isDrawing = false;
      const scope = { k: paramK };

      for (let i = 0; i <= numPoints; i++) {
        const xMath = xMin + i * dx;
        const yMath = compiled.evaluate({ ...scope, x: xMath });

        if (yMath !== null && !isNaN(yMath) && isFinite(yMath)) {
          const px = toPixelX(xMath);
          const py = toPixelY(yMath);

          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            // Prevent drawing massive vertical lines on asymptotic jump
            if (Math.abs(py - toPixelY(yMin)) < height * 3) {
              ctx.lineTo(px, py);
            } else {
              isDrawing = false;
            }
          }
        } else {
          isDrawing = false;
        }
      }
      ctx.stroke();
    });

    // 6. Tangent Line Overlay (if enabled)
    if (tangentEnabled && tangentResult) {
      const { x0, y0, slope } = tangentResult;
      const px0 = toPixelX(x0);
      const py0 = toPixelY(y0);

      // Draw tangent line across canvas
      const x1 = xMin;
      const y1 = slope * (x1 - x0) + y0;
      const x2 = xMax;
      const y2 = slope * (x2 - x0) + y0;

      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.beginPath();
      ctx.moveTo(toPixelX(x1), toPixelY(y1));
      ctx.lineTo(toPixelX(x2), toPixelY(y2));
      ctx.stroke();

      // Point of tangency marker
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px0, py0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // 7. Critical Points Markers (if enabled)
    if (showCriticalPoints && criticalPoints.length > 0) {
      criticalPoints.forEach((pt) => {
        const px = toPixelX(pt.x);
        const py = toPixelY(pt.y);
        if (px < -10 || px > width + 10 || py < -10 || py > height + 10) return;

        let dotColor = '#10b981'; // root emerald
        if (pt.type === 'max') dotColor = '#a855f7'; // purple
        else if (pt.type === 'min') dotColor = '#f59e0b'; // amber
        else if (pt.type === 'y-intercept') dotColor = '#38bdf8'; // sky
        else if (pt.type === 'intersection') dotColor = '#06b6d4'; // cyan

        ctx.save();
        ctx.fillStyle = dotColor;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Label above point
        ctx.fillStyle = isLight ? '#1e293b' : '#f8fafc';
        ctx.font = 'bold 9px monospace';
        const labelText = `(${pt.x}, ${pt.y})`;
        ctx.fillText(labelText, px + 7, py - 6);
        ctx.restore();
      });
    }

    // 8. Hover Crosshairs & Probing HUD
    if (hoverPos) {
      const { pixelX, pixelY, snapped, fnColor } = hoverPos;

      ctx.save();
      // Drop lines to axes
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = snapped && fnColor ? fnColor : '#94a3b8';

      // Horizontal drop line
      ctx.beginPath();
      ctx.moveTo(pixelX, pixelY);
      ctx.lineTo(xZeroPixel, pixelY);
      ctx.stroke();

      // Vertical drop line
      ctx.beginPath();
      ctx.moveTo(pixelX, pixelY);
      ctx.lineTo(pixelX, yZeroPixel);
      ctx.stroke();

      // Probe bead
      ctx.setLineDash([]);
      ctx.fillStyle = snapped && fnColor ? fnColor : '#ffffff';
      ctx.beginPath();
      ctx.arc(pixelX, pixelY, snapped ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }
  }, [
    functions,
    compiledFunctions,
    xMin,
    xMax,
    yMin,
    yMax,
    paramK,
    integralEnabled,
    integralFnIndex,
    integralA,
    integralB,
    tangentEnabled,
    tangentResult,
    showCriticalPoints,
    criticalPoints,
    hoverPos,
    isLight,
    isOled,
  ]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Bounds ref for non-stale wheel event listener
  const boundsRef = useRef({ xMin, xMax, yMin, yMax });
  useEffect(() => {
    boundsRef.current = { xMin, xMax, yMin, yMax };
  }, [xMin, xMax, yMin, yMax]);

  // Non-passive Wheel Event Listener for silky-smooth zooming
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const factor = e.deltaY < 0 ? 0.82 : 1.22;
      const pixelX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const pixelY = (e.clientY - rect.top) * (canvas.height / rect.height);

      const ratioX = pixelX / canvas.width;
      const ratioY = 1 - pixelY / canvas.height;

      const { xMin: curXMin, xMax: curXMax, yMin: curYMin, yMax: curYMax } = boundsRef.current;
      const currentXSpan = curXMax - curXMin;
      const currentYSpan = curYMax - curYMin;

      const cursorX = curXMin + ratioX * currentXSpan;
      const cursorY = curYMin + ratioY * currentYSpan;

      const newXSpan = Math.max(1e-4, Math.min(1e6, currentXSpan * factor));
      const newYSpan = Math.max(1e-4, Math.min(1e6, currentYSpan * factor));

      setXMin(Number((cursorX - ratioX * newXSpan).toFixed(4)));
      setXMax(Number((cursorX + (1 - ratioX) * newXSpan).toFixed(4)));
      setYMin(Number((cursorY - ratioY * newYSpan).toFixed(4)));
      setYMax(Number((cursorY + (1 - ratioY) * newYSpan).toFixed(4)));
    };

    canvas.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheelEvent);
    };
  }, []);

  // Pointer Down (Pan Drag start)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      xMin,
      xMax,
      yMin,
      yMax,
    };
  };

  // Pointer Move (Pan Dragging + Curve Snapping Probe)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Handle Dragging
    if (isDragging && dragStartRef.current) {
      const dxPixels = e.clientX - dragStartRef.current.clientX;
      const dyPixels = e.clientY - dragStartRef.current.clientY;

      const xSpan = dragStartRef.current.xMax - dragStartRef.current.xMin;
      const ySpan = dragStartRef.current.yMax - dragStartRef.current.yMin;

      const dxMath = (dxPixels / rect.width) * xSpan;
      const dyMath = (dyPixels / rect.height) * ySpan;

      setXMin(dragStartRef.current.xMin - dxMath);
      setXMax(dragStartRef.current.xMax - dxMath);
      setYMin(dragStartRef.current.yMin + dyMath);
      setYMax(dragStartRef.current.yMax + dyMath);
      return;
    }

    // Handle Probe & Curve Snapping
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pixelX = (e.clientX - rect.left) * scaleX;
    const pixelY = (e.clientY - rect.top) * scaleY;

    const xSpan = Math.max(1e-6, xMax - xMin);
    const ySpan = Math.max(1e-6, yMax - yMin);
    const rawXMath = xMin + (pixelX / canvas.width) * xSpan;
    const rawYMath = yMax - (pixelY / canvas.height) * ySpan;

    // Snapping logic: test active curves
    let snapped = false;
    const finalXMath = rawXMath;
    let finalYMath = rawYMath;
    const finalPixelX = pixelX;
    let finalPixelY = pixelY;
    let fnIndex: number | undefined = undefined;
    let fnColor: string | undefined = undefined;
    let slope: number | undefined = undefined;

    if (snapToCurve) {
      let minDistancePixels = 30; // 30px snapping radius

      functions.forEach((fn, idx) => {
        if (!fn.visible || !fn.expr.trim()) return;
        const compiled = compiledFunctions[idx];
        if (!compiled) return;

        const yOnCurve = compiled.evaluate({ k: paramK, x: rawXMath });
        if (yOnCurve !== null && isFinite(yOnCurve)) {
          const pyCurve = canvas.height - ((yOnCurve - yMin) / ySpan) * canvas.height;
          const dist = Math.abs(pixelY - pyCurve);
          if (dist < minDistancePixels) {
            minDistancePixels = dist;
            snapped = true;
            finalYMath = yOnCurve;
            finalPixelY = pyCurve;
            fnIndex = idx;
            fnColor = fn.color;

            // Numerical instantaneous derivative
            const h = 1e-5;
            const yp = compiled.evaluate({ k: paramK, x: rawXMath + h });
            const ym = compiled.evaluate({ k: paramK, x: rawXMath - h });
            if (yp !== null && ym !== null && isFinite(yp) && isFinite(ym)) {
              slope = Number(((yp - ym) / (2 * h)).toFixed(3));
            }
          }
        }
      });
    }

    setHoverPos({
      xMath: Number(finalXMath.toFixed(3)),
      yMath: Number(finalYMath.toFixed(3)),
      pixelX: finalPixelX,
      pixelY: finalPixelY,
      snapped,
      fnIndex,
      fnColor,
      slope,
    });
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      canvasRef.current?.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  // Quick Zoom Actions
  const zoomIn = () => {
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const halfX = ((xMax - xMin) * 0.75) / 2;
    const halfY = ((yMax - yMin) * 0.75) / 2;
    setXMin(xCenter - halfX);
    setXMax(xCenter + halfX);
    setYMin(yCenter - halfY);
    setYMax(yCenter + halfY);
  };

  const zoomOut = () => {
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const halfX = ((xMax - xMin) * 1.33) / 2;
    const halfY = ((yMax - yMin) * 1.33) / 2;
    setXMin(xCenter - halfX);
    setXMax(xCenter + halfX);
    setYMin(yCenter - halfY);
    setYMax(yCenter + halfY);
  };

  const resetStandard = () => {
    setXMin(-10);
    setXMax(10);
    setYMin(-10);
    setYMax(10);
  };

  const resetTrig = () => {
    setXMin(-6.28);
    setXMax(6.28);
    setYMin(-2);
    setYMax(2);
  };

  const makeSquareAspect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const xSpan = xMax - xMin;
    const yCenter = (yMin + yMax) / 2;
    const aspect = canvas.height / canvas.width;
    const newYSpan = xSpan * aspect;
    setYMin(Number((yCenter - newYSpan / 2).toFixed(2)));
    setYMax(Number((yCenter + newYSpan / 2).toFixed(2)));
  };

  const centerOrigin = () => {
    const halfX = (xMax - xMin) / 2;
    const halfY = (yMax - yMin) / 2;
    setXMin(-halfX);
    setXMax(halfX);
    setYMin(-halfY);
    setYMax(halfY);
  };

  const centerOnPoint = (targetX: number, targetY: number) => {
    const halfX = (xMax - xMin) / 2;
    const halfY = (yMax - yMin) / 2;
    setXMin(targetX - halfX);
    setXMax(targetX + halfX);
    setYMin(targetY - halfY);
    setYMax(targetY + halfY);
  };

  // Function Management
  const addFunction = () => {
    const nextColor = DEFAULT_COLORS[functions.length % DEFAULT_COLORS.length];
    setFunctions((prev) => [
      ...prev,
      { id: Date.now().toString(), expr: '', color: nextColor, visible: true },
    ]);
  };

  const removeFunction = (id: string) => {
    setFunctions((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFunction = (id: string, key: keyof FunctionItem, val: any) => {
    setFunctions((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  // Handle Preset Injection
  const handleSelectPreset = (preset: PresetFunction) => {
    setFunctions((prev) => {
      const nextColor = DEFAULT_COLORS[prev.length % DEFAULT_COLORS.length];
      return [...prev, { id: Date.now().toString(), expr: preset.expr, color: nextColor, visible: true }];
    });
    if (preset.suggestedBounds) {
      setXMin(preset.suggestedBounds.xMin);
      setXMax(preset.suggestedBounds.xMax);
      setYMin(preset.suggestedBounds.yMin);
      setYMax(preset.suggestedBounds.yMax);
    }
  };

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'omnicalc_graph.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // Generate Table Data
  const generateTableData = () => {
    const rows = [];
    const step = 1;
    for (let x = -5; x <= 5; x += step) {
      const row: { x: number; [key: string]: number | string } = { x };
      functions.forEach((fn, idx) => {
        if (fn.expr.trim()) {
          const compiled = compiledFunctions[idx];
          if (compiled) {
            const y = compiled.evaluate({ k: paramK, x });
            row[`f${idx + 1}`] = y !== null ? Number(y.toFixed(settings.precision)) : 'Error';
          } else {
            row[`f${idx + 1}`] = 'Error';
          }
        }
      });
      rows.push(row);
    }
    return rows;
  };

  const tableData = generateTableData();
  const activeFns = functions.filter((f) => f.expr.trim());

  // Export Data Builder
  const exportReportData: ExportReportData = {
    title: 'Advanced Cartesian Function Analysis & Calculus Report',
    engine: 'Graphing Engine Pro',
    timestamp: Date.now(),
    inputDescription: activeFns.map((f, i) => `f${i + 1}(x) = ${f.expr}`).join(', ') || 'No functions',
    resultSummary: `Domain [${xMin}, ${xMax}], Range [${yMin}, ${yMax}] | Parameter k = ${paramK}${
      tangentEnabled && tangentResult ? ` | Tangent at x₀=${tangentResult.x0}: ${tangentResult.equation}` : ''
    }${integralEnabled && integralResult ? ` | Integral [${integralResult.a}, ${integralResult.b}] = ${integralResult.value}` : ''}`,
    tableHeaders: ['x', ...activeFns.map((_, i) => `f${i + 1}(x)`)],
    tableRows: tableData.map((row) => [
      row.x.toString(),
      ...activeFns.map((_, i) => (row[`f${i + 1}`] !== undefined ? String(row[`f${i + 1}`]) : '-')),
    ]),
  };

  const panelBg = isLight ? 'bg-white border-slate-200 shadow-sm' : isOled ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800 shadow-xl';

  return (
    <div className="max-w-6xl mx-auto w-full p-4 flex flex-col lg:flex-row gap-6">
      {/* Control Sidebar */}
      <div className="w-full lg:w-84 flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className={`p-1.5 rounded-2xl border flex items-center gap-1 ${panelBg}`}>
          <button
            onClick={() => setActiveTab('functions')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'functions'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Functions
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'analysis'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('calculus')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'calculus'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Calculus
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Table
          </button>
        </div>

        {/* Tab 1: Functions & Parameter k */}
        {activeTab === 'functions' && (
          <div className="flex flex-col gap-4">
            {/* Functions List */}
            <div className={`border rounded-3xl p-5 flex flex-col gap-4 ${panelBg}`}>
              <div className="flex items-center justify-between border-b border-inherit pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">Functions y = f(x)</h3>
                  <button
                    onClick={() => setPresetModalOpen(true)}
                    className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors border border-slate-700"
                    title="Browse preset math functions"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    Presets
                  </button>
                </div>
                <button
                  onClick={addFunction}
                  className="p-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                {functions.map((fn, idx) => (
                  <div key={fn.id} className="flex items-center gap-2">
                    <button
                      onClick={() => updateFunction(fn.id, 'visible', !fn.visible)}
                      className="p-1.5 text-slate-400 hover:text-slate-200"
                      aria-label={fn.visible ? "Hide function" : "Show function"}
                    >
                      {fn.visible ? (
                        <Eye className="w-4 h-4 text-sky-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-600" />
                      )}
                    </button>

                    <input
                      type="color"
                      value={fn.color}
                      onChange={(e) => updateFunction(fn.id, 'color', e.target.value)}
                      className="w-6 h-6 rounded-lg bg-transparent border-none cursor-pointer"
                      aria-label={`Color for function ${idx + 1}`}
                    />

                    <div className="flex-1 flex items-center bg-slate-800/80 border border-slate-700 focus-within:border-sky-500 rounded-xl px-2.5 py-1.5">
                      <span className="text-xs font-mono text-slate-400 mr-1.5 font-bold">
                        f{idx + 1}(x)=
                      </span>
                      <input
                        type="text"
                        value={fn.expr}
                        onChange={(e) => updateFunction(fn.id, 'expr', e.target.value)}
                        placeholder="e.g. sin(x) or k*x^2"
                        aria-label={`Expression for function ${idx + 1}`}
                        className="w-full bg-transparent text-xs font-mono text-slate-100 focus:outline-none"
                      />
                    </div>

                    {functions.length > 1 && (
                      <button
                        onClick={() => removeFunction(fn.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                        aria-label="Remove function"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Slider for Parameter k */}
            <div className={`border rounded-3xl p-4 flex flex-col gap-2.5 ${panelBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">Parameter Slider (k)</span>
                  {usesParameterK && (
                    <span className="px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                      Active in Expr
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsAnimatingK(!isAnimatingK)}
                    className={`p-1.5 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isAnimatingK
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title={isAnimatingK ? 'Pause animation' : 'Auto-animate parameter k'}
                  >
                    {isAnimatingK ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {isAnimatingK ? 'Pause' : 'Animate'}
                  </button>
                  <button
                    onClick={() => setParamK(1.0)}
                    className="p-1.5 text-slate-400 hover:text-slate-200"
                    title="Reset k to 1.0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={-10}
                  max={10}
                  step={0.1}
                  value={paramK}
                  onChange={(e) => setParamK(parseFloat(e.target.value))}
                  className="flex-1 accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <span className="font-mono text-xs font-bold text-sky-400 min-w-10 text-right">
                  k = {paramK.toFixed(1)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Use variable <code className="text-sky-300 font-mono">k</code> in any formula (e.g. <code className="text-sky-300 font-mono">k*sin(x)</code>)
              </span>
            </div>

            {/* Viewport Bounds */}
            <div className={`border rounded-3xl p-5 flex flex-col gap-3 ${panelBg}`}>
              <div className="flex items-center justify-between border-b border-inherit pb-2">
                <span className="text-xs font-bold text-slate-200">Window Bounds</span>
                <button
                  onClick={resetStandard}
                  className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Standard [-10, 10]
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block text-[10px] mb-1">xMin</label>
                  <input
                    type="number"
                    value={xMin}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setXMin(isNaN(val) ? 0 : val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] mb-1">xMax</label>
                  <input
                    type="number"
                    value={xMax}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setXMax(isNaN(val) ? 0 : val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] mb-1">yMin</label>
                  <input
                    type="number"
                    value={yMin}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setYMin(isNaN(val) ? 0 : val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] mb-1">yMax</label>
                  <input
                    type="number"
                    value={yMax}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setYMax(isNaN(val) ? 0 : val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Analysis & Key Points */}
        {activeTab === 'analysis' && (
          <div className={`border rounded-3xl p-5 ${panelBg}`}>
            <GraphAnalysisTab
              showCriticalPoints={showCriticalPoints}
              onToggleShowCriticalPoints={setShowCriticalPoints}
              criticalPoints={criticalPoints}
              onCenterPoint={centerOnPoint}
              isLight={isLight}
            />
          </div>
        )}

        {/* Tab 3: Calculus Tools */}
        {activeTab === 'calculus' && (
          <div className={`border rounded-3xl p-5 ${panelBg}`}>
            <GraphCalculusTab
              functions={functions.map((f, i) => ({ id: f.id, name: `f${i + 1}`, expr: f.expr, color: f.color }))}
              tangentEnabled={tangentEnabled}
              onToggleTangent={setTangentEnabled}
              tangentFnIndex={tangentFnIndex}
              onChangeTangentFnIndex={setTangentFnIndex}
              tangentX0={tangentX0}
              onChangeTangentX0={setTangentX0}
              tangentResult={tangentResult}
              xMin={xMin}
              xMax={xMax}
              integralEnabled={integralEnabled}
              onToggleIntegral={setIntegralEnabled}
              integralFnIndex={integralFnIndex}
              onChangeIntegralFnIndex={setIntegralFnIndex}
              integralA={integralA}
              onChangeIntegralA={setIntegralA}
              integralB={integralB}
              onChangeIntegralB={setIntegralB}
              integralResult={integralResult}
              isLight={isLight}
            />
          </div>
        )}

        {/* Tab 4: Table & Export */}
        {activeTab === 'table' && (
          <div className={`border rounded-3xl p-5 flex flex-col gap-4 ${panelBg}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sampled Function Table (-5 ≤ x ≤ 5)
            </h4>
            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-2">x</th>
                    {activeFns.map((f, i) => (
                      <th key={i} className="p-2" style={{ color: f.color }}>
                        f{i + 1}(x)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.x} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-slate-100">{row.x}</td>
                      {activeFns.map((_, i) => (
                        <td key={i} className="p-2">
                          {row[`f${i + 1}`]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={downloadCanvasImage}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-sky-400" /> Export Plot PNG
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-600/20"
          >
            <Download className="w-4 h-4" /> Full Report & LaTeX
          </button>
        </div>
      </div>

      {/* Main Graph Canvas Area */}
      <div className="flex-1 flex flex-col gap-3">
        <div className={`border rounded-3xl p-4 flex flex-col gap-3 relative overflow-hidden ${panelBg}`}>
          {/* Top Status Bar & Snapping Control */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-mono">
                {hoverPos ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-sky-400 font-bold">
                      x = {hoverPos.xMath}, y = {hoverPos.yMath}
                    </span>
                    {hoverPos.snapped && hoverPos.fnIndex !== undefined && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: `${hoverPos.fnColor}20`, color: hoverPos.fnColor }}
                      >
                        f{hoverPos.fnIndex + 1}(x)
                        {hoverPos.slope !== undefined && ` | slope m = ${hoverPos.slope}`}
                      </span>
                    )}
                  </span>
                ) : (
                  'Click & drag to pan • Scroll to zoom'
                )}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSnapToCurve(!snapToCurve)}
                className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                  snapToCurve ? 'text-sky-400' : 'text-slate-500'
                }`}
                title="Snap probe to closest curve"
              >
                <Crosshair className="w-3.5 h-3.5" />
                {snapToCurve ? 'Curve Snap ON' : 'Snap OFF'}
              </button>
            </div>
          </div>

          {/* Canvas Viewport with Floating Overlay Controls */}
          <div className="relative w-full aspect-square max-h-[540px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 touch-none">
            <canvas
              ref={canvasRef}
              width={650}
              height={650}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onMouseLeave={() => setHoverPos(null)}
              className={`w-full h-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
            />

            {/* Floating Quick Zoom & Aspect Toolbar */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl z-10">
              <button
                onClick={zoomIn}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Zoom In (Scroll Up)"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={zoomOut}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Zoom Out (Scroll Down)"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="h-px bg-slate-700 my-0.5" />
              <button
                onClick={centerOrigin}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Center Origin (0,0)"
                aria-label="Center origin"
              >
                <Compass className="w-4 h-4" />
              </button>
              <button
                onClick={makeSquareAspect}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Square 1:1 Aspect Ratio"
                aria-label="Square aspect ratio"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={resetTrig}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-[10px] font-bold font-mono"
                title="Trigonometric Window [-2π, 2π]"
                aria-label="Trigonometric window"
              >
                2π
              </button>
              <button
                onClick={resetStandard}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Reset Standard [-10, 10]"
                aria-label="Reset window"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom-left quick bounds indicator */}
            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none">
              X: [{xMin.toFixed(1)}, {xMax.toFixed(1)}] • Y: [{yMin.toFixed(1)}, {yMax.toFixed(1)}]
            </div>
          </div>
        </div>
      </div>

      {/* Preset Functions Modal */}
      <GraphPresetsModal
        isOpen={presetModalOpen}
        onClose={() => setPresetModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        isLight={isLight}
      />

      {/* Full Export Report Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={exportReportData}
        settings={settings}
      />
    </div>
  );
};
