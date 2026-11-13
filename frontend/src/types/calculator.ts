export type OperationKey =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'sqrt'
  | 'percentage';

export type BackendOperationType =
  | 'ADDITION'
  | 'SUBTRACTION'
  | 'MULTIPLICATION'
  | 'DIVISION'
  | 'EXPONENTIATION'
  | 'SQUARE_ROOT'
  | 'PERCENTAGE';

export interface CalculationResponse {
  operation: BackendOperationType;
  inputs: Record<string, number>;
  result: number;
  expression: string;
  timestamp: string;
}

export interface ApiErrorBody {
  timestamp?: string;
  status: number;
  error?: string;
  code?: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

export interface HistoryEntry {
  id: string;
  expression: string;
  result: number;
  operation: BackendOperationType;
  timestamp: string;
}
