import React from 'react';
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
  Equal,
  Sigma,
  Calendar,
  Heart,
  Triangle,
  Divide
} from 'lucide-react';
import { CalcMode } from '../types';

interface SidebarProps {
  currentMode: CalcMode;
  onSelectMode: (mode: CalcMode) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
  settings?: AppSettings;
}

interface MenuItem {
  mode: CalcMode;
  label: string;
  icon: React.ReactNode;
  group: 'Core & Math' | 'Advanced & Science' | 'Practical & Life' | 'Tools & Reference';
}

const MENU_ITEMS: MenuItem[] = [
  // Core & Math
  { mode: 'basic', label: 'Basic Calculator', icon: <Calculator className="w-4 h-4" />, group: 'Core & Math' },
  { mode: 'scientific', label: 'Scientific Calculator', icon: <Sparkles className="w-4 h-4" />, group: 'Core & Math' },
  { mode: 'fractions', label: 'Fractions & Number Theory', icon: <Divide className="w-4 h-4" />, group: 'Core & Math' },
  { mode: 'geometry', label: 'Triangle & Geometry Solver', icon: <Triangle className="w-4 h-4" />, group: 'Core & Math' },

  // Advanced & Science
  { mode: 'equation', label: 'Equation & System Solver', icon: <Equal className="w-4 h-4" />, group: 'Advanced & Science' },
  { mode: 'calculus', label: 'Calculus & Numerical Suite', icon: <Sigma className="w-4 h-4" />, group: 'Advanced & Science' },
  { mode: 'graphing', label: 'Graphing Calculator', icon: <LineChart className="w-4 h-4" />, group: 'Advanced & Science' },
  { mode: 'matrix', label: 'Matrix Calculator', icon: <Grid className="w-4 h-4" />, group: 'Advanced & Science' },
  { mode: 'statistics', label: 'Statistics Calculator', icon: <BarChart2 className="w-4 h-4" />, group: 'Advanced & Science' },
  { mode: 'programmer', label: 'Programmer Calculator', icon: <Binary className="w-4 h-4" />, group: 'Advanced & Science' },

  // Practical & Life
  { mode: 'converter', label: 'Unit Converter', icon: <ArrowLeftRight className="w-4 h-4" />, group: 'Practical & Life' },
  { mode: 'finance', label: 'Finance & Loan EMI', icon: <DollarSign className="w-4 h-4" />, group: 'Practical & Life' },
  { mode: 'datetime', label: 'Date & Time Calculator', icon: <Calendar className="w-4 h-4" />, group: 'Practical & Life' },
  { mode: 'health', label: 'Health, BMI & TDEE', icon: <Heart className="w-4 h-4" />, group: 'Practical & Life' },

  // Tools & Reference
  { mode: 'formulas', label: 'Formulas & Constants', icon: <BookOpen className="w-4 h-4" />, group: 'Tools & Reference' },
  { mode: 'history', label: 'Calculation History', icon: <History className="w-4 h-4" />, group: 'Tools & Reference' },
  { mode: 'settings', label: 'Settings & Preferences', icon: <Settings className="w-4 h-4" />, group: 'Tools & Reference' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentMode, onSelectMode, isOpen, onCloseMobile, settings }) => {
  const groups = ['Core & Math', 'Advanced & Science', 'Practical & Life', 'Tools & Reference'] as const;

  const isLight = settings?.theme === 'light';
  const isOled = settings?.theme === 'oled';

  const sidebarBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-xl lg:shadow-none'
    : isOled
    ? 'bg-black border-zinc-800 text-white'
    : 'bg-slate-900 border-slate-800 text-slate-100';

  const headerBorder = isLight ? 'border-slate-200' : isOled ? 'border-zinc-800' : 'border-slate-800/80';
  const groupLabelColor = isLight ? 'text-slate-500' : isOled ? 'text-zinc-400' : 'text-slate-400';
  const idleBtnClass = isLight
    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    : isOled
    ? 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white';

  const footerColor = isLight ? 'text-slate-500 border-slate-200' : isOled ? 'text-zinc-400 border-zinc-800' : 'text-slate-500 border-slate-800/80';

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
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 border-r
        flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${sidebarBg}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* App Title Header */}
        <div className={`p-4 border-b ${headerBorder} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`font-bold text-base leading-tight tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>OmniCalc Pro</h1>
              <p className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>17 Mathematical Engines</p>
            </div>
          </div>
        </div>

        {/* Navigation items grouped */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {groups.map((groupName) => {
            const items = MENU_ITEMS.filter((m) => m.group === groupName);
            return (
              <div key={groupName} className="space-y-1">
                <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${groupLabelColor}`}>
                  {groupName}
                </div>
                {items.map((item) => {
                  const isActive = currentMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      onClick={() => {
                        onSelectMode(item.mode);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      style={isActive ? { backgroundColor: 'var(--accent)' } : undefined}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all duration-150
                        ${isActive 
                          ? 'text-white shadow-md font-semibold' 
                          : idleBtnClass
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? 'text-white' : isLight ? 'text-slate-500' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-75 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className={`p-3 border-t text-[11px] text-center ${footerColor}`}>
          OmniCalc Pro v3.0 • Multi-Engine Suite
        </div>
      </aside>
    </>
  );
};
