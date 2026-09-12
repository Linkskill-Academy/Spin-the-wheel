export interface RevenueCombination {
  label: string;
  units: number;
  pricePerUnit: number;
}

export function combinationTotal(c: RevenueCombination): number {
  return c.units * c.pricePerUnit;
}

export function combinationsTotal(combos: RevenueCombination[]): number {
  return combos.reduce((sum, c) => sum + combinationTotal(c), 0);
}

export function progressPercent(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

const CURRENCY_LOCALES: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
};

/** Generic currency formatter used by the Currency setting. Defaults to INR. */
export function formatCurrency(amount: number, currencyCode = 'INR'): string {
  const locale = CURRENCY_LOCALES[currencyCode] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function goalGap(current: number, target: number): number {
  return Math.max((target || 0) - (current || 0), 0);
}

/**
 * The next meaningful checkpoint for a goal — roughly the next 10% step,
 * never past the target and never behind current progress.
 */
export function nextMilestoneValue(current: number, target: number): number {
  if (!target || target <= 0) return current || 0;
  if (current >= target) return target;
  const step = Math.max(1, Math.round(target * 0.1));
  return Math.min(target, current + step);
}

/** Formats a goal's numeric value, using currency formatting when the unit is a currency symbol. */
export function formatGoalValue(value: number, unit: string, currencyCode = 'INR'): string {
  if (unit === '₹' || unit.toLowerCase() === 'inr' || unit.toLowerCase() === 'usd') {
    return formatCurrency(value, unit.toLowerCase() === 'usd' ? 'USD' : currencyCode);
  }
  return `${new Intl.NumberFormat('en-IN').format(value || 0)}${unit ? ` ${unit}` : ''}`;
}
