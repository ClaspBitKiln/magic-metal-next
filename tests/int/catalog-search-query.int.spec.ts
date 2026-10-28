import { act, createElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CatalogSearch from '@/components/CatalogSearch'
import SearchPage from '@/app/(frontend)/(catalog)/poisk/page'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string; prefetch?: boolean }) => {
    delete props.prefetch
    return createElement('a', { ...props, href }, children)
  },
}))
vi.mock('@/components/LanguageSwitcher', () => ({ default: () => null }))

let root: Root | undefined
let container: HTMLDivElement | undefined
beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true))
afterEach(() => {
  if (root) act(() => root!.unmount())
  root = undefined
  container?.remove()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('search URL initialization', () => {
  it('renders the requested grade and filtered results in the initial server HTML', async () => {
    const html = renderToStaticMarkup(await SearchPage({ searchParams: Promise.resolve({ q: '12Х1МФ' }) }))
    const document = new DOMParser().parseFromString(html, 'text/html')
    expect(document.querySelector('input')?.getAttribute('value')).toBe('12Х1МФ')
    const results = [...document.querySelectorAll('.search-results > a')]
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].querySelector('h2')?.textContent).toBe('12Х1МФ')
    expect(results.length).toBeLessThan(40)
    expect(document.querySelector('.search-summary')?.textContent).toContain('Найдено:')
  })

  it('uses the first repeated q value, matching URLSearchParams.get', async () => {
    const html = renderToStaticMarkup(await SearchPage({ searchParams: Promise.resolve({ q: ['12Х1МФ', 'ГОСТ 8734'] }) }))
    expect(new DOMParser().parseFromString(html, 'text/html').querySelector('input')?.getAttribute('value')).toBe('12Х1МФ')
  })

  it('updates results when a client-side navigation supplies a new server query', async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const firstPage = await SearchPage({ searchParams: Promise.resolve({ q: '12Х1МФ' }) })
    act(() => root!.render(firstPage))
    expect(container.querySelector('.search-results h2')?.textContent).toBe('12Х1МФ')
    const secondPage = await SearchPage({ searchParams: Promise.resolve({ q: '09Г2С' }) })
    act(() => root!.render(secondPage))
    expect(container.querySelector('input')?.value).toBe('09Г2С')
    expect(container.querySelector('.search-results h2')?.textContent).toBe('09Г2С')
  })

  it('keeps typing, type filters, clearing and browser-history restoration working', () => {
    window.history.replaceState(null, '', '/poisk?q=12Х1МФ')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root!.render(createElement(CatalogSearch, { initialQuery: '12Х1МФ' })))
    const input = container.querySelector('input')!
    const click = (label: string) => act(() => [...container!.querySelectorAll('button')].find(button => (button.getAttribute('aria-label') || button.textContent) === label)!.click())
    click('Продукция')
    expect(container.querySelectorAll('.search-results > a').length).toBeGreaterThan(0)
    expect([...container.querySelectorAll('.search-results > a small')].every(label => label.textContent !== 'Материал')).toBe(true)
    click('Материалы')
    expect(container.querySelectorAll('.search-results > a').length).toBeGreaterThan(0)
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '09Г2С')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(new URLSearchParams(window.location.search).get('q')).toBe('09Г2С')
    expect(container.querySelector('.search-results')?.textContent).toContain('09Г2С')
    window.history.replaceState(null, '', '/poisk?q=12Х1МФ')
    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(input.value).toBe('12Х1МФ')
    expect(container.querySelector('.search-results')?.textContent).toContain('12Х1МФ')
    click('Очистить поиск')
    expect(input.value).toBe('')
    expect(new URLSearchParams(window.location.search).has('q')).toBe(false)
  })
})
