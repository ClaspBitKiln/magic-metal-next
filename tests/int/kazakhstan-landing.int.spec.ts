import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import KazakhstanSupplyPage, { metadata } from '@/app/(frontend)/(catalog)/postavki/kazakhstan/page'
import sitemap from '@/app/(frontend)/sitemap'
import { seoCatalog } from '@/data/seoCatalog'

describe('Kazakhstan supply landing', () => {
  const html = renderToStaticMarkup(createElement(KazakhstanSupplyPage))
  const page = new DOMParser().parseFromString(html, 'text/html')

  it('offers specification-first requests and real contacts in server HTML', () => {
    const requests = Array.from(page.querySelectorAll('a')).filter(a => a.textContent?.includes('Отправить заявку'))
    expect(requests).toHaveLength(3)
    expect(requests.every(a => a.getAttribute('href') === '/?region=kazakhstan#request')).toBe(true)
    expect(page.querySelector('a[href="tel:+79227117363"]')).not.toBeNull()
    expect(page.querySelector('a[href="mailto:m1@magicmet.ru"]')).not.toBeNull()
    expect(page.body.textContent).toContain('город и адрес назначения в Казахстане')
    expect(page.body.textContent).toContain('наличие, стоимость и срок подтверждаются отдельно')
  })

  it('links existing categories and exposes a unique canonical sitemap entry', () => {
    const links = Array.from(page.querySelectorAll('.material-products a'))
    expect(links).toHaveLength(6)
    for (const link of links) {
      const slug = link.getAttribute('href')?.replace('/produkciya/', '')
      expect(seoCatalog.some(category => category.slug === slug)).toBe(true)
    }
    expect(metadata.alternates?.canonical).toBe('/postavki/kazakhstan')
    expect(sitemap().filter(entry => new URL(entry.url).pathname === '/postavki/kazakhstan')).toHaveLength(1)
    expect(sitemap().some(entry => new URL(entry.url).pathname === '/postavki/uzbekistan')).toBe(true)
  })
})
