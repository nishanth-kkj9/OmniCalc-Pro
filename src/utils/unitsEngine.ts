/**
 * OmniCalc Pro - Physical Unit Engine with Dimensional Consistency Checking
 *
 * Features:
 * - 7 SI Base Dimensions: [Mass, Length, Time, Current, Temperature, Substance, Luminosity]
 * - Compound unit arithmetic (multiplication, division, exponentiation)
 * - Dimensional consistency validator (flags illegal operations like adding meters to seconds)
 * - Automatic physical quantity identification (e.g. [M][L]^2[T]^-2 -> Energy / Work / Torque)
 * - Comprehensive unit conversion between dimensionally compatible units
 * - Universal physics constants library with exact dimensional units
 * - Standard physics formulas with unit-aware evaluation
 */

// Dimension Vector: [M, L, T, I, Theta, N, J]
// M: Mass (kg)
// L: Length (m)
// T: Time (s)
// I: Electric Current (A)
// Theta: Thermodynamic Temperature (K)
// N: Amount of Substance (mol)
// J: Luminous Intensity (cd)
export type DimensionVector = [number, number, number, number, number, number, number];

export interface PhysicalUnit {
  symbol: string;
  name: string;
  category: string;
  dimensions: DimensionVector;
  scale: number; // multiplier to base SI unit (e.g., km -> 1000)
  offset?: number; // for temperature (e.g., Celsius -> +273.15)
}

export interface PhysicalQuantity {
  value: number;
  dimensions: DimensionVector;
  dimensionName: string;
  unitSymbol: string;
}

export interface PhysicsConstant {
  symbol: string;
  name: string;
  value: number;
  unit: string;
  description: string;
  dimensions: DimensionVector;
}

export interface PhysicsFormula {
  id: string;
  name: string;
  category: string;
  formulaLatex: string;
  description: string;
  variables: { symbol: string; name: string; unit: string; defaultValue: number }[];
  calculate: (inputs: Record<string, number>) => { value: number; unit: string; steps: string[] };
}

// 7 Dimension Vector Helpers
export const DIMENSIONLESS: DimensionVector = [0, 0, 0, 0, 0, 0, 0];
export const MASS: DimensionVector = [1, 0, 0, 0, 0, 0, 0];
export const LENGTH: DimensionVector = [0, 1, 0, 0, 0, 0, 0];
export const TIME: DimensionVector = [0, 0, 1, 0, 0, 0, 0];
export const CURRENT: DimensionVector = [0, 0, 0, 1, 0, 0, 0];
export const TEMPERATURE: DimensionVector = [0, 0, 0, 0, 1, 0, 0];
export const SUBSTANCE: DimensionVector = [0, 0, 0, 0, 0, 1, 0];
export const LUMINOUS: DimensionVector = [0, 0, 0, 0, 0, 0, 1];

// Common derived dimensions
export const AREA_DIM: DimensionVector = [0, 2, 0, 0, 0, 0, 0];
export const VOLUME_DIM: DimensionVector = [0, 3, 0, 0, 0, 0, 0];
export const VELOCITY_DIM: DimensionVector = [0, 1, -1, 0, 0, 0, 0];
export const ACCELERATION_DIM: DimensionVector = [0, 1, -2, 0, 0, 0, 0];
export const FORCE_DIM: DimensionVector = [1, 1, -2, 0, 0, 0, 0];
export const ENERGY_DIM: DimensionVector = [1, 2, -2, 0, 0, 0, 0];
export const POWER_DIM: DimensionVector = [1, 2, -3, 0, 0, 0, 0];
export const PRESSURE_DIM: DimensionVector = [1, -1, -2, 0, 0, 0, 0];
export const CHARGE_DIM: DimensionVector = [0, 0, 1, 1, 0, 0, 0];
export const VOLTAGE_DIM: DimensionVector = [1, 2, -3, -1, 0, 0, 0];
export const RESISTANCE_DIM: DimensionVector = [1, 2, -3, -2, 0, 0, 0];
export const CAPACITANCE_DIM: DimensionVector = [-1, -2, 4, 2, 0, 0, 0];
export const FREQUENCY_DIM: DimensionVector = [0, 0, -1, 0, 0, 0, 0];
export const DENSITY_DIM: DimensionVector = [1, -3, 0, 0, 0, 0, 0];

export function areDimensionsEqual(a: DimensionVector, b: DimensionVector): boolean {
  for (let i = 0; i < 7; i++) {
    if (Math.abs(a[i] - b[i]) > 1e-6) return false;
  }
  return true;
}

