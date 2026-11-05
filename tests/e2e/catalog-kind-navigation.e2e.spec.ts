import { expect, test, type BrowserContext, type Locator } from '@playwright/test'

const categoryPath = '/produkciya/metizy-i-svarochnye-materialy'
const fastenerPath = `${categoryPath}/krepezh`
const weldingPath = `${categoryPath}/svarochnye-materialy`
const fasteners = [
  { id: 'nut', label: 'Гайки', value: 'Гайка' },
  { id: 'bolt', label: 'Болты', value: 'Болт' },
  { id: 'stud', label: 'Шпильки', value: 'Шпилька' },
  { id: 'washer', label: 'Шайбы', value: 'Шайба' },
] as const
const welding = [
  { id: 'solid-wire', label: 'Проволока сплошная', value: 'Проволока сплошная' },
  { id: 'flux-cored-wire', label: 'Проволока порошковая', value: 'Проволока порошковая' },
  { id: 'covered-electrode', label: 'Электроды покрытые', value: 'Электрод покрытый' },
  { id: 'filler-rod', label: 'Присадочные прутки', value: 'Присадочный пруток' },
] as const

async function blockSideEffects(context: BrowserContext) {
  await context.route('**/*', route => {
    const request = route.request()
    const hostname = new URL(request.url()).hostname
    if (!['GET', 'HEAD'].includes(request.method()) || /(?:yandex|google-analytics|googletagmanager)/u.test(hostname)) return route.abort()
    return route.continue()
  })
}

async function expectKindLinks(nav: Locator, path: string, kinds: readonly { id: string; label: string }[]) {
  await expect(nav).toBeVisible()
  await expect(nav.getByRole('link')).toHaveCount(kinds.length)
  for (const kind of kinds) {
    const link = nav.getByRole('link', { name: kind.label, exact: true })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', `${path}?kind=${kind.id}#selection`)
  }
}

test.beforeEach(async ({ context }) => { await blockSideEffects(context) })

for (const width of [320, 390, 1536]) {
  test(`home exposes existing fastener and welding kinds with item rows closed at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    const group = page.locator('details.catalog-group').filter({ has: page.getByText('Метизы и сварочные материалы', { exact: true }) })
    await group.locator(':scope > summary').click()
    for (const title of ['Крепёж', 'Проволока и электроды']) {
      const item = group.locator('details.catalog-item').filter({ has: page.getByText(title, { exact: true }) })
      await expect(item).toHaveCount(1)
      expect(await item.evaluate(element => element.hasAttribute('open'))).toBe(false)
    }
    await expectKindLinks(group.getByRole('navigation', { name: 'Виды: Крепёж', exact: true }), fastenerPath, fasteners)
    await expectKindLinks(group.getByRole('navigation', { name: 'Виды: Проволока и электроды', exact: true }), weldingPath, welding)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await group.getByRole('navigation', { name: 'Виды: Крепёж', exact: true }).getByRole('link', { name: 'Болты', exact: true }).click()
    await expect(page.locator('.fastener-picker').getByRole('button', { name: 'Болты', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('#selection')).toBeVisible()
    expect(new URL(page.url()).hash).toBe('#selection')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  })

  test(`category links select powder wire without adding another catalog page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(categoryPath)
    await expectKindLinks(page.getByRole('navigation', { name: 'Виды: Крепёж', exact: true }), fastenerPath, fasteners)
    const navigation = page.getByRole('navigation', { name: 'Виды: Проволока и электроды', exact: true })
    await expectKindLinks(navigation, weldingPath, welding)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await navigation.getByRole('link', { name: 'Проволока порошковая', exact: true }).click()
    await expect(page.locator('.special-procurement-picker').getByRole('combobox', { name: 'Вид материала', exact: true })).toHaveValue('Проволока порошковая')
    await expect(page.locator('#selection')).toBeVisible()
    expect(new URL(page.url()).pathname).toBe(weldingPath)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  })
}

