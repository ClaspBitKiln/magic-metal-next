'use client'

import { useState } from 'react'
import type { NormalizedRFQItem, Offer, ProcurementDecision } from '../lib/procurement/types'
import { amount, compareOptions, emptyReview, evaluateOption, type OfferReview } from '../lib/procurement/workbench'

type SearchResult = {
  rfq?: { items?: NormalizedRFQItem[] }
  offers?: Record<string, Offer[]>
  decisions?: Record<string, ProcurementDecision[]>
}

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const defaultRequest = ''

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
  const [sellingPrice, setSellingPrice] = useState('')
  const [quoteNumber, setQuoteNumber] = useState('')
  const [quoteDate, setQuoteDate] = useState('')
  const [customerCompany, setCustomerCompany] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [requestReference, setRequestReference] = useState('')
  const [quoteLeadTime, setQuoteLeadTime] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('70% предоплата, 30% перед отгрузкой')
  const [supplyTerms, setSupplyTerms] = useState('Доставка и условия отгрузки — по согласованию')
  const [vatTerms, setVatTerms] = useState('НДС 20% включён')
  const [validUntil, setValidUntil] = useState('')
  const [activeLine, setActiveLine] = useState(1)
  const [reviews, setReviews] = useState<Record<string, Record<string, OfferReview>>>({})
  const [statusMessage, setStatusMessage] = useState('')
  const [searching, setSearching] = useState(false)

  const rfqItem = data?.rfq?.items?.find(item => item.line === activeLine)
  const lineReviews = reviews[activeLine] ?? {}
  const lineDecisions = data?.decisions?.[activeLine] ?? []
  const options = rfqItem ? compareOptions(rfqItem, data?.offers?.[activeLine] ?? [], lineReviews, lineDecisions) : []
  const offers = options.map(option => option.offer)
  const recommended = options.find(option => option.ready)?.offer.id
  const selectedIdFinal = selectedId || recommended || offers[0]?.id || ''
  const selected = offers.find(offer => offer.id === selectedIdFinal)
  const selectedDecision = selected ? lineDecisions.find(decision => decision.offerId === selected.id) : undefined
  const assessment = rfqItem && selected ? evaluateOption(rfqItem, selected, lineReviews[selected.id], selectedDecision) : undefined
  const review = selected ? lineReviews[selected.id] ?? emptyReview : emptyReview
  const landed = assessment?.unitCost
  const sell = amount(sellingPrice)
  const quantity = assessment?.quantity
  const gross = sell !== undefined && landed !== undefined ? sell - landed : undefined
  const comparableGross = vatTerms === 'НДС 20% включён' ? gross : undefined

  function updateReview(patch: Partial<OfferReview>) {
    if (!selected) return
    setReviews(previous => ({ ...previous, [activeLine]: {
      ...previous[activeLine], [selected.id]: { ...emptyReview, ...previous[activeLine]?.[selected.id], ...patch },
    } }))
  }

  async function runSearch() {
    const text = requestText.trim()
    if (!text) {
      setStatusMessage('Введите текст заявки.')
      return
    }

    setData(null)
    setReviews({})
    setSelectedId('')
    setSellingPrice('')
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
      setActiveLine(result.rfq?.items?.[0]?.line ?? 1)
      setSelectedId('')
      setStep('search')
      setStatusMessage(
        'Найдено предложений: ' + Object.values(result.offers ?? {}).reduce((count, entries) => count + entries.length, 0) +
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
        <div style={muted}>Рабочее место закупщика</div>
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
            <p style={muted}>Введите заявку текстом: одна позиция на строку. Размер, марка, стандарт и количество будут извлечены без подстановки отсутствующих данных.</p>
            <label>
              <span style={labelStyle}>Исходный запрос</span>
              <textarea value={requestText} onChange={(event) => setRequestText(event.target.value)} placeholder="Труба бесшовная 219×10 09Г2С ГОСТ 8732-78, 20 т, доставка: Челябинск" rows={7} style={{ ...input, resize: 'vertical', lineHeight: 1.5, marginTop: 8 }} />
            </label>
            <div style={noticeStyle}>Для точного предложения укажите размер, марку стали и стандарт. Цена без связи с конкретной строкой товара не принимается.</div>
            <button onClick={runSearch} style={primary} disabled={searching}>{searching ? 'Поиск…' : '🔎 Найти варианты'}</button>
            {statusMessage && <p style={muted}>{statusMessage}</p>}
          </section>
        )}

        {step === 'search' && (
          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div><h2 style={{ margin: 0 }}>Наблюдаемые предложения</h2><p style={muted}>Сравнение поставщиков по позиции · расчёт в рублях с НДС</p></div>
              <span style={pill}>{offers.length} предложений</span>
            </div>

            <label style={{ display: 'block', marginTop: 16 }}>
              Позиция заявки
              <select aria-label="Позиция заявки" value={activeLine} style={input} onChange={event => {
                setActiveLine(Number(event.target.value)); setSelectedId(''); setSellingPrice('')
              }}>
                {data?.rfq?.items?.map(item => <option key={item.line} value={item.line}>{item.line}. {item.originalText}</option>)}
              </select>
            </label>
            {rfqItem && (
              <div style={noticeStyle}>
                <b>Распознано:</b> {quoteProduct}
                {quantity ? ' · ' + quantity + ' т' : ' · количество требует уточнения'}
                {rfqItem.destination.value ? ' · доставка: ' + rfqItem.destination.value : ''}
              </div>
            )}

            {offers.length > 0 ? (
              <div style={{ overflowX: 'auto', marginTop: 18 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Вариант', 'Поставщик', 'Цена', 'Тоннаж', 'Город', 'Наличие', 'Стоимость партии с расходами', 'Статус источника', 'Дата источника', 'Доказательство', ''].map((heading) => <th key={heading} style={th}>{heading}</th>)}</tr></thead>
                  <tbody>
                    {offers.map((offer) => {
                      const option = options.find(entry => entry.offer.id === offer.id)!
                      const evidenceStatus = evidenceLabels[offer.evidenceStatus || ''] || 'без статуса'
                      const freshness = freshnessLabels[offer.freshness || ''] || 'не определено'
                      return (
                        <tr key={offer.id} style={{ background: offer.id === selectedIdFinal ? '#f2f8f7' : '#fff' }}>
                          <td style={td}><b>{offer.id}</b>{offer.id === recommended && <div style={pill}>Минимальная стоимость среди проверенных</div>}<br /><span style={muted}>{offer.product} {offer.diameter}×{offer.wall} {offer.grade} {offer.standard}</span></td>
                          <td style={td}>{offer.supplierId}</td>
                          <td style={td}>{offer.price ? money.format(offer.price) + ' ' + offer.currency + '/' + (offer.unit || '?') : '—'}<br /><span style={muted}>{offer.vatIncluded === true ? 'с НДС' : offer.vatIncluded === false ? 'без НДС' : 'НДС не указан'}</span></td>
                          <td style={td}>{offer.quantity ? offer.quantity + ' ' + (offer.unit || 'т') : 'не указано'}</td>
                          <td style={td}>{offer.city || '—'}</td>
                          <td style={td}>{offer.availability === 'in-stock' ? 'Заявлено наличие' : 'Уточнить'}</td>
                          <td style={td}><b>{option.total !== undefined ? money.format(option.total) + ' ₽' : 'расходы не введены'}</b></td>
                          <td style={td}>{option.ready ? 'Проверено менеджером' : evidenceStatus}<br /><span style={muted}>{freshness}</span></td>
                          <td style={td}>{formatSourceDate(offer.sourceUpdatedAt || offer.sourcePublishedAt)}</td>
                          <td style={td}>{offer.evidenceUrl ? <a href={offer.evidenceUrl} target="_blank" rel="noreferrer">открыть</a> : '—'}</td>
                          <td style={td}><button onClick={() => { setSelectedId(offer.id); setSellingPrice('') }} style={button(offer.id === selectedIdFinal)}>Выбрать</button></td>
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
                <b>{selected.id === recommended ? 'Минимальная стоимость среди проверенных: ' : 'Выбранный вариант: '}{selected.id}</b>
                <p>Введите актуальные условия поставщика. Расходы включают доставку до указанного места, погрузку и все применимые сборы на всю партию этой позиции.</p>
                <div style={grid}>
                  <label>Цена с НДС, ₽/т<input aria-label="Цена с НДС, ₽/т" inputMode="decimal" value={review.price} style={input} onChange={event => updateReview({ price: event.target.value, confirmed: false })} /></label>
                  <label>Доступно, т<input aria-label="Доступно, т" inputMode="decimal" value={review.stock} style={input} onChange={event => updateReview({ stock: event.target.value, confirmed: false })} /></label>
                  <label>Расходы на партию, ₽<input aria-label="Расходы на партию, ₽" inputMode="decimal" value={review.expenses} style={input} onChange={event => updateReview({ expenses: event.target.value, confirmed: false })} /></label>
                  <label>Источник ручной проверки<input aria-label="Источник ручной проверки" value={review.verificationNote} style={input} placeholder="Звонок поставщику, ФИО/дата или № счёта" onChange={event => updateReview({ verificationNote: event.target.value, confirmed: false, confirmedAt: undefined })} /></label>
                </div>
                <label style={{ display: 'block', marginTop: 16 }}><input type="checkbox" checked={review.confirmed} onChange={event => updateReview({ confirmed: event.target.checked, confirmedAt: event.target.checked ? new Date().toISOString() : undefined })} /> Проверены цена с НДС, наличие, срок, документы, условия заказа и все расходы</label>
                <p style={muted}>Проверки сохраняются только до нового поиска или закрытия страницы. Рекомендация относится к одной позиции и одному поставщику.</p>
                {selectedDecision && <div style={noticeStyle}>
                  <b>Оценка закупочного движка:</b> {selectedDecision.reasons.join(' · ')}
                  {!!selectedDecision.risks.length && <><br /><b>Исходные риски:</b> {selectedDecision.risks.join(' · ')}</>}
                </div>}
                <div style={metrics}>
                  <Metric label="Стоимость с расходами / т" value={landed !== undefined ? money.format(landed) + ' ₽' : 'не рассчитана'} />
                  <Metric label="Стоимость всей партии" value={assessment?.total !== undefined ? money.format(assessment.total) + ' ₽' : 'не рассчитана'} />
                  <Metric label="Готовность" value={assessment?.ready ? 'Проверено менеджером' : 'Требует уточнения'} />
                </div>
                {!!assessment?.blockers.length && <ul>{assessment.blockers.map(reason => <li key={reason}>{reason}</li>)}</ul>}
              </div>
            )}

            {statusMessage && <p style={muted}>{statusMessage}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep('request')} style={secondary}>← Изменить заявку</button>
              <button onClick={() => { if (assessment?.ready) setStep('quote') }} style={assessment?.ready ? primary : disabledButton} disabled={!assessment?.ready}>Черновик КП по позиции</button>
            </div>
          </section>
        )}

        {step === 'quote' && selected && assessment?.ready && (
          <section style={card}>
            <h2>Черновик КП · позиция {activeLine} из {data?.rfq?.items?.length}</h2>
            <div style={{ border: '1px solid #dfe5ea', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', borderBottom: '1px solid #dfe5ea', paddingBottom: 18 }}>
                <div><div style={eyebrow}>Мэджик Металл</div><h3 style={{ margin: '6px 0' }}>Коммерческое предложение</h3><div style={muted}>Клиентская версия · внутренние источники и закупочная цена скрыты</div></div>
                <div style={{ textAlign: 'right', lineHeight: 1.5 }}><b>ООО «Мэджик Металл»</b><br /><span style={muted}>ИНН 7453362080 · m1@magicmet.ru · magicmet.ru</span></div>
              </div>
              <div style={grid}>
                <label><span style={labelStyle}>Номер КП</span><input aria-label="Номер КП" value={quoteNumber} onChange={(event) => setQuoteNumber(event.target.value)} style={input} placeholder="№12-ЮИ/06/2026" /></label>
                <label><span style={labelStyle}>Дата КП</span><input aria-label="Дата КП" type="date" value={quoteDate} onChange={(event) => setQuoteDate(event.target.value)} style={input} /></label>
                <label><span style={labelStyle}>Организация клиента</span><input aria-label="Организация клиента" value={customerCompany} onChange={(event) => setCustomerCompany(event.target.value)} style={input} /></label>
                <label><span style={labelStyle}>Кому</span><input aria-label="Кому" value={customerContact} onChange={(event) => setCustomerContact(event.target.value)} style={input} placeholder="ФИО и должность" /></label>
                <label><span style={labelStyle}>Основание</span><input aria-label="Основание" value={requestReference} onChange={(event) => setRequestReference(event.target.value)} style={input} placeholder="Письмо или заявка №…" /></label>
              </div>
              <h3 style={{ marginTop: 26 }}>{quoteProduct}</h3>
              <div style={grid}>
                <Field label="Количество" value={quantity ? quantity + ' т' : 'уточнить'} />
                <label><span style={labelStyle}>Цена продажи, ₽/т</span><input aria-label="Цена продажи, ₽/т" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} style={input} /></label>
                <Field label="Итого" value={quantity && sell !== undefined && sell > 0 ? money.format(sell * quantity) + ' ₽' : 'введите цену продажи'} />
                <label><span style={labelStyle}>НДС</span><select aria-label="НДС" value={vatTerms} onChange={(event) => setVatTerms(event.target.value)} style={input}><option>НДС 20% включён</option><option>НДС 0%</option><option>Без НДС</option></select></label>
                <label><span style={labelStyle}>Срок поставки</span><input aria-label="Срок поставки" value={quoteLeadTime} onChange={(event) => setQuoteLeadTime(event.target.value)} style={input} placeholder={selected.leadTimeDays ? selected.leadTimeDays + ' дней' : 'Уточнить'} /></label>
                <label><span style={labelStyle}>Условия оплаты</span><input aria-label="Условия оплаты" value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} style={input} /></label>
                <label><span style={labelStyle}>Условия поставки</span><input aria-label="Условия поставки" value={supplyTerms} onChange={(event) => setSupplyTerms(event.target.value)} style={input} /></label>
                <label><span style={labelStyle}>Предложение действительно до</span><input aria-label="Предложение действительно до" type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} style={input} /></label>
              </div>
              <p style={{ ...muted, marginTop: 22 }}>В итоговую сумму применяется режим «{vatTerms}». Черновик не является публичной офертой. Перед отправкой проверьте адресата, НДС, итоговую сумму, срок действия, документы, оплату и поставку.</p>
            </div>
            <div style={metrics}>
              <Metric label="Разница цены и затрат / т" value={comparableGross !== undefined ? money.format(comparableGross) + ' ₽' : vatTerms === 'НДС 20% включён' ? 'введите цену продажи' : 'приведите цены к одной базе НДС'} />
              <Metric label="Разница цены и затрат" value={quantity && comparableGross !== undefined ? money.format(comparableGross * quantity) + ' ₽' : vatTerms === 'НДС 20% включён' ? 'введите цену продажи' : 'приведите цены к одной базе НДС'} />
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
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 22 }
const noticeStyle: React.CSSProperties = { marginTop: 20, padding: 16, background: '#f7f9fa', borderRadius: 9, lineHeight: 1.6 }
const recommendation: React.CSSProperties = { marginTop: 22, padding: 18, border: '1px solid #cfe1de', borderRadius: 10, background: '#f7fbfa' }
const metrics: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '14px 0 20px' }
const pill: React.CSSProperties = { padding: '7px 10px', borderRadius: 999, background: '#e5f4f1', color: '#12645d', fontSize: 12, whiteSpace: 'nowrap' }
const input: React.CSSProperties = { marginTop: 5, width: '100%', boxSizing: 'border-box', border: '1px solid #ccd6dc', borderRadius: 7, padding: '10px 11px', fontSize: 15 }
const primary: React.CSSProperties = { marginTop: 22, border: 0, borderRadius: 8, padding: '12px 18px', background: '#0f6b72', color: '#fff', fontWeight: 700, cursor: 'pointer' }
const disabledButton: React.CSSProperties = { ...primary, background: '#d7dde1', color: '#6b7780', cursor: 'not-allowed' }
const secondary: React.CSSProperties = { marginTop: 22, border: '1px solid #cbd5db', borderRadius: 8, padding: '12px 18px', background: '#fff', fontWeight: 600, cursor: 'pointer' }
const th: React.CSSProperties = { textAlign: 'left', padding: '11px 8px', borderBottom: '1px solid #dfe5ea', color: '#607080', fontWeight: 600, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '12px 8px', borderBottom: '1px solid #edf0f2', verticalAlign: 'top', whiteSpace: 'nowrap' }

function button(active: boolean): React.CSSProperties {
  return { border: active ? '1px solid #0f6b72' : '1px solid #ccd6dc', background: active ? '#e7f4f2' : '#fff', borderRadius: 7, padding: '7px 10px', cursor: 'pointer' }
}
