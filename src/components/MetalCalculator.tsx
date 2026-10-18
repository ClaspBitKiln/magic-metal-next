'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { calculateMetalMass, formatMetalMass, type MetalShape } from '@/lib/metalCalculation'

const densities = [
  ['carbon', 'Углеродистая / низколегированная сталь', 7850],
  ['stainless', 'Нержавеющая сталь', 7900],
  ['aluminum', 'Алюминий и сплавы', 2700],
  ['copper', 'Медь', 8960],
  ['brass', 'Латунь', 8500],
  ['bronze', 'Бронза', 8800],
  ['titanium', 'Титан', 4500],
] as const

export default function MetalCalculator() {
  const [shape, setShape] = useState<MetalShape>('pipe')
  const [density, setDensity] = useState(7850)
  const [diameter, setDiameter] = useState('219')
  const [wall, setWall] = useState('8')
  const [thickness, setThickness] = useState('10')
  const [width, setWidth] = useState('1500')
  const [pieceLength, setPieceLength] = useState('6000')
  const [side, setSide] = useState('100')
  const [length, setLength] = useState('12')
  const [quantity, setQuantity] = useState('1')

  const result = useMemo(() => calculateMetalMass({ shape, density, diameter, wall, thickness, width, pieceLength, side, length, quantity }), [density, diameter, length, pieceLength, quantity, shape, side, thickness, wall, width])
  const material = densities.find(([, , value]) => value === density)?.[1] || ''
  const requestContext = 'error' in result ? '' : [
    shape === 'pipe' ? `Труба ${diameter}×${wall} мм` : shape === 'sheet' ? `Лист ${thickness}×${width}×${pieceLength} мм` : shape === 'round' ? `Круг Ø${diameter} мм` : `Квадрат ${side} мм`,
    `материал: ${material}`, `плотность: ${density} кг/м³`,
    ...(shape === 'sheet' ? [] : [`длина одной штуки: ${length} м`]),
    `количество: ${quantity} шт.`, `масса ${shape === 'sheet' ? 'листа' : 'погонного метра'}: ${formatMetalMass(result.unit)} ${result.unitLabel}`,
    `расчётная общая масса: ${formatMetalMass(result.total)} кг`,
  ].join('; ')

  return <section className="calculator-workspace">
    <div className="calculator-controls">
      <div className="calculator-tabs">{([['pipe', 'Труба'], ['sheet', 'Лист'], ['round', 'Круг'], ['square', 'Квадрат']] as [MetalShape, string][]).map(([key, label]) => <button type="button" className={shape === key ? 'active' : ''} aria-pressed={shape === key} onClick={() => setShape(key)} key={key}>{label}</button>)}</div>
      <label>Материал<select value={density} onChange={(event) => setDensity(Number(event.target.value))}>{densities.map(([key, label, value]) => <option value={value} key={key}>{label} — {value} кг/м³</option>)}</select></label>
      <div className="calculator-fields">
        {shape === 'pipe' && <><label>Наружный диаметр, мм<input inputMode="decimal" value={diameter} onChange={(event) => setDiameter(event.target.value)} /></label><label>Стенка, мм<input inputMode="decimal" value={wall} onChange={(event) => setWall(event.target.value)} /></label></>}
        {shape === 'sheet' && <><label>Толщина, мм<input inputMode="decimal" value={thickness} onChange={(event) => setThickness(event.target.value)} /></label><label>Ширина, мм<input inputMode="decimal" value={width} onChange={(event) => setWidth(event.target.value)} /></label><label>Длина листа, мм<input inputMode="decimal" value={pieceLength} onChange={(event) => setPieceLength(event.target.value)} /></label></>}
        {shape === 'round' && <label>Диаметр, мм<input inputMode="decimal" value={diameter} onChange={(event) => setDiameter(event.target.value)} /></label>}
        {shape === 'square' && <label>Сторона, мм<input inputMode="decimal" value={side} onChange={(event) => setSide(event.target.value)} /></label>}
        {shape !== 'sheet' && <label>Длина одной штуки, м<input inputMode="decimal" value={length} onChange={(event) => setLength(event.target.value)} /></label>}
        <label>{shape === 'sheet' ? 'Количество листов, шт.' : 'Количество одинаковых штук, шт.'}<input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      </div>
    </div>
    <aside className="calculator-result" aria-live="polite"><p>Теоретическая масса</p>{'error' in result ? <p className="calculator-error" role="alert">{result.error}</p> : <><strong>{formatMetalMass(result.total)} <small>кг</small></strong><span>{formatMetalMass(result.unit)} {result.unitLabel}</span></>}<em>Расчёт справочный. Фактическая масса зависит от допусков, марки, состояния и стандарта на продукцию.</em>{!('error' in result) && <Link href={`/?product=${encodeURIComponent(requestContext)}#request`}>Отправить заявку ↗</Link>}</aside>
  </section>
}
