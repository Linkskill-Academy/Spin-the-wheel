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
