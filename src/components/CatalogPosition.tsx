'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { materialSpecs } from '@/data/materialSpecs'
import { materials } from '@/data/materials'
import AddToQuoteButton from '@/components/AddToQuoteButton'
import { formatProductTitle } from '@/lib/catalogSearch'

type PriceRow = {
  id: string
  category: string
  product: string
  designation: string
  size: string
  standard: string
  diameter?: string
  wall?: string
  checkedAt: string
}

const n = (value = '') => Number(value.replace(',', '.'))
const fmt = (value: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value)

function densityFor(row: PriceRow) {
  const text = `${row.category} ${row.product} ${row.designation}`.toLocaleLowerCase('ru')
  if (/нержав|aisi|12х18|08х18|10х17/.test(text)) return { value: 7900, label: 'нержавеющая сталь' }
  if (/алюмин|дюрал|ад\d|амг|д16/.test(text)) return { value: 2700, label: 'алюминий и сплавы' }
  if (/мед|\bм[0-3]\b/.test(text)) return { value: 8960, label: 'медь' }
  if (/латун|\bл\d/.test(text)) return { value: 8500, label: 'латунь' }
  if (/бронз|\bбр/.test(text)) return { value: 8800, label: 'бронза' }
  if (/титан|\bвт\d/.test(text)) return { value: 4500, label: 'титан' }
  return { value: 7850, label: 'углеродистая или низколегированная сталь' }
}

function unitMass(row: PriceRow) {
  const density = densityFor(row)
  const diameter = n(row.diameter)
  const wall = n(row.wall)
  if (diameter > 0 && wall > 0 && wall < diameter / 2) {
    const value = Math.PI / 4 * (diameter ** 2 - (diameter - 2 * wall) ** 2) * density.value * 1e-6
    return { value, unit: 'кг/м', basis: `наружный диаметр ${row.diameter} мм, стенка ${row.wall} мм`, density }
  }
  const size = n(row.size)
  if (size > 0 && /^\d+(?:[.,]\d+)?$/.test(row.size) && /круг/.test(row.product.toLocaleLowerCase('ru'))) {
    return { value: Math.PI / 4 * size ** 2 * density.value * 1e-6, unit: 'кг/м', basis: `диаметр ${row.size} мм`, density }
  }
  if (size > 0 && /^\d+(?:[.,]\d+)?$/.test(row.size) && /квадрат/.test(row.product.toLocaleLowerCase('ru'))) {
    return { value: size ** 2 * density.value * 1e-6, unit: 'кг/м', basis: `сторона ${row.size} мм`, density }
  }
  if (size > 0 && /^\d+(?:[.,]\d+)?$/.test(row.size) && /лист/.test(row.product.toLocaleLowerCase('ru'))) {
    return { value: size * density.value * 1e-3, unit: 'кг/м²', basis: `толщина ${row.size} мм`, density }
  }
  return null
}

function materialFor(row: PriceRow) {
  const text = row.designation.toLocaleUpperCase('ru').replace(/Ё/g, 'Е')
  return [...materials].sort((a, b) => b.designation.length - a.designation.length).find((material) => {
    const designation = material.designation.toLocaleUpperCase('ru').replace(/Ё/g, 'Е')
    const variants = [designation, designation.replace(/^СТАЛЬ\s*/i, 'СТ'), designation.replace(/\s+/g, '')]
    return [...new Set(variants)].some((value) => text.includes(value))
  })
}

export default function CatalogPosition() {
  const [row, setRow] = useState<PriceRow | null | undefined>(undefined)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    fetch('/data/mc-price-snapshot.json').then((response) => {
      if (!response.ok) throw new Error('catalog load failed')
      return response.json()
    }).then((data) => setRow(data.rows.find((item: PriceRow) => item.id === id) || null)).catch(() => setLoadError(true))
  }, [])

  const mass = useMemo(() => row ? unitMass(row) : null, [row])
  const material = useMemo(() => row ? materialFor(row) : undefined, [row])
  const spec = material ? materialSpecs[material.slug] : undefined

  if (loadError) return <div className="position-state"><h1>Не удалось загрузить карточку</h1><button onClick={() => window.location.reload()}>Повторить</button></div>
  if (row === undefined) return <div className="position-state">Загружаем карточку позиции…</div>
  if (row === null) return <div className="position-state"><h1>Позиция не найдена</h1><Link href="/spravochnik-nalichiya">Вернуться в справочник</Link></div>

  const request = `${row.product}; ${row.size}; ${row.designation}; ${row.standard}`
  return <>
    <section className="position-hero">
      <p>{row.category} · подтверждено {row.checkedAt}</p>
      <h1>{formatProductTitle(row.product)}</h1>
      <div><span className="stock-green"><i />На складе</span><AddToQuoteButton item={{ id: row.id, product: row.product, size: row.size, designation: row.designation, standard: row.standard }} /></div>
    </section>
    <section className="position-spec-grid">
      <div><span>Размер / обозначение</span><b>{row.size}</b></div>
      {row.diameter && <div><span>Диаметр / профиль</span><b>{row.diameter} мм</b></div>}
      {row.wall && <div><span>Толщина стенки</span><b>{row.wall} мм</b></div>}
      <div><span>Марка / исполнение</span><b>{row.designation || 'Уточняется по заявке'}</b></div>
      <div><span>Нормативный документ</span><b>{row.standard || 'Уточняется по позиции прайса'}</b></div>
    </section>
    <section className="position-mass">
      <div><p>Теоретическая масса</p><h2>{mass ? `${fmt(mass.value)} ${mass.unit}` : 'По таблице сортамента'}</h2></div>
      {mass ? <p>Расчёт по геометрии: {mass.basis}; принята плотность {mass.density.value} кг/м³ ({mass.density.label}).</p> : <p>Для этой формы проката масса единицы определяется по таблице соответствующего ГОСТ или после уточнения полной геометрии.</p>}
      <small>Расчёт справочный. Фактическая масса зависит от допусков, марки, состояния поставки и стандарта продукции.</small>
    </section>
    {spec && material ? <section className="position-properties">
      <header><div><p>Подтверждённая марка</p><h2>{material.designation}: химический состав и свойства</h2></div><Link href={`/spravochnik-materialov/${material.slug}`}>Полная карточка марки →</Link></header>
      <h3>Механические свойства</h3><div className="position-property-grid">{spec.mechanics.map((item) => <div key={item.label}><span>{item.label}</span><b>{item.value}</b></div>)}</div>
      <h3>Химический состав</h3><div className="position-chemistry">{spec.chemistry.map((item) => <span key={item.label}><b>{item.label}</b>{item.value}</span>)}</div>
      <aside>{spec.condition}. {spec.note} Стандарт и сертификат конкретной партии имеют приоритет.</aside>
    </section> : <section className="position-properties position-properties-empty"><h2>Свойства материала</h2><p>Для вывода химического состава и механических свойств нужна однозначно указанная марка. Мы не подставляем характеристики по догадке.</p></section>}
    <section className="position-buy"><div><p>Покупка</p><h2>Проверим остаток и подготовим предложение</h2><span>Уточним количество, длину, требования проекта, срок и адрес поставки.</span></div><Link href={`/?product=${encodeURIComponent(request)}#request`}>Отправить заявку ↗</Link></section>
  </>
}
