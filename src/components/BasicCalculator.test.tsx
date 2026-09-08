import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BasicCalculator } from './BasicCalculator';
import { DEFAULT_SETTINGS } from '../utils/settings';

describe('BasicCalculator Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    expect(screen.getByText('AC')).toBeDefined();
    expect(screen.getByText('MC')).toBeDefined();
    expect(screen.getByText('MR')).toBeDefined();
    expect(screen.getByText('M+')).toBeDefined();
    expect(screen.getByText('M-')).toBeDefined();
    expect(screen.getByText('Tape')).toBeDefined();
  });

  it('enters digits and calculates basic addition', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const sevenBtn = screen.getByRole('button', { name: '7' });
    const addBtn = screen.getByRole('button', { name: /^add$/i });
    const fiveBtn = screen.getByRole('button', { name: '5' });
    const eqBtn = screen.getByRole('button', { name: /equals/i });

    fireEvent.click(sevenBtn);
    fireEvent.click(addBtn);
    fireEvent.click(fiveBtn);
    fireEvent.click(eqBtn);

    const output = document.getElementById('basic-calc-output');
    expect(output?.textContent).toBe('12');
  });

  it('handles multiplication and clearing', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const eightBtn = screen.getByRole('button', { name: '8' });
    const multBtn = screen.getByRole('button', { name: /^multiply$/i });
    const sixBtn = screen.getByRole('button', { name: '6' });
    const eqBtn = screen.getByRole('button', { name: /equals/i });
    const clearBtn = screen.getByRole('button', { name: /clear all|clear current input/i });

    fireEvent.click(eightBtn);
    fireEvent.click(multBtn);
    fireEvent.click(sixBtn);
    fireEvent.click(eqBtn);

    const output = document.getElementById('basic-calc-output');
    expect(output?.textContent).toBe('48');

    fireEvent.click(clearBtn);
    expect(output?.textContent).toBe('0');
  });

  it('supports undoing input operations', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const nineBtn = screen.getByRole('button', { name: '9' });
    const addBtn = screen.getByRole('button', { name: /^add$/i });
    const undoBtn = screen.getByRole('button', { name: /undo/i });

    fireEvent.click(nineBtn);
    fireEvent.click(addBtn);
    expect(screen.getByText('9+')).toBeDefined();

    fireEvent.click(undoBtn);
    expect(screen.queryByText('9+')).toBeNull();
  });

  it('handles memory add and recall operations', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const fiveBtn = screen.getByRole('button', { name: '5' });
    const mPlusBtn = screen.getByRole('button', { name: /memory add/i });
    const mrBtn = screen.getByRole('button', { name: /memory recall/i });
    const clearBtn = screen.getByRole('button', { name: /clear all|clear current input/i });

    fireEvent.click(fiveBtn);
    fireEvent.click(mPlusBtn);
    fireEvent.click(clearBtn);

    fireEvent.click(mrBtn);
    const output = document.getElementById('basic-calc-output');
    expect(output?.textContent).toBe('5');
  });

  it('starts fresh when entering digit after evaluation', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const fourBtn = screen.getByRole('button', { name: '4' });
    const addBtn = screen.getByRole('button', { name: /^add$/i });
    const sixBtn = screen.getByRole('button', { name: '6' });
    const eqBtn = screen.getByRole('button', { name: /equals/i });

    fireEvent.click(fourBtn);
    fireEvent.click(addBtn);
    fireEvent.click(sixBtn);
    fireEvent.click(eqBtn);

    const output = document.getElementById('basic-calc-output');
    expect(output?.textContent).toBe('10');

    // Entering a new digit starts fresh
    const threeBtn = screen.getByRole('button', { name: '3' });
    fireEvent.click(threeBtn);
    expect(output?.textContent).toBe('3');
  });

  it('chains calculation when entering operator after evaluation', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const fourBtn = screen.getByRole('button', { name: '4' });
    const addBtn = screen.getByRole('button', { name: /^add$/i });
    const sixBtn = screen.getByRole('button', { name: '6' });
    const eqBtn = screen.getByRole('button', { name: /equals/i });

    fireEvent.click(fourBtn);
    fireEvent.click(addBtn);
    fireEvent.click(sixBtn);
    fireEvent.click(eqBtn);

    const output = document.getElementById('basic-calc-output');
    expect(output?.textContent).toBe('10');

    // Entering operator continues from result
    const multBtn = screen.getByRole('button', { name: /^multiply$/i });
    fireEvent.click(multBtn);
    expect(screen.getByText('10×')).toBeDefined();
  });

  it('replaces consecutive operators without syntax crash', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const fiveBtn = screen.getByRole('button', { name: '5' });
    const addBtn = screen.getByRole('button', { name: /^add$/i });
    const multBtn = screen.getByRole('button', { name: /^multiply$/i });

    fireEvent.click(fiveBtn);
    fireEvent.click(addBtn);
    expect(screen.getByText('5+')).toBeDefined();

    fireEvent.click(multBtn);
    expect(screen.getByText('5×')).toBeDefined();
  });

  it('prevents multiple decimals in a single number token', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const fiveBtn = screen.getByRole('button', { name: '5' });
    const dotBtn = screen.getByRole('button', { name: /decimal point/i });
    const twoBtn = screen.getByRole('button', { name: '2' });

    fireEvent.click(fiveBtn);
    fireEvent.click(dotBtn);
    fireEvent.click(twoBtn);
    fireEvent.click(dotBtn); // Should be ignored

    expect(screen.queryByText('5.2.')).toBeNull();
    expect(screen.getByText('5.2')).toBeDefined();
  });

  it('toggles sign smartly on active operand and evaluated result', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const sevenBtn = screen.getByRole('button', { name: '7' });
    const pmBtn = screen.getByRole('button', { name: /plus or minus/i });

    fireEvent.click(sevenBtn);
    const output = document.getElementById('basic-calc-output');
    expect(output?.textContent).toBe('7');

    fireEvent.click(pmBtn);
    expect(output?.textContent).toBe('-7');

    fireEvent.click(pmBtn);
    expect(output?.textContent).toBe('7');

    // In an expression: 7 + 5 -> 7 + (-5)
    const addBtn = screen.getByRole('button', { name: /^add$/i });
    const fiveBtn = screen.getByRole('button', { name: '5' });
    fireEvent.click(addBtn);
    fireEvent.click(fiveBtn);
    expect(screen.getByText('7+5')).toBeDefined();

    fireEvent.click(pmBtn);
    expect(screen.getByText('7+(-5)')).toBeDefined();

    fireEvent.click(pmBtn);
    expect(screen.getByText('7+5')).toBeDefined();
  });

  it('supports keyboard inputs', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);

    fireEvent.keyDown(window, { key: '8' });
    fireEvent.keyDown(window, { key: '+' });
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: 'Enter' });

    const output = document.getElementById('basic-calc-output');
    expect(output?.textContent).toBe('10');
  });

  it('supports copy to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    const nineBtn = screen.getByRole('button', { name: '9' });
    fireEvent.click(nineBtn);

    const copyBtn = screen.getByRole('button', { name: /copy result/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
  });
});
