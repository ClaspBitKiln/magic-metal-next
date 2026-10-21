import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

async function expectDecodedHero(page: Page, variant: '640' | '1024' | '1440', width: number, height: number) {
  const images = page.locator('.hero-image img')
  await expect(page.locator('.hero-mosaic')).toBeVisible()
  await expect(images).toHaveCount(1)
  await expect.poll(() => images.evaluateAll((nodes: HTMLImageElement[], expectedVariant) => nodes.map((image) => ({
    complete: image.complete,
    width: image.naturalWidth,
    height: image.naturalHeight,
    variant: image.currentSrc.includes(`/hero-mercedes-${expectedVariant}.webp`),
  })), variant), { timeout: 20_000 }).toEqual([{
    complete: true,
    width,
    height,
    variant: true,
  }])
}

test('root is the approved dependency-free public page', async ({ page, baseURL }) => {
  const failures: string[] = []
  page.on('requestfailed', (request) => failures.push(`${request.url()} ${request.failure()?.errorText || ''}`))
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
  await expectDecodedHero(page, '1440', 1440, 810)

  expect(await page.locator('script[src*="_next"]').count()).toBe(0)
  expect(await page.locator('link[href*="_next"]').count()).toBe(0)
  expect(await page.locator('link[rel="stylesheet"]').count()).toBe(0)
  expect(gzipSync(Buffer.from(await page.content())).byteLength).toBeLessThan(15_000)
  expect(failures, failures.join('\n')).toEqual([])
})

test('mobile receives one 640 px hero image without overflow', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expectDecodedHero(page, '640', 640, 360)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('every route-sensitive public asset stays below the safe limit', async ({ request, baseURL }) => {
  const paths = ['/images/logo.png?v=20261006-3', '/images/logo-hq.webp', '/images/clients/gazprom.svg', '/images/clients/rosneft.svg', '/images/clients/rosatom.svg', '/images/clients/uztransgaz.svg', '/_next/image?url=%2Fimages%2Fclients%2Fuzbekneftegaz.png&w=384&q=75']
  for (const variant of ['640', '1024', '1440']) paths.push(`/images/hero-mercedes-${variant}.webp?v=20261021-1`)
  for (const path of paths) {
    const response = await request.get(new URL(path, baseURL!).toString(), { timeout: 20_000 })
    expect(response.status(), path).toBe(200)
    const body = await response.body()
    expect(body.byteLength, `${path}: empty or truncated`).toBeGreaterThan(1_000)
    const safeLimit = path.includes('hero-mercedes-') ? 120_000 : path.includes('rosatom.svg') ? 19_000 : 15_000
    expect(body.byteLength, `${path}: exceeds safe route limit`).toBeLessThan(safeLimit)
  }
})

test('the committed static document remains safely compressible', async () => {
  const html = await readFile('public/home-static.html')
  expect(gzipSync(html).byteLength).toBeLessThan(15_000)
  expect(html.toString()).not.toMatch(/<(script|link)[^>]+_next/)
  expect(html.toString()).not.toContain('site.css')
})

test('content remains usable when every image request fails', async ({ page, baseURL }) => {
  await page.route('**/images/**', (route) => route.abort('failed'))
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeVisible()
  expect(await page.locator('.hero-image img').evaluateAll((images: HTMLImageElement[]) => images.every((image) => image.complete && image.naturalWidth === 0))).toBe(true)
  expect(await page.locator('.hero').evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')
})

test('critical public content works without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  expect((await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeVisible()
  await expect(page.getByRole('link', { name: /\+7 922 711-73-63/ }).first()).toBeVisible()
  await expect(page.locator('.hero-mosaic')).toBeVisible()
  await expectDecodedHero(page, '1440', 1440, 45)
  await context.close()
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
  await expect(page.locator('.catalog-item')).toHaveCount(46)
  const links = page.locator('.home-size-series a')
  await expect(links).toHaveCount(46)
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
