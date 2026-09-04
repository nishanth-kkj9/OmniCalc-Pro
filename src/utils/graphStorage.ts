import { GraphSession, GraphExpression, GraphViewport, GraphSettings, GraphSlider } from '../types';
import { DEFAULT_VIEWPORT, GRAPH_PALETTE } from './graph';
import { MAX_EXPRESSION_LENGTH } from '../constants/limits';

export const GRAPH_STORAGE_KEY = 'omnicalc_graph_sessions_v1';
export const GRAPH_SCHEMA_VERSION = 1;

export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  showGrid: true,
  showMinorGrid: true,
  showAxes: true,
  showAxisLabels: true,
  showCoordinates: true,
  showCurveLabels: false,
  lockAspectRatio: false,
};

export const PRESET_SESSIONS: GraphSession[] = [
  {
    id: 'preset-quadratic',
    title: 'Quadratic & Roots',
    version: 1,
    timestamp: 1700000000000,
    viewport: { xMin: -6, xMax: 6, yMin: -6, yMax: 8 },
    settings: { ...DEFAULT_GRAPH_SETTINGS },
    sliders: [],
    expressions: [
      {
        id: 'p1',
        expression: 'x^2 - 4',
        visible: true,
        color: '#38bdf8',
        lineWidth: 2.5,
        lineStyle: 'solid',
        label: 'Parabola',
      },
      {
        id: 'p2',
        expression: '2*x + 1',
        visible: true,
        color: '#f43f5e',
        lineWidth: 2,
        lineStyle: 'dashed',
        label: 'Linear Intersect',
      },
    ],
  },
  {
    id: 'preset-trig',
    title: 'Trigonometric Waves',
    version: 1,
    timestamp: 1700000000001,
    viewport: { xMin: -10, xMax: 10, yMin: -3, yMax: 3 },
    settings: { ...DEFAULT_GRAPH_SETTINGS },
    sliders: [],
    expressions: [
      {
        id: 't1',
        expression: 'sin(x)',
        visible: true,
        color: '#10b981',
        lineWidth: 2.5,
        lineStyle: 'solid',
        label: 'sin(x)',
      },
      {
        id: 't2',
        expression: 'cos(x)',
        visible: true,
        color: '#a855f7',
        lineWidth: 2,
        lineStyle: 'solid',
        label: 'cos(x)',
      },
    ],
  },
  {
    id: 'preset-rational',
    title: 'Rational Function & Asymptotes',
    version: 1,
    timestamp: 1700000000002,
    viewport: { xMin: -8, xMax: 8, yMin: -8, yMax: 8 },
    settings: { ...DEFAULT_GRAPH_SETTINGS },
    sliders: [],
    expressions: [
      {
        id: 'r1',
        expression: '1/x',
        visible: true,
        color: '#f59e0b',
        lineWidth: 2.5,
        lineStyle: 'solid',
        label: 'Hyperbola (1/x)',
      },
    ],
  },
  {
    id: 'preset-cubic',
    title: 'Cubic & Local Extrema',
    version: 1,
    timestamp: 1700000000003,
    viewport: { xMin: -4, xMax: 4, yMin: -5, yMax: 5 },
    settings: { ...DEFAULT_GRAPH_SETTINGS },
    sliders: [],
    expressions: [
      {
        id: 'c1',
        expression: 'x^3 - 3*x',
        visible: true,
        color: '#06b6d4',
        lineWidth: 2.5,
        lineStyle: 'solid',
        label: 'x³ - 3x',
      },
    ],
  },
  {
    id: 'preset-exp-log',
    title: 'Exponential & Logarithm',
    version: 1,
    timestamp: 1700000000004,
    viewport: { xMin: -5, xMax: 6, yMin: -5, yMax: 6 },
    settings: { ...DEFAULT_GRAPH_SETTINGS },
    sliders: [],
    expressions: [
      {
        id: 'e1',
        expression: 'e^x',
        visible: true,
        color: '#ec4899',
        lineWidth: 2.5,
        lineStyle: 'solid',
        label: 'e^x',
      },
      {
        id: 'e2',
        expression: 'ln(x)',
        visible: true,
        color: '#6366f1',
        lineWidth: 2,
        lineStyle: 'solid',
        label: 'ln(x)',
      },
    ],
  },
  {
    id: 'preset-circle',
    title: 'Circle (Upper & Lower Semicircles)',
    version: 1,
    timestamp: 1700000000005,
    viewport: { xMin: -7, xMax: 7, yMin: -7, yMax: 7 },
    settings: { ...DEFAULT_GRAPH_SETTINGS },
    sliders: [],
    expressions: [
      {
        id: 'cr1',
        expression: 'sqrt(25 - x^2)',
        visible: true,
        color: '#84cc16',
        lineWidth: 2.5,
        lineStyle: 'solid',
        domainMin: -5,
        domainMax: 5,
        label: 'Upper',
      },
      {
        id: 'cr2',
        expression: '-sqrt(25 - x^2)',
        visible: true,
        color: '#84cc16',
        lineWidth: 2.5,
        lineStyle: 'solid',
        domainMin: -5,
        domainMax: 5,
        label: 'Lower',
      },
    ],
  },
  {
    id: 'preset-slider-damped',
    title: 'Parameter Sliders (a·x² + b)',
    version: 1,
    timestamp: 1700000000006,
    viewport: { xMin: -8, xMax: 8, yMin: -5, yMax: 10 },
    settings: { ...DEFAULT_GRAPH_SETTINGS },
    sliders: [
      { id: 's1', name: 'a', value: 1, min: -3, max: 3, step: 0.1 },
      { id: 's2', name: 'b', value: -2, min: -5, max: 5, step: 0.5 },
    ],
    expressions: [
      {
        id: 'sl1',
        expression: 'a*x^2 + b',
        visible: true,
        color: '#38bdf8',
        lineWidth: 2.5,
        lineStyle: 'solid',
        label: 'a·x² + b',
      },
    ],
  },
];

