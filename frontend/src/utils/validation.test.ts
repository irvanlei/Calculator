import { describe, expect, it } from 'vitest';
import {
  formatDisplayNumber,
  parseNumericInput,
  validateBinaryOperands,
  validateOptionalOperand,
} from './validation';

describe('validation utilities', () => {
  it('parses valid integers, negatives, and decimals', () => {
    expect(parseNumericInput('42')).toEqual({ valid: true, value: 42 });
    expect(parseNumericInput(' -3.14 ')).toEqual({ valid: true, value: -3.14 });
    expect(parseNumericInput('.5')).toEqual({ valid: true, value: 0.5 });
  });

  it('rejects empty or non-numeric strings', () => {
    expect(parseNumericInput('   ', 'Base')).toEqual({
      valid: false,
      error: 'Base is required.',
    });
    expect(parseNumericInput('abc', 'Base')).toEqual({
      valid: false,
      error: 'Base must be a valid finite number.',
    });
    expect(parseNumericInput('12..3')).toEqual({
      valid: false,
      error: 'Value must be a valid finite number.',
    });
  });

  it('rejects numbers outside finite range', () => {
    const huge = '9'.repeat(400);
    expect(parseNumericInput(huge, 'Operand')).toEqual({
      valid: false,
      error: 'Operand is outside the supported numeric range.',
    });
  });

  it('validates binary operands and returns first failing message', () => {
    expect(validateBinaryOperands('10', '2.5')).toEqual({ valid: true, a: 10, b: 2.5 });
    expect(validateBinaryOperands('', '5', 'Dividend', 'Divisor')).toEqual({
      valid: false,
      error: 'Dividend is required.',
    });
    expect(validateBinaryOperands('10', 'xyz', 'Dividend', 'Divisor')).toEqual({
      valid: false,
      error: 'Divisor must be a valid finite number.',
    });
  });

  it('validates optional operands', () => {
    expect(validateOptionalOperand('', 'Base value')).toEqual({ valid: true, value: undefined });
    expect(validateOptionalOperand('200', 'Base value')).toEqual({ valid: true, value: 200 });
    expect(validateOptionalOperand('invalid', 'Base value')).toEqual({
      valid: false,
      error: 'Base value must be a valid finite number.',
    });
  });

  it('formats negative zero as 0', () => {
    expect(formatDisplayNumber(-0)).toBe('0');
    expect(formatDisplayNumber(12.5)).toBe('12.5');
  });
});
