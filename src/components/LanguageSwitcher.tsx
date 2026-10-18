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
  const [translationState, setTranslationState] = useState<'idle' | 'ready' | 'error'>('idle')

  useEffect(() => {
    let saved: string | null = null
    try { saved = window.localStorage.getItem('magicmet-language') } catch { /* Storage can be disabled. */ }
    const selected = languages.some(([code]) => code === saved) ? saved as LanguageCode : 'ru'
    // Restore the user's explicit language choice after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguage(selected)

    // Keep the default Russian page independent of Google Translate. Load the
    // third-party widget only after a visitor has explicitly chosen a translation.
    if (selected === 'ru') return

    const translateWindow = window as TranslateWindow
    // Widget initialization is not proof that the page has been translated.
    // Detect a usable language selector, and report a blocked or incomplete SDK.
    const widget = document.getElementById('google_translate_element')
    let active = true
    let initialized = false
    const fail = () => {
      if (!active) return
      setTranslationState('error')
      if (detailsRef.current) detailsRef.current.open = true
    }
    const checkWidget = () => {
      if (!active || !widget?.querySelector('.goog-te-combo option[value="' + selected + '"]')) return
      window.clearTimeout(timeout)
      setTranslationState('ready')
    }
    const timeout = window.setTimeout(fail, 12000)
    const observer = new MutationObserver(checkWidget)
    if (widget) observer.observe(widget, { childList: true, subtree: true })
    const initialize = () => {
      const TranslateElement = translateWindow.google?.translate?.TranslateElement
      if (!TranslateElement || initialized || !active) return
      initialized = true
      try {
        new TranslateElement({ pageLanguage: 'ru', includedLanguages: languages.map(([code]) => code).join(','), autoDisplay: false }, 'google_translate_element')
        checkWidget()
      } catch { fail() }
    }
    translateWindow.googleTranslateElementInit = initialize
    let script = document.getElementById('google-translate-script') as HTMLScriptElement | null
    const isNew = !script
    if (!script) {
      script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
    }
    script.addEventListener('error', fail)
    // A load event without a working callback still needs the timeout above.
    script.addEventListener('load', initialize)
    if (isNew) document.body.appendChild(script)
    initialize()
    return () => {
      active = false
      window.clearTimeout(timeout)
      observer.disconnect()
      script.removeEventListener('error', fail)
      script.removeEventListener('load', initialize)
      if (translateWindow.googleTranslateElementInit === initialize) delete translateWindow.googleTranslateElementInit
    }
  }, [])

  const changeLanguage = (nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage)
    try { window.localStorage.setItem('magicmet-language', nextLanguage) } catch { /* Cookies still allow returning to Russian. */ }
    setTranslationCookie(nextLanguage)
    window.location.reload()
  }

  const current = languages.find(([code]) => code === language) || languages[0]

  return <details className="language-switcher" ref={detailsRef} style={language !== 'ru' ? { display: 'block' } : undefined}>
    <summary aria-label={`Язык сайта: ${current[2]}`}><span>{current[1]}</span><b aria-hidden="true" /></summary>
    <div className="language-menu" aria-label="Выбор языка">
      <p style={{ margin: '6px 9px', fontSize: 12, lineHeight: 1.4 }}>Другие языки — машинный перевод Google. Технические обозначения сверяйте с русским оригиналом.</p>
      {language !== 'ru' && <p role="status" aria-live="polite" style={{ margin: '6px 9px', fontSize: 12, lineHeight: 1.4 }}>
        {translationState === 'error' ? 'Перевод недоступен. Показан исходный текст или неполный перевод. Выберите RU, чтобы вернуться к русскому оригиналу.' : translationState === 'ready' ? 'Сервис перевода загружен. Перевод может быть неполным.' : 'Загружаем сервис перевода…'}
      </p>}
      {languages.map(([code, short, name]) => <button type="button" aria-current={language === code ? 'true' : undefined} onClick={() => { if (detailsRef.current) detailsRef.current.open = false; changeLanguage(code) }} key={code}><span>{short}</span><small>{name}</small></button>)}
    </div>
    <div id="google_translate_element" aria-hidden="true" />
  </details>
}
