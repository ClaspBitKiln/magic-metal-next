import { expect, test, type Page } from '@playwright/test'

async function expectRequest(page: Page, specification: string) {
  await expect(page).toHaveURL(/\/#request|\?.*#request/)
  await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(`${specification}: `)
  await expect(page.locator('#request-form')).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
}

for (const width of [390, 1440]) {
  test(`homepage details preserve direct requests at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const pipes = page.locator('.catalog-group').first()
    await pipes.locator('summary').first().click()
    const item = pipes.locator('.catalog-item').filter({ hasText: 'Водогазопроводные' })
    await item.locator('summary').click()
    await expect(page.getByRole('link', { name: 'Заявка на производство' })).toHaveCount(0)
    await item.getByRole('link', { name: 'Размеры, описание и ГОСТы' }).click()
    await expect(page).toHaveURL(/\/produkciya\/truby-elektrosvarnye\/vodogazoprovodnye(?:#sizes)?$/)
    await expect(page.locator('h1')).toContainText('водогазопроводные')
    const title = await page.locator('h1').innerText()
    const action = page.getByRole('link', { name: 'Отправить заявку' }).first()
    const specification = new URL((await action.getAttribute('href'))!, 'http://test').searchParams.get('product')!
    expect(specification).toBe(title)
    await expect(page.locator('a[href="/korzina"]')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    await action.click()
    await expectRequest(page, specification)
    let submissions = 0
    await page.route('**/api/request', (route) => { submissions++; return route.abort() })
    await page.locator('input[name="consent"]').check()
    await page.getByRole('button', { name: 'Отправить на расчёт' }).click()
    await expect(page.locator('#form-status')).toHaveText('Укажите телефон или email.')
    expect(submissions).toBe(0)
  })

  test(`homepage beam link opens normative dimensions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const sections = page.locator('.catalog-group').filter({ has: page.locator('summary strong', { hasText: 'Сортовой и фасонный прокат' }) })
    await sections.locator('summary').first().click()
    const beam = sections.locator('.catalog-item').filter({ has: page.locator('summary strong', { hasText: 'Балка двутавровая' }) })
    await beam.locator('summary').click()
    await beam.getByRole('link', { name: 'Размеры, описание и ГОСТы' }).click()
    await expect(page).toHaveURL(/\/balka-dvutavrovaya#sizes$/)
    await expect(page.locator('#size-series-title')).toBeInViewport()
    const table = page.locator('#sizes details').filter({ has: page.locator('summary', { hasText: 'ГОСТ 8239-89' }) })
    await expect(table.locator('tbody tr')).toHaveCount(17)
    await expect(table.locator('caption')).toContainText('ГОСТ 8239-89')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    await page.locator('.size-series-request').click()
    await expectRequest(page, 'Балка двутавровая')
  })

  test(`selected and missing pipe sizes preserve specifications at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/produkciya/truby-besshovnye/goryachedeformirovannye#sizes')
    const query = page.getByLabel('Размер из спецификации').first()
    await query.fill('57×3')
    await page.getByRole('button', { name: 'Найти размер', exact: true }).first().click()
    const selected = page.locator('.size-series-selection-result').first()
    await expect(selected).toContainText('57 × 3 мм')
    const action = selected.getByRole('link', { name: /Заявка на выбранный размер/ })
    const specification = new URL((await action.getAttribute('href'))!, 'http://test').searchParams.get('product')!
    expect(specification).toContain('57 × 3 мм')
    expect(specification).toContain('ГОСТ 8732-2025')
    await action.click()
    await expectRequest(page, specification)
    await page.goBack()
    await query.fill('9999×999')
    await page.getByRole('button', { name: 'Найти размер', exact: true }).first().click()
    await expect(selected).toBeHidden()
    const fallback = page.getByRole('link', { name: /Отправить спецификацию на проверку/ }).first()
    await expect(fallback).toBeVisible()
    const missing = new URL((await fallback.getAttribute('href'))!, 'http://test').searchParams.get('product')!
    expect(missing).toContain('9999×999')
    await fallback.click()
    await expectRequest(page, missing)
  })
}

test('search and existing material links retain the entered specification', async ({ page }) => {
  const query = 'Труба 9999×999; сталь 20; ГОСТ 999999'
  await page.goto(`/poisk?q=${encodeURIComponent(query)}`)
  const empty = page.locator('.search-empty')
  await expect(empty).toBeVisible()
  await empty.getByRole('link', { name: 'Отправить заявку' }).click()
  await expectRequest(page, query)
  await page.goto('/?material=12Х1МФ#request')
  await expectRequest(page, '12Х1МФ')
})

test('reference pages and destination links keep their request context', async ({ page }) => {
  for (const path of ['/spravochnik-gost/gost-30732-2020', '/spravochnik-materialov/stal-20']) {
    await page.goto(path)
    const action = page.getByRole('link', { name: 'Отправить заявку' }).first()
    const url = new URL((await action.getAttribute('href'))!, 'http://test')
    const specification = url.searchParams.get('standard') || url.searchParams.get('material')!
    await action.click()
    await expectRequest(page, specification)
  }
  await page.goto('/?product=Труба%2057×3&material=Ст20&standard=ГОСТ%208734#request')
  await expectRequest(page, 'Труба 57×3; Ст20; ГОСТ 8734')
  await page.goto('/?region=uzbekistan#request')
  await expect(page.locator('#request-form input[name="delivery"]')).toHaveValue('Узбекистан')
  await expect(page.locator('#request-form textarea')).toHaveValue('')
})

test('product pages pass readable names and the former cart redirects to the request', async ({ page }) => {
  for (const path of ['/produkciya/truby-elektrosvarnye', '/produkciya/truby-elektrosvarnye/vodogazoprovodnye', '/produkciya/sdt/otvody-besshovnye']) {
    await page.goto(path)
    const title = await page.locator('h1').innerText()
    await page.getByRole('link', { name: 'Отправить заявку' }).first().click()
    await expectRequest(page, title)
  }
  await page.goto('/korzina')
  await expect(page).toHaveURL(/\/#request$/)
  await expect(page.locator('#request-form')).toBeVisible()
})

test('request keeps specifications on failure and sends them with the attachment', async ({ page }) => {
  await page.goto('/?product=Труба%2057×3;%20сталь%2020;%20ГОСТ%208734#request')
  const form = page.locator('#request-form')
  const message = 'Труба 57×3; сталь 20; ГОСТ 8734; 2 т; длина 6 м'
  await form.locator('textarea[name="message"]').fill(message)
  await form.locator('input[name="email"]').fill('browser-test@example.invalid')
  await form.locator('input[name="delivery"]').fill('Самовывоз')
  await form.locator('input[name="consent"]').check()
  await form.locator('input[name="files"]').setInputFiles({ name: 'specification.pdf', mimeType: 'application/pdf', buffer: Buffer.from(`%PDF-1.4\n${message}`) })
  const payloads: string[] = []
  await page.route('**/api/request', async (route) => {
    payloads.push(route.request().postDataBuffer()!.toString())
    await route.fulfill({ status: payloads.length === 1 ? 503 : 200, contentType: 'application/json', body: payloads.length === 1 ? JSON.stringify({ error: 'Попробуйте позже' }) : JSON.stringify({ ok: true }) })
  })
  await form.getByRole('button', { name: 'Отправить на расчёт' }).click()
  await expect(page.locator('#form-status')).toHaveText('Попробуйте позже')
  await expect(form.locator('textarea[name="message"]')).toHaveValue(message)
  expect(await form.locator('input[name="files"]').evaluate((input: HTMLInputElement) => input.files?.[0]?.name)).toBe('specification.pdf')
  await expect(form.getByRole('button', { name: 'Отправить на расчёт' })).toBeEnabled()
  await form.getByRole('button', { name: 'Отправить на расчёт' }).click()
  await expect(page.locator('#form-status')).toHaveText('Заявка принята. Мы свяжемся с вами.')
  expect(payloads).toHaveLength(2)
  for (const payload of payloads) {
    expect(payload).toContain(message)
    expect(payload).toContain('specification.pdf')
    expect(payload).toContain('Самовывоз')
    expect(payload).toContain('name="consent"')
  }
})
