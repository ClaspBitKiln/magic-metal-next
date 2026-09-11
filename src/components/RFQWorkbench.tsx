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
  evidenceUrl?: string
  evidenceNote?: string
}

type Decision = { offerId: string; score: number; landedCost: { total: number; currency: string }; reasons: string[]; risks: string[]; recommended: boolean }

type SearchResult = { offers?: Record<string, Offer[]>; decisions?: Record<string, Decision[]>; noRouteLines?: number[]; clarificationLines?: number[] }

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const requestText = 'Труба бесшовная; диам:219; стенка:10; сталь:09Г2С; количество:20 т; доставка:Ташкент'

export default function RFQWorkbench() {
  const [step, setStep] = useState<'request' | 'search' | 'quote'>('request')
  const [data, setData] = useState<SearchResult | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [sellingPrice, setSellingPrice] = useState('245000')
  const [notice, setNotice] = useState('')

  const offers = data?.offers?.['1'] ?? []
  const decisions = data?.decisions?.['1'] ?? []
  const recommended = decisions.find((d) => d.recommended)?.offerId || decisions[0]?.offerId || offers[0]?.id
  const selectedIdFinal = selectedId || recommended || ''
  const selected = useMemo(() => offers.find((o) => o.id === selectedIdFinal) || offers[0], [offers, selectedIdFinal])
  const selectedDecision = decisions.find((d) => d.offerId === selected?.id)
  const landed = selectedDecision?.landedCost.total ?? selected?.price ?? 0
  const sell = Number(sellingPrice) || 0
  const gross = sell - landed

  async function runSearch() {
    setNotice('Ищу реальные объявления Metalinfo и нормализую найденные позиции…')
    try {
      const response = await fetch('/api/rfq-workbench/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: requestText }) })
      const result = await response.json() as SearchResult & { error?: string }
      if (!response.ok) throw new Error(result.error || 'Поиск не выполнен')
      setData(result)
      setSelectedId('')
      setStep('search')
      setNotice(`Найдено предложений: ${result.offers?.['1']?.length ?? 0}. Цены показываются только при привязке к локальному сегменту позиции.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Ошибка поиска')
    }
  }

  return <main style={{ minHeight: '100vh', background: '#f4f6f8', color: '#16202a', fontFamily: 'Arial, sans-serif' }}>
    <header style={{ background: '#fff', borderBottom: '1px solid #dfe5ea', padding: '18px 28px', display: 'flex', justifyContent: 'space-between' }}><div><div style={eyebrow}>Мэджик Металл</div><strong style={{ fontSize: 22 }}>RFQ Workbench</strong></div><div style={muted}>Внутренний контур · Production не изменяется</div></header>
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 28 }}><div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>{['request','search','quote'].map((s, i) => <div key={s} style={{ flex: 1, padding: 10, borderRadius: 8, background: step === s ? '#0f6b72' : '#e5eaee', color: step === s ? '#fff' : '#52616d', fontSize: 13 }}>{i + 1}. {s === 'request' ? 'Заявка' : s === 'search' ? 'Поиск и закупка' : 'КП'}</div>)}</div>
      {step === 'request' && <section style={card}><h1 style={{ margin: 0 }}>RFQ-1024</h1><p style={muted}>ООО «Альфа» · входящая заявка</p><div style={grid}><Field label="Позиция" value="Труба бесшовная 219×10 09Г2С"/><Field label="Количество" value="20 т"/><Field label="Доставка" value="Ташкент"/><Field label="Срок" value="30 дней"/></div><div style={notice}><b>Исходный запрос</b><br/>Нужна бесшовная труба 219×10 09Г2С, 20 тонн, доставка в Ташкент, срок до 30 дней.</div><button onClick={runSearch} style={primary}>🔎 Найти варианты</button>{notice && <p style={muted}>{notice}</p>}</section>}
      {step === 'search' && <section style={card}><div style={{display:'flex',justifyContent:'space-between'}}><div><h2 style={{margin:0}}>Реальные найденные варианты</h2><p style={muted}>Metalinfo → нормализация → Procurement Engine</p></div><span style={pill}>{offers.length} предложений</span></div><div style={{overflowX:'auto',marginTop:18}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['Вариант','Поставщик','Цена','Тоннаж','Город','Срок','Наличие','Landed cost','Уверенность','Доказательство',''].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{offers.map(o=>{const d=decisions.find(x=>x.offerId===o.id); return <tr key={o.id} style={{background:o.id===selectedIdFinal?'#f2f8f7':'#fff'}}><td style={td}><b>{o.id}</b><br/><span style={muted}>{o.product} {o.diameter}×{o.wall} {o.grade}</span></td><td style={td}>{o.supplierId}</td><td style={td}>{o.price ? `${money.format(o.price)} ₽/т` : '—'}</td><td style={td}>{o.quantity ? `${o.quantity} ${o.unit || 'т'}` : 'не указано'}</td><td style={td}>{o.city || '—'}</td><td style={td}>{o.leadTimeDays ? `${o.leadTimeDays} дн.` : '—'}</td><td style={td}>{o.availability}</td><td style={td}><b>{d ? `${money.format(d.landedCost.total)} ₽/т` : '—'}</b></td><td style={td}>{Math.round(o.confidence*100)}%</td><td style={td}>{o.evidenceUrl ? <a href={o.evidenceUrl} target="_blank" rel="noreferrer">открыть</a> : '—'}</td><td style={td}><button onClick={()=>setSelectedId(o.id)} style={button(o.id===selectedIdFinal)}>Выбрать</button></td></tr>})}</tbody></table></div>{selected && <div style={recommendation}><b>Рекомендация: {selected.id}</b><p>{selectedDecision?.reasons?.join(' · ') || 'Выбрано по результату ранжирования.'}</p><div style={metrics}><Metric label="Landed cost" value={`${money.format(landed)} ₽/т`}/><Metric label="Цена закупки" value={selected.price ? `${money.format(selected.price)} ₽/т` : 'не определена'}/><Metric label="Наличие" value={selected.availability}/></div></div>}{notice && <p style={muted}>{notice}</p>}<button onClick={()=>setStep('quote')} style={primary} disabled={!selected}>Сформировать КП</button></section>}
      {step === 'quote' && selected && <section style={card}><h2>КП к проверке менеджером</h2><div style={{border:'1px solid #dfe5ea',borderRadius:10,padding:20}}><div style={muted}>Клиентская версия · внутренние источники скрыты</div><h3>Труба бесшовная 219×10 09Г2С</h3><div style={grid}><Field label="Количество" value="20 т"/><label><span style={labelStyle}>Цена продажи, ₽/т</span><input value={sellingPrice} onChange={e=>setSellingPrice(e.target.value)} style={input}/></label><Field label="Итого" value={`${money.format(sell*20)} ₽`}/><Field label="Срок" value={selected.leadTimeDays ? `${selected.leadTimeDays}–${selected.leadTimeDays+2} дней` : 'уточнить'}/></div></div><div style={metrics}><Metric label="Валовая прибыль / т" value={`${money.format(gross)} ₽`}/><Metric label="Валовая прибыль" value={`${money.format(gross*20)} ₽`}/><Metric label="Статус" value="КП к проверке"/></div><button style={secondary} onClick={()=>setStep('search')}>← Назад к закупке</button></section>}
    </div></main>
}
function Field({label,value}:{label:string,value:string}){return <div><div style={labelStyle}>{label}</div><div style={{fontWeight:600,marginTop:6}}>{value}</div></div>}
function Metric({label,value}:{label:string,value:string}){return <div style={{background:'#f5f7f8',borderRadius:9,padding:13}}><div style={labelStyle}>{label}</div><b style={{display:'block',marginTop:5}}>{value}</b></div>}
const labelStyle:React.CSSProperties={fontSize:11,color:'#687985',textTransform:'uppercase',letterSpacing:.5}
const muted:React.CSSProperties={fontSize:13,color:'#607080'}
const eyebrow:React.CSSProperties={fontSize:12,letterSpacing:1.4,textTransform:'uppercase',color:'#607080'}
const card:React.CSSProperties={background:'#fff',border:'1px solid #dfe5ea',borderRadius:12,padding:24}
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginTop:22}
const notice:React.CSSProperties={marginTop:20,padding:16,background:'#f7f9fa',borderRadius:9,lineHeight:1.6}
const recommendation:React.CSSProperties={marginTop:22,padding:18,border:'1px solid #cfe1de',borderRadius:10,background:'#f7fbfa'}
const metrics:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,margin:'14px 0 20px'}
const pill:React.CSSProperties={padding:'7px 10px',borderRadius:999,background:'#e5f4f1',color:'#12645d',fontSize:12}
const input:React.CSSProperties={marginTop:5,width:'100%',boxSizing:'border-box',border:'1px solid #ccd6dc',borderRadius:7,padding:'10px 11px',fontSize:15}
const primary:React.CSSProperties={marginTop:22,border:0,borderRadius:8,padding:'12px 18px',background:'#0f6b72',color:'#fff',fontWeight:700,cursor:'pointer'}
const secondary:React.CSSProperties={border:'1px solid #cbd5db',borderRadius:8,padding:'12px 18px',background:'#fff',fontWeight:600,cursor:'pointer'}
const th:React.CSSProperties={textAlign:'left',padding:'11px 8px',borderBottom:'1px solid #dfe5ea',color:'#607080',fontWeight:600,whiteSpace:'nowrap'}
const td:React.CSSProperties={padding:'12px 8px',borderBottom:'1px solid #edf0f2',verticalAlign:'top',whiteSpace:'nowrap'}
function button(active:boolean):React.CSSProperties{return{border:active?'1px solid #0f6b72':'1px solid #ccd6dc',background:active?'#e7f4f2':'#fff',borderRadius:7,padding:'7px 10px',cursor:'pointer'}}
