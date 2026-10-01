'use client'

import { useMemo, useState } from 'react'
import './deal-calculation-dashboard.css'

type MarketOffer = {
  source: string
  price: number
  location: string
  leadDays: number
  loadingPoint: string
}

type DealLine = {
  id: number
  name: string
  unit: 'т' | 'шт.' | 'м'
  quantity: number
  basePurchase: number
  selectedPurchase: number
  salePrice: number
  freight: number
  offers: MarketOffer[]
  suppliers: number
  loadingPoints: number
  leadDays: number
  expanded?: boolean
}

type Mode = 'rf' | 'export'
type PricingMethod = 'markup' | 'fixed' | 'planned-profit' | 'vat-full' | 'vat-percent' | 'profit-fixed'

const initialLines: DealLine[] = [
  {
    id: 1,
    name: 'Труба бесшовная 219×8, ст.20, ГОСТ 8732',
    unit: 'т',
    quantity: 21,
    basePurchase: 85000,
    selectedPurchase: 85000,
    salePrice: 97900,
    freight: 3000,
    suppliers: 1,
    loadingPoints: 1,
    leadDays: 2,
    offers: [
      { source: 'Металлсервис', price: 85000, location: 'Москва', leadDays: 2, loadingPoint: 'Москва' },
      { source: 'Рыночное предложение', price: 82500, location: 'Воронеж', leadDays: 4, loadingPoint: 'Воронеж' },
      { source: 'Рыночное предложение', price: 84300, location: 'Подольск', leadDays: 3, loadingPoint: 'Подольск' },
    ],
  },
  {
    id: 2,
    name: 'Лист горячекатаный 40×1500×6000, 09Г2С',
    unit: 'т',
    quantity: 8.565,
    basePurchase: 80500,
    selectedPurchase: 80500,
    salePrice: 92000,
    freight: 2600,
    suppliers: 1,
    loadingPoints: 1,
    leadDays: 1,
    offers: [
      { source: 'Металлсервис', price: 80500, location: 'Москва', leadDays: 1, loadingPoint: 'Москва' },
      { source: 'Рыночное предложение', price: 79200, location: 'Тула', leadDays: 3, loadingPoint: 'Тула' },
    ],
  },
  {
    id: 3,
    name: 'Лист нержавеющий 12Х18Н10Т 6×1500×3000',
    unit: 'т',
    quantity: 7,
    basePurchase: 345000,
    selectedPurchase: 345000,
    salePrice: 390000,
    freight: 5200,
    suppliers: 1,
    loadingPoints: 1,
    leadDays: 3,
    offers: [
      { source: 'Металлсервис', price: 345000, location: 'Москва', leadDays: 3, loadingPoint: 'Москва' },
      { source: 'Рыночное предложение', price: 338000, location: 'Екатеринбург', leadDays: 7, loadingPoint: 'Екатеринбург' },
    ],
  },
]

const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`
const percent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`

