import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'GBP' | 'USD' | 'EUR' | 'KWD' | 'SAR' | 'AED' | 'QAR' | 'BHD' | 'OMR';

// Approximate rates from GBP base
const RATES: Record<Currency, number> = {
  GBP: 1,
  USD: 1.27,
  EUR: 1.17,
  KWD: 0.39,
  SAR: 4.76,
  AED: 4.66,
  QAR: 4.62,
  BHD: 0.48,
  OMR: 0.49,
};

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({ currency: 'GBP', setCurrency: (currency) => set({ currency }) }),
    { name: 'tah-currency' }
  )
);

export const convertFromGBP = (amount: number, to: Currency): number =>
  amount * RATES[to];

export const CURRENCIES: Currency[] = ['GBP', 'USD', 'EUR', 'KWD', 'SAR', 'AED', 'QAR', 'BHD', 'OMR'];
