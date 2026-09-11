'use client'

import { useMemo, useState } from 'react'

type Offer = {
  id: string
  source: string
  product: string
  match: string
  purchase: number
  logistics: number
  landed: number
  leadTime: number
  availability: string
  risk: 'low' | 'medium'
}

const demoOffers: Offer[] = [
  { id: 'O-01', source: 'Источник A', product: 'Труба бесшовная 219×10 09Г2С', match: '100%', purchase: 180000, logistics: 35000, landed: 215000, leadTime: 8, availability: 'В наличии', risk: 'low' },
  { id: 'O-02', source: 'Источник B', product: 'Труба бесшовная 219×10 09Г2С', match: '100%', purchase: 175000, logistics: 52000, landed: 227000, leadTime: 12, availability: 'В наличии', risk: 'medium' },
  { id: 'O-03', source: 'Источник C', product: 'Труба бесшовная 219×10 09Г2С', match: '100%', purchase: 168000, logistics: 70000, landed: 238000, leadTime: 18, availability: 'Под заказ', risk: 'medium' },
]

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export default function RFQWorkbench() {
  const [step, setStep] = useState<'request' | 'search' | 'quote'>('request')
  const [selectedOffer, setSelectedOffer] = useState('O-01')
  const [sellingPrice, setSellingPrice] = useState('245000')
  const [result, setResult] = useState('')

  const selected = useMemo(() => demoOffers.find((offer) => offer.id === selectedOffer) || demoOffers[0], [selectedOffer])
  const gross = Number(sellingPrice || 0) - selected.landed
  const total = Number(sellingPrice || 0) * 20
  const grossTotal = gross * 20

  function runSearch() {
    setResult('')
    setStep('search')
  }

  function buildQuote() {
    setStep('quote')
    setResult('КП подготовлено к проверке менеджером')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f4f6f8', color: '#16202a', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #dfe5ea', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: '#607080' }}>Мэджик Металл</div>
          <strong style={{ fontSize: 22 }}>RFQ Workbench</strong>
        </div>
        <div style={{ fontSize: 13, color: '#607080' }}>Тестовый контур · клиентский сайт не изменяется</div>
      </header>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 22 }}>
          <section>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {(['request', 'search', 'quote'] as const).map((item, index) => (
                <div key={item} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: step === item ? '#0f6b72' : '#e5eaee', color: step === item ? '#fff' : '#52616d', fontSize: 13 }}>
                  {index + 1}. {item === 'request' ? 'Заявка' : item === 'search' ? 'Поиск и закупка' : 'КП'}
                </div>
              ))}
            </div>

            {step === 'request' && (
              <div style={{ background: '#fff', border: '1px solid #dfe5ea', borderRadius: 12, padding: 24 }}>
                <h1 style={{ margin: 0, fontSize: 26 }}>RFQ-1024</h1>
                <p style={{ color: '#607080', marginTop: 7 }}>ООО «Альфа» · входящая заявка</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 22 }}>
                  <Field label="Позиция" value="Труба бесшовная 219×10 09Г2С" />
                  <Field label="Количество" value="20 т" />
                  <Field label="Доставка" value="Ташкент" />
                  <Field label="Срок" value="30 дней" />
                  <Field label="Стандарт" value="ГОСТ / уточнить по спецификации" />
                  <Field label="Документы" value="specification.xlsx" />
                </div>
                <div style={{ marginTop: 20, padding: 16, background: '#f7f9fa', borderRadius: 9, fontSize: 14, lineHeight: 1.6 }}>
                  <strong>Исходный запрос</strong><br />Нужна бесшовная труба 219×10 09Г2С, 20 тонн, доставка в Ташкент, срок до 30 дней.
                </div>
                <button onClick={runSearch} style={primary}>🔎 Найти варианты</button>
              </div>
            )}

            {step === 'search' && (
              <div style={{ background: '#fff', border: '1px solid #dfe5ea', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><h2 style={{ margin: 0 }}>Найденные варианты</h2><p style={{ color: '#607080' }}>Сравнение по полной экономике поставки</p></div>
                  <span style={{ padding: '7px 10px', borderRadius: 999, background: '#e5f4f1', color: '#12645d', fontSize: 12 }}>Поиск завершён</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr>{['Вариант', 'Соответствие', 'Закупка', 'Логистика', 'Landed cost', 'Срок', 'Наличие', 'Риск', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>{demoOffers.map((offer) => <tr key={offer.id} style={{ background: selectedOffer === offer.id ? '#f2f8f7' : '#fff' }}>
                      <td style={td}><strong>{offer.id}</strong><br /><span style={{ color: '#607080' }}>{offer.source}</span></td>
                      <td style={td}>{offer.match}</td>
                      <td style={td}>{money.format(offer.purchase)} ₽/т</td>
                      <td style={td}>{money.format(offer.logistics)} ₽/т</td>
                      <td style={td}><strong>{money.format(offer.landed)} ₽/т</strong></td>
                      <td style={td}>{offer.leadTime} дн.</td>
                      <td style={td}>{offer.availability}</td>
                      <td style={td}>{offer.risk === 'low' ? '🟢 Низкий' : '🟡 Проверить'}</td>
                      <td style={td}><button onClick={() => setSelectedOffer(offer.id)} style={offerButton(selectedOffer === offer.id)}>Выбрать</button></td>
                    </tr>)}</tbody>
                  </table>
                </div>
                <div style={{ marginTop: 22, padding: 18, border: '1px solid #cfe1de', borderRadius: 10, background: '#f7fbfa' }}>
                  <strong>Рекомендация системы: {selected.id}</strong>
                  <p style={{ margin: '8px 0', lineHeight: 1.6 }}>Лучший текущий вариант по совокупности landed cost, срока, наличия и риска. Перед отправкой КП требуется коммерческое подтверждение менеджера.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <Metric label="Landed cost" value={`${money.format(selected.landed)} ₽/т`} />
                    <Metric label="Срок" value={`${selected.leadTime} дней`} />
                    <Metric label="Количество" value="20 т" />
                  </div>
                </div>
                <button onClick={buildQuote} style={primary}>Сформировать КП</button>
              </div>
            )}

            {step === 'quote' && (
              <div style={{ background: '#fff', border: '1px solid #dfe5ea', borderRadius: 12, padding: 24 }}>
                <h2 style={{ marginTop: 0 }}>КП к отправке</h2>
                <div style={{ border: '1px solid #dfe5ea', borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 12, color: '#607080' }}>Клиентская версия — внутренние источники скрыты</div>
                  <h3>Труба бесшовная 219×10 09Г2С</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Количество" value="20 т" />
                    <label style={{ display: 'block' }}><span style={labelStyle}>Цена продажи, ₽/т</span><input value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} style={input} /></label>
                    <Field label="Итого" value={`${money.format(total)} ₽`} />
                    <Field label="Срок" value={`${selected.leadTime}–${selected.leadTime + 2} дней`} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 18 }}>
                  <Metric label="Валовая прибыль / т" value={`${money.format(gross)} ₽`} />
                  <Metric label="Валовая прибыль" value={`${money.format(grossTotal)} ₽`} />
                  <Metric label="Статус" value="Готово к проверке" />
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                  <button style={primary} onClick={() => setResult('КП отправлено в тестовом режиме')}>Отправить КП</button>
                  <button style={secondary} onClick={() => setStep('search')}>Назад к закупке</button>
                </div>
                {result && <div style={{ marginTop: 14, padding: 12, background: '#edf7f3', borderRadius: 8, color: '#1c6254' }}>{result}</div>}
              </div>
            )}
          </section>

          <aside style={{ background: '#17242d', color: '#fff', borderRadius: 12, padding: 22, alignSelf: 'start' }}>
            <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: '#a8bac4' }}>Внутренний контур</div>
            <h3 style={{ margin: '8px 0 18px' }}>Что система делает за менеджера</h3>
            <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.8, fontSize: 14, color: '#d8e1e6' }}>
              <li>разбирает RFQ;</li>
              <li>определяет Product Identity;</li>
              <li>ищет реальные маршруты закупки;</li>
              <li>нормализует предложения;</li>
              <li>считает landed cost;</li>
              <li>сравнивает single-source и split;</li>
              <li>оценивает риск и срок;</li>
              <li>готовит клиентское КП.</li>
            </ul>
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #33444f', fontSize: 12, color: '#a8bac4', lineHeight: 1.6 }}>Поставщики, закупочные цены, маржа и внутренние оценки не попадают в клиентский документ.</div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><div style={labelStyle}>{label}</div><div style={{ fontWeight: 600, paddingTop: 6 }}>{value}</div></div>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div style={{ background: '#f5f7f8', borderRadius: 9, padding: 13 }}><div style={labelStyle}>{label}</div><strong style={{ display: 'block', marginTop: 5 }}>{value}</strong></div>
}

