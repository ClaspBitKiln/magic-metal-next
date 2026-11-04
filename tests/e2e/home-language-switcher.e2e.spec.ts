import { expect, test } from '@playwright/test'

test('homepage language switcher shows seven existing languages and keeps Russian fast', async ({ page }) => {
  await page.goto('/')
  const selector = page.locator('#home-language')
  await expect(selector.locator('summary')).toHaveText('RU')
  await selector.locator('summary').click()
  await expect(selector.locator('button[data-lang]')).toHaveCount(7)
  await expect(selector.locator('button[data-lang="ru"]')).toHaveAttribute('aria-current', 'true')
  expect(await page.evaluate(() => Boolean(document.getElementById('home-google-translate')))).toBe(false)
})

test('homepage remembers selected language and offers reliable return to Russian', async ({ page }) => {
  await page.route('https://translate.google.com/**', route => route.abort())
  await page.goto('/')
  const selector = page.locator('#home-language')
  await selector.locator('summary').click()
  await selector.locator('button[data-lang="en"]').click()
  await expect(selector.locator('summary')).toHaveText('EN')
  expect(await page.evaluate(() => localStorage.getItem('magicmet-language'))).toBe('en')
  await expect(selector.locator('#home-language-status')).toContainText(/Перевод недоступен|Загружаем/)
  await selector.locator('summary').click()
  await selector.locator('button[data-lang="ru"]').click()
  await expect(selector.locator('summary')).toHaveText('RU')
  expect(await page.evaluate(() => localStorage.getItem('magicmet-language'))).toBe('ru')
  expect(await page.evaluate(() => document.cookie.includes('googtrans='))).toBe(false)
})

test('mobile header exposes language selector without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('#home-language summary')).toBeVisible()
  await expect(page.locator('#home-language summary')).toHaveCSS('min-height', '44px')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
