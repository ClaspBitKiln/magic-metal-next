import { expect, test, type BrowserContext } from '@playwright/test'

const category = '/produkciya/cvetnye-metally'
const forms = [
  { slug: 'med', title: 'Медь', ids: ['sheet', 'strip', 'tube', 'round', 'wire'] },
  { slug: 'latun', title: 'Латунь', ids: ['sheet', 'strip', 'tube', 'round', 'wire'] },
  { slug: 'bronza', title: 'Бронза', ids: ['round', 'square', 'hexagon', 'blank', 'strip', 'sheet'] },
  { slug: 'alyuminij', title: 'Алюминий', ids: ['sheet', 'plate', 'tube', 'round', 'wire'] },
  { slug: 'titan', title: 'Титан', ids: ['sheet', 'tube', 'round', 'blank'] },
  { slug: 'olovo', title: 'Олово', ids: ['ingot', 'round'] },
  { slug: 'svinec', title: 'Свинец', ids: ['ingot', 'sheet', 'blank'] },
  { slug: 'cink', title: 'Цинк', ids: ['ingot', 'sheet'] },
  { slug: 'nihrom', title: 'Нихром', ids: ['wire', 'strip', 'round'] },
  { slug: 'babbit', title: 'Баббит', ids: ['ingot', 'blank'] },
] as const

async function guard(context: BrowserContext) {
  await context.route('**/*', route => {
    const request = route.request()
    if (!['GET', 'HEAD'].includes(request.method()) || /yandex|google-analytics|googletagmanager/u.test(new URL(request.url()).hostname)) return route.abort()
    return route.continue()
  })
}

test.beforeEach(async ({ context }) => { await guard(context) })

