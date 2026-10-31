import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GET as getHomepage } from '@/app/(frontend)/route'
import CategoryPage, { generateStaticParams as categories } from '@/app/(frontend)/(catalog)/produkciya/[slug]/page'
import DetailPage, { generateStaticParams as details } from '@/app/(frontend)/(catalog)/produkciya/[slug]/[detail]/page'
import sitemap from '@/app/(frontend)/sitemap'
import { searchIndex, normalizeSearch } from '@/data/searchIndex'

const railSlugs = ['zheleznodorozhnye', 'promyshlennye', 'kranovye']
const railTitles: Record<string, string> = {
  zheleznodorozhnye: 'Рельсы железнодорожные',
  promyshlennye: 'Рельсы узкоколейные',
  kranovye: 'Рельсы крановые',
}
const href = (slug: string) => `/produkciya/relsy/${slug}`

describe('rails catalog customer journey', () => {
  it('exposes every rail family from the homepage and category without JavaScript', async () => {
    const home = new DOMParser().parseFromString(await (await getHomepage()).text(), 'text/html')
    const group = Array.from(home.querySelectorAll('.catalog-group')).find(node => node.querySelector('summary strong')?.textContent === 'Рельсы')
    expect(group).toBeDefined()
    expect(categories()).toContainEqual({ slug: 'relsy' })
    const category = new DOMParser().parseFromString(renderToStaticMarkup(await CategoryPage({ params: Promise.resolve({ slug: 'relsy' }) })), 'text/html')
    expect(category.querySelector('h1')?.textContent).toContain('Рельсы')
    for (const slug of railSlugs) {
      const homeLink = Array.from(group!.querySelectorAll('a')).find(link => link.getAttribute('href')?.split('#')[0] === href(slug))
      expect(homeLink).toBeDefined()
      expect(homeLink!.closest('.catalog-item')?.querySelector('summary strong')?.textContent).toBe(railTitles[slug])
      const categoryLink = category.querySelector(`a[href="${href(slug)}"]`)
      expect(categoryLink).not.toBeNull()
      expect(categoryLink!.querySelector('span')?.textContent).toBe(railTitles[slug])
    }
  })

  it.each(railSlugs)('keeps %s discoverable and carries its identity into the request', async slug => {
    expect(details()).toContainEqual({ slug: 'relsy', detail: slug })
    const page = new DOMParser().parseFromString(renderToStaticMarkup(await DetailPage({ params: Promise.resolve({ slug: 'relsy', detail: slug }) })), 'text/html')
    const title = page.querySelector('h1')?.textContent?.trim()
    expect(title).toBe(railTitles[slug])
    const request = page.querySelector('.pipe-nav a[href*="product="]')?.getAttribute('href')
    expect(request).toBeTruthy()
    const url = new URL(request!, 'https://magicmet.ru')
    expect(url.searchParams.get('product')).toBe(title)
    expect(url.hash).toBe('#request')
    const entry = searchIndex.find(item => item.href === href(slug))
    expect(entry).toBeDefined()
    expect(entry!.title).toBe(railTitles[slug])
    expect(normalizeSearch(entry!.searchText)).toContain('рельс')
    expect(sitemap().some(item => new URL(item.url).pathname === href(slug))).toBe(true)
    // A new catalog page must not imply a verified warehouse quantity or price.
    const product = JSON.parse(page.querySelector('script[type="application/ld+json"]')!.textContent!)
    expect(product.name).toBe(railTitles[slug])
    expect(product.offers).toBeUndefined()
  })

  it('allows prose requirements to wrap while preserving actual standard-code styling', async () => {
    const rails = new DOMParser().parseFromString(renderToStaticMarkup(await CategoryPage({ params: Promise.resolve({ slug: 'relsy' }) })), 'text/html')
    const prose = Array.from(rails.querySelectorAll('.product-facts dd span')).find(node => node.textContent?.includes('Стандарт или технические условия'))
    expect(prose).toBeDefined()
    expect(prose!.classList.contains('standard-code')).toBe(false)
    const existing = new DOMParser().parseFromString(renderToStaticMarkup(await CategoryPage({ params: Promise.resolve({ slug: 'truby-elektrosvarnye' }) })), 'text/html')
    expect(Array.from(existing.querySelectorAll('.standard-code')).some(node => node.textContent?.includes('ГОСТ'))).toBe(true)
  })
})
