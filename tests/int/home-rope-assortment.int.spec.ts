import { describe, expect, it, vi } from 'vitest'
import { gzipSync } from 'node:zlib'
import { GET as getHomepage } from '@/app/(frontend)/route'

const sourceRows = [
  ['13', 'ГОСТ 2688-80'],
  ['24', 'ГОСТ 2688-80'],
  ['2', 'ГОСТ 3063-80 полимерн. покр 2/3 уценка'],
  ['15', 'ГОСТ 7668-80'],
  ['18', 'ГОСТ 7668-80'],
  ['20', 'ГОСТ 7668-80'],
]

describe('homepage steel rope assortment', () => {
  it('offers all six source positions directly from the native catalog disclosure', async () => {
    const html = await (await getHomepage()).text()
    const document = new DOMParser().parseFromString(html, 'text/html')
    const detail = document.querySelector('a[href="/produkciya/metizy-i-svarochnye-materialy/kanaty"]')
    expect(detail).not.toBeNull()
    const rope = detail!.closest('details.catalog-item')!
    expect(rope.querySelector('summary strong')?.textContent).toBe('Канаты стальные')
    const rows = Array.from(rope.querySelectorAll('tbody tr'))
    expect(rows).toHaveLength(sourceRows.length)
    for (const [index, [size, description]] of sourceRows.entries()) {
      const row = rows[index]
      expect(row.textContent).toContain(size)
      expect(row.textContent).toContain(description)
      const request = row.querySelector('a[href*="product="]')?.getAttribute('href')
      expect(request).toBeTruthy()
      const url = new URL(request!, 'https://magicmet.ru')
      expect(url.pathname).toBe('/')
      expect(url.hash).toBe('#request')
      const product = url.searchParams.get('product')!
      expect(product).toContain(description)
      expect(product).toContain(`размерное обозначение ${size}`)
      expect(product).toContain('единица учёта м')
    }
    expect(detail!.textContent).toContain('Размеры, описание и ГОСТы')
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
