import { useCallback, useEffect, useState } from 'react';
import { calculatorApi, CalculatorApiError } from '../services/calculatorApi';
import type { CalculationResponse } from '../types/calculator';
import { formatDisplayNumber, parseNumericInput } from '../utils/validation';

type BinaryOperator = 'add' | 'subtract' | 'multiply' | 'divide' | 'power';

const OPERATOR_SYMBOLS: Record<BinaryOperator, string> = {
  add: '+',
  subtract: '-',
  multiply: '*',
  divide: '/',
  power: '^',
};

interface CalculatorKeypadProps {
  injectedValue: string | null;
  onInjectedConsumed: () => void;
  onCalculationSuccess: (response: CalculationResponse) => void;
  onError: (message: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CalculatorKeypad({
  injectedValue,
  onInjectedConsumed,
  onCalculationSuccess,
  onError,
  isLoading,
  setIsLoading,
}: CalculatorKeypadProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const [storedOperand, setStoredOperand] = useState<number | null>(null);
  const [pendingOperator, setPendingOperator] = useState<BinaryOperator | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [expressionPreview, setExpressionPreview] = useState('');

  useEffect(() => {
    if (injectedValue !== null) {
      setDisplayValue(injectedValue);
      setWaitingForNext(false);
      onError(null);
      onInjectedConsumed();
    }
  }, [injectedValue, onInjectedConsumed, onError]);

  const executeBinary = useCallback(
    (operator: BinaryOperator, left: number, right: number): Promise<CalculationResponse> =>
      calculatorApi[operator](left, right),
    [],
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (isLoading) return;
      onError(null);
      if (waitingForNext) {
        setDisplayValue(digit);
        setWaitingForNext(false);
        return;
      }
      setDisplayValue((prev) => (prev === '0' ? digit : prev + digit));
    },
    [isLoading, onError, waitingForNext],
  );

  const handleDecimal = useCallback(() => {
    if (isLoading) return;
    onError(null);
    if (waitingForNext) {
      setDisplayValue('0.');
      setWaitingForNext(false);
      return;
    }
    setDisplayValue((prev) => (prev.includes('.') ? prev : `${prev}.`));
  }, [isLoading, onError, waitingForNext]);

  const handleToggleSign = useCallback(() => {
    if (isLoading) return;
    onError(null);
    setDisplayValue((prev) => {
      if (prev === '0' || prev === '0.') return prev;
      return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
    });
  }, [isLoading, onError]);

  const handleBackspace = useCallback(() => {
    if (isLoading) return;
    onError(null);
    if (waitingForNext) {
      setDisplayValue('0');
      setWaitingForNext(false);
      return;
    }
    setDisplayValue((prev) => {
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  }, [isLoading, onError, waitingForNext]);

  const handleClear = useCallback(() => {
    if (isLoading) return;
    setDisplayValue('0');
    setStoredOperand(null);
    setPendingOperator(null);
    setWaitingForNext(false);
    setExpressionPreview('');
    onError(null);
  }, [isLoading, onError]);

  const handleErrorResponse = useCallback(
    (err: unknown) => {
      if (err instanceof CalculatorApiError) {
        onError(err.message);
      } else {
        onError('An unexpected error occurred.');
      }
    },
    [onError],
  );

  const handleOperator = useCallback(
    async (nextOperator: BinaryOperator) => {
      if (isLoading) return;
      const parsed = parseNumericInput(displayValue, 'Current value');
      if (!parsed.valid || parsed.value === undefined) {
        onError(parsed.error ?? 'Invalid number.');
        return;
      }

      onError(null);

      if (storedOperand !== null && pendingOperator !== null && !waitingForNext) {
        setIsLoading(true);
        try {
          const response = await executeBinary(pendingOperator, storedOperand, parsed.value);
          const formatted = formatDisplayNumber(response.result);
          setDisplayValue(formatted);
          setStoredOperand(response.result);
          setPendingOperator(nextOperator);
          setWaitingForNext(true);
          setExpressionPreview(`${formatted} ${OPERATOR_SYMBOLS[nextOperator]}`);
          onCalculationSuccess(response);
        } catch (err) {
          handleErrorResponse(err);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setStoredOperand(parsed.value);
      setPendingOperator(nextOperator);
      setWaitingForNext(true);
      setExpressionPreview(`${formatDisplayNumber(parsed.value)} ${OPERATOR_SYMBOLS[nextOperator]}`);
    },
    [
      displayValue,
      executeBinary,
      handleErrorResponse,
      isLoading,
      onCalculationSuccess,
      onError,
      pendingOperator,
      setIsLoading,
      storedOperand,
      waitingForNext,
    ],
  );

  const handleEquals = useCallback(async () => {
    if (isLoading || storedOperand === null || pendingOperator === null) {
      return;
    }

    const parsed = parseNumericInput(displayValue, 'Second operand');
    if (!parsed.valid || parsed.value === undefined) {
      onError(parsed.error ?? 'Invalid number.');
      return;
    }

    onError(null);
    setIsLoading(true);
    try {
      const response = await executeBinary(pendingOperator, storedOperand, parsed.value);
      setDisplayValue(formatDisplayNumber(response.result));
      setExpressionPreview(`${response.expression} =`);
      setStoredOperand(null);
      setPendingOperator(null);
      setWaitingForNext(true);
      onCalculationSuccess(response);
    } catch (err) {
      handleErrorResponse(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    displayValue,
    executeBinary,
    handleErrorResponse,
    isLoading,
    onCalculationSuccess,
    onError,
    pendingOperator,
    setIsLoading,
    storedOperand,
  ]);

  const handleSqrt = useCallback(async () => {
    if (isLoading) return;
    const parsed = parseNumericInput(displayValue, 'Value');
    if (!parsed.valid || parsed.value === undefined) {
      onError(parsed.error ?? 'Invalid number.');
      return;
    }

    onError(null);
    setIsLoading(true);
    try {
      const response = await calculatorApi.sqrt(parsed.value);
      setDisplayValue(formatDisplayNumber(response.result));
      setExpressionPreview(`${response.expression} =`);
      setWaitingForNext(true);
      onCalculationSuccess(response);
    } catch (err) {
      handleErrorResponse(err);
    } finally {
      setIsLoading(false);
    }
  }, [displayValue, handleErrorResponse, isLoading, onCalculationSuccess, onError, setIsLoading]);

  const handlePercentage = useCallback(async () => {
    if (isLoading) return;
    const parsed = parseNumericInput(displayValue, 'Percent');
    if (!parsed.valid || parsed.value === undefined) {
      onError(parsed.error ?? 'Invalid number.');
      return;
    }

    onError(null);
    setIsLoading(true);
    try {
      const baseValue =
        storedOperand !== null && pendingOperator !== null && !waitingForNext
          ? storedOperand
          : undefined;
      const response = await calculatorApi.percentage(parsed.value, baseValue);
      setDisplayValue(formatDisplayNumber(response.result));
      if (baseValue === undefined) {
        setExpressionPreview(`${response.expression} =`);
        setWaitingForNext(true);
      } else {
        setExpressionPreview(
          `${formatDisplayNumber(baseValue)} ${OPERATOR_SYMBOLS[pendingOperator!]} ${formatDisplayNumber(response.result)}`,
        );
      }
      onCalculationSuccess(response);
    } catch (err) {
      handleErrorResponse(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    displayValue,
    handleErrorResponse,
    isLoading,
    onCalculationSuccess,
    onError,
    pendingOperator,
    setIsLoading,
    storedOperand,
    waitingForNext,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        handleDigit(event.key);
      } else if (event.key === '.') {
        event.preventDefault();
        handleDecimal();
      } else if (event.key === '+') {
        event.preventDefault();
        void handleOperator('add');
      } else if (event.key === '-') {
        event.preventDefault();
        void handleOperator('subtract');
      } else if (event.key === '*') {
        event.preventDefault();
        void handleOperator('multiply');
      } else if (event.key === '/') {
        event.preventDefault();
        void handleOperator('divide');
      } else if (event.key === '^') {
        event.preventDefault();
        void handleOperator('power');
      } else if (event.key === '%') {
        event.preventDefault();
        void handlePercentage();
      } else if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault();
        void handleEquals();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleBackspace,
    handleClear,
    handleDecimal,
    handleDigit,
    handleEquals,
    handleOperator,
    handlePercentage,
  ]);

  return (
    <div className="keypad-container">
      <div className="display-panel" aria-live="polite">
        <div className="display-expression" data-testid="expression-preview">
          {expressionPreview || '\u00A0'}
        </div>
        <output className="display-value" data-testid="calculator-display">
          {displayValue}
        </output>
      </div>

      <div className="keypad-grid" role="group" aria-label="Calculator keypad">
        <button type="button" className="key key-utility" onClick={handleClear} disabled={isLoading}>
          C
        </button>
        <button
          type="button"
          className="key key-utility"
          onClick={handleBackspace}
          disabled={isLoading}
          aria-label="Backspace"
        >
          ⌫
        </button>
        <button
          type="button"
          className="key key-utility"
          onClick={handlePercentage}
          disabled={isLoading}
          aria-label="Percentage"
        >
          %
        </button>
        <button
          type="button"
          className="key key-operator"
          onClick={() => void handleOperator('divide')}
          disabled={isLoading}
          aria-label="Divide"
        >
          ÷
        </button>

        <button
          type="button"
          className="key key-advanced"
          onClick={handleSqrt}
          disabled={isLoading}
          aria-label="Square root"
        >
          √x
        </button>
        <button
          type="button"
          className="key key-advanced"
          onClick={() => void handleOperator('power')}
          disabled={isLoading}
          aria-label="Exponent"
        >
          xʸ
        </button>
        <button
          type="button"
          className="key key-utility"
          onClick={handleToggleSign}
          disabled={isLoading}
          aria-label="Toggle sign"
        >
          ±
        </button>
        <button
          type="button"
          className="key key-operator"
          onClick={() => void handleOperator('multiply')}
          disabled={isLoading}
          aria-label="Multiply"
        >
          ×
        </button>

        {['7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            className="key"
            onClick={() => handleDigit(digit)}
            disabled={isLoading}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="key key-operator"
          onClick={() => void handleOperator('subtract')}
          disabled={isLoading}
          aria-label="Subtract"
        >
          −
        </button>

        {['4', '5', '6'].map((digit) => (
          <button
            key={digit}
            type="button"
            className="key"
            onClick={() => handleDigit(digit)}
            disabled={isLoading}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="key key-operator"
          onClick={() => void handleOperator('add')}
          disabled={isLoading}
          aria-label="Add"
        >
          +
        </button>

        {['1', '2', '3'].map((digit) => (
          <button
            key={digit}
            type="button"
            className="key"
            onClick={() => handleDigit(digit)}
            disabled={isLoading}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="key key-equals"
          onClick={() => void handleEquals()}
          disabled={isLoading}
          aria-label="Equals"
        >
          =
        </button>

        <button
          type="button"
          className="key key-zero"
          onClick={() => handleDigit('0')}
          disabled={isLoading}
        >
          0
        </button>
        <button type="button" className="key" onClick={handleDecimal} disabled={isLoading}>
          .
        </button>
      </div>
    </div>
  );
}
