import { CURRENCY_SYMBOLS, type Currency } from '../store/currencyStore';

const LATIN_FMT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatCurrency = (amount: number | string | null | undefined, currency: Currency | string = 'GBP') => {
  if (amount == null) return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency;
  const formatted = LATIN_FMT.format(num);
  // Prefix symbols that attach directly (£ $); Arabic/multi-char symbols get a space
  const glued = symbol.length === 1 && /[£$€]/.test(symbol);
  return glued ? `${symbol}${formatted}` : `${symbol} ${formatted}`;
};

export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(date));

export const formatDateTime = (date: string | Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
