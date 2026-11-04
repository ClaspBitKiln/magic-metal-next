import { expect, test } from '@playwright/test'
import { productDetailCatalog } from '../../src/data/productDetailCatalog'
import { pipeCatalog } from '../../src/data/pipeCatalog'
import { sdtCatalog } from '../../src/data/sdtCatalog'
import { guardQaContext } from '../../qa/network-guard'

const routes = [
  ...productDetailCatalog.map(item => ({ path: `/produkciya/${item.categorySlug}/${item.slug}`, title: item.title, materials: item.grades, standards: item.standards })),
  ...pipeCatalog.map(item => ({ path: `/produkciya/${item.categorySlug}/${item.slug}`, title: item.title, materials: item.grades, standards: item.standards })),
  ...sdtCatalog.map(item => ({ path: `/produkciya/sdt/${item.slug}`, title: item.title, materials: item.materials, standards: item.standards })),
]

test.beforeEach(async ({ context }) => { await guardQaContext(context) })

test('all product detail routes keep SSR identity, materials, standards and native request', async ({ request, page }) => {
  test.setTimeout(120_000)
  expect(new Set(routes.map(route => route.path)).size).toBe(routes.length)
  expect(routes.length).toBeGreaterThanOrEqual(77)
  for (let index = 0; index < routes.length; index += 6) {
    const responses = await Promise.all(routes.slice(index, index + 6).map(async route => {
      const response = await request.get(route.path)
      expect(response.status(), route.path).toBe(200)
      return { route, html: await response.text() }
    }))
    for (const { route, html } of responses) {
      const result = await page.evaluate(source => {
        const doc = new DOMParser().parseFromString(source, 'text/html')
        const summary = doc.querySelector('.technical-catalog-summary')
        return {
          main: !!doc.querySelector('main.product-document'),
          headings: [...doc.querySelectorAll('h1')].map(node => node.textContent?.trim()),
          summary: summary?.textContent || '',
          canonical: doc.querySelector('link[rel=canonical]')?.getAttribute('href'),
          productJson: [...doc.querySelectorAll('script[type="application/ld+json"]')].some(node => { try { return JSON.parse(node.textContent || '{}')['@type'] === 'Product' } catch { return false } }),
          request: summary?.querySelector('.technical-catalog-summary-heading > a')?.getAttribute('href'),
          sizeTargets: [...doc.querySelectorAll('a[href="#sizes"]')].length === 0 || doc.querySelectorAll('#sizes').length === 1,
          references: doc.querySelectorAll('details.product-document-reference').length,
          stageCount: doc.querySelectorAll('.product-document-stage').length,
          selectionCount: doc.querySelectorAll('.product-document-stage > .product-document-selection').length,
          summaryInStage: !!doc.querySelector('.product-document-stage > .technical-catalog-summary'),
          noEmptyImageSlot: [...doc.querySelectorAll('.technical-catalog-summary')].every(node => !!node.querySelector('.product-document-image img[src]') || !!node.querySelector('.product-document-summary-no-image')),
          sizeTableGradeLast: [...doc.querySelectorAll('.size-series-reference table')].every(table => {
            const headers = [...table.querySelectorAll('thead th')].map(th => (th.textContent || '').trim())
            const grades = headers.map((label, index) => index > 0 && /(?:^|\\s)(?:марка|марки|материал)(?:\\s|$|[\\/,:])/iu.test(label) ? index : -1).filter(index => index >= 0)
            return grades.every(index => index >= headers.length - grades.length)
          }),
        }
      }, html)
      expect(result.main, route.path).toBe(true)
      expect(result.headings, route.path).toEqual([route.title])
      for (const material of route.materials) expect(result.summary, `${route.path}: ${material}`).toContain(material)
      for (const standard of route.standards) expect(result.summary, `${route.path}: ${standard}`).toContain(standard)
      expect(new URL(result.canonical!).pathname).toBe(route.path)
      expect(result.productJson, route.path).toBe(true)
      const target = new URL(result.request!, 'https://magicmet.ru')
      expect(target.pathname).toBe('/')
      expect(target.hash).toBe('#request')
      expect(target.searchParams.get('product')).toBe(route.title)
      expect(result.sizeTargets, route.path).toBe(true)
      expect(result.references, route.path).toBeGreaterThan(0)
      expect(result.stageCount, route.path).toBe(1)
      expect(result.selectionCount, route.path).toBe(1)
      expect(result.summaryInStage, route.path).toBe(true)
      expect(result.noEmptyImageSlot, route.path).toBe(true)
      expect(result.sizeTableGradeLast, route.path).toBe(true)
    }
  }
})

