import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../../shared/types';
import { translations } from '../i18n/translations';
import { en } from '../locales/en/translation';
import { hi } from '../locales/hi/translation';
import { mr } from '../locales/mr/translation';

export const locales = { en, hi, mr };

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const saved = localStorage.getItem('honeychain_lang') as LanguageCode;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('honeychain_lang', lang);
  };

  const resolvePath = (obj: any, path: string): string | undefined => {
    if (!obj || typeof obj !== 'object') return undefined;
    const parts = path.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr && typeof curr === 'object' && part in curr) {
        curr = curr[part];
      } else {
        return undefined;
      }
    }
    return typeof curr === 'string' ? curr : undefined;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const lang = language || 'en';
    let result: string | undefined;

    // 1. Direct dot-path in current locale (e.g. 'dashboard.welcomeBack')
    if (key.includes('.')) {
      result = resolvePath(locales[lang], key);
      if (!result && lang !== 'en') {
        result = resolvePath(locales['en'], key);
      }
    }

    // 2. Direct key in legacy translations dictionary
    if (!result) {
      const legacyDict = (translations as any)[lang] || translations['en'];
      if (legacyDict && legacyDict[key]) {
        result = legacyDict[key];
      }
    }

    // 3. Search across all sections of current locale
    if (!result && locales[lang]) {
      for (const section of Object.values(locales[lang])) {
        if (section && typeof section === 'object' && (section as any)[key]) {
          result = (section as any)[key];
          break;
        }
      }
    }

    // 4. Fallback search across English locale
    if (!result && locales['en']) {
      for (const section of Object.values(locales['en'])) {
        if (section && typeof section === 'object' && (section as any)[key]) {
          result = (section as any)[key];
          break;
        }
      }
    }

    // 5. Fallback to English legacy dictionary
    if (!result && (translations['en'] as any)[key]) {
      result = (translations['en'] as any)[key];
    }

    // 6. Ultimate fallback to key itself
    if (!result) {
      result = key;
    }

    // Parameter substitution: {count}, {name}, etc.
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
