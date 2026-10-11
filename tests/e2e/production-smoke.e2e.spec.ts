import { expect, test, type Page } from '@playwright/test'

const maintenanceTitle = 'САЙТ НА РЕКОНСТРУКЦИИ'

async function expectDecodedHero(page: Page, expectedFile: string, width: number, height: number) {
  const heroVisual = page.locator('.hero-visual')

  await expect(heroVisual).toBeVisible()
  await expect(heroVisual).toHaveAttribute('loading', 'lazy')
  await expect.poll(() => heroVisual.evaluate(async (image: HTMLImageElement) => {
    try {
      await image.decode()
      return image.complete && image.naturalWidth > 0
    } catch {
      return false
    }
  })).toBe(true)

  const image = await heroVisual.evaluate((node: HTMLImageElement) => ({
    currentSrc: node.currentSrc,
    naturalWidth: node.naturalWidth,
    naturalHeight: node.naturalHeight,
  }))
  expect(image.currentSrc).toContain(expectedFile)
  expect(image.naturalWidth).toBe(width)
  expect(image.naturalHeight).toBe(height)
}

test('production loads the approved public state without critical resource failures', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const failures: string[] = []
  const translateRequests: string[] = []
  let fullCssStatus: number | undefined
  let fullCssType: string | undefined

  page.on('response', (response) => {
    if (new URL(response.url()).pathname === '/site.css') {
      fullCssStatus = response.status()
      fullCssType = response.headers()['content-type']
    }
    if (response.url().startsWith(origin) && response.status() >= 400) {
      failures.push(`HTTP ${response.status()} ${response.url()}`)
    }
  })
  page.on('requestfailed', (failed) => {
    if (failed.url().startsWith(origin)) {
      failures.push(`REQUEST_FAILED ${failed.url()} ${failed.failure()?.errorText || ''}`)
    }
  })
  page.on('request', (request) => {
    if (/translate\.google|translate-pa\.googleapis/.test(request.url())) {
      translateRequests.push(request.url())
    }
  })
  page.on('pageerror', (error) => failures.push(`PAGE_ERROR ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`CONSOLE_ERROR ${message.text()}`)
  })

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  // Firefox can fail while reading a navigation response body through the
  // protocol even though the document loaded successfully. Measure the
  // serialized document instead; this keeps the size budget browser-neutral.
  // Only the first screen is inlined. The complete September design is loaded
  // in the background so slow clients can paint useful content immediately.
  expect(Buffer.byteLength(await page.content(), 'utf8')).toBeLessThan(110_000)

  const heading = page.locator('h1')
  await expect(heading).toBeVisible()
  const headingText = (await heading.innerText()).trim()
  const isMaintenance = headingText === maintenanceTitle

  const applied = await page.evaluate(() => ({
    styleSheets: document.styleSheets.length,
    fontFamily: getComputedStyle(document.body).fontFamily,
    bodyMargin: getComputedStyle(document.body).margin,
  }))
  expect(applied.styleSheets).toBeGreaterThan(0)
  expect(applied.fontFamily).toMatch(/Segoe UI|Arial|sans-serif/i)
  expect(applied.fontFamily).not.toMatch(/Times New Roman/i)
  expect(applied.bodyMargin).toBe('0px')

  const inlinedCss = page.locator('style[data-precedence="next"]')
  await expect(inlinedCss).toHaveCount(1)
  const criticalCss = await inlinedCss.textContent()
  expect(Buffer.byteLength(criticalCss || '', 'utf8')).toBeLessThan(15_000)
  expect(criticalCss).not.toContain('fonts.googleapis.com')
  const fullCss = page.locator('link#full-site-css')
  await expect(fullCss).toHaveCount(1)
  await expect(fullCss).toHaveAttribute('href', '/site.css?v=20261011-1')
  await expect.poll(() => fullCss.evaluate((link: HTMLLinkElement) => link.media)).toBe('all')
  await expect.poll(() => fullCss.evaluate((link: HTMLLinkElement) => Boolean(link.sheet))).toBe(true)
  expect(fullCssStatus).toBe(200)
  expect(fullCssType).toContain('text/css')
  expect(await page.locator('#products').evaluate((node) => getComputedStyle(node).position)).toBe('relative')

  if (isMaintenance) {
    await expect(page.getByRole('heading', { name: maintenanceTitle, exact: true })).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
  } else {
    expect(headingText).toContain('СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ')
    await expect(page.locator('#request')).toBeAttached()

    const logo = page.locator('.brand img')
    await expect(logo).toBeVisible()
    await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 147)).toBe(true)
    expect(await logo.evaluate((image) => image.getBoundingClientRect().width)).toBeGreaterThan(80)
    expect(await logo.getAttribute('src')).toContain('/images/logo.png?v=20261006-3')
    await expect(page.locator('.brand-fallback')).toBeAttached()

    const hero = page.locator('.hero')
    await expect(hero).toBeVisible()
    await expectDecodedHero(page, '/images/hero-mercedes-1440.webp', 1440, 810)
    await expect(page.locator('.hero picture source').nth(0)).toHaveAttribute('srcset', /hero-mercedes-640\.webp/)
    await expect(page.locator('.hero picture source').nth(1)).toHaveAttribute('srcset', /hero-mercedes-1024\.webp/)
    await expect(page.locator('.hero picture source').nth(2)).toHaveAttribute('srcset', /hero-mercedes-1440\.webp/)
    await expect(page.locator('#products')).toBeVisible()

    await page.getByRole('link', { name: /Отправить заявку/i }).first().click()
    await expect(page.locator('#request')).toBeVisible()
  }

  expect(failures, failures.join('\n')).toEqual([])
  expect(translateRequests, translateRequests.join('\n')).toEqual([])
})

test('mobile receives the small hero and has no horizontal overflow', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const response = await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)

  const hero = page.locator('.hero')
  await expect(hero).toBeVisible()
  await expectDecodedHero(page, '/images/hero-mercedes-640.webp', 640, 360)
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeAttached()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('critical production assets are delivered completely and stay within budget', async ({ request, baseURL }) => {
  const assets = [
    ['/images/hero-mercedes-1440.webp?v=20261006-2', 'image/webp', 100_000, 120_000],
    ['/images/hero-mercedes-640.webp?v=20261006-2', 'image/webp', 30_000, 40_000],
    ['/images/logo.png?v=20261006-3', 'image/png', 10_000, 15_000],
    ['/site.css?v=20261011-1', 'text/css', 75_000, 95_000],
  ] as const

  for (const [path, type, minBytes, maxBytes] of assets) {
    const response = await request.get(new URL(path, baseURL!).toString(), { timeout: 20_000 })
    expect(response.status(), path).toBe(200)
    expect(response.headers()['content-type'], path).toContain(type)

    const body = await response.body()
    expect(body.byteLength, `${path}: truncated response`).toBeGreaterThan(minBytes)
    expect(body.byteLength, `${path}: asset budget exceeded`).toBeLessThan(maxBytes)
  }
})

test('all public images decode after a complete page traversal', async ({ page, baseURL }) => {
  const failures: string[] = []
  page.on('response', (response) => {
    if (response.url().startsWith(new URL(baseURL!).origin) && response.status() >= 400) {
      failures.push(`HTTP ${response.status()} ${response.url()}`)
    }
  })
  page.on('requestfailed', (request) => failures.push(`REQUEST_FAILED ${request.url()} ${request.failure()?.errorText || ''}`))

  const response = await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(page.locator('#request')).toBeVisible()

  const brokenImages = await page.locator('img').evaluateAll(async (images: HTMLImageElement[]) => {
    return (await Promise.all(images.map(async (image) => {
      try {
        await image.decode()
      } catch {
        return image.currentSrc || image.src || '(empty src)'
      }
      return image.complete && image.naturalWidth > 0 ? null : (image.currentSrc || image.src || '(empty src)')
    }))).filter(Boolean)
  })

  expect(brokenImages).toEqual([])
  expect(failures, failures.join('\n')).toEqual([])
})

test('critical branding stays visible when standalone image requests fail', async ({ page, baseURL }) => {
  let blockedImages = 0
  await page.route('**/images/**', (route) => {
    blockedImages += 1
    return route.abort('failed')
  })
  const response = await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()

  await expect(page.locator('.brand-fallback')).toBeVisible()
  await expect(page.locator('.brand-fallback')).toContainText('Мэджик')

  const hero = page.locator('.hero')
  await expect(hero).toBeVisible()
  await expect(page.locator('.hero > picture')).toBeAttached()
  expect(blockedImages).toBeGreaterThan(0)
  expect(await page.locator('.hero-visual').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 0)).toBe(true)
  expect(await hero.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')
  expect(await hero.evaluate((node) => getComputedStyle(node, '::after').backgroundImage)).not.toBe('none')
})

test('www hostname redirects to the canonical apex host', async ({ page }) => {
  const response = await page.goto('https://www.magicmet.ru/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  expect(new URL(page.url()).hostname).toBe('magicmet.ru')

  const headingText = (await page.locator('h1').innerText()).trim()
  expect(
    headingText === maintenanceTitle || headingText.includes('СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ'),
  ).toBe(true)
  expect(await page.evaluate(() => getComputedStyle(document.body).margin)).toBe('0px')
})

test('critical public content stays visible when JavaScript is unavailable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  const response = await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeVisible()
  await expect(page.getByRole('link', { name: /\+7 922 711-73-63/ }).first()).toBeVisible()
  await expect(page.locator('.brand img')).toBeVisible()
  await expect(page.locator('.hero')).toBeVisible()

  await context.close()
})
