import { expect, test } from '@playwright/test'

for (const width of [320, 390, 900, 1536]) {
  test(`approved product card has no illustrative photo or empty photo column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/produkciya/truby-elektrosvarnye/vodogazoprovodnye')
    const summary = page.locator('.technical-catalog-summary')
    await expect(summary).toBeVisible()
    await expect(summary.locator('.product-document-image')).toHaveCount(0)
    await expect(summary.locator('.product-document-summary-body')).toHaveClass(/product-document-summary-no-image/)
    const columns = await summary.locator('.product-document-summary-body').evaluate(el => getComputedStyle(el).gridTemplateColumns)
    expect(columns.trim().split(/\s+/)).toHaveLength(1)
    await expect(page.getByRole('link', { name: 'Отправить заявку ↗' }).first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  })
}


test('nonferrous approved card keeps catalog name and unrestricted request action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/produkciya/cvetnye-metally/med')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('.technical-catalog-summary .product-document-image')).toHaveCount(0)
  await expect(page.locator('.technical-catalog-summary .product-document-summary-body')).toHaveClass(/product-document-summary-no-image/)
  await expect(page.locator('.nonferrous-picker').getByRole('link', { name: /Excel/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
})

for (const [slug, label] of [
  ['/produkciya/cvetnye-metally/med', 'copper'],
  ['/produkciya/truby-elektrosvarnye/vodogazoprovodnye', 'pipe'],
  ['/produkciya/sdt/otvody-besshovnye', 'fitting'],
] as const) {
  for (const width of [320, 390, 1536]) {
    test(`approved A composition ${label} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(slug)
      const stage = page.locator('.product-document-stage')
      const summary = stage.locator('.technical-catalog-summary')
      const selection = stage.locator('.product-document-selection')
      await expect(summary).toBeVisible()
      await expect(selection).toBeVisible()
      const a = await summary.boundingBox()
      const b = await selection.boundingBox()
      expect(a).not.toBeNull()
      expect(b).not.toBeNull()
      if (width >= 1050) {
        expect(b!.x).toBeGreaterThan(a!.x + a!.width - 2)
        expect(Math.abs(b!.y - a!.y)).toBeLessThanOrEqual(3)
      } else {
        expect(b!.y).toBeGreaterThan(a!.y + a!.height - 2)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
      await expect(stage.locator('.technical-catalog-summary h2')).toBeVisible()
    })
  }
}

test('approved A shows factual highlights before technical table and request beside it', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 960 })
  await page.goto('/produkciya/cvetnye-metally/med')
  const summary = page.locator('.technical-catalog-summary')
  const tiles = summary.locator('.product-document-highlight')
  await expect(tiles).toHaveCount(4)
  await expect(tiles.first()).toContainText('лист')
  await expect(tiles.last()).toContainText('ГОСТ 859-2014')
  const tileBox = await tiles.first().boundingBox()
  const tableBox = await summary.locator('dl').boundingBox()
  expect(tileBox).not.toBeNull()
  expect(tableBox).not.toBeNull()
  expect(tileBox!.y + tileBox!.height).toBeLessThan(tableBox!.y)
  await expect(page.locator('.product-document-selection')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
})

test('approved A has no invented item photo or price claim', async ({ page }) => {
  await page.goto('/produkciya/cvetnye-metally/med')
  await expect(page.locator('.product-document-image')).toHaveCount(0)
  await expect(page.locator('.technical-catalog-summary')).not.toContainText('В наличии')
  await expect(page.locator('.technical-catalog-summary')).not.toContainText('₽')
})

for (const width of [320, 390, 1536]) {
  test(`approved A copper rod sizes are factual and directly selectable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/produkciya/cvetnye-metally/med#sizes')
    const sizes = page.locator('.product-document-quick-sizes')
    await expect(sizes).toBeVisible()
    await expect(sizes).toContainText('прессованных прутков')
    const links = sizes.locator('nav a')
    expect(await links.count()).toBeGreaterThan(5)
    const choice = links.filter({ hasText: /^20$/ }).first()
    await expect(choice).toHaveAttribute('href', /product=.+#request$/)
    const destination = await choice.getAttribute('href')
    const params = new URL(destination!, 'https://magicmet.ru').searchParams.get('product')
    expect(params).toContain('круг прессованный, диаметр 20 мм')
    expect(params).toContain('ГОСТ 1535-2016')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  })
}

for (const slug of ['bronza', 'med', 'alyuminij', 'titan', 'list'] as const) {
  for (const width of [320, 390, 1536]) {
    test(`alloy grade note is separated into readable blocks on ${slug} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const category = slug === 'list' ? 'nerzhaveyushchaya-stal' : 'cvetnye-metally'
      await page.goto(`/produkciya/${category}/${slug}`)
      const reference = page.locator('.nonferrous-grade-reference')
      await expect(reference).toBeVisible()
      const heading = reference.locator('.nonferrous-grade-reference-heading')
      const grades = reference.locator('.nonferrous-grade-reference-list')
      const explanation = reference.locator('.nonferrous-grade-reference-explanation')
      const source = reference.locator('.nonferrous-grade-reference-source')
      await expect(heading).toContainText('Марки —')
      await expect(grades).not.toBeEmpty()
      await expect(explanation).toContainText('Выбранная марка')
      await expect(source.getByRole('link', { name: /Источник стандарта/ })).toHaveAttribute('href', /^https:\/\//)
      const blocks = await Promise.all([heading, grades, explanation, source].map(el => el.boundingBox()))
      for (let i = 1; i < blocks.length; i++) {
        expect(blocks[i]).not.toBeNull()
        expect(blocks[i - 1]).not.toBeNull()
        expect(blocks[i]!.y - (blocks[i - 1]!.y + blocks[i - 1]!.height)).toBeGreaterThanOrEqual(8)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    })
  }
}

for (const [slug, grade, destination, unlinked] of [
  ['bronza', 'БрАЖ9-4', 'bronza-brazh9-4', 'БрОФ6,5-0,15'],
  ['med', 'М1', 'med-m1', 'М0'],
  ['alyuminij', 'АД31', 'alyuminij-ad31', 'В95'],
  ['titan', 'ВТ6', 'titan-vt6', 'ОТ4'],
] as const) {
  for (const width of [320, 1536]) {
    test(`material pages are linked consistently and other grades stay text: ${slug} at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/produkciya/cvetnye-metally/${slug}`)
      const examples = page.locator('.nonferrous-grade-reference-list')
      await expect(examples).toBeVisible()
      await expect(examples.getByRole('link', { name: grade, exact: true })).toHaveAttribute('href', `/spravochnik-materialov/${destination}`)
      await expect(examples.locator('span', { hasText: unlinked })).toHaveCount(1)
      await expect(examples.getByRole('link', { name: unlinked, exact: true })).toHaveCount(0)
      await expect(page.locator('.technical-catalog-summary dd').first().getByRole('link', { name: grade, exact: true })).toHaveAttribute('href', `/spravochnik-materialov/${destination}`)
      const notes = page.locator('.nonferrous-grade-reference')
      await expect(notes.locator('.nonferrous-grade-reference-explanation')).toBeVisible()
      await expect(notes.locator('.nonferrous-grade-reference-source')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    })
  }
}
