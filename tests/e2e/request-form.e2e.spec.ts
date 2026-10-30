import { expect, test } from '@playwright/test'

const specification = { name: 'specification.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nTest specification') }

for (const width of [390, 1440]) {
  for (const mode of ['file and email', 'description and phone']) {
    test(`request form accepts ${mode} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/#request')
      const form = page.locator('#request-form')
      await expect(page.locator('#request-hint')).toContainText('Достаточно телефона или email')
      await expect(page.locator('.request h2')).toHaveCSS('color', 'rgb(255, 255, 255)')
      await expect(page.locator('.request h2 em')).toHaveCSS('color', 'rgb(255, 255, 255)')
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
      if (mode === 'file and email') {
        await form.locator('input[name="email"]').fill('browser-test@example.invalid')
        await form.locator('input[name="files"]').setInputFiles(specification)
        await expect(form.locator('textarea')).toHaveValue('')
      } else {
        await form.locator('input[name="phone"]').fill('+7 900 000 00 00')
        await form.locator('textarea').fill('Фланцы DN 50 PN 16, сталь 20, 10 шт.')
      }
      await form.locator('input[name="consent"]').check()
      const payloads: string[] = []
      await page.route('**/api/request', async (route) => {
        payloads.push(route.request().postDataBuffer()!.toString())
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
      })
      await form.getByRole('button', { name: 'Отправить на расчёт' }).click()
      await expect(page.locator('#form-status')).toHaveText('Заявка принята. Мы свяжемся с вами.')
      expect(payloads).toHaveLength(1)
      expect(payloads[0]).toContain(mode === 'file and email' ? 'specification.pdf' : 'Фланцы DN 50 PN 16')
      expect(payloads[0]).toContain(mode === 'file and email' ? 'browser-test@example.invalid' : '+7 900 000 00 00')
      await expect(form.getByRole('button', { name: 'Отправить на расчёт' })).toBeEnabled()
    })
  }
}

test('request form blocks missing contact, empty requirements and missing consent', async ({ page }) => {
  await page.goto('/#request')
  const form = page.locator('#request-form')
  let submissions = 0
  await page.route('**/api/request', (route) => { submissions++; return route.abort() })
  const submit = form.getByRole('button', { name: 'Отправить на расчёт' })
  await form.locator('input[name="consent"]').check()
  await form.locator('input[name="files"]').setInputFiles(specification)
  await form.locator('input[name="phone"]').fill('   ')
  await submit.click()
  await expect(page.locator('#form-status')).toHaveText('Укажите телефон или email.')
  await form.locator('input[name="email"]').fill('browser-test@example.invalid')
  await form.locator('input[name="files"]').setInputFiles([])
  await form.locator('textarea').fill('   ')
  await submit.click()
  await expect(page.locator('#form-status')).toHaveText('Прикрепите файл или опишите, что требуется.')
  await expect(form.locator('textarea')).toBeFocused()
  await form.locator('input[name="files"]').setInputFiles({ ...specification, buffer: Buffer.alloc(0) })
  await expect(page.locator('#file-selection-status')).toContainText('Пустые файлы не будут отправлены: specification.pdf')
  await expect(page.locator('#file-selection-status')).not.toContainText('Файлы готовы к отправке')
  await submit.click()
  await expect(page.locator('#form-status')).toHaveText('Прикрепите файл или опишите, что требуется.')
  await form.locator('textarea').fill('Фланцы DN 50 PN 16, 10 шт.')
  await form.locator('input[name="consent"]').uncheck()
  expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(false)
  await submit.click()
  expect(submissions).toBe(0)
})

test('file feedback identifies empty files without rejecting the other attachments', async ({ page }) => {
  let submissions = 0
  await page.route('**/api/request', route => { submissions++; return route.abort() })
  await page.goto('/#request')
  const files = page.locator('#request-form input[name="files"]')
  const feedback = page.locator('#file-selection-status')
  const emptyFile = { ...specification, name: 'empty-specification.pdf', buffer: Buffer.alloc(0) }
  await files.setInputFiles(emptyFile)
  await expect(feedback).toContainText('Пустые файлы не будут отправлены: empty-specification.pdf')
  await expect(feedback).toContainText('Выберите непустой файл или опишите, что требуется.')
  await expect(feedback).not.toContainText('Файлы готовы к отправке')
  await files.setInputFiles([specification, emptyFile])
  await expect(feedback).toContainText('Прикреплено: 2')
  await expect(feedback).toContainText('Пустые файлы не будут отправлены: empty-specification.pdf')
  await expect(feedback).toContainText('Остальные непустые файлы можно отправить.')
  await expect(feedback).not.toContainText('Файлы готовы к отправке')
  expect(await files.evaluate((input: HTMLInputElement) => input.files?.length)).toBe(2)
  await files.setInputFiles([emptyFile, { name: 'unsupported.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('unsupported') }])
  await expect(feedback).toContainText('Неподдерживаемый формат: unsupported.exe')
  await expect(feedback).toContainText('Проверьте остальные вложения перед отправкой.')
  await expect(feedback).not.toContainText('Остальные непустые файлы можно отправить.')
  await expect(feedback).not.toContainText('Файлы готовы к отправке')
  await files.setInputFiles([emptyFile, { ...specification, name: 'oversized.pdf', buffer: Buffer.alloc(4 * 1024 * 1024 + 1) }])
  await expect(feedback).toContainText('Превышен лимит 4 МБ')
  await expect(feedback).toContainText('Проверьте остальные вложения перед отправкой.')
  await expect(feedback).not.toContainText('Остальные непустые файлы можно отправить.')
  await expect(feedback).not.toContainText('Файлы готовы к отправке')
  await files.setInputFiles(specification)
  await expect(feedback).toContainText('Файлы готовы к отправке.')
  await expect(feedback).not.toContainText('Пустые файлы')
  expect(submissions).toBe(0)
})

test('request form allows file-only requirements without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    await page.goto(`${baseURL}/#request`)
    const form = page.locator('#request-form')
    await form.locator('input[name="email"]').fill('browser-test@example.invalid')
    await form.locator('input[name="files"]').setInputFiles(specification)
    const consent = form.locator('input[name="consent"]')
    // Use a native keyboard toggle in no-script mode instead of a forced pointer click.
    await consent.press('Space')
    await expect(consent).toBeChecked()
    await expect(form.locator('textarea')).toHaveValue('')
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true)
    await expect(page.locator('.request h2')).toHaveCSS('color', 'rgb(255, 255, 255)')
  } finally {
    await context.close()
  }
})
