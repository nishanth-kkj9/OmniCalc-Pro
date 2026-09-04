import { useState, useEffect, lazy, Suspense, Component, ReactNode, ErrorInfo } from 'react';
import { CalcMode, AppSettings } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { playClickSound, prewarmAudio } from './utils/sound';
import { ACCENT_COLOR_MAP } from './utils/formatting';
import { loadInitialSettings, saveSettings } from './utils/settings';
import { Loader2, AlertCircle } from 'lucide-react';

// Lazy load the 16 engine views for optimal bundle splitting and fast initial render
const BasicCalculator = lazy(() =>
  import('./components/BasicCalculator').then((m) => ({ default: m.BasicCalculator }))
);
const ScientificCalculator = lazy(() =>
  import('./components/ScientificCalculator').then((m) => ({ default: m.ScientificCalculator }))
);
const GraphingCalculator = lazy(() =>
  import('./components/GraphingCalculator').then((m) => ({ default: m.GraphingCalculator }))
);
const FractionsCalculator = lazy(() =>
  import('./components/FractionsCalculator').then((m) => ({ default: m.FractionsCalculator }))
);
const GeometryCalculator = lazy(() =>
  import('./components/GeometryCalculator').then((m) => ({ default: m.GeometryCalculator }))
);
const EquationSolver = lazy(() =>
  import('./components/EquationSolver').then((m) => ({ default: m.EquationSolver }))
);
const CalculusCalculator = lazy(() =>
  import('./components/CalculusCalculator').then((m) => ({ default: m.CalculusCalculator }))
);
const ProgrammerCalculator = lazy(() =>
  import('./components/ProgrammerCalculator').then((m) => ({ default: m.ProgrammerCalculator }))
);
const ConverterCalculator = lazy(() =>
  import('./components/ConverterCalculator').then((m) => ({ default: m.ConverterCalculator }))
);
const FinanceCalculator = lazy(() =>
  import('./components/FinanceCalculator').then((m) => ({ default: m.FinanceCalculator }))
);
const DateTimeCalculator = lazy(() =>
  import('./components/DateTimeCalculator').then((m) => ({ default: m.DateTimeCalculator }))
);
const HealthCalculator = lazy(() =>
  import('./components/HealthCalculator').then((m) => ({ default: m.HealthCalculator }))
);
const MatrixCalculator = lazy(() =>
  import('./components/MatrixCalculator').then((m) => ({ default: m.MatrixCalculator }))
);
const StatisticsCalculator = lazy(() =>
  import('./components/StatisticsCalculator').then((m) => ({ default: m.StatisticsCalculator }))
);
const FormulasPanel = lazy(() =>
  import('./components/FormulasPanel').then((m) => ({ default: m.FormulasPanel }))
);
const HistoryPanel = lazy(() =>
  import('./components/HistoryPanel').then((m) => ({ default: m.HistoryPanel }))
);

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class EngineErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Engine render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6 text-center max-w-lg mx-auto my-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-rose-400 mb-2">Engine Render Error</h3>
            <p className="text-sm text-slate-400 mb-4">
              This calculation engine encountered an unexpected rendering issue. You can switch to
              another mode or reload the view.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors"
            >
              Reset View
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

function EngineLoadingFallback({ theme }: { theme: string }) {
  const isLight = theme === 'light';
  const isOled = theme === 'oled';
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[360px] p-8 gap-3"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={`w-8 h-8 animate-spin ${isLight ? 'text-slate-400' : isOled ? 'text-zinc-600' : 'text-slate-500'}`}
      />
      <span
        className={`text-xs font-mono tracking-wider uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
      >
        Loading Engine...
      </span>
    </div>
  );
}

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadInitialSettings());
  const [currentMode, setCurrentMode] = useState<CalcMode>(() => settings.defaultMode || 'basic');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  // Listen for custom open event
  useEffect(() => {
    const handleOpen = () => setCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Save settings when modified (debounced to avoid localStorage thrashing on rapid changes like slider dragging)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSettings(settings);
    }, 250);

    return () => clearTimeout(timer);
  }, [settings]);

  // Ensure latest settings are flushed on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSettings(settings);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
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
      const target = (e.target as HTMLElement)?.closest(
        'button, [role="button"], input[type="button"]'
      );
      if (target && settings.soundEnabled) {
        const text = target.textContent?.trim() || '';
        const soundType =
          text === '=' || text === 'Calculate' || text === 'Solve'
            ? 'equals'
            : text === 'C' || text === 'AC' || text === 'CE'
              ? 'clear'
              : 'click';
        playClickSound(soundType, settings.soundVolume, settings.soundProfile);
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
    <div
      className={`h-screen w-full overflow-hidden ${bgClass} flex flex-col lg:flex-row font-sans antialiased transition-colors duration-150`}
    >
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
        isRailCollapsed={isRailCollapsed}
        onToggleRailCollapse={() => setIsRailCollapsed((prev) => !prev)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          currentMode={currentMode}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSelectMode={setCurrentMode}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          settings={settings}
          onUpdateSettings={updateSettings}
        />

        <main className={`flex-1 w-full ${currentMode === 'graph' ? 'p-0 overflow-hidden' : 'p-2.5 sm:p-4 md:p-6 overflow-y-auto overscroll-contain'}`}>
          <div className={`w-full ${currentMode === 'graph' ? 'h-full' : 'max-w-7xl mx-auto flex flex-col items-center justify-start'}`}>
            <EngineErrorBoundary key={currentMode}>
              <Suspense fallback={<EngineLoadingFallback theme={settings.theme} />}>
                {currentMode === 'basic' && <BasicCalculator settings={settings} />}
                {currentMode === 'scientific' && (
                  <ScientificCalculator settings={settings} onUpdateSettings={updateSettings} />
                )}
                {currentMode === 'graph' && (
                  <GraphingCalculator settings={settings} onNavigate={setCurrentMode} />
                )}
                {currentMode === 'fractions' && <FractionsCalculator settings={settings} />}
                {currentMode === 'geometry' && <GeometryCalculator settings={settings} />}
                {currentMode === 'equation' && <EquationSolver settings={settings} />}
                {currentMode === 'calculus' && <CalculusCalculator settings={settings} />}
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
            </EngineErrorBoundary>
          </div>
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
