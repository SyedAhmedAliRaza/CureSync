'use client';

import { createContext, useContext, useState } from 'react';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bal', name: 'Balochi' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'ps', name: 'Pashto' },
  { code: 'pa', name: 'Punjabi' },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('curesync_language') : null) || 'en'
  );

  const setLanguage = (code) => {
    setLanguageState(code);
    localStorage.setItem('curesync_language', code);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
