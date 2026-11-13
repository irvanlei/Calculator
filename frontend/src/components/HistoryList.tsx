import type { HistoryEntry } from '../types/calculator';
import { formatDisplayNumber } from '../utils/validation';

interface HistoryListProps {
  entries: HistoryEntry[];
  onSelectResult: (value: string) => void;
  onClearHistory: () => void;
}

export function HistoryList({ entries, onSelectResult, onClearHistory }: HistoryListProps) {
  return (
    <aside className="history-panel" aria-label="Calculation history">
      <div className="history-header">
        <h2>History</h2>
        {entries.length > 0 && (
          <button type="button" className="history-clear-btn" onClick={onClearHistory}>
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="history-empty">No calculations yet.</p>
      ) : (
        <ul className="history-list">
          {entries.map((entry) => {
            const formatted = formatDisplayNumber(entry.result);
            return (
              <li key={entry.id} className="history-item">
                <button
                  type="button"
                  className="history-item-btn"
                  onClick={() => onSelectResult(formatted)}
                  title="Use this result in keypad"
                >
                  <span className="history-expression">{entry.expression}</span>
                  <span className="history-result">= {formatted}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
