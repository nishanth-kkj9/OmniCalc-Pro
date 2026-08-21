import { describe, it, expect } from 'vitest';
import { formatNumberWithSettings } from './formatting';

describe('Number Formatting Utility', () => {
  it('formats numbers with standard comma separators', () => {
    expect(
      formatNumberWithSettings(1234567.89, { thousandsSeparator: 'comma', precision: 2 })
    ).toBe('1,234,567.89');
  });

  it('formats numbers with space separators', () => {
    expect(formatNumberWithSettings(1000000, { thousandsSeparator: 'space' })).toBe('1 000 000');
  });

  it('formats numbers with period separators', () => {
    expect(formatNumberWithSettings(1234.56, { thousandsSeparator: 'period', precision: 2 })).toBe(
      '1.234,56'
    );
  });

  it('formats numbers in scientific notation', () => {
    expect(formatNumberWithSettings(12345, { notation: 'scientific', precision: 2 })).toBe(
      '1.23e+4'
    );
  });

  it('formats numbers in engineering notation', () => {
    expect(formatNumberWithSettings(1500000, { notation: 'engineering', precision: 2 })).toBe(
      '1.50e+6'
    );
  });

  it('preserves special edge values like Infinity and NaN', () => {
    expect(formatNumberWithSettings('Infinity')).toBe('Infinity');
    expect(formatNumberWithSettings('-Infinity')).toBe('-Infinity');
    expect(formatNumberWithSettings('NaN')).toBe('NaN');
    expect(formatNumberWithSettings('Error')).toBe('Error');
  });
});