for (const kind of fasteners) {
  test(`fastener deep link ${kind.id} retains selected kind, dimensions and request context`, async ({ page }) => {
    await page.goto(`${fastenerPath}?kind=${kind.id}#selection`)
    const picker = page.locator('.fastener-picker')
    await expect(picker.getByRole('button', { name: kind.label, exact: true })).toHaveAttribute('aria-pressed', 'true')
    const threadLabel = kind.id === 'washer' ? 'Под какой размер крепежа' : 'Номинальная резьба'
    if (kind.id === 'nut') await picker.getByLabel(threadLabel).selectOption('M12')
    else await picker.getByLabel(threadLabel).fill('М12')
    if (kind.id === 'bolt' || kind.id === 'stud') await picker.getByLabel('Длина изделия, мм', { exact: true }).fill('60')
    await picker.getByLabel('Количество', { exact: true }).fill('12')
    const action = picker.locator('.fastener-submit')
    await expect(action).toBeVisible()
    const href = new URL((await action.getAttribute('href'))!, 'https://magicmet.ru')
    const request = href.searchParams.get('product')!
    expect(request).toContain(`${kind.value} M12${kind.id === 'bolt' || kind.id === 'stud' ? '×60' : ''}`)
    expect(request).toContain('количество 12 шт.')
    expect(href.hash).toBe('#request')
    await action.click()
    await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(`${request}: `)
  })
}

for (const kind of welding) {
  test(`welding deep link ${kind.id} preserves its distinct material kind in the request`, async ({ page }) => {
    await page.goto(`${weldingPath}?kind=${kind.id}#selection`)
    const picker = page.locator('.special-procurement-picker')
    await expect(picker.getByRole('combobox', { name: 'Вид материала', exact: true })).toHaveValue(kind.value)
    await picker.getByLabel('Диаметр, мм', { exact: true }).fill('1.2')
    await picker.getByLabel('Марка сварочного материала', { exact: true }).fill('Св-08Г2С')
    const action = picker.locator('.special-procurement-submit')
    await expect(action).toBeVisible()
    const request = new URL((await action.getAttribute('href'))!, 'https://magicmet.ru').searchParams.get('product')!
    expect(request).toContain(`${kind.value} Ø1,2 мм`)
    expect(request).toContain('Св-08Г2С')
    await action.click()
    await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(`${request}: `)
  })
}

