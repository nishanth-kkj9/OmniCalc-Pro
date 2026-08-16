import React, { useState, useEffect, lazy, Suspense } from 'react';
import { CalcMode, AppSettings } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { playClickSound, prewarmAudio } from './utils/sound';
import { ACCENT_COLOR_MAP } from './utils/formatting';
import { Loader2 } from 'lucide-react';

// Lazy load the 17 engine views for optimal bundle splitting and fast initial render
const BasicCalculator = lazy(() => import('./components/BasicCalculator').then(m => ({ default: m.BasicCalculator })));
const ScientificCalculator = lazy(() => import('./components/ScientificCalculator').then(m => ({ default: m.ScientificCalculator })));
const FractionsCalculator = lazy(() => import('./components/FractionsCalculator').then(m => ({ default: m.FractionsCalculator })));
const GeometryCalculator = lazy(() => import('./components/GeometryCalculator').then(m => ({ default: m.GeometryCalculator })));
const EquationSolver = lazy(() => import('./components/EquationSolver').then(m => ({ default: m.EquationSolver })));
const CalculusCalculator = lazy(() => import('./components/CalculusCalculator').then(m => ({ default: m.CalculusCalculator })));
const GraphingCalculator = lazy(() => import('./components/GraphingCalculator').then(m => ({ default: m.GraphingCalculator })));
const ProgrammerCalculator = lazy(() => import('./components/ProgrammerCalculator').then(m => ({ default: m.ProgrammerCalculator })));
const ConverterCalculator = lazy(() => import('./components/ConverterCalculator').then(m => ({ default: m.ConverterCalculator })));
const FinanceCalculator = lazy(() => import('./components/FinanceCalculator').then(m => ({ default: m.FinanceCalculator })));
const DateTimeCalculator = lazy(() => import('./components/DateTimeCalculator').then(m => ({ default: m.DateTimeCalculator })));
const HealthCalculator = lazy(() => import('./components/HealthCalculator').then(m => ({ default: m.HealthCalculator })));
const MatrixCalculator = lazy(() => import('./components/MatrixCalculator').then(m => ({ default: m.MatrixCalculator })));
const StatisticsCalculator = lazy(() => import('./components/StatisticsCalculator').then(m => ({ default: m.StatisticsCalculator })));
const FormulasPanel = lazy(() => import('./components/FormulasPanel').then(m => ({ default: m.FormulasPanel })));
const HistoryPanel = lazy(() => import('./components/HistoryPanel').then(m => ({ default: m.HistoryPanel })));

const DEFAULT_SETTINGS: AppSettings = {
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

function EngineLoadingFallback({ theme }: { theme: string }) {
  const isLight = theme === 'light';
  const isOled = theme === 'oled';
  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] p-8 gap-3" role="status" aria-live="polite">
      <Loader2 className={`w-8 h-8 animate-spin ${isLight ? 'text-slate-400' : isOled ? 'text-zinc-600' : 'text-slate-500'}`} />
      <span className={`text-xs font-mono tracking-wider uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        Loading Engine...
      </span>
    </div>
  );
}

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('omnicalc_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [currentMode, setCurrentMode] = useState<CalcMode>(() => settings.defaultMode || 'basic');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  // Listen for custom open event
  useEffect(() => {
    const handleOpen = () => setCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Save settings when modified
  useEffect(() => {
    try {
      localStorage.setItem('omnicalc_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist omnicalc_settings:', e);
    }
  }, [settings]);

  // Apply Theme to document HTML element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'oled');
    if (settings.theme === 'light') {
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else if (settings.theme === 'oled') {
      root.classList.add('dark', 'oled');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }

    // Apply primary accent color CSS custom properties
    const activeColor = ACCENT_COLOR_MAP[settings.accentColor] || ACCENT_COLOR_MAP.sky;
    root.style.setProperty('--accent-primary', activeColor.primary);
    root.style.setProperty('--accent-hover', activeColor.hover);
  }, [settings.theme, settings.accentColor]);

  // Keyboard Shortcuts (Ctrl+K, Global Numbers, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Quick Theme toggle: Ctrl+T or Cmd+T (if not typing in input)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (!isInput && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setSettings((prev) => ({
          ...prev,
          theme: prev.theme === 'dark' ? 'light' : prev.theme === 'light' ? 'oled' : 'dark',
        }));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global sound & haptic interceptor on interactive buttons
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      prewarmAudio();
      const target = (e.target as HTMLElement)?.closest('button, [role="button"], input[type="button"]');
      if (target && settings.soundEnabled) {
        playClickSound(settings.soundVolume, settings.soundProfile);
        if (settings.hapticFeedback && 'vibrate' in navigator) {
          try {
            navigator.vibrate(10);
          } catch {
            // ignore
          }
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [settings.soundEnabled, settings.soundVolume, settings.soundProfile, settings.hapticFeedback]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const bgClass =
    settings.theme === 'oled'
      ? 'bg-black text-white'
      : settings.theme === 'light'
      ? 'bg-slate-100 text-slate-900'
      : 'bg-slate-950 text-slate-100';

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col lg:flex-row font-sans antialiased transition-colors duration-150`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        settings={settings}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          currentMode={currentMode}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSelectMode={setCurrentMode}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          settings={settings}
          onUpdateSettings={updateSettings}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Suspense fallback={<EngineLoadingFallback theme={settings.theme} />}>
            {currentMode === 'basic' && <BasicCalculator settings={settings} />}
            {currentMode === 'scientific' && (
              <ScientificCalculator settings={settings} onUpdateSettings={updateSettings} />
            )}
            {currentMode === 'fractions' && <FractionsCalculator settings={settings} />}
            {currentMode === 'geometry' && <GeometryCalculator settings={settings} />}
            {currentMode === 'equation' && <EquationSolver settings={settings} />}
            {currentMode === 'calculus' && <CalculusCalculator settings={settings} />}
            {currentMode === 'graphing' && <GraphingCalculator settings={settings} />}
            {currentMode === 'programmer' && <ProgrammerCalculator settings={settings} />}
            {currentMode === 'converter' && <ConverterCalculator settings={settings} />}
            {currentMode === 'finance' && <FinanceCalculator settings={settings} />}
            {currentMode === 'datetime' && <DateTimeCalculator settings={settings} />}
            {currentMode === 'health' && <HealthCalculator settings={settings} />}
            {currentMode === 'matrix' && <MatrixCalculator settings={settings} />}
            {currentMode === 'statistics' && <StatisticsCalculator settings={settings} />}
            {currentMode === 'formulas' && (
              <FormulasPanel 
                settings={settings} 
                onNavigateMode={(mode) => setCurrentMode(mode)} 
              />
            )}
            {currentMode === 'history' && (
              <HistoryPanel
                settings={settings}
                onSelectCalculation={() => {
                  setCurrentMode('basic');
                }}
              />
            )}
            {currentMode === 'settings' && (
              <SettingsModal settings={settings} onUpdateSettings={updateSettings} />
            )}
          </Suspense>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          setSidebarOpen(false);
        }}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}

export default App;
