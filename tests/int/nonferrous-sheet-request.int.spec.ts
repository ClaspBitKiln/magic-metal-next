import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import NonferrousRequestPicker from '@/components/NonferrousRequestPicker'

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  window.history.replaceState(null, '', '/')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  window.history.replaceState(null, '', '/')
  vi.unstubAllGlobals()
})
function render(productSlug: string) {
  act(() => root.render(createElement(NonferrousRequestPicker, { productSlug, requestHref: '/?product=Материал#request' })))
}
function chooseShape(value: string) {
  const radio = [...container.querySelectorAll<HTMLInputElement>('input[type=radio]')].find(input => input.value === value)!
  act(() => radio.click())
}
function field(label: string) {
  const node = [...container.querySelectorAll('label')].find(node => [...node.childNodes]
    .filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent).join('').trim() === label)
  if (!node) throw new Error(`Missing field: ${label}`)
  return node.querySelector<HTMLInputElement | HTMLSelectElement>('input,select')!
}
function change(input: HTMLInputElement | HTMLSelectElement, value: string) {
  act(() => {
    const prototype = input.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLSelectElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event(input.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }))
  })
}
function request() {
  const href = container.querySelector<HTMLAnchorElement>('.nonferrous-submit')!.getAttribute('href')!
  const url = new URL(href, 'https://magicmet.ru')
  expect(url.hash).toBe('#request')
  return url.searchParams.get('product')!
}

describe('concise nonferrous and stainless sheet selection', () => {
  it('opens sheet inputs immediately only on the dedicated stainless sheet page', () => {
    render('list')
    expect(container.querySelector<HTMLInputElement>('input[value="Лист"]')?.checked).toBe(true)
    expect(field('Толщина, мм').value).toBe('')
    expect(field('Раскрой, мм').value).toBe('')
    act(() => root.unmount())
    root = createRoot(container)
    render('med')
    expect(container.querySelector('input[type=radio]:checked')).toBeNull()
    expect(container.querySelector('.nonferrous-fields')?.children.length).toBe(0)
  })

  it.each([
    ['med', 'Лист'], ['latun', 'Лист'], ['bronza', 'Лист'], ['alyuminij', 'Лист'],
    ['alyuminij', 'Плита'], ['titan', 'Лист'], ['svinec', 'Лист'], ['cink', 'Лист'], ['list', 'Лист'],
  ])('%s %s asks for thickness and a free cut without adding universal formats', (slug, shape) => {
    render(slug)
    chooseShape(shape)
    const dimensions = [...container.querySelectorAll('.nonferrous-fields > label')].slice(0, 2)
    expect(dimensions.map(label => label.firstChild?.textContent)).toEqual(['Толщина, мм', 'Раскрой, мм'])
    expect(container.querySelector('.nonferrous-fields')?.children.length).toBe(2)
    expect(field('Количество').closest('details')?.classList.contains('nonferrous-sheet-extra')).toBe(true)
    expect(field('Раскрой, мм').value).toBe('')
    expect(request()).not.toMatch(/1500|2000|6000/)
    change(field('Толщина, мм'), '1.5')
    change(field('Раскрой, мм'), '1234×2345')
    change(field('Количество'), '0')
    expect(request()).toContain(`${shape}; толщина 1,5 мм; раскрой 1234×2345 мм`)
    expect(request()).toContain('количество 0 кг')
    expect(request()).not.toContain('остальные размеры уточнить')
    expect(container.querySelector('.nonferrous-advanced')?.hasAttribute('open')).toBe(false)
    expect(container.querySelector('.nonferrous-standards')?.hasAttribute('open')).toBe(false)
  })

  it('keeps a linked color-sheet kind selected and preserves the current URL contract', () => {
    window.history.replaceState(null, '', '/?kind=sheet#selection')
    render('med')
    expect(container.querySelector<HTMLInputElement>('input[value="Лист"]')?.checked).toBe(true)
    change(field('Толщина, мм'), '2')
    change(field('Раскрой, мм'), '1000×2000')
    expect(request()).toContain('Лист; толщина 2 мм; раскрой 1000×2000 мм')
    chooseShape('Труба')
    expect(field('Наружный диаметр, мм').value).toBe('')
    expect(request()).not.toContain('1000×2000')
  })

  it('honors a linked stainless tape kind instead of the default sheet choice', () => {
    window.history.replaceState(null, '', '/?kind=strip#selection')
    render('list')
    expect(container.querySelector<HTMLInputElement>('input[value="Лента"]')?.checked).toBe(true)
    expect(field('Толщина, мм').value).toBe('')
    expect(field('Ширина, мм').value).toBe('')
    expect(container.querySelector('.nonferrous-sheet-extra')).toBeNull()
  })

  it('retains each main no-JavaScript shape request without treating it as a working interactive picker', () => {
    const html = renderToStaticMarkup(createElement(NonferrousRequestPicker, { productSlug: 'med', requestHref: '/?product=Материал#request' }))
    const fallback = [...html.matchAll(/<noscript>([\s\S]*?)<\/noscript>/g)].map(match => match[1]).find(value => value.includes('catalog-kind-fallback'))!
    expect(fallback).toBeDefined()
    const doc = new DOMParser().parseFromString(fallback, 'text/html')
    const sheet = [...doc.querySelectorAll('a')].find(link => link.textContent === 'Лист')!
    const request = new URL(sheet.getAttribute('href')!, 'https://magicmet.ru')
    expect(request.searchParams.get('product')).toBe('Материал; Лист; размеры уточнить')
    expect(request.hash).toBe('#request')
  })

  it('accepts incomplete dimensions and clears the cut when moving to another shape', () => {
    render('med')
    chooseShape('Лист')
    expect(request()).not.toContain('×')
    change(field('Раскрой, мм'), '1234')
    expect(request()).toContain('раскрой 1234 мм; остальные размеры уточнить')
    chooseShape('Труба')
    change(field('Наружный диаметр, мм'), '20')
    change(field('Толщина стенки, мм'), '2')
    change(field('Длина, мм (если известна)'), '3000')
    expect(request()).toContain('Труба Ø20×2×3000 мм')
    expect(request()).not.toContain('1234')
    chooseShape('Лист')
    expect(field('Раскрой, мм').value).toBe('')
    expect(field('Толщина, мм').value).toBe('')
  })

  it('retains optional grade and quantity when the cut changes or optional details close', () => {
    render('med')
    chooseShape('Лист')
    const details = container.querySelector<HTMLDetailsElement>('.nonferrous-sheet-extra')!
    act(() => { details.open = true })
    change(field('Марка металла / сплава'), 'М1')
    change(field('Количество'), '2.5')
    change(field('Единица'), 'т')
    change(field('Раскрой, мм'), '1000×2000')
    act(() => { details.open = false })
    change(field('Раскрой, мм'), '1200×2400')
    expect(request()).toContain('раскрой 1200×2400 мм')
    expect(request()).toContain('марка сплава М1')
    expect(request()).toContain('количество 2,5 т')
    chooseShape('Труба')
    expect(field('Количество').closest('details')).toBeNull()
    expect(container.querySelector('.nonferrous-sheet-extra')).toBeNull()
  })
})
