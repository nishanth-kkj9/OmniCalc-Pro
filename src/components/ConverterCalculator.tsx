import React, { useState } from 'react';
import { ArrowLeftRight, Copy, Check } from 'lucide-react';
import { UnitCategory, AppSettings } from '../types';

interface ConverterCalculatorProps {
  settings?: AppSettings;
}

interface UnitDef {
  code: string;
  name: string;
  factor: number; // Factor relative to base unit
}

const CATEGORY_UNITS: Record<UnitCategory, { base: string; units: Record<string, UnitDef> }> = {
  Length: {
    base: 'm',
    units: {
      m: { code: 'm', name: 'Meters', factor: 1 },
      km: { code: 'km', name: 'Kilometers', factor: 1000 },
      cm: { code: 'cm', name: 'Centimeters', factor: 0.01 },
      mm: { code: 'mm', name: 'Millimeters', factor: 0.001 },
      mi: { code: 'mi', name: 'Miles', factor: 1609.344 },
      ft: { code: 'ft', name: 'Feet', factor: 0.3048 },
      in: { code: 'in', name: 'Inches', factor: 0.0254 },
      yd: { code: 'yd', name: 'Yards', factor: 0.9144 },
    },
  },
  Weight: {
    base: 'kg',
    units: {
      kg: { code: 'kg', name: 'Kilograms', factor: 1 },
      g: { code: 'g', name: 'Grams', factor: 0.001 },
      mg: { code: 'mg', name: 'Milligrams', factor: 0.000001 },
      lb: { code: 'lb', name: 'Pounds', factor: 0.45359237 },
      oz: { code: 'oz', name: 'Ounces', factor: 0.02834952 },
      ton: { code: 'ton', name: 'Metric Tons', factor: 1000 },
    },
  },
  Temperature: {
    base: 'C',
    units: {
      C: { code: 'C', name: 'Celsius (°C)', factor: 1 },
      F: { code: 'F', name: 'Fahrenheit (°F)', factor: 1 },
      K: { code: 'K', name: 'Kelvin (K)', factor: 1 },
    },
  },
  Speed: {
    base: 'm/s',
    units: {
      'm/s': { code: 'm/s', name: 'Meters / sec', factor: 1 },
      'km/h': { code: 'km/h', name: 'Kilometers / hour', factor: 0.277778 },
      mph: { code: 'mph', name: 'Miles / hour', factor: 0.44704 },
      knot: { code: 'knot', name: 'Knots', factor: 0.514444 },
    },
  },
  Storage: {
    base: 'Byte',
    units: {
      Byte: { code: 'Byte', name: 'Bytes (B)', factor: 1 },
      KB: { code: 'KB', name: 'Kilobytes (KB)', factor: 1024 },
      MB: { code: 'MB', name: 'Megabytes (MB)', factor: 1024 ** 2 },
      GB: { code: 'GB', name: 'Gigabytes (GB)', factor: 1024 ** 3 },
      TB: { code: 'TB', name: 'Terabytes (TB)', factor: 1024 ** 4 },
      PB: { code: 'PB', name: 'Petabytes (PB)', factor: 1024 ** 5 },
    },
  },
  Time: {
    base: 's',
    units: {
      s: { code: 's', name: 'Seconds', factor: 1 },
      min: { code: 'min', name: 'Minutes', factor: 60 },
      h: { code: 'h', name: 'Hours', factor: 3600 },
      d: { code: 'd', name: 'Days', factor: 86400 },
      wk: { code: 'wk', name: 'Weeks', factor: 604800 },
      mo: { code: 'mo', name: 'Months (30d)', factor: 2592000 },
      yr: { code: 'yr', name: 'Years (365d)', factor: 31536000 },
    },
  },
  Area: {
    base: 'm2',
    units: {
      m2: { code: 'm2', name: 'Square Meters (m²)', factor: 1 },
      km2: { code: 'km2', name: 'Square Kilometers (km²)', factor: 1000000 },
      cm2: { code: 'cm2', name: 'Square Centimeters (cm²)', factor: 0.0001 },
      ha: { code: 'ha', name: 'Hectares (ha)', factor: 10000 },
      acre: { code: 'acre', name: 'Acres', factor: 4046.856 },
      ft2: { code: 'ft2', name: 'Square Feet (ft²)', factor: 0.092903 },
    },
  },
  Volume: {
    base: 'L',
    units: {
      L: { code: 'L', name: 'Liters (L)', factor: 1 },
      mL: { code: 'mL', name: 'Milliliters (mL)', factor: 0.001 },
      m3: { code: 'm3', name: 'Cubic Meters (m³)', factor: 1000 },
      gal: { code: 'gal', name: 'US Gallons', factor: 3.78541 },
      cup: { code: 'cup', name: 'US Cups', factor: 0.236588 },
      floz: { code: 'floz', name: 'Fluid Ounces (fl oz)', factor: 0.0295735 },
    },
  },
  Pressure: {
    base: 'Pa',
    units: {
      Pa: { code: 'Pa', name: 'Pascals (Pa)', factor: 1 },
      kPa: { code: 'kPa', name: 'Kilopascals (kPa)', factor: 1000 },
      bar: { code: 'bar', name: 'Bars', factor: 100000 },
      psi: { code: 'psi', name: 'Pounds / sq inch (psi)', factor: 6894.76 },
      atm: { code: 'atm', name: 'Atmospheres (atm)', factor: 101325 },
    },
  },
  Energy: {
    base: 'J',
    units: {
      J: { code: 'J', name: 'Joules (J)', factor: 1 },
      kJ: { code: 'kJ', name: 'Kilojoules (kJ)', factor: 1000 },
      cal: { code: 'cal', name: 'Calories (cal)', factor: 4.184 },
      kcal: { code: 'kcal', name: 'Kilocalories / Food Cal', factor: 4184 },
      kWh: { code: 'kWh', name: 'Kilowatt-hours (kWh)', factor: 3600000 },
      eV: { code: 'eV', name: 'Electronvolts (eV)', factor: 1.60218e-19 },
    },
  },
  Power: {
    base: 'W',
    units: {
      W: { code: 'W', name: 'Watts (W)', factor: 1 },
      kW: { code: 'kW', name: 'Kilowatts (kW)', factor: 1000 },
      MW: { code: 'MW', name: 'Megawatts (MW)', factor: 1e6 },
      hp: { code: 'hp', name: 'Horsepower (hp)', factor: 745.7 },
    },
  },
  'Data Rate': {
    base: 'bps',
    units: {
      bps: { code: 'bps', name: 'Bits / sec (bps)', factor: 1 },
      Kbps: { code: 'Kbps', name: 'Kilobits / sec (Kbps)', factor: 1000 },
      Mbps: { code: 'Mbps', name: 'Megabits / sec (Mbps)', factor: 1e6 },
      Gbps: { code: 'Gbps', name: 'Gigabits / sec (Gbps)', factor: 1e9 },
      'MB/s': { code: 'MB/s', name: 'Megabytes / sec', factor: 8e6 },
    },
  },
  Currency: {
    base: 'USD',
    units: {
      USD: { code: 'USD', name: 'US Dollar ($)', factor: 1 },
      EUR: { code: 'EUR', name: 'Euro (€)', factor: 1.08 },
      GBP: { code: 'GBP', name: 'British Pound (£)', factor: 1.27 },
      JPY: { code: 'JPY', name: 'Japanese Yen (¥)', factor: 0.0066 },
      CAD: { code: 'CAD', name: 'Canadian Dollar (C$)', factor: 0.74 },
      AUD: { code: 'AUD', name: 'Australian Dollar (A$)', factor: 0.65 },
      CHF: { code: 'CHF', name: 'Swiss Franc (CHF)', factor: 1.13 },
      INR: { code: 'INR', name: 'Indian Rupee (₹)', factor: 0.012 },
      CNY: { code: 'CNY', name: 'Chinese Yuan (¥)', factor: 0.14 },
    },
  },
};

