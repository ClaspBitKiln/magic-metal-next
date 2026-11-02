'use client'
import { useState, type FormEvent } from 'react'
import './CatalogStandardRequest.css'

export default function CatalogStandardRequest({ requestHref }: { requestHref: string }) {
  const [size, setSize] = useState('')
  const [grade, setGrade] = useState('')
  const [known, setKnown] = useState(false)
  const [standard, setStandard] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const url = new URL(requestHref, window.location.origin)
    const detail = [
      url.searchParams.get('product') || '',
      size.trim() ? `Размер / обозначение: ${size.trim()}` : '',
      grade.trim() ? `Марка стали / материала: ${grade.trim()}` : '',
      known && standard.trim() ? `ГОСТ / ТУ: ${standard.trim()}` : 'ГОСТ / ТУ: помогите подобрать стандарт'
    ].filter(Boolean).join('; ')
    url.searchParams.set('product', detail)
    url.hash = 'request'
    window.location.assign(url.toString())
  }
  return <form className="catalog-standard-request" onSubmit={submit}>
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
    <button type="submit">В заявку →</button>
    <small>Можно сразу приложить Excel, PDF или чертёж в форме заявки.</small>
  </form>
}
