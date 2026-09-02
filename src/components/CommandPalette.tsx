import React, { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  Search,
  Calculator,
  Sparkles,
  Divide,
  Triangle,
  Equal,
  Sigma,
  LineChart,
  Grid,
  BarChart2,
  Binary,
  ArrowLeftRight,
  DollarSign,
  Calendar,
  Heart,
  BookOpen,
  History,
  Settings,
  ArrowRight,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Keyboard,
} from 'lucide-react';
import { CalcMode, AppSettings } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: CalcMode) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Engines & Calculators' | 'Quick Actions' | 'Formulas & Reference';
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  settings,
  onUpdateSettings,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

  const isLight = settings.theme === 'light';
  const isOled = settings.theme === 'oled';

  const commands: CommandItem[] = [
    // Core & Math
    {
      id: 'basic',
      title: 'Basic Calculator',
      subtitle: 'Standard arithmetic (+, -, ×, ÷), percentage, and memory (M+, M-, MR, MC)',
      category: 'Engines & Calculators',
      icon: <Calculator className="w-4 h-4 text-sky-500" />,
      action: () => onSelectMode('basic'),
      keywords: ['basic', 'standard', 'plus', 'minus', 'math', 'arithmetic', 'simple'],
    },
    {
      id: 'scientific',
      title: 'Scientific Calculator',
      subtitle: 'Trig (sin, cos, tan), powers (x^y), logarithms (ln, log), factorials (!)',
      category: 'Engines & Calculators',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      action: () => onSelectMode('scientific'),
      keywords: ['scientific', 'trig', 'sin', 'cos', 'tan', 'log', 'ln', 'exponent', 'pi', 'euler'],
    },
    {
      id: 'fractions',
      title: 'Fractions & Number Theory',
      subtitle: 'Exact fraction arithmetic, simplification, GCD/LCM trees, prime factorization',
      category: 'Engines & Calculators',
      icon: <Divide className="w-4 h-4 text-emerald-500" />,
      action: () => onSelectMode('fractions'),
      keywords: ['fraction', 'ratio', 'gcd', 'lcm', 'prime', 'factorization', 'simplify'],
    },
    {
      id: 'geometry',
      title: 'Triangle & Geometry Solver',
      subtitle: 'Trigonometric triangle solver with live vector preview, 2D and 3D shapes',
      category: 'Engines & Calculators',
      icon: <Triangle className="w-4 h-4 text-purple-500" />,
      action: () => onSelectMode('geometry'),
      keywords: [
        'geometry',
        'triangle',
        'pythagoras',
        'area',
        'volume',
        'shapes',
        'angles',
        'hypotenuse',
      ],
    },
    {
      id: 'equation',
      title: 'Equation & System Solver',
      subtitle: 'Linear, quadratic (ax²+bx+c=0), cubic, and 2×2 / 3×3 matrix linear systems',
      category: 'Engines & Calculators',
      icon: <Equal className="w-4 h-4 text-rose-500" />,
      action: () => onSelectMode('equation'),
      keywords: ['equation', 'quadratic', 'roots', 'discriminant', 'linear', 'system', 'cramer'],
    },
    {
      id: 'calculus',
      title: 'Calculus & Numerical Suite',
      subtitle: 'Definite integrals (Simpson), tangent line derivatives, Newton-Raphson roots',
      category: 'Engines & Calculators',
      icon: <Sigma className="w-4 h-4 text-blue-500" />,
      action: () => onSelectMode('calculus'),
      keywords: [
        'calculus',
        'integral',
        'derivative',
        'tangent',
        'newton',
        'limit',
        'area under curve',
      ],
    },
    {
      id: 'graphing',
      title: 'Graphing Calculator',
      subtitle: 'Plot up to 5 multi-colored functions, zoom, pan, table of values, export PNG',
      category: 'Engines & Calculators',
      icon: <LineChart className="w-4 h-4 text-teal-500" />,
      action: () => onSelectMode('graphing'),
      keywords: ['graph', 'plot', 'curve', 'cartesian', 'table', 'function', 'y=f(x)'],
    },
    {
      id: 'matrix',
      title: 'Matrix Calculator',
      subtitle: 'Matrix A + B, A × B, determinant, transpose, inverse, eigenvalues',
      category: 'Engines & Calculators',
      icon: <Grid className="w-4 h-4 text-indigo-500" />,
      action: () => onSelectMode('matrix'),
      keywords: [
        'matrix',
        'determinant',
        'inverse',
        'transpose',
        'multiplication',
        'linear algebra',
        '2x2',
        '3x3',
      ],
    },
    {
      id: 'statistics',
      title: 'Statistics Calculator',
      subtitle: 'Mean, median, mode, sample/population variance, standard deviation, IQR, z-scores',
      category: 'Engines & Calculators',
      icon: <BarChart2 className="w-4 h-4 text-yellow-500" />,
      action: () => onSelectMode('statistics'),
      keywords: [
        'stats',
        'statistics',
        'mean',
        'median',
        'mode',
        'std dev',
        'variance',
        'quartiles',
      ],
    },
    {
      id: 'programmer',
      title: 'Programmer Calculator',
      subtitle: 'HEX, DEC, OCT, BIN live conversions, 64/32/16/8-bit toggles, bitwise logic',
      category: 'Engines & Calculators',
      icon: <Binary className="w-4 h-4 text-cyan-500" />,
      action: () => onSelectMode('programmer'),
      keywords: [
        'programmer',
        'binary',
        'hex',
        'hexadecimal',
        'octal',
        'bitwise',
        'and',
        'or',
        'xor',
        'not',
        'shift',
      ],
    },
    {
      id: 'converter',
      title: 'Unit Converter',
      subtitle: 'Convert Length, Mass, Temperature, Digital Data, Speed, Time, Pressure, Area',
      category: 'Engines & Calculators',
      icon: <ArrowLeftRight className="w-4 h-4 text-emerald-400" />,
      action: () => onSelectMode('converter'),
      keywords: [
        'converter',
        'units',
        'meters',
        'feet',
        'kg',
        'pounds',
        'celsius',
        'fahrenheit',
        'megabytes',
        'gigabytes',
      ],
    },
    {
      id: 'finance',
      title: 'Finance & Loan Calculator',
      subtitle: 'Mortgage & Car Loan EMI, Compound Interest (FD/SIP), GST/Sales Tax, Discounts',
      category: 'Engines & Calculators',
      icon: <DollarSign className="w-4 h-4 text-green-500" />,
      action: () => onSelectMode('finance'),
      keywords: [
        'finance',
        'loan',
        'emi',
        'mortgage',
        'compound interest',
        'sip',
        'tax',
        'gst',
        'discount',
        'money',
      ],
    },
    {
      id: 'datetime',
      title: 'Date & Time Calculator',
      subtitle: 'Date duration, business working days, countdown milestone, hourly shift wage logs',
      category: 'Engines & Calculators',
      icon: <Calendar className="w-4 h-4 text-orange-500" />,
      action: () => onSelectMode('datetime'),
      keywords: [
        'date',
        'time',
        'duration',
        'business days',
        'holidays',
        'shift',
        'wage',
        'hours',
        'milestone',
      ],
    },
    {
      id: 'health',
      title: 'Health & Fitness Suite',
      subtitle:
        'BMI category, BMR & TDEE calorie deficit/surplus, target heart rate zones (Karvonen)',
      category: 'Engines & Calculators',
      icon: <Heart className="w-4 h-4 text-rose-500" />,
      action: () => onSelectMode('health'),
      keywords: [
        'health',
        'bmi',
        'bmr',
        'tdee',
        'calories',
        'weight',
        'heart rate',
        'fitness',
        'cardio',
      ],
    },
    {
      id: 'formulas',
      title: 'Formulas & Physical Constants',
      subtitle: 'Curated handbook of physics constants (c, G, h, k) and math identity cheat sheets',
      category: 'Formulas & Reference',
      icon: <BookOpen className="w-4 h-4 text-sky-400" />,
      action: () => onSelectMode('formulas'),
      keywords: [
        'formulas',
        'constants',
        'physics',
        'speed of light',
        'gravitation',
        'planck',
        'cheat sheet',
      ],
    },
    {
      id: 'history',
      title: 'Calculation History',
      subtitle: 'Search, review, filter by engine, copy results, and export CSV/JSON logs',
      category: 'Formulas & Reference',
      icon: <History className="w-4 h-4 text-slate-400" />,
      action: () => onSelectMode('history'),
      keywords: ['history', 'recent', 'past', 'log', 'export', 'csv', 'audit'],
    },
    {
      id: 'settings',
      title: 'Settings & Preferences',
      subtitle: 'Toggle themes (Dark/Light/OLED), audio haptics, precision, angle modes',
      category: 'Quick Actions',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => onSelectMode('settings'),
      keywords: ['settings', 'preferences', 'theme', 'accent', 'sound', 'haptic', 'decimal'],
    },
    // Quick Settings Actions
    {
      id: 'action-theme-light',
      title: 'Switch to Light Theme',
      subtitle: 'Clean high-contrast light mode with slate borders',
      category: 'Quick Actions',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      action: () => onUpdateSettings({ theme: 'light' }),
      keywords: ['theme', 'light', 'white', 'day'],
    },
    {
      id: 'action-theme-dark',
      title: 'Switch to Dark Slate Theme',
      subtitle: 'Deep eye-safe twilight navy palette',
      category: 'Quick Actions',
      icon: <Moon className="w-4 h-4 text-sky-400" />,
      action: () => onUpdateSettings({ theme: 'dark' }),
      keywords: ['theme', 'dark', 'night', 'slate'],
    },
    {
      id: 'action-theme-oled',
      title: 'Switch to OLED True Black Theme',
      subtitle: 'Maximum battery saving pure pitch black',
      category: 'Quick Actions',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => onUpdateSettings({ theme: 'oled' }),
      keywords: ['theme', 'oled', 'black', 'battery'],
    },
    {
      id: 'action-toggle-sound',
      title: settings.soundEnabled
        ? 'Mute Mechanical Audio Sounds'
        : 'Enable Mechanical Key Sounds',
      subtitle: settings.soundEnabled
        ? 'Disable tactile click sound effects'
        : 'Enable rich synthesized audio feedback',
      category: 'Quick Actions',
      icon: settings.soundEnabled ? (
        <VolumeX className="w-4 h-4 text-rose-400" />
      ) : (
        <Volume2 className="w-4 h-4 text-emerald-400" />
      ),
      action: () => onUpdateSettings({ soundEnabled: !settings.soundEnabled }),
      keywords: ['sound', 'audio', 'mute', 'click', 'volume', 'feedback'],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          const evt = new CustomEvent('open-command-palette');
          window.dispatchEvent(evt);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
    : isOled
      ? 'bg-zinc-950 border-zinc-800 text-white shadow-2xl'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl';

  const itemHover = isLight
    ? 'hover:bg-slate-100 text-slate-800'
    : isOled
      ? 'hover:bg-zinc-900 text-zinc-200'
      : 'hover:bg-slate-800/80 text-slate-200';

  const itemActive = isLight
    ? 'bg-sky-50 text-slate-900 border-sky-200 shadow-xs'
    : isOled
      ? 'bg-zinc-900 text-white border-zinc-700 shadow-xs'
      : 'bg-sky-950/60 text-white border-sky-600/40 shadow-xs';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        className={`w-full max-w-2xl rounded-3xl border ${modalBg} overflow-hidden flex flex-col max-h-[80vh] transition-all`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div
          className={`p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'} flex items-center gap-3`}
        >
          <Search className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a mathematical engine, formula, or tool... (e.g. Graph, BMI, Matrix, Loan, Hex)"
            className={`flex-1 bg-transparent border-none text-sm sm:text-base font-medium focus:outline-none ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-400'}`}
          />
          <kbd
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase ${isLight ? 'bg-slate-100 text-slate-600 border border-slate-300' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <span role="status">No matching calculators or tools found for "{query}".</span>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected ? itemActive : `${itemHover} border-transparent`
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${isLight ? 'bg-slate-100' : isOled ? 'bg-zinc-900' : 'bg-slate-800'}`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}
                        >
                          {cmd.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800/80 text-slate-400'}`}
                        >
                          {cmd.category}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
                      >
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-sky-500 opacity-100' : 'opacity-0'}`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div
          className={`p-3 border-t ${isLight ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-slate-800 text-slate-400 bg-slate-950/60'} flex items-center justify-between text-xs`}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Keyboard className="w-3.5 h-3.5" /> Navigate: ↑ / ↓
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px]">Select: ↵ Enter</span>
          </div>
          <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
            OmniCalc Quick Jump
          </span>
        </div>
      </div>
    </div>
  );
};
