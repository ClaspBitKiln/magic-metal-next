import { test, expect } from '@playwright/test'

const url = '/produkciya/sortovoy-i-fasonny-prokat/ugolok'

for (const width of [320, 390, 1536]) {
  test(`Technical Catalog UI: angle buyer summary at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await page.evaluate(() => document.fonts.ready)

    await expect(page.getByRole('heading', { name: 'Уголок: основные параметры' })).toBeVisible()
    const summary = page.locator('.technical-catalog-summary')
    await expect(summary).toContainText('09Г2С')
    await expect(summary).toContainText('ГОСТ 8509-93')
    await expect(summary).toContainText('Ст3')
    await expect(summary.getByRole('link', { name: /В заявку/ })).toHaveAttribute('href', /[?&]product=.*#request$/)
    await expect(summary.getByRole('link', { name: /Посмотреть размерный ряд/ })).toHaveAttribute('href', '#sizes')
    await expect(page.locator('#sizes')).toHaveCount(1)

    const layout = await page.evaluate(() => {
      const title = document.querySelector<HTMLElement>('.technical-catalog-summary h2')!
      const action = document.querySelector<HTMLElement>('.technical-catalog-summary-heading > a')!
      const heading = document.querySelector<HTMLElement>('.pipe-hero h1')!
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        titleSize: parseFloat(getComputedStyle(title).fontSize),
        headingSize: parseFloat(getComputedStyle(heading).fontSize),
        buttonHeight: action.getBoundingClientRect().height,
        firstSummaryTop: title.getBoundingClientRect().top + window.scrollY,
      }
    })
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth)
    expect(layout.titleSize).toBeGreaterThanOrEqual(21)
    expect(layout.titleSize).toBeLessThanOrEqual(29)
    expect(layout.headingSize).toBeLessThanOrEqual(41)
    expect(layout.buttonHeight).toBeGreaterThanOrEqual(44)
    expect(layout.firstSummaryTop).toBeLessThan(900)
    await page.screenshot({ path: `test-results/technical-angle-${width}.png`, fullPage: true })
  })
}

test('round bar and rebar summaries remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 390, height: 900 } })
  try {
    const page = await context.newPage()
    await page.route('**/api/request', route => route.abort())
    for (const slug of ['krug-goryachekatanyj', 'armatura']) {
      await page.goto(`/produkciya/sortovoy-i-fasonny-prokat/${slug}`)
      const summary = page.locator('.technical-catalog-summary')
      await expect(summary).toBeVisible()
      const action = summary.getByRole('link', { name: 'В заявку ↗' })
      const title = await page.locator('h1').innerText()
      expect(new URL((await action.getAttribute('href'))!, 'https://magicmet.ru').searchParams.get('product')).toBe(title)
      await expect(summary).toContainText('перечень не подтверждает наличие')
    }
  } finally { await context.close() }
})

test('Technical Catalog UI does not leak to other products', async ({ page }) => {
  await page.goto('/produkciya/sortovoy-i-fasonny-prokat/shveller-gnutyj')
  await expect(page.locator('.technical-catalog-summary')).toHaveCount(0)
  await expect(page.locator('main.technical-catalog-pilot')).toHaveCount(0)
})


for (const product of [
  { slug: 'shveller', title: 'Швеллер', standard: 'ГОСТ 8240-97', field: 'Номер и серия', material: '09Г2С' },
  { slug: 'balka-dvutavrovaya', title: 'Балка двутавровая', standard: 'ГОСТ 35087-2024', field: 'Профиль', material: '09Г2С' },
  { slug: 'kvadrat', title: 'Квадрат', standard: 'ГОСТ 2591-2006', field: 'Сторона', material: '09Г2С' },
  { slug: 'shestigrannik', title: 'Шестигранник', standard: 'ГОСТ 2879-2006', field: 'Размеры заказа', material: 'марка стали — по заказу' },
  { slug: 'katanka', title: 'Катанка', standard: 'ГОСТ 30136-95', field: 'Диаметр', material: 'углеродистая сталь' },
  { slug: 'polosa', title: 'Полоса', standard: 'ГОСТ 103-2006', field: 'Сечение', material: 'марка стали по спецификации' },
  { slug: 'krug-goryachekatanyj', title: 'Круг горячекатаный', standard: 'ГОСТ 2590-2006', field: 'Диаметр', material: '12Х18Н10Т' },
  { slug: 'armatura', title: 'Арматура', standard: 'ГОСТ 34028-2016', field: 'Класс', material: '35ГС — марки стали по документации конкретной партии' },
]) {
  for (const width of [320, 390, 1536]) {
    test(`Technical Catalog UI: ${product.slug} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const response = await page.goto(`/produkciya/sortovoy-i-fasonny-prokat/${product.slug}`, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await page.evaluate(() => document.fonts.ready)
      const section = page.locator('.technical-catalog-summary')
      await expect(section.getByRole('heading', { name: `${product.title}: основные параметры` })).toBeVisible()
      await expect(section).toContainText(product.material)
      await expect(section).toContainText(product.standard)
      await expect(section).toContainText(product.field)
      await expect(section.getByRole('link', { name: /В заявку/ })).toHaveAttribute('href', /[?&]product=.*#request$/)
      const hasSizeSeries = await page.locator('#sizes').count() > 0
      if (hasSizeSeries) {
        await expect(section.getByRole('link', { name: /Посмотреть размерный ряд/ })).toHaveAttribute('href', '#sizes')
      } else {
        await expect(section.getByRole('link', { name: /Указать размер в заявке/ })).toHaveAttribute('href', /[?&]product=.*#request$/)
        await expect(section.getByRole('link', { name: /Посмотреть размерный ряд/ })).toHaveCount(0)
      }
      const result = await page.evaluate(() => {
        const title = document.querySelector<HTMLElement>('.technical-catalog-summary h2')!
        const hero = document.querySelector<HTMLElement>('.pipe-hero h1')!
        const button = document.querySelector<HTMLElement>('.technical-catalog-summary-heading > a')!
        return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth,
          titleSize: parseFloat(getComputedStyle(title).fontSize), heroSize: parseFloat(getComputedStyle(hero).fontSize),
          buttonHeight: button.getBoundingClientRect().height,
          textSize: getComputedStyle(document.querySelector('.technical-catalog-summary dd')!).fontSize,
          actionSize: getComputedStyle(button).fontSize,
          summaryTop: title.getBoundingClientRect().top + window.scrollY }
      })
      expect(result.scroll).toBeLessThanOrEqual(result.client)
      expect(result.titleSize).toBeLessThanOrEqual(29)
      expect(result.heroSize).toBeLessThanOrEqual(41)
      expect(result.buttonHeight).toBeGreaterThanOrEqual(44)
      if (['krug-goryachekatanyj', 'armatura'].includes(product.slug)) {
        expect(result.summaryTop).toBeLessThan(900)
        expect(result.textSize).toBe('15px')
        expect(result.actionSize).toBe('15px')
        console.log(JSON.stringify({ product: product.slug, width, typography: result }))
        await page.screenshot({ path: `test-results/technical-${product.slug}-${width}.png`, fullPage: true })
      }
    })
  }
}
