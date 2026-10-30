'use client'

import { useMemo, useState } from 'react'

const numeric = (value: string) => Number(value.trim().replace(',', '.'))
const positive = (value: string) => /^\d+(?:[.,]\d+)?$/.test(value.trim()) && numeric(value) > 0

export default function GalvanizedRequestPicker({ requestHref }: { requestHref: string }) {
  const [form, setForm] = useState('Лист')
  const [thickness, setThickness] = useState('')
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const [grade, setGrade] = useState('')
  const [coating, setCoating] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('листов')
  const [quickSelected, setQuickSelected] = useState('')
  const widthRange = form === 'Лист' ? [700, 1800] : form === 'Рулон' ? [600, 1800] : [30, 600]
  const valid = positive(thickness) && numeric(thickness) >= 0.22 && numeric(thickness) <= 4.5 &&
    positive(width) && numeric(width) >= widthRange[0] && (form === 'Лента' ? numeric(width) < 600 : numeric(width) <= widthRange[1]) &&
    (form !== 'Лист' || !length || positive(length)) && (!quantity || positive(quantity))
  const request = useMemo(() => {
    if (!valid) return ''
    const url = new URL(requestHref, 'https://magicmet.ru')
    const previous = url.searchParams.get('product') || 'Оцинкованный прокат'
    const fields = [previous, form.toLowerCase(), `толщина ${thickness} мм`, `ширина ${width} мм`,
      form === 'Лист' && length ? `длина ${length} мм` : '',
      grade ? `марка основы ${grade}` : '', coating ? `покрытие ${coating}` : '',
      quantity ? `количество ${quantity} ${unit}` : '', 'ГОСТ 14918-2020']
    url.searchParams.set('product', fields.filter(Boolean).join('; '))
    return url.pathname + url.search + url.hash
  }, [requestHref, valid, form, thickness, width, length, grade, coating, quantity, unit])
  return <section className="galv-picker" aria-label="Быстрый подбор оцинкованного проката">
    <h3>Выбрать оцинкованный лист или рулон</h3>
    <p>Укажите основные размеры и покрытие — передадим их менеджеру. Диапазоны из ГОСТ 14918-2020 не означают наличие каждого сочетания.</p>
    <div className="galv-presets">
      <strong>Распространённые размеры листа:</strong>
      {['0,5 × 1250 × 2500', '0,7 × 1250 × 2500', '1,0 × 1250 × 2500', '1,5 × 1250 × 2500', '2,0 × 1250 × 2500'].map(label => <button key={label} type="button" aria-pressed={quickSelected === label} onClick={() => {
        setQuickSelected(label);
        const [t, w, l] = label.split(' × '); setForm('Лист'); setThickness(t); setWidth(w); setLength(l)
      }}>{label} мм</button>)}
    </div>
    <div className="galv-fields">
      <label>Форма поставки<select value={form} onChange={event => { setForm(event.target.value); setWidth(''); setLength(''); setUnit(event.target.value === 'Лист' ? 'листов' : 'т') }}><option>Лист</option><option>Рулон</option><option>Лента</option></select></label>
      <label>Толщина, мм<input inputMode="decimal" value={thickness} onChange={event => setThickness(event.target.value)} placeholder="0,22–4,50"/></label>
      <label>Ширина, мм<input inputMode="numeric" value={width} onChange={event => setWidth(event.target.value)} placeholder={form === 'Лист' ? '700–1800' : form === 'Рулон' ? '600–1800' : '30–менее 600'}/></label>
      {form === 'Лист' && <label>Длина, мм (по запросу)<input inputMode="numeric" value={length} onChange={event => setLength(event.target.value)} placeholder="Например, 2500"/></label>}
      <label>Марка основы (если известна)<input value={grade} onChange={event => setGrade(event.target.value)} placeholder="Например, 08пс"/></label>
      <label>Тип / класс покрытия<input value={coating} onChange={event => setCoating(event.target.value)} placeholder="Например, Z275 по документу"/></label>
      <label>Количество (необязательно)<input inputMode="decimal" value={quantity} onChange={event => setQuantity(event.target.value)}/></label>
      <label>Единица<select value={unit} onChange={event => setUnit(event.target.value)}><option value="листов">Листов</option><option value="т">Тонн</option><option value="м²">м²</option></select></label>
    </div>
    <p className="galv-note">Толщина включает покрытие. Типовые обозначения сверены с открытыми каталогами поставщиков; эти форматы служат для составления запроса, а не подтверждения склада. Точное исполнение проверим до КП.</p>
    {/* The homepage is an HTML Route Handler; document navigation initializes the request form. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <div className="galv-actions">{request ? <a className="galv-submit" href={request}>Отправить параметры в заявку ↗</a> : <span>Выберите форму, толщину и ширину</span>}<a href="/#request">Есть Excel или чертёж? Прикрепить файл →</a></div>
  </section>
}
