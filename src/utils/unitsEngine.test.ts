import { describe, it, expect } from 'vitest';
import {
  areDimensionsEqual,
  formatDimensionVector,
  identifyDimensionName,
  convertPhysicalUnit,
  getCompatibleUnits,
  PHYSICS_CONSTANTS,
  PHYSICS_FORMULAS,
  DIMENSIONLESS,
  LENGTH,
  MASS,
  TIME,
  ENERGY_DIM,
  FORCE_DIM,
  VELOCITY_DIM,
} from './unitsEngine';

describe('Units Engine - Dimensional Vector Math', () => {
  it('correctly compares equal and unequal dimension vectors', () => {
    expect(areDimensionsEqual(LENGTH, [0, 1, 0, 0, 0, 0, 0])).toBe(true);
    expect(areDimensionsEqual(MASS, LENGTH)).toBe(false);
    expect(areDimensionsEqual(DIMENSIONLESS, [0, 0, 0, 0, 0, 0, 0])).toBe(true);
  });

  it('formats dimension vectors into readable string notation', () => {
    expect(formatDimensionVector(DIMENSIONLESS)).toBe('Dimensionless [1]');
    expect(formatDimensionVector(LENGTH)).toBe('[L]');
    expect(formatDimensionVector(FORCE_DIM)).toBe('[M]·[L]·[T]^-2');
    expect(formatDimensionVector(ENERGY_DIM)).toBe('[M]·[L]^2·[T]^-2');
  });

  it('identifies physical dimension names accurately', () => {
    expect(identifyDimensionName(DIMENSIONLESS)).toBe('Dimensionless (Ratio / Number)');
    expect(identifyDimensionName(LENGTH)).toBe('Length / Distance');
    expect(identifyDimensionName(MASS)).toBe('Mass');
    expect(identifyDimensionName(TIME)).toBe('Time / Duration');
    expect(identifyDimensionName(FORCE_DIM)).toBe('Force / Weight');
    expect(identifyDimensionName(ENERGY_DIM)).toBe('Energy / Work / Heat / Torque');
    expect(identifyDimensionName(VELOCITY_DIM)).toBe('Velocity / Speed');
  });
});

describe('Units Engine - Unit Conversions', () => {
  it('converts basic length units correctly', () => {
    const kmToM = convertPhysicalUnit(5, 'km', 'm');
    expect(kmToM.success).toBe(true);
    expect(kmToM.result).toBeCloseTo(5000, 6);

    const mToCm = convertPhysicalUnit(2.5, 'm', 'cm');
    expect(mToCm.success).toBe(true);
    expect(mToCm.result).toBeCloseTo(250, 6);

    const inchToCm = convertPhysicalUnit(1, 'in', 'cm');
    expect(inchToCm.success).toBe(true);
    expect(inchToCm.result).toBeCloseTo(2.54, 6);
  });

  it('converts mass units correctly', () => {
    const kgToG = convertPhysicalUnit(3, 'kg', 'g');
    expect(kgToG.success).toBe(true);
    expect(kgToG.result).toBeCloseTo(3000, 6);

    const lbToKg = convertPhysicalUnit(10, 'lb', 'kg');
    expect(lbToKg.success).toBe(true);
    expect(lbToKg.result).toBeCloseTo(4.5359237, 4);
  });

  it('converts temperature units with offsets (Celsius, Fahrenheit, Kelvin)', () => {
    const cToK = convertPhysicalUnit(100, 'degC', 'K');
    expect(cToK.success).toBe(true);
    expect(cToK.result).toBeCloseTo(373.15, 4);

    const cToF = convertPhysicalUnit(0, 'degC', 'degF');
    expect(cToF.success).toBe(true);
    expect(cToF.result).toBeCloseTo(32, 4);

    const fToC = convertPhysicalUnit(212, 'degF', 'degC');
    expect(fToC.success).toBe(true);
    expect(fToC.result).toBeCloseTo(100, 4);

    const kToC = convertPhysicalUnit(273.15, 'K', 'degC');
    expect(kToC.success).toBe(true);
    expect(kToC.result).toBeCloseTo(0, 4);
  });

  it('rejects conversions between dimensionally incompatible units', () => {
    const mToS = convertPhysicalUnit(10, 'm', 's');
    expect(mToS.success).toBe(false);
    expect(mToS.error).toContain('Dimensional Mismatch');

    const kgToJ = convertPhysicalUnit(5, 'kg', 'J');
    expect(kgToJ.success).toBe(false);
    expect(kgToJ.error).toContain('Dimensional Mismatch');
  });

  it('handles unrecognized unit symbols gracefully', () => {
    const invalidFrom = convertPhysicalUnit(10, 'unknown_unit', 'm');
    expect(invalidFrom.success).toBe(false);
    expect(invalidFrom.error).toContain('Unrecognized unit symbol');

    const invalidTo = convertPhysicalUnit(10, 'm', 'unknown_unit');
    expect(invalidTo.success).toBe(false);
    expect(invalidTo.error).toContain('Unrecognized unit symbol');
  });

  it('retrieves compatible units for a given dimension vector', () => {
    const lengthUnits = getCompatibleUnits(LENGTH);
    const symbols = lengthUnits.map((u) => u.symbol);
    expect(symbols).toContain('m');
    expect(symbols).toContain('km');
    expect(symbols).toContain('cm');
    expect(symbols).toContain('ft');
    expect(symbols).toContain('in');
  });
});

describe('Units Engine - Physics Constants & Formulas', () => {
  it('provides well-defined physics constants with units and dimensions', () => {
    expect(PHYSICS_CONSTANTS.length).toBeGreaterThan(5);
    const speedOfLight = PHYSICS_CONSTANTS.find((c) => c.symbol === 'c');
    expect(speedOfLight).toBeDefined();
    expect(speedOfLight?.value).toBe(299792458);

    const planck = PHYSICS_CONSTANTS.find((c) => c.symbol === 'h');
    expect(planck).toBeDefined();
    expect(planck?.value).toBeCloseTo(6.62607015e-34, 10);
  });

  it('executes physics formulas and yields calculation steps', () => {
    expect(PHYSICS_FORMULAS.length).toBeGreaterThan(0);

    // Test Kinetic Energy formula: KE = 0.5 * m * v^2
    const keFormula = PHYSICS_FORMULAS.find((f) => f.id === 'kinetic_energy');
    expect(keFormula).toBeDefined();
    if (keFormula) {
      const res = keFormula.calculate({ m: 2, v: 3 });
      expect(res.value).toBe(9);
      expect(res.unit).toBe('J');
      expect(res.steps.length).toBeGreaterThan(0);
    }

    // Test Gravitational Potential formula: PE = m * g * h
    const peFormula = PHYSICS_FORMULAS.find((f) => f.id === 'gravitational_potential');
    expect(peFormula).toBeDefined();
    if (peFormula) {
      const res = peFormula.calculate({ m: 10, h: 5 });
      expect(res.value).toBeCloseTo(490.3325, 3);
      expect(res.unit).toBe('J');
    }

    // Test Ohm's Law Power: P = V * I
    const powerFormula = PHYSICS_FORMULAS.find((f) => f.id === 'ohms_law_power');
    expect(powerFormula).toBeDefined();
    if (powerFormula) {
      const res = powerFormula.calculate({ V: 120, I: 2 });
      expect(res.value).toBe(240);
      expect(res.unit).toBe('W');
    }
  });
});