test('unknown and cross-product kind parameters cannot select an unrelated kind', async ({ page }) => {
  for (const id of ['not-a-kind', 'solid-wire']) {
    await page.goto(`${fastenerPath}?kind=${id}#selection`)
    const picker = page.locator('.fastener-picker')
    await expect(picker.getByRole('button', { name: 'Гайки', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(picker.getByRole('button', { pressed: true })).toHaveCount(1)
  }
  for (const id of ['not-a-kind', 'bolt']) {
    await page.goto(`${weldingPath}?kind=${id}#selection`)
    const picker = page.locator('.special-procurement-picker')
    await expect(picker.getByRole('combobox', { name: 'Вид материала', exact: true })).toHaveValue('')
    await expect(picker.locator('.special-procurement-submit')).toHaveCount(0)
  }
})

test('changing a deep-linked fastener kind clears incompatible invalid dimensions', async ({ page }) => {
  await page.goto(`${fastenerPath}?kind=bolt#selection`)
  const picker = page.locator('.fastener-picker')
  await expect(picker.getByRole('button', { name: 'Болты', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await picker.getByLabel('Номинальная резьба').fill('М12')
  await picker.getByLabel('Длина изделия, мм', { exact: true }).fill('-1')
  await expect(picker.locator('.fastener-submit')).toHaveCount(0)
  await picker.getByRole('button', { name: 'Гайки', exact: true }).click()
  await expect(picker.getByRole('button', { name: 'Гайки', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(picker.getByLabel('Номинальная резьба')).toHaveValue('')
  await expect(picker.getByLabel('Длина изделия, мм', { exact: true })).toHaveCount(0)
  await picker.getByLabel('Номинальная резьба').selectOption('M12')
  const request = new URL((await picker.locator('.fastener-submit').getAttribute('href'))!, 'https://magicmet.ru').searchParams.get('product')!
  expect(request).toContain('Гайка M12')
  expect(request).not.toContain('Болт')
  expect(request).not.toContain('-1')
})

test('changing the welding kind clears diameter, grade and standard before a new request', async ({ page }) => {
  await page.goto(`${weldingPath}?kind=solid-wire#selection`)
  const picker = page.locator('.special-procurement-picker')
  await expect(picker.getByRole('combobox', { name: 'Вид материала', exact: true })).toHaveValue('Проволока сплошная')
  await picker.getByLabel('Диаметр, мм', { exact: true }).fill('1.2')
  await picker.getByLabel('Марка сварочного материала', { exact: true }).fill('Св-08Г2С')
  await picker.getByLabel('ГОСТ / ТУ / НД', { exact: true }).fill('ГОСТ 2246-70')
  await picker.getByLabel('Способ сварки / упаковка', { exact: true }).fill('катушка')
  await picker.getByLabel('Количество', { exact: true }).fill('2')
  await expect(picker.locator('.special-procurement-submit')).toBeVisible()
  await picker.getByRole('combobox', { name: 'Вид материала', exact: true }).selectOption('Электрод покрытый')
  for (const label of ['Диаметр, мм', 'Марка сварочного материала', 'ГОСТ / ТУ / НД', 'Способ сварки / упаковка']) {
    await expect(picker.getByLabel(label, { exact: true })).toHaveValue('')
  }
  await expect(picker.getByLabel('Количество', { exact: true })).toHaveValue('2')
  await expect(picker.locator('.special-procurement-submit')).toHaveCount(0)
  await picker.getByLabel('Диаметр, мм', { exact: true }).fill('3')
  await expect(picker.locator('.special-procurement-submit')).toBeVisible()
  const request = new URL((await picker.locator('.special-procurement-submit').getAttribute('href'))!, 'https://magicmet.ru').searchParams.get('product')!
  expect(request).toContain('Электрод покрытый Ø3 мм')
  expect(request).toContain('количество 2 кг')
  expect(request).not.toContain('Св-08Г2С')
  expect(request).not.toContain('2246-70')
  expect(request).not.toContain('катушка')
  expect(request).not.toContain('1,2')
})

test('native kind navigation and explicit specification links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  await blockSideEffects(context)
  try {
    const page = await context.newPage()
    await page.goto('/')
    const group = page.locator('details.catalog-group').filter({ has: page.getByText('Метизы и сварочные материалы', { exact: true }) })
    await group.locator(':scope > summary').click()
    await expectKindLinks(group.getByRole('navigation', { name: 'Виды: Крепёж', exact: true }), fastenerPath, fasteners)
    await expectKindLinks(group.getByRole('navigation', { name: 'Виды: Проволока и электроды', exact: true }), weldingPath, welding)
    await group.getByRole('navigation', { name: 'Виды: Крепёж', exact: true }).getByRole('link', { name: 'Болты', exact: true }).click()
    const fastenerFallback = page.locator('.catalog-kind-fallback')
    for (const kind of fasteners) {
      const link = fastenerFallback.getByRole('link', { name: kind.label, exact: true })
      await expect(link).toBeVisible()
      const url = new URL((await link.getAttribute('href'))!, 'https://magicmet.ru')
      expect(url.pathname).toBe('/')
      expect(url.hash).toBe('#request')
      expect(url.searchParams.get('product')).toContain(kind.value)
    }
    await fastenerFallback.getByRole('link', { name: 'Болты', exact: true }).click()
    expect(new URL(page.url()).searchParams.get('product')).toContain('Болт')
    await expect(page.locator('#request-form input[name="files"]')).toBeVisible()

    await page.goto(categoryPath)
    await expectKindLinks(page.getByRole('navigation', { name: 'Виды: Крепёж', exact: true }), fastenerPath, fasteners)
    const weldingNav = page.getByRole('navigation', { name: 'Виды: Проволока и электроды', exact: true })
    await expectKindLinks(weldingNav, weldingPath, welding)
    await weldingNav.getByRole('link', { name: 'Проволока порошковая', exact: true }).click()
    const weldingFallback = page.locator('.catalog-kind-fallback')
    for (const kind of welding) {
      const link = weldingFallback.getByRole('link', { name: kind.label, exact: true })
      await expect(link).toBeVisible()
      const url = new URL((await link.getAttribute('href'))!, 'https://magicmet.ru')
      expect(url.pathname).toBe('/')
      expect(url.hash).toBe('#request')
      expect(url.searchParams.get('product')).toContain(kind.value)
    }
    await weldingFallback.getByRole('link', { name: 'Проволока порошковая', exact: true }).click()
    expect(new URL(page.url()).searchParams.get('product')).toContain('Проволока порошковая')
    await expect(page.locator('#request-form input[name="files"]')).toBeVisible()
  } finally { await context.close() }
})
