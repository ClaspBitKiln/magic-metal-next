import { expect, test } from '@playwright/test'

test('production loads styled and keeps critical resources healthy', async ({ page, request, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const failures: string[] = []

  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) {
      failures.push(`HTTP ${response.status()} ${response.url()}`)
    }
  })
  page.on('requestfailed', (failed) => {
    if (failed.url().startsWith(origin)) {
      failures.push(`REQUEST_FAILED ${failed.url()} ${failed.failure()?.errorText || ''}`)
    }
  })
  page.on('pageerror', (error) => failures.push(`PAGE_ERROR ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`CONSOLE_ERROR ${message.text()}`)
  })

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await expect(page.locator('h1')).toContainText('СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ')
  await expect(page.locator('#request')).toBeAttached()

  const applied = await page.evaluate(() => ({
    styleSheets: document.styleSheets.length,
    fontFamily: getComputedStyle(document.body).fontFamily,
    bodyMargin: getComputedStyle(document.body).margin,
  }))
  expect(applied.styleSheets).toBeGreaterThan(0)
  expect(applied.fontFamily).toMatch(/Segoe UI|Arial|sans-serif/i)
  expect(applied.fontFamily).not.toMatch(/Times New Roman/i)
  expect(applied.bodyMargin).toBe('0px')

  const stylesheet = await page.locator('link[rel="stylesheet"]').first().getAttribute('href')
  expect(stylesheet).toBeTruthy()
  const cssResponse = await request.get(new URL(stylesheet!, origin).toString())
  expect(cssResponse.status()).toBe(200)
  expect(cssResponse.headers()['content-type']).toContain('text/css')
  expect(await cssResponse.text()).not.toContain('fonts.googleapis.com')

  const hero = page.locator('img.hero-visual')
  await expect(hero).toBeVisible()
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)

  await page.getByRole('link', { name: /Отправить заявку/i }).first().click()
  await expect(page.locator('#request')).toBeVisible()
  expect(failures, failures.join('\n')).toEqual([])
})

test('www hostname serves the same styled production page', async ({ page }) => {
  const response = await page.goto('https://www.magicmet.ru/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await expect(page.locator('h1')).toContainText('СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ')
  expect(await page.evaluate(() => getComputedStyle(document.body).margin)).toBe('0px')
})
