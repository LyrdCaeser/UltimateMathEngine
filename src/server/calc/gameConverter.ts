import Decimal from 'decimal.js';
import { formatDecimal, parseDecimal } from './decimal';

export type GameRate = {
  id: string;
  game_code: string;
  currency_code: string;
  source_name: string;
  amount_vnd: string;
  currency_amount: string;
  bonus_amount: string;
  note: string | null;
  source_updated_at: string | null;
};

export type GameConversionResult = {
  resultAmount: string;
  method: 'exact_package' | 'approx_by_rate';
  precisionNote: string;
  usedRates: GameRate[];
};

function totalCurrency(rate: GameRate): Decimal {
  return parseDecimal(rate.currency_amount, 'currency_amount').plus(parseDecimal(rate.bonus_amount ?? 0, 'bonus_amount'));
}

export function convertByRateTable(params: {
  gameCode: string;
  currencyCode: string;
  amountVnd: unknown;
  rates: GameRate[];
}): GameConversionResult {
  const amount = parseDecimal(params.amountVnd, 'amountVnd');
  const usableRates = params.rates.filter(
    (rate) => rate.game_code === params.gameCode && rate.currency_code === params.currencyCode
  );

  if (usableRates.length === 0) {
    throw new Error('No active real rate table found for selected game/currency');
  }

  const exact = usableRates.find((rate) => parseDecimal(rate.amount_vnd, 'amount_vnd').eq(amount));
  if (exact) {
    return {
      resultAmount: formatDecimal(totalCurrency(exact)),
      method: 'exact_package',
      precisionNote: 'Exact package match from database. Accuracy depends on whether the saved rate table matches the current official shop/card table.',
      usedRates: [exact]
    };
  }

  const bestRate = usableRates
    .map((rate) => {
      const amountVnd = parseDecimal(rate.amount_vnd, 'amount_vnd');
      return { rate, currencyPerVnd: totalCurrency(rate).div(amountVnd) };
    })
    .sort((a, b) => b.currencyPerVnd.comparedTo(a.currencyPerVnd))[0];

  const result = amount.mul(bestRate.currencyPerVnd);
  return {
    resultAmount: formatDecimal(result),
    method: 'approx_by_rate',
    precisionNote: 'Approximate conversion because the amount does not match a defined package. Update database rates whenever Garena/HoYo changes shop/card values.',
    usedRates: [bestRate.rate]
  };
}
