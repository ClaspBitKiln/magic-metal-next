import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import NonferrousRequestPicker from '@/components/NonferrousRequestPicker'

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(createElement(NonferrousRequestPicker, { productSlug: 'bronza', requestHref: '/?product=Бронза#request' })))
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})
function control(label: string) {
  const element = Array.from(container.querySelectorAll('label')).find(node => Array.from(node.childNodes)
    .filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent).join('').trim() === label)?.querySelector('select,input')
  if (!element) throw new Error(`Missing field: ${label}`)
  return element as HTMLInputElement | HTMLSelectElement
}
function change(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = element.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLSelectElement.prototype
  act(() => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event(element.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }))
  })
}
function chooseShape(value: string) {
  const radio = [...container.querySelectorAll<HTMLInputElement>('input[type=radio]')].find(n => n.value === value)!
  act(() => radio.click())
}
const requestLink = () => container.querySelector<HTMLAnchorElement>('.nonferrous-submit')

describe('bronze square and hexagonal bar requests', () => {
  it.each([
    ['Квадрат', 'Сторона, мм', 'Квадрат 20,5×20,5 мм'],
    ['Шестигранник', 'Размер под ключ, мм', 'Шестигранник под ключ 20,5 мм'],
  ])('can request %s using its correct dimension', (shape, label, designation) => {
    expect(requestLink()).not.toBeNull()
    chooseShape(shape)
    expect(requestLink()).not.toBeNull()
    change(control(label), '20.5')
    change(control('Марка металла / сплава'), 'БрАМц9-2')
    const url = new URL(requestLink()!.getAttribute('href')!, 'https://magicmet.ru')
    expect(url.pathname).toBe('/')
    expect(url.hash).toBe('#request')
    expect(url.searchParams.get('product')).toContain(designation)
    expect(url.searchParams.get('product')).toContain('марка сплава БрАМц9-2')
    expect(url.searchParams.get('product')).toContain('стандарт уточнить')
    expect(url.searchParams.get('product')).not.toContain('ГОСТ 1628')
    expect(control('ГОСТ / ТУ / ASTM').value).toBe('')
    expect(container.textContent).toContain('Наличие и возможность поставки уточняет менеджер')
  })

  it('clears dimensions when switching shapes and preserves arbitrary customer sizes', () => {
    chooseShape('Квадрат')
    change(control('Сторона, мм'), '20')
    change(control('Длина, мм (если известна)'), '1000')
    expect(requestLink()).not.toBeNull()
    chooseShape('Шестигранник')
    expect(control('Размер под ключ, мм').value).toBe('')
    expect(control('Длина, мм (если известна)').value).toBe('')
    expect(requestLink()).not.toBeNull()
    for (const size of ['0', '-2', 'abc']) {
      change(control('Размер под ключ, мм'), size)
      expect(requestLink()).not.toBeNull()
    }
    change(control('Размер под ключ, мм'), '16')
    const product = new URL(requestLink()!.getAttribute('href')!, 'https://magicmet.ru').searchParams.get('product')!
    expect(product).toContain('Шестигранник под ключ 16 мм')
    expect(product).not.toContain('20×20')
    expect(product).not.toContain('длина 1000')
  })
})

