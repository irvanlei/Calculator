import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculatorApi, CalculatorApiError } from './calculatorApi';

describe('calculatorApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST requests for all operations and returns parsed JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        operation: 'ADDITION',
        inputs: { a: 4, b: 6 },
        result: 10,
        expression: '4 + 6',
        timestamp: '2026-01-01T00:00:00Z',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const response = await calculatorApi.add(4, 6);

    expect(response.result).toBe(10);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/calculator/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ a: 4, b: 6 }),
    });
  });

  it('builds correct payloads for advanced operations', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        operation: 'PERCENTAGE',
        inputs: { percent: 25 },
        result: 0.25,
        expression: '25%',
        timestamp: '2026-01-01T00:00:00Z',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculatorApi.power(2, 3);
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/v1/calculator/power',
      expect.objectContaining({ body: JSON.stringify({ base: 2, exponent: 3 }) }),
    );

    await calculatorApi.sqrt(16);
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/v1/calculator/sqrt',
      expect.objectContaining({ body: JSON.stringify({ value: 16 }) }),
    );

    await calculatorApi.percentage(25);
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/v1/calculator/percentage',
      expect.objectContaining({ body: JSON.stringify({ percent: 25 }) }),
    );

    await calculatorApi.percentage(25, 200);
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/v1/calculator/percentage',
      expect.objectContaining({ body: JSON.stringify({ percent: 25, of: 200 }) }),
    );
  });

  it('throws CalculatorApiError with backend error details on HTTP 400', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          status: 400,
          code: 'DIVISION_BY_ZERO',
          message: 'Division by zero is not allowed.',
        }),
      }),
    );

    await expect(calculatorApi.divide(10, 0)).rejects.toMatchObject({
      name: 'CalculatorApiError',
      status: 400,
      code: 'DIVISION_BY_ZERO',
      message: 'Division by zero is not allowed.',
    });
  });

  it('throws CalculatorApiError with NETWORK_ERROR when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));

    await expect(calculatorApi.subtract(5, 2)).rejects.toBeInstanceOf(CalculatorApiError);
    await expect(calculatorApi.subtract(5, 2)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});
