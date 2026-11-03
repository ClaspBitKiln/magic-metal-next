'use client'
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { catalogRequestHref, enhanceCatalogRequestLinks } from '@/lib/catalogRequestParameters'
import './CatalogStandardRequest.css'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function CatalogStandardRequest({ requestHref }: { requestHref: string }) {
  const form = useRef<HTMLFormElement>(null)
  const ready = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [size, setSize] = useState('')
  const [grade, setGrade] = useState('')
  const [known, setKnown] = useState(false)
  const [standard, setStandard] = useState('')
  useEffect(() => {
    const scope = form.current?.closest<HTMLElement>('.product-size-series')
    if (!scope) return
    return enhanceCatalogRequestLinks(scope, requestHref, window.location.origin, {
      grade, knownStandard: known, standard,
    })
  }, [requestHref, grade, known, standard])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    window.location.assign(catalogRequestHref(requestHref, window.location.origin, {
      size, grade, knownStandard: known, standard,
    }))
  }
  return <form ref={form} className="catalog-standard-request" onSubmit={submit}>
    <noscript>
      <style>{'.catalog-standard-request > :not(noscript){display:none!important}'}</style>
      <p>Подбор параметров требует JavaScript. <a href={requestHref}>Перейти к заявке и приложить спецификацию ↗</a></p>
    </noscript>
    <h3>Параметры для заявки</h3>
    <p>Укажите известные характеристики. Знать ГОСТ необязательно.</p>
    <div className="catalog-standard-request-fields">
      <label>Размер / обозначение <span>(если известен)</span>
        <input value={size} onChange={e => setSize(e.target.value)} placeholder="Например, 40×40×4 мм" />
      </label>
      <label>Марка стали / материала <span>(если известна)</span>
        <input value={grade} onChange={e => setGrade(e.target.value)} placeholder="Например, 09Г2С" />
      </label>
    </div>
    <fieldset>
      <legend>ГОСТ / ТУ (необязательно)</legend>
      <label><input type="radio" name="standard-mode" checked={!known} onChange={() => setKnown(false)} /> Помогите подобрать стандарт</label>
      <label><input type="radio" name="standard-mode" checked={known} onChange={() => setKnown(true)} /> Укажу известный ГОСТ / ТУ</label>
      {known && <label className="catalog-standard-request-known">Номер ГОСТ / ТУ
        <input value={standard} onChange={e => setStandard(e.target.value)} placeholder="Номер, если известен" />
      </label>}
    </fieldset>
    <button type="submit" disabled={!ready}>В заявку →</button>
    <small><a href={requestHref}>Можно сразу приложить Excel, PDF или чертёж в форме заявки ↗</a></small>
  </form>
}

