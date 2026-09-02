import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BasicCalculator } from './BasicCalculator';
import { DEFAULT_SETTINGS } from '../utils/settings';

describe('BasicCalculator Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders correctly with default state', () => {
    render(<BasicCalculator settings={DEFAULT_SETTINGS} />);
    expect(screen.getByText('AC')).toBeDefined();
    expect(screen.getByText('MC')).toBeDefined();
    expect(screen.getByText('MR')).toBeDefined();
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

    expect(screen.getByText('12')).toBeDefined();
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

    expect(screen.getByText('48')).toBeDefined();

    fireEvent.click(clearBtn);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
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
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
  });
});

