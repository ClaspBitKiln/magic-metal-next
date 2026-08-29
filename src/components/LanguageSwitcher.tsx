'use client'

import { useEffect, useRef, useState } from 'react'

const languages = [
  ['ru', 'RU', 'Русский'], ['uz', 'UZ', 'O‘zbek'], ['kk', 'KZ', 'Қазақша'],
  ['ky', 'KG', 'Кыргызча'], ['be', 'BY', 'Беларуская'], ['tr', 'TR', 'Türkçe'], ['en', 'EN', 'English'],
] as const

type LanguageCode = typeof languages[number][0]
type TranslateElementConstructor = new (options: Record<string, unknown>, elementId: string) => void
type TranslateWindow = Window & {
  google?: { translate?: { TranslateElement?: TranslateElementConstructor } }
  googleTranslateElementInit?: () => void
}

function setTranslationCookie(language: LanguageCode) {
  const value = language === 'ru' ? '' : `/ru/${language}`
  const expires = language === 'ru' ? ';expires=Thu, 01 Jan 1970 00:00:00 GMT' : ';max-age=31536000'
  document.cookie = `googtrans=${value};path=/${expires};SameSite=Lax`
  document.cookie = `googtrans=${value};path=/;domain=.${window.location.hostname}${expires};SameSite=Lax`
}

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState<LanguageCode>('ru')
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem('magicmet-language') as LanguageCode | null
    const selected = languages.some(([code]) => code === saved) ? saved as LanguageCode : 'ru'
    // Restore the user's explicit language choice after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguage(selected)

    const translateWindow = window as TranslateWindow
    translateWindow.googleTranslateElementInit = () => {
      const TranslateElement = translateWindow.google?.translate?.TranslateElement
      if (TranslateElement) new TranslateElement({ pageLanguage: 'ru', includedLanguages: languages.map(([code]) => code).join(','), autoDisplay: false }, 'google_translate_element')
    }
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    } else {
      translateWindow.googleTranslateElementInit()
    }
  }, [])

  const changeLanguage = (nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage)
    window.localStorage.setItem('magicmet-language', nextLanguage)
    setTranslationCookie(nextLanguage)
    const googleSelect = document.querySelector<HTMLSelectElement>('.goog-te-combo')
    if (googleSelect && nextLanguage !== 'ru') {
      googleSelect.value = nextLanguage
      googleSelect.dispatchEvent(new Event('change'))
      return
    }
    window.location.reload()
  }

  const current = languages.find(([code]) => code === language) || languages[0]

  return <details className="language-switcher" ref={detailsRef}>
    <summary aria-label={`Язык сайта: ${current[2]}`}><span>{current[1]}</span><b aria-hidden="true" /></summary>
    <div className="language-menu" role="menu" aria-label="Выбор языка">
      {languages.map(([code, short, name]) => <button type="button" role="menuitem" aria-current={language === code ? 'true' : undefined} onClick={() => { if (detailsRef.current) detailsRef.current.open = false; changeLanguage(code) }} key={code}><span>{short}</span><small>{name}</small></button>)}
    </div>
    <div id="google_translate_element" aria-hidden="true" />
  </details>
}
