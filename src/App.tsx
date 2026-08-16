import React, { useState, useEffect } from 'react';
import { CalcMode, AppSettings } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BasicCalculator } from './components/BasicCalculator';
import { ScientificCalculator } from './components/ScientificCalculator';
import { ProgrammerCalculator } from './components/ProgrammerCalculator';
import { GraphingCalculator } from './components/GraphingCalculator';
import { ConverterCalculator } from './components/ConverterCalculator';
import { FinanceCalculator } from './components/FinanceCalculator';
import { MatrixCalculator } from './components/MatrixCalculator';
import { StatisticsCalculator } from './components/StatisticsCalculator';
import { EquationSolver } from './components/EquationSolver';
import { CalculusCalculator } from './components/CalculusCalculator';
import { DateTimeCalculator } from './components/DateTimeCalculator';
import { HealthCalculator } from './components/HealthCalculator';
import { GeometryCalculator } from './components/GeometryCalculator';
import { FractionsCalculator } from './components/FractionsCalculator';
import { FormulasPanel } from './components/FormulasPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsModal } from './components/SettingsModal';
import { playClickSound, prewarmAudio } from './utils/sound';
import { ACCENT_COLOR_MAP } from './utils/formatting';

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

  // Apply Theme & Accent Color to html root element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'oled', 'light');
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'oled') {
      root.classList.add('dark', 'oled');
    } else {
      root.classList.add('light');
    }

    const isLight = settings.theme === 'light';
    const accent = ACCENT_COLOR_MAP[settings.accentColor || 'sky'] || ACCENT_COLOR_MAP.sky;
    root.style.setProperty('--accent', accent.primary);
    root.style.setProperty('--accent-hover', accent.hover);
    root.style.setProperty('--accent-color', accent.primary);
    root.style.setProperty('--accent-text', isLight ? accent.primary : accent.primary);
    root.setAttribute('data-theme', settings.theme || 'dark');
    root.setAttribute('data-accent', settings.accentColor || 'sky');

    localStorage.setItem('omnicalc_settings', JSON.stringify(settings));
  }, [settings]);

  // Global tactile audio & haptic feedback with microsecond synchronization
  useEffect(() => {
    // Prewarm audio on first interaction so browser autoplay policy is unlocked early
    const handleFirstInteraction = () => {
      prewarmAudio();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { capture: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction, { capture: true });
      window.removeEventListener('keydown', handleFirstInteraction, { capture: true });
      window.removeEventListener('touchstart', handleFirstInteraction, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!settings.soundEnabled && !settings.hapticFeedback) return;

    let lastSoundTime = 0;

    const triggerSoundAndHaptics = (
      type: 'click' | 'equals' | 'clear' | 'error' = 'click'
    ) => {
      const now = performance.now();
      // Debounce micro-jitter within 8ms while allowing rapid multi-key input
      if (now - lastSoundTime < 8) return;
      lastSoundTime = now;

      if (settings.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(10);
        } catch {
          // Ignore vibration errors
        }
      }

      if (settings.soundEnabled) {
        playClickSound(type, settings.soundVolume, settings.soundProfile);
      }
    };

    // Instant capture on pointerdown for true zero-latency tactile response
    const handleGlobalPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('button');
      if (!btn) return;

      const text = btn.textContent?.trim() || '';
      const aria = btn.getAttribute('aria-label') || '';
      const title = btn.getAttribute('title') || '';
      const combined = `${text} ${aria} ${title}`.toLowerCase();

      if (text === '=' || combined.includes('equals') || text === 'Calculate' || text === 'Solve') {
        triggerSoundAndHaptics('equals');
      } else if (text === 'C' || text === 'AC' || text === 'CE' || combined.includes('clear') || combined.includes('reset') || btn.querySelector('svg.lucide-trash-2') !== null) {
        triggerSoundAndHaptics('clear');
      } else {
        triggerSoundAndHaptics('click');
      }
    };

    // Synchronized keyboard input tactile feedback
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in a standard text input / textarea where default typing sounds apply
      const activeEl = document.activeElement;
      const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && 
        (activeEl as HTMLInputElement).type !== 'button' && (activeEl as HTMLInputElement).type !== 'submit';

      const calcKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '%', '^', '(', ')', '.', '!', 'p', 'e'];

      if (e.key === 'Enter' || e.key === '=') {
        triggerSoundAndHaptics('equals');
      } else if (e.key === 'Escape' || (e.key.toLowerCase() === 'c' && !isTextInput)) {
        triggerSoundAndHaptics('clear');
      } else if (calcKeys.includes(e.key) || e.key === 'Backspace' || e.key === 'Delete') {
        triggerSoundAndHaptics('click');
      }
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown, { capture: true, passive: true });
    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown, { capture: true });
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
    };
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
          settings={settings}
          onUpdateSettings={updateSettings}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
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
        </main>
      </div>
    </div>
  );
}

export default App;
