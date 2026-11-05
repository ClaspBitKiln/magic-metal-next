'use client'

import { Fragment, useId, useMemo, useState } from 'react'
import { alloyGradeExamples } from '@/data/alloyGradeExamples'
import { getMaterialPageSlug } from '@/data/materialPageLinks'
import './CardPickerReadability.css'
import { getProductShapeKinds } from '@/data/nonferrousShapes'
import { useCatalogKind } from './useCatalogKind'
import CatalogKindFallback from './CatalogKindFallback'

const f = (value: string) => value.trim().replace('.', ',')

export default function NonferrousRequestPicker({ productSlug, requestHref }: { productSlug: string; requestHref: string }) {
  const shapeKinds = getProductShapeKinds(productSlug)
  const options = shapeKinds.map(option => option.value)
  const gradeExamples = alloyGradeExamples[productSlug]
  const shapeName = useId()
  const [otherGrade, setOtherGrade] = useState('')
  const [shape, setShapeId] = useCatalogKind(shapeKinds, '')
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
  const completeName = flat ? `${shape} ${f(a)}×${f(b)}${length ? `×${f(length)}` : ''} мм`
    : tube ? `Труба Ø${f(a)}×${f(b)}${length ? `×${f(length)}` : ''} мм`
    : bar ? `${shape} ${shape === 'Квадрат' ? `${f(a)}×${f(a)}` : shape === 'Шестигранник' ? `под ключ ${f(a)}` : `Ø${f(a)}`} мм`
    : shaped ? `Втулка / заготовка ${a ? `габарит ${f(a)} мм` : 'по чертежу'}` : shape === 'Чушка / блок' ? 'Чушка / блок по спецификации' : ''
  const name = flat && !(a.trim() && b.trim())
    ? [shape, a.trim() ? `толщина ${f(a)} мм` : '', b.trim() ? `ширина ${f(b)} мм` : '', length.trim() ? `длина ${f(length)} мм` : '', 'остальные размеры уточнить'].filter(Boolean).join('; ')
    : tube && !(a.trim() && b.trim())
      ? [shape, a.trim() ? `наружный диаметр ${f(a)} мм` : '', b.trim() ? `толщина стенки ${f(b)} мм` : '', length.trim() ? `длина ${f(length)} мм` : '', 'остальные размеры уточнить'].filter(Boolean).join('; ')
      : bar && !a.trim() ? `${shape}; размер уточнить` : completeName
  const href = useMemo(() => {
    if (!shape) return requestHref
    const url = new URL(requestHref, 'https://magicmet.ru')
    const base = url.searchParams.get('product') || 'Цветной металлопрокат'
    const items = [base, name, tube && a.trim() && b.trim() ? 'наружный диаметр × стенка' : '', bar && length ? `длина ${f(length)} мм` : '',
      (grade === '__other__' ? otherGrade : grade).trim() ? `марка сплава ${(grade === '__other__' ? otherGrade : grade).trim()}` : 'марка сплава уточнить',
      condition.trim() ? `состояние/способ изготовления: ${condition.trim()}` : '',
      surface.trim() ? `поверхность/исполнение: ${surface.trim()}` : '',
      standard.trim() ? `требуемый ГОСТ/ТУ: ${standard.trim()}` : 'стандарт уточнить',
      amount.trim() ? `количество ${f(amount)} ${unit}` : '']
    url.searchParams.set('product', items.filter(Boolean).join('; '))
    url.hash = 'request'
    return url.pathname + url.search + url.hash
  }, [requestHref, shape, name, tube, bar, a, b, length, grade, otherGrade, condition, surface, standard, amount, unit])
  return <section className="nonferrous-picker nonferrous-readability" aria-label="Подбор цветного металла по форме и размерам">
    <h2>Форма и размеры</h2>
    <noscript><style>{'.nonferrous-readability .nonferrous-shapes,.nonferrous-readability .nonferrous-fields,.nonferrous-readability .nonferrous-advanced{display:none!important}'}</style><p>Параметры можно указать в форме заявки или приложить спецификацию.</p></noscript>
    <CatalogKindFallback kinds={shapeKinds} requestHref={requestHref} />
    <fieldset className="nonferrous-shapes">
      <legend>Форма изделия</legend>
      <div className="nonferrous-shape-options">{options.map(value => <label key={value} className="nonferrous-shape-option">
        <input type="radio" name={shapeName} value={value} checked={shape === value} onChange={() => {if (shape === value) return; setShapeId(shapeKinds.find(option => option.value === value)?.id || '');setA('');setB('');setLength('');setGrade('');setOtherGrade('');setCondition('');setSurface('');setStandard('')}} />
        <span>{value}</span>
      </label>)}</div>
    </fieldset>
    <div className="nonferrous-fields">

      {shape !== '' && <>
        {(flat || tube || bar || shaped) && <label>{flat ? 'Толщина, мм' : tube ? 'Наружный диаметр, мм' : shape === 'Шестигранник' ? 'Размер под ключ, мм' : shape === 'Квадрат' ? 'Сторона, мм' : shaped ? 'Основной габарит, мм (если известен)' : 'Диаметр, мм'}<input value={a} onChange={e=>setA(e.target.value)} inputMode="decimal" placeholder="Например, 20" /></label>}
        {(flat || tube) && <label>{flat ? 'Ширина, мм' : 'Толщина стенки, мм'}<input value={b} onChange={e=>setB(e.target.value)} inputMode="decimal" placeholder={tube ? 'Например, 2' : 'Например, 1000'} /></label>}
        {(flat || tube || bar) && <label>Длина, мм (если известна)<input value={length} onChange={e=>setLength(e.target.value)} inputMode="decimal" placeholder="По спецификации" /></label>}
        {gradeExamples ? <label>Марка {productSlug === 'list' || productSlug === 'truby' || productSlug === 'sortovoy-prokat' ? 'стали' : 'металла / сплава'}
          <select value={grade} onChange={e => {setGrade(e.target.value);setOtherGrade('')}}><option value="">Выберите марку</option>{gradeExamples.grades.map(value=><option key={value} value={value}>{value}</option>)}<option value="__other__">Другая марка по спецификации</option></select>
        </label> : <label>Марка сплава<input value={grade} onChange={e=>setGrade(e.target.value)} placeholder="Укажите из чертежа / спецификации" /></label>}
        {grade === '__other__' && <label>Укажите другую марку<input value={otherGrade} onChange={e=>setOtherGrade(e.target.value)} placeholder="Точное обозначение из заявки" /></label>}
        <label>Количество<input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" placeholder="Можно позже" /></label>
        <label>Единица<select value={unit} onChange={e=>setUnit(e.target.value)}>{['кг','т','шт.','м','м²'].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
      </>}
    </div>
    {shape !== '' && <details className="nonferrous-advanced">
      <summary>Дополнительные параметры</summary>
      <div className="nonferrous-fields">
        <label>Состояние / способ изготовления<input value={condition} onChange={e=>setCondition(e.target.value)} placeholder="Если требуется" /></label>
        <label>Поверхность / покрытие<input value={surface} onChange={e=>setSurface(e.target.value)} placeholder="Если требуется" /></label>
        <label>ГОСТ / ТУ / ASTM<input value={standard} onChange={e=>setStandard(e.target.value)} placeholder="Стандарт именно этого изделия" /></label>
      </div>
    </details>}
    <p className="nonferrous-note">Заявку можно отправить с любыми параметрами, даже если они не соответствуют справочным диапазонам. Наличие и возможность поставки уточняет менеджер.</p>
    {/* The homepage is an HTML Route Handler; document navigation initializes the request form. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <div className="nonferrous-actions"><a className="nonferrous-submit" href={href}>Передать параметры в заявку ↗</a><a href={href}>Есть спецификация? Прикрепить Excel / PDF / чертёж →</a></div>
    {gradeExamples && <details className="nonferrous-standards">
      <summary>Марки и стандарты</summary>
    {gradeExamples && <div className="nonferrous-note nonferrous-grade-reference" aria-label={`Справочные марки: ${gradeExamples.title}`}>
      <p className="nonferrous-grade-reference-heading"><strong>Марки — {gradeExamples.title}</strong></p>
      <div className="nonferrous-grade-reference-list" aria-label="Перечень марок">
        {gradeExamples.grades.map((value, index) => {
          const slug = getMaterialPageSlug(value)
          return <Fragment key={value}>{index > 0 && <span className="nonferrous-grade-separator" aria-hidden="true"> · </span>}{slug
            ? <a href={`/spravochnik-materialov/${slug}`}>{value}</a>
            : <span>{value}</span>}</Fragment>
        })}
      </div>
      <p className="nonferrous-grade-reference-explanation">Примеры обозначений по {gradeExamples.standard}. Выбранная марка не означает подтверждённого наличия или совместимости с любой формой изделия.</p>
      {gradeExamples.caution && <p className="nonferrous-grade-reference-caution">{gradeExamples.caution}</p>}
      <p className="nonferrous-grade-reference-source"><a href={gradeExamples.source} target="_blank" rel="noopener noreferrer">Источник стандарта ↗</a></p>
    </div>}
    </details>}
  </section>
}