export default function DealCalculationDashboard() {
  const [mode, setMode] = useState<Mode>('rf')
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>('markup')
  const [markup, setMarkup] = useState(15)
  const [fixedSale, setFixedSale] = useState(5100000)
  const [plannedProfit, setPlannedProfit] = useState(670000)
  const [vatPercent, setVatPercent] = useState(70)
  const [lines, setLines] = useState(initialLines)

  const summary = useMemo(() => {
    const purchase = lines.reduce((sum, line) => sum + line.selectedPurchase * line.quantity, 0)
    const freight = lines.reduce((sum, line) => sum + line.freight * line.quantity, 0)
    const sale = lines.reduce((sum, line) => sum + line.salePrice * line.quantity, 0)
    const cost = purchase + freight
    const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0
    const profit = sale - cost
    const suppliers = new Set(lines.map((line) => line.suppliers)).size
    const loadingPoints = new Set(lines.map((line) => line.loadingPoints)).size
    const maxLead = Math.max(...lines.map((line) => line.leadDays))
    const cheaperCount = lines.filter((line) => line.offers.some((offer) => offer.price < line.basePurchase)).length
    const cheapestSaving = lines.reduce((sum, line) => {
      const cheaper = Math.min(...line.offers.map((offer) => offer.price))
      return sum + Math.max(0, line.basePurchase - cheaper) * line.quantity
    }, 0)
    const inputVat = purchase * 0.2
    return { purchase, freight, sale, cost, margin, profit, suppliers, loadingPoints, maxLead, cheaperCount, cheapestSaving, inputVat }
  }, [lines])

  const recalculateSales = (method: PricingMethod, value?: number) => {
    const purchase = lines.reduce((sum, line) => sum + line.selectedPurchase * line.quantity, 0)
    const freight = lines.reduce((sum, line) => sum + line.freight * line.quantity, 0)
    const cost = purchase + freight
    const saleTotal = method === 'markup'
      ? cost * (1 + (value ?? markup) / 100)
      : method === 'fixed'
        ? value ?? fixedSale
        : method === 'planned-profit'
          ? cost + (value ?? plannedProfit)
          : method === 'vat-full'
            ? cost + purchase * 0.2
            : method === 'vat-percent'
              ? cost + purchase * 0.2 * ((value ?? vatPercent) / 100)
              : cost + (value ?? plannedProfit)
    const ratio = summary.sale > 0 ? saleTotal / summary.sale : 1
    setLines((current) => current.map((line) => ({ ...line, salePrice: line.salePrice * ratio })))
  }

  const chooseOffer = (lineId: number, offer: MarketOffer) => {
    setLines((current) => current.map((line) => line.id === lineId ? {
      ...line,
      selectedPurchase: offer.price,
      loadingPoints: 1,
      leadDays: offer.leadDays,
      suppliers: 1,
    } : line))
  }

  const cheaperLines = lines.filter((line) => line.offers.some((offer) => offer.price < line.basePurchase))

  return (
    <main className="deal-dashboard">
      <section className="deal-shell">
        <header className="deal-header">
          <div>
            <span className="eyebrow">КОММЕРЧЕСКИЙ ДАШБОРД</span>
            <h1>План расчёт по сделке</h1>
            <p>Заявка № MM-2026-0148 · Клиент: промышленное предприятие</p>
          </div>
          <div className="deal-mode" role="group" aria-label="Тип сделки">
            <button className={mode === 'rf' ? 'active' : ''} onClick={() => setMode('rf')}>РФ</button>
            <button className={mode === 'export' ? 'active' : ''} onClick={() => setMode('export')}>Экспорт</button>
          </div>
        </header>

        <section className="deal-kpis" aria-label="Сводка сделки">
          <div><small>Продажа план</small><strong>{money(summary.sale)}</strong></div>
          <div><small>Себестоимость план</small><strong>{money(summary.cost)}</strong></div>
          <div className="kpi-profit"><small>Прибыль план</small><strong>{money(summary.profit)}</strong><em>{percent(summary.margin)} маржа</em></div>
          <div><small>Комплектование</small><strong>{summary.suppliers} поставщика</strong><em>{summary.loadingPoints} точек · до {summary.maxLead} дней</em></div>
        </section>

        {cheaperLines.length > 0 && (
          <section className="deal-alert">
            <div><strong>⚡ Найдены цены ниже Металлсервиса</strong><span>{cheaperLines.length} из {lines.length} позиций · потенциальная экономия до {money(summary.cheapestSaving)}</span></div>
            <button onClick={() => cheaperLines.forEach((line) => chooseOffer(line.id, line.offers.reduce((a, b) => a.price < b.price ? a : b)))}>Применить самые дешёвые</button>
          </section>
        )}

        <section className="deal-table-wrap">
          <table className="deal-table">
            <thead>
              <tr>
                <th className="num">№</th>
                <th>Наименование по заявке</th>
                <th>Ед.</th>
                <th>Кол-во</th>
                <th>Закуп</th>
                <th>Продажа</th>
                <th>Прибыль план</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const bestMarket = Math.min(...line.offers.map((offer) => offer.price))
                const hasCheaper = bestMarket < line.basePurchase
                const lineCost = (line.selectedPurchase + line.freight) * line.quantity
                const lineSale = line.salePrice * line.quantity
                const lineProfit = lineSale - lineCost
                return (
                  <tr key={line.id}>
                    <td className="num">{line.id}</td>
                    <td className="name-cell">
                      <button className="line-name" onClick={() => setLines(current => current.map(item => item.id === line.id ? { ...item, expanded: !item.expanded } : item))}>{line.name}</button>
                      <div className="line-meta">
                        {hasCheaper && <span className="cheaper">⚡ дешевле {money(bestMarket)}</span>}
                        <span>{line.offers.length} предложения</span>
                        <span>· {line.loadingPoints} точка</span>
                        <span>· {line.leadDays} дн.</span>
                      </div>
                      {line.expanded && (
                        <div className="offers-popover">
                          {line.offers.map((offer, index) => <button key={`${offer.source}-${offer.location}-${index}`} className={offer.price === line.selectedPurchase ? 'selected' : ''} onClick={() => chooseOffer(line.id, offer)}>
                            <span>{offer.source} · {offer.location}</span>
                            <strong>{money(offer.price)}</strong>
                            <small>{offer.leadDays} дн. · {offer.loadingPoint}</small>
                          </button>)}
                        </div>
                      )}
                    </td>
                    <td>{line.unit}</td>
                    <td>{line.quantity.toLocaleString('ru-RU')}</td>
                    <td><strong>{money(line.selectedPurchase)}</strong></td>
                    <td><input className="money-input" value={Math.round(line.salePrice)} onChange={(event) => {
                      const next = Number(event.target.value.replace(/\D/g, '')) || 0
                      setLines(current => current.map(item => item.id === line.id ? { ...item, salePrice: next } : item))
                    }} /></td>
                    <td className="profit-cell"><strong>{money(lineProfit)}</strong></td>
                    <td><span className={`line-status ${hasCheaper ? 'warning' : 'ok'}`}>{hasCheaper ? 'есть дешевле' : 'база'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="deal-controls">
          <div className="control-card">
            <div className="control-title"><strong>Цена продажи</strong><span>{mode === 'export' ? 'Экспорт' : 'РФ'}</span></div>
            <div className="pricing-options">
              <select value={pricingMethod} onChange={(event) => setPricingMethod(event.target.value as PricingMethod)}>
                <option value="markup">Наценка %</option>
                <option value="fixed">Конкретная цена</option>
                <option value="planned-profit">Прибыль план</option>
                {mode === 'export' && <>
                  <option value="vat-full">100% НДС</option>
                  <option value="vat-percent">% от НДС</option>
                  <option value="profit-fixed">Конкретная сумма прибыли</option>
                </>}
              </select>
              {pricingMethod === 'markup' && <label><input type="number" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} onBlur={() => recalculateSales('markup', markup)} /> %</label>}
              {pricingMethod === 'fixed' && <label><input type="number" value={fixedSale} onChange={(e) => { setFixedSale(Number(e.target.value)); recalculateSales('fixed', Number(e.target.value)) }} /> ₽</label>}
              {(pricingMethod === 'planned-profit' || pricingMethod === 'profit-fixed') && <label><input type="number" value={plannedProfit} onChange={(e) => { setPlannedProfit(Number(e.target.value)); recalculateSales(pricingMethod, Number(e.target.value)) }} /> ₽</label>}
              {pricingMethod === 'vat-percent' && <label><input type="number" value={vatPercent} onChange={(e) => { setVatPercent(Number(e.target.value)); recalculateSales('vat-percent', Number(e.target.value)) }} /> % НДС</label>}
              {pricingMethod === 'vat-full' && <button className="apply-button" onClick={() => recalculateSales('vat-full')}>Применить 100% НДС</button>}
            </div>
            <div className="control-hint">Изменение одной цены продажи не меняет закупку. Источники и служебные детали остаются внутри менеджерского слоя.</div>
          </div>

          <div className="control-card compact">
            <div className="control-title"><strong>Расходы</strong><span>сворачиваемый блок</span></div>
            <div className="expense-row"><span>Закуп товара</span><strong>{money(summary.purchase)}</strong></div>
            <div className="expense-row"><span>Логистика</span><strong>{money(summary.freight)}</strong></div>
            <div className="expense-row"><span>НДС входной</span><strong>{money(summary.inputVat)}</strong></div>
            <details><summary>Дополнительные расходы</summary><div className="expense-detail">ПРР · Таможня · СТ-1 · Прочие — вводятся по сделке при необходимости.</div></details>
          </div>
        </section>

        <footer className="deal-footer">
          <div><span>План расчёт по сделке</span><strong>{money(summary.profit)} прибыль план</strong></div>
          <button className="primary-action">Сформировать КП ↗</button>
        </footer>
      </section>
    </main>
  )
}
