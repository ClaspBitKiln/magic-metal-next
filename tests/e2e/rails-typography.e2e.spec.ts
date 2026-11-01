import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import { guardQaContext } from '../../qa/network-guard'

const railSlugs = ['zheleznodorozhnye', 'kranovye', 'promyshlennye', 'shahtnye', 'tramvaynye', 'specialnye']

test.beforeEach(async ({ context }) => {
  await guardQaContext(context)
})

async function fontsReady(page: Page) {
  await page.evaluate(() => document.fonts.ready)
}

async function measurements(page: Page, root: Locator) {
  const documentSize = await page.evaluate(() => ({
    innerWidth, devicePixelRatio,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  const elements = await root.evaluate(element => {
    const visible = (node: Element) => {
      const rect = node.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== 'hidden'
    }
    return [...element.querySelectorAll('h1, h2, p, th, td, dt, dd, summary, a, button, input, select, textarea')]
      .filter(visible).map(node => {
        const style = getComputedStyle(node)
        const rect = node.getBoundingClientRect()
        return {
          tag: node.tagName, text: (node.textContent || '').trim().slice(0, 100),
          fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight,
          left: rect.left, right: rect.right, width: rect.width, height: rect.height,
          clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
        }
      })
  })
  return { document: documentSize, elements }
}

async function attachEvidence(page: Page, root: Locator, info: TestInfo, label: string, extra: object = {}) {
  await info.attach(`${label}-computed-styles`, {
    body: JSON.stringify({ ...await measurements(page, root), ...extra }, null, 2),
    contentType: 'application/json',
  })
  await info.attach(`${label}-screenshot`, {
    body: await root.screenshot(), contentType: 'image/png',
  })
}

for (const width of [320, 390, 1536]) {
  test(`rails homepage expanded typography at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 })
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await fontsReady(page)
    const group = page.locator('details.catalog-group').filter({
      has: page.locator(':scope > summary strong', { hasText: /^Рельсы$/ }),
    })
    await expect(group).toHaveCount(1)
    const before = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    await group.locator(':scope > summary').click()
    await expect(group).toHaveAttribute('open', '')
    const rows = group.locator('details.catalog-item')
    await expect(rows).toHaveCount(6)
    // Open every changed row: collapsed content cannot establish wrap/overflow safety.
    for (const row of await rows.all()) {
      await row.locator(':scope > summary').click()
      await expect(row).toHaveAttribute('open', '')
      await expect(row.locator('a[href*="/produkciya/relsy/"]').first()).toBeVisible()
    }
    const after = await measurements(page, group)
    await attachEvidence(page, group, info, `home-rails-${width}`, { before })
    // The protected #about logos already overflow at 320px. Record it and reject
    // any new page overflow from opening rails rather than hiding that baseline.
    expect(after.document.scrollWidth - after.document.clientWidth).toBeLessThanOrEqual(
      Math.max(0, before.scrollWidth - before.clientWidth) + 1,
    )
    const bounds = await group.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(-1)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1)
    const acceptedSize = await page.locator('details.catalog-group > summary strong').first()
      .evaluate(node => getComputedStyle(node).fontSize)
    expect(await group.locator(':scope > summary strong').evaluate(node => getComputedStyle(node).fontSize))
      .toBe(acceptedSize)
  })

  for (const slug of railSlugs) {
    test(`rails ${slug} typography at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 1000 })
      // Compare with an existing compact detail page at the same breakpoint.
      await page.goto('/produkciya/nerzhaveyushchaya-stal/list', { waitUntil: 'domcontentloaded' })
      await fontsReady(page)
      const reference = await page.locator('.pipe-hero h1').evaluate(node => ({
        fontSize: getComputedStyle(node).fontSize, lineHeight: getComputedStyle(node).lineHeight,
      }))
      const response = await page.goto(`/produkciya/relsy/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await fontsReady(page)
      const main = page.locator('main.pipe-detail')
      await expect(main.locator('h1')).toBeVisible()
      await expect(main.locator('.pipe-spec h2')).toBeVisible()
      const measured = await measurements(page, main)
      await attachEvidence(page, main, info, `rails-${slug}-${width}`, { reference })
      expect(measured.document.scrollWidth).toBeLessThanOrEqual(measured.document.clientWidth + 1)
      expect(await main.locator('.pipe-hero h1').evaluate(node => getComputedStyle(node).fontSize))
        .toBe(reference.fontSize)
      // Request navigation is verified without clicking/submitting a real request.
      const request = main.locator('.pipe-conversion a')
      await expect(request).toHaveAttribute('href', /^\/(?:\?[^#]+)?#request$/)
      const box = await request.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.x).toBeGreaterThanOrEqual(-1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
    })
  }
}

for (const width of [320, 390, 1536]) {
  test(`rope sales preserve discrete diameters and accessible layout at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 })
    const response = await page.goto('/produkciya/metizy-i-svarochnye-materialy/kanaty', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await fontsReady(page)
    const sales = page.locator('#rope-sales')
    const constructions = sales.locator('.rope-sales-constructions > li')
    await expect(constructions).toHaveCount(68)
    await expect(sales.locator('form.rope-sales-diameter-form')).toHaveCount(47)
    await expect(page.locator('#stock-assortment')).toHaveCount(0)
    await expect(page.locator('#shenwei-matrix')).toHaveCount(0)
    const fc = constructions.filter({ has: page.locator('summary > span:first-child', { hasText: /^6×7\+FC$/ }) })
    const iws = constructions.filter({ has: page.locator('summary > span:first-child', { hasText: /^6×19\+IWS$/ }) })
    const sevenIws = constructions.filter({ has: page.locator('summary > span:first-child', { hasText: /^6×7\+IWS$/ }) })
    for (const entry of [fc, iws, sevenIws]) {
      await expect(entry).toHaveCount(1)
      await entry.locator('summary').click()
      await expect(entry.locator('select')).toBeVisible()
    }
    const fcLabels = await fc.locator('select option').allTextContents()
    expect(fcLabels.slice(1)).toEqual([
      '1,8', '2', '2,15', '2,5', '3', '3,05', '3,6', '4', '4,1', '4,5', '5', '5,4',
      '6', '7', '8', '9', '10', '11', '12', '13', '14', '16', '18', '20', '22', '24',
      '26', '28', '30', '32', '34', '36',
    ])
    const sevenIwsLabels = await sevenIws.locator('select option').allTextContents()
    expect(sevenIwsLabels.slice(1)).toHaveLength(31)
    expect(sevenIwsLabels).not.toContain('4,1')
    const iwsLabels = await iws.locator('select option').allTextContents()
    expect(iwsLabels).toContain('8,25')
    expect(iwsLabels).toContain('4')
    expect(iwsLabels).toContain('5')
    expect(iwsLabels.slice(1)).toHaveLength(35)
    for (const entry of [fc, iws, sevenIws]) {
      const select = entry.locator('select')
      await select.focus()
      await expect(select).toBeFocused()
      const box = await select.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(-1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
    }
    const layout = await measurements(page, sales)
    expect(layout.document.scrollWidth).toBeLessThanOrEqual(layout.document.clientWidth + 1)
    await attachEvidence(page, sales, info, `rope-sales-${width}`)
    // GET navigation exercises the real form-to-request transfer. The shared
    // guard blocks POST and analytics, so this never sends a lead.
    await fc.locator('select').selectOption({ label: '2,15' })
    await fc.getByRole('button', { name: /В заявку/ }).click()
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/конструкция 6×7\+FC; диаметр 2,15 мм/)
    await page.goto('/produkciya/metizy-i-svarochnye-materialy/kanaty', { waitUntil: 'domcontentloaded' })
    const iwsAgain = page.locator('.rope-sales-constructions > li').filter({
      has: page.locator('summary > span:first-child', { hasText: /^6×19\+IWS$/ }),
    })
    await iwsAgain.locator('summary').click()
    await iwsAgain.locator('select').selectOption({ label: '8,25' })
    await iwsAgain.getByRole('button', { name: /В заявку/ }).click()
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/конструкция 6×19\+IWS; диаметр 8,25 мм/)
  })
}
