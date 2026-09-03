import React, { useState, useEffect } from 'react';
import {
  Menu,
  Moon,
  Sun,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Search,
  Sparkles,
  Calculator,
  DollarSign,
  ArrowLeftRight,
  Sigma,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CalcMode, AngleMode, AppSettings } from '../types';

interface HeaderProps {
  currentMode: CalcMode;
  onToggleSidebar: () => void;
  onSelectMode: (mode: CalcMode) => void;
  onOpenCommandPalette?: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

const MODE_TITLES: Record<
  CalcMode,
  { title: string; subtitle: string; category: string; color: string }
> = {
  basic: {
    title: 'Basic Calculator',
    subtitle: 'Standard arithmetic operations & memory functions',
    category: 'Core Math',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  scientific: {
    title: 'Scientific Calculator',
    subtitle: 'Advanced trigonometry, logarithms, powers, & constants',
    category: 'Core Math',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  fractions: {
    title: 'Fractions & Number Theory',
    subtitle: 'Exact fraction arithmetic, GCD/LCM trees, and prime factorization',
    category: 'Core Math',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  geometry: {
    title: 'Triangle & Geometry Solver',
    subtitle: 'Trigonometric triangle solver with live rendering and 2D/3D shapes',
    category: 'Core Math',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  equation: {
    title: 'Equation & System Solver',
    subtitle: 'Quadratic, cubic, and 2×2 / 3×3 linear system equation solvers',
    category: 'Advanced',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  calculus: {
    title: 'Calculus & Numerical Suite',
    subtitle: 'Definite integrals, tangent derivatives, and Newton-Raphson root solver',
    category: 'Advanced',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  programmer: {
    title: 'Programmer Calculator',
    subtitle: 'Binary, Hex, Octal, bitwise shifts & interactive bit matrix',
    category: 'Advanced',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  converter: {
    title: 'Unit Converter',
    subtitle: 'Convert units across length, mass, temperature, storage, & more',
    category: 'Practical',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  finance: {
    title: 'Finance & Loan Calculator',
    subtitle: 'Mortgage EMI, compound interest, GST tax, & discount tools',
    category: 'Practical',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  datetime: {
    title: 'Date & Time Calculator',
    subtitle: 'Date span, business work days, age milestones, & shift wage logs',
    category: 'Practical',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  health: {
    title: 'Health & Fitness Suite',
    subtitle: 'BMI categories, BMR/TDEE calorie targets, and heart rate zones',
    category: 'Practical',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  matrix: {
    title: 'Matrix Calculator',
    subtitle: 'Matrix addition, multiplication, determinant, transpose, & inverse',
    category: 'Advanced',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  statistics: {
    title: 'Statistics Calculator',
    subtitle: 'Descriptive stats, mean, median, std dev, & dataset distribution',
    category: 'Advanced',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  formulas: {
    title: 'Formulas & Constants',
    subtitle: 'Cheat sheet for algebra, geometry, physics, finance & physical constants',
    category: 'Reference',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  history: {
    title: 'Calculation History',
    subtitle: 'View, search, copy, & export past calculation entries',
    category: 'Logs',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  },
  settings: {
    title: 'Preferences & Settings',
    subtitle: 'Customize themes, angle units, precision, & app defaults',
    category: 'Config',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  },
};

const QUICK_MODES: { mode: CalcMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'basic', label: 'Basic', icon: <Calculator className="w-3.5 h-3.5" /> },
  { mode: 'scientific', label: 'Scientific', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { mode: 'calculus', label: 'Calculus', icon: <Sigma className="w-3.5 h-3.5" /> },
  { mode: 'converter', label: 'Converter', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
  { mode: 'finance', label: 'Finance', icon: <DollarSign className="w-3.5 h-3.5" /> },
];

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onToggleSidebar,
  onSelectMode,
  onOpenCommandPalette,
  settings,
  onUpdateSettings,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modeInfo = MODE_TITLES[currentMode] || {
    title: 'OmniCalc Pro',
    subtitle: '',
    category: 'Suite',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleTheme = () => {
    const nextTheme =
      settings.theme === 'dark' ? 'oled' : settings.theme === 'oled' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  const toggleSound = () => {
    onUpdateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleAngleMode = () => {
    const nextAngle: AngleMode =
      settings.angleMode === 'DEG' ? 'RAD' : settings.angleMode === 'RAD' ? 'GRAD' : 'DEG';
    onUpdateSettings({ angleMode: nextAngle });
  };

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const headerBgClass = isLight
    ? 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
    : isOled
      ? 'bg-black/95 border-zinc-800 text-white'
      : 'bg-slate-900/85 border-slate-800/80 text-slate-100';

  const btnIdleClass = isLight
    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95'
    : isOled
      ? 'text-zinc-300 hover:bg-zinc-900 hover:text-white active:scale-95'
      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white active:scale-95';

  const badgeClass = isLight
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 active:scale-95'
    : isOled
      ? 'bg-zinc-900 hover:bg-zinc-800 text-sky-400 border-zinc-700 active:scale-95'
      : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700/80 active:scale-95';

  const searchBtnBg = isLight
    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 border-slate-200'
    : isOled
      ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/70';

  return (
    <header
      className={`h-16 border-b backdrop-blur-md px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 transition-colors ${headerBgClass}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-xl transition-colors lg:hidden ${btnIdleClass}`}
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}
              >
                {modeInfo.title}
              </h2>
              <span
                className={`hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${modeInfo.color}`}
              >
                {modeInfo.category}
              </span>
            </div>
            <p
              className={`text-xs hidden md:block truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
            >
              {modeInfo.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Center Quick Switcher Pills (Visible on large screens) */}
      <div className="hidden xl:flex items-center gap-1 bg-slate-950/20 dark:bg-slate-950/40 p-1 rounded-2xl border border-slate-800/40">
        {QUICK_MODES.map((qm) => {
          const isActive = currentMode === qm.mode;
          return (
            <button
              key={qm.mode}
              onClick={() => onSelectMode(qm.mode)}
              style={isActive ? { backgroundColor: 'var(--accent)' } : undefined}
              className={`
                px-2.5 py-1 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95
                ${
                  isActive
                    ? 'text-white shadow-xs font-bold'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }
              `}
            >
              {qm.icon}
              {qm.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Command Palette Quick Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className={`px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 sm:gap-2 transition-all shadow-xs active:scale-95 flex-shrink-0 ${searchBtnBg}`}
          title="Search engines & tools (Ctrl + K or ⌘K)"
          aria-label="Search engines and tools"
        >
          <Search className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <span className="hidden md:inline">Search</span>
          <kbd
            className={`hidden lg:inline px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isLight ? 'bg-white border border-slate-300 text-slate-600' : 'bg-slate-950/60 border border-slate-700/80 text-slate-400'}`}
          >
            ⌘K
          </kbd>
        </button>

        {/* Quick Angle Unit Switcher for math modes */}
        {['basic', 'scientific', 'calculus', 'geometry'].includes(currentMode) && (
          <button
            onClick={toggleAngleMode}
            className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors shadow-xs flex-shrink-0 ${badgeClass}`}
            title="Click to toggle Angle Unit (DEG / RAD / GRAD)"
            aria-label={`Angle unit: ${settings.angleMode}. Click to toggle.`}
          >
            {settings.angleMode}
          </button>
        )}

        {/* Quick Sound/Audio Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-xl transition-all hidden sm:flex flex-shrink-0 ${btnIdleClass}`}
          title={
            settings.soundEnabled
              ? 'Audio Feedback Enabled (Click to Mute)'
              : 'Audio Feedback Muted (Click to Enable)'
          }
          aria-label={settings.soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-4.5 h-4.5 text-sky-400 flex-shrink-0" />
          ) : (
            <VolumeX className="w-4.5 h-4.5 text-slate-500 flex-shrink-0" />
          )}
        </button>

        {/* Quick History Button */}
        <button
          onClick={() => onSelectMode('history')}
          style={currentMode === 'history' ? { backgroundColor: 'var(--accent)' } : undefined}
          className={`p-2 rounded-xl transition-all flex-shrink-0 ${
            currentMode === 'history' ? 'text-white shadow-sm' : btnIdleClass
          }`}
          title="View Calculation History"
          aria-label="View calculation history"
        >
          <HistoryIcon className="w-4.5 h-4.5 flex-shrink-0" />
        </button>

        {/* Quick Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className={`p-2 rounded-xl transition-all hidden md:flex flex-shrink-0 ${btnIdleClass}`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Deep Focus)'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4.5 h-4.5 flex-shrink-0" />
          ) : (
            <Maximize2 className="w-4.5 h-4.5 flex-shrink-0" />
          )}
        </button>

        {/* Quick Settings Button */}
        <button
          onClick={() => onSelectMode('settings')}
          style={currentMode === 'settings' ? { backgroundColor: 'var(--accent)' } : undefined}
          className={`p-2 rounded-xl transition-all flex-shrink-0 ${
            currentMode === 'settings' ? 'text-white shadow-sm' : btnIdleClass
          }`}
          title="Preferences & Settings"
          aria-label="Preferences and settings"
        >
          <SettingsIcon className="w-4.5 h-4.5 flex-shrink-0" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl transition-colors flex-shrink-0 ${btnIdleClass}`}
          title={`Current: ${settings.theme === 'light' ? 'Light' : settings.theme === 'oled' ? 'OLED Black' : 'Dark Slate'} (Click to cycle themes)`}
          aria-label={`Current theme: ${settings.theme}. Click to cycle themes`}
        >
          {settings.theme === 'light' ? (
            <Sun className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
          ) : settings.theme === 'oled' ? (
            <Moon className="w-4.5 h-4.5 text-indigo-400 flex-shrink-0" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-sky-400 flex-shrink-0" />
          )}
        </button>
      </div>
    </header>
  );
};