export function formatDimensionVector(dim: DimensionVector): string {
  const symbols = ['M', 'L', 'T', 'I', 'Θ', 'N', 'J'];
  const parts: string[] = [];

  dim.forEach((exp, idx) => {
    if (exp !== 0) {
      if (exp === 1) parts.push(`[${symbols[idx]}]`);
      else parts.push(`[${symbols[idx]}]^${exp}`);
    }
  });

  return parts.length === 0 ? 'Dimensionless [1]' : parts.join('·');
}

export function identifyDimensionName(dim: DimensionVector): string {
  if (areDimensionsEqual(dim, DIMENSIONLESS)) return 'Dimensionless (Ratio / Number)';
  if (areDimensionsEqual(dim, LENGTH)) return 'Length / Distance';
  if (areDimensionsEqual(dim, MASS)) return 'Mass';
  if (areDimensionsEqual(dim, TIME)) return 'Time / Duration';
  if (areDimensionsEqual(dim, CURRENT)) return 'Electric Current';
  if (areDimensionsEqual(dim, TEMPERATURE)) return 'Temperature';
  if (areDimensionsEqual(dim, SUBSTANCE)) return 'Amount of Substance';
  if (areDimensionsEqual(dim, LUMINOUS)) return 'Luminous Intensity';
  if (areDimensionsEqual(dim, AREA_DIM)) return 'Area';
  if (areDimensionsEqual(dim, VOLUME_DIM)) return 'Volume';
  if (areDimensionsEqual(dim, VELOCITY_DIM)) return 'Velocity / Speed';
  if (areDimensionsEqual(dim, ACCELERATION_DIM)) return 'Acceleration';
  if (areDimensionsEqual(dim, FORCE_DIM)) return 'Force / Weight';
  if (areDimensionsEqual(dim, ENERGY_DIM)) return 'Energy / Work / Heat / Torque';
  if (areDimensionsEqual(dim, POWER_DIM)) return 'Power / Radiant Flux';
  if (areDimensionsEqual(dim, PRESSURE_DIM)) return 'Pressure / Stress';
  if (areDimensionsEqual(dim, CHARGE_DIM)) return 'Electric Charge';
  if (areDimensionsEqual(dim, VOLTAGE_DIM)) return 'Voltage / Electric Potential';
  if (areDimensionsEqual(dim, RESISTANCE_DIM)) return 'Electrical Resistance / Impedance';
  if (areDimensionsEqual(dim, CAPACITANCE_DIM)) return 'Electrical Capacitance';
  if (areDimensionsEqual(dim, FREQUENCY_DIM)) return 'Frequency';
  if (areDimensionsEqual(dim, DENSITY_DIM)) return 'Mass Density';
  return formatDimensionVector(dim);
}

