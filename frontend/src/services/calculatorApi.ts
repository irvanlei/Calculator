import type { ApiErrorBody, CalculationResponse } from '../types/calculator';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
const CALCULATOR_PREFIX = `${API_BASE_URL}/api/v1/calculator`;

export class CalculatorApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, code?: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'CalculatorApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function postOperation<TPayload extends object>(
  endpoint: string,
  payload: TPayload,
): Promise<CalculationResponse> {
  let response: Response;
  try {
    response = await fetch(`${CALCULATOR_PREFIX}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new CalculatorApiError(
      'Could not reach the server. Please make sure the backend is running.',
      0,
      'NETWORK_ERROR',
    );
  }

  const body = (await response.json().catch(() => null)) as CalculationResponse | ApiErrorBody | null;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    const fieldDetail = errorBody?.fieldErrors
      ? Object.values(errorBody.fieldErrors).join(' ')
      : '';
    const message =
      fieldDetail ||
      errorBody?.message ||
      `Calculation request failed with status ${response.status}.`;
    throw new CalculatorApiError(message, response.status, errorBody?.code, errorBody?.fieldErrors);
  }

  if (!body || typeof (body as CalculationResponse).result !== 'number') {
    throw new CalculatorApiError('Received an unexpected response from the calculator service.', 502);
  }

  return body as CalculationResponse;
}

export const calculatorApi = {
  add: (a: number, b: number) => postOperation('add', { a, b }),
  subtract: (a: number, b: number) => postOperation('subtract', { a, b }),
  multiply: (a: number, b: number) => postOperation('multiply', { a, b }),
  divide: (a: number, b: number) => postOperation('divide', { a, b }),
  power: (base: number, exponent: number) => postOperation('power', { base, exponent }),
  sqrt: (value: number) => postOperation('sqrt', { value }),
  percentage: (percent: number, of?: number) =>
    postOperation('percentage', of === undefined ? { percent } : { percent, of }),
};
