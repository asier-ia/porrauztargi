/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('porra_lang');
    return saved === 'eu' ? 'eu' : 'es';
  });

  const setLanguage = (lang) => {
    if (lang === 'es' || lang === 'eu') {
      setLanguageState(lang);
      localStorage.setItem('porra_lang', lang);
    }
  };

  const t = (path, replacements = {}) => {
    const keys = path.split('.');
    let value = translations[language];
    
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        // Fallback to Spanish if the translation key does not exist in Euskera
        let fallbackValue = translations['es'];
        for (const fbKey of keys) {
          if (fallbackValue && fallbackValue[fbKey] !== undefined) {
            fallbackValue = fallbackValue[fbKey];
          } else {
            fallbackValue = null;
            break;
          }
        }
        if (fallbackValue !== null) {
          value = fallbackValue;
          break;
        }
        return path;
      }
    }

    if (typeof value !== 'string') return path;

    let text = value;
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
