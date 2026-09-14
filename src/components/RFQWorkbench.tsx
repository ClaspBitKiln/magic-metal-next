'use client'

import { useMemo, useState } from 'react'

type Offer = {
  id: string
  supplierId: string
  product: string
  diameter?: number
  wall?: number
  grade?: string
  standard?: string
  quantity?: number
  unit?: string
  price?: number
  currency: string
  availability: string
  city?: string
  leadTimeDays?: number
  confidence: number
  sourcePublishedAt?: string
  sourceUpdatedAt?: string
  freshness?: 'fresh' | 'aging' | 'stale' | 'unknown'
  evidenceStatus?: 'observed' | 'needs-verification' | 'confirmed' | 'stale' | 'benchmark'
  vatIncluded?: boolean
  evidenceUrl?: string
  evidenceNote?: string
}

type Decision = {
  offerId: string
  score: number
  landedCost: { total: number; currency: string }
  reasons: string[]
  risks: string[]
  recommended: boolean
}

type RFQItem = {
  product: { value?: string }
  diameter: { value?: number }
  wall: { value?: number }
  grade: { value?: string }
  standard: { value?: string }
  quantity: { value?: number }
  unit: { value?: string }
  destination: { value?: string }
}

type SearchResult = {
  rfq?: { items?: RFQItem[] }
  offers?: Record<string, Offer[]>
  decisions?: Record<string, Decision[]>
  noRouteLines?: number[]
  clarificationLines?: number[]
}

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const defaultRequest = 'Труба бесшовная 219×10 09Г2С ГОСТ 8732-78, 20 т, доставка: Ташкент'

const evidenceLabels: Record<string, string> = {
  observed: 'наблюдается',
  'needs-verification': 'требует проверки',
  confirmed: 'подтверждено',
  stale: 'устарело',
  benchmark: 'ориентир',
}

const freshnessLabels: Record<string, string> = {
  fresh: 'свежее',
  aging: 'давность растёт',
  stale: 'устарело',
  unknown: 'дата неизвестна',
}

function formatSourceDate(value?: string) {
  if (!value) return 'дата неизвестна'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'дата неизвестна' : date.toLocaleDateString('ru-RU')
}

