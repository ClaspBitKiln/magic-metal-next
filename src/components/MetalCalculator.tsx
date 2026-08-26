'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type Shape = 'pipe' | 'sheet' | 'round' | 'square'

const densities = [
  ['carbon', 'Углеродистая / низколегированная сталь', 7850],
  ['stainless', 'Нержавеющая сталь', 7900],
  ['aluminum', 'Алюминий и сплавы', 2700],
  ['copper', 'Медь', 8960],
  ['brass', 'Латунь', 8500],
  ['bronze', 'Бронза', 8800],
  ['titanium', 'Титан', 4500],
] as const

const number = (value: string) => Math.max(0, Number(value.replace(',', '.')) || 0)

export default function MetalCalculator() {
  const [shape, setShape] = useState<Shape>('pipe')
  const [density, setDensity] = useState(7850)
  const [diameter, setDiameter] = useState('219')
  const [wall, setWall] = useState('8')
  const [thickness, setThickness] = useState('10')
  const [width, setWidth] = useState('1500')
  const [pieceLength, setPieceLength] = useState('6000')
  const [side, setSide] = useState('100')
  const [length, setLength] = useState('12')
  const [quantity, setQuantity] = useState('1')

  const result = useMemo(() => {
    const rho = density
    const qty = number(quantity)
    if (shape === 'sheet') {
      const piece = number(thickness) * number(width) * number(pieceLength) * rho * 1e-9
      return { unit: piece, total: piece * qty, unitLabel: 'кг/лист' }
    }
    let kgPerMeter = 0
    if (shape === 'pipe') {
      const d = number(diameter); const t = Math.min(number(wall), d / 2)
      kgPerMeter = Math.PI / 4 * (d * d - (d - 2 * t) ** 2) * rho * 1e-6
    } else if (shape === 'round') {
      const d = number(diameter); kgPerMeter = Math.PI / 4 * d * d * rho * 1e-6
    } else {
      kgPerMeter = number(side) ** 2 * rho * 1e-6
    }
    return { unit: kgPerMeter, total: kgPerMeter * number(length) * qty, unitLabel: 'кг/м' }
  }, [density, diameter, length, pieceLength, quantity, shape, side, thickness, wall, width])

  const format = (value: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value)
  const requestContext = `${shape === 'pipe' ? `Труба ${diameter}×${wall} мм` : shape === 'sheet' ? `Лист ${thickness}×${width}×${pieceLength} мм` : shape === 'round' ? `Круг Ø${diameter} мм` : `Квадрат ${side} мм`}; расчётная масса ${format(result.total)} кг`

  return <section className="calculator-workspace">
    <div className="calculator-controls">
      <div className="calculator-tabs">{([['pipe', 'Труба'], ['sheet', 'Лист'], ['round', 'Круг'], ['square', 'Квадрат']] as [Shape, string][]).map(([key, label]) => <button type="button" className={shape === key ? 'active' : ''} onClick={() => setShape(key)} key={key}>{label}</button>)}</div>
      <label>Материал<select value={density} onChange={(event) => setDensity(Number(event.target.value))}>{densities.map(([key, label, value]) => <option value={value} key={key}>{label} — {value} кг/м³</option>)}</select></label>
      <div className="calculator-fields">
        {shape === 'pipe' && <><label>Наружный диаметр, мм<input inputMode="decimal" value={diameter} onChange={(event) => setDiameter(event.target.value)} /></label><label>Стенка, мм<input inputMode="decimal" value={wall} onChange={(event) => setWall(event.target.value)} /></label></>}
        {shape === 'sheet' && <><label>Толщина, мм<input inputMode="decimal" value={thickness} onChange={(event) => setThickness(event.target.value)} /></label><label>Ширина, мм<input inputMode="decimal" value={width} onChange={(event) => setWidth(event.target.value)} /></label><label>Длина листа, мм<input inputMode="decimal" value={pieceLength} onChange={(event) => setPieceLength(event.target.value)} /></label></>}
        {shape === 'round' && <label>Диаметр, мм<input inputMode="decimal" value={diameter} onChange={(event) => setDiameter(event.target.value)} /></label>}
        {shape === 'square' && <label>Сторона, мм<input inputMode="decimal" value={side} onChange={(event) => setSide(event.target.value)} /></label>}
        {shape !== 'sheet' && <label>Общая длина, м<input inputMode="decimal" value={length} onChange={(event) => setLength(event.target.value)} /></label>}
        <label>Количество, шт.<input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      </div>
    </div>
    <aside className="calculator-result"><p>Теоретическая масса</p><strong>{format(result.total)} <small>кг</small></strong><span>{format(result.unit)} {result.unitLabel}</span><em>Расчёт справочный. Фактическая масса зависит от допусков, марки, состояния и стандарта на продукцию.</em><Link href={`/?product=${encodeURIComponent(requestContext)}#request`}>Отправить заявку ↗</Link></aside>
  </section>
}