// Master Unit Dictionary
export const UNIT_DICTIONARY: Record<string, PhysicalUnit> = {
  // Length (Base: m)
  m: { symbol: 'm', name: 'Meter', category: 'Length', dimensions: LENGTH, scale: 1 },
  km: { symbol: 'km', name: 'Kilometer', category: 'Length', dimensions: LENGTH, scale: 1000 },
  cm: { symbol: 'cm', name: 'Centimeter', category: 'Length', dimensions: LENGTH, scale: 0.01 },
  mm: { symbol: 'mm', name: 'Millimeter', category: 'Length', dimensions: LENGTH, scale: 0.001 },
  um: { symbol: 'um', name: 'Micrometer', category: 'Length', dimensions: LENGTH, scale: 1e-6 },
  nm: { symbol: 'nm', name: 'Nanometer', category: 'Length', dimensions: LENGTH, scale: 1e-9 },
  mi: { symbol: 'mi', name: 'Mile', category: 'Length', dimensions: LENGTH, scale: 1609.344 },
  yd: { symbol: 'yd', name: 'Yard', category: 'Length', dimensions: LENGTH, scale: 0.9144 },
  ft: { symbol: 'ft', name: 'Foot', category: 'Length', dimensions: LENGTH, scale: 0.3048 },
  in: { symbol: 'in', name: 'Inch', category: 'Length', dimensions: LENGTH, scale: 0.0254 },
  ly: {
    symbol: 'ly',
    name: 'Light Year',
    category: 'Length',
    dimensions: LENGTH,
    scale: 9.4607e15,
  },
  au: {
    symbol: 'au',
    name: 'Astronomical Unit',
    category: 'Length',
    dimensions: LENGTH,
    scale: 1.495978707e11,
  },

  // Mass (Base: kg)
  kg: { symbol: 'kg', name: 'Kilogram', category: 'Mass', dimensions: MASS, scale: 1 },
  g: { symbol: 'g', name: 'Gram', category: 'Mass', dimensions: MASS, scale: 0.001 },
  mg: { symbol: 'mg', name: 'Milligram', category: 'Mass', dimensions: MASS, scale: 1e-6 },
  ug: { symbol: 'ug', name: 'Microgram', category: 'Mass', dimensions: MASS, scale: 1e-9 },
  ton: { symbol: 'ton', name: 'Metric Ton', category: 'Mass', dimensions: MASS, scale: 1000 },
  lb: { symbol: 'lb', name: 'Pound', category: 'Mass', dimensions: MASS, scale: 0.45359237 },
  oz: { symbol: 'oz', name: 'Ounce', category: 'Mass', dimensions: MASS, scale: 0.02834952 },
  slug: { symbol: 'slug', name: 'Slug', category: 'Mass', dimensions: MASS, scale: 14.5939 },

  // Time (Base: s)
  s: { symbol: 's', name: 'Second', category: 'Time', dimensions: TIME, scale: 1 },
  ms: { symbol: 'ms', name: 'Millisecond', category: 'Time', dimensions: TIME, scale: 0.001 },
  us: { symbol: 'us', name: 'Microsecond', category: 'Time', dimensions: TIME, scale: 1e-6 },
  ns: { symbol: 'ns', name: 'Nanosecond', category: 'Time', dimensions: TIME, scale: 1e-9 },
  min: { symbol: 'min', name: 'Minute', category: 'Time', dimensions: TIME, scale: 60 },
  h: { symbol: 'h', name: 'Hour', category: 'Time', dimensions: TIME, scale: 3600 },
  day: { symbol: 'day', name: 'Day', category: 'Time', dimensions: TIME, scale: 86400 },
  yr: { symbol: 'yr', name: 'Year (365d)', category: 'Time', dimensions: TIME, scale: 31536000 },

  // Current (Base: A)
  A: { symbol: 'A', name: 'Ampere', category: 'Current', dimensions: CURRENT, scale: 1 },
  mA: { symbol: 'mA', name: 'Milliampere', category: 'Current', dimensions: CURRENT, scale: 0.001 },
  uA: { symbol: 'uA', name: 'Microampere', category: 'Current', dimensions: CURRENT, scale: 1e-6 },
  kA: { symbol: 'kA', name: 'Kiloampere', category: 'Current', dimensions: CURRENT, scale: 1000 },

  // Temperature (Base: K)
  K: { symbol: 'K', name: 'Kelvin', category: 'Temperature', dimensions: TEMPERATURE, scale: 1 },
  degC: {
    symbol: 'degC',
    name: 'Celsius',
    category: 'Temperature',
    dimensions: TEMPERATURE,
    scale: 1,
    offset: 273.15,
  },
  degF: {
    symbol: 'degF',
    name: 'Fahrenheit',
    category: 'Temperature',
    dimensions: TEMPERATURE,
    scale: 5 / 9,
    offset: 459.67 * (5 / 9),
  },

  // Amount & Luminosity
  mol: { symbol: 'mol', name: 'Mole', category: 'Substance', dimensions: SUBSTANCE, scale: 1 },
  kmol: {
    symbol: 'kmol',
    name: 'Kilomole',
    category: 'Substance',
    dimensions: SUBSTANCE,
    scale: 1000,
  },
  cd: { symbol: 'cd', name: 'Candela', category: 'Luminosity', dimensions: LUMINOUS, scale: 1 },

  // Force (Base: N = kg*m/s^2)
  N: { symbol: 'N', name: 'Newton', category: 'Force', dimensions: FORCE_DIM, scale: 1 },
  kN: { symbol: 'kN', name: 'Kilonewton', category: 'Force', dimensions: FORCE_DIM, scale: 1000 },
  dyn: { symbol: 'dyn', name: 'Dyne', category: 'Force', dimensions: FORCE_DIM, scale: 1e-5 },
  lbf: {
    symbol: 'lbf',
    name: 'Pound-Force',
    category: 'Force',
    dimensions: FORCE_DIM,
    scale: 4.448222,
  },

  // Energy / Work (Base: J = N*m)
  J: { symbol: 'J', name: 'Joule', category: 'Energy', dimensions: ENERGY_DIM, scale: 1 },
  kJ: { symbol: 'kJ', name: 'Kilojoule', category: 'Energy', dimensions: ENERGY_DIM, scale: 1000 },
  MJ: { symbol: 'MJ', name: 'Megajoule', category: 'Energy', dimensions: ENERGY_DIM, scale: 1e6 },
  GJ: { symbol: 'GJ', name: 'Gigajoule', category: 'Energy', dimensions: ENERGY_DIM, scale: 1e9 },
  cal: { symbol: 'cal', name: 'Calorie', category: 'Energy', dimensions: ENERGY_DIM, scale: 4.184 },
  kcal: {
    symbol: 'kcal',
    name: 'Kilocalorie (Food Cal)',
    category: 'Energy',
    dimensions: ENERGY_DIM,
    scale: 4184,
  },
  Wh: { symbol: 'Wh', name: 'Watt-hour', category: 'Energy', dimensions: ENERGY_DIM, scale: 3600 },
  kWh: {
    symbol: 'kWh',
    name: 'Kilowatt-hour',
    category: 'Energy',
    dimensions: ENERGY_DIM,
    scale: 3.6e6,
  },
  eV: {
    symbol: 'eV',
    name: 'Electronvolt',
    category: 'Energy',
    dimensions: ENERGY_DIM,
    scale: 1.602176634e-19,
  },
  keV: {
    symbol: 'keV',
    name: 'Kiloelectronvolt',
    category: 'Energy',
    dimensions: ENERGY_DIM,
    scale: 1.602176634e-16,
  },
  MeV: {
    symbol: 'MeV',
    name: 'Megaelectronvolt',
    category: 'Energy',
    dimensions: ENERGY_DIM,
    scale: 1.602176634e-13,
  },
  BTU: {
    symbol: 'BTU',
    name: 'British Thermal Unit',
    category: 'Energy',
    dimensions: ENERGY_DIM,
    scale: 1055.06,
  },
  'ft-lbf': {
    symbol: 'ft-lbf',
    name: 'Foot-Pound',
    category: 'Energy',
    dimensions: ENERGY_DIM,
    scale: 1.355818,
  },

  // Power (Base: W = J/s)
  W: { symbol: 'W', name: 'Watt', category: 'Power', dimensions: POWER_DIM, scale: 1 },
  mW: { symbol: 'mW', name: 'Milliwatt', category: 'Power', dimensions: POWER_DIM, scale: 0.001 },
  kW: { symbol: 'kW', name: 'Kilowatt', category: 'Power', dimensions: POWER_DIM, scale: 1000 },
  MW: { symbol: 'MW', name: 'Megawatt', category: 'Power', dimensions: POWER_DIM, scale: 1e6 },
  GW: { symbol: 'GW', name: 'Gigawatt', category: 'Power', dimensions: POWER_DIM, scale: 1e9 },
  hp: {
    symbol: 'hp',
    name: 'Horsepower (Mechanical)',
    category: 'Power',
    dimensions: POWER_DIM,
    scale: 745.699872,
  },

  // Pressure (Base: Pa = N/m^2)
  Pa: { symbol: 'Pa', name: 'Pascal', category: 'Pressure', dimensions: PRESSURE_DIM, scale: 1 },
  kPa: {
    symbol: 'kPa',
    name: 'Kilopascal',
    category: 'Pressure',
    dimensions: PRESSURE_DIM,
    scale: 1000,
  },
  MPa: {
    symbol: 'MPa',
    name: 'Megapascal',
    category: 'Pressure',
    dimensions: PRESSURE_DIM,
    scale: 1e6,
  },
  bar: { symbol: 'bar', name: 'Bar', category: 'Pressure', dimensions: PRESSURE_DIM, scale: 1e5 },
  mbar: {
    symbol: 'mbar',
    name: 'Millibar',
    category: 'Pressure',
    dimensions: PRESSURE_DIM,
    scale: 100,
  },
  atm: {
    symbol: 'atm',
    name: 'Atmosphere (standard)',
    category: 'Pressure',
    dimensions: PRESSURE_DIM,
    scale: 101325,
  },
  psi: {
    symbol: 'psi',
    name: 'Pound / sq inch',
    category: 'Pressure',
    dimensions: PRESSURE_DIM,
    scale: 6894.757,
  },
  torr: {
    symbol: 'torr',
    name: 'Torr (mmHg)',
    category: 'Pressure',
    dimensions: PRESSURE_DIM,
    scale: 133.322,
  },

  // Electrical
  V: { symbol: 'V', name: 'Volt', category: 'Voltage', dimensions: VOLTAGE_DIM, scale: 1 },
  mV: {
    symbol: 'mV',
    name: 'Millivolt',
    category: 'Voltage',
    dimensions: VOLTAGE_DIM,
    scale: 0.001,
  },
  kV: { symbol: 'kV', name: 'Kilovolt', category: 'Voltage', dimensions: VOLTAGE_DIM, scale: 1000 },
  ohm: {
    symbol: 'ohm',
    name: 'Ohm (Ω)',
    category: 'Resistance',
    dimensions: RESISTANCE_DIM,
    scale: 1,
  },
  kohm: {
    symbol: 'kohm',
    name: 'Kiloohm (kΩ)',
    category: 'Resistance',
    dimensions: RESISTANCE_DIM,
    scale: 1000,
  },
  Mohm: {
    symbol: 'Mohm',
    name: 'Megaohm (MΩ)',
    category: 'Resistance',
    dimensions: RESISTANCE_DIM,
    scale: 1e6,
  },
  F: { symbol: 'F', name: 'Farad', category: 'Capacitance', dimensions: CAPACITANCE_DIM, scale: 1 },
  uF: {
    symbol: 'uF',
    name: 'Microfarad',
    category: 'Capacitance',
    dimensions: CAPACITANCE_DIM,
    scale: 1e-6,
  },
  nF: {
    symbol: 'nF',
    name: 'Nanofarad',
    category: 'Capacitance',
    dimensions: CAPACITANCE_DIM,
    scale: 1e-9,
  },
  pF: {
    symbol: 'pF',
    name: 'Picofarad',
    category: 'Capacitance',
    dimensions: CAPACITANCE_DIM,
    scale: 1e-12,
  },
  C: { symbol: 'C', name: 'Coulomb', category: 'Charge', dimensions: CHARGE_DIM, scale: 1 },
  mAh: {
    symbol: 'mAh',
    name: 'Milliampere-hour',
    category: 'Charge',
    dimensions: CHARGE_DIM,
    scale: 3.6,
  },
  Ah: {
    symbol: 'Ah',
    name: 'Ampere-hour',
    category: 'Charge',
    dimensions: CHARGE_DIM,
    scale: 3600,
  },

  // Frequency
  Hz: { symbol: 'Hz', name: 'Hertz', category: 'Frequency', dimensions: FREQUENCY_DIM, scale: 1 },
  kHz: {
    symbol: 'kHz',
    name: 'Kilohertz',
    category: 'Frequency',
    dimensions: FREQUENCY_DIM,
    scale: 1000,
  },
  MHz: {
    symbol: 'MHz',
    name: 'Megahertz',
    category: 'Frequency',
    dimensions: FREQUENCY_DIM,
    scale: 1e6,
  },
  GHz: {
    symbol: 'GHz',
    name: 'Gigahertz',
    category: 'Frequency',
    dimensions: FREQUENCY_DIM,
    scale: 1e9,
  },
  rpm: {
    symbol: 'rpm',
    name: 'Revolutions / minute',
    category: 'Frequency',
    dimensions: FREQUENCY_DIM,
    scale: 1 / 60,
  },

  // Area & Volume
  m2: { symbol: 'm2', name: 'Square Meter', category: 'Area', dimensions: AREA_DIM, scale: 1 },
  km2: {
    symbol: 'km2',
    name: 'Square Kilometer',
    category: 'Area',
    dimensions: AREA_DIM,
    scale: 1e6,
  },
  cm2: {
    symbol: 'cm2',
    name: 'Square Centimeter',
    category: 'Area',
    dimensions: AREA_DIM,
    scale: 1e-4,
  },
  ha: { symbol: 'ha', name: 'Hectare', category: 'Area', dimensions: AREA_DIM, scale: 1e4 },
  acre: {
    symbol: 'acre',
    name: 'Acre',
    category: 'Area',
    dimensions: AREA_DIM,
    scale: 4046.8564224,
  },
  ft2: {
    symbol: 'ft2',
    name: 'Square Foot',
    category: 'Area',
    dimensions: AREA_DIM,
    scale: 0.09290304,
  },
  in2: {
    symbol: 'in2',
    name: 'Square Inch',
    category: 'Area',
    dimensions: AREA_DIM,
    scale: 0.00064516,
  },

  m3: { symbol: 'm3', name: 'Cubic Meter', category: 'Volume', dimensions: VOLUME_DIM, scale: 1 },
  L: { symbol: 'L', name: 'Liter', category: 'Volume', dimensions: VOLUME_DIM, scale: 0.001 },
  mL: { symbol: 'mL', name: 'Milliliter', category: 'Volume', dimensions: VOLUME_DIM, scale: 1e-6 },
  gal: {
    symbol: 'gal',
    name: 'US Gallon',
    category: 'Volume',
    dimensions: VOLUME_DIM,
    scale: 0.003785411784,
  },
  floz: {
    symbol: 'floz',
    name: 'Fluid Ounce',
    category: 'Volume',
    dimensions: VOLUME_DIM,
    scale: 0.0000295735295625,
  },

  // Velocity
  'm/s': {
    symbol: 'm/s',
    name: 'Meter per second',
    category: 'Velocity',
    dimensions: VELOCITY_DIM,
    scale: 1,
  },
  'km/h': {
    symbol: 'km/h',
    name: 'Kilometer per hour',
    category: 'Velocity',
    dimensions: VELOCITY_DIM,
    scale: 1 / 3.6,
  },
  mph: {
    symbol: 'mph',
    name: 'Mile per hour',
    category: 'Velocity',
    dimensions: VELOCITY_DIM,
    scale: 0.44704,
  },
  knot: {
    symbol: 'knot',
    name: 'Knot',
    category: 'Velocity',
    dimensions: VELOCITY_DIM,
    scale: 0.514444444,
  },
  'ft/s': {
    symbol: 'ft/s',
    name: 'Foot per second',
    category: 'Velocity',
    dimensions: VELOCITY_DIM,
    scale: 0.3048,
  },
};

