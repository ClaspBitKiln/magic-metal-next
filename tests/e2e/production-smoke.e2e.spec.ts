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
  await expect(page.locator('.hero-mosaic img')).toHaveCount(0)
  const photo = await page.locator('.hero-canvas').evaluate(async (canvas) => {
    const background = getComputedStyle(canvas).backgroundImage
    const source = background.match(/^url\(["']?(data:image\/avif;base64,[A-Za-z0-9+/=]+)["']?\)$/)?.[1]
    if (!source) return null
    const image = new Image()
    image.src = source
    await image.decode()
    return { width: image.naturalWidth, height: image.naturalHeight }
  })
  expect(photo).toEqual({ width: 320, height: 180 })
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
  await expectDecodedHero(page)

  expect(await page.locator('script[src*="_next"]').count()).toBe(0)
  expect(await page.locator('link[href*="_next"]').count()).toBe(0)
  expect(await page.locator('link[rel="stylesheet"]').count()).toBe(0)
  expect(gzipSync(Buffer.from(await page.content())).byteLength).toBeLessThan(15_000)
  expect(heroRequests, 'The complete hero must not require external image requests').toEqual([])
  expect(failures, failures.join('\n')).toEqual([])
})

test('mobile receives one complete hero photo without overflow', async ({ page, baseURL }) => {
  const heroRequests = recordExternalHeroRequests(page)
  await page.setViewportSize({ width: 390, height: 844 })
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expectDecodedHero(page)
  expect(heroRequests).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('tablet receives one complete hero photo', async ({ page, baseURL }) => {
  const heroRequests = recordExternalHeroRequests(page)
  await page.setViewportSize({ width: 900, height: 1000 })
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expectDecodedHero(page)
  expect(heroRequests).toEqual([])
})

test('every route-sensitive public asset stays below the safe limit', async ({ request, page, baseURL }) => {
  const paths = ['/images/logo.png?v=20261006-3', '/images/logo-hq.webp', '/images/clients/gazprom.svg', '/images/clients/rosneft.svg', '/images/clients/rosatom.svg', '/images/clients/uztransgaz.svg', '/_next/image?url=%2Fimages%2Fclients%2Fuzbekneftegaz.png&w=384&q=75']
  const html = await readFile('public/home-static.html', 'utf8')
  expect(html).not.toContain('class="hero-tile"')
  const preloads = [...html.matchAll(/rel="preload" as="image" href="([^"<>]+)"/g)].map((match) => match[1])
  expect(preloads).toEqual([])
  const heroPaths = [...html.matchAll(/(?:src|srcset)=["'](\/images\/hero[^"']*)["']/g)]
  expect(heroPaths).toHaveLength(0)
  expect(html).not.toContain('/images/hero-preview-')
  const photos = [...html.matchAll(/data:image\/avif;base64,([A-Za-z0-9+/=]+)/g)]
  expect(photos, 'One complete inline hero photo').toHaveLength(1)
  const source = photos[0]?.[1]
  expect(source, 'The static document must contain its complete hero photo').toBeDefined()
  const photo = Buffer.from(source!, 'base64')
  expect(photo.toString('ascii', 4, 8), 'AVIF file-type box').toBe('ftyp')
  expect(photo.toString('ascii', 8, 12), 'AVIF major brand').toBe('avif')
  expect(photo.byteLength, 'Complete inline photo stays compact').toBeLessThan(2_000)
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expectDecodedHero(page)
  for (const path of paths) {
    const response = await request.get(new URL(path, baseURL!).toString(), { timeout: 20_000 })
    expect(response.status(), path).toBe(200)
    const body = await response.body()
    expect(body.byteLength, `${path}: empty or truncated`).toBeGreaterThan(1_000)
    const safeLimit = path.includes('rosatom.svg') ? 19_000 : 15_000
    expect(body.byteLength, `${path}: exceeds safe route limit`).toBeLessThan(safeLimit)
  }
})

test('the committed static document remains safely compressible', async () => {
  const html = await readFile('public/home-static.html')
  expect(gzipSync(html).byteLength).toBeLessThan(15_000)
  expect(html.toString()).not.toMatch(/<(script|link)[^>]+_next/)
  expect(html.toString()).not.toContain('site.css')
})

test('the complete hero and content remain usable when every external image request fails', async ({ page, baseURL }) => {
  const heroRequests = recordExternalHeroRequests(page)
  await page.route('**/images/**', (route) => route.abort('failed'))
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeVisible()
  await expect(page.locator('.hero-tile')).toHaveCount(0)
  await expectDecodedHero(page)
  expect(heroRequests).toEqual([])
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
  await expectDecodedHero(page)
  expect(heroRequests).toEqual([])
  await context.close()
})

test('the complete inline photo works without JavaScript while every external image stalls', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1536, height: 900 } })
  try {
    const page = await context.newPage()
    const heroRequests = recordExternalHeroRequests(page)
    await page.route('**/images/**', () => new Promise(() => {}))
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.hero-tile')).toHaveCount(0)
    await expectDecodedHero(page)
    expect(heroRequests).toEqual([])
    await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
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
