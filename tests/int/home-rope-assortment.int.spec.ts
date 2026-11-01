import { describe, expect, it, vi } from 'vitest'
import { gzipSync } from 'node:zlib'
import { GET as getHomepage } from '@/app/(frontend)/route'

describe('homepage steel rope assortment', () => {
  it('presents the offered diameter range separately from construction designations', async () => {
    const html = await (await getHomepage()).text()
    const document = new DOMParser().parseFromString(html, 'text/html')
    const link = document.querySelector('a[href^="/produkciya/metizy-i-svarochnye-materialy/kanaty"]')!
    const rope = link.closest('details.catalog-item')!
    expect(rope.querySelector('summary')?.textContent).toContain('1–56 мм')
    expect(rope.textContent).toContain('1770')
    expect(rope.textContent).toContain('1960')
    expect(rope.textContent).toContain('Конструкции')
    expect(rope.textContent).not.toMatch(/все диаметры для каждой конструкции|всегда в наличии/i)
  })

  it('opens the full offered assortment instead of limiting the homepage to six old positions', async () => {
    const html = await (await getHomepage()).text()
    const document = new DOMParser().parseFromString(html, 'text/html')
    const detail = document.querySelector('a[href="/produkciya/metizy-i-svarochnye-materialy/kanaty"]')
    expect(detail).not.toBeNull()
    const rope = detail!.closest('details.catalog-item')!
    expect(rope.querySelector('summary strong')?.textContent).toBe('Канаты стальные')
    expect(rope.querySelectorAll('tbody tr')).toHaveLength(0)
    expect(detail!.textContent).toContain('Выбрать конструкцию')
  })

  it('keeps the analytics-enabled homepage within its compressed HTML budget', async () => {
    vi.stubEnv('NEXT_PUBLIC_YANDEX_METRIKA_ID', '113661397')
    try {
      const html = await (await getHomepage()).text()
      expect(html).toContain('magicmet-analytics')
      expect(gzipSync(html).length).toBeLessThan(15_000)
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
