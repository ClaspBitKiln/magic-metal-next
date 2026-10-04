'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { hasRequestConsent, REQUEST_CONSENT_ERROR } from '@/lib/requestValidation'

export default function RequestForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState('')
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

  function continueRequest(event: FormEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form
    if (!form) return
    const data = new FormData(form)
    const message = String(data.get('message') || '').trim()
    const hasFiles = data.getAll('files').some((value) => value instanceof File && value.size > 0)
    if (!message && !hasFiles) {
      setFormStep(1)
      setStatus('error')
      setFormError('Прикрепите заявку или кратко опишите, что требуется.')
      return
    }
    setFormError('')
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
    const phone = String(data.get('phone') || '').trim()
    const email = String(data.get('email') || '').trim()
    const message = String(data.get('message') || '').trim()
    const hasFiles = data.getAll('files').some((value) => value instanceof File && value.size > 0)
    setFormError('')
    if (!hasRequestConsent(data.get('consent'))) {
      setStatus('error')
      setFormError(REQUEST_CONSENT_ERROR)
      return
    }
    if (!phone && !email) {
      setStatus('error')
      setFormError('Укажите телефон или email, чтобы мы могли отправить расчёт.')
      return
    }
    if (!message && !hasFiles) {
      setStatus('error')
      setFormError('Прикрепите заявку или кратко опишите, что требуется.')
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
    <form className="request-form" onSubmit={submitRequest} onFocusCapture={trackFormStart} encType="multipart/form-data" noValidate>
      {selectedProduct && <p className="selected-product">Выбран раздел: <strong>{selectedProduct}</strong></p>}
      <div className="form-stage" hidden={formStep !== 1}>
        <label className="file-field"><span className="file-button">Прикрепить файл</span><input name="files" type="file" multiple accept=".xlsx,.xls,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.dwg,.dxf,.mp3,.m4a,.wav,.ogg,.webm,audio/*" onChange={(event) => setSelectedFiles(event.currentTarget.files?.length || 0)} />{selectedFiles > 0 && <strong>{`Выбрано файлов: ${selectedFiles}`}</strong>}<small>Excel, PDF, Word, фото, чертежи или аудио · до 25 МБ</small></label>
        <div className="form-or"><span>или</span></div>
        <label>Опишите, что требуется<textarea name="message" rows={3} placeholder="Наименование, размер, ГОСТ/ТУ, количество" /></label>
        <button className="form-next" type="button" onClick={continueRequest}>Продолжить <span>→</span></button>
      </div>
      <div className="form-stage" hidden={formStep !== 2}>
        <div className="form-step"><strong>Контактные данные</strong><span>Укажите телефон или email.</span></div>
        <div className="form-grid"><label>Ваше имя<input name="name" autoComplete="name" /></label><label>Компания<input name="company" autoComplete="organization" /></label><label>Телефон<input name="phone" type="tel" inputMode="tel" autoComplete="tel" /></label><label>Email<input name="email" type="email" autoComplete="email" /></label></div>
        <label>Город доставки или самовывоз<input name="delivery" autoComplete="address-level2" placeholder="Например: Алматы или самовывоз" /></label>
        <label>Направление<select name="productDirection" defaultValue=""><option value="">Выберите при необходимости</option><option value="electrowelded-pipes">Трубы электросварные</option><option value="seamless-pipes">Трубы бесшовные</option><option value="pipeline-parts">СДТ</option><option value="insulated">Трубы и СДТ в изоляции</option><option value="other">Другая продукция</option></select></label>
        <label className="honeypot" aria-hidden="true" hidden>Ваш сайт<input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /></label>
        <label className="consent"><input name="consent" type="checkbox" required /><span>Согласен на <Link href="/politika-konfidencialnosti">обработку персональных данных</Link> для подготовки коммерческого предложения</span></label>
        <button className="form-back" type="button" onClick={() => { setStatus('idle'); setFormError(''); setFormStep(1) }}>← Изменить заявку</button>
        <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Отправить на расчёт'} <span>→</span></button>
      </div>
      {status === 'success' && <p className="form-status success">Заявка принята. Мы свяжемся с вами.</p>}
      {status === 'error' && <p className="form-status error" role="alert">{formError || 'Не удалось отправить. Позвоните нам или напишите на m1@magicmet.ru.'}</p>}
    </form>
  )
}
