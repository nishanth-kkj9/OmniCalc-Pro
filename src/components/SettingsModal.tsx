import React, { useState, useRef } from 'react';
import { AppSettings, AngleMode, CalcMode } from '../types';
import { APP_NAME, APP_VERSION } from '../constants/version';
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Trash2,
  Check,
  Download,
  Upload,
  RotateCcw,
  Sliders,
  Palette,
  Cpu,
  Keyboard,
  Database,
  Volume1,
  Vibrate,
  Eye,
  Info,
} from 'lucide-react';
import { playClickSound } from '../utils/sound';
import { getHistory, clearHistory } from '../utils/history';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

const ACCENT_COLORS = [
  { id: 'sky', label: 'Sky Blue', hex: '#0284c7', ring: 'ring-sky-500', bg: 'bg-sky-600' },
  {
    id: 'emerald',
    label: 'Emerald Green',
    hex: '#059669',
    ring: 'ring-emerald-500',
    bg: 'bg-emerald-600',
  },
  {
    id: 'violet',
    label: 'Violet Indigo',
    hex: '#7c3aed',
    ring: 'ring-violet-500',
    bg: 'bg-violet-600',
  },
  { id: 'amber', label: 'Amber Gold', hex: '#d97706', ring: 'ring-amber-500', bg: 'bg-amber-600' },
  { id: 'rose', label: 'Rose Pink', hex: '#e11d48', ring: 'ring-rose-500', bg: 'bg-rose-600' },
  { id: 'cyan', label: 'Cyan Teal', hex: '#0891b2', ring: 'ring-cyan-500', bg: 'bg-cyan-600' },
] as const;