export const ConverterCalculator: React.FC<ConverterCalculatorProps> = ({ settings: _settings }) => {
  const [category, setCategory] = useState<UnitCategory>('Length');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');
  const [inputValue, setInputValue] = useState<string>('1');
  const [copied, setCopied] = useState<boolean>(false);

  const unitsObj = CATEGORY_UNITS[category]?.units || CATEGORY_UNITS['Length'].units;

  // Convert function
  const convertValue = (valStr: string, from: string, to: string, cat: UnitCategory): string => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return '0';

    if (cat === 'Temperature') {
      let c = val;
      if (from === 'F') c = (val - 32) * (5 / 9);
      else if (from === 'K') c = val - 273.15;

      let res = c;
      if (to === 'F') res = c * (9 / 5) + 32;
      else if (to === 'K') res = c + 273.15;

      return (Math.round(res * 1000000) / 1000000).toString();
    }

    const fromFactor = CATEGORY_UNITS[cat]?.units[from]?.factor || 1;
    const toFactor = CATEGORY_UNITS[cat]?.units[to]?.factor || 1;

    const baseVal = val * fromFactor;
    const res = baseVal / toFactor;

    return (Math.round(res * 1000000) / 1000000).toString();
  };

  const outputValue = convertValue(inputValue, fromUnit, toUnit, category);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const changeCategory = (cat: UnitCategory) => {
    setCategory(cat);
    const keys = Object.keys(CATEGORY_UNITS[cat].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(`${inputValue} ${fromUnit} = ${outputValue} ${toUnit}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(Object.keys(CATEGORY_UNITS) as UnitCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => changeCategory(cat)}
            className={`
              px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm
              ${category === cat
                ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Conversion Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
          {/* Source Input */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">From</label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 text-2xl font-mono font-bold text-slate-100 focus:outline-none focus:border-sky-500"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl p-3 text-sm font-semibold text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {Object.values(unitsObj).map((u) => (
                <option key={u.code} value={u.code}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:col-span-1">
            <button
              onClick={swapUnits}
              className="p-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-2xl transition-all active:scale-95"
              title="Swap Units"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* Target Output */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">To</label>
            <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-2xl font-mono font-bold text-sky-300 truncate">
              {outputValue}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl p-3 text-sm font-semibold text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {Object.values(unitsObj).map((u) => (
                <option key={u.code} value={u.code}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result Action Bar */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
          <div className="text-sm font-semibold text-slate-300">
            {inputValue} <span className="text-slate-500">{unitsObj[fromUnit]?.name}</span> ={' '}
            <span className="text-sky-400 font-mono font-bold">{outputValue}</span>{' '}
            <span className="text-slate-500">{unitsObj[toUnit]?.name}</span>
          </div>

          <button
            onClick={copyResult}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700/80 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Result'}
          </button>
        </div>
      </div>
    </div>
  );
};