export default function RFQWorkbench() {
  const [step, setStep] = useState<'request' | 'search' | 'quote'>('request')
  const [requestText, setRequestText] = useState(defaultRequest)
  const [data, setData] = useState<SearchResult | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [sellingPrice, setSellingPrice] = useState('245000')
  const [statusMessage, setStatusMessage] = useState('')
  const [searching, setSearching] = useState(false)

  const rfqItem = data?.rfq?.items?.[0]
  const offers = data?.offers?.['1'] ?? []
  const decisions = data?.decisions?.['1'] ?? []
  const recommended = decisions.find((decision) => decision.recommended)?.offerId || decisions[0]?.offerId || offers[0]?.id
  const selectedIdFinal = selectedId || recommended || ''
  const selected = useMemo(() => offers.find((offer) => offer.id === selectedIdFinal) || offers[0], [offers, selectedIdFinal])
  const selectedDecision = decisions.find((decision) => decision.offerId === selected?.id)
  const landed = selectedDecision?.landedCost.total ?? selected?.price ?? 0
  const sell = Number(sellingPrice) || 0
  const quantity = rfqItem?.quantity.value ?? selected?.quantity ?? 0
  const gross = sell - landed

  async function runSearch() {
    const text = requestText.trim()
    if (!text) {
      setStatusMessage('Введите текст заявки.')
      return
    }

    setSearching(true)
    setStatusMessage('Ищу наблюдаемые объявления Metalinfo и проверяю точное совпадение…')
    try {
      const response = await fetch('/api/rfq-workbench/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const result = (await response.json()) as SearchResult & { error?: string }
      if (!response.ok) throw new Error(result.error || 'Поиск не выполнен')
      setData(result)
      setSelectedId('')
      setStep('search')
      setStatusMessage(
        'Найдено предложений: ' + (result.offers?.['1']?.length ?? 0) +
        '. Каждое требует проверки менеджером перед использованием в КП.',
      )
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Ошибка поиска')
    } finally {
      setSearching(false)
    }
  }

  const quoteProduct = [
    rfqItem?.product.value || selected?.product || 'Позиция из заявки',
    rfqItem?.diameter.value && rfqItem?.wall.value ? rfqItem.diameter.value + '×' + rfqItem.wall.value : '',
    rfqItem?.grade.value || '',
    rfqItem?.standard.value || '',
  ].filter(Boolean).join(' ')

  return (
    <main style={{ minHeight: '100vh', background: '#f4f6f8', color: '#16202a', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #dfe5ea', padding: '18px 28px', display: 'flex', justifyContent: 'space-between' }}>
        <div><div style={eyebrow}>Мэджик Металл</div><strong style={{ fontSize: 22 }}>RFQ Workbench</strong></div>
        <div style={muted}>Внутренний контур · Production не изменяется</div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 28 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['request', 'search', 'quote'].map((stage, index) => (
            <div key={stage} style={{ flex: 1, padding: 10, borderRadius: 8, background: step === stage ? '#0f6b72' : '#e5eaee', color: step === stage ? '#fff' : '#52616d', fontSize: 13 }}>
              {index + 1}. {stage === 'request' ? 'Заявка' : stage === 'search' ? 'Поиск и закупка' : 'КП'}
            </div>
          ))}
        </div>

        {step === 'request' && (
          <section style={card}>
            <h1 style={{ margin: 0 }}>Новая заявка</h1>
            <p style={muted}>Введите заявку текстом. Размер, марка, стандарт и количество будут извлечены без подстановки отсутствующих данных.</p>
            <label>
              <span style={labelStyle}>Исходный запрос</span>
              <textarea value={requestText} onChange={(event) => setRequestText(event.target.value)} rows={7} style={{ ...input, resize: 'vertical', lineHeight: 1.5, marginTop: 8 }} />
            </label>
            <div style={noticeStyle}>Для точного предложения укажите размер, марку стали и стандарт. Цена без связи с конкретной строкой товара не принимается.</div>
            <button onClick={runSearch} style={primary} disabled={searching}>{searching ? 'Поиск…' : '🔎 Найти варианты'}</button>
            {statusMessage && <p style={muted}>{statusMessage}</p>}
          </section>
        )}

        {step === 'search' && (
          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div><h2 style={{ margin: 0 }}>Наблюдаемые предложения</h2><p style={muted}>Metalinfo → точная привязка позиции → свежесть → Procurement Engine</p></div>
              <span style={pill}>{offers.length} предложений</span>
            </div>

            {rfqItem && (
              <div style={noticeStyle}>
                <b>Распознано:</b> {quoteProduct}
                {quantity ? ' · ' + quantity + ' ' + (rfqItem.unit.value || 'т') : ''}
                {rfqItem.destination.value ? ' · доставка: ' + rfqItem.destination.value : ''}
              </div>
            )}

            {offers.length > 0 ? (
              <div style={{ overflowX: 'auto', marginTop: 18 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Вариант', 'Поставщик', 'Цена', 'Тоннаж', 'Город', 'Наличие', 'Landed cost', 'Статус источника', 'Дата источника', 'Доказательство', ''].map((heading) => <th key={heading} style={th}>{heading}</th>)}</tr></thead>
                  <tbody>
                    {offers.map((offer) => {
                      const decision = decisions.find((entry) => entry.offerId === offer.id)
                      const evidenceStatus = evidenceLabels[offer.evidenceStatus || ''] || 'без статуса'
                      const freshness = freshnessLabels[offer.freshness || ''] || 'не определено'
                      return (
                        <tr key={offer.id} style={{ background: offer.id === selectedIdFinal ? '#f2f8f7' : '#fff' }}>
                          <td style={td}><b>{offer.id}</b><br /><span style={muted}>{offer.product} {offer.diameter}×{offer.wall} {offer.grade} {offer.standard}</span></td>
                          <td style={td}>{offer.supplierId}</td>
                          <td style={td}>{offer.price ? money.format(offer.price) + ' ₽/т' : '—'}<br /><span style={muted}>{offer.vatIncluded === true ? 'с НДС' : offer.vatIncluded === false ? 'без НДС' : 'НДС не указан'}</span></td>
                          <td style={td}>{offer.quantity ? offer.quantity + ' ' + (offer.unit || 'т') : 'не указано'}</td>
                          <td style={td}>{offer.city || '—'}</td>
                          <td style={td}>{offer.availability}</td>
                          <td style={td}><b>{decision ? money.format(decision.landedCost.total) + ' ₽/т' : '—'}</b></td>
                          <td style={td}>{evidenceStatus}<br /><span style={muted}>{freshness}</span></td>
                          <td style={td}>{formatSourceDate(offer.sourceUpdatedAt || offer.sourcePublishedAt)}</td>
                          <td style={td}>{offer.evidenceUrl ? <a href={offer.evidenceUrl} target="_blank" rel="noreferrer">открыть</a> : '—'}</td>
                          <td style={td}><button onClick={() => setSelectedId(offer.id)} style={button(offer.id === selectedIdFinal)}>Выбрать</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={noticeStyle}>Точное предложение не найдено. Система не подставляет соседний размер, другую марку, другой ГОСТ или цену без доказательства.</div>
            )}

            {selected && (
              <div style={recommendation}>
                <b>Рекомендация: {selected.id}</b>
                <p>{selectedDecision?.reasons?.join(' · ') || 'Выбрано по результату ранжирования.'}</p>
                <div style={metrics}>
                  <Metric label="Landed cost" value={money.format(landed) + ' ₽/т'} />
                  <Metric label="Цена закупки" value={selected.price ? money.format(selected.price) + ' ₽/т' : 'не определена'} />
                  <Metric label="Статус доказательства" value={evidenceLabels[selected.evidenceStatus || ''] || 'требует проверки'} />
                </div>
              </div>
            )}

            {statusMessage && <p style={muted}>{statusMessage}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep('request')} style={secondary}>← Изменить заявку</button>
              <button onClick={() => setStep('quote')} style={primary} disabled={!selected}>Сформировать КП</button>
            </div>
          </section>
        )}

        {step === 'quote' && selected && (
          <section style={card}>
            <h2>КП к проверке менеджером</h2>
            <div style={{ border: '1px solid #dfe5ea', borderRadius: 10, padding: 20 }}>
              <div style={muted}>Клиентская версия · поставщик, закупочная цена и внутренние источники скрыты</div>
              <h3>{quoteProduct}</h3>
              <div style={grid}>
                <Field label="Количество" value={quantity ? quantity + ' ' + (rfqItem?.unit.value || 'т') : 'уточнить'} />
                <label><span style={labelStyle}>Цена продажи, ₽/т</span><input value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} style={input} /></label>
                <Field label="Итого" value={quantity ? money.format(sell * quantity) + ' ₽' : 'уточнить'} />
                <Field label="Срок" value={selected.leadTimeDays ? selected.leadTimeDays + '–' + (selected.leadTimeDays + 2) + ' дней' : 'уточнить'} />
              </div>
            </div>
            <div style={metrics}>
              <Metric label="Валовая прибыль / т" value={money.format(gross) + ' ₽'} />
              <Metric label="Валовая прибыль" value={quantity ? money.format(gross * quantity) + ' ₽' : 'уточнить'} />
              <Metric label="Статус" value="КП к проверке" />
            </div>
            <button style={secondary} onClick={() => setStep('search')}>← Назад к закупке</button>
          </section>
        )}
      </div>
    </main>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><div style={labelStyle}>{label}</div><div style={{ fontWeight: 600, marginTop: 6 }}>{value}</div></div>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div style={{ background: '#f5f7f8', borderRadius: 9, padding: 13 }}><div style={labelStyle}>{label}</div><b style={{ display: 'block', marginTop: 5 }}>{value}</b></div>
}

const labelStyle: React.CSSProperties = { fontSize: 11, color: '#687985', textTransform: 'uppercase', letterSpacing: 0.5 }
const muted: React.CSSProperties = { fontSize: 13, color: '#607080' }
const eyebrow: React.CSSProperties = { fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: '#607080' }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #dfe5ea', borderRadius: 12, padding: 24 }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginTop: 22 }
const noticeStyle: React.CSSProperties = { marginTop: 20, padding: 16, background: '#f7f9fa', borderRadius: 9, lineHeight: 1.6 }
const recommendation: React.CSSProperties = { marginTop: 22, padding: 18, border: '1px solid #cfe1de', borderRadius: 10, background: '#f7fbfa' }
const metrics: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, margin: '14px 0 20px' }
const pill: React.CSSProperties = { padding: '7px 10px', borderRadius: 999, background: '#e5f4f1', color: '#12645d', fontSize: 12, whiteSpace: 'nowrap' }
const input: React.CSSProperties = { marginTop: 5, width: '100%', boxSizing: 'border-box', border: '1px solid #ccd6dc', borderRadius: 7, padding: '10px 11px', fontSize: 15 }
const primary: React.CSSProperties = { marginTop: 22, border: 0, borderRadius: 8, padding: '12px 18px', background: '#0f6b72', color: '#fff', fontWeight: 700, cursor: 'pointer' }
const secondary: React.CSSProperties = { marginTop: 22, border: '1px solid #cbd5db', borderRadius: 8, padding: '12px 18px', background: '#fff', fontWeight: 600, cursor: 'pointer' }
const th: React.CSSProperties = { textAlign: 'left', padding: '11px 8px', borderBottom: '1px solid #dfe5ea', color: '#607080', fontWeight: 600, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '12px 8px', borderBottom: '1px solid #edf0f2', verticalAlign: 'top', whiteSpace: 'nowrap' }

function button(active: boolean): React.CSSProperties {
  return { border: active ? '1px solid #0f6b72' : '1px solid #ccd6dc', background: active ? '#e7f4f2' : '#fff', borderRadius: 7, padding: '7px 10px', cursor: 'pointer' }
}