for (const path of ['/produkciya/truby-elektrosvarnye/pryamoshovnye', '/produkciya/sdt/otvody-besshovnye', '/produkciya/cvetnye-metally/bronza', '/produkciya/ferrosplavy/ferromarganec']) {
  for (const width of [320, 390, 1536]) {
    test(`approved layout keeps primary parameters, selection and accessible actions: ${path} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(path, { waitUntil: 'networkidle' })
      const main = page.locator('main.product-document')
      const summary = main.locator('.technical-catalog-summary')
      await expect(summary).toBeVisible()
      await expect(summary.locator('dt').first()).toBeVisible()
      const stage = main.locator('.product-document-stage')
      const selection = stage.locator('.product-document-selection')
      await expect(stage).toBeVisible()
      await expect(selection).toBeVisible()
      const summaryBox = await summary.boundingBox()
      const selectionBox = await selection.boundingBox()
      expect(summaryBox).not.toBeNull()
      expect(selectionBox).not.toBeNull()
      if (width >= 900) {
        // Real rendered columns, not merely the presence of layout classes.
        expect(selectionBox!.x).toBeGreaterThanOrEqual(summaryBox!.x + summaryBox!.width + 8)
        expect(Math.abs(selectionBox!.y - summaryBox!.y)).toBeLessThanOrEqual(2)
      } else {
        expect(selectionBox!.y).toBeGreaterThanOrEqual(summaryBox!.y + summaryBox!.height + 8)
        expect(Math.abs(selectionBox!.x - summaryBox!.x)).toBeLessThanOrEqual(2)
      }
      // Approved variant A: category SVGs are not product photos.
      // No empty image slot should remain until a verified product photo exists.
      await expect(summary.locator('.product-document-image')).toHaveCount(0)
      await expect(summary.locator('.product-document-summary-body')).toHaveClass(/product-document-summary-no-image/)
      for (const control of await selection.locator('input:not([type=radio]):not([type=checkbox]), select, textarea').all()) {
        if (await control.isVisible()) expect(await control.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16)
      }
      const action = summary.locator('.technical-catalog-summary-heading > a')
      await expect(action).toBeVisible()
      await action.focus()
      await expect(action).toBeFocused()
      const metrics = await page.evaluate(() => {
        const action = document.querySelector('.technical-catalog-summary-heading > a')!
        const heading = document.querySelector('h1')!
        return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, actionHeight: action.getBoundingClientRect().height, heading: parseFloat(getComputedStyle(heading).fontSize) }
      })
      expect(metrics.overflow).toBeLessThanOrEqual(1)
      expect(metrics.actionHeight).toBeGreaterThanOrEqual(44)
      expect(metrics.heading).toBeLessThanOrEqual(41)
      const requestedTitle = await page.locator('h1').innerText()
      await action.click()
      await expect(page.locator('textarea[name="message"]')).toHaveValue(`${requestedTitle}: `)
    })
  }
}

test('approved layout retains parameters and a native request path without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  await guardQaContext(context)
  try {
    const page = await context.newPage()
    for (const width of [390, 1536]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/produkciya/sortovoy-i-fasonny-prokat/ugolok')
      const summary = page.locator('.technical-catalog-summary')
      const selection = page.locator('.product-document-selection')
      await expect(summary).toBeVisible()
      await expect(selection).toBeVisible()
      const left = await summary.boundingBox()
      const right = await selection.boundingBox()
      expect(left).not.toBeNull()
      expect(right).not.toBeNull()
      if (width >= 900) expect(right!.x).toBeGreaterThanOrEqual(left!.x + left!.width + 8)
      else expect(right!.y).toBeGreaterThanOrEqual(left!.y + left!.height + 8)
      const title = await page.locator('h1').innerText()
      const action = summary.locator('.technical-catalog-summary-heading > a')
      await expect(action).toBeVisible()
      const target = new URL((await action.getAttribute('href'))!, 'https://magicmet.ru')
      expect(target.pathname).toBe('/')
      expect(target.hash).toBe('#request')
      expect(target.searchParams.get('product')).toBe(title)
      await expect(summary.locator('.product-document-image')).toHaveCount(0)
      await expect(summary.locator('.product-document-summary-body')).toHaveClass(/product-document-summary-no-image/)
    }
  } finally { await context.close() }
})
