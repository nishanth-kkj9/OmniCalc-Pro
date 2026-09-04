import { GraphSession, GraphViewport, GraphSettings, CurveSegment, GraphExpression } from '../types';
import { generateCSV, downloadTextFile } from './exportEngine';
import { generateAxisTicks } from './graph';

/**
 * Exports an HTML Canvas directly as a PNG image download.
 */
export function exportCanvasAsPng(canvas: HTMLCanvasElement, filename: string = 'omnicalc-graph.png'): void {
  try {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('PNG export failed:', err);
  }
}

export interface SvgExportOptions {
  viewport: GraphViewport;
  settings: GraphSettings;
  expressions: GraphExpression[];
  segmentsMap: Map<string, CurveSegment[]>;
  theme: 'dark' | 'light' | 'oled';
  width?: number;
  height?: number;
}

/**
 * Generates an SVG vector graphic string representation of the graph.
 */
export function exportGraphAsSvg(options: SvgExportOptions): string {
  const {
    viewport,
    settings,
    expressions,
    segmentsMap,
    theme,
    width = 1000,
    height = 650,
  } = options;

  const isLight = theme === 'light';
  const isOled = theme === 'oled';

  const bgColor = isLight ? '#ffffff' : isOled ? '#000000' : '#090d16';
  const gridColor = isLight ? '#e2e8f0' : '#1e293b';
  const axisColor = isLight ? '#475569' : '#94a3b8';
  const textColor = isLight ? '#64748b' : '#94a3b8';

  const toSvgX = (gx: number) => ((gx - viewport.xMin) / (viewport.xMax - viewport.xMin)) * width;
  const toSvgY = (gy: number) => ((viewport.yMax - gy) / (viewport.yMax - viewport.yMin)) * height;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `  <style>\n`;
  svg += `    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: 11px; }\n`;
  svg += `  </style>\n`;
  svg += `  <!-- Background -->\n`;
  svg += `  <rect width="${width}" height="${height}" fill="${bgColor}" />\n`;

  // Grid
  if (settings.showGrid) {
    svg += `  <!-- Grid Lines -->\n`;
    const xTicks = generateAxisTicks(viewport.xMin, viewport.xMax, width, true, viewport, { width, height });
    const yTicks = generateAxisTicks(viewport.yMin, viewport.yMax, height, false, viewport, { width, height });

    svg += `  <g stroke="${gridColor}" stroke-width="1">\n`;
    for (const xt of xTicks) {
      const sx = toSvgX(xt.value);
      svg += `    <line x1="${sx.toFixed(1)}" y1="0" x2="${sx.toFixed(1)}" y2="${height}" />\n`;
    }
    for (const yt of yTicks) {
      const sy = toSvgY(yt.value);
      svg += `    <line x1="0" y1="${sy.toFixed(1)}" x2="${width}" y2="${sy.toFixed(1)}" />\n`;
    }
    svg += `  </g>\n`;
  }

  // Axes
  if (settings.showAxes) {
    svg += `  <!-- Axes -->\n`;
    const originX = toSvgX(0);
    const originY = toSvgY(0);

    svg += `  <g stroke="${axisColor}" stroke-width="1.5">\n`;
    if (originY >= 0 && originY <= height) {
      svg += `    <line x1="0" y1="${originY.toFixed(1)}" x2="${width}" y2="${originY.toFixed(1)}" />\n`;
    }
    if (originX >= 0 && originX <= width) {
      svg += `    <line x1="${originX.toFixed(1)}" y1="0" x2="${originX.toFixed(1)}" y2="${height}" />\n`;
    }
    svg += `  </g>\n`;

    // Ticks labels
    if (settings.showAxisLabels) {
      svg += `  <!-- Axis Labels -->\n`;
      svg += `  <g fill="${textColor}">\n`;
      const xTicks = generateAxisTicks(viewport.xMin, viewport.xMax, width, true, viewport, { width, height });
      const yTicks = generateAxisTicks(viewport.yMin, viewport.yMax, height, false, viewport, { width, height });

      const labelY = Math.max(16, Math.min(height - 6, originY + 14));
      for (const xt of xTicks) {
        if (Math.abs(xt.value) < 1e-10) continue;
        const sx = toSvgX(xt.value);
        svg += `    <text x="${sx.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle">${xt.label}</text>\n`;
      }

      const labelX = Math.max(6, Math.min(width - 40, originX + 6));
      for (const yt of yTicks) {
        if (Math.abs(yt.value) < 1e-10) continue;
        const sy = toSvgY(yt.value);
        svg += `    <text x="${labelX.toFixed(1)}" y="${(sy + 4).toFixed(1)}" text-anchor="start">${yt.label}</text>\n`;
      }
      svg += `  </g>\n`;
    }
  }

  // Curves
  svg += `  <!-- Curves -->\n`;
  for (const expr of expressions) {
    if (!expr.visible) continue;
    const segments = segmentsMap.get(expr.id) || [];
    const strokeDash = expr.lineStyle === 'dashed' ? ' stroke-dasharray="6,4"' : expr.lineStyle === 'dotted' ? ' stroke-dasharray="2,3"' : '';

    for (const seg of segments) {
      if (seg.points.length < 2) continue;
      let d = '';
      for (let i = 0; i < seg.points.length; i++) {
        const sx = toSvgX(seg.points[i].x);
        const sy = toSvgY(seg.points[i].y);
        d += i === 0 ? `M ${sx.toFixed(1)} ${sy.toFixed(1)}` : ` L ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      }
      svg += `  <path d="${d}" fill="none" stroke="${expr.color}" stroke-width="${expr.lineWidth}" stroke-linecap="round" stroke-linejoin="round"${strokeDash} />\n`;
    }
  }

  svg += `</svg>\n`;
  return svg;
}

/**
 * Downloads a generated SVG file.
 */
export function downloadSvgGraph(options: SvgExportOptions, filename: string = 'omnicalc-graph.svg'): void {
  const svgContent = exportGraphAsSvg(options);
  downloadTextFile(filename, svgContent, 'image/svg+xml');
}

/**
 * Exports a GraphSession as a validated JSON file.
 */
export function downloadSessionJson(session: GraphSession, filename?: string): void {
  const name = filename || `${session.title.toLowerCase().replace(/\s+/g, '-') || 'graph-session'}.json`;
  const json = JSON.stringify(session, null, 2);
  downloadTextFile(name, json, 'application/json');
}

/**
 * Downloads table of values as CSV.
 */
export function downloadTableAsCsv(
  headers: string[],
  rows: (string | number)[][],
  filename: string = 'table-of-values.csv'
): void {
  const csv = generateCSV(headers, rows);
  downloadTextFile(filename, csv, 'text/csv');
}
