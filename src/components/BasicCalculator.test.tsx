import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BasicCalculator } from './BasicCalculator';
import { DEFAULT_SETTINGS } from '../utils/settings';

describe('BasicCalculator Component', () => {
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
});
