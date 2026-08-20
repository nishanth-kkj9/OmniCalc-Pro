import { describe, it, expect, beforeEach } from 'vitest';
import { getHistory, addHistory, clearHistory, deleteHistoryItem } from './history';
import { SETTINGS_STORAGE_KEY, LEGACY_SETTINGS_STORAGE_KEY } from '../types';

describe('History Storage Utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with an empty history list', () => {
    expect(getHistory()).toEqual([]);
  });

  it('adds items to history', () => {
    const list = addHistory('2 + 2', '4', 'basic');
    expect(list.length).toBe(1);
    expect(list[0].expression).toBe('2 + 2');
    expect(list[0].result).toBe('4');
    expect(list[0].mode).toBe('basic');
  });

  it('does not save history when result is Error or empty', () => {
    const list = addHistory('2 / 0', 'Error', 'basic');
    expect(list.length).toBe(0);
  });

  it('respects maxHistoryItems setting', () => {
    for (let i = 1; i <= 10; i++) {
      addHistory(`${i} + 1`, `${i + 1}`, 'basic', { maxHistoryItems: 5 });
    }
    const history = getHistory();
    expect(history.length).toBe(5);
    expect(history[0].expression).toBe('10 + 1');
  });

  it('respects autoSaveHistory disabled setting', () => {
    const list = addHistory('10 * 10', '100', 'basic', { autoSaveHistory: false });
    expect(list.length).toBe(0);
    expect(getHistory().length).toBe(0);
  });

  it('respects autoSaveHistory disabled from localStorage omnicalc_settings_v2', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ autoSaveHistory: false }));
    const list = addHistory('10 * 10', '100', 'basic');
    expect(list.length).toBe(0);
    expect(getHistory().length).toBe(0);
  });

  it('falls back to legacy settings key if v2 is not set', () => {
    localStorage.setItem(LEGACY_SETTINGS_STORAGE_KEY, JSON.stringify({ autoSaveHistory: false }));
    const list = addHistory('10 * 10', '100', 'basic');
    expect(list.length).toBe(0);
    expect(getHistory().length).toBe(0);
  });

  it('deletes single history items', () => {
    const list = addHistory('5 + 5', '10', 'basic');
    const id = list[0].id;
    const afterDelete = deleteHistoryItem(id);
    expect(afterDelete.length).toBe(0);
    expect(getHistory().length).toBe(0);
  });

  it('clears all history', () => {
    addHistory('1 + 1', '2', 'basic');
    addHistory('3 + 3', '6', 'basic');
    expect(getHistory().length).toBe(2);

    const cleared = clearHistory();
    expect(cleared.length).toBe(0);
    expect(getHistory().length).toBe(0);
  });
});
