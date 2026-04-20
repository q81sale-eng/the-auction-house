import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'GBP' | 'USD' | 'KWD' | 'SAR' | 'AED' | 'QAR' | 'BHD' | 'OMR';

// GBP-base exchange rates (approximate)
const RATES: Record<Currency, number> = {
  GBP: 1,
  USD: 1.27,
  KWD: 0.39,
  SAR: 4.76,
  AED: 4.66,
  QAR: 4.62,
  BHD: 0.48,
  OMR: 0.49,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  USD: '$',
  KWD: 'د.ك',
  SAR: 'ر.س',
  AED: 'د.إ',
  QAR: 'ر.ق',
  BHD: 'BD',
  OMR: 'OMR',
};

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({ currency: 'USD', setCurrency: (currency) => set({ currency }) }),
    {
      name: 'tah-currency',
      onRehydrateStorage: () => (state) => {
        if (state && !CURRENCIES.includes(state.currency)) {
          state.currency = 'USD';
        }
      },
    }
  )
);

export const convertFromGBP = (amount: number, to: Currency): number =>
  amount * RATES[to];

export const convertToGBP = (amount: number, from: Currency): number =>
  amount / RATES[from];

export const CURRENCIES: Currency[] = ['GBP', 'USD', 'KWD', 'SAR', 'AED', 'QAR', 'BHD', 'OMR'];
