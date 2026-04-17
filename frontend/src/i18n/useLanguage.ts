import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import en from './en';
import ar from './ar';

export type Lang = 'en' | 'ar';

const strings = { en, ar };

interface LangState {
  lang: Lang;
  toggle: () => void;
}

export const useLanguage = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      toggle: () => set({ lang: get().lang === 'en' ? 'ar' : 'en' }),
    }),
    { name: 'lang' }
  )
);

export const useT = () => {
  const { lang, toggle } = useLanguage();
  return { tr: strings[lang], lang, toggle };
};
