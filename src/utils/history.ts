import {
  HistoryItem,
  CalcMode,
  AppSettings,
  SETTINGS_STORAGE_KEY,
  LEGACY_SETTINGS_STORAGE_KEY,
} from '../types';

const STORAGE_KEY = 'omnicalc_history_v1';

export function sanitizeHistoryItem(item: unknown): HistoryItem | null {
  if (!item || typeof item !== 'object') return null;
  const h = item as Record<string, unknown>;
  if (typeof h.expression !== 'string' || typeof h.result !== 'string') return null;
  const validModes: CalcMode[] = [
    'basic',
    'scientific',
    'graphing',
    'converter',
    'finance',
    'matrix',
    'statistics',
    'programmer',
    'formulas',
    'history',
    'settings',
    'equation',
    'calculus',
    'geometry',
    'fractions',
    'datetime',
    'health',
  ];
  const mode = validModes.includes(h.mode as CalcMode) ? (h.mode as CalcMode) : 'basic';
  const timestamp =
    typeof h.timestamp === 'number' && isFinite(h.timestamp) ? h.timestamp : Date.now();
  const id = typeof h.id === 'string' && h.id.length > 0 ? h.id : 'hist_' + Date.now();
  return {
    id,
    expression: h.expression.slice(0, 1000),
    result: h.result.slice(0, 1000),
    mode,
    timestamp,
  };
}

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeHistoryItem).filter((item): item is HistoryItem => item !== null);
  } catch {
    return [];
  }
}

export function addHistory(
  expression: string,
  result: string,
  mode: CalcMode,
  settings?: Partial<AppSettings>
): HistoryItem[] {
  if (!expression || !result || result === 'Error') return getHistory();

  // Check settings if autoSave is disabled
  const autoSave = settings?.autoSaveHistory;
  let maxItems = settings?.maxHistoryItems || 100;

  if (autoSave === undefined) {
    try {
      const savedSettings =
        localStorage.getItem(SETTINGS_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.autoSaveHistory === false) return getHistory();
        if (parsed.maxHistoryItems) maxItems = parsed.maxHistoryItems;
      }
    } catch {
      // fallback to true
    }
  } else if (!autoSave) {
    return getHistory();
  }

  const current = getHistory();
  const newItem: HistoryItem = {
    id: 'hist_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    expression,
    result,
    mode,
    timestamp: Date.now(),
  };

  const updated = [newItem, ...current].slice(0, maxItems);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Quota exceeded or private browsing restrictions
    console.warn('Failed to save history to localStorage:', e);
  }
  return updated;
}

export function clearHistory(): HistoryItem[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear history:', e);
  }
  return [];
}

export function deleteHistoryItem(id: string): HistoryItem[] {
  const current = getHistory().filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to delete history item:', e);
  }
  return current;
}
