import { afterEach, describe, expect, it } from 'vitest'
import { catalogRequestHref, enhanceCatalogRequestLinks } from '@/lib/catalogRequestParameters'

const origin = 'https://magicmet.ru'
const parameters = { grade: '09Г2С & + №1', knownStandard: true, standard: 'ГОСТ 19281-2014 / ТУ + 1' }
const request = '/?product=Уголок#request'
const product = (href: string) => new URL(href, origin).searchParams.get('product') || ''
const tick = () => new Promise(resolve => setTimeout(resolve, 0))
afterEach(() => { document.body.replaceChildren() })

describe('catalog standard request preserves scoped native links', () => {
  it('preserves special characters and uses free-text size only for standalone submit', () => {
    const own = product(catalogRequestHref(request, origin, { ...parameters, size: '40×40×4 & 6 + 8' }))
    expect(own).toContain('Размер / обозначение: 40×40×4 & 6 + 8')
    expect(own).toContain('Марка стали / материала: 09Г2С & + №1')
    expect(own).toContain('Требуемый ГОСТ / ТУ: ГОСТ 19281-2014 / ТУ + 1')
    const table = product(catalogRequestHref('/?product=Уголок; 50×50×5; ГОСТ 8509-93#request', origin, parameters))
    expect(table).toContain('50×50×5; ГОСТ 8509-93')
    expect(table).not.toContain('Размер / обозначение:')
    expect(table).toContain('Требуемый ГОСТ / ТУ:')
    expect(product(catalogRequestHref(request, origin, { ...parameters, standard: ' ' }))).toContain('помогите подобрать стандарт')
  })

  it('updates existing and dynamically generated row hrefs, preserves native actions and isolates source links', async () => {
    const scope = document.createElement('section')
    scope.innerHTML = '<a id="request" href="/?product=Уголок#request">Заявка</a><a id="norm" href="https://norm.example/gost">ГОСТ</a><a id="fragment" href="#sizes-series-1">Таблица</a>'
    document.body.append(scope)
    const link = scope.querySelector<HTMLAnchorElement>('#request')!
    const restore = enhanceCatalogRequestLinks(scope, request, origin, parameters)
    expect(product(link.href)).toContain(parameters.grade)
    const row = document.createElement('a')
    row.href = '/?product=Уголок; 50×50×5; ГОСТ 8509-93#request'
    scope.append(row)
    // A native modified click can occur before MutationObserver's next delivery.
    const modified = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })
    row.dispatchEvent(modified)
    expect(modified.defaultPrevented).toBe(false)
    expect(product(row.href)).toContain(parameters.grade)
    const middle = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 })
    row.dispatchEvent(middle)
    expect(middle.defaultPrevented).toBe(false)
    await tick()
    expect(product(row.href)).toContain('50×50×5; ГОСТ 8509-93')
    expect(product(row.href).match(/Марка стали \/ материала:/g)).toHaveLength(1)
    expect(scope.querySelector('#norm')!.getAttribute('href')).toBe('https://norm.example/gost')
    expect(scope.querySelector('#fragment')!.getAttribute('href')).toBe('#sizes-series-1')
    restore()
    expect(link.getAttribute('href')).toBe('/?product=Уголок#request')
    expect(row.getAttribute('href')).toBe('/?product=Уголок; 50×50×5; ГОСТ 8509-93#request')
  })

  it('changes the requested grade without duplicating it and respects picker href replacements', async () => {
    const scope = document.createElement('section')
    const link = document.createElement('a')
    link.setAttribute('href', request)
    scope.append(link)
    document.body.append(scope)
    const first = enhanceCatalogRequestLinks(scope, request, origin, parameters)
    first()
    const second = enhanceCatalogRequestLinks(scope, request, origin, { grade: 'Ст3', knownStandard: false, standard: 'ignored' })
    expect(product(link.href)).toContain('Марка стали / материала: Ст3')
    expect(product(link.href)).not.toContain(parameters.grade)
    expect(product(link.href).match(/Марка стали \/ материала:/g)).toHaveLength(1)
    link.setAttribute('href', '/?product=Уголок; 75×75×5; ГОСТ 8509-93#request')
    await tick()
    expect(product(link.href)).toContain('75×75×5; ГОСТ 8509-93')
    expect(product(link.href)).toContain('Марка стали / материала: Ст3')
    second()
    expect(link.getAttribute('href')).toBe('/?product=Уголок; 75×75×5; ГОСТ 8509-93#request')
  })
})
