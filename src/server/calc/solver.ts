import Decimal from 'decimal.js';
import { CalcResult, formatDecimal, parseDecimal, safeDivide } from './decimal';

export type SolverKind = 'linear' | 'quadratic' | 'system2';

export function solveLinear(aRaw: unknown, bRaw: unknown): CalcResult {
  const a = parseDecimal(aRaw, 'a');
  const b = parseDecimal(bRaw, 'b');
  if (a.isZero()) {
    if (b.isZero()) return { result: 'Infinite solutions', precisionNote: 'Equation 0x + 0 = 0 has infinitely many solutions.' };
    return { result: 'No solution', precisionNote: 'Equation has no solution because a = 0 and b != 0.' };
  }
  return {
    result: `x = ${formatDecimal(b.neg().div(a))}`,
    precisionNote: 'Exact linear solution using Decimal.js.'
  };
}

export function solveQuadratic(aRaw: unknown, bRaw: unknown, cRaw: unknown): CalcResult {
  const a = parseDecimal(aRaw, 'a');
  const b = parseDecimal(bRaw, 'b');
  const c = parseDecimal(cRaw, 'c');

  if (a.isZero()) return solveLinear(b, c);

  const delta = b.pow(2).minus(a.mul(c).mul(4));
  if (delta.isNegative()) {
    return {
      result: `Δ = ${formatDecimal(delta)}; no real roots`,
      precisionNote: 'Delta calculated exactly with Decimal.js. Complex roots are not expanded in this phase.'
    };
  }

  if (delta.isZero()) {
    const x = b.neg().div(a.mul(2));
    return {
      result: `Δ = 0; x = ${formatDecimal(x)}`,
      precisionNote: 'Repeated real root calculated with Decimal.js.'
    };
  }

  const sqrtDelta = delta.sqrt();
  const denominator = a.mul(2);
  const x1 = b.neg().plus(sqrtDelta).div(denominator);
  const x2 = b.neg().minus(sqrtDelta).div(denominator);

  return {
    result: `Δ = ${formatDecimal(delta)}; x1 = ${formatDecimal(x1)}, x2 = ${formatDecimal(x2)}`,
    precisionNote: 'Real roots calculated with Decimal.js high precision.'
  };
}

export function solveSystem2(values: unknown[]): CalcResult {
  const [aRaw, bRaw, cRaw, dRaw, eRaw, fRaw] = values;
  const a = parseDecimal(aRaw, 'a');
  const b = parseDecimal(bRaw, 'b');
  const c = parseDecimal(cRaw, 'c');
  const d = parseDecimal(dRaw, 'd');
  const e = parseDecimal(eRaw, 'e');
  const f = parseDecimal(fRaw, 'f');

  const determinant = a.mul(e).minus(b.mul(d));
  if (determinant.isZero()) {
    return {
      result: 'No unique solution',
      precisionNote: 'Determinant is zero, so the system has no unique solution.'
    };
  }

  const x = safeDivide(c.mul(e).minus(b.mul(f)), determinant);
  const y = safeDivide(a.mul(f).minus(c.mul(d)), determinant);
  return {
    result: `x = ${formatDecimal(x)}, y = ${formatDecimal(y)}`,
    precisionNote: '2x2 system solved by Cramer rule using Decimal.js.'
  };
}

export function solve(kind: SolverKind, values: unknown[]): CalcResult {
  if (kind === 'linear') return solveLinear(values[0], values[1]);
  if (kind === 'quadratic') return solveQuadratic(values[0], values[1], values[2]);
  if (kind === 'system2') return solveSystem2(values);
  throw new Error(`Unsupported solver kind: ${kind satisfies never}`);
}
