import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Binary,
  LineChart,
  ArrowLeftRight,
  DollarSign,
  Grid,
  BarChart2,
  BookOpen,
  History,
  Settings,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Equal,
  Sigma,
  Calendar,
  Heart,
  Triangle,
  Divide,
  Search,
  X,
  Star,
  Pin,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { CalcMode, AppSettings } from '../types';
import { APP_NAME, APP_VERSION } from '../constants/version';

interface SidebarProps {
  currentMode: CalcMode;
  onSelectMode: (mode: CalcMode) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
  settings?: AppSettings;
  isRailCollapsed?: boolean;
  onToggleRailCollapse?: () => void;
}

interface MenuItem {
  mode: CalcMode;
  label: string;
  icon: React.ReactNode;
  group: 'Core & Math' | 'Advanced & Science' | 'Practical & Life' | 'Tools & Reference';
  keywords?: string;
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  // Core & Math
  {
    mode: 'basic',
    label: 'Basic Calculator',
    icon: <Calculator className="w-4 h-4 text-sky-400" />,
    group: 'Core & Math',
    keywords: 'arithmetic standard memory plus minus',
  },
  {
    mode: 'scientific',
    label: 'Scientific Calculator',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    group: 'Core & Math',
    keywords: 'trig sin cos tan log exponent power',
  },
  {
    mode: 'fractions',
    label: 'Fractions & Number Theory',
    icon: <Divide className="w-4 h-4 text-emerald-400" />,
    group: 'Core & Math',
    keywords: 'fraction ratio gcd lcm prime factor',
  },
  {
    mode: 'geometry',
    label: 'Triangle & Geometry Solver',
    icon: <Triangle className="w-4 h-4 text-purple-400" />,
    group: 'Core & Math',
    keywords: 'geometry triangle pythagoras area perimeter volume',
  },

  // Advanced & Science
  {
    mode: 'equation',
    label: 'Equation & System Solver',
    icon: <Equal className="w-4 h-4 text-rose-400" />,
    group: 'Advanced & Science',
    keywords: 'roots quadratic linear system matrix cramer',
  },
  {
    mode: 'calculus',
    label: 'Calculus & Numerical Suite',
    icon: <Sigma className="w-4 h-4 text-blue-400" />,
    group: 'Advanced & Science',
    keywords: 'integral derivative tangent newton simpson',
  },
  {
    mode: 'graphing',
    label: 'Graphing Calculator',
    icon: <LineChart className="w-4 h-4 text-teal-400" />,
    group: 'Advanced & Science',
    keywords: 'plot graph curve cartesian table coordinate',
  },
  {
    mode: 'matrix',
    label: 'Matrix Calculator',
    icon: <Grid className="w-4 h-4 text-violet-400" />,
    group: 'Advanced & Science',
    keywords: 'matrix determinant inverse transpose eigenvalues',
  },
  {
    mode: 'statistics',
    label: 'Statistics Calculator',
    icon: <BarChart2 className="w-4 h-4 text-sky-400" />,
    group: 'Advanced & Science',
    keywords: 'stats mean median mode variance std dev',
  },
  {
    mode: 'programmer',
    label: 'Programmer Calculator',
    icon: <Binary className="w-4 h-4 text-indigo-400" />,
    group: 'Advanced & Science',
    keywords: 'hex binary octal bitwise logic bit mask',
  },

  // Practical & Life
  {
    mode: 'converter',
    label: 'Unit Converter',
    icon: <ArrowLeftRight className="w-4 h-4 text-cyan-400" />,
    group: 'Practical & Life',
    keywords: 'convert length mass weight temp temperature storage data speed',
  },
  {
    mode: 'finance',
    label: 'Finance & Loan EMI',
    icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
    group: 'Practical & Life',
    keywords: 'mortgage emi interest compound sip tax gst discount',
  },
  {
    mode: 'datetime',
    label: 'Date & Time Calculator',
    icon: <Calendar className="w-4 h-4 text-amber-400" />,
    group: 'Practical & Life',
    keywords: 'date time duration days business age countdown shift',
  },
  {
    mode: 'health',
    label: 'Health, BMI & TDEE',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
    group: 'Practical & Life',
    keywords: 'bmi bmr tdee calories heart rate fitness',
  },

