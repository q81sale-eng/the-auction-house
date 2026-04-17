import React, { createContext, useContext, useEffect, useState } from 'react';
import en from './en';
import ar from './ar';

export type Lang = 'en' | 'ar';

const strings = { en, ar };

interface LangContextValue {
  lang: Lang;
  toggle: () => void;
}

const LanguageContext = createContext<LangContextValue>({ lang: 'en', toggle: () => {} });

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem('lang') as Lang | null) ?? 'en'
  );

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => setLang(prev => (prev === 'en' ? 'ar' : 'en'));

  return (
    <LanguageContext.Provider value={{ lang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export const useT = () => {
  const { lang, toggle } = useLanguage();
  return { tr: strings[lang], lang, toggle };
};
