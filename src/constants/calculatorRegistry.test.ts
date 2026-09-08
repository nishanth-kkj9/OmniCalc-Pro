import { describe, it, expect } from 'vitest';
import { CALCULATOR_REGISTRY, getCalculatorEntry, isValidCalcMode } from './calculatorRegistry';
import { ALL_CALCULATOR_MODES } from '../types';

describe('Calculator Registry Source of Truth (Phase 2)', () => {
  it('contains exactly 22 registered calculator entries', () => {
    expect(CALCULATOR_REGISTRY.length).toBe(22);
    expect(ALL_CALCULATOR_MODES.length).toBe(22);
    expect(CALCULATOR_REGISTRY.length).toBe(ALL_CALCULATOR_MODES.length);
  });

  it('ensures every CalculatorMode in CalcMode has exactly one registry entry', () => {
    ALL_CALCULATOR_MODES.forEach((mode) => {
      const entry = getCalculatorEntry(mode);
      expect(entry).toBeDefined();
      expect(entry?.id).toBe(mode);
    });
  });

  it('contains no duplicate IDs in CALCULATOR_REGISTRY', () => {
    const ids = CALCULATOR_REGISTRY.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('validates that every registry entry corresponds to a valid CalculatorMode', () => {
    CALCULATOR_REGISTRY.forEach((entry) => {
      expect(ALL_CALCULATOR_MODES.includes(entry.id as any)).toBe(true);
      expect(isValidCalcMode(entry.id)).toBe(true);
    });
  });

  it('accurately reports web and desktop support parity status', () => {
    const webCount = CALCULATOR_REGISTRY.filter((entry) => entry.webSupported).length;
    const desktopCount = CALCULATOR_REGISTRY.filter((entry) => entry.desktopSupported).length;

    expect(webCount).toBe(22);
    expect(desktopCount).toBe(21);

    const unsupportedDesktop = CALCULATOR_REGISTRY.filter((entry) => !entry.desktopSupported).map(
      (entry) => entry.id
    );
    expect(unsupportedDesktop).toEqual(['formulas']);
  });
});