const MODES_LIST: { mode: CalcMode; label: string }[] = [
  { mode: 'basic', label: 'Basic Calculator' },
  { mode: 'scientific', label: 'Scientific Calculator' },
  { mode: 'fractions', label: 'Fractions & Number Theory' },
  { mode: 'geometry', label: 'Triangle & Geometry Solver' },
  { mode: 'equation', label: 'Equation & System Solver' },
  { mode: 'calculus', label: 'Calculus & Numerical Suite' },
  { mode: 'graphing', label: 'Graphing Calculator' },
  { mode: 'programmer', label: 'Programmer Calculator' },
  { mode: 'converter', label: 'Unit Converter' },
  { mode: 'finance', label: 'Finance & Loan EMI' },
  { mode: 'datetime', label: 'Date & Time Calculator' },
  { mode: 'health', label: 'Health & Fitness Suite' },
  { mode: 'matrix', label: 'Matrix Calculator' },
  { mode: 'statistics', label: 'Statistics Calculator' },
  { mode: 'formulas', label: 'Formulas & Constants' },
  { mode: 'history', label: 'Calculation History' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<
    'general' | 'appearance' | 'math' | 'audio' | 'storage' | 'shortcuts'
  >('general');
  const [saveAlert, setSaveAlert] = useState<string | null>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [confirmFactoryReset, setConfirmFactoryReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setSaveAlert(msg);
    setTimeout(() => setSaveAlert(null), 3000);
  };

  // Sample live formatted output calculation
  const getSampleFormattedNumber = () => {
    const rawNumber = 1234567.89012345;
    const precision = settings.precision;

    if (settings.notation === 'scientific') {
      return rawNumber.toExponential(precision);
    }
    if (settings.notation === 'engineering') {
      const exp = Math.floor(Math.log10(Math.abs(rawNumber)) / 3) * 3;
      const mantissa = rawNumber / Math.pow(10, exp);
      return `${mantissa.toFixed(precision)}e${exp >= 0 ? '+' : ''}${exp}`;
    }

    // Standard notation with thousands separator
    const fixed = rawNumber.toFixed(precision);
    const parts = fixed.split('.');

    if (settings.thousandsSeparator === 'comma') {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    } else if (settings.thousandsSeparator === 'space') {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return parts.join('.');
    } else if (settings.thousandsSeparator === 'period') {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return parts.join(',');
    }
    return fixed;
  };

  // Export JSON backup
  const handleExportData = () => {
    try {
      const historyData = getHistory();
      const exportObj = {
        app: 'OmniCalc Pro',
        version: '3.0',
        exportedAt: new Date().toISOString(),
        settings,
        history: historyData,
      };

      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `omnicalc_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showNotification('Backup file successfully exported!');
    } catch {
      showNotification('Export failed.');
    }
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) {
          onUpdateSettings(parsed.settings);
        }
        if (Array.isArray(parsed.history)) {
          localStorage.setItem('omnicalc_history_v1', JSON.stringify(parsed.history));
        }
        showNotification('Backup successfully imported and restored!');
      } catch {
        showNotification('Invalid JSON backup file format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearHistory = () => {
    clearHistory();
    setConfirmClearHistory(false);
    showNotification('Calculation history cleared.');
  };

  const handleFactoryReset = () => {
    localStorage.clear();
    setConfirmFactoryReset(false);
    window.location.reload();
  };

  const testAudio = () => {
    playClickSound('equals', settings.soundVolume, settings.soundProfile);
    if (settings.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const historyCount = getHistory().length;
  const storageEstimatedKb = Math.round((JSON.stringify(localStorage).length * 2) / 1024);

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : isOled
      ? 'bg-black border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl';

  const innerDisplayBg = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : isOled
      ? 'bg-zinc-950 border-zinc-800 text-white'
      : 'bg-slate-950 border-slate-800 text-slate-100';

  const groupContainerBg = isLight
    ? 'bg-slate-100 border-slate-200'
    : isOled
      ? 'bg-zinc-900 border-zinc-800'
      : 'bg-slate-800 border-slate-700';

  const idleOptionClass = isLight
    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
    : isOled
      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60';

  const dividerClass = isLight
    ? 'border-slate-200'
    : isOled
      ? 'border-zinc-800'
      : 'border-slate-800';
  const titleClass = isLight ? 'text-slate-900' : 'text-slate-100';
  const subtitleClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const labelClass = isLight ? 'text-slate-800' : 'text-slate-200';

  return (
    <div className="max-w-4xl mx-auto w-full p-2 sm:p-4 flex flex-col gap-6">
      {/* Toast notification banner */}
      {saveAlert && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {saveAlert}
          </span>
          <button onClick={() => setSaveAlert(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Interactive Display Preview Box */}
      <div
        className={`${cardBg} border rounded-3xl p-5 shadow-xl flex flex-col gap-3 transition-colors`}
      >
        <div className="flex items-center justify-between text-xs">
          <span
            className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
          >
            <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Live Display Preview
          </span>
          <span className={`text-[11px] font-mono ${subtitleClass}`}>
            Angle: <strong style={{ color: 'var(--accent)' }}>{settings.angleMode}</strong> |
            Format: <strong className="text-emerald-500">{settings.notation}</strong>
          </span>
        </div>

        {/* Display Simulator */}
        <div
          className={`
          ${innerDisplayBg} border rounded-2xl p-4 flex flex-col justify-end items-end min-h-[90px] shadow-inner transition-all
          ${settings.fontSize === 'large' ? 'text-3xl' : settings.fontSize === 'compact' ? 'text-xl' : 'text-2xl'}
        `}
        >
          <div className={`text-xs font-mono mb-1 flex items-center gap-2 ${subtitleClass}`}>
            <span>sin(45°) + log(1000) × 1234567.89</span>
          </div>
          <div
            className="font-mono font-bold tracking-tight flex items-center gap-2"
            style={{ color: 'var(--accent)' }}
          >
            <span>=</span>
            <span>{getSampleFormattedNumber()}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className={`flex items-center gap-2 text-xs ${subtitleClass}`}>
            <span>
              Theme:{' '}
              <strong className="capitalize" style={{ color: 'var(--accent)' }}>
                {settings.theme}
              </strong>
            </span>
            <span>•</span>
            <span>
              Sound Profile:{' '}
              <strong className={`capitalize ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {settings.soundProfile}
              </strong>
            </span>
            <span>•</span>
            <span>
              Volume:{' '}
              <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                {Math.round(settings.soundVolume * 100)}%
              </strong>
            </span>
          </div>
          <button
            onClick={testAudio}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all shadow-xs ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Play Sound Test
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'general', label: 'General & Defaults', icon: <Sliders className="w-3.5 h-3.5" /> },
          {
            id: 'appearance',
            label: 'Appearance & Theme',
            icon: <Palette className="w-3.5 h-3.5" />,
          },
          { id: 'math', label: 'Math Engine & Formats', icon: <Cpu className="w-3.5 h-3.5" /> },
          { id: 'audio', label: 'Audio & Tactile', icon: <Volume1 className="w-3.5 h-3.5" /> },
          { id: 'storage', label: 'Storage & Backup', icon: <Database className="w-3.5 h-3.5" /> },
          {
            id: 'shortcuts',
            label: 'Keyboard Shortcuts',
            icon: <Keyboard className="w-3.5 h-3.5" />,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={isActive ? { backgroundColor: 'var(--accent)' } : undefined}
              className={`
                px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 shadow-xs
                ${
                  isActive
                    ? 'text-white border-transparent shadow-md'
                    : isLight
                      ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      : isOled
                        ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                        : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Card Body */}
      <div
        className={`${cardBg} border rounded-3xl p-6 shadow-xl flex flex-col gap-6 transition-colors`}
      >
        {/* TAB 1: GENERAL & DEFAULTS */}
        {activeTab === 'general' && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${titleClass}`}>
                General Preferences
              </h3>
              <p className={`text-xs ${subtitleClass}`}>
                Configure default startup mode and workspace behavior
              </p>
            </div>

            {/* Default Startup Engine */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b ${dividerClass} gap-2`}
            >
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>Default Startup Engine</div>
                <div className={`text-xs ${subtitleClass}`}>
                  Calculator mode opened automatically on application load
                </div>
              </div>
              <select
                value={settings.defaultMode}
                onChange={(e) => onUpdateSettings({ defaultMode: e.target.value as CalcMode })}
                className={`font-medium text-xs rounded-xl p-2.5 focus:outline-none border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : isOled
                      ? 'bg-zinc-900 border-zinc-700 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-100'
                }`}
              >
                {MODES_LIST.map((m) => (
                  <option key={m.mode} value={m.mode}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Save History */}
            <div className={`flex items-center justify-between py-3 border-b ${dividerClass}`}>
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>Auto-Record History</div>
                <div className={`text-xs ${subtitleClass}`}>
                  Automatically store every calculation in the history log
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ autoSaveHistory: !settings.autoSaveHistory })}
                style={settings.autoSaveHistory ? { backgroundColor: 'var(--accent)' } : undefined}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                  settings.autoSaveHistory
                    ? 'justify-end shadow-md'
                    : isLight
                      ? 'bg-slate-300 justify-start'
                      : 'bg-slate-800 border border-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Max History Items */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>Maximum History Entries</div>
                <div className={`text-xs ${subtitleClass}`}>
                  Number of past expressions retained in local storage
                </div>
              </div>
              <div className={`flex items-center gap-1 p-1 rounded-2xl border ${groupContainerBg}`}>
                {[25, 50, 100, 250].map((num) => {
                  const isSel = settings.maxHistoryItems === num;
                  return (
                    <button
                      key={num}
                      onClick={() => onUpdateSettings({ maxHistoryItems: num })}
                      style={isSel ? { backgroundColor: 'var(--accent)' } : undefined}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        isSel ? 'text-white shadow' : idleOptionClass
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPEARANCE & THEME */}
        {activeTab === 'appearance' && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${titleClass}`}>
                Appearance & Styling
              </h3>
              <p className={`text-xs ${subtitleClass}`}>
                Customize color theme, accent palette, and display font scaling
              </p>
            </div>

            {/* Theme Select */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b ${dividerClass} gap-2`}
            >
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>Color Theme</div>
                <div className={`text-xs ${subtitleClass}`}>
                  Choose your preferred visual atmosphere
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 p-1 rounded-2xl border ${groupContainerBg}`}
              >
                {/* Dark Slate Theme */}
                <button
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  style={
                    settings.theme === 'dark' ? { backgroundColor: 'var(--accent)' } : undefined
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.theme === 'dark' ? 'text-white shadow-md' : idleOptionClass
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark Slate
                  {settings.theme === 'dark' && <Check className="w-3 h-3 ml-0.5" />}
                </button>

                {/* OLED Black Theme */}
                <button
                  onClick={() => onUpdateSettings({ theme: 'oled' })}
                  style={
                    settings.theme === 'oled' ? { backgroundColor: 'var(--accent)' } : undefined
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.theme === 'oled' ? 'text-white shadow-md' : idleOptionClass
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> OLED Black
                  {settings.theme === 'oled' && <Check className="w-3 h-3 ml-0.5" />}
                </button>

                {/* Light Theme */}
                <button
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  style={
                    settings.theme === 'light' ? { backgroundColor: 'var(--accent)' } : undefined
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.theme === 'light' ? 'text-white shadow-md' : idleOptionClass
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light
                  {settings.theme === 'light' && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              </div>
            </div>

            {/* Accent Color Palette */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b ${dividerClass} gap-2`}
            >
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>Primary Accent Color</div>
                <div className={`text-xs ${subtitleClass}`}>
                  Highlights buttons, active tabs, and primary controls
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ACCENT_COLORS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => onUpdateSettings({ accentColor: col.id })}
                    title={col.label}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md ${col.bg} ${
                      settings.accentColor === col.id
                        ? 'ring-2 ring-offset-2 ring-sky-500 scale-110'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {settings.accentColor === col.id && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Font Size */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>
                  Display Sizing & Density
                </div>
                <div className={`text-xs ${subtitleClass}`}>
                  Adjust text size in the calculator display screen
                </div>
              </div>
              <div className={`flex items-center gap-1 p-1 rounded-2xl border ${groupContainerBg}`}>
                {(['compact', 'normal', 'large'] as const).map((size) => {
                  const isSel = settings.fontSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => onUpdateSettings({ fontSize: size })}
                      style={isSel ? { backgroundColor: 'var(--accent)' } : undefined}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                        isSel ? 'text-white shadow' : idleOptionClass
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MATH ENGINE & FORMATS */}
        {activeTab === 'math' && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${titleClass}`}>
                Math Engine & Number Formatting
              </h3>
              <p className={`text-xs ${subtitleClass}`}>
                Fine-tune trigonometry units, decimal precision, and digit grouping
              </p>
            </div>

            {/* Angle Unit */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b ${dividerClass} gap-2`}
            >
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>Trigonometry Angle Mode</div>
                <div className={`text-xs ${subtitleClass}`}>
                  Unit for sin, cos, tan, and inverse trigonometric functions
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 p-1 rounded-2xl border ${groupContainerBg}`}
              >
                {(['DEG', 'RAD', 'GRAD'] as AngleMode[]).map((mode) => {
                  const isSel = settings.angleMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => onUpdateSettings({ angleMode: mode })}
                      style={isSel ? { backgroundColor: 'var(--accent)' } : undefined}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSel ? 'text-white shadow' : idleOptionClass
                      }`}
                    >
                      {mode === 'DEG'
                        ? 'Degrees (°)'
                        : mode === 'RAD'
                          ? 'Radians (rad)'
                          : 'Gradians (grad)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Precision Slider */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b ${dividerClass} gap-2`}
            >
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>
                  Decimal Precision ({settings.precision} Places)
                </div>
                <div className={`text-xs ${subtitleClass}`}>
                  Maximum fractional digits displayed in results
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={settings.precision}
                  onChange={(e) => onUpdateSettings({ precision: parseInt(e.target.value) })}
                  className="cursor-pointer w-32"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span
                  className={`text-sm font-mono font-bold w-8 text-center py-1 rounded-lg border ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-800'
                      : 'bg-slate-800 border-slate-700 text-sky-400'
                  }`}
                  style={isLight ? undefined : { color: 'var(--accent)' }}
                >
                  {settings.precision}
                </span>
              </div>
            </div>

            {/* Number Notation */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b ${dividerClass} gap-2`}
            >
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>Number Notation Style</div>
                <div className={`text-xs ${subtitleClass}`}>
                  Display format for large or fractional numbers
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 p-1 rounded-2xl border ${groupContainerBg}`}
              >
                {[
                  { id: 'standard', label: 'Standard (1.23M)' },
                  { id: 'scientific', label: 'Scientific (1.23e+6)' },
                  { id: 'engineering', label: 'Engineering (123.4e+3)' },
                ].map((n) => {
                  const isSel = settings.notation === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => onUpdateSettings({ notation: n.id as any })}
                      style={isSel ? { backgroundColor: 'var(--accent)' } : undefined}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSel ? 'text-white shadow' : idleOptionClass
                      }`}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thousands Separator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>
                  Thousands Digit Separator
                </div>
                <div className={`text-xs ${subtitleClass}`}>
                  Grouping character for integer portions
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 p-1 rounded-2xl border ${groupContainerBg}`}
              >
                {[
                  { id: 'comma', label: 'Comma (1,000)' },
                  { id: 'space', label: 'Space (1 000)' },
                  { id: 'period', label: 'Period (1.000)' },
                  { id: 'none', label: 'None (1000)' },
                ].map((sep) => {
                  const isSel = settings.thousandsSeparator === sep.id;
                  return (
                    <button
                      key={sep.id}
                      onClick={() => onUpdateSettings({ thousandsSeparator: sep.id as any })}
                      style={isSel ? { backgroundColor: 'var(--accent)' } : undefined}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSel ? 'text-white shadow' : idleOptionClass
                      }`}
                    >
                      {sep.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIO & TACTILE */}
        {activeTab === 'audio' && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${titleClass}`}>
                Audio & Haptic Feedback
              </h3>
              <p className={`text-xs ${subtitleClass}`}>
                Synthesized mechanical sounds and mobile vibration on button press
              </p>
            </div>

            {/* Sound Toggle */}
            <div className={`flex items-center justify-between py-3 border-b ${dividerClass}`}>
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>
                  Button Click Sound Effects
                </div>
                <div className={`text-xs ${subtitleClass}`}>
                  Play real-time synthesized audio feedback when buttons are clicked
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                style={settings.soundEnabled ? { backgroundColor: 'var(--accent)' } : undefined}
                className={`p-2.5 rounded-2xl border transition-all ${
                  settings.soundEnabled
                    ? 'text-white shadow-md border-transparent'
                    : isLight
                      ? 'bg-slate-100 text-slate-500 border-slate-300'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Sound Profile */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b ${dividerClass} gap-2`}
            >
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>Sound Profile</div>
                <div className={`text-xs ${subtitleClass}`}>
                  Select timbre and harmonic profile for clicks
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 p-1 rounded-2xl border ${groupContainerBg}`}
              >
                {[
                  { id: 'mechanical', label: 'Mechanical Key' },
                  { id: 'soft', label: 'Soft Click' },
                  { id: 'beep', label: 'Digital Beep' },
                  { id: 'tap', label: 'Subtle Tap' },
                ].map((p) => {
                  const isSel = settings.soundProfile === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onUpdateSettings({ soundProfile: p.id as any });
                        playClickSound('click', settings.soundVolume, p.id as any);
                      }}
                      style={isSel ? { backgroundColor: 'var(--accent)' } : undefined}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSel ? 'text-white shadow' : idleOptionClass
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volume Slider */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b ${dividerClass} gap-2`}
            >
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>
                  Sound Volume ({Math.round(settings.soundVolume * 100)}%)
                </div>
                <div className={`text-xs ${subtitleClass}`}>Synthesizer output gain level</div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={settings.soundVolume}
                  onChange={(e) => onUpdateSettings({ soundVolume: parseFloat(e.target.value) })}
                  className="cursor-pointer w-32"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <button
                  onClick={testAudio}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Test
                </button>
              </div>
            </div>

            {/* Haptic Vibration */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className={`text-sm font-semibold ${labelClass}`}>
                  Haptic Vibration Feedback
                </div>
                <div className={`text-xs ${subtitleClass}`}>
                  Subtle vibration on touch-enabled mobile devices
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ hapticFeedback: !settings.hapticFeedback })}
                style={settings.hapticFeedback ? { backgroundColor: 'var(--accent)' } : undefined}
                className={`p-2.5 rounded-2xl border transition-all ${
                  settings.hapticFeedback
                    ? 'text-white shadow-md border-transparent'
                    : isLight
                      ? 'bg-slate-100 text-slate-500 border-slate-300'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                <Vibrate className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: STORAGE & BACKUP */}
        {activeTab === 'storage' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${titleClass}`}>
                Data Storage & Backup Management
              </h3>
              <p className={`text-xs ${subtitleClass}`}>
                Export backups, import previous sessions, and manage local storage
              </p>
            </div>

            {/* Storage Quota Card */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border ${innerDisplayBg}`}
            >
              <div className={`p-3 rounded-xl border ${cardBg}`}>
                <span className={`text-[10px] block mb-1 uppercase font-bold ${subtitleClass}`}>
                  Stored Calculations
                </span>
                <span className="text-2xl font-mono font-bold" style={{ color: 'var(--accent)' }}>
                  {historyCount}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${cardBg}`}>
                <span className={`text-[10px] block mb-1 uppercase font-bold ${subtitleClass}`}>
                  Local Footprint
                </span>
                <span className="text-2xl font-mono font-bold text-emerald-500">
                  {storageEstimatedKb} KB
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${cardBg}`}>
                <span className={`text-[10px] block mb-1 uppercase font-bold ${subtitleClass}`}>
                  Offline Readiness
                </span>
                <span className="text-2xl font-bold text-indigo-500">100% Ready</span>
              </div>
            </div>

            {/* Backup & Restore Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleExportData}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 transition-all shadow-md ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                }`}
              >
                <Download className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Export JSON
                Backup
              </button>

              <label
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                }`}
              >
                <Upload className="w-4 h-4 text-emerald-500" /> Import JSON Backup
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Clear History and Factory Reset */}
            <div className={`border-t ${dividerClass} pt-4 flex flex-col gap-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-amber-500">
                    Clear Calculation History
                  </div>
                  <div className={`text-xs ${subtitleClass}`}>
                    Delete all recorded past calculations while preserving your settings
                  </div>
                </div>
                {confirmClearHistory ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmClearHistory(false)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl ${
                        isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearHistory(true)}
                    className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 text-xs font-bold rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear History
                  </button>
                )}
              </div>

              <div className={`flex items-center justify-between border-t ${dividerClass} pt-4`}>
                <div>
                  <div className="text-sm font-semibold text-rose-500">Full Factory Reset</div>
                  <div className={`text-xs ${subtitleClass}`}>
                    Wipe all local storage, preferences, matrices, and reset application
                  </div>
                </div>
                {confirmFactoryReset ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFactoryReset}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow"
                    >
                      Confirm Reset
                    </button>
                    <button
                      onClick={() => setConfirmFactoryReset(false)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl ${
                        isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmFactoryReset(true)}
                    className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 text-xs font-bold rounded-xl border border-rose-500/30 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Factory Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: KEYBOARD SHORTCUTS */}
        {activeTab === 'shortcuts' && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${titleClass}`}>
                Keyboard Shortcuts Reference
              </h3>
              <p className={`text-xs ${subtitleClass}`}>
                Use fast physical keyboard bindings inside any calculator mode
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: '0 – 9', desc: 'Input digits' },
                { key: '+  -  *  /', desc: 'Basic arithmetic operators' },
                { key: 'Enter  or  =', desc: 'Evaluate calculation result' },
                { key: 'Esc  or  c', desc: 'Clear input display' },
                { key: 'Backspace', desc: 'Delete last typed character' },
                { key: '^  or  **', desc: 'Exponentiation (Power)' },
                { key: '(  and  )', desc: 'Parentheses groupings' },
                { key: '%', desc: 'Percentage calculation' },
                { key: 's, c, t', desc: 'Quick trig sin, cos, tan functions' },
                { key: 'p', desc: 'Insert mathematical Constant π (Pi)' },
                { key: 'e', desc: 'Insert Euler’s Constant (2.71828)' },
                { key: 'r', desc: 'Square root function sqrt()' },
              ].map((shortcut, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 border rounded-2xl ${innerDisplayBg}`}
                >
                  <span className={`text-xs font-medium ${subtitleClass}`}>{shortcut.desc}</span>
                  <kbd
                    className={`px-2.5 py-1 font-mono text-xs font-bold rounded-lg shadow-xs border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-800 border-slate-700 text-sky-400'
                    }`}
                    style={isLight ? undefined : { color: 'var(--accent)' }}
                  >
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* About Applet Info Footer */}
      <div
        className={`p-4 border rounded-2xl flex flex-col sm:flex-row items-center justify-between text-xs gap-2 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-600'
            : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <span>
            {APP_NAME} v{APP_VERSION} • 17 Integrated Mathematical Engines
          </span>
        </div>
        <div className="text-[11px]">Client-Side Zero-Latency Computation</div>
      </div>
    </div>
  );
};
