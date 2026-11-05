import { expect, test, type BrowserContext } from '@playwright/test'

const category = '/produkciya/metizy-i-svarochnye-materialy'
const meshPath = `${category}/setki`
const kinds = [
  { id: 'welded', label: 'Сварная', value: 'Сварная' },
  { id: 'woven', label: 'Тканая', value: 'Тканая' },
  { id: 'chain-link', label: 'Плетёная (рабица)', value: 'Плетёная' },
] as const

async function guard(context: BrowserContext) {
  await context.route('**/*', route => {
    const request = route.request()
    if (!['GET', 'HEAD'].includes(request.method()) || /yandex|google-analytics|googletagmanager/u.test(new URL(request.url()).hostname)) return route.abort()
    return route.continue()
  })
}

test.beforeEach(async ({ context }) => { await guard(context) })

test('mesh kinds are visible in the catalog and select the right form at mobile and desktop widths', async ({ page }) => {
  test.setTimeout(90_000)
  for (const width of [320, 390, 1536]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    const group = page.locator('.catalog-group').filter({ has: page.getByText('Метизы и сварочные материалы', { exact: true }) })
    await group.locator(':scope > summary').click()
    const row = group.locator('.catalog-item').filter({ has: page.getByText('Сетки', { exact: true }) })
    expect(await row.evaluate(element => element.hasAttribute('open'))).toBe(false)
    for (const path of ['/', category]) {
      if (path !== '/') await page.goto(path)
      const navigation = page.getByRole('navigation', { name: 'Виды: Сетки', exact: true })
      await expect(navigation).toBeVisible()
      await expect(navigation.getByRole('link')).toHaveCount(3)
      for (const kind of kinds) {
        const link = navigation.getByRole('link', { name: kind.label, exact: true })
        await expect(link).toBeVisible()
        await expect(link).toHaveAttribute('href', `${meshPath}?kind=${kind.id}#selection`)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    }
    await page.getByRole('navigation', { name: 'Виды: Сетки', exact: true }).getByRole('link', { name: 'Тканая', exact: true }).click()
    const picker = page.locator('.mesh-rope-picker[data-product="mesh"]')
    await expect(picker.getByRole('button', { name: 'Тканая', exact: true })).toHaveAttribute('aria-pressed', 'true')
    const extras = picker.locator('details.mesh-extra')
    expect(await extras.evaluate(element => element.hasAttribute('open'))).toBe(false)
    await expect(extras.locator('summary')).toHaveText('Формат и дополнительные требования')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  }
})

for (const kind of kinds) {
  test(`mesh ${kind.id} retains its kind, cell, wire diameter and quantity in the request`, async ({ page }) => {
    await page.goto(`${meshPath}?kind=${kind.id}#selection`)
    const picker = page.locator('.mesh-rope-picker[data-product="mesh"]')
    await expect(picker.getByRole('button', { name: kind.label, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await picker.getByLabel('Ячейка A, мм', { exact: true }).fill('50')
    await picker.getByLabel('Ячейка B, мм', { exact: true }).fill('50')
    await picker.getByLabel('Диаметр проволоки, мм', { exact: true }).fill('3')
    await picker.getByLabel('Количество (необязательно)', { exact: true }).fill('2')
    const action = picker.locator('.mesh-rope-submit')
    await expect(action).toBeVisible()
    const destination = new URL((await action.getAttribute('href'))!, 'https://magicmet.ru')
    const request = destination.searchParams.get('product')!
    expect(request).toContain(kind.value)
    expect(request).toContain('ячейка 50×50 мм')
    expect(request).toContain('проволока Ø3 мм')
    expect(request).toContain('количество 2 м²')
    expect(destination.hash).toBe('#request')
    await action.click()
    await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(`${request}: `)
  })
}

test('a foreign kind is ignored and a mesh kind switch clears incompatible parameters', async ({ page }) => {
  await page.goto(`${meshPath}?kind=bolt#selection`)
  const picker = page.locator('.mesh-rope-picker[data-product="mesh"]')
  await expect(picker.getByRole('button', { pressed: true })).toHaveCount(0)
  await expect(picker.locator('.mesh-rope-submit')).toHaveCount(0)
  await picker.getByRole('button', { name: 'Сварная', exact: true }).click()
  await picker.getByLabel('Ячейка A, мм', { exact: true }).fill('50')
  await picker.getByLabel('Ячейка B, мм', { exact: true }).fill('50')
  await picker.getByLabel('Диаметр проволоки, мм', { exact: true }).fill('3')
  await picker.getByLabel('Количество (необязательно)', { exact: true }).fill('2')
  await picker.locator('details.mesh-extra > summary').click()
  await picker.getByLabel('Материал проволоки', { exact: true }).fill('сталь по сертификату')
  await picker.getByLabel('ГОСТ / ТУ', { exact: true }).fill('по исходной спецификации')
  await picker.getByRole('button', { name: 'Тканая', exact: true }).click()
  for (const label of ['Ячейка A, мм', 'Ячейка B, мм', 'Диаметр проволоки, мм', 'Материал проволоки', 'ГОСТ / ТУ']) {
    await expect(picker.getByLabel(label, { exact: true })).toHaveValue('')
  }
  await expect(picker.getByLabel('Количество (необязательно)', { exact: true })).toHaveValue('2')
  await expect(picker.locator('.mesh-rope-submit')).toHaveCount(0)
})

test('mesh kind requests remain explicit and usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  await guard(context)
  try {
    const page = await context.newPage()
    await page.goto(`${meshPath}?kind=chain-link#selection`)
    const fallback = page.locator('.catalog-kind-fallback')
    await expect(fallback.getByRole('link')).toHaveCount(3)
    for (const kind of kinds) {
      const link = fallback.getByRole('link', { name: kind.label, exact: true })
      await expect(link).toBeVisible()
      const destination = new URL((await link.getAttribute('href'))!, 'https://magicmet.ru')
      expect(destination.pathname).toBe('/')
      expect(destination.searchParams.get('product')).toContain(kind.value)
      expect(destination.hash).toBe('#request')
    }
    await fallback.getByRole('link', { name: 'Плетёная (рабица)', exact: true }).click()
    expect(new URL(page.url()).searchParams.get('product')).toContain('Плетёная')
    await expect(page.locator('#request-form input[name="files"]')).toBeVisible()
  } finally { await context.close() }
})
