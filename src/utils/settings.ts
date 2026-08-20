import { AppSettings, CalcMode, AngleMode } from '../types';

export const SETTINGS_KEY = 'omnicalc_settings_v2';
export const SETTINGS_VERSION = 2;
export const LEGACY_SETTINGS_KEY = 'omnicalc_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'sky',
  angleMode: 'DEG',
  precision: 6,
  notation: 'standard',
  thousandsSeparator: 'comma',
  fontSize: 'normal',
  soundEnabled: true,
  soundVolume: 0.5,
  soundProfile: 'mechanical',
  hapticFeedback: false,
  defaultMode: 'basic',
  maxHistoryItems: 100,
  autoSaveHistory: true,
};

const VALID_THEMES: ReadonlySet<string> = new Set(['dark', 'light', 'oled']);
const VALID_ACCENTS: ReadonlySet<string> = new Set(['sky', 'emerald', 'violet', 'amber', 'rose', 'cyan']);
const VALID_ANGLE_MODES: ReadonlySet<string> = new Set(['DEG', 'RAD', 'GRAD']);
const VALID_NOTATIONS: ReadonlySet<string> = new Set(['standard', 'scientific', 'engineering']);
const VALID_THOUSANDS: ReadonlySet<string> = new Set(['comma', 'space', 'period', 'none']);
const VALID_FONT_SIZES: ReadonlySet<string> = new Set(['compact', 'normal', 'large']);
const VALID_SOUND_PROFILES: ReadonlySet<string> = new Set(['mechanical', 'soft', 'beep', 'tap']);
const VALID_CALC_MODES: ReadonlySet<string> = new Set([
  'basic',
  'scientific',
  'programmer',
  'graphing',
  'converter',
  'finance',
  'matrix',
  'statistics',
  'equation',
  'calculus',
  'datetime',
  'health',
  'geometry',
  'fractions',
  'formulas',
  'history',
  'settings',
]);

/**
 * Validates and sanitizes settings against strict schema rules and boundaries.
 */
export function sanitizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const obj = raw as Record<string, unknown>;

  const theme = typeof obj.theme === 'string' && VALID_THEMES.has(obj.theme)
    ? (obj.theme as AppSettings['theme'])
    : DEFAULT_SETTINGS.theme;

  const accentColor = typeof obj.accentColor === 'string' && VALID_ACCENTS.has(obj.accentColor)
    ? (obj.accentColor as AppSettings['accentColor'])
    : DEFAULT_SETTINGS.accentColor;

  const angleMode = typeof obj.angleMode === 'string' && VALID_ANGLE_MODES.has(obj.angleMode)
    ? (obj.angleMode as AngleMode)
    : DEFAULT_SETTINGS.angleMode;

  const precision = typeof obj.precision === 'number' && Number.isFinite(obj.precision)
    ? Math.max(0, Math.min(12, Math.round(obj.precision)))
    : DEFAULT_SETTINGS.precision;

  const notation = typeof obj.notation === 'string' && VALID_NOTATIONS.has(obj.notation)
    ? (obj.notation as AppSettings['notation'])
    : DEFAULT_SETTINGS.notation;

  const thousandsSeparator = typeof obj.thousandsSeparator === 'string' && VALID_THOUSANDS.has(obj.thousandsSeparator)
    ? (obj.thousandsSeparator as AppSettings['thousandsSeparator'])
    : DEFAULT_SETTINGS.thousandsSeparator;

  const fontSize = typeof obj.fontSize === 'string' && VALID_FONT_SIZES.has(obj.fontSize)
    ? (obj.fontSize as AppSettings['fontSize'])
    : DEFAULT_SETTINGS.fontSize;

  const soundEnabled = typeof obj.soundEnabled === 'boolean'
    ? obj.soundEnabled
    : DEFAULT_SETTINGS.soundEnabled;

  const soundVolume = typeof obj.soundVolume === 'number' && Number.isFinite(obj.soundVolume)
    ? Math.max(0, Math.min(1, obj.soundVolume))
    : DEFAULT_SETTINGS.soundVolume;

  const soundProfile = typeof obj.soundProfile === 'string' && VALID_SOUND_PROFILES.has(obj.soundProfile)
    ? (obj.soundProfile as AppSettings['soundProfile'])
    : DEFAULT_SETTINGS.soundProfile;

  const hapticFeedback = typeof obj.hapticFeedback === 'boolean'
    ? obj.hapticFeedback
    : DEFAULT_SETTINGS.hapticFeedback;

  const defaultMode = typeof obj.defaultMode === 'string' && VALID_CALC_MODES.has(obj.defaultMode)
    ? (obj.defaultMode as CalcMode)
    : DEFAULT_SETTINGS.defaultMode;

  const maxHistoryItems = typeof obj.maxHistoryItems === 'number' && Number.isFinite(obj.maxHistoryItems)
    ? Math.max(1, Math.min(1000, Math.round(obj.maxHistoryItems)))
    : DEFAULT_SETTINGS.maxHistoryItems;

  const autoSaveHistory = typeof obj.autoSaveHistory === 'boolean'
    ? obj.autoSaveHistory
    : DEFAULT_SETTINGS.autoSaveHistory;

  return {
    theme,
    accentColor,
    angleMode,
    precision,
    notation,
    thousandsSeparator,
    fontSize,
    soundEnabled,
    soundVolume,
    soundProfile,
    hapticFeedback,
    defaultMode,
    maxHistoryItems,
    autoSaveHistory,
  };
}

