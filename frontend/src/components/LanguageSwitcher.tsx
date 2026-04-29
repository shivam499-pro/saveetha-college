import React from 'react'
import { useTranslation } from 'react-i18next'
import type { SupportedLocale } from '../types'

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'en' as SupportedLocale, label: 'EN' },
    { code: 'ta' as SupportedLocale, label: 'தமிழ்' },
    { code: 'hi' as SupportedLocale, label: 'हिंदी' },
  ]

  const handleLanguageChange = (lng: SupportedLocale): void => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex items-center gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${i18n.language === lang.code
              ? 'bg-gold-500 text-white font-bold border-b-2 border-gold-400'
              : 'bg-navy-800 text-gray-300 hover:bg-navy-700 hover:text-white'
            }
          `}
          aria-label={`Switch to ${lang.label} language`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher