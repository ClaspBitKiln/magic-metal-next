'use client'

import { useMemo, useState } from 'react'

type Offer = {
  id: string; sourceId: string; supplierId: string; product: string; diameter?: number; wall?: number; grade?: string; standard?: string
  quantity?: number; unit?: string; price?: number; currency: string; availability: string; city?: string; leadTimeDays?: number
  pickupCost?: number; freightCost?: number; handlingCost?: number; destinationCost?: number; customsCost?: number; evidenceUrl?: string
}
type Decision = { offerId: string; score: number; landedCost: { total: number; currency: string }; reasons: string[]; risks: string[]; recommended: boolean }
type SearchResult = { offers?: Record<string, Offer[]>; decisions?: Record<string, Decision[]>; noRouteLines?: number[]; clarificationLines?: number[]; error?: string }

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export default function RFQWorkbench() {
  const [step, setStep] = useState<'request' | 'search' | 'quote'>('request')
  const [offers, setOffers] = useState<Offer[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [selectedOfferId, setSelectedOfferId] = useState('')
  const [sellingPrice, setSellingPrice] = useState('245000')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState('')
  const selectedDecision = useMemo(() => decisions.find((d) => d.offerId === selectedOfferId) || decisions[0], [decisions, selectedOfferId])
  const selected = useMemo(() => offers.find((o) => o.id === (selectedDecision?.offerId || selectedOfferId)) || offers[0], [offers, selectedDecision, selectedOfferId])
  const landed = selectedDecision?.landedCost.total || 0
  const gross = Number(sellingPrice || 0) - landed
  const total = Number(sellingPrice || 0) * 20

  async function runSearch() {
    setNotice('Ищу реальные объявления Metalinfo и передаю их в Procurement Engine…')
    try {
      const response = await fetch('/api/rfq-workbench/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Труба бесшовная; диам:219; стенка:10; сталь:09Г2С; количество:20 т; доставка:Ташкент' }) })
      const data = await response.json() as SearchResult
      if (!response.ok) throw new Error(data.error || 'Поиск не выполнен')
      const found = data.offers?.['1'] || []
      const ranked = data.decisions?.['1'] || []
      setOffers(found); setDecisions(ranked); setSelectedOfferId(ranked[0]?.offerId || found[0]?.id || '')
      setNotice(found.length ? `Найдено ${found.length} предложений. Все прошли нормализацию по размеру, стали и цене.` : 'Подходящих предложений с подтверждаемой ценой не найдено.')
      setStep('search')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Ошибка поиска') }
  }

  return <main style={{ minHeight: '100vh', background: '#f4f6f8', color: '#16202a', fontFamily: 'Arial, sans-serif' }}>
    <header style={header}><div><div style={eyebrow}>Мэджик Металл</div><strong style={{ fontSize: 22 }}>RFQ Workbench</strong></div><div style={{ fontSize: 13, color: '#607080' }}>Внутренний контур · Production не изменяется</div></header>
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 28 }}><div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 22 }}><section>
      <div style={steps}>{[['request','Заявка'],['search','Поиск и закупка'],['quote','КП']].map(([key,label], i) => <div key={key} style={{ ...stepStyle, background: step === key ? '#0f6b72' : '#e5eaee', color: step === key ? '#fff' : '#52616d' }}>{i + 1}. {label}</div>)}</div>
      {step === 'request' && <div style={card}><h1 style={{ margin: 0, fontSize: 26 }}>RFQ-1024</h1><p style={{ color: '#607080' }}>ООО «Альфа» · входящая заявка</p><div style={grid2}><Field label="Позиция" value="Труба бесшовная 219×10 09Г2С" /><Field label="Количество" value="20 т" /><Field label="Доставка" value="Ташкент" /><Field label="Срок" value="30 дней" /><Field label="Стандарт" value="ГОСТ / уточнить" /><Field label="Документы" value="specification.xlsx" /></div><div style={noticeBox}><strong>Исходный запрос</strong><br />Нужна бесшовная труба 219×10 09Г2С, 20 тонн, доставка в Ташкент, срок до 30 дней.</div><button onClick={runSearch} style={primary}>🔎 Найти варианты</button>{notice && <div style={status}>{notice}</div>}</div>}
      {step === 'search' && <div style={card}><div style={titleRow}><div><h2 style={{ margin: 0 }}>Найденные предложения</h2><p style={{ color: '#607080' }}>Metalinfo → нормализация → landed cost → ранжирование</p></div><span style={pill}>{offers.length} найдено</span></div>
        {offers.length === 0 ? <div style={empty}>{notice}</div> : <div style={{ overflowX: 'auto', marginTop: 16 }}><table style={table}><thead><tr>{['Вариант','Поставщик / источник','Размер / сталь','Цена','Кол-во','Город','Логистика','Landed cost','Срок','Наличие','Источник',''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{offers.map((offer) => { const d = decisions.find((x) => x.offerId === offer.id); const logistics = (offer.pickupCost || 0) + (offer.freightCost || 0) + (offer.handlingCost || 0) + (offer.destinationCost || 0) + (offer.customsCost || 0); return <tr key={offer.id} style={{ background: selectedOfferId === offer.id ? '#f2f8f7' : '#fff' }}><td style={td}><strong>{offer.id}</strong>{d?.recommended && <div style={{ color: '#12645d', fontSize: 10 }}>РЕКОМЕНДАЦИЯ</div>}</td><td style={td}><strong>{offer.supplierId}</strong><br /><span style={muted}>{offer.sourceId}</span></td><td style={td}>{offer.diameter}×{offer.wall} {offer.grade}<br /><span style={muted}>{offer.standard || 'стандарт не указан'}</span></td><td style={td}><strong>{offer.price ? money.format(offer.price) : '—'} ₽/т</strong></td><td style={td}>{offer.quantity ? `${offer.quantity} ${offer.unit || 'т'}` : 'не указано'}</td><td style={td}>{offer.city || 'не указан'}</td><td style={td}>{money.format(logistics)} ₽/т</td><td style={td}><strong>{d ? `${money.format(d.landedCost.total)} ₽/т` : '—'}</strong></td><td style={td}>{offer.leadTimeDays ? `${offer.leadTimeDays} дн.` : 'не указан'}</td><td style={td}>{offer.availability === 'in-stock' ? 'В наличии' : 'Проверить'}</td><td style={td}>{offer.evidenceUrl ? <a href={offer.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: '#0f6b72' }}>Открыть</a> : '—'}</td><td style={td}><button onClick={() => setSelectedOfferId(offer.id)} style={offerButton(selectedOfferId === offer.id)}>Выбрать</button></td></tr> })}</tbody></table></div>}
        {selected && selectedDecision && <div style={recommendation}><strong>Рекомендация системы: {selected.id}</strong><p style={{ lineHeight: 1.6 }}>{selectedDecision.reasons.join(' ') || 'Вариант выбран по совокупному score.'} Перед отправкой КП требуется коммерческое подтверждение менеджера.</p><div style={metrics}><Metric label="Landed cost" value={`${money.format(landed)} ₽/т`} /><Metric label="Срок" value={selected.leadTimeDays ? `${selected.leadTimeDays} дней` : 'уточнить'} /><Metric label="Наличие" value={selected.availability === 'in-stock' ? 'В наличии' : 'Проверить'} /></div></div>}
        {notice && <div style={status}>{notice}</div>}<button onClick={() => selected && setStep('quote')} style={primary} disabled={!selected}>Сформировать КП</button>
      </div>}
      {step === 'quote' && selected && <div style={card}><h2 style={{ marginTop: 0 }}>КП к отправке</h2><div style={quoteBox}><div style={muted}>Клиентская версия — внутренние источники скрыты</div><h3>Труба бесшовная 219×10 09Г2С</h3><div style={grid2}><Field label="Количество" value="20 т" /><label><span style={labelStyle}>Цена продажи, ₽/т</span><input value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} style={input} /></label><Field label="Итого" value={`${money.format(total)} ₽`} /><Field label="Срок" value={selected.leadTimeDays ? `${selected.leadTimeDays}–${selected.leadTimeDays + 2} дней` : 'уточнить'} /></div></div><div style={metrics}><Metric label="Валовая прибыль / т" value={`${money.format(gross)} ₽`} /><Metric label="Валовая прибыль" value={`${money.format(gross * 20)} ₽`} /><Metric label="Статус" value="Готово к проверке" /></div><button style={primary} onClick={() => setResult('КП подготовлено к проверке менеджером')}>Подготовить КП</button>{result && <div style={success}>{result}</div>}</div>}
    </section><aside style={aside}><div style={eyebrow}>Внутренний контур</div><h3>Автоматизация менеджера</h3><ul style={ul}><li>разбор RFQ;</li><li>поиск реальных предложений;</li><li>нормализация;</li><li>landed cost;</li><li>ранжирование;</li><li>доказательство источника;</li><li>клиентское КП.</li></ul><div style={asideNote}>Поставщики, закупочные цены и внутренняя экономика не попадают в клиентский документ.</div></aside></div></div>
  </main>
}
function Field({ label, value }: { label: string; value: string }) { return <div><div style={labelStyle}>{label}</div><div style={{ fontWeight: 600, paddingTop: 6 }}>{value}</div></div> }
function Metric({ label, value }: { label: string; value: string }) { return <div style={metric}><div style={labelStyle}>{label}</div><strong style={{ display: 'block', marginTop: 5 }}>{value}</strong></div> }
const header: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #dfe5ea', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const eyebrow: React.CSSProperties = { fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: '#607080' }
const steps: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 18 }; const stepStyle: React.CSSProperties = { flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 13 }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #dfe5ea', borderRadius: 12, padding: 24 }; const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 22 }
const noticeBox: React.CSSProperties = { marginTop: 20, padding: 16, background: '#f7f9fa', borderRadius: 9, fontSize: 14, lineHeight: 1.6 }; const status: React.CSSProperties = { marginTop: 14, color: '#607080', fontSize: 13 }
const titleRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }; const pill: React.CSSProperties = { padding: '7px 10px', borderRadius: 999, background: '#e5f4f1', color: '#12645d', fontSize: 12 }
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12 }; const th: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #dfe5ea', color: '#607080', fontWeight: 600, whiteSpace: 'nowrap' }; const td: React.CSSProperties = { padding: '11px 8px', borderBottom: '1px solid #edf0f2', verticalAlign: 'top', whiteSpace: 'nowrap' }
const muted: React.CSSProperties = { color: '#607080', fontSize: 11 }; const recommendation: React.CSSProperties = { marginTop: 20, padding: 18, border: '1px solid #cfe1de', borderRadius: 10, background: '#f7fbfa' }; const metrics: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 14 }; const metric: React.CSSProperties = { background: '#f5f7f8', borderRadius: 9, padding: 13 }
const input: React.CSSProperties = { marginTop: 5, width: '100%', boxSizing: 'border-box', border: '1px solid #ccd6dc', borderRadius: 7, padding: '10px 11px', fontSize: 15 }; const primary: React.CSSProperties = { marginTop: 22, border: 0, borderRadius: 8, padding: '12px 18px', background: '#0f6b72', color: '#fff', fontWeight: 700, cursor: 'pointer' }; const aside: React.CSSProperties = { background: '#17242d', color: '#fff', borderRadius: 12, padding: 22, alignSelf: 'start' }; const ul: React.CSSProperties = { paddingLeft: 18, lineHeight: 1.8, fontSize: 14, color: '#d8e1e6' }; const asideNote: React.CSSProperties = { marginTop: 20, paddingTop: 18, borderTop: '1px solid #33444f', fontSize: 12, color: '#a8bac4' }; const empty: React.CSSProperties = { marginTop: 18, padding: 18, borderRadius: 9, background: '#f7f9fa', color: '#607080' }; const quoteBox: React.CSSProperties = { border: '1px solid #dfe5ea', borderRadius: 10, padding: 20 }; const success: React.CSSProperties = { marginTop: 14, padding: 12, background: '#edf7f3', borderRadius: 8, color: '#1c6254' }
function offerButton(active: boolean): React.CSSProperties { return { border: active ? '1px solid #0f6b72' : '1px solid #ccd6dc', background: active ? '#e7f4f2' : '#fff', color: '#16323a', borderRadius: 7, padding: '7px 10px', cursor: 'pointer' } }
const labelStyle: React.CSSProperties = { fontSize: 11, color: '#687985', textTransform: 'uppercase', letterSpacing: .5 }
