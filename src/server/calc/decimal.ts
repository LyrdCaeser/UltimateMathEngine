import Decimal from 'decimal.js';

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 40
});

export type CalcResult = {
  result: string;
  precisionNote: string;
};

export function parseDecimal(input: unknown, fieldName = 'value'): Decimal {
  if (input === null || input === undefined || input === '') {
    throw new Error(`${fieldName} is required`);
  }

  const raw = String(input).replace(/,/g, '').trim();
  if (!/^[-+]?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return new Decimal(raw);
}

export function formatDecimal(value: Decimal, decimalPlaces = 12): string {
  if (!value.isFinite()) {
    throw new Error('Result is not finite');
  }

  const fixed = value.toDecimalPlaces(decimalPlaces).toFixed();
  if (!fixed.includes('.')) return fixed;
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function safeDivide(a: Decimal, b: Decimal): Decimal {
  if (b.isZero()) {
    throw new Error('Cannot divide by zero');
  }
  return a.div(b);
}

export function ok(result: Decimal | string, note = 'Calculated with Decimal.js high-precision arithmetic.'): CalcResult {
  return {
    result: result instanceof Decimal ? formatDecimal(result) : result,
    precisionNote: note
  };
}
