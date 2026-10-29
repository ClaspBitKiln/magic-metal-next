'use client'

import { useMemo, useState } from 'react'

type Kind = 'Болт' | 'Гайка' | 'Шпилька' | 'Шайба'

const positive = (value: string) => /^\d+(?:[.,]\d+)?$/.test(value.trim()) && Number(value.replace(',', '.')) > 0

export default function FastenerRequestPicker({ requestHref, nutThreads }: { requestHref: string; nutThreads: string[] }) {
  const [kind, setKind] = useState<Kind>('Гайка')
  const [thread, setThread] = useState('')
  const [length, setLength] = useState('')
  const [standard, setStandard] = useState('')
  const [strength, setStrength] = useState('')
  const [material, setMaterial] = useState('')
  const [coating, setCoating] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('шт.')
  const isThread = kind !== 'Шайба'
  const hasLength = kind === 'Болт' || kind === 'Шпилька'
  const threadValid = kind === 'Гайка'
    ? nutThreads.includes(thread)
    : /^M\d+(?:[.,]\d+)?$/iu.test(thread.trim())
  const valid = threadValid && (!hasLength || positive(length)) && (!quantity || positive(quantity))
  const href = useMemo(() => {
    if (!valid) return null
    const url = new URL(requestHref, 'https://magicmet.ru')
    const previous = url.searchParams.get('product') || 'Крепёж'
    const details = [previous, kind, kind === 'Шайба' ? `номинальный размер ${thread.toUpperCase()}` : `резьба ${thread.toUpperCase()}`,
      hasLength ? `длина ${length} мм` : '',
      kind === 'Гайка' ? 'размер резьбы по таблице ГОСТ 5915-70' : '',
      standard.trim() ? `требуемый стандарт ${standard.trim()}` : kind === 'Гайка' ? 'ГОСТ 5915-70' : 'стандарт уточнить',
      strength.trim() ? `класс прочности ${strength.trim()}` : '',
      material.trim() ? `марка материала ${material.trim()}` : '',
      coating.trim() ? `покрытие ${coating.trim()}` : '',
      quantity.trim() ? `количество ${quantity} ${unit}` : '']
    url.searchParams.set('product', details.filter(Boolean).join('; '))
    url.hash = 'request'
    return url.pathname + url.search + url.hash
  }, [requestHref, valid, kind, thread, hasLength, length, standard, strength, material, coating, quantity, unit])
  return <section className="fastener-picker" aria-label="Подбор крепежа в заявку">
    <h3>Крепёж — указать размер для заявки</h3>
    <p>Выберите вид изделия. Для гаек доступны номинальные резьбы из таблицы ГОСТ 5915-70; остальные размеры и исполнение уточним по вашему стандарту или чертежу.</p>
    <div className="fastener-types" role="group" aria-label="Вид крепежа">
      {(['Гайка', 'Болт', 'Шпилька', 'Шайба'] as Kind[]).map(value => <button key={value} type="button" aria-pressed={kind === value} onClick={() => { setKind(value); setThread(''); setLength(''); setStandard('') }}>{value}</button>)}
    </div>
    <div className="fastener-fields">
      <label>{isThread ? 'Номинальная резьба' : 'Под какой размер крепежа'}
        {kind === 'Гайка' ? <select value={thread} onChange={event => setThread(event.target.value)}><option value="">Выберите M</option>{nutThreads.map(value => <option key={value} value={value}>{value}</option>)}</select>
          : <input value={thread} onChange={event => setThread(event.target.value)} placeholder="Например, М12" aria-describedby="fastener-thread-tip" />}
      </label>
      {hasLength && <label>Длина изделия, мм<input value={length} onChange={event => setLength(event.target.value)} inputMode="decimal" placeholder="Например, 60" /></label>}
      <label>ГОСТ / DIN / ISO / чертёж<input value={standard} onChange={event => setStandard(event.target.value)} placeholder={kind === 'Гайка' ? 'По умолчанию ГОСТ 5915-70' : 'Укажите стандарт, если известен'} /></label>
      <label>Класс прочности (если известен)<input value={strength} onChange={event => setStrength(event.target.value)} placeholder="Например, 8.8" /></label>
      <label>Марка материала (если известна)<input value={material} onChange={event => setMaterial(event.target.value)} placeholder="Например, 40Х" /></label>
      <label>Покрытие / исполнение<input value={coating} onChange={event => setCoating(event.target.value)} placeholder="Например, цинк" /></label>
      <label>Количество<input value={quantity} onChange={event => setQuantity(event.target.value)} inputMode="decimal" placeholder="По желанию" /></label>
      <label>Единица<select value={unit} onChange={event => setUnit(event.target.value)}><option value="шт.">Штук</option><option value="кг">Килограммов</option><option value="т">Тонн</option></select></label>
    </div>
    <p id="fastener-thread-tip" className="fastener-note">У болтов и шпилек важны также шаг резьбы и исполнение; у шайб — тип, наружный диаметр и толщина. Укажите их в спецификации или запросе. Класс прочности не равен марке стали. Размеры не означают наличие.</p>
    <div className="fastener-actions">{href ? <a className="fastener-submit" href={href}>Отправить параметры в заявку ↗</a> : <span>Укажите {hasLength ? 'резьбу и длину' : 'номинальный размер'}</span>}<a href="/#request">Прикрепить Excel / PDF / чертёж →</a></div>
  </section>
}
