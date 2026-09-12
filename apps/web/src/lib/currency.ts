import { formatCurrency } from '@mecrm/shared';
import { useAuth } from '../context/AuthContext';

/** Formats an amount using the signed-in user's currency preference (defaults to INR). */
export function useCurrencyFormatter(): (amount: number) => string {
  const { user } = useAuth();
  const code = user?.currency || 'INR';
  return (amount: number) => formatCurrency(amount, code);
}
