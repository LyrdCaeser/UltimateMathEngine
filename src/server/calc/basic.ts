import Decimal from 'decimal.js';
import { CalcResult, ok, parseDecimal, safeDivide } from './decimal';

export type BasicOperation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'percentOf'
  | 'power'
  | 'sqrt';

export function calculateBasic(operation: BasicOperation, values: unknown[]): CalcResult {
  const [rawA, rawB] = values;
  const a = parseDecimal(rawA, 'first value');

  switch (operation) {
    case 'add':
      return ok(a.plus(parseDecimal(rawB, 'second value')));
    case 'subtract':
      return ok(a.minus(parseDecimal(rawB, 'second value')));
    case 'multiply':
      return ok(a.mul(parseDecimal(rawB, 'second value')));
    case 'divide':
      return ok(safeDivide(a, parseDecimal(rawB, 'second value')));
    case 'percentOf': {
      const b = parseDecimal(rawB, 'second value');
      return ok(a.div(100).mul(b), 'Result means first value percent of second value. Decimal.js used for stable percentage math.');
    }
    case 'power': {
      const exponent = parseDecimal(rawB, 'exponent');
      if (!exponent.isInteger() || exponent.abs().gt(10000)) {
        const approx = new Decimal(Math.pow(a.toNumber(), exponent.toNumber()));
        return ok(approx, 'Non-integer or huge exponent uses Math.pow approximation; normal inputs remain highly accurate.');
      }
      return ok(a.pow(exponent.toNumber()));
    }
    case 'sqrt': {
      if (a.isNegative()) throw new Error('Cannot calculate square root of a negative number');
      return ok(a.sqrt());
    }
    default:
      throw new Error(`Unsupported basic operation: ${operation satisfies never}`);
  }
}
