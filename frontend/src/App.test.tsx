import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { calculatorApi, CalculatorApiError } from './services/calculatorApi';

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs addition via the keypad and records history', async () => {
    const user = userEvent.setup();
    vi.spyOn(calculatorApi, 'add').mockResolvedValue({
      operation: 'ADDITION',
      inputs: { a: 12, b: 8 },
      result: 20,
      expression: '12 + 8',
      timestamp: '2026-01-01T00:00:00Z',
    });

    render(<App />);

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: '8' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    expect(calculatorApi.add).toHaveBeenCalledWith(12, 8);
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('20');
    expect(screen.getByText('12 + 8')).toBeInTheDocument();
  });

  it('performs square root and contextual percentage on the keypad', async () => {
    const user = userEvent.setup();
    vi.spyOn(calculatorApi, 'sqrt').mockResolvedValue({
      operation: 'SQUARE_ROOT',
      inputs: { value: 9 },
      result: 3,
      expression: 'sqrt(9)',
      timestamp: '2026-01-01T00:00:01Z',
    });
    vi.spyOn(calculatorApi, 'percentage').mockResolvedValue({
      operation: 'PERCENTAGE',
      inputs: { percent: 50 },
      result: 0.5,
      expression: '50%',
      timestamp: '2026-01-01T00:00:02Z',
    });

    render(<App />);

    await user.click(screen.getByRole('button', { name: '9' }));
    await user.click(screen.getByRole('button', { name: 'Square root' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('3');

    await user.click(screen.getByRole('button', { name: 'C' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Percentage' }));
    expect(calculatorApi.percentage).toHaveBeenCalledWith(50, undefined);
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0.5');
  });

  it('displays backend error message when dividing by zero', async () => {
    const user = userEvent.setup();
    vi.spyOn(calculatorApi, 'divide').mockRejectedValue(
      new CalculatorApiError('Division by zero is not allowed.', 400, 'DIVISION_BY_ZERO'),
    );

    render(<App />);

    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: 'Divide' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Division by zero is not allowed.');
  });

  it('validates invalid inputs and computes percentage of a base in Operation Form mode', async () => {
    const user = userEvent.setup();
    vi.spyOn(calculatorApi, 'percentage').mockResolvedValue({
      operation: 'PERCENTAGE',
      inputs: { percent: 15, of: 200 },
      result: 30,
      expression: '15% of 200',
      timestamp: '2026-01-01T00:00:03Z',
    });

    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Operation Form' }));
    await user.selectOptions(screen.getByLabelText('Operation'), 'percentage');

    await user.type(screen.getByLabelText('Percent (%)'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Percent (%) must be a valid finite number.',
    );
    expect(calculatorApi.percentage).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Percent (%)'));
    await user.type(screen.getByLabelText('Percent (%)'), '15');
    await user.type(screen.getByLabelText('Of Value (optional)'), '200');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(calculatorApi.percentage).toHaveBeenCalledWith(15, 200);
    expect(screen.getByTestId('form-result')).toHaveTextContent('30');
  });

  it('reuses a history item result back in the keypad and supports clearing history', async () => {
    const user = userEvent.setup();
    vi.spyOn(calculatorApi, 'power').mockResolvedValue({
      operation: 'EXPONENTIATION',
      inputs: { base: 2, exponent: 5 },
      result: 32,
      expression: '2 ^ 5',
      timestamp: '2026-01-01T00:00:04Z',
    });

    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Operation Form' }));
    await user.selectOptions(screen.getByLabelText('Operation'), 'power');
    await user.type(screen.getByLabelText('Base'), '2');
    await user.type(screen.getByLabelText('Exponent'), '5');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    await user.click(screen.getByRole('button', { name: /2 \^ 5/i }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('32');

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText(/No calculations yet/i)).toBeInTheDocument();
  });

  it('supports keyboard shortcuts, backspace, sign toggle, and operator chaining', async () => {
    const user = userEvent.setup();
    vi.spyOn(calculatorApi, 'add').mockResolvedValue({
      operation: 'ADDITION',
      inputs: { a: -12.5, b: 2.5 },
      result: -10,
      expression: '-12.5 + 2.5',
      timestamp: '2026-01-01T00:00:05Z',
    });
    vi.spyOn(calculatorApi, 'multiply').mockResolvedValue({
      operation: 'MULTIPLICATION',
      inputs: { a: -10, b: 3 },
      result: -30,
      expression: '-10 * 3',
      timestamp: '2026-01-01T00:00:06Z',
    });

    render(<App />);

    await user.keyboard('12.59');
    await user.keyboard('{Backspace}');
    await user.click(screen.getByRole('button', { name: 'Toggle sign' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('-12.5');

    await user.keyboard('+2.5*');
    expect(calculatorApi.add).toHaveBeenCalledWith(-12.5, 2.5);
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('-10');

    await user.keyboard('3{Enter}');
    expect(calculatorApi.multiply).toHaveBeenCalledWith(-10, 3);
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('-30');
  });
});