const labelStyle: React.CSSProperties = { fontSize: 11, color: '#687985', textTransform: 'uppercase', letterSpacing: .5 }
const input: React.CSSProperties = { marginTop: 5, width: '100%', boxSizing: 'border-box', border: '1px solid #ccd6dc', borderRadius: 7, padding: '10px 11px', fontSize: 15 }
const primary: React.CSSProperties = { marginTop: 22, border: 0, borderRadius: 8, padding: '12px 18px', background: '#0f6b72', color: '#fff', fontWeight: 700, cursor: 'pointer' }
const secondary: React.CSSProperties = { border: '1px solid #cbd5db', borderRadius: 8, padding: '12px 18px', background: '#fff', color: '#263640', fontWeight: 600, cursor: 'pointer' }
const th: React.CSSProperties = { textAlign: 'left', padding: '11px 8px', borderBottom: '1px solid #dfe5ea', color: '#607080', fontWeight: 600, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '12px 8px', borderBottom: '1px solid #edf0f2', verticalAlign: 'top', whiteSpace: 'nowrap' }
function offerButton(active: boolean): React.CSSProperties { return { border: active ? '1px solid #0f6b72' : '1px solid #ccd6dc', background: active ? '#e7f4f2' : '#fff', color: '#16323a', borderRadius: 7, padding: '7px 10px', cursor: 'pointer' } }
