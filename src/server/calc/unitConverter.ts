import Decimal from 'decimal.js';
import { CalcResult, formatDecimal, parseDecimal } from './decimal';

const linearUnits: Record<string, Record<string, Decimal>> = {
  length: {
    mm: new Decimal('0.001'),
    cm: new Decimal('0.01'),
    m: new Decimal('1'),
    km: new Decimal('1000')
  },
  mass: {
    g: new Decimal('1'),
    kg: new Decimal('1000'),
    ton: new Decimal('1000000')
  },
  time: {
    second: new Decimal('1'),
    minute: new Decimal('60'),
    hour: new Decimal('3600'),
    day: new Decimal('86400')
  },
  data: {
    B: new Decimal('1'),
    KB: new Decimal('1024'),
    MB: new Decimal('1048576'),
    GB: new Decimal('1073741824'),
    TB: new Decimal('1099511627776')
  }
};

function convertTemperature(value: Decimal, from: string, to: string): Decimal {
  let celsius: Decimal;
  if (from === 'C') celsius = value;
  else if (from === 'F') celsius = value.minus(32).mul(5).div(9);
  else if (from === 'K') celsius = value.minus('273.15');
  else throw new Error('Unsupported temperature source unit');

  if (to === 'C') return celsius;
  if (to === 'F') return celsius.mul(9).div(5).plus(32);
  if (to === 'K') return celsius.plus('273.15');
  throw new Error('Unsupported temperature target unit');
}

export function convertUnit(category: string, valueRaw: unknown, from: string, to: string): CalcResult {
  const value = parseDecimal(valueRaw);
  if (category === 'temperature') {
    return {
      result: formatDecimal(convertTemperature(value, from, to)),
      precisionNote: 'Temperature converted with Decimal.js formulas.'
    };
  }

  const table = linearUnits[category];
  if (!table) throw new Error('Unsupported unit category');
  const fromFactor = table[from];
  const toFactor = table[to];
  if (!fromFactor || !toFactor) throw new Error('Unsupported unit');

  const base = value.mul(fromFactor);
  return {
    result: formatDecimal(base.div(toFactor)),
    precisionNote: 'Unit conversion calculated using exact fixed conversion factors.'
  };
}

export function unitOptions(): Record<string, string[]> {
  return {
    length: Object.keys(linearUnits.length),
    mass: Object.keys(linearUnits.mass),
    time: Object.keys(linearUnits.time),
    data: Object.keys(linearUnits.data),
    temperature: ['C', 'F', 'K']
  };
}