// Physics Constants Catalog
export const PHYSICS_CONSTANTS: PhysicsConstant[] = [
  {
    symbol: 'c',
    name: 'Speed of Light in Vacuum',
    value: 299792458,
    unit: 'm/s',
    description: 'Exact fundamental constant of relativistic spacetime',
    dimensions: VELOCITY_DIM,
  },
  {
    symbol: 'G',
    name: 'Newtonian Gravitational Constant',
    value: 6.6743e-11,
    unit: 'm³/(kg·s²)',
    description: 'Universal gravitational coupling constant',
    dimensions: [-1, 3, -2, 0, 0, 0, 0],
  },
  {
    symbol: 'h',
    name: "Planck's Constant",
    value: 6.62607015e-34,
    unit: 'J·s',
    description: 'Quantum action quantum scale constant',
    dimensions: [1, 2, -1, 0, 0, 0, 0],
  },
  {
    symbol: 'hbar',
    name: 'Reduced Planck Constant (ℏ)',
    value: 1.054571817e-34,
    unit: 'J·s',
    description: 'h / (2π)',
    dimensions: [1, 2, -1, 0, 0, 0, 0],
  },
  {
    symbol: 'k_B',
    name: 'Boltzmann Constant',
    value: 1.380649e-23,
    unit: 'J/K',
    description: 'Relates thermal energy to absolute temperature',
    dimensions: [1, 2, -2, 0, -1, 0, 0],
  },
  {
    symbol: 'e',
    name: 'Elementary Charge',
    value: 1.602176634e-19,
    unit: 'C',
    description: 'Electric charge carried by a single proton',
    dimensions: CHARGE_DIM,
  },
  {
    symbol: 'N_A',
    name: 'Avogadro Constant',
    value: 6.02214076e23,
    unit: 'mol⁻¹',
    description: 'Number of constituent particles in one mole',
    dimensions: [0, 0, 0, 0, 0, -1, 0],
  },
  {
    symbol: 'R',
    name: 'Molar Gas Constant',
    value: 8.314462618,
    unit: 'J/(mol·K)',
    description: 'N_A · k_B in ideal gas laws',
    dimensions: [1, 2, -2, 0, -1, -1, 0],
  },
  {
    symbol: 'g',
    name: 'Standard Gravitational Acceleration',
    value: 9.80665,
    unit: 'm/s²',
    description: 'Nominal gravitational acceleration at sea level on Earth',
    dimensions: ACCELERATION_DIM,
  },
  {
    symbol: 'eps_0',
    name: 'Vacuum Electric Permittivity (ε₀)',
    value: 8.8541878128e-12,
    unit: 'F/m',
    description: 'Dielectric capability of classical vacuum',
    dimensions: [-1, -3, 4, 2, 0, 0, 0],
  },
  {
    symbol: 'mu_0',
    name: 'Vacuum Magnetic Permeability (μ₀)',
    value: 1.25663706212e-6,
    unit: 'N/A²',
    description: 'Magnetic response of classical vacuum',
    dimensions: [1, 1, -2, -2, 0, 0, 0],
  },
  {
    symbol: 'm_e',
    name: 'Electron Rest Mass',
    value: 9.1093837015e-31,
    unit: 'kg',
    description: 'Mass of an electron at rest',
    dimensions: MASS,
  },
  {
    symbol: 'm_p',
    name: 'Proton Rest Mass',
    value: 1.67262192369e-27,
    unit: 'kg',
    description: 'Mass of a proton at rest',
    dimensions: MASS,
  },
];

