'use client'

import { useMemo, useState } from 'react'

type Product = 'mesh' | 'rope'
const isPositive = (value: string) => /^\d+(?:[.,]\d+)?$/.test(value.trim()) && Number(value.replace(',', '.')) > 0
const formatNumber = (value: string) => value.trim().replace('.', ',')

export default function MeshRopeRequestPicker({ type, requestHref }: { type: Product; requestHref: string }) {
  const mesh = type === 'mesh'
  const [kind, setKind] = useState('')
  const [cellX, setCellX] = useState('')
  const [cellY, setCellY] = useState('')
  const [diameter, setDiameter] = useState('')
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const [core, setCore] = useState('')
  const [lay, setLay] = useState('')
  const [material, setMaterial] = useState('')
  const [coating, setCoating] = useState('')
  const [standard, setStandard] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState(mesh ? 'м²' : 'м')

  const valid = isPositive(diameter) && (mesh ? Boolean(kind) && isPositive(cellX) && isPositive(cellY) && (!width || isPositive(width)) && (!length || isPositive(length)) : isPositive(length)) && (!qty || isPositive(qty))
  const href = useMemo(() => {
    if (!valid) return null
    const url = new URL(requestHref, 'https://magicmet.ru')
    const base = url.searchParams.get('product') || (mesh ? 'Сетка металлическая' : 'Канат стальной')
    const parts = mesh ? [
      base, kind, `ячейка ${formatNumber(cellX)}×${formatNumber(cellY)} мм`,
      `проволока Ø${formatNumber(diameter)} мм`,
      width ? `ширина ${formatNumber(width)} мм` : '',
      length ? `длина ${formatNumber(length)} мм` : '',
    ] : [
      base, `канат Ø${formatNumber(diameter)} мм`,
      kind ? `конструкция ${kind}` : '',
      core ? `сердечник ${core}` : '',
      lay ? `свивка ${lay}` : '',
      `длина ${formatNumber(length)} м`,
    ]
    parts.push(material ? `материал ${material}` : '', coating ? `покрытие ${coating}` : '', standard ? `требуемый стандарт ${standard}` : 'стандарт уточнить', qty ? `количество ${formatNumber(qty)} ${unit}` : '')
    url.searchParams.set('product', parts.filter(Boolean).join('; '))
    url.hash = 'request'
    return url.pathname + url.search + url.hash
  }, [valid, mesh, requestHref, kind, cellX, cellY, diameter, width, length, core, lay, material, coating, standard, qty, unit])

  return <section className="mesh-rope-picker" aria-label={mesh ? 'Параметры сетки для заявки' : 'Параметры каната для заявки'}>
    <h2>{mesh ? 'Выбрать сетку по параметрам' : 'Выбрать канат по параметрам'}</h2>
    <p>{mesh ? 'Сначала вид сетки и ячейка, затем диаметр проволоки и формат карты или рулона.' : 'Сначала диаметр и длина каната, затем конструкция, сердечник и исполнение.'} Параметры отправим менеджеру; наличие и применимость стандарта проверим перед КП.</p>
    <div className="mesh-rope-fields">
      <label>{mesh ? 'Вид сетки' : 'Конструкция каната'}
        {mesh ? <select value={kind} onChange={e => setKind(e.target.value)}><option value="">Выберите вид</option><option value="Сварная">Сварная</option><option value="Тканая">Тканая</option><option value="Плетёная">Плетёная</option></select>
        : <input value={kind} onChange={e => setKind(e.target.value)} placeholder="Например, 6×19 (по паспорту)" />}</label>
      {mesh && <><label>Ячейка A, мм<input value={cellX} onChange={e => setCellX(e.target.value)} inputMode="decimal" placeholder="Например, 50" /></label><label>Ячейка B, мм<input value={cellY} onChange={e => setCellY(e.target.value)} inputMode="decimal" placeholder="Например, 50" /></label></>}
      <label>{mesh ? 'Диаметр проволоки, мм' : 'Диаметр каната, мм'}<input value={diameter} onChange={e => setDiameter(e.target.value)} inputMode="decimal" placeholder={mesh ? 'Например, 3' : 'Например, 8'} /></label>
      {mesh && <label>Ширина карты / рулона, мм<input value={width} onChange={e => setWidth(e.target.value)} inputMode="decimal" placeholder="Если известна" /></label>}
      <label>{mesh ? 'Длина карты / рулона, мм' : 'Длина каната, м'}<input value={length} onChange={e => setLength(e.target.value)} inputMode="decimal" placeholder={mesh ? 'Если известна' : 'Например, 100'} /></label>
      {!mesh && <><label>Сердечник<input value={core} onChange={e => setCore(e.target.value)} placeholder="Органический / металлический" /></label><label>Направление и вид свивки<input value={lay} onChange={e => setLay(e.target.value)} placeholder="По требованию проекта" /></label></>}
      <label>{mesh ? 'Материал проволоки' : 'Марка / группа проволоки'}<input value={material} onChange={e => setMaterial(e.target.value)} placeholder="По спецификации" /></label>
      <label>Покрытие / исполнение<input value={coating} onChange={e => setCoating(e.target.value)} placeholder={mesh ? 'Например, оцинкованная' : 'Например, оцинкованный'} /></label>
      <label>ГОСТ / ТУ<input value={standard} onChange={e => setStandard(e.target.value)} placeholder="Если известен" /></label>
      <label>Количество (необязательно)<input value={qty} onChange={e => setQty(e.target.value)} inputMode="decimal" placeholder="По заявке" /></label>
      <label>Единица количества<select value={unit} onChange={e => setUnit(e.target.value)}>{(mesh ? ['м²', 'шт.', 'рулонов'] : ['м', 'шт.', 'бухт']).map(option => <option key={option} value={option}>{option}</option>)}</select></label>
    </div>
    <p className="mesh-rope-note">{mesh ? 'Для сварных, тканых и плетёных сеток могут действовать разные стандарты. Совпадение ячейки и диаметра не подтверждает одинаковое исполнение.' : 'Нельзя выбирать канат только по диаметру: конструкция, свивка, сердечник, разрывное усилие и назначение влияют на применимость.'} Ни один введённый размер не означает подтверждённый складской остаток.</p>
    <div className="mesh-rope-actions">{href ? <a className="mesh-rope-submit" href={href}>Отправить параметры в заявку ↗</a> : <span>{mesh ? 'Выберите вид и укажите ячейку и диаметр' : 'Укажите диаметр и длину'}</span>}<a href="/#request">Есть спецификация? Прикрепить Excel/PDF →</a></div>
  </section>
}
