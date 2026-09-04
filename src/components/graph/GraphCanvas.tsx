import React, { useRef, useEffect, useCallback } from 'react';
import {
  GraphViewport,
  GraphSettings,
  GraphExpression,
  CurveSegment,
  Point2D,
  GraphRoot,
  GraphExtremum,
  GraphIntersection,
} from '../../types';
import {
  graphToScreen,
  screenToGraph,
  generateAxisTicks,
  zoomViewportAroundPoint,
  panViewport,
} from '../../utils/graph';

export interface GraphCanvasProps {
  viewport: GraphViewport;
  onUpdateViewport: (newVp: GraphViewport) => void;
  settings: GraphSettings;
  expressions: GraphExpression[];
  segmentsMap: Map<string, CurveSegment[]>;
  activeExpressionId?: string;
  theme: 'dark' | 'light' | 'oled';
  accentColor: string;
  isTraceActive: boolean;
  tracePoint: Point2D | null;
  onTraceMove?: (pt: Point2D | null, exprId?: string) => void;
  analysisMarkers?: {
    roots: GraphRoot[];
    extrema: GraphExtremum[];
    intersections: GraphIntersection[];
    tangentLine?: { x0: number; y0: number; slope: number } | null;
    normalLine?: { x0: number; y0: number; slope: number | null; isVertical: boolean } | null;
    integralPolygon?: Point2D[] | null;
    integralLabel?: string | null;
  };
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  viewport,
  onUpdateViewport,
  settings,
  expressions,
  segmentsMap,
  activeExpressionId,
  theme,
  isTraceActive,
  tracePoint,
  onTraceMove,
  analysisMarkers,
  canvasRef: externalCanvasRef,
}) => {
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchViewportRef = useRef<GraphViewport | null>(null);

  const isLight = theme === 'light';
  const isOled = theme === 'oled';

  // Core Render Function
  const render = useCallback(() => {
    const cvs = externalCanvasRef?.current || localCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = cvs.clientWidth;
    const height = cvs.clientHeight;

    if (width <= 0 || height <= 0) return;

    // Synchronize physical and logical dimensions
    if (cvs.width !== width * dpr || cvs.height !== height * dpr) {
      cvs.width = width * dpr;
      cvs.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const dims = { width, height };

    // 1. Background
    const bgFill = isLight ? '#ffffff' : isOled ? '#000000' : '#080c14';
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, width, height);

    // 2. Minor & Major Grid Lines
    if (settings.showGrid) {
      const xTicks = generateAxisTicks(viewport.xMin, viewport.xMax, width, true, viewport, dims);
      const yTicks = generateAxisTicks(viewport.yMin, viewport.yMax, height, false, viewport, dims);

      const majorGridColor = isLight ? 'rgba(226, 232, 240, 0.9)' : isOled ? 'rgba(39, 39, 42, 0.6)' : 'rgba(30, 41, 59, 0.7)';
      const minorGridColor = isLight ? 'rgba(241, 245, 249, 0.6)' : isOled ? 'rgba(24, 24, 27, 0.4)' : 'rgba(15, 23, 42, 0.5)';

      // Minor grid
      if (settings.showMinorGrid && xTicks.length > 1) {
        const xStep = Math.abs(xTicks[1].value - xTicks[0].value);
        const minorStep = xStep / 5;
        ctx.strokeStyle = minorGridColor;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        for (let gx = Math.floor(viewport.xMin / minorStep) * minorStep; gx <= viewport.xMax; gx += minorStep) {
          const sx = graphToScreen(gx, 0, viewport, dims).x;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height);
        }
        const yStep = Math.abs(yTicks[1]?.value - yTicks[0]?.value) || xStep;
        const yMinorStep = yStep / 5;
        for (let gy = Math.floor(viewport.yMin / yMinorStep) * yMinorStep; gy <= viewport.yMax; gy += yMinorStep) {
          const sy = graphToScreen(0, gy, viewport, dims).y;
          ctx.moveTo(0, sy);
          ctx.lineTo(width, sy);
        }
        ctx.stroke();
      }

      // Major grid
      ctx.strokeStyle = majorGridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const xt of xTicks) {
        const sx = graphToScreen(xt.value, 0, viewport, dims).x;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
      }
      for (const yt of yTicks) {
        const sy = graphToScreen(0, yt.value, viewport, dims).y;
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
      }
      ctx.stroke();
    }

    // 3. Shaded Area under curve (if requested in analysis)
    if (analysisMarkers?.integralPolygon && analysisMarkers.integralPolygon.length > 2) {
      ctx.save();
      ctx.fillStyle = isLight ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      const first = graphToScreen(analysisMarkers.integralPolygon[0].x, analysisMarkers.integralPolygon[0].y, viewport, dims);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < analysisMarkers.integralPolygon.length; i++) {
        const scr = graphToScreen(analysisMarkers.integralPolygon[i].x, analysisMarkers.integralPolygon[i].y, viewport, dims);
        ctx.lineTo(scr.x, scr.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 4. Coordinate Axes (X and Y)
    if (settings.showAxes) {
      const axisColor = isLight ? '#475569' : isOled ? '#71717a' : '#94a3b8';
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1.75;
      ctx.beginPath();

      const origin = graphToScreen(0, 0, viewport, dims);

      // X Axis
      if (origin.y >= 0 && origin.y <= height) {
        ctx.moveTo(0, origin.y);
        ctx.lineTo(width, origin.y);
      }
      // Y Axis
      if (origin.x >= 0 && origin.x <= width) {
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, height);
      }
      ctx.stroke();

      // Axis Ticks & Numerical Labels
      if (settings.showAxisLabels) {
        const textColor = isLight ? '#475569' : isOled ? '#a1a1aa' : '#94a3b8';
        ctx.fillStyle = textColor;
        ctx.font = '10px "JetBrains Mono", monospace';

        const xTicks = generateAxisTicks(viewport.xMin, viewport.xMax, width, true, viewport, dims);
        const yTicks = generateAxisTicks(viewport.yMin, viewport.yMax, height, false, viewport, dims);

        // X Labels
        const labelY = Math.max(14, Math.min(height - 4, origin.y + 14));
        ctx.textAlign = 'center';
        for (const xt of xTicks) {
          if (Math.abs(xt.value) < 1e-10) continue;
          const sx = graphToScreen(xt.value, 0, viewport, dims).x;
          ctx.fillText(xt.label, sx, labelY);
        }

        // Y Labels
        const labelX = Math.max(4, Math.min(width - 32, origin.x + 6));
        ctx.textAlign = 'left';
        for (const yt of yTicks) {
          if (Math.abs(yt.value) < 1e-10) continue;
          const sy = graphToScreen(0, yt.value, viewport, dims).y;
          ctx.fillText(yt.label, labelX, sy + 3);
        }

        // Origin '0'
        if (origin.x >= 12 && origin.x <= width - 12 && origin.y >= 12 && origin.y <= height - 12) {
          ctx.fillText('0', origin.x - 10, origin.y + 12);
        }
      }
    }

    // 5. Tangent & Normal lines (if enabled from analysis)
    if (analysisMarkers?.tangentLine) {
      const { x0, y0, slope } = analysisMarkers.tangentLine;
      const xLeft = viewport.xMin;
      const yLeft = y0 + slope * (xLeft - x0);
      const xRight = viewport.xMax;
      const yRight = y0 + slope * (xRight - x0);

      const pLeft = graphToScreen(xLeft, yLeft, viewport, dims);
      const pRight = graphToScreen(xRight, yRight, viewport, dims);

      ctx.save();
      ctx.strokeStyle = '#eab308'; // Yellow for tangent
      ctx.lineWidth = 1.75;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.stroke();
      ctx.restore();
    }

    if (analysisMarkers?.normalLine) {
      const { x0, y0, slope, isVertical } = analysisMarkers.normalLine;
      ctx.save();
      ctx.strokeStyle = '#ec4899'; // Pink for normal
      ctx.lineWidth = 1.75;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();

      if (isVertical) {
        const topP = graphToScreen(x0, viewport.yMax, viewport, dims);
        const botP = graphToScreen(x0, viewport.yMin, viewport, dims);
        ctx.moveTo(topP.x, topP.y);
        ctx.lineTo(botP.x, botP.y);
      } else if (slope !== null) {
        const pLeft = graphToScreen(viewport.xMin, y0 + slope * (viewport.xMin - x0), viewport, dims);
        const pRight = graphToScreen(viewport.xMax, y0 + slope * (viewport.xMax - x0), viewport, dims);
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 6. Function Curves
    for (const expr of expressions) {
      if (!expr.visible) continue;
      const segments = segmentsMap.get(expr.id);
      if (!segments || segments.length === 0) continue;

      const isActive = expr.id === activeExpressionId;
      ctx.save();
      ctx.strokeStyle = expr.color;
      ctx.lineWidth = isActive ? expr.lineWidth + 1.2 : expr.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (expr.lineStyle === 'dashed') {
        ctx.setLineDash([7, 5]);
      } else if (expr.lineStyle === 'dotted') {
        ctx.setLineDash([2.5, 3.5]);
      } else {
        ctx.setLineDash([]);
      }

      for (const seg of segments) {
        if (seg.points.length < 2) continue;
        ctx.beginPath();
        const start = graphToScreen(seg.points[0].x, seg.points[0].y, viewport, dims);
        ctx.moveTo(start.x, start.y);

        for (let i = 1; i < seg.points.length; i++) {
          const pt = graphToScreen(seg.points[i].x, seg.points[i].y, viewport, dims);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Optional Curve Label near rightmost segment
      if (settings.showCurveLabels && expr.label) {
        const lastSeg = segments[segments.length - 1];
        if (lastSeg && lastSeg.points.length > 0) {
          const lastPt = lastSeg.points[lastSeg.points.length - 1];
          const scrPt = graphToScreen(lastPt.x, lastPt.y, viewport, dims);
          ctx.fillStyle = expr.color;
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(expr.label, Math.min(width - 70, scrPt.x + 6), Math.max(16, Math.min(height - 10, scrPt.y - 4)));
        }
      }

      ctx.restore();
    }

    // 7. Analysis Markers (Roots, Extrema, Intersections)
    if (analysisMarkers) {
      // Roots (Emerald circles)
      for (const r of analysisMarkers.roots) {
        const pt = graphToScreen(r.x, r.y, viewport, dims);
        if (pt.x >= 0 && pt.x <= width && pt.y >= 0 && pt.y <= height) {
          ctx.save();
          ctx.fillStyle = '#10b981';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // Extrema (Amber/Rose diamonds)
      for (const e of analysisMarkers.extrema) {
        const pt = graphToScreen(e.x, e.y, viewport, dims);
        if (pt.x >= 0 && pt.x <= width && pt.y >= 0 && pt.y <= height) {
          ctx.save();
          ctx.fillStyle = e.type === 'max' ? '#f43f5e' : '#f59e0b';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - 5);
          ctx.lineTo(pt.x + 5, pt.y);
          ctx.lineTo(pt.x, pt.y + 5);
          ctx.lineTo(pt.x - 5, pt.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // Intersections (Sky double-ring dots)
      for (const inter of analysisMarkers.intersections) {
        const pt = graphToScreen(inter.x, inter.y, viewport, dims);
        if (pt.x >= 0 && pt.x <= width && pt.y >= 0 && pt.y <= height) {
          ctx.save();
          ctx.fillStyle = '#38bdf8';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 8. Trace Crosshair & Target Dot
    if (isTraceActive && tracePoint) {
      const scr = graphToScreen(tracePoint.x, tracePoint.y, viewport, dims);
      ctx.save();

      // Crosshair lines
      ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(scr.x, 0);
      ctx.lineTo(scr.x, height);
      ctx.moveTo(0, scr.y);
      ctx.lineTo(width, scr.y);
      ctx.stroke();

      // Active Target point
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Floating coordinate pill tooltip
      const coordText = `(${tracePoint.x.toFixed(3)}, ${tracePoint.y.toFixed(3)})`;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(coordText).width;
      const pillW = textWidth + 14;
      const pillH = 22;

      let pillX = scr.x + 10;
      let pillY = scr.y - 28;
      if (pillX + pillW > width) pillX = scr.x - pillW - 10;
      if (pillY < 10) pillY = scr.y + 12;

      ctx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(coordText, pillX + 7, pillY + 15);

      ctx.restore();
    }

    ctx.restore();
  }, [
    viewport,
    settings,
    expressions,
    segmentsMap,
    activeExpressionId,
    isTraceActive,
    tracePoint,
    analysisMarkers,
    externalCanvasRef,
    isLight,
    isOled,
  ]);

  // Request Animation Frame on state changes
  useEffect(() => {
    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  // ResizeObserver on container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      render();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [render]);

  // Mouse wheel zoom centered at cursor position
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const cvs = externalCanvasRef?.current || localCanvasRef.current;
      if (!cvs) return;

      const rect = cvs.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const cursorGraph = screenToGraph(sx, sy, viewport, { width: cvs.clientWidth, height: cvs.clientHeight });
      const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87;
      const newVp = zoomViewportAroundPoint(viewport, cursorGraph.x, cursorGraph.y, zoomFactor);
      onUpdateViewport(newVp);
    },
    [viewport, onUpdateViewport, externalCanvasRef]
  );

  // Mouse drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const cvs = externalCanvasRef?.current || localCanvasRef.current;
      if (!cvs) return;

      const rect = cvs.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const dims = { width: cvs.clientWidth, height: cvs.clientHeight };

      if (isDraggingRef.current) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        dragStartRef.current = { x: e.clientX, y: e.clientY };

        const newVp = panViewport(viewport, deltaX, deltaY, dims);
        onUpdateViewport(newVp);
        return;
      }

      // Trace mode hover tracking
      if (isTraceActive && onTraceMove) {
        const graphCoords = screenToGraph(sx, sy, viewport, dims);
        // Find closest point on active curve or visible curves
        let bestPt: Point2D | null = null;
        let bestDist = Infinity;
        let bestExprId = activeExpressionId;

        expressions.forEach((expr) => {
          if (!expr.visible) return;
          const segments = segmentsMap.get(expr.id) || [];
          segments.forEach((seg) => {
            seg.points.forEach((pt) => {
              const dx = pt.x - graphCoords.x;
              const dy = pt.y - graphCoords.y;
              const dist = dx * dx + dy * dy;
              if (dist < bestDist) {
                bestDist = dist;
                bestPt = pt;
                bestExprId = expr.id;
              }
            });
          });
        });

        if (bestPt) {
          onTraceMove(bestPt, bestExprId);
        } else {
          onTraceMove(graphCoords, activeExpressionId);
        }
      }
    },
    [viewport, onUpdateViewport, isTraceActive, onTraceMove, expressions, segmentsMap, activeExpressionId, externalCanvasRef]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Touch gestures for mobile/tablet (pan & pinch-to-zoom)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialPinchDistRef.current = dist;
      initialPinchViewportRef.current = { ...viewport };
    }
  }, [viewport]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const cvs = externalCanvasRef?.current || localCanvasRef.current;
      if (!cvs) return;
      const dims = { width: cvs.clientWidth, height: cvs.clientHeight };

      if (e.touches.length === 1 && isDraggingRef.current) {
        e.preventDefault();
        const deltaX = e.touches[0].clientX - dragStartRef.current.x;
        const deltaY = e.touches[0].clientY - dragStartRef.current.y;
        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        const newVp = panViewport(viewport, deltaX, deltaY, dims);
        onUpdateViewport(newVp);
      } else if (e.touches.length === 2 && initialPinchDistRef.current && initialPinchViewportRef.current) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (currentDist > 0 && initialPinchDistRef.current > 0) {
          const ratio = initialPinchDistRef.current / currentDist;
          const rect = cvs.getBoundingClientRect();
          const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
          const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
          const centerGraph = screenToGraph(midX, midY, initialPinchViewportRef.current, dims);
          const newVp = zoomViewportAroundPoint(initialPinchViewportRef.current, centerGraph.x, centerGraph.y, ratio);
          onUpdateViewport(newVp);
        }
      }
    },
    [viewport, onUpdateViewport, externalCanvasRef]
  );

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    initialPinchDistRef.current = null;
    initialPinchViewportRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] select-none overflow-hidden touch-none"
    >
      <canvas
        ref={externalCanvasRef || localCanvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full block cursor-crosshair focus:outline-none"
        tabIndex={0}
        role="img"
        aria-label="Interactive Cartesian mathematical graph workspace"
      />
    </div>
  );
};
