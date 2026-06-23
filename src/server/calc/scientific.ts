import Decimal from 'decimal.js';
import { CalcResult, ok, parseDecimal } from './decimal';

export type AngleMode = 'deg' | 'rad';
export type ScientificOperation = 'sin' | 'cos' | 'tan' | 'log10' | 'ln' | 'exp' | 'abs' | 'factorial';

function toRadians(value: Decimal, angleMode: AngleMode): number {
  const n = value.toNumber();
  return angleMode === 'deg' ? (n * Math.PI) / 180 : n;
}

function factorial(n: Decimal): Decimal {
  if (!n.isInteger() || n.isNegative()) throw new Error('Factorial requires a non-negative integer');
  if (n.gt(5000)) throw new Error('Factorial input is too large');

  let result = new Decimal(1);
  for (let i = 2; i <= n.toNumber(); i += 1) {
    result = result.mul(i);
  }
  return result;
}

export function calculateScientific(
  operation: ScientificOperation,
  value: unknown,
  angleMode: AngleMode = 'deg'
): CalcResult {
  const x = parseDecimal(value);

  switch (operation) {
    case 'sin':
      return ok(new Decimal(Math.sin(toRadians(x, angleMode))), 'Trigonometric result uses JavaScript double precision; accurate for normal calculator inputs.');
    case 'cos':
      return ok(new Decimal(Math.cos(toRadians(x, angleMode))), 'Trigonometric result uses JavaScript double precision; accurate for normal calculator inputs.');
    case 'tan':
      return ok(new Decimal(Math.tan(toRadians(x, angleMode))), 'Trigonometric result uses JavaScript double precision; accurate for normal calculator inputs.');
    case 'log10':
      if (x.lte(0)) throw new Error('Logarithm requires a positive number');
      return ok(new Decimal(Math.log10(x.toNumber())), 'Logarithm uses JavaScript double precision; accurate for normal calculator inputs.');
    case 'ln':
      if (x.lte(0)) throw new Error('Natural logarithm requires a positive number');
      return ok(new Decimal(Math.log(x.toNumber())), 'Natural logarithm uses JavaScript double precision; accurate for normal calculator inputs.');
    case 'exp':
      return ok(new Decimal(Math.exp(x.toNumber())), 'Exponential uses JavaScript double precision; accurate for normal calculator inputs.');
    case 'abs':
      return ok(x.abs());
    case 'factorial':
      return ok(factorial(x), 'Exact integer factorial calculated with Decimal.js.');
    default:
      throw new Error(`Unsupported scientific operation: ${operation satisfies never}`);
  }
}
