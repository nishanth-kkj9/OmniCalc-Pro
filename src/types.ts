export type CalcMode = 
  | 'basic' 
  | 'scientific' 
  | 'programmer' 
  | 'graphing' 
  | 'converter' 
  | 'finance' 
  | 'matrix' 
  | 'statistics' 
  | 'equation'
  | 'calculus'
  | 'datetime'
  | 'health'
  | 'geometry'
  | 'fractions'
  | 'formulas' 
  | 'history' 
  | 'settings';

export type AngleMode = 'DEG' | 'RAD' | 'GRAD';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  mode: CalcMode;
  timestamp: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'oled';
  accentColor: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan';
  angleMode: AngleMode;
  precision: number; // 0 to 12
  notation: 'standard' | 'scientific' | 'engineering';
  thousandsSeparator: 'comma' | 'space' | 'period' | 'none';
  fontSize: 'compact' | 'normal' | 'large';
  soundEnabled: boolean;
  soundVolume: number; // 0.1 to 1.0
  soundProfile: 'mechanical' | 'soft' | 'beep' | 'tap';
  hapticFeedback: boolean;
  defaultMode: CalcMode;
  maxHistoryItems: number;
  autoSaveHistory: boolean;
}

export type UnitCategory = 
  | 'Length' 
  | 'Weight' 
  | 'Temperature' 
  | 'Speed' 
  | 'Storage' 
  | 'Time' 
  | 'Area' 
  | 'Volume' 
  | 'Pressure' 
  | 'Energy'
  | 'Power'
  | 'Data Rate'
  | 'Currency';

export type BitWordSize = 64 | 32 | 16 | 8;
export type NumberBase = 'HEX' | 'DEC' | 'OCT' | 'BIN';
