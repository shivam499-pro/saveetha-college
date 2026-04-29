import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from "@/lib/utils"

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'hi', label: 'हिंदी' },
  ]

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('xai_lang', code)
  }

  return (
    <div className="flex gap-4">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={cn(
            "text-sm transition-all hover:text-[#F4B942]",
            i18n.language === lang.code 
              ? "font-bold text-[#F4B942] underline decoration-2 underline-offset-4" 
              : "text-white/70"
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher