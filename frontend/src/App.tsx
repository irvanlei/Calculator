import { useCallback, useState } from 'react';
import { CalculatorKeypad } from './components/CalculatorKeypad';
import { HistoryList } from './components/HistoryList';
import { OperationForm } from './components/OperationForm';
import type { CalculationResponse, HistoryEntry } from './types/calculator';
import './App.css';

type Mode = 'keypad' | 'form';

export function App() {
  const [mode, setMode] = useState<Mode>('keypad');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [injectedValue, setInjectedValue] = useState<string | null>(null);

  const handleCalculationSuccess = useCallback((response: CalculationResponse) => {
    const entry: HistoryEntry = {
      id: `${response.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      expression: response.expression,
      result: response.result,
      operation: response.operation,
      timestamp: response.timestamp,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 10));
  }, []);

  const handleModeSwitch = (nextMode: Mode) => {
    setMode(nextMode);
    setErrorMessage(null);
  };

  const handleSelectHistoryResult = (value: string) => {
    setMode('keypad');
    setInjectedValue(value);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Calculator</h1>
      </header>

      <main className="app-layout">
        <section className="calculator-card" aria-label="Calculator">
          <div className="mode-tabs" role="tablist" aria-label="Input mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'keypad'}
              className={`mode-tab ${mode === 'keypad' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('keypad')}
            >
              Keypad
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'form'}
              className={`mode-tab ${mode === 'form' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('form')}
            >
              Manual Input
            </button>
          </div>

          {errorMessage && (
            <div className="error-banner" role="alert">
              <span>{errorMessage}</span>
              <button
                type="button"
                className="error-dismiss"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {mode === 'keypad' ? (
            <CalculatorKeypad
              injectedValue={injectedValue}
              onInjectedConsumed={() => setInjectedValue(null)}
              onCalculationSuccess={handleCalculationSuccess}
              onError={setErrorMessage}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ) : (
            <OperationForm
              onCalculationSuccess={handleCalculationSuccess}
              onError={setErrorMessage}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
        </section>

        <HistoryList
          entries={history}
          onSelectResult={handleSelectHistoryResult}
          onClearHistory={() => setHistory([])}
        />
      </main>
    </div>
  );
}

export default App;