/**
 * Loads all saved user graph sessions from localStorage.
 */
export function loadGraphSessions(storage?: Storage): GraphSession[] {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return [];

  try {
    const raw = store.getItem(GRAPH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => sanitizeGraphSession(item))
      .filter((s): s is GraphSession => s !== null);
  } catch {
    return [];
  }
}

/**
 * Saves a graph session into storage.
 */
export function saveGraphSession(session: GraphSession, storage?: Storage): void {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return;

  try {
    const sessions = loadGraphSessions(store);
    const existingIdx = sessions.findIndex((s) => s.id === session.id);
    const sanitized = sanitizeGraphSession(session);
    if (!sanitized) return;

    if (existingIdx >= 0) {
      sessions[existingIdx] = sanitized;
    } else {
      sessions.unshift(sanitized);
    }

    store.setItem(GRAPH_STORAGE_KEY, JSON.stringify(sessions.slice(0, 30)));
  } catch (err) {
    console.warn('Failed to save graph session:', err);
  }
}

/**
 * Deletes a session by ID.
 */
export function deleteGraphSession(id: string, storage?: Storage): void {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return;

  try {
    const sessions = loadGraphSessions(store);
    const filtered = sessions.filter((s) => s.id !== id);
    store.setItem(GRAPH_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete graph session:', err);
  }
}

/**
 * Validates and sanitizes a GraphSession payload to ensure no malicious code or malformed structures.
 */
export function sanitizeGraphSession(raw: unknown): GraphSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const id = typeof obj.id === 'string' && obj.id ? obj.id.slice(0, 64) : `sess_${Date.now()}`;
  const title = typeof obj.title === 'string' ? obj.title.slice(0, 60) : 'Untitled Graph';
  const version = typeof obj.version === 'number' ? obj.version : 1;
  const timestamp = typeof obj.timestamp === 'number' ? obj.timestamp : Date.now();

  // Viewport validation
  let viewport: GraphViewport = { ...DEFAULT_VIEWPORT };
  if (obj.viewport && typeof obj.viewport === 'object') {
    const vp = obj.viewport as Record<string, unknown>;
    const xMin = typeof vp.xMin === 'number' && Number.isFinite(vp.xMin) ? vp.xMin : -10;
    const xMax = typeof vp.xMax === 'number' && Number.isFinite(vp.xMax) ? vp.xMax : 10;
    const yMin = typeof vp.yMin === 'number' && Number.isFinite(vp.yMin) ? vp.yMin : -10;
    const yMax = typeof vp.yMax === 'number' && Number.isFinite(vp.yMax) ? vp.yMax : 10;

    if (xMin < xMax && yMin < yMax) {
      viewport = { xMin, xMax, yMin, yMax };
    }
  }

  // Settings validation
  const settings: GraphSettings = {
    showGrid: typeof (obj.settings as any)?.showGrid === 'boolean' ? (obj.settings as any).showGrid : true,
    showMinorGrid: typeof (obj.settings as any)?.showMinorGrid === 'boolean' ? (obj.settings as any).showMinorGrid : true,
    showAxes: typeof (obj.settings as any)?.showAxes === 'boolean' ? (obj.settings as any).showAxes : true,
    showAxisLabels: typeof (obj.settings as any)?.showAxisLabels === 'boolean' ? (obj.settings as any).showAxisLabels : true,
    showCoordinates: typeof (obj.settings as any)?.showCoordinates === 'boolean' ? (obj.settings as any).showCoordinates : true,
    showCurveLabels: typeof (obj.settings as any)?.showCurveLabels === 'boolean' ? (obj.settings as any).showCurveLabels : false,
    lockAspectRatio: typeof (obj.settings as any)?.lockAspectRatio === 'boolean' ? (obj.settings as any).lockAspectRatio : false,
  };

  // Expressions validation
  const rawExpressions = Array.isArray(obj.expressions) ? obj.expressions : [];
  const expressions: GraphExpression[] = [];

  for (const rawExpr of rawExpressions.slice(0, 20)) {
    if (!rawExpr || typeof rawExpr !== 'object') continue;
    const exprObj = rawExpr as Record<string, unknown>;

    const exprText = typeof exprObj.expression === 'string' ? exprObj.expression.slice(0, MAX_EXPRESSION_LENGTH) : '';
    if (!exprText.trim()) continue;

    const exprId = typeof exprObj.id === 'string' ? exprObj.id.slice(0, 32) : `expr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const visible = typeof exprObj.visible === 'boolean' ? exprObj.visible : true;
    const color = typeof exprObj.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(exprObj.color) ? exprObj.color : GRAPH_PALETTE[expressions.length % GRAPH_PALETTE.length];
    const lineWidth = typeof exprObj.lineWidth === 'number' && exprObj.lineWidth >= 1 && exprObj.lineWidth <= 8 ? exprObj.lineWidth : 2.5;
    const lineStyle = exprObj.lineStyle === 'dashed' || exprObj.lineStyle === 'dotted' ? exprObj.lineStyle : 'solid';
    const label = typeof exprObj.label === 'string' ? exprObj.label.slice(0, 40) : undefined;
    const domainMin = typeof exprObj.domainMin === 'number' && Number.isFinite(exprObj.domainMin) ? exprObj.domainMin : undefined;
    const domainMax = typeof exprObj.domainMax === 'number' && Number.isFinite(exprObj.domainMax) ? exprObj.domainMax : undefined;

    expressions.push({
      id: exprId,
      expression: exprText,
      visible,
      color,
      lineWidth,
      lineStyle,
      label,
      domainMin,
      domainMax,
    });
  }

  // Sliders validation
  const rawSliders = Array.isArray(obj.sliders) ? obj.sliders : [];
  const sliders: GraphSlider[] = [];

  for (const rawSlider of rawSliders.slice(0, 6)) {
    if (!rawSlider || typeof rawSlider !== 'object') continue;
    const sObj = rawSlider as Record<string, unknown>;
    const sName = typeof sObj.name === 'string' && /^[a-zA-Z]$/.test(sObj.name) ? sObj.name.toLowerCase() : null;
    if (!sName || sName === 'x') continue; // cannot use x as slider

    const sVal = typeof sObj.value === 'number' && Number.isFinite(sObj.value) ? sObj.value : 1;
    const sMin = typeof sObj.min === 'number' && Number.isFinite(sObj.min) ? sObj.min : -10;
    const sMax = typeof sObj.max === 'number' && Number.isFinite(sObj.max) ? sObj.max : 10;
    const sStep = typeof sObj.step === 'number' && sObj.step > 0 ? sObj.step : 0.1;

    sliders.push({
      id: typeof sObj.id === 'string' ? sObj.id : `sl_${sName}`,
      name: sName,
      value: sVal,
      min: sMin,
      max: sMax,
      step: sStep,
    });
  }

  return {
    id,
    title,
    version,
    expressions: expressions.length > 0 ? expressions : [
      {
        id: 'default_1',
        expression: 'x^2',
        visible: true,
        color: '#38bdf8',
        lineWidth: 2.5,
        lineStyle: 'solid',
      }
    ],
    sliders,
    viewport,
    settings,
    timestamp,
  };
}
