'use client'

import { useId, useMemo, useState } from 'react'

type SpecialSheetSlug = 'list-riflenyj' | 'list-pvl' | 'profnastil'

export default function SpecialSheetRequestPicker({ slug, requestHref }: { slug: SpecialSheetSlug; requestHref: string }) {
  const uid = useId()
  const [designation, setDesignation] = useState('')
  const [thickness, setThickness] = useState('')
  const [cut, setCut] = useState('')
  const [grade, setGrade] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('листов')
  const isPvl = slug === 'list-pvl'
  const isProfile = slug === 'profnastil'
  const href = useMemo(() => {
    const url = new URL(requestHref, 'https://magicmet.ru')
    const product = url.searchParams.get('product')
    const values = [product,
      (isPvl || isProfile) && designation.trim() ? `${isPvl ? 'обозначение ПВЛ' : 'профиль'} ${designation.trim()}` : '',
      !isPvl && thickness.trim() ? `${isProfile ? 'толщина металла' : 'толщина основы'} ${thickness.trim()} мм` : '',
      cut.trim() ? `раскрой ${cut.trim()} мм (ширина × длина)` : '',
      grade.trim() ? `марка материала ${grade.trim()}` : '',
      quantity.trim() ? `количество ${quantity.trim()} ${unit}` : '',
    ]
    url.searchParams.set('product', values.filter(Boolean).join('; '))
    url.hash = 'request'
    return url.pathname + url.search + url.hash
  }, [requestHref, isPvl, isProfile, designation, thickness, cut, grade, quantity, unit])
  return <section className="sheet-format-picker special-sheet-picker" aria-label="Параметры листа для заявки">
    <h3>{isPvl ? 'Обозначение и раскрой' : isProfile ? 'Профиль, толщина и раскрой' : 'Толщина и раскрой'}</h3>
    <p>{isPvl ? 'Укажите обозначение ПВЛ, затем раскрой.' : isProfile ? 'Укажите профиль, толщину и раскрой.' : 'Укажите толщину основы, затем раскрой.'} Неизвестные параметры можно оставить пустыми.</p>
    <noscript><style>{'.special-sheet-js-controls{display:none!important}'}</style><p>Без JavaScript укажите параметры в тексте заявки или приложите спецификацию.</p></noscript>
    <div className="special-sheet-js-controls">
      <div className="sheet-format-picker-fields">
        {(isPvl || isProfile) && <label htmlFor={uid + '-designation'}>{isPvl ? 'Обозначение ПВЛ' : 'Профиль'}<input id={uid + '-designation'} value={designation} onChange={event => setDesignation(event.target.value)} placeholder="Из спецификации" /></label>}
        {!isPvl && <label htmlFor={uid + '-thickness'}>{isProfile ? 'Толщина металла, мм' : 'Толщина основы, мм'}<input id={uid + '-thickness'} inputMode="decimal" value={thickness} onChange={event => setThickness(event.target.value)} /></label>}
        <label htmlFor={uid + '-cut'}>Раскрой, мм (ширина × длина)<input id={uid + '-cut'} value={cut} onChange={event => setCut(event.target.value)} placeholder="По спецификации" /></label>
      </div>
      <details className="sheet-format-picker-extra"><summary>Марка и количество — если известны</summary>
        <div className="sheet-format-picker-fields">
          <label htmlFor={uid + '-grade'}>Марка материала<input id={uid + '-grade'} value={grade} onChange={event => setGrade(event.target.value)} /></label>
          <label htmlFor={uid + '-quantity'}>Количество<input id={uid + '-quantity'} inputMode="decimal" value={quantity} onChange={event => setQuantity(event.target.value)} /></label>
          <label htmlFor={uid + '-unit'}>Единица количества<select id={uid + '-unit'} value={unit} onChange={event => setUnit(event.target.value)}><option value="листов">Листов</option><option value="т">Тонн</option><option value="м²">м²</option></select></label>
        </div>
      </details>
    </div>
    <div className="sheet-format-picker-actions">
      {/* The homepage is an HTML Route Handler; document navigation initializes the request form. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href={href}>Передать параметры в заявку ↗</a>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href={href}>Есть спецификация? Прикрепить файл →</a>
    </div>
    <details className="sheet-format-picker-reference"><summary>О параметрах</summary><p>{isPvl ? 'Обозначение ПВЛ не является толщиной листа. ' : ''}Можно запросить неполные и нестандартные параметры. Исполнение, применимость стандарта и возможность поставки уточнит менеджер.</p></details>
  </section>
}
