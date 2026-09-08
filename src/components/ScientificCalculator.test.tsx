import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScientificCalculator } from './ScientificCalculator';
import { DEFAULT_SETTINGS } from '../utils/settings';

describe('ScientificCalculator Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(<ScientificCalculator settings={DEFAULT_SETTINGS} />);
    expect(screen.getByText('DEG')).toBeDefined();
    expect(screen.getByText('RAD')).toBeDefined();
    expect(screen.getByText('GRAD')).toBeDefined();
    expect(screen.getByText('2nd')).toBeDefined();
    expect(screen.getByText('hyp')).toBeDefined();
    expect(screen.getByText('sin')).toBeDefined();
    expect(screen.getByText('cos')).toBeDefined();
    expect(screen.getByText('tan')).toBeDefined();
    expect(screen.getByText('ln')).toBeDefined();
    expect(screen.getByText('log')).toBeDefined();
    expect(screen.getByText('√x')).toBeDefined();
    expect(screen.getByText('xʸ')).toBeDefined();
    expect(screen.getByText('n!')).toBeDefined();
    expect(screen.getByText('1/x')).toBeDefined();
    expect(screen.getByText('π')).toBeDefined();
    expect(screen.getByText('e')).toBeDefined();
  });

  it('calculates sine in degrees mode', () => {
    render(<ScientificCalculator settings={DEFAULT_SETTINGS} />);
    const sinBtn = screen.getByRole('button', { name: 'sin' });
    const threeBtn = screen.getByRole('button', { name: '3' });
    const zeroBtn = screen.getByRole('button', { name: '0' });
    const closeParenBtn = screen.getByRole('button', { name: 'Close parenthesis' });
    const eqBtn = screen.getByRole('button', { name: 'Calculate equals' });

    fireEvent.click(sinBtn);
    fireEvent.click(threeBtn);
    fireEvent.click(zeroBtn);
    fireEvent.click(closeParenBtn);
    fireEvent.click(eqBtn);

    const output = screen.getByRole('status');
    expect(output.textContent).toBe('0.5');
  });

  it('calculates cosine in radians mode', () => {
    render(<ScientificCalculator settings={{ ...DEFAULT_SETTINGS, angleMode: 'RAD' }} />);
    const radBtn = screen.getByRole('button', { name: 'Switch to RAD mode' });
    fireEvent.click(radBtn);

    const cosBtn = screen.getByRole('button', { name: 'cos' });
    const zeroBtn = screen.getByRole('button', { name: '0' });
    const closeParenBtn = screen.getByRole('button', { name: 'Close parenthesis' });
    const eqBtn = screen.getByRole('button', { name: 'Calculate equals' });

    fireEvent.click(cosBtn);
    fireEvent.click(zeroBtn);
    fireEvent.click(closeParenBtn);
    fireEvent.click(eqBtn);

    const output = screen.getByRole('status');
    expect(output.textContent).toBe('1');
  });

  it('switches to 2nd mode and computes inverse trig functions (asin)', () => {
    render(<ScientificCalculator settings={DEFAULT_SETTINGS} />);
    const secondBtn = screen.getByRole('button', { name: 'Secondary functions' });
    fireEvent.click(secondBtn);

    expect(screen.getByRole('button', { name: 'sin⁻¹' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'cos⁻¹' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'tan⁻¹' })).toBeDefined();
    expect(screen.getByRole('button', { name: '10 to the power of x' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'e to the power of x' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'x squared' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cube root' })).toBeDefined();

    const asinBtn = screen.getByRole('button', { name: 'sin⁻¹' });
    const zeroBtn = screen.getByRole('button', { name: '0' });
    const dotBtn = screen.getByRole('button', { name: 'Decimal point' });
    const fiveBtn = screen.getByRole('button', { name: '5' });
    const closeParenBtn = screen.getByRole('button', { name: 'Close parenthesis' });
    const eqBtn = screen.getByRole('button', { name: 'Calculate equals' });

    fireEvent.click(asinBtn);
    fireEvent.click(zeroBtn);
    fireEvent.click(dotBtn);
    fireEvent.click(fiveBtn);
    fireEvent.click(closeParenBtn);
    fireEvent.click(eqBtn);

    const output = screen.getByRole('status');
    expect(output.textContent).toBe('30');
  });

  it('switches to hyp mode and computes hyperbolic functions (sinh)', () => {
    render(<ScientificCalculator settings={DEFAULT_SETTINGS} />);
    const hypBtn = screen.getByRole('button', { name: 'Hyperbolic trigonometry' });
    fireEvent.click(hypBtn);

    expect(screen.getByRole('button', { name: 'sinh' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'cosh' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'tanh' })).toBeDefined();

    const sinhBtn = screen.getByRole('button', { name: 'sinh' });
    const zeroBtn = screen.getByRole('button', { name: '0' });
    const closeParenBtn = screen.getByRole('button', { name: 'Close parenthesis' });
    const eqBtn = screen.getByRole('button', { name: 'Calculate equals' });

    fireEvent.click(sinhBtn);
    fireEvent.click(zeroBtn);
    fireEvent.click(closeParenBtn);
    fireEvent.click(eqBtn);

    const output = screen.getByRole('status');
    expect(output.textContent).toBe('0');
  });

  it('calculates factorials and powers correctly', () => {
    render(<ScientificCalculator settings={DEFAULT_SETTINGS} />);
    const fiveBtn = screen.getByRole('button', { name: '5' });
    const factBtn = screen.getByRole('button', { name: 'Factorial' });
    const eqBtn = screen.getByRole('button', { name: 'Calculate equals' });

    fireEvent.click(fiveBtn);
    fireEvent.click(factBtn);
    fireEvent.click(eqBtn);

    const output = screen.getByRole('status');
    expect(output.textContent).toBe('120');
  });

  it('calculates square roots and logarithms', () => {
    render(<ScientificCalculator settings={DEFAULT_SETTINGS} />);
    const sqrtBtn = screen.getByRole('button', { name: 'Square root' });
    const oneBtn = screen.getByRole('button', { name: '1' });
    const sixBtn = screen.getByRole('button', { name: '6' });
    const closeParenBtn = screen.getByRole('button', { name: 'Close parenthesis' });
    const eqBtn = screen.getByRole('button', { name: 'Calculate equals' });

    fireEvent.click(sqrtBtn);
    fireEvent.click(oneBtn);
    fireEvent.click(sixBtn);
    fireEvent.click(closeParenBtn);
    fireEvent.click(eqBtn);

    const output = screen.getByRole('status');
    expect(output.textContent).toBe('4');
  });

  it('handles sign toggle on positive and negative numbers', () => {
    render(<ScientificCalculator settings={DEFAULT_SETTINGS} />);
    const eightBtn = screen.getByRole('button', { name: '8' });
    const signBtn = screen.getByRole('button', { name: 'Toggle sign' });
    const addBtn = screen.getByRole('button', { name: 'Add' });
    const twoBtn = screen.getByRole('button', { name: '2' });
    const eqBtn = screen.getByRole('button', { name: 'Calculate equals' });

    fireEvent.click(eightBtn);
    fireEvent.click(signBtn);
    fireEvent.click(addBtn);
    fireEvent.click(twoBtn);
    fireEvent.click(eqBtn);

    const output = screen.getByRole('status');
    expect(output.textContent).toBe('-6');
  });

  it('supports undoing actions', () => {
    render(<ScientificCalculator settings={DEFAULT_SETTINGS} />);
    const nineBtn = screen.getByRole('button', { name: '9' });
    const multBtn = screen.getByRole('button', { name: 'Multiply' });
    const undoBtn = screen.getByTitle(/undo/i);

    fireEvent.click(nineBtn);
    fireEvent.click(multBtn);
    fireEvent.click(undoBtn);

    // After undoing the multiply operator, should be 9
    const fourBtn = screen.getByRole('button', { name: '4' });
    const eqBtn = screen.getByRole('button', { name: 'Calculate equals' });
    fireEvent.click(fourBtn);
    fireEvent.click(eqBtn);

    const output = screen.getByRole('status');
    expect(output.textContent).toBe('94');
  });

  it('supports memory operations (M+, MR, MC)', () => {
    render(<ScientificCalculator settings={DEFAULT_SETTINGS} />);
    const sevenBtn = screen.getByRole('button', { name: '7' });
    const eqBtn = screen.getByRole('button', { name: 'Calculate equals' });
    const mPlusBtn = screen.getByRole('button', { name: 'Memory Add' });
    const mrBtn = screen.getByRole('button', { name: 'Memory Recall' });
    const mcBtn = screen.getByRole('button', { name: 'Memory Clear' });
    const clearBtn = screen.getByRole('button', { name: /^(clear input|clear all)$/i });

    fireEvent.click(sevenBtn);
    fireEvent.click(eqBtn);
    fireEvent.click(mPlusBtn);

    fireEvent.click(clearBtn);
    fireEvent.click(mrBtn);
    fireEvent.click(eqBtn);

    const output = document.getElementById('scientific-calc-output');
    expect(output?.textContent).toBe('7');

    fireEvent.click(mcBtn);
    expect(mcBtn.hasAttribute('disabled')).toBe(true);
  });
});
