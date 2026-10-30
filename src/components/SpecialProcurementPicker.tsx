'use client'

import { useMemo, useState } from 'react'

type Mode = 'tape' | 'welding' | 'forging'
const positive = (s: string) => /^\d+(?:[.,]\d+)?$/.test(s.trim()) && Number(s.trim().replace(',', '.')) > 0
const decimal = (s: string) => s.trim().replace('.', ',')

export default function SpecialProcurementPicker({ mode, requestHref }: { mode: Mode; requestHref: string }) {
  const tape = mode === 'tape'
  const welding = mode === 'welding'
  const [kind, setKind] = useState('')
  const [thickness, setThickness] = useState('')
  const [width, setWidth] = useState('')
  const [diameter, setDiameter] = useState('')
  const [grade, setGrade] = useState('')
  const [state, setState] = useState('')
  const [standard, setStandard] = useState('')
  const [drawing, setDrawing] = useState('')
  const [revision, setRevision] = useState('')
  const [mass, setMass] = useState('')
  const [requirements, setRequirements] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('кг')
  const valid = tape ? positive(thickness) && positive(width) : welding ? Boolean(kind) && positive(diameter) : Boolean(drawing.trim())
  const quantityValid = !qty || positive(qty)
  const href = useMemo(() => {
    if (!valid || !quantityValid) return null
    const url = new URL(requestHref, 'https://magicmet.ru')
    const base = url.searchParams.get('product') || (tape ? 'Лента упаковочная' : welding ? 'Сварочные материалы' : 'Поковка по чертежу')
    const item = tape
      ? `лента ${decimal(thickness)}×${decimal(width)} мм`
      : welding ? `${kind} Ø${decimal(diameter)} мм`
      : `поковка по чертежу № ${drawing.trim()}`
    const params = [
      base, item,
      revision && !tape && !welding ? `ревизия ${revision}` : '',
      grade ? `марка ${grade}` : '',
      state ? `${tape ? 'состояние/покрытие' : welding ? 'способ сварки/упаковка' : 'термообработка'}: ${state}` : '',
      standard ? `требуемый норматив ${standard}` : 'ГОСТ/ТУ уточнить',
      !tape && !welding && mass ? `ориентировочная масса ${mass} кг` : '',
      requirements ? `дополнительные требования: ${requirements}` : '',
      qty ? `количество ${decimal(qty)} ${unit}` : ''
    ]
    url.searchParams.set('product', params.filter(Boolean).join('; '))
    url.hash = 'request'
    return url.pathname + url.search + url.hash
  }, [requestHref, valid, quantityValid, tape, welding, thickness, width, kind, diameter, drawing, revision, grade, state, standard, mass, requirements, qty, unit])
  return <section className="special-procurement-picker" aria-label={tape ? 'Параметры упаковочной ленты' : welding ? 'Параметры сварочного материала' : 'Параметры поковки по чертежу'}>
    <h2>{tape ? 'Лента — подобрать по размерам' : welding ? 'Сварочные материалы — указать параметры' : 'Поковка — заявка по чертежу'}</h2>
    <p>{tape ? 'Укажите толщину и ширину ленты. Состояние, марку и норматив укажите отдельно.' : welding ? 'Выберите вид материала: его марка, диаметр и норматив зависят от технологии сварки.' : 'Номер чертежа и его редакция важнее универсального размерного ряда. Приложите сам чертёж в форме ниже.'}</p>
    <div className="special-procurement-fields">
      {tape && <><label>Толщина, мм<input value={thickness} onChange={e => setThickness(e.target.value)} inputMode="decimal" placeholder="Например, 0,5" /></label><label>Ширина, мм<input value={width} onChange={e => setWidth(e.target.value)} inputMode="decimal" placeholder="Например, 20" /></label></>}
      {welding && <><label>Вид материала<select value={kind} onChange={e => setKind(e.target.value)}><option value="">Выберите вид</option><option>Проволока сплошная</option><option>Проволока порошковая</option><option>Электрод покрытый</option><option>Присадочный пруток</option></select></label><label>Диаметр, мм<input value={diameter} onChange={e => setDiameter(e.target.value)} inputMode="decimal" placeholder="Например, 3" /></label></>}
      {!tape && !welding && <><label>Номер чертежа / обозначение<input value={drawing} onChange={e => setDrawing(e.target.value)} placeholder="Укажите номер" /></label><label>Ревизия чертежа<input value={revision} onChange={e => setRevision(e.target.value)} placeholder="Если есть" /></label><label>Ориентировочная масса, кг<input value={mass} onChange={e => setMass(e.target.value)} inputMode="decimal" placeholder="Если известна" /></label></>}
      <label>{welding ? 'Марка сварочного материала' : 'Марка материала'}<input value={grade} onChange={e => setGrade(e.target.value)} placeholder={welding ? 'Например, Св-08Г2С' : 'По спецификации'} /></label>
      <label>{tape ? 'Состояние / покрытие' : welding ? 'Способ сварки / упаковка' : 'Термообработка'}<input value={state} onChange={e => setState(e.target.value)} placeholder="По требованию заказа" /></label>
      <label>ГОСТ / ТУ / НД<input value={standard} onChange={e => setStandard(e.target.value)} placeholder="Если известен" /></label>
      <label>{tape ? 'Масса рулона / упаковка' : welding ? 'Основной металл / условия работы' : 'Припуски / УЗК / испытания'}<input value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Если требуется" /></label>
      <label>Количество<input value={qty} onChange={e => setQty(e.target.value)} inputMode="decimal" placeholder="По желанию" /></label>
      <label>Единица<select value={unit} onChange={e => setUnit(e.target.value)}>{(tape ? ['кг','т','рулонов'] : welding ? ['кг','пачек','катушек','шт.'] : ['шт.','кг','т']).map(u => <option key={u} value={u}>{u}</option>)}</select></label>
    </div>
    <p className="special-procurement-note">{welding ? 'ГОСТ 2246-70 не распространяется автоматически на покрытые электроды и порошковую проволоку.' : tape ? 'Толщина и ширина не подтверждают состояние ленты, норматив или наличие.' : 'Заявка по номеру не заменяет исходный файл чертежа. Чертёж, материал, припуски и контроль согласуются до расчёта.'} Все параметры требуют проверки перед коммерческим предложением.</p>
    {/* The homepage is an HTML Route Handler; document navigation initializes the request form. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <div className="special-procurement-actions">{href ? <a className="special-procurement-submit" href={href}>Перенести параметры в заявку ↗</a> : <span>{tape ? 'Укажите толщину и ширину' : welding ? 'Выберите вид и диаметр' : 'Укажите номер чертежа'}</span>}<a href="/#request">Прикрепить Excel / PDF / чертёж →</a></div>
  </section>
}
