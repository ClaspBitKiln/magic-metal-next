import { expect, test, type Page } from '@playwright/test'

async function expectRequest(page: Page, specification: string) {
  await expect(page).toHaveURL(/\/#request|\?.*#request/)
  await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(`${specification}: `)
  await expect(page.locator('#request-form')).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
}

for (const width of [390, 1440]) {
  test(`catalog row goes straight to a prefilled request at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const pipes = page.locator('.catalog-group').first()
    await pipes.locator('summary').first().click()
    const item = pipes.locator('.catalog-item').filter({ hasText: 'Водогазопроводные' })
    await item.locator('summary').click()
    await item.locator('a[href^="/spravochnik-nalichiya"]').click()
    const group = page.locator('.market-group').first()
    await expect(group).toBeVisible()
    if (await group.getAttribute('open') === null) await group.locator('summary').click()
    const wall = page.getByRole('combobox', { name: 'Фильтр по толщине стенки' }).first()
    const value = await wall.locator('option').nth(1).getAttribute('value')
    await wall.selectOption(value!)
    const row = page.locator('.market-position-row').first()
    await expect(row).toBeVisible()
    const fields = await row.locator('td').evaluateAll((cells) => cells.slice(0, 5).map((cell) => cell.textContent || ''))
    const action = row.getByRole('link', { name: 'Отправить заявку' })
    const specification = new URL((await action.getAttribute('href'))!, 'http://test').searchParams.get('product')!
    expect(specification).toContain(fields[3])
    expect(specification).toContain(fields[4])
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

  test(`position and empty stock search preserve specifications at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/spravochnik-nalichiya?q=Водогазопроводные')
    const group = page.locator('.market-group').first()
    await expect(group).toBeVisible()
    if (await group.getAttribute('open') === null) await group.locator('summary').click()
    const wall = page.getByRole('combobox', { name: 'Фильтр по толщине стенки' }).first()
    const value = await wall.locator('option').nth(1).getAttribute('value')
    await wall.selectOption(value!)
    const stockUrl = page.url()
    await page.locator('.market-position-row').first().click()
    await expect(page).toHaveURL(/\/poziciya\?id=/)
    const action = page.locator('.position-hero').getByRole('link', { name: 'Отправить заявку' })
    const specification = new URL((await action.getAttribute('href'))!, 'http://test').searchParams.get('product')!
    await action.click()
    await expectRequest(page, specification)
    await page.goBack()
    await page.locator('.position-header').getByRole('link', { name: 'К результатам' }).click()
    await expect(page).toHaveURL(stockUrl)
    const restoredGroup = page.locator('.market-group').first()
    await expect(restoredGroup).toBeVisible()
    if (await restoredGroup.getAttribute('open') === null) await restoredGroup.locator('summary').click()
    await page.getByRole('combobox', { name: 'Фильтр по толщине стенки' }).first().selectOption(value!)
    await page.getByPlaceholder('Номенклатура, размер, марка или ГОСТ').fill('Несуществующая труба 9999×999 ГОСТ 999999')
    const empty = page.locator('.market-empty')
    await expect(empty).toBeVisible()
    const request = empty.getByRole('link', { name: 'Отправить заявку' })
    const text = new URL((await request.getAttribute('href'))!, 'http://test').searchParams.get('product')!
    expect(text).toContain('9999×999 ГОСТ 999999')
    expect(text).toContain(`Стенка: ${value} мм`)
    await request.click()
    await expectRequest(page, text)
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
  await form.locator('input[name="files"]').setInputFiles({ name: 'specification.txt', mimeType: 'text/plain', buffer: Buffer.from(message) })
  const payloads: string[] = []
  await page.route('**/api/request', async (route) => {
    payloads.push(route.request().postDataBuffer()!.toString())
    await route.fulfill({ status: payloads.length === 1 ? 503 : 200, contentType: 'application/json', body: payloads.length === 1 ? JSON.stringify({ error: 'Попробуйте позже' }) : JSON.stringify({ ok: true }) })
  })
  await form.getByRole('button', { name: 'Отправить на расчёт' }).click()
  await expect(page.locator('#form-status')).toHaveText('Попробуйте позже')
  await expect(form.locator('textarea[name="message"]')).toHaveValue(message)
  await expect(form.getByRole('button', { name: 'Отправить на расчёт' })).toBeEnabled()
  await form.getByRole('button', { name: 'Отправить на расчёт' }).click()
  await expect(page.locator('#form-status')).toHaveText('Заявка принята. Мы свяжемся с вами.')
  expect(payloads).toHaveLength(2)
  for (const payload of payloads) {
    expect(payload).toContain(message)
    expect(payload).toContain('specification.txt')
    expect(payload).toContain('Самовывоз')
    expect(payload).toContain('name="consent"')
  }
})
