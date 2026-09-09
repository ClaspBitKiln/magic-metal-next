'use client'

import { useMemo, useState } from 'react'
import {
  calculateDeal,
  type DealInput,
  type MarketOffer,
  type PricingMethod,
  type QuoteSource,
} from '@/lib/dealQuoteEngine'
import './deal-calculation-dashboard.css'

type UiLine = DealInput['lines'][number] & {
  freight: number
  basePurchase: number
  offers: MarketOffer[]
  saleOverride?: number
}

const initialLines: UiLine[] = [
  {
    id: 1,
    name: 'Труба бесшовная 219×8, ст.20, ГОСТ 8732',
    unit: 'т',
    quantity: 21,
    productKey: 'pipe-219-8-st20-gost8732',
    basePurchase: 85000,
    freight: 3000,
    offers: [
      { source: 'Рынок', price: 82500, location: 'Воронеж', leadDays: 4, loadingPoint: 'Воронеж', observedAt: '2026-09-09' },
      { source: 'Рынок', price: 84300, location: 'Подольск', leadDays: 3, loadingPoint: 'Подольск', observedAt: '2026-09-09' },
    ],
  },
  {
    id: 2,
    name: 'Лист горячекатаный 40×1500×6000, 09Г2С',
    unit: 'т',
    quantity: 8.565,
    productKey: 'sheet-40-1500-6000-09g2s',
    basePurchase: 80500,
    freight: 2600,
    offers: [
      { source: 'Рынок', price: 79200, location: 'Тула', leadDays: 3, loadingPoint: 'Тула', observedAt: '2026-09-09' },
    ],
  },
  {
    id: 3,
    name: 'Лист нержавеющий 12Х18Н10Т 6×1500×3000',
    unit: 'т',
    quantity: 7,
    productKey: 'sheet-12x18n10t-6-1500-3000',
    basePurchase: 345000,
    freight: 5200,
    offers: [
      { source: 'Рынок', price: 338000, location: 'Екатеринбург', leadDays: 7, loadingPoint: 'Екатеринбург', observedAt: '2026-09-09' },
    ],
  },
]

const referencePrices = initialLines.map((line) => ({
  productKey: line.productKey!,
  price: line.basePurchase,
  unit: line.unit,
  source: 'METALLSERVICE' as QuoteSource,
  observedAt: '2026-09-09',
  location: 'Москва',
  supplierName: 'Металлсервис',
  loadingPoint: 'Москва',
  leadDays: 2,
}))

const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`
const percent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`

