'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useId, useRef, useState } from 'react'
import { hasRequestConsent, REQUEST_CONSENT_ERROR, REQUEST_FILE_EXTENSIONS, REQUEST_MAX_TOTAL_FILE_SIZE } from '@/lib/requestValidation'

const allowedExtensions = new Set<string>(REQUEST_FILE_EXTENSIONS)
const acceptedFiles = REQUEST_FILE_EXTENSIONS.map(extension => `.${extension}`).join(',')
type FieldErrors = Partial<Record<'request' | 'files' | 'contact' | 'email' | 'consent', string>>

export default function RequestForm() {
  const formId = useId()
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formStep, setFormStep] = useState<1 | 2>(1)
  const [selectedFiles, setSelectedFiles] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [startedAt] = useState(() => Date.now())
  const formStarted = useRef(false)

  useEffect(() => {
    const syncSelectedProduct = () => setSelectedProduct(new URLSearchParams(window.location.search).get('product')?.trim() || '')
    syncSelectedProduct()
    window.addEventListener('popstate', syncSelectedProduct)
    return () => window.removeEventListener('popstate', syncSelectedProduct)
  }, [])

  function validateFields(form: HTMLFormElement, includeContacts: boolean): FieldErrors {
    const data = new FormData(form)
    const message = String(data.get('message') || '').trim()
    const files = data.getAll('files').filter((value): value is File => value instanceof File && value.size > 0)
    const errors: FieldErrors = {}
    if (!message && !files.length) errors.request = 'Прикрепите файл или опишите, что требуется.'
    if (files.some(file => !allowedExtensions.has(file.name.split('.').pop()?.toLowerCase() || ''))) {
      errors.files = 'Этот формат файла не поддерживается. Выберите фото, документ или чертёж.'
    } else if (files.reduce((sum, file) => sum + file.size, 0) > REQUEST_MAX_TOTAL_FILE_SIZE) {
      errors.files = 'Общий размер файлов должен быть не больше 4 МБ.'
    }
    if (includeContacts) {
      const phone = String(data.get('phone') || '').trim()
      const email = String(data.get('email') || '').trim()
      if (!phone && !email) errors.contact = 'Укажите телефон или email, чтобы мы могли отправить расчёт.'
      const emailInput = form.elements.namedItem('email') as HTMLInputElement | null
      if (email && emailInput?.validity.typeMismatch) errors.email = 'Проверьте email: например, name@example.com.'
      if (!hasRequestConsent(data.get('consent'))) errors.consent = REQUEST_CONSENT_ERROR
    }
    return errors
  }

  function focusFirstError(form: HTMLFormElement, errors: FieldErrors) {
    if (errors.request || errors.files) setFormStep(1)
    const field = errors.files ? 'files' : errors.request ? 'message' : errors.contact ? 'phone' : errors.email ? 'email' : 'consent'
    requestAnimationFrame(() => form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${field}"]`)?.focus())
  }

  function updateFieldErrors(event: FormEvent<HTMLFormElement>) {
    if (status === 'sending') return
    const errors = validateFields(event.currentTarget, formStep === 2)
    setFieldErrors((current) => {
      if (!Object.keys(current).length) return current
      const remaining: FieldErrors = {}
      for (const key of Object.keys(current) as (keyof FieldErrors)[]) {
        if (errors[key]) remaining[key] = errors[key]
      }
      return remaining
    })
    setFormError('')
    if (status === 'success') setStatus('idle')
  }

  function continueRequest(event: FormEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form
    if (!form) return
    const errors = validateFields(form, false)
    setFieldErrors(errors)
    setFormError('')
    if (Object.keys(errors).length) {
      setStatus('error')
      focusFirstError(form, errors)
      return
    }
    setStatus('idle')
    setFormStep(2)
    trackFormEvent('request_step_2')
  }

  function trackFormEvent(goal: 'request_started' | 'request_step_2') {
    const analytics = window as Window & { ym?: (id: number, action: string, goal: string) => void; gtag?: (action: string, event: string) => void }
    const metrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || 0)
    if (metrikaId) analytics.ym?.(metrikaId, 'reachGoal', goal)
    analytics.gtag?.('event', goal)
  }

  function trackFormStart() {
    if (formStarted.current) return
    formStarted.current = true
    trackFormEvent('request_started')
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const errors = validateFields(form, true)
    setFieldErrors(errors)
    setFormError('')
    if (Object.keys(errors).length) {
      setStatus('error')
      focusFirstError(form, errors)
      return
    }
    setStatus('sending')
    data.set('startedAt', String(startedAt))
    data.set('landingPage', window.location.href)
    data.set('referrer', document.referrer)
    const params = new URLSearchParams(window.location.search)
    data.set('context', params.get('material') || params.get('standard') || params.get('product') || params.get('region') || '')
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) data.set(key, params.get(key) || '')
    try {
      const response = await fetch('/api/request', { method: 'POST', body: data })
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(result?.error || 'Не удалось отправить заявку')
      }
      form.reset()
      setSelectedFiles(0)
      setFormError('')
      setFieldErrors({})
      setFormStep(1)
      setStatus('success')
      const analytics = window as Window & { ym?: (id: number, action: string, goal: string) => void; gtag?: (action: string, event: string, params?: Record<string, unknown>) => void }
      const metrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || 0)
      if (metrikaId) analytics.ym?.(metrikaId, 'reachGoal', 'request_sent')
      analytics.gtag?.('event', 'generate_lead', { product_direction: String(data.get('productDirection') || ''), context: String(data.get('context') || '') })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.')
      setStatus('error')
    }
  }

  return (
    <form className="request-form" onSubmit={submitRequest} onInput={updateFieldErrors} onFocusCapture={trackFormStart} encType="multipart/form-data" noValidate>
      {selectedProduct && <p className="selected-product">Выбран раздел: <strong>{selectedProduct}</strong></p>}
      <div className="form-stage" hidden={formStep !== 1}>
        <p className="form-hint" id={`${formId}-request-hint`}>Обязательно: прикрепите файл или заполните описание.</p>
        <label className={`file-field${fieldErrors.request || fieldErrors.files ? ' has-error' : ''}`}><span className="file-button">Прикрепить файл</span><input name="files" type="file" multiple accept={acceptedFiles} aria-invalid={fieldErrors.request || fieldErrors.files ? true : undefined} aria-describedby={`${formId}-request-hint${fieldErrors.request ? ` ${formId}-request-error` : ''}${fieldErrors.files ? ` ${formId}-files-error` : ''}`} onChange={(event) => setSelectedFiles(event.currentTarget.files?.length || 0)} />{selectedFiles > 0 && <strong>{`Выбрано файлов: ${selectedFiles}`}</strong>}<small>Excel, PDF, Word, фото и чертежи · до 4 МБ суммарно</small></label>
        {fieldErrors.files && <p className="field-error" id={`${formId}-files-error`} role="alert">{fieldErrors.files}</p>}
        <div className="form-or"><span>или</span></div>
        <label>Опишите, что требуется<textarea name="message" rows={3} maxLength={8000} placeholder="Наименование, размер, ГОСТ/ТУ, количество" aria-invalid={fieldErrors.request ? true : undefined} aria-describedby={`${formId}-request-hint${fieldErrors.request ? ` ${formId}-request-error` : ''}`} /></label>
        {fieldErrors.request && <p className="field-error" id={`${formId}-request-error`} role="alert">{fieldErrors.request}</p>}
        <button className="form-next" type="button" onClick={continueRequest}>Продолжить <span>→</span></button>
      </div>
      <div className="form-stage" hidden={formStep !== 2}>
        <div className="form-step"><strong>Контактные данные</strong><span id={`${formId}-contact-hint`}>Обязательно: телефон или email. Достаточно одного контакта.</span></div>
        <p className="form-hint">Имя, компания, город и направление — необязательные поля.</p>
        <div className="form-grid"><label>Ваше имя<input name="name" autoComplete="name" /></label><label>Компания<input name="company" autoComplete="organization" /></label><label>Телефон<input name="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={fieldErrors.contact ? true : undefined} aria-describedby={`${formId}-contact-hint${fieldErrors.contact ? ` ${formId}-contact-error` : ''}`} /></label><label>Email<input name="email" type="email" autoComplete="email" aria-invalid={fieldErrors.contact || fieldErrors.email ? true : undefined} aria-describedby={`${formId}-contact-hint${fieldErrors.contact ? ` ${formId}-contact-error` : ''}${fieldErrors.email ? ` ${formId}-email-error` : ''}`} /></label></div>
        {fieldErrors.contact && <p className="field-error" id={`${formId}-contact-error`} role="alert">{fieldErrors.contact}</p>}
        {fieldErrors.email && <p className="field-error" id={`${formId}-email-error`} role="alert">{fieldErrors.email}</p>}
        <label>Город доставки или самовывоз<input name="delivery" autoComplete="address-level2" placeholder="Например: Алматы или самовывоз" /></label>
        <label>Направление<select name="productDirection" defaultValue=""><option value="">Выберите при необходимости</option><option value="electrowelded-pipes">Трубы электросварные</option><option value="seamless-pipes">Трубы бесшовные</option><option value="pipeline-parts">СДТ</option><option value="insulated">Трубы и СДТ в изоляции</option><option value="other">Другая продукция</option></select></label>
        <label className="honeypot" aria-hidden="true" hidden>Ваш сайт<input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /></label>
        <label className="consent"><input name="consent" type="checkbox" required aria-invalid={fieldErrors.consent ? true : undefined} aria-describedby={fieldErrors.consent ? `${formId}-consent-error` : undefined} /><span>Согласен на <Link href="/politika-konfidencialnosti">обработку персональных данных</Link> для подготовки коммерческого предложения (обязательно)</span></label>
        {fieldErrors.consent && <p className="field-error" id={`${formId}-consent-error`} role="alert">{fieldErrors.consent}</p>}
        <button className="form-back" type="button" onClick={() => { setStatus('idle'); setFormError(''); setFieldErrors({}); setFormStep(1) }}>← Изменить заявку</button>
        <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Отправить на расчёт'} <span>→</span></button>
      </div>
      {status === 'success' && <p className="form-status success">Заявка принята. Мы свяжемся с вами.</p>}
      {status === 'error' && formError && <p className="form-status error" role="alert">{formError}</p>}
    </form>
  )
}
