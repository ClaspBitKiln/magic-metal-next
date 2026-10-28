import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

function recordExternalHeroRequests(page: Page) {
  const requests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (/^https?:$/.test(url.protocol) && /\/images\/hero(?:[-/.]|$)/.test(url.pathname)) requests.push(request.url())
  })
  return requests
}

async function expectDecodedHero(page: Page) {
  await expect(page.locator('.hero-mosaic')).toBeVisible()
  await expect(page.locator('.hero-tile')).toHaveCount(0)
  const image = page.locator('.hero-image img')
  await expect(image).toHaveCount(1)
  await expect(image).toHaveAttribute('loading', 'eager')
  await expect(image).toHaveAttribute('fetchpriority', 'high')
  const photo = await image.evaluate(async (image: HTMLImageElement) => {
    await image.decode()
    return { source: image.currentSrc, width: image.naturalWidth, height: image.naturalHeight, renderedWidth: image.getBoundingClientRect().width }
  })
  expect(photo.source).toMatch(/\/images\/hero-photo-1440\.avif(?:\?|$)/)
  // Width-descriptor srcsets density-correct naturalWidth to the declared source size.
  expect(photo.width).toBeGreaterThan(0)
  expect(photo.height).toBeGreaterThan(0)
  expect(photo.width / photo.height).toBeCloseTo(16 / 9, 2)
  // Encoded resolution is checked in the AVIF asset test; naturalWidth here is
  // density-corrected by sizes and cannot be compared to encoded pixel counts.
  expect(photo.renderedWidth).toBeGreaterThan(0)
  const responsive = await page.locator('.hero-image source[type="image/avif"]').evaluate((source) => {
    const preload = document.querySelector('link[rel="preload"][as="image"][type="image/avif"]')
    return { srcset: source.getAttribute('srcset'), sizes: source.getAttribute('sizes'), preloadSrcset: preload?.getAttribute('imagesrcset'), preloadSizes: preload?.getAttribute('imagesizes'), priority: preload?.getAttribute('fetchpriority') }
  })
  expect(responsive.srcset).toBeTruthy()
  expect(responsive.sizes).toBeTruthy()
  expect(responsive.preloadSrcset).toBe(responsive.srcset)
  expect(responsive.preloadSizes).toBe(responsive.sizes)
  expect(responsive.priority).toBe('high')
  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(1)
  expect(await page.locator('.hero-canvas').evaluate((canvas) => getComputedStyle(canvas).backgroundImage)).not.toContain('data:')
  return photo.source
}

test('root is the approved dependency-free public page', async ({ page, baseURL }) => {
  const failures: string[] = []
  const heroRequests = recordExternalHeroRequests(page)
  page.on('requestfailed', (request) => {
    // Optional third-party analytics must not be a dependency of the public page.
    if (new URL(request.url()).origin === new URL(baseURL!).origin) failures.push(`${request.url()} ${request.failure()?.errorText || ''}`)
  })
  page.on('response', (response) => {
    if (response.url().startsWith(new URL(baseURL!).origin) && response.status() >= 400) failures.push(`HTTP ${response.status()} ${response.url()}`)
  })
  page.on('pageerror', (error) => failures.push(`PAGE ${error.message}`))

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeAttached()
  await expect(page.locator('.company-client-list img')).toHaveCount(5)
  await expect(page.locator('.brand img')).toHaveAttribute('src', /logo\.png/)
  const heroSource = await expectDecodedHero(page)

  expect(await page.locator('script[src*="_next"]').count()).toBe(0)
  expect(await page.locator('link[href*="_next"]').count()).toBe(0)
  expect(await page.locator('link[rel="stylesheet"]').count()).toBe(0)
  expect(gzipSync(Buffer.from(await page.content())).byteLength).toBeLessThan(15_000)
  expect(heroRequests, 'Responsive preload and picture must share one image request').toEqual([heroSource])
  expect(failures, failures.join('\n')).toEqual([])
})

