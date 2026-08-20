import { HistoryItem, CalcMode, AppSettings, SETTINGS_STORAGE_KEY, LEGACY_SETTINGS_STORAGE_KEY } from '../types';

const STORAGE_KEY = 'omnicalc_history_v1';

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
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
  const current = getHistory().filter(item => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to delete history item:', e);
  }
  return current;
}