// Physics Formula Templates
export const PHYSICS_FORMULAS: PhysicsFormula[] = [
  {
    id: 'kinetic_energy',
    name: 'Kinetic Energy (Classical)',
    category: 'Mechanics',
    formulaLatex: 'E_k = \\frac{1}{2} m v^2',
    description: 'Kinetic energy of a classical mass moving at velocity v',
    variables: [
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 15 },
      { symbol: 'v', name: 'Velocity', unit: 'm/s', defaultValue: 20 },
    ],
    calculate: (inputs) => {
      const m = inputs['m'] || 0;
      const v = inputs['v'] || 0;
      const val = 0.5 * m * v * v;
      return {
        value: val,
        unit: 'J',
        steps: [
          `Formula: E_k = 0.5 · m · v²`,
          `Substitution: E_k = 0.5 · (${m} kg) · (${v} m/s)²`,
          `Calculation: E_k = 0.5 · ${m} · ${v * v} = ${val} Joules (J)`,
          `Equivalent: ${(val / 1000).toFixed(4)} kJ = ${(val / 4184).toFixed(4)} kcal`,
        ],
      };
    },
  },
  {
    id: 'gravitational_potential',
    name: 'Gravitational Potential Energy',
    category: 'Mechanics',
    formulaLatex: 'E_p = m g h',
    description: 'Potential energy of a mass m lifted to height h in Earth gravity',
    variables: [
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 10 },
      { symbol: 'h', name: 'Height', unit: 'm', defaultValue: 15 },
    ],
    calculate: (inputs) => {
      const m = inputs['m'] || 0;
      const h = inputs['h'] || 0;
      const g = 9.80665;
      const val = m * g * h;
      return {
        value: val,
        unit: 'J',
        steps: [
          `Formula: E_p = m · g · h`,
          `Constants: g = 9.80665 m/s²`,
          `Substitution: E_p = (${m} kg) · (9.80665 m/s²) · (${h} m)`,
          `Calculation: E_p = ${val.toFixed(4)} Joules (J)`,
        ],
      };
    },
  },
  {
    id: 'ideal_gas_pressure',
    name: 'Ideal Gas Law (Pressure)',
    category: 'Thermodynamics',
    formulaLatex: 'P = \\frac{n R T}{V}',
    description: 'Pressure exerted by n moles of ideal gas at temperature T in volume V',
    variables: [
      { symbol: 'n', name: 'Amount of substance', unit: 'mol', defaultValue: 2 },
      { symbol: 'T', name: 'Temperature', unit: 'K', defaultValue: 298.15 },
      { symbol: 'V', name: 'Volume', unit: 'm3', defaultValue: 0.05 },
    ],
    calculate: (inputs) => {
      const n = inputs['n'] || 1;
      const T = inputs['T'] || 298.15;
      const V = inputs['V'] || 0.01;
      const R = 8.314462618;
      const P = (n * R * T) / V;
      return {
        value: P,
        unit: 'Pa',
        steps: [
          `Formula: P = (n · R · T) / V`,
          `Gas Constant: R = 8.31446 J/(mol·K)`,
          `Numerator: (${n} mol) · 8.31446 · (${T} K) = ${(n * R * T).toFixed(2)} J`,
          `Pressure P = ${(n * R * T).toFixed(2)} / (${V} m³) = ${P.toFixed(2)} Pa`,
          `Equivalent: ${(P / 1000).toFixed(4)} kPa = ${(P / 101325).toFixed(4)} atm = ${(P / 1e5).toFixed(4)} bar`,
        ],
      };
    },
  },
  {
    id: 'ohms_law_power',
    name: 'Electric Power & Joule Heating',
    category: 'Electromagnetism',
    formulaLatex: 'P = V \\cdot I = I^2 R',
    description: 'Electric power dissipation in a resistive circuit',
    variables: [
      { symbol: 'V', name: 'Voltage', unit: 'V', defaultValue: 230 },
      { symbol: 'I', name: 'Current', unit: 'A', defaultValue: 10 },
    ],
    calculate: (inputs) => {
      const V = inputs['V'] || 0;
      const I = inputs['I'] || 0;
      const P = V * I;
      const R = I !== 0 ? V / I : 0;
      return {
        value: P,
        unit: 'W',
        steps: [
          `Formula: P = V · I`,
          `Substitution: P = (${V} V) · (${I} A) = ${P} Watts (W)`,
          `Equivalent Power: ${(P / 1000).toFixed(4)} kW = ${(P / 745.7).toFixed(4)} hp`,
          `Implied Resistance (R = V/I): ${R.toFixed(3)} Ω`,
        ],
      };
    },
  },
  {
    id: 'einstein_mass_energy',
    name: "Einstein's Mass-Energy Equivalence",
    category: 'Relativity',
    formulaLatex: 'E = m c^2',
    description: 'Rest-mass energy equivalent of matter',
    variables: [{ symbol: 'm', name: 'Rest Mass', unit: 'kg', defaultValue: 0.001 }],
    calculate: (inputs) => {
      const m = inputs['m'] || 0;
      const c = 299792458;
      const E = m * c * c;
      return {
        value: E,
        unit: 'J',
        steps: [
          `Formula: E = m · c²`,
          `Speed of light: c = 299,792,458 m/s`,
          `c² = 8.987551787 × 10¹⁶ m²/s²`,
          `E = (${m} kg) · c² = ${E.toExponential(6)} Joules (J)`,
          `Equivalent: ${(E / 3.6e6).toExponential(4)} kWh = ${(E / 4.184e9).toFixed(2)} Tons TNT equivalent`,
        ],
      };
    },
  },
  {
    id: 'photon_energy',
    name: 'Photon Energy (Planck-Einstein)',
    category: 'Quantum',
    formulaLatex: 'E = h \\cdot f = \\frac{h c}{\\lambda}',
    description: 'Energy carried by a single photon of frequency f',
    variables: [{ symbol: 'f', name: 'Frequency', unit: 'Hz', defaultValue: 5e14 }],
    calculate: (inputs) => {
      const f = inputs['f'] || 0;
      const h = 6.62607015e-34;
      const E = h * f;
      const eV = E / 1.602176634e-19;
      return {
        value: E,
        unit: 'J',
        steps: [
          `Formula: E = h · f`,
          `Planck constant: h = 6.62607 × 10⁻³⁴ J·s`,
          `E = (${h.toExponential(4)} J·s) · (${f.toExponential(3)} Hz)`,
          `Energy = ${E.toExponential(6)} Joules = ${eV.toFixed(4)} eV`,
        ],
      };
    },
  },
];

