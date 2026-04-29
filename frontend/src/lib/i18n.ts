import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

import type { SupportedLocale } from '../types'

const LANGUAGE_KEY = 'xai_lang'

// Get persisted language or fallback to browser detection
const getPersistedLanguage = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LANGUAGE_KEY)
}

const persistLanguage = (lng: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_KEY, lng)
  }
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'ta', 'hi'],
    fallbackLng: 'en',
    debug: false,
    ns: ['translation'],
    defaultNS: 'translation',
    
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  })

// Custom language change handler that persists to localStorage
i18n.on('languageChanged', (lng) => {
  persistLanguage(lng)
})

// Initialize with persisted language if available
const persistedLang = getPersistedLanguage()
if (persistedLang) {
  i18n.changeLanguage(persistedLang)
}

export const changeLanguage = (lng: SupportedLocale): Promise<void> => {
  return i18n.changeLanguage(lng)
}

export const getCurrentLanguage = (): string => {
  return i18n.language
}

export default i18n