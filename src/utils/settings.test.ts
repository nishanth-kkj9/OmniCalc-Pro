import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadInitialSettings,
  saveSettings,
  migrateSettings,
  applyThemeBootstrap,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  SETTINGS_VERSION,
  LEGACY_SETTINGS_KEY,
} from './settings';

describe('Settings Management and Migration (BUG-02 Regression Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns DEFAULT_SETTINGS when storage is empty', () => {
    const settings = loadInitialSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('loads valid current version settings', () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      theme: 'oled' as const,
      accentColor: 'emerald' as const,
      precision: 8,
    };
    saveSettings(custom);

    const loaded = loadInitialSettings();
    expect(loaded.theme).toBe('oled');
    expect(loaded.accentColor).toBe('emerald');
    expect(loaded.precision).toBe(8);
  });

  it('sanitizes invalid or malicious property values', () => {
    const malicious = {
      theme: '<script>alert(1)</script>',
      accentColor: 'neon-pink-injection',
      precision: 9999,
      soundVolume: -10,
      maxHistoryItems: -5,
      __v: SETTINGS_VERSION,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(malicious));

    const loaded = loadInitialSettings();
    expect(loaded.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(loaded.accentColor).toBe(DEFAULT_SETTINGS.accentColor);
    expect(loaded.precision).toBe(12); // clamped to max
    expect(loaded.soundVolume).toBe(0); // clamped to min
    expect(loaded.maxHistoryItems).toBe(1); // clamped to min
  });

  it('safely rejects unsupported future or corrupted schema versions without leaking stale data', () => {
    const unsupportedPayload = {
      theme: 'light',
      customStaleField: 'stale_value_must_not_leak',
      accentColor: 'rose',
      __v: 999, // unsupported future version
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(unsupportedPayload));

    const loaded = loadInitialSettings();
    // Must return pristine DEFAULT_SETTINGS, not spreading the stale payload
    expect(loaded.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(loaded.accentColor).toBe(DEFAULT_SETTINGS.accentColor);
    expect((loaded as any).customStaleField).toBeUndefined();

    // Verifies stale item was cleaned from storage
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull();
  });

  it('migrates valid legacy unversioned settings and clears legacy key', () => {
    const legacy = {
      theme: 'light',
      accentColor: 'violet',
      precision: 4,
      soundEnabled: false,
    };
    localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(legacy));

    const loaded = loadInitialSettings();
    expect(loaded.theme).toBe('light');
    expect(loaded.accentColor).toBe('violet');
    expect(loaded.precision).toBe(4);
    expect(loaded.soundEnabled).toBe(false);

    // Should have saved to v2 key and cleared legacy key
    expect(localStorage.getItem(LEGACY_SETTINGS_KEY)).toBeNull();
    const storedV2 = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(storedV2.__v).toBe(SETTINGS_VERSION);
    expect(storedV2.theme).toBe('light');
  });

  it('migrateSettings returns null for unsupported source versions', () => {
    expect(migrateSettings({ theme: 'light' }, 99)).toBeNull();
    expect(migrateSettings(null, 1)).toBeNull();
  });

  describe('Theme Startup Bootstrap (BUG-01 Regression Tests)', () => {
    let rootElement: HTMLElement;

    beforeEach(() => {
      localStorage.clear();
      rootElement = document.createElement('html');
      rootElement.className = 'dark';
    });

    it('v2 dark setting produces dark initial document class', () => {
      saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark' });
      const theme = applyThemeBootstrap(localStorage, rootElement);
      expect(theme).toBe('dark');
      expect(rootElement.classList.contains('dark')).toBe(true);
      expect(rootElement.classList.contains('light')).toBe(false);
      expect(rootElement.classList.contains('oled')).toBe(false);
    });

    it('v2 light setting produces light initial document class', () => {
      saveSettings({ ...DEFAULT_SETTINGS, theme: 'light' });
      const theme = applyThemeBootstrap(localStorage, rootElement);
      expect(theme).toBe('light');
      expect(rootElement.classList.contains('light')).toBe(true);
      expect(rootElement.classList.contains('dark')).toBe(false);
    });

    it('v2 oled setting produces OLED initial document class', () => {
      saveSettings({ ...DEFAULT_SETTINGS, theme: 'oled' });
      const theme = applyThemeBootstrap(localStorage, rootElement);
      expect(theme).toBe('oled');
      expect(rootElement.classList.contains('oled')).toBe(true);
      expect(rootElement.classList.contains('dark')).toBe(true);
    });

    it('malformed v2 data does not break page startup and falls back to default', () => {
      localStorage.setItem(SETTINGS_KEY, '{"theme": "invalid-theme-injection", "__v": 2}');
      const theme = applyThemeBootstrap(localStorage, rootElement);
      expect(theme).toBe(DEFAULT_SETTINGS.theme);
      expect(rootElement.classList.contains(DEFAULT_SETTINGS.theme)).toBe(true);
    });

    it('legacy omnicalc_settings migration remains functional during startup bootstrap', () => {
      localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify({ theme: 'light' }));
      const theme = applyThemeBootstrap(localStorage, rootElement);
      expect(theme).toBe('light');
      expect(rootElement.classList.contains('light')).toBe(true);
      expect(localStorage.getItem(LEGACY_SETTINGS_KEY)).toBeNull();
      expect(localStorage.getItem(SETTINGS_KEY)).not.toBeNull();
    });

    it('runtime saveSettings() and startup bootstrap agree on the same source of truth', () => {
      saveSettings({ ...DEFAULT_SETTINGS, theme: 'light' });
      const bootstrapTheme = applyThemeBootstrap(localStorage, rootElement);
      const loadedSettings = loadInitialSettings();
      expect(bootstrapTheme).toBe(loadedSettings.theme);
      expect(bootstrapTheme).toBe('light');
    });
  });
});
