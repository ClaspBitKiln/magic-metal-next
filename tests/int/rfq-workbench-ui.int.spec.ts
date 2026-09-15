import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import RFQWorkbench from '../../src/components/RFQWorkbench'

const field = (value: unknown) => ({ value, confidence: 'high' })
const item = (line: number) => ({
  line, originalText: 'Труба позиция ' + line, product: field('Труба'), diameter: field(219), wall: field(10),
  grade: field('09Г2С'), standard: field('ГОСТ 8732-78'), quantity: field(line === 1 ? 20000 : 5),
  unit: field(line === 1 ? 'кг' : 'т'), destination: field('Челябинск'),
})
const offer = { id: 'same-id', supplierId: 'Supplier', product: 'Труба', price: 100000, currency: 'RUB', unit: 't', match: 'exact', availability: 'unknown', evidenceStatus: 'needs-verification' }

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

async function search() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    rfq: { items: [item(1), item(2)] }, offers: { 1: [offer], 2: [{ ...offer }] },
  }) }))
  render(createElement(RFQWorkbench))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Труба 219×10 09Г2С ГОСТ 8732-78, 20 т' } })
  fireEvent.click(screen.getByRole('button', { name: /Найти варианты/ }))
  await screen.findByRole('combobox')
}

function fillReview() {
  fireEvent.change(screen.getByLabelText('Цена с НДС, ₽/т'), { target: { value: '100000' } })
  fireEvent.change(screen.getByLabelText('Доступно, т'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('Расходы на партию, ₽'), { target: { value: '100000' } })
  fireEvent.click(screen.getByRole('checkbox'))
}

describe('RFQ workbench manager flow', () => {
  it('keeps quote blocked until terms are checked and invalidates a check after editing', async () => {
    await search()
    const quote = screen.getByRole('button', { name: 'Сформировать КП' }) as HTMLButtonElement
    expect(quote.disabled).toBe(true)
    fillReview()
    expect(quote.disabled).toBe(false)
    fireEvent.change(screen.getByLabelText('Доступно, т'), { target: { value: '18' } })
    expect(quote.disabled).toBe(true)
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false)
  })
  it('isolates reviews across RFQ lines even when an offer ID repeats', async () => {
    await search()
    fillReview()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } })
    expect((screen.getByLabelText('Цена с НДС, ₽/т') as HTMLInputElement).value).toBe('')
    expect((screen.getByRole('button', { name: 'Сформировать КП' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } })
    expect((screen.getByLabelText('Цена с НДС, ₽/т') as HTMLInputElement).value).toBe('100000')
  })
  it('uses tonnes in the quote total and requires a real selling price', async () => {
    await search()
    fillReview()
    fireEvent.click(screen.getByRole('button', { name: 'Сформировать КП' }))
    expect(screen.getByText('20 т')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Цена продажи с НДС, ₽/т'), { target: { value: '120000' } })
    expect(screen.getByText(text => text.replace(/\s/g, '') === '2400000₽')).toBeTruthy()
  })
})
