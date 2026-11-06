'use client'

import { useId, useMemo, useState } from 'react'

export default function GalvanizedRequestPicker({ requestHref }: { requestHref: string }) {
  const thicknessList = useId()
  const [cut, setCut] = useState('')
  const [form, setForm] = useState('Лист')
  const [thickness, setThickness] = useState('')
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const [grade, setGrade] = useState('')
  const [coating, setCoating] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('листов')
  const request = useMemo(() => {
    const url = new URL(requestHref, 'https://magicmet.ru')
    const previous = url.searchParams.get('product') || 'Оцинкованный прокат'
    const fields = [previous, form.toLowerCase(), thickness.trim() ? `толщина ${thickness.trim()} мм` : '', width.trim() ? `ширина ${width.trim()} мм` : '',
      form === 'Лист' && length.trim() ? `длина ${length.trim()} мм` : '',
      grade ? `марка основы ${grade}` : '', coating ? `покрытие ${coating}` : '',
      quantity ? `количество ${quantity} ${unit}` : '', 'применимость ГОСТ 14918-2020 и возможность поставки уточнить']
    url.searchParams.set('product', fields.filter(Boolean).join('; '))
    url.hash = 'request'
    return url.pathname + url.search + url.hash
  }, [requestHref, form, thickness, width, length, grade, coating, quantity, unit])
  return <section className="galv-picker" aria-label="Быстрый подбор оцинкованного проката">
    <h3>Параметры поставки</h3>
    <p>Укажите толщину, затем раскрой. Остальные параметры можно уточнить позже.</p>
    <div className="galv-fields">
      <label>Толщина, мм<input inputMode="decimal" list={thicknessList} value={thickness} onChange={event => setThickness(event.target.value)} placeholder="Укажите толщину"/></label>
      <datalist id={thicknessList}>{['0,5', '0,7', '1', '1,5', '2'].map(value => <option key={value} value={value} />)}</datalist>
      {form === 'Лист' && <label>Раскрой, мм<select value={cut} onChange={event => {
        const value = event.target.value
        setCut(value)
        setWidth(value === '1250x2500' ? '1250' : '')
        setLength(value === '1250x2500' ? '2500' : '')
      }}><option value="">Укажу позже</option><option value="1250x2500">1250 × 2500</option><option value="custom">Другой раскрой</option></select></label>}
      {(form !== 'Лист' || cut === 'custom') && <label>Ширина, мм<input inputMode="decimal" value={width} onChange={event => setWidth(event.target.value)} placeholder="Укажите ширину"/></label>}
      {form === 'Лист' && cut === 'custom' && <label>Длина, мм<input inputMode="decimal" value={length} onChange={event => setLength(event.target.value)} placeholder="Укажите длину"/></label>}
      <label>Форма поставки<select value={form} onChange={event => { setForm(event.target.value); setCut(''); setWidth(''); setLength(''); setUnit(event.target.value === 'Лист' ? 'листов' : 'т') }}><option>Лист</option><option>Рулон</option><option>Лента</option></select></label>
    </div>
    <details className="galv-additional"><summary>Марка, покрытие и количество — если известны</summary>
    <div className="galv-fields">
      <label>Марка основы (если известна)<input value={grade} onChange={event => setGrade(event.target.value)} placeholder="Например, 08пс"/></label>
      <label>Тип / класс покрытия<input value={coating} onChange={event => setCoating(event.target.value)} placeholder="Например, Z275 по документу"/></label>
      <label>Количество (необязательно)<input inputMode="decimal" value={quantity} onChange={event => setQuantity(event.target.value)}/></label>
      <label>Единица<select value={unit} onChange={event => setUnit(event.target.value)}><option value="листов">Листов</option><option value="т">Тонн</option><option value="м²">м²</option></select></label>
    </div>
    </details>
    <details className="galv-reference"><summary>О размерах и покрытии</summary><p className="galv-note">Толщина включает покрытие. Пример раскроя служит для составления запроса и не подтверждает наличие или применимость для любой толщины и марки. Можно указать нестандартные или неполные параметры; точное исполнение и возможность поставки уточнит менеджер.</p></details>
    {/* The homepage is an HTML Route Handler; document navigation initializes the request form. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <div className="galv-actions"><a className="galv-submit" href={request}>Отправить параметры в заявку ↗</a><a href={request || requestHref}>Есть Excel или чертёж? Прикрепить файл →</a></div>
  </section>
}
