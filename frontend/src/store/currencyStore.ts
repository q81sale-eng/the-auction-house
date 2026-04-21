import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'GBP' | 'USD' | 'KWD' | 'SAR' | 'AED' | 'QAR' | 'BHD' | 'OMR';

// KWD-base exchange rates (1 KWD = X)
const RATES: Record<Currency, number> = {
  KWD: 1,
  USD: 3.25,
  GBP: 2.56,
  SAR: 12.19,
  AED: 11.93,
  QAR: 11.83,
  BHD: 1.22,
  OMR: 1.25,
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
    (set) => ({ currency: 'KWD', setCurrency: (currency) => set({ currency }) }),
    {
      name: 'tah-currency-v2',
      onRehydrateStorage: () => (state) => {
        if (state && !CURRENCIES.includes(state.currency)) {
          state.currency = 'KWD';
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