/**
 * Explicit migration function for upgrading legacy settings to the current version schema.
 * Returns null if the source version is unsupported, signaling a clean reset to defaults.
 */
export function migrateSettings(raw: unknown, sourceVersion?: number): AppSettings | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // Version 2 is current
  if (sourceVersion === SETTINGS_VERSION) {
    return sanitizeSettings(raw);
  }

  // Version 1 or unversioned legacy schema migration
  if (sourceVersion === 1 || sourceVersion === undefined) {
    const legacy = raw as Record<string, unknown>;
    const migrated: Partial<AppSettings> = {};

    if (typeof legacy.theme === 'string') migrated.theme = legacy.theme as AppSettings['theme'];
    if (typeof legacy.accentColor === 'string') migrated.accentColor = legacy.accentColor as AppSettings['accentColor'];
    if (typeof legacy.angleMode === 'string') migrated.angleMode = legacy.angleMode as AngleMode;
    if (typeof legacy.precision === 'number') migrated.precision = legacy.precision;
    if (typeof legacy.soundEnabled === 'boolean') migrated.soundEnabled = legacy.soundEnabled;
    if (typeof legacy.autoSaveHistory === 'boolean') migrated.autoSaveHistory = legacy.autoSaveHistory;
    if (typeof legacy.defaultMode === 'string') migrated.defaultMode = legacy.defaultMode as CalcMode;

    return sanitizeSettings({ ...DEFAULT_SETTINGS, ...migrated });
  }

  // Unsupported or invalid future/incompatible schema version
  return null;
}

/**
 * Safe initializer that loads, validates, migrates, or resets persisted application settings.
 * Ensures that stale or unsupported payloads are NEVER returned or mixed into the current session.
 */
export function loadInitialSettings(storage?: Storage): AppSettings {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const saved = store.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const version = typeof parsed.__v === 'number' ? parsed.__v : undefined;
        
        if (version === SETTINGS_VERSION) {
          return sanitizeSettings(parsed);
        }

        // Schema version mismatch - attempt explicit migration
        const migrated = migrateSettings(parsed, version);
        if (migrated) {
          try {
            store.setItem(SETTINGS_KEY, JSON.stringify({ ...migrated, __v: SETTINGS_VERSION }));
          } catch {
            // storage write failure handled gracefully
          }
          return migrated;
        }

        // Incompatible / unsupported version: safely clean storage and return fresh DEFAULT_SETTINGS
        store.removeItem(SETTINGS_KEY);
        return { ...DEFAULT_SETTINGS };
      }
    }

    // Check legacy key if v2 not present
    const legacy = store.getItem(LEGACY_SETTINGS_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      const migrated = migrateSettings(parsedLegacy, 1);
      if (migrated) {
        try {
          store.setItem(SETTINGS_KEY, JSON.stringify({ ...migrated, __v: SETTINGS_VERSION }));
          store.removeItem(LEGACY_SETTINGS_KEY);
        } catch {
          // storage write failure handled gracefully
        }
        return migrated;
      }
      store.removeItem(LEGACY_SETTINGS_KEY);
    }

    return { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persists current settings to localStorage with schema version tag.
 */
export function saveSettings(settings: AppSettings, storage?: Storage): void {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return;

  try {
    store.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, __v: SETTINGS_VERSION }));
  } catch (e) {
    console.warn('Failed to persist omnicalc_settings:', e);
  }
}
