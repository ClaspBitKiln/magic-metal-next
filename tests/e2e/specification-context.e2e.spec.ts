import { expect, test } from '@playwright/test'

const cases = [
  ['/produkciya/cvetnye-metally/bronza', '.nonferrous-picker'],
  ['/produkciya/metizy-i-svarochnye-materialy/krepezh', '.fastener-picker'],
  ['/produkciya/metizy-i-svarochnye-materialy/setki', '.mesh-rope-picker'],
  ['/produkciya/pokovki-i-zagotovki/po-chertezhu', '.special-procurement-picker'],
  ['/produkciya/listovoy-prokat/goryachekatanyj', '.sheet-format-picker'],
  ['/produkciya/listovoy-prokat/ocinkovannyj', '.galv-picker'],
] as const

test.beforeEach(async ({ page }) => {
  await page.route('**/api/request', route => route.abort())
  await page.route(/https?:\/\/[^/]*mc\.yandex\.[^/]+\//, route => route.abort())
})

for (const width of [320, 390, 1536]) {
  test(`specification links retain the product through document navigation at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width, height: 900 })
    for (const [path, picker] of cases) {
      await page.goto(path)
      const title = await page.locator('h1').innerText()
      const fileLink = page.locator(picker).getByRole('link', { name: /Excel/ })
      const url = new URL((await fileLink.getAttribute('href'))!, 'https://magicmet.ru')
      expect(url.searchParams.get('product')).toBe(title)
      expect(url.hash).toBe('#request')
      await fileLink.click()
      await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(`${title}: `)
      await expect(page.locator('#request-form input[name="files"]')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    }
  })
}

test('file request retains a completed bronze selection and clears incompatible dimensions after shape change', async ({ page }) => {
  await page.goto('/produkciya/cvetnye-metally/bronza')
  const picker = page.locator('.nonferrous-picker')
  await picker.getByLabel('Форма изделия').selectOption('Квадрат')
  await picker.getByLabel('Сторона, мм').fill('20.5')
  await picker.getByLabel('Длина, мм (если известна)').fill('1000')
  await picker.getByLabel('Марка металла / сплава').selectOption('БрАМц9-2')
  const fileLink = picker.getByRole('link', { name: /Excel/ })
  await expect(fileLink).toHaveAttribute('href', (await picker.locator('.nonferrous-submit').getAttribute('href'))!)
  const specification = new URL((await fileLink.getAttribute('href'))!, 'https://magicmet.ru').searchParams.get('product')!
  expect(specification).toContain('Квадрат 20,5×20,5 мм')
  expect(specification).toContain('длина 1000 мм')
  await fileLink.click()
  await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(`${specification}: `)
  await page.goBack()
  await picker.getByLabel('Форма изделия').selectOption('Шестигранник')
  const fallback = new URL((await fileLink.getAttribute('href'))!, 'https://magicmet.ru').searchParams.get('product')!
  expect(fallback).not.toContain('1000')
  expect(fallback).not.toContain('20,5')
})

test('specification file path retains product without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  try {
    const page = await context.newPage()
    await page.route('**/api/request', route => route.abort())
    await page.goto('/produkciya/cvetnye-metally/bronza')
    const title = await page.locator('h1').innerText()
    await page.locator('.nonferrous-picker').getByRole('link', { name: /Excel/ }).click()
    await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(`${title}: `)
  } finally { await context.close() }
})