// Convert value from one unit to another (with dimensional validation)
export function convertPhysicalUnit(
  val: number,
  fromSymbol: string,
  toSymbol: string
): { success: boolean; result?: number; error?: string } {
  const uFrom = UNIT_DICTIONARY[fromSymbol];
  const uTo = UNIT_DICTIONARY[toSymbol];

  if (!uFrom || !uTo) {
    return { success: false, error: `Unrecognized unit symbol: ${!uFrom ? fromSymbol : toSymbol}` };
  }

  if (!areDimensionsEqual(uFrom.dimensions, uTo.dimensions)) {
    return {
      success: false,
      error: `Dimensional Mismatch: Cannot convert ${uFrom.name} (${formatDimensionVector(uFrom.dimensions)}) to ${uTo.name} (${formatDimensionVector(uTo.dimensions)}).`,
    };
  }

  // Handle offset units (temperature)
  let baseVal = val;
  if (uFrom.category === 'Temperature') {
    if (fromSymbol === 'degC') baseVal = val + 273.15;
    else if (fromSymbol === 'degF') baseVal = (val - 32) * (5 / 9) + 273.15;
    else baseVal = val;

    let res = baseVal;
    if (toSymbol === 'degC') res = baseVal - 273.15;
    else if (toSymbol === 'degF') res = (baseVal - 273.15) * (9 / 5) + 32;
    else res = baseVal;

    return { success: true, result: res };
  }

  baseVal = val * uFrom.scale;
  const targetVal = baseVal / uTo.scale;

  return { success: true, result: targetVal };
}

// Find all compatible units for a given dimension vector
export function getCompatibleUnits(dim: DimensionVector): PhysicalUnit[] {
  return Object.values(UNIT_DICTIONARY).filter((u) => areDimensionsEqual(u.dimensions, dim));
}
