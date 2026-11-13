import { useState, type FormEvent } from 'react';
import { calculatorApi, CalculatorApiError } from '../services/calculatorApi';
import type { CalculationResponse, OperationKey } from '../types/calculator';
import {
  formatDisplayNumber,
  parseNumericInput,
  validateBinaryOperands,
  validateOptionalOperand,
} from '../utils/validation';

interface OperationOption {
  key: OperationKey;
  label: string;
  firstLabel: string;
  secondLabel?: string;
  secondOptional?: boolean;
}

const OPERATION_OPTIONS: OperationOption[] = [
  { key: 'add', label: 'Addition (+)', firstLabel: 'First Operand (a)', secondLabel: 'Second Operand (b)' },
  { key: 'subtract', label: 'Subtraction (−)', firstLabel: 'First Operand (a)', secondLabel: 'Second Operand (b)' },
  { key: 'multiply', label: 'Multiplication (×)', firstLabel: 'First Operand (a)', secondLabel: 'Second Operand (b)' },
  { key: 'divide', label: 'Division (÷)', firstLabel: 'Dividend (a)', secondLabel: 'Divisor (b)' },
  { key: 'power', label: 'Exponentiation (xʸ)', firstLabel: 'Base', secondLabel: 'Exponent' },
  { key: 'sqrt', label: 'Square Root (√x)', firstLabel: 'Value' },
  {
    key: 'percentage',
    label: 'Percentage (%)',
    firstLabel: 'Percent (%)',
    secondLabel: 'Of Value (optional)',
    secondOptional: true,
  },
];

interface OperationFormProps {
  onCalculationSuccess: (response: CalculationResponse) => void;
  onError: (message: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function OperationForm({
  onCalculationSuccess,
  onError,
  isLoading,
  setIsLoading,
}: OperationFormProps) {
  const [operation, setOperation] = useState<OperationKey>('add');
  const [firstInput, setFirstInput] = useState('');
  const [secondInput, setSecondInput] = useState('');
  const [lastResult, setLastResult] = useState<CalculationResponse | null>(null);

  const activeConfig =
    OPERATION_OPTIONS.find((item) => item.key === operation) ?? OPERATION_OPTIONS[0];

  const handleOperationChange = (nextOp: OperationKey) => {
    setOperation(nextOp);
    onError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    onError(null);

    let requestPromise: Promise<CalculationResponse>;

    if (operation === 'sqrt') {
      const parsed = parseNumericInput(firstInput, activeConfig.firstLabel);
      if (!parsed.valid || parsed.value === undefined) {
        onError(parsed.error ?? 'Invalid input.');
        return;
      }
      requestPromise = calculatorApi.sqrt(parsed.value);
    } else if (operation === 'percentage') {
      const percentParsed = parseNumericInput(firstInput, activeConfig.firstLabel);
      if (!percentParsed.valid || percentParsed.value === undefined) {
        onError(percentParsed.error ?? 'Invalid percent.');
        return;
      }
      const ofParsed = validateOptionalOperand(secondInput, 'Base value');
      if (!ofParsed.valid) {
        onError(ofParsed.error);
        return;
      }
      requestPromise = calculatorApi.percentage(percentParsed.value, ofParsed.value);
    } else {
      const binary = validateBinaryOperands(
        firstInput,
        secondInput,
        activeConfig.firstLabel,
        activeConfig.secondLabel,
      );
      if (!binary.valid) {
        onError(binary.error);
        return;
      }
      if (operation === 'add') requestPromise = calculatorApi.add(binary.a, binary.b);
      else if (operation === 'subtract') requestPromise = calculatorApi.subtract(binary.a, binary.b);
      else if (operation === 'multiply') requestPromise = calculatorApi.multiply(binary.a, binary.b);
      else if (operation === 'divide') requestPromise = calculatorApi.divide(binary.a, binary.b);
      else requestPromise = calculatorApi.power(binary.a, binary.b);
    }

    setIsLoading(true);
    try {
      const response = await requestPromise;
      setLastResult(response);
      onCalculationSuccess(response);
    } catch (err) {
      if (err instanceof CalculatorApiError) {
        onError(err.message);
      } else {
        onError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="operation-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="operation-select">Operation</label>
        <select
          id="operation-select"
          value={operation}
          onChange={(e) => handleOperationChange(e.target.value as OperationKey)}
          disabled={isLoading}
        >
          {OPERATION_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="first-operand">{activeConfig.firstLabel}</label>
        <input
          id="first-operand"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 25"
          value={firstInput}
          onChange={(e) => setFirstInput(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {activeConfig.secondLabel && (
        <div className="form-group">
          <label htmlFor="second-operand">{activeConfig.secondLabel}</label>
          <input
            id="second-operand"
            type="text"
            inputMode="decimal"
            placeholder={activeConfig.secondOptional ? 'Leave blank for decimal ratio' : 'e.g. 4'}
            value={secondInput}
            onChange={(e) => setSecondInput(e.target.value)}
            disabled={isLoading}
          />
        </div>
      )}

      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? 'Calculating...' : 'Calculate'}
      </button>

      {lastResult && (
        <div className="form-result" data-testid="form-result" aria-live="polite">
          <span className="form-result-expr">{lastResult.expression} =</span>
          <strong className="form-result-value">{formatDisplayNumber(lastResult.result)}</strong>
        </div>
      )}
    </form>
  );
}
