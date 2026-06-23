import Decimal from 'decimal.js';
import { CalcResult, formatDecimal, parseDecimal, safeDivide } from './decimal';

export type FinanceKind = 'discount' | 'profitLoss' | 'simpleInterest' | 'compoundInterest' | 'installment';

export function calculateFinance(kind: FinanceKind, payload: Record<string, unknown>): CalcResult {
  switch (kind) {
    case 'discount': {
      const original = parseDecimal(payload.originalPrice, 'originalPrice');
      const percent = parseDecimal(payload.percent, 'percent');
      const discount = original.mul(percent).div(100);
      const finalPrice = original.minus(discount);
      return {
        result: `discount = ${formatDecimal(discount)}; final = ${formatDecimal(finalPrice)}`,
        precisionNote: 'Discount calculated with Decimal.js.'
      };
    }
    case 'profitLoss': {
      const cost = parseDecimal(payload.cost, 'cost');
      const revenue = parseDecimal(payload.revenue, 'revenue');
      const diff = revenue.minus(cost);
      const percent = cost.isZero() ? new Decimal(0) : diff.div(cost).mul(100);
      return {
        result: `${diff.gte(0) ? 'profit' : 'loss'} = ${formatDecimal(diff.abs())}; rate = ${formatDecimal(percent)}%`,
        precisionNote: 'Profit/loss rate calculated with Decimal.js.'
      };
    }
    case 'simpleInterest': {
      const principal = parseDecimal(payload.principal, 'principal');
      const annualRate = parseDecimal(payload.annualRate, 'annualRate').div(100);
      const years = parseDecimal(payload.years, 'years');
      const interest = principal.mul(annualRate).mul(years);
      return {
        result: `interest = ${formatDecimal(interest)}; total = ${formatDecimal(principal.plus(interest))}`,
        precisionNote: 'Simple interest calculated with Decimal.js.'
      };
    }
    case 'compoundInterest': {
      const principal = parseDecimal(payload.principal, 'principal');
      const annualRate = parseDecimal(payload.annualRate, 'annualRate').div(100);
      const years = parseDecimal(payload.years, 'years');
      const compoundsPerYear = parseDecimal(payload.compoundsPerYear ?? 12, 'compoundsPerYear');
      if (!compoundsPerYear.isInteger() || compoundsPerYear.lte(0)) throw new Error('compoundsPerYear must be a positive integer');
      const base = annualRate.div(compoundsPerYear).plus(1);
      const periods = compoundsPerYear.mul(years);
      const total = new Decimal(Math.pow(base.toNumber(), periods.toNumber())).mul(principal);
      return {
        result: `total = ${formatDecimal(total)}; interest = ${formatDecimal(total.minus(principal))}`,
        precisionNote: 'Compound interest uses Decimal.js plus exponent approximation for fractional periods.'
      };
    }
    case 'installment': {
      const principal = parseDecimal(payload.principal, 'principal');
      const annualRate = parseDecimal(payload.annualRate, 'annualRate').div(100);
      const months = parseDecimal(payload.months, 'months');
      if (!months.isInteger() || months.lte(0)) throw new Error('months must be a positive integer');
      const monthlyRate = annualRate.div(12);
      if (monthlyRate.isZero()) {
        const monthly = safeDivide(principal, months);
        return { result: `monthly = ${formatDecimal(monthly)}; total = ${formatDecimal(principal)}`, precisionNote: 'Zero-rate installment calculated exactly with Decimal.js.' };
      }
      const pow = new Decimal(Math.pow(monthlyRate.plus(1).toNumber(), months.toNumber()));
      const monthly = principal.mul(monthlyRate).mul(pow).div(pow.minus(1));
      return {
        result: `monthly = ${formatDecimal(monthly)}; total = ${formatDecimal(monthly.mul(months))}`,
        precisionNote: 'Installment formula calculated with Decimal.js plus exponent approximation.'
      };
    }
    default:
      throw new Error(`Unsupported finance kind: ${kind satisfies never}`);
  }
}
