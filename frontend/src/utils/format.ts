export const formatCurrency = (amount: number | string, currency = 'GBP') => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
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
