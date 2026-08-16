import React from 'react';
import { Menu, Moon, Sun, History as HistoryIcon, Settings as SettingsIcon, Search, Sparkles, Calculator, LineChart, DollarSign, ArrowLeftRight, Sigma } from 'lucide-react';
import { CalcMode, AngleMode, AppSettings } from '../types';

interface HeaderProps {
  currentMode: CalcMode;
  onToggleSidebar: () => void;
  onSelectMode: (mode: CalcMode) => void;
  onOpenCommandPalette?: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

const MODE_TITLES: Record<CalcMode, { title: string; subtitle: string }> = {
  basic: { title: 'Basic Calculator', subtitle: 'Standard arithmetic operations & memory functions' },
  scientific: { title: 'Scientific Calculator', subtitle: 'Advanced trigonometry, logarithms, powers, & constants' },
  fractions: { title: 'Fractions & Number Theory', subtitle: 'Exact fraction arithmetic, GCD/LCM trees, and prime factorization' },
  geometry: { title: 'Triangle & Geometry Solver', subtitle: 'Trigonometric triangle solver with live rendering and 2D/3D shapes' },
  equation: { title: 'Equation & System Solver', subtitle: 'Quadratic, cubic, and 2×2 / 3×3 linear system equation solvers' },
  calculus: { title: 'Calculus & Numerical Suite', subtitle: 'Definite integrals, tangent derivatives, and Newton-Raphson root solver' },
  graphing: { title: 'Graphing Calculator', subtitle: 'Plot 2D function curves, customize bounds, & inspect coordinates' },
  programmer: { title: 'Programmer Calculator', subtitle: 'Binary, Hex, Octal, bitwise shifts & interactive bit matrix' },
  converter: { title: 'Unit Converter', subtitle: 'Convert units across length, mass, temperature, storage, & more' },
  finance: { title: 'Finance & Loan Calculator', subtitle: 'Mortgage EMI, compound interest, GST tax, & discount tools' },
  datetime: { title: 'Date & Time Calculator', subtitle: 'Date span, business work days, age milestones, & shift wage logs' },
  health: { title: 'Health & Fitness Suite', subtitle: 'BMI categories, BMR/TDEE calorie targets, and heart rate zones' },
  matrix: { title: 'Matrix Calculator', subtitle: 'Matrix addition, multiplication, determinant, transpose, & inverse' },
  statistics: { title: 'Statistics Calculator', subtitle: 'Descriptive stats, mean, median, std dev, & dataset distribution' },
  formulas: { title: 'Formulas & Constants', subtitle: 'Cheat sheet for algebra, geometry, physics, finance & physical constants' },
  history: { title: 'Calculation History', subtitle: 'View, search, copy, & export past calculation entries' },
  settings: { title: 'Preferences & Settings', subtitle: 'Customize themes, angle units, precision, & app defaults' },
};

const QUICK_MODES: { mode: CalcMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'basic', label: 'Basic', icon: <Calculator className="w-3.5 h-3.5" /> },
  { mode: 'scientific', label: 'Scientific', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { mode: 'graphing', label: 'Graphing', icon: <LineChart className="w-3.5 h-3.5" /> },
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
  const modeInfo = MODE_TITLES[currentMode] || { title: 'OmniCalc Pro', subtitle: '' };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'oled' : settings.theme === 'oled' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  const toggleAngleMode = () => {
    const nextAngle: AngleMode = settings.angleMode === 'DEG' ? 'RAD' : settings.angleMode === 'RAD' ? 'GRAD' : 'DEG';
    onUpdateSettings({ angleMode: nextAngle });
  };

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const headerBgClass = isLight 
    ? 'bg-white/90 border-slate-200 text-slate-900 shadow-xs' 
    : isOled 
    ? 'bg-black/90 border-zinc-800 text-white' 
    : 'bg-slate-900/80 border-slate-800/80 text-slate-100';

  const btnIdleClass = isLight
    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    : isOled
    ? 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white';

  const badgeClass = isLight
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
    : isOled
    ? 'bg-zinc-900 hover:bg-zinc-800 text-sky-400 border-zinc-700'
    : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700/80';

  const searchBtnBg = isLight
    ? 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 border-slate-200'
    : isOled
    ? 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700/70';

  return (
    <header className={`h-16 border-b backdrop-blur-md px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 transition-colors ${headerBgClass}`}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-xl transition-colors lg:hidden ${btnIdleClass}`}
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2 truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            {modeInfo.title}
          </h2>
          <p className={`text-xs hidden md:block truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {modeInfo.subtitle}
          </p>
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
                px-2.5 py-1 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap
                ${isActive 
                  ? 'text-white shadow-xs' 
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

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Command Palette Quick Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all shadow-xs ${searchBtnBg}`}
          title="Search engines & tools (Ctrl + K)"
        >
          <Search className="w-4 h-4 text-sky-500" />
          <span className="hidden sm:inline">Search</span>
          <kbd className={`hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isLight ? 'bg-white border border-slate-300 text-slate-600' : 'bg-slate-950/60 border border-slate-700/80 text-slate-400'}`}>
            ⌘K
          </kbd>
        </button>

        {/* Quick Angle Unit Switcher for math modes */}
        {['basic', 'scientific', 'graphing', 'calculus', 'geometry'].includes(currentMode) && (
          <button
            onClick={toggleAngleMode}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors shadow-xs ${badgeClass}`}
            title="Click to toggle Angle Unit (DEG / RAD / GRAD)"
          >
            {settings.angleMode}
          </button>
        )}

        {/* Quick History Button */}
        <button
          onClick={() => onSelectMode('history')}
          style={currentMode === 'history' ? { backgroundColor: 'var(--accent)' } : undefined}
          className={`p-2 rounded-xl transition-all ${
            currentMode === 'history'
              ? 'text-white shadow-sm'
              : btnIdleClass
          }`}
          title="View Calculation History"
        >
          <HistoryIcon className="w-4.5 h-4.5" />
        </button>

        {/* Quick Settings Button */}
        <button
          onClick={() => onSelectMode('settings')}
          style={currentMode === 'settings' ? { backgroundColor: 'var(--accent)' } : undefined}
          className={`p-2 rounded-xl transition-all ${
            currentMode === 'settings'
              ? 'text-white shadow-sm'
              : btnIdleClass
          }`}
          title="Preferences & Settings"
        >
          <SettingsIcon className="w-4.5 h-4.5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl transition-colors ${btnIdleClass}`}
          title={`Current: ${settings.theme === 'light' ? 'Light' : settings.theme === 'oled' ? 'OLED Black' : 'Dark Slate'} (Click to cycle themes)`}
        >
          {settings.theme === 'light' ? (
            <Sun className="w-4.5 h-4.5 text-amber-500" />
          ) : settings.theme === 'oled' ? (
            <Moon className="w-4.5 h-4.5 text-indigo-400" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-sky-400" />
          )}
        </button>
      </div>
    </header>
  );
};
