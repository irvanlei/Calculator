const NUMERIC_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

export interface ParseResult {
  valid: boolean;
  value?: number;
  error?: string;
}

export function parseNumericInput(raw: string, fieldLabel = 'Value'): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, error: `${fieldLabel} is required.` };
  }

  if (!NUMERIC_PATTERN.test(trimmed)) {
    return { valid: false, error: `${fieldLabel} must be a valid finite number.` };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { valid: false, error: `${fieldLabel} is outside the supported numeric range.` };
  }

  return { valid: true, value: parsed };
}

export function validateBinaryOperands(
  rawA: string,
  rawB: string,
  labelA = 'First operand',
  labelB = 'Second operand',
): { valid: true; a: number; b: number } | { valid: false; error: string } {
  const first = parseNumericInput(rawA, labelA);
  if (!first.valid || first.value === undefined) {
    return { valid: false, error: first.error ?? `${labelA} is invalid.` };
  }

  const second = parseNumericInput(rawB, labelB);
  if (!second.valid || second.value === undefined) {
    return { valid: false, error: second.error ?? `${labelB} is invalid.` };
  }

  return { valid: true, a: first.value, b: second.value };
}

export function validateOptionalOperand(
  raw: string,
  fieldLabel: string,
): { valid: true; value?: number } | { valid: false; error: string } {
  if (!raw.trim()) {
    return { valid: true, value: undefined };
  }

  const parsed = parseNumericInput(raw, fieldLabel);
  if (!parsed.valid || parsed.value === undefined) {
    return { valid: false, error: parsed.error ?? `${fieldLabel} is invalid.` };
  }

  return { valid: true, value: parsed.value };
}

export function formatDisplayNumber(value: number): string {
  if (Object.is(value, -0)) {
    return '0';
  }
  return String(value);
}