test('all ten existing nonferrous products expose only their supported forms while the homepage stays compact', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await expect(page.locator('.catalog-kind-links > a')).toHaveCount(11)
  await expect(page.locator('.catalog-kind-links a[href^="/produkciya/cvetnye-metally/"]')).toHaveCount(0)
  for (const width of [320, 390, 1536]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(category)
    await expect(page.locator('.catalog-kind-links')).toHaveCount(10)
    for (const product of forms) {
      const navigation = page.getByRole('navigation', { name: `Виды: ${product.title}`, exact: true })
      await expect(navigation).toBeVisible()
      const links = navigation.getByRole('link')
      await expect(links).toHaveCount(product.ids.length)
      expect(await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual(
        product.ids.map(id => `${category}/${product.slug}?kind=${id}#selection`),
      )
    }
    const bronze = page.getByRole('navigation', { name: 'Виды: Бронза', exact: true })
    await expect(bronze.getByRole('link', { name: 'Проволока', exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  }
})

test('deep-linked copper tube, bronze hexagon, aluminum plate and lead ingot retain their form and supplied parameters in the request', async ({ page }) => {
  test.setTimeout(90_000)
  const cases = [
    { slug: 'med', id: 'tube', name: 'Труба', fields: [['Наружный диаметр, мм', '20'], ['Толщина стенки, мм', '2'], ['Длина, мм (если известна)', '1000']], designation: 'Труба Ø20×2×1000 мм' },
    { slug: 'bronza', id: 'hexagon', name: 'Шестигранник', fields: [['Размер под ключ, мм', '20'], ['Длина, мм (если известна)', '1000']], designation: 'Шестигранник под ключ 20 мм' },
    { slug: 'alyuminij', id: 'plate', name: 'Плита', fields: [['Толщина, мм', '2'], ['Раскрой, мм', '1000 × 2000']], designation: 'Плита; толщина 2 мм; раскрой 1000 × 2000 мм' },
    { slug: 'svinec', id: 'ingot', name: 'Чушка / блок', fields: [], designation: 'Чушка / блок по спецификации' },
  ] as const
  for (const item of cases) {
    await page.goto(`${category}/${item.slug}?kind=${item.id}#selection`)
    const picker = page.locator('.nonferrous-picker')
    await expect(picker.getByRole('radio', { name: item.name, exact: true })).toBeChecked()
    for (const [label, value] of item.fields) await picker.getByLabel(label, { exact: true }).fill(value)
    if (item.id === 'plate') await picker.locator('.nonferrous-sheet-extra > summary').click()
    await picker.getByLabel('Количество', { exact: true }).fill('12')
    const action = picker.locator('.nonferrous-submit')
    const destination = new URL((await action.getAttribute('href'))!, 'https://magicmet.ru')
    const request = destination.searchParams.get('product')!
    expect(destination.pathname).toBe('/')
    expect(destination.hash).toBe('#request')
    expect(request).toContain(item.designation)
    expect(request).toContain('количество 12 кг')
    await action.click()
    await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(`${request}: `)
  }
})

test('foreign or unsupported kinds are ignored and changing a selected form clears incompatible dimensions and grade', async ({ page }) => {
  for (const [slug, id] of [['med', 'bolt'], ['bronza', 'wire']]) {
    await page.goto(`${category}/${slug}?kind=${id}#selection`)
    await expect(page.locator('.nonferrous-picker').getByRole('radio', { checked: true })).toHaveCount(0)
  }
  await page.goto(`${category}/bronza?kind=hexagon#selection`)
  const picker = page.locator('.nonferrous-picker')
  await expect(picker.getByRole('radio', { name: 'Шестигранник', exact: true })).toBeChecked()
  await picker.getByLabel('Размер под ключ, мм', { exact: true }).fill('20')
  await picker.getByLabel('Длина, мм (если известна)', { exact: true }).fill('1000')
  await picker.getByLabel('Марка металла / сплава').selectOption('__other__')
  await picker.getByLabel('Укажите другую марку', { exact: true }).fill('по исходной спецификации')
  await picker.getByLabel('Количество', { exact: true }).fill('12')
  await picker.locator('.nonferrous-advanced > summary').click()
  await picker.getByLabel('Состояние / способ изготовления', { exact: true }).fill('по чертежу')
  await picker.getByLabel('ГОСТ / ТУ / ASTM', { exact: true }).fill('норматив заказчика')
  await picker.getByRole('radio', { name: 'Лист', exact: true }).check()
  for (const label of ['Толщина, мм', 'Раскрой, мм', 'Состояние / способ изготовления', 'ГОСТ / ТУ / ASTM']) {
    await expect(picker.getByLabel(label, { exact: true })).toHaveValue('')
  }
  await expect(picker.getByLabel('Марка металла / сплава')).toHaveValue('')
  await expect(picker.getByLabel('Укажите другую марку', { exact: true })).toHaveCount(0)
  await expect(picker.getByLabel('Количество', { exact: true })).toHaveValue('12')
  const request = new URL((await picker.locator('.nonferrous-submit').getAttribute('href'))!, 'https://magicmet.ru').searchParams.get('product')!
  expect(request).toContain('Лист')
  expect(request).not.toContain('Шестигранник')
  expect(request).not.toContain('1000')
})

test('nonferrous form links retain an explicit request choice without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  await guard(context)
  try {
    const page = await context.newPage()
    await page.goto(`${category}/bronza?kind=hexagon#selection`)
    const fallback = page.locator('.catalog-kind-fallback')
    await expect(fallback.getByRole('link')).toHaveCount(6)
    await expect(fallback.getByRole('link', { name: 'Проволока', exact: true })).toHaveCount(0)
    const link = fallback.getByRole('link', { name: 'Шестигранник', exact: true })
    const destination = new URL((await link.getAttribute('href'))!, 'https://magicmet.ru')
    expect(destination.pathname).toBe('/')
    expect(destination.hash).toBe('#request')
    expect(destination.searchParams.get('product')).toContain('Шестигранник')
    await link.focus()
    await page.keyboard.press('Enter')
    await page.waitForURL(url => url.pathname === '/' && url.hash === '#request')
    expect(new URL(page.url()).searchParams.get('product')).toContain('Шестигранник')
    await expect(page.locator('#request-form input[name="files"]')).toBeVisible()
  } finally { await context.close() }
})