test('mobile receives one complete hero photo without overflow', async ({ page, baseURL }) => {
  const heroRequests = recordExternalHeroRequests(page)
  await page.setViewportSize({ width: 390, height: 844 })
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  const heroSource = await expectDecodedHero(page)
  expect(heroRequests).toEqual([heroSource])
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('tablet receives one complete hero photo', async ({ page, baseURL }) => {
  const heroRequests = recordExternalHeroRequests(page)
  await page.setViewportSize({ width: 900, height: 1000 })
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  const heroSource = await expectDecodedHero(page)
  expect(heroRequests).toEqual([heroSource])
})

test('public image assets stay complete and within their delivery budgets', async ({ request, page, baseURL }) => {
  const paths = ['/images/logo.png?v=20261006-3', '/images/logo-hq.webp', '/images/clients/gazprom.svg', '/images/clients/rosneft.svg', '/images/clients/rosatom.svg', '/images/clients/uztransgaz.svg', '/_next/image?url=%2Fimages%2Fclients%2Fuzbekneftegaz.png&w=384&q=75']
  const html = await readFile('public/home-static.html', 'utf8')
  expect(html).not.toContain('class="hero-tile"')
  expect(html).not.toContain('data:image/')
  const heroPaths = [...new Set(Array.from(html.matchAll(/\/images\/hero-photo-(?:640|1024|1440)\.avif(?:\?[^"\s,<>]*)?/g), (match) => match[0]))]
  expect(heroPaths).toHaveLength(3)
  const fallbacks = [...new Set(Array.from(html.matchAll(/\/images\/hero-mercedes-(?:640|1024|1440)\.webp(?:\?[^"\s,<>]*)?/g), (match) => match[0]))]
  expect(fallbacks.length).toBeGreaterThanOrEqual(1)
  paths.push(...heroPaths, ...fallbacks)
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expectDecodedHero(page)
  for (const path of paths) {
    const response = await request.get(new URL(path, baseURL!).toString(), { timeout: 20_000 })
    expect(response.status(), path).toBe(200)
    const body = await response.body()
    expect(body.byteLength, `${path}: empty or truncated`).toBeGreaterThan(1_000)
    const width = Number(path.match(/-(640|1024|1440)\./)?.[1])
    let limit = path.includes('rosatom.svg') ? 19_000 : 15_000
    if (path.includes('/hero-photo-')) {
      expect(body.toString('ascii', 4, 8), `${path}: AVIF file-type box`).toBe('ftyp')
      expect(body.toString('ascii', 8, 12), `${path}: AVIF major brand`).toBe('avif')
      const dimensions = body.indexOf(Buffer.from('ispe'))
      expect(dimensions, `${path}: image spatial extents`).toBeGreaterThan(0)
      expect(body.readUInt32BE(dimensions + 8), `${path}: full-resolution width`).toBe(width)
      expect(body.readUInt32BE(dimensions + 12), `${path}: full-resolution height`).toBe(width * 9 / 16)
      let offset = 0
      while (offset < body.byteLength) {
        const length = body.readUInt32BE(offset)
        expect(length, `${path}: complete AVIF box`).toBeGreaterThanOrEqual(8)
        expect(offset + length, `${path}: untruncated AVIF box`).toBeLessThanOrEqual(body.byteLength)
        offset += length
      }
      expect(offset, `${path}: complete AVIF container`).toBe(body.byteLength)
      limit = { 640: 25_000, 1024: 50_000, 1440: 85_000 }[width]!
    } else if (path.includes('/hero-mercedes-')) {
      expect(body.toString('ascii', 0, 4), `${path}: WebP container`).toBe('RIFF')
      expect(body.toString('ascii', 8, 12), `${path}: WebP format`).toBe('WEBP')
      expect(body.byteLength, `${path}: complete WebP response`).toBe(body.readUInt32LE(4) + 8)
      limit = { 640: 40_000, 1024: 75_000, 1440: 120_000 }[width]!
    }
    expect(body.byteLength, `${path}: exceeds image delivery budget`).toBeLessThan(limit)
  }
})

test('the committed static document remains safely compressible', async () => {
  const html = await readFile('public/home-static.html')
  expect(gzipSync(html).byteLength).toBeLessThan(15_000)
  expect(html.toString()).not.toMatch(/<(script|link)[^>]+_next/)
  expect(html.toString()).not.toContain('site.css')
})

test('content remains usable when every external image request fails', async ({ page, baseURL }) => {
  const heroRequests = recordExternalHeroRequests(page)
  await page.route('**/images/**', (route) => route.abort('failed'))
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeVisible()
  await expect(page.locator('.hero-tile')).toHaveCount(0)
  await expect(page.locator('.hero-image img')).toHaveCount(1)
  await expect.poll(() => page.locator('.hero-image img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 0)).toBe(true)
  expect(heroRequests).toHaveLength(1)
  expect(await page.locator('.hero').evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')
})

test('critical public content works without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  const heroRequests = recordExternalHeroRequests(page)
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeVisible()
  await expect(page.getByRole('link', { name: /\+7 922 711-73-63/ }).first()).toBeVisible()
  await expect(page.locator('.hero-mosaic')).toBeVisible()
  const heroSource = await expectDecodedHero(page)
  expect(heroRequests).toEqual([heroSource])
  await context.close()
})

test('text and actions remain usable without JavaScript while image requests stall', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1536, height: 900 } })
  try {
    const page = await context.newPage()
    const heroRequests = recordExternalHeroRequests(page)
    await page.route('**/images/**', () => new Promise(() => {}))
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.hero-tile')).toHaveCount(0)
    await expect(page.locator('.hero-image img')).toHaveCount(1)
    expect(await page.locator('.hero-image img').evaluate((image: HTMLImageElement) => image.complete)).toBe(false)
    expect(heroRequests).toHaveLength(1)
    await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /\+7 922 711-73-63/ }).first()).toBeVisible()
    await expect(page.locator('#products')).toBeVisible()
  } finally {
    await context.close()
  }
})

test('approved client emblems decode after lazy loading', async ({ page, baseURL }) => {
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  const logos = page.locator('.company-client-list img')
  await expect(logos).toHaveCount(5)
  await logos.first().scrollIntoViewIfNeeded()
  await expect.poll(() => logos.evaluateAll((nodes: HTMLImageElement[]) => nodes.map((image) => image.complete && image.naturalWidth > 0)), { timeout: 20_000 }).toEqual([true, true, true, true, true])
  expect(await logos.evaluateAll((nodes: HTMLImageElement[]) => nodes.map((image) => image.loading))).toEqual(Array(5).fill('lazy'))
})

test('the restored catalog exposes details and preserves request prefill', async ({ page, baseURL }) => {
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expect(page.locator('.catalog-group')).toHaveCount(10)
  await expect(page.locator('.catalog-group[open]')).toHaveCount(0)
  await expect(page.locator('.catalog-item')).toHaveCount(56)
  const links = page.locator('.home-size-series a')
  await expect(links).toHaveCount(56)
  const hrefs = await links.evaluateAll((nodes: HTMLAnchorElement[]) => nodes.map((node) => node.getAttribute('href')))
  expect(hrefs.every((href) => href?.startsWith('/produkciya/') || href?.startsWith('/spravochnik-nalichiya?q=') || (href?.startsWith('/?product=') && href.endsWith('#request')))).toBe(true)
  expect((await page.goto('/?product=%D0%A2%D1%80%D1%83%D0%B1%D1%8B#request', { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expect(page.locator('textarea[name="message"]')).toHaveValue('Трубы: ')
})

test('www hostname redirects to the canonical apex host', async ({ page, baseURL }) => {
  test.skip(new URL(baseURL!).hostname === '127.0.0.1', 'Canonical redirect is a production-only boundary')
  const response = await page.goto('https://www.magicmet.ru/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  expect(new URL(page.url()).hostname).toBe('magicmet.ru')
})
