'use client'

import { useMemo, useState } from 'react'

type Shape = 'Лист' | 'Лента' | 'Плита' | 'Полоса' | 'Труба' | 'Круг / пруток' | 'Квадрат' | 'Шестигранник' | 'Проволока' | 'Чушка / блок' | 'Втулка / заготовка'
const shapes: Record<string, Shape[]> = {
  med: ['Лист','Лента','Труба','Круг / пруток','Проволока'],
  latun: ['Лист','Лента','Труба','Круг / пруток','Проволока'],
  bronza: ['Круг / пруток','Втулка / заготовка','Лента','Лист'],
  alyuminij: ['Лист','Плита','Труба','Круг / пруток','Проволока'],
  titan: ['Лист','Труба','Круг / пруток','Втулка / заготовка'],
  olovo: ['Чушка / блок','Круг / пруток'],
  svinec: ['Чушка / блок','Лист','Втулка / заготовка'],
  cink: ['Чушка / блок','Лист'],
  nihrom: ['Проволока','Лента','Круг / пруток'],
  babbit: ['Чушка / блок','Втулка / заготовка'],
  list: ['Лист','Лента'],
  truby: ['Труба'],
  'sortovoy-prokat': ['Круг / пруток','Квадрат','Шестигранник','Полоса'],
}
const numeric = (value: string) => /^\d+(?:[.,]\d+)?$/.test(value.trim()) && Number(value.replace(',', '.')) > 0
const f = (value: string) => value.trim().replace('.', ',')

export default function NonferrousRequestPicker({ productSlug, requestHref }: { productSlug: string; requestHref: string }) {
  const options = shapes[productSlug] || ['Круг / пруток']
  const [shape, setShape] = useState<Shape | ''>('')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [length, setLength] = useState('')
  const [grade, setGrade] = useState('')
  const [condition, setCondition] = useState('')
  const [surface, setSurface] = useState('')
  const [standard, setStandard] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('кг')
  const flat = shape === 'Лист' || shape === 'Лента' || shape === 'Плита' || shape === 'Полоса'
  const tube = shape === 'Труба'
  const bar = shape === 'Круг / пруток' || shape === 'Квадрат' || shape === 'Шестигранник' || shape === 'Проволока'
  const shaped = shape === 'Втулка / заготовка'
  const block = shape === 'Чушка / блок'
  const valid = Boolean(shape) && (flat ? numeric(a) && numeric(b) : tube ? numeric(a) && numeric(b) : bar ? numeric(a) : shaped ? numeric(a) : true) && (!amount || numeric(amount)) && (!length || numeric(length)) && (!block || !a || numeric(a))
  const name = flat ? `${shape} ${f(a)}×${f(b)}${length ? `×${f(length)}` : ''} мм`
    : tube ? `Труба Ø${f(a)}×${f(b)}${length ? `×${f(length)}` : ''} мм`
    : bar ? `${shape} ${shape === 'Квадрат' ? `${f(a)}×${f(a)}` : shape === 'Шестигранник' ? `под ключ ${f(a)}` : `Ø${f(a)}`} мм`
    : shaped ? `Втулка / заготовка ${a ? `габарит ${f(a)} мм` : 'по чертежу'}` : 'Чушка / блок по спецификации'
  const href = useMemo(() => {
    if (!valid) return null
    const url = new URL(requestHref, 'https://magicmet.ru')
    const base = url.searchParams.get('product') || 'Цветной металлопрокат'
    const items = [base, name, tube ? 'наружный диаметр × стенка' : '', bar && length ? `длина ${f(length)} мм` : '',
      grade.trim() ? `марка сплава ${grade.trim()}` : 'марка сплава уточнить',
      condition.trim() ? `состояние/способ изготовления: ${condition.trim()}` : '',
      surface.trim() ? `поверхность/исполнение: ${surface.trim()}` : '',
      standard.trim() ? `требуемый ГОСТ/ТУ: ${standard.trim()}` : 'стандарт уточнить',
      amount.trim() ? `количество ${f(amount)} ${unit}` : '']
    url.searchParams.set('product', items.filter(Boolean).join('; '))
    url.hash = 'request'
    return url.pathname + url.search + url.hash
  }, [valid, requestHref, name, tube, bar, length, grade, condition, surface, standard, amount, unit])
  return <section className="nonferrous-picker" aria-label="Подбор цветного металла по форме и размерам">
    <h2>Указать форму и размеры для заявки</h2>
    <p>Сначала выберите форму полуфабриката. Размеры, марка сплава, состояние поставки и ГОСТ уточняются именно для выбранной формы — не для всего металла сразу.</p>
    <div className="nonferrous-fields">
      <label>Форма изделия
        <select value={shape} onChange={e => {setShape(e.target.value as Shape);setA('');setB('');setLength('')}}><option value="">Выберите форму</option>{options.map(x=><option key={x} value={x}>{x}</option>)}</select>
      </label>
      {shape !== '' && <>
        {(flat || tube || bar || shaped) && <label>{flat ? 'Толщина, мм' : tube ? 'Наружный диаметр, мм' : shape === 'Шестигранник' ? 'Размер под ключ, мм' : shape === 'Квадрат' ? 'Сторона, мм' : shaped ? 'Основной габарит, мм (если известен)' : 'Диаметр, мм'}<input value={a} onChange={e=>setA(e.target.value)} inputMode="decimal" placeholder="Например, 20" /></label>}
        {(flat || tube) && <label>{flat ? 'Ширина, мм' : 'Толщина стенки, мм'}<input value={b} onChange={e=>setB(e.target.value)} inputMode="decimal" placeholder={tube ? 'Например, 2' : 'Например, 1000'} /></label>}
        {(flat || tube || bar) && <label>Длина, мм (если известна)<input value={length} onChange={e=>setLength(e.target.value)} inputMode="decimal" placeholder="По спецификации" /></label>}
        <label>Марка сплава<input value={grade} onChange={e=>setGrade(e.target.value)} placeholder="Укажите из чертежа / спецификации" /></label>
        <label>Состояние / способ изготовления<input value={condition} onChange={e=>setCondition(e.target.value)} placeholder="Если требуется" /></label>
        <label>Поверхность / покрытие<input value={surface} onChange={e=>setSurface(e.target.value)} placeholder="Если требуется" /></label>
        <label>ГОСТ / ТУ / ASTM<input value={standard} onChange={e=>setStandard(e.target.value)} placeholder="Стандарт именно этого изделия" /></label>
        <label>Количество<input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" placeholder="Можно позже" /></label>
        <label>Единица<select value={unit} onChange={e=>setUnit(e.target.value)}>{['кг','т','шт.','м','м²'].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
      </>}
    </div>
    <p className="nonferrous-note">Это запрос на расчёт, не подтверждение наличия. ГОСТы и марки не подставляются автоматически: применимость конкретного сплава, состояния и размера проверяется по документации.</p>
    <div className="nonferrous-actions">{href ? <a className="nonferrous-submit" href={href}>Передать параметры в заявку ↗</a> : <span>Выберите форму и заполните размеры</span>}<a href="/#request">Есть спецификация? Прикрепить Excel / PDF / чертёж →</a></div>
  </section>
}