export default function DealCalculationDashboard() {
  const [mode, setMode] = useState<'rf' | 'export'>('rf')
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>('markup')
  const [pricingValue, setPricingValue] = useState(15)
  const [vatRate, setVatRate] = useState(0.22)
  const [expandedId, setExpandedId] = useState<number | string | null>(null)
  const [showQuote, setShowQuote] = useState(false)
  const [saleOverrides, setSaleOverrides] = useState<Record<string, number>>({})
  const [lines] = useState<UiLine[]>(initialLines)

  const calculation = useMemo(() => calculateDeal({
    mode,
    lines,
    referencePrices,
    freightPerUnit: Object.fromEntries(lines.map((line) => [String(line.id), line.freight])),
    marketOffers: Object.fromEntries(lines.map((line) => [String(line.id), line.offers])),
    pricing: { method: pricingMethod, value: pricingValue, vatRate },
    fixedExpenses: { handling: 0, customs: 0, st1: 0, other: 0 },
  }), [lines, mode, pricingMethod, pricingValue, vatRate])

  const viewLines = calculation.lines.map((line) => ({
    ...line,
    salePrice: saleOverrides[String(line.id)] ?? line.salePrice,
  }))
  const displaySaleTotal = viewLines.reduce((sum, line) => sum + (line.salePrice ?? 0) * line.quantity, 0)
  const displayProfit = displaySaleTotal - calculation.costTotal
  const displayMargin = displaySaleTotal > 0 ? (displayProfit / displaySaleTotal) * 100 : 0

  const applyGlobalPricing = () => setSaleOverrides({})

  return (
    <main className="deal-dashboard">
      <section className="deal-shell">
        <header className="deal-header">
          <div>
            <span className="eyebrow">КОММЕРЧЕСКИЙ ДАШБОРД</span>
            <h1>План расчёт по сделке</h1>
            <p>Заявка № MM-2026-0148 · автоматическая база закупа: Металлсервис</p>
          </div>
          <div className="deal-mode" role="group" aria-label="Тип сделки">
            <button className={mode === 'rf' ? 'active' : ''} onClick={() => setMode('rf')}>РФ</button>
            <button className={mode === 'export' ? 'active' : ''} onClick={() => setMode('export')}>Экспорт</button>
          </div>
        </header>

        <section className="deal-kpis" aria-label="Сводка сделки">
          <div><small>Продажа план</small><strong>{money(displaySaleTotal)}</strong></div>
          <div><small>Себестоимость план</small><strong>{money(calculation.costTotal)}</strong></div>
          <div className="kpi-profit"><small>Прибыль план</small><strong>{money(displayProfit)}</strong><em>{percent(displayMargin)} маржа</em></div>
          <div><small>Комплектование</small><strong>{calculation.supplierCount || 1} поставщик</strong><em>{calculation.loadingPointCount || 1} точка · до {calculation.maxLeadDays || 2} дней</em></div>
        </section>

        {calculation.cheaperLineCount > 0 && (
          <section className="deal-alert">
            <div>
              <strong>⚡ Есть цены ниже Металлсервиса</strong>
              <span>{calculation.cheaperLineCount} позиции · потенциал экономии {money(calculation.potentialSaving)}</span>
            </div>
          </section>
        )}

        <section className="deal-table-wrap">
          <table className="deal-table">
            <thead><tr><th className="num">№</th><th>Наименование по заявке</th><th>Ед.</th><th>Кол-во</th><th>Закуп</th><th>Продажа</th><th>Прибыль план</th><th>Статус</th></tr></thead>
            <tbody>
              {viewLines.map((line) => {
                const cheaper = line.cheaperMarketPrice !== null
                const lineSales = (line.salePrice ?? 0) * line.quantity
                const lineProfit = lineSales - line.lineCost
                return <>
                  <tr key={line.id}>
                    <td className="num">{line.id}</td>
                    <td className="name-cell">
                      <button className="line-name" onClick={() => setExpandedId(expandedId === line.id ? null : line.id)}>{line.name}</button>
                      <div className="line-meta">
                        <span>Металлсервис {line.selectedPurchase ? money(line.selectedPurchase) : '—'}</span>
                        {cheaper && <span className="cheaper">⚡ ниже {money(line.cheaperMarketPrice!)}</span>}
                        <span>· {line.marketOffers.length} предлож.</span>
                        <span>· {line.selectedLoadingPoint || 'точка уточняется'}</span>
                        <span>· {line.selectedLeadDays ?? '—'} дн.</span>
                      </div>
                      {expandedId === line.id && <div className="offers-popover">
                        <div className="offer-header"><strong>Варианты закупки</strong><span>автоматическая база — Металлсервис</span></div>
                        <button className="selected"><span>Металлсервис · {line.selectedLocation || 'Москва'}</span><strong>{money(line.referencePurchase ?? 0)}</strong><small>база КП</small></button>
                        {line.marketOffers.map((offer, index) => <button key={`${offer.source}-${index}`} onClick={() => setSaleOverrides((current) => ({ ...current }))}>
                          <span>{offer.source} · {offer.location}</span><strong>{money(offer.price)}</strong><small>{offer.leadDays} дн. · {offer.loadingPoint}</small>
                        </button>)}
                        <div className="control-hint">Дешёвая цена — сигнал менеджеру. Переключение закупа выполняется после проверки поставщика.</div>
                      </div>}
                    </td>
                    <td>{line.unit}</td>
                    <td>{line.quantity.toLocaleString('ru-RU')}</td>
                    <td><strong>{money(line.selectedPurchase ?? 0)}</strong></td>
                    <td><input className="money-input" value={Math.round(line.salePrice ?? 0)} onChange={(event) => setSaleOverrides((current) => ({ ...current, [String(line.id)]: Number(event.target.value.replace(/\D/g, '')) || 0 }))} /></td>
                    <td className="profit-cell"><strong>{money(lineProfit)}</strong></td>
                    <td><span className={`line-status ${cheaper ? 'warning' : 'ok'}`}>{cheaper ? 'есть дешевле' : 'база'}</span></td>
                  </tr>
                </>
              })}
            </tbody>
          </table>
        </section>

        <section className="deal-controls">
          <div className="control-card">
            <div className="control-title"><strong>Цена продажи</strong><span>{mode === 'export' ? 'Экспорт' : 'РФ'}</span></div>
            <div className="pricing-options">
              <select value={pricingMethod} onChange={(event) => { setPricingMethod(event.target.value as PricingMethod); applyGlobalPricing() }}>
                <option value="markup">Наценка %</option>
                <option value="fixed">Конкретная цена</option>
                <option value="planned-profit">Прибыль план</option>
                {mode === 'export' && <><option value="vat-full">100% НДС</option><option value="vat-percent">% от НДС</option><option value="profit-fixed">Конкретная сумма прибыли</option></>}
              </select>
              <label><input type="number" value={pricingValue} onChange={(event) => { setPricingValue(Number(event.target.value) || 0); setSaleOverrides({}) }} /> {pricingMethod.includes('vat') && pricingMethod !== 'vat-full' ? '%' : pricingMethod === 'markup' ? '%' : '₽'}</label>
              {pricingMethod === 'vat-full' && <button className="apply-button" onClick={() => { setPricingValue(100); setSaleOverrides({}) }}>Применить 100% НДС</button>}
            </div>
            <div className="control-hint">По умолчанию КП считается от цены Металлсервиса. Ручное изменение цены продажи разрешено для любой строки.</div>
          </div>
          <div className="control-card compact">
            <div className="control-title"><strong>Расходы</strong><span>дополнительные — по сделке</span></div>
            <div className="expense-row"><span>Закуп товара</span><strong>{money(calculation.purchaseTotal)}</strong></div>
            <div className="expense-row"><span>Доставка по позициям</span><strong>{money(calculation.variableFreightTotal)}</strong></div>
            <div className="expense-row"><span>НДС входной</span><strong>{money(calculation.inputVat)}</strong></div>
            <details><summary>ПРР · Таможня · СТ-1 · Прочие</summary><div className="expense-detail">Вводятся по конкретной сделке. Значения входят в себестоимость и пересчитывают Прибыль план.</div></details>
          </div>
        </section>

        <footer className="deal-footer">
          <div><span>План расчёт по сделке</span><strong>{money(displayProfit)} · {percent(displayMargin)} маржа</strong></div>
          <button className="primary-action" onClick={() => setShowQuote(true)}>Сформировать КП ↗</button>
        </footer>
      </section>

      {showQuote && <div className="quote-preview-backdrop" role="dialog" aria-modal="true" aria-label="Предпросмотр КП">
        <section className="quote-preview">
          <header><div><span>ПРЕДПРОСМОТР</span><h2>Коммерческое предложение</h2><p>Формируется из текущего «План расчёт по сделке»</p></div><button onClick={() => setShowQuote(false)} aria-label="Закрыть">×</button></header>
          <div className="quote-letter"><strong>ООО «Мэджик Металл»</strong><span>Коммерческое предложение № MM-2026-0148</span><p>В ответ на Ваш запрос предлагаем к поставке следующий металлопрокат.</p>
            <table><thead><tr><th>№</th><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead><tbody>
              {viewLines.map((line) => <tr key={line.id}><td>{line.id}</td><td>{line.name}</td><td>{line.quantity.toLocaleString('ru-RU')} {line.unit}</td><td>{money(line.salePrice ?? 0)}/{line.unit}</td><td>{money((line.salePrice ?? 0) * line.quantity)}</td></tr>)}
            </tbody><tfoot><tr><td colSpan={4}>ИТОГО КП</td><td>{money(displaySaleTotal)}</td></tr></tfoot></table>
            <div className="quote-terms"><p><strong>Условия поставки:</strong> доставка до адреса клиента.</p><p><strong>Срок:</strong> до {calculation.maxLeadDays || 2} дней, точный срок подтверждается при размещении заказа.</p><p><strong>Цена:</strong> формируется автоматически по плану сделки и подтверждается менеджером.</p></div>
          </div>
          <footer><button onClick={() => window.print()}>Печать / PDF</button><button className="primary-action" onClick={() => setShowQuote(false)}>Вернуться к расчёту</button></footer>
        </section>
      </div>}
    </main>
  )
}
