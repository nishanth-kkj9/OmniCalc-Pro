export type CalcMode =
  | 'basic'
  | 'scientific'
  | 'graph'
  | 'programmer'
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
  | 'settings'
  | 'regression'
  | 'probability'
  | 'sequences'
  | 'complex';

export type AngleMode = 'DEG' | 'RAD' | 'GRAD';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface GraphExpression {
  id: string;
  expression: string;
  visible: boolean;
  color: string;
  lineWidth: number;
  lineStyle: LineStyle;
  label?: string;
  domainMin?: number;
  domainMax?: number;
  type?: 'function' | 'parametric' | 'polar' | 'inequality';
  inequalityOp?: '<' | '<=' | '>' | '>=';
  parametricY?: string;
  tMin?: number;
  tMax?: number;
  thetaMin?: number;
  thetaMax?: number;
  showDerivative?: boolean;
  showSecondDerivative?: boolean;
}

export interface GraphViewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface GraphSettings {
  showGrid: boolean;
  showMinorGrid: boolean;
  showAxes: boolean;
  showAxisLabels: boolean;
  showCoordinates: boolean;
  showCurveLabels: boolean;
  lockAspectRatio: boolean;
}

export interface GraphSlider {
  id: string;
  name: string; // e.g. 'a', 'b', 'c', 'k'
  value: number;
  min: number;
  max: number;
  step: number;
}

export interface GraphSession {
  id: string;
  title: string;
  version: number;
  expressions: GraphExpression[];
  sliders: GraphSlider[];
  viewport: GraphViewport;
  settings: GraphSettings;
  timestamp: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface CurveSegment {
  points: Point2D[];
}

export interface GraphRoot {
  x: number;
  y: number;
  expressionId: string;
  expressionLabel: string;
}

export interface GraphExtremum {
  x: number;
  y: number;
  type: 'min' | 'max';
  expressionId: string;
  expressionLabel: string;
}

export interface GraphIntersection {
  x: number;
  y: number;
  expr1Id: string;
  expr1Label: string;
  expr2Id: string;
  expr2Label: string;
}

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

export const SETTINGS_STORAGE_KEY = 'omnicalc_settings_v2';
export const LEGACY_SETTINGS_STORAGE_KEY = 'omnicalc_settings';