  // Tools & Reference
  {
    mode: 'formulas',
    label: 'Formulas & Constants',
    icon: <BookOpen className="w-4 h-4 text-indigo-400" />,
    group: 'Tools & Reference',
    keywords: 'physics cheat sheet math physical constants speed of light',
  },
  {
    mode: 'history',
    label: 'Calculation History',
    icon: <History className="w-4 h-4 text-slate-400" />,
    group: 'Tools & Reference',
    keywords: 'logs export csv recent audit past',
  },
  {
    mode: 'settings',
    label: 'Settings & Preferences',
    icon: <Settings className="w-4 h-4 text-slate-400" />,
    group: 'Tools & Reference',
    keywords: 'theme accent precision angle haptics audio',
  },
];

const DEFAULT_PINNED: CalcMode[] = ['basic', 'scientific', 'graphing', 'converter', 'finance'];

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  isOpen,
  onCloseMobile,
  settings,
  isRailCollapsed = false,
  onToggleRailCollapse,
}) => {
  const [filterText, setFilterText] = useState('');
  const [pinnedModes, setPinnedModes] = useState<CalcMode[]>(() => {
    try {
      const saved = localStorage.getItem('omnicalc_pinned_modes');
      return saved ? JSON.parse(saved) : DEFAULT_PINNED;
    } catch {
      return DEFAULT_PINNED;
    }
  });

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      localStorage.setItem('omnicalc_pinned_modes', JSON.stringify(pinnedModes));
    } catch {
      // ignore
    }
  }, [pinnedModes]);

  const togglePin = (e: React.MouseEvent, mode: CalcMode) => {
    e.stopPropagation();
    setPinnedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const groups = [
    'Core & Math',
    'Advanced & Science',
    'Practical & Life',
    'Tools & Reference',
  ] as const;

  const isLight = settings?.theme === 'light';
  const isOled = settings?.theme === 'oled';

  const sidebarBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-xl lg:shadow-none'
    : isOled
      ? 'bg-black border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100';

  const headerBorder = isLight
    ? 'border-slate-200'
    : isOled
      ? 'border-zinc-800'
      : 'border-slate-800/80';
  const groupLabelColor = isLight ? 'text-slate-500' : isOled ? 'text-zinc-400' : 'text-slate-400';
  const idleBtnClass = isLight
    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    : isOled
      ? 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white';

  const footerColor = isLight
    ? 'text-slate-500 border-slate-200'
    : isOled
      ? 'text-zinc-400 border-zinc-800'
      : 'text-slate-500 border-slate-800/80';

  const inputBg = isLight
    ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
    : isOled
      ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500'
      : 'bg-slate-800/80 border-slate-700/80 text-slate-100 placeholder-slate-400';

  const filteredItems = MENU_ITEMS.filter((item) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );
  });

  const pinnedItems = MENU_ITEMS.filter((item) => pinnedModes.includes(item.mode));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
        fixed top-0 bottom-0 left-0 z-50 border-r
        flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${sidebarBg}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isRailCollapsed ? 'w-72 lg:w-16' : 'w-72'}
      `}
      >
        {/* App Title Header */}
        <div className={`p-3 sm:p-4 border-b ${headerBorder} flex items-center justify-between`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 flex-shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            {!isRailCollapsed && (
              <div className="min-w-0">
                <h1
                  className={`font-bold text-base leading-tight tracking-tight truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}
                >
                  OmniCalc Pro
                </h1>
                <p
                  className="text-[11px] font-medium flex items-center gap-1.5"
                  style={{ color: 'var(--accent)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  17 Specialized Engines
                </p>
              </div>
            )}
          </div>

          {/* Desktop Rail Collapse/Expand Toggle */}
          {onToggleRailCollapse && (
            <button
              onClick={onToggleRailCollapse}
              className={`hidden lg:flex p-1.5 rounded-xl transition-colors ${idleBtnClass}`}
              title={isRailCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Sidebar to Icon Rail'}
            >
              {isRailCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-sky-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-white" />
              )}
            </button>
          )}
        </div>

        {/* Mini Icon Rail Mode (PC / Laptop) */}
        {isRailCollapsed ? (
          <div className="hidden lg:flex flex-1 flex-col items-center py-3 overflow-y-auto space-y-2 scrollbar-none">
            {MENU_ITEMS.map((item) => {
              const isActive = currentMode === item.mode;
              return (
                <button
                  key={`rail-${item.mode}`}
                  onClick={() => onSelectMode(item.mode)}
                  style={isActive ? { backgroundColor: 'var(--accent)' } : undefined}
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 relative group active:scale-95
                    ${isActive ? 'text-white shadow-md' : idleBtnClass}
                  `}
                  title={item.label}
                >
                  <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
                  {/* Floating tooltip */}
                  <span className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Full Sidebar Body */}
        <div className={`flex flex-col flex-1 min-h-0 ${isRailCollapsed ? 'lg:hidden' : ''}`}>
          {/* Quick Filter Input */}
          <div className="px-3 pt-3 pb-1">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-colors ${inputBg}`}
            >
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter engines (e.g. Graph, BMI)..."
                className="w-full bg-transparent border-none text-xs focus:outline-none"
              />
              {filterText && (
                <button
                  onClick={() => setFilterText('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation items grouped */}
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3.5">
            {/* Pinned / Quick Access Bar (if not filtering) */}
            {!filterText.trim() && pinnedItems.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 py-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${groupLabelColor}`}
                  >
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Quick Pinned
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">{pinnedItems.length}</span>
                </div>
                <div className="space-y-0.5">
                  {pinnedItems.map((item) => {
                    const isActive = currentMode === item.mode;
                    return (
                      <button
                        key={`pinned-${item.mode}`}
                        onClick={() => {
                          onSelectMode(item.mode);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        style={isActive ? { backgroundColor: 'var(--accent)' } : undefined}
                        className={`
                          w-full flex items-center justify-between px-3 py-1.5 rounded-xl font-medium text-xs transition-all duration-150 active:scale-[0.98] group
                          ${isActive ? 'text-white shadow-md font-semibold' : idleBtnClass}
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            onClick={(e) => togglePin(e, item.mode)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-amber-400 transition-opacity"
                            title="Unpin from top"
                          >
                            <Pin className="w-3 h-3 rotate-45 text-amber-400 fill-amber-400" />
                          </span>
                          {isActive && (
                            <ChevronRight className="w-3.5 h-3.5 opacity-75 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categorized Groups */}
            {groups.map((groupName) => {
              const items = filteredItems.filter((m) => m.group === groupName);
              if (items.length === 0) return null;
              const isCollapsed = collapsedGroups[groupName] && !filterText.trim();

              return (
                <div key={groupName} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="w-full flex items-center justify-between px-3 py-1 text-left rounded-lg hover:bg-slate-500/10 transition-colors"
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${groupLabelColor}`}
                    >
                      {groupName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {items.length}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const isActive = currentMode === item.mode;
                        const isPinned = pinnedModes.includes(item.mode);
                        return (
                          <button
                            key={item.mode}
                            onClick={() => {
                              onSelectMode(item.mode);
                              if (onCloseMobile) onCloseMobile();
                            }}
                            style={isActive ? { backgroundColor: 'var(--accent)' } : undefined}
                            className={`
                              w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all duration-150 active:scale-[0.98] group
                              ${isActive ? 'text-white shadow-md font-semibold' : idleBtnClass}
                            `}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
                              <span className="truncate">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span
                                onClick={(e) => togglePin(e, item.mode)}
                                className={`p-0.5 rounded transition-opacity ${
                                  isPinned
                                    ? 'text-amber-400 opacity-80 hover:opacity-100'
                                    : 'opacity-0 group-hover:opacity-60 hover:opacity-100 text-slate-400 hover:text-amber-400'
                                }`}
                                title={isPinned ? 'Unpin' : 'Pin to quick favorites'}
                              >
                                <Pin
                                  className={`w-3 h-3 ${isPinned ? 'fill-amber-400 rotate-45' : ''}`}
                                />
                              </span>
                              {isActive && (
                                <ChevronRight className="w-3.5 h-3.5 opacity-75 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                No engines match "{filterText}".
              </div>
            )}
          </div>

          {/* Footer info */}
          <div
            className={`p-3 border-t text-[11px] text-center flex items-center justify-between px-4 ${footerColor}`}
          >
            <span>
              {APP_NAME} v{APP_VERSION} • Multi-Engine
            </span>
            <span className="font-mono text-[10px] text-slate-500">⌘K</span>
          </div>
        </div>
      </aside>
    </>
  );
};
