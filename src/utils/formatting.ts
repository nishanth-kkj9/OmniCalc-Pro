import { AppSettings } from '../types';

export function formatNumberWithSettings(
  val: number | string,
  settings?: Partial<AppSettings>
): string {
  if (typeof val === 'string') {
    if (val === 'Error' || val === 'NaN' || val === 'Infinity' || val === '-Infinity' || val === '') {
      return val;
    }
    const parsed = Number(val);
    if (isNaN(parsed)) return val;
    val = parsed;
  }

  if (typeof val !== 'number' || isNaN(val)) return 'NaN';
  if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';

  const precision = settings?.precision !== undefined ? settings.precision : 6;
  const notation = settings?.notation || 'standard';
  const thousandsSeparator = settings?.thousandsSeparator || 'comma';

  if (notation === 'scientific') {
    return val.toExponential(precision);
  }

  if (notation === 'engineering') {
    if (val === 0) return '0';
    const exp = Math.floor(Math.log10(Math.abs(val)) / 3) * 3;
    const mantissa = val / Math.pow(10, exp);
    return `${mantissa.toFixed(precision)}e${exp >= 0 ? '+' : ''}${exp}`;
  }

  // Standard notation
  // Avoid floating-point multiplication roundoff artifacts by using toFixed
  let formatted: string;
  if (Number.isInteger(val)) {
    formatted = val.toString();
  } else {
    const parsed = Number.parseFloat(val.toFixed(precision));
    formatted = parsed.toString();
  }

  // Separate integer and decimal parts
  const parts = formatted.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  if (thousandsSeparator === 'comma') {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  } else if (thousandsSeparator === 'space') {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  } else if (thousandsSeparator === 'period') {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
  }

  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
}

export const ACCENT_COLOR_MAP: Record<string, {
  name: string;
  primary: string;
  hover: string;
  ring: string;
  bgLight: string;
  border: string;
  text: string;
}> = {
  sky: {
    name: 'Sky Blue',
    primary: '#0284c7',
    hover: '#0369a1',
    ring: 'ring-sky-500',
    bgLight: 'bg-sky-500/20',
    border: 'border-sky-500/40',
    text: 'text-sky-400',
  },
  emerald: {
    name: 'Emerald Green',
    primary: '#059669',
    hover: '#047857',
    ring: 'ring-emerald-500',
    bgLight: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
  },
  violet: {
    name: 'Violet Indigo',
    primary: '#7c3aed',
    hover: '#6d28d9',
    ring: 'ring-violet-500',
    bgLight: 'bg-violet-500/20',
    border: 'border-violet-500/40',
    text: 'text-violet-400',
  },
  amber: {
    name: 'Amber Gold',
    primary: '#d97706',
    hover: '#b45309',
    ring: 'ring-amber-500',
    bgLight: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
  },
  rose: {
    name: 'Rose Pink',
    primary: '#e11d48',
    hover: '#be123c',
    ring: 'ring-rose-500',
    bgLight: 'bg-rose-500/20',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
  },
  cyan: {
    name: 'Cyan Teal',
    primary: '#0891b2',
    hover: '#0e7490',
    ring: 'ring-cyan-500',
    bgLight: 'bg-cyan-500/20',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
  },
};
