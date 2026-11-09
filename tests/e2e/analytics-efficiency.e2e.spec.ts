import { expect, test, type BrowserContext, type Page } from '@playwright/test'

type CapturedWindow = Window & {
  __qaYmCalls: unknown[][]
  ym: (...args: unknown[]) => void
  magicmetAnalyticsDisabled?: boolean
}

// The SDK is local test code: no actual counter, goal, POST or visitor hit leaves the browser.
async function isolateAnalytics(context: BrowserContext) {
  const traffic = { sdk: [] as string[], blocked: [] as string[], mutations: [] as string[] }
  await context.addInitScript(() => {
    const captured = window as CapturedWindow
    captured.__qaYmCalls = []
    captured.ym = (...args: unknown[]) => { captured.__qaYmCalls.push(args) }
  })
  await context.route('**/*', route => {
    const request = route.request()
    const url = new URL(request.url())
    if (!['GET', 'HEAD'].includes(request.method())) {
      traffic.mutations.push(url.pathname)
      return route.abort()
    }
    const metrika = ['mc.yandex.ru', 'mc.yandex.com', 'mc.webvisor.org']
      .some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
    if (!metrika) return route.continue()
    if (url.pathname === '/metrika/tag.js') {
      traffic.sdk.push(request.url())
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* isolated Metrika SDK fixture; window.ym is captured by the test */' })
    }
    traffic.blocked.push(request.url())
    return route.abort()
  })
  return traffic
}

async function calls(page: Page) {
  return page.evaluate(() => (window as CapturedWindow).__qaYmCalls)
}
async function internalEvents(page: Page) {
  return (await calls(page)).filter(call => call[1] === 'params')
    .flatMap(call => Object.keys((call[2] as { magicmet?: Record<string, unknown> })?.magicmet || {}))
}
async function analyticsDisabled(page: Page) {
  return page.evaluate(() => (window as CapturedWindow).magicmetAnalyticsDisabled)
}
async function counterStarted(page: Page) {
  await expect.poll(async () => (await calls(page)).some(call => call[1] === 'init')).toBe(true)
  await expect.poll(async () => (await calls(page)).some(call => call[1] === 'hit')).toBe(true)
}

for (const width of [390, 1536]) {
  test(`owner opt-out persists while product selection and RFQ remain usable at ${width}px`, async ({ context, page }) => {
    const traffic = await isolateAnalytics(context)
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/?analytics=off&utm_source=qa-owner&product=QA_OWNER_CONTEXT#request', { waitUntil: 'networkidle' })
    await expect.poll(() => analyticsDisabled(page)).toBe(true)
    expect(await page.evaluate(() => localStorage.getItem('magicmet.analytics.disabled'))).toBe('1')
    let address = new URL(page.url())
    expect(address.searchParams.has('analytics')).toBe(false)
    expect(address.searchParams.get('utm_source')).toBe('qa-owner')
    expect(address.searchParams.get('product')).toBe('QA_OWNER_CONTEXT')
    expect(address.hash).toBe('#request')
    await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue('QA_OWNER_CONTEXT: ')

    await page.reload({ waitUntil: 'networkidle' })
    await expect.poll(() => analyticsDisabled(page)).toBe(true)
    await page.goto('/produkciya/cvetnye-metally/med?utm_campaign=owner-check#selection', { waitUntil: 'networkidle' })
    await expect.poll(() => analyticsDisabled(page)).toBe(true)
    const picker = page.locator('.nonferrous-picker')
    await picker.getByRole('radio', { name: 'Круг / пруток', exact: true }).check()
    await picker.getByLabel('Диаметр, мм', { exact: true }).fill('20')
    await picker.locator('.nonferrous-submit').click()
    await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(/Круг \/ пруток Ø20 мм/)
    await expect.poll(() => analyticsDisabled(page)).toBe(true)
    await page.locator('#request-form input[name="consent"]').check()
    await page.locator('#request-form button[type="submit"]').click()
    await expect(page.locator('#form-status')).toHaveText('Укажите телефон или email.')
    expect(await calls(page)).toEqual([])
    expect(traffic.sdk).toEqual([])
    expect(traffic.blocked).toEqual([])
    expect(traffic.mutations).toEqual([])

    await page.goto('/?analytics=on&utm_source=qa-owner&product=QA_OWNER_CONTEXT#request', { waitUntil: 'networkidle' })
    await expect.poll(() => analyticsDisabled(page)).toBe(false)
    expect(await page.evaluate(() => localStorage.getItem('magicmet.analytics.disabled'))).toBeNull()
    address = new URL(page.url())
    expect(address.searchParams.has('analytics')).toBe(false)
    expect(address.searchParams.get('utm_source')).toBe('qa-owner')
    expect(address.searchParams.get('product')).toBe('QA_OWNER_CONTEXT')
    expect(address.hash).toBe('#request')
    await counterStarted(page)
    expect(traffic.sdk).toHaveLength(1)
    await page.reload({ waitUntil: 'networkidle' })
    await expect.poll(() => analyticsDisabled(page)).toBe(false)
    await counterStarted(page)
    expect(traffic.sdk).toHaveLength(2)
    expect(traffic.blocked).toEqual([])
    expect(traffic.mutations).toEqual([])
  })

  test(`normal counter records kind, parameter and validation flags without private values at ${width}px`, async ({ context, page }) => {
    const traffic = await isolateAnalytics(context)
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/produkciya/cvetnye-metally/med?product=QA_PRIVATE_QUERY_X9&utm_source=qa-test#selection', { waitUntil: 'networkidle' })
    await counterStarted(page)
    const picker = page.locator('.nonferrous-picker')
    await picker.getByRole('radio', { name: 'Круг / пруток', exact: true }).check()
    const diameter = picker.getByLabel('Диаметр, мм', { exact: true })
    await diameter.fill('207.5')
    await diameter.press('Tab')
    await picker.getByRole('combobox', { name: 'Марка металла / сплава', exact: true }).selectOption('__other__')
    const alloy = picker.getByLabel('Укажите другую марку', { exact: true })
    await alloy.fill('QA_PRIVATE_ALLOY_X9')
    await alloy.press('Tab')
    await expect.poll(async () => (await internalEvents(page)).includes('product_kind_selected')).toBe(true)
    await expect.poll(async () => (await internalEvents(page)).includes('product_parameters_changed')).toBe(true)
    const productCalls = await calls(page)
    const target = new URL((await picker.locator('.nonferrous-submit').getAttribute('href'))!, 'https://magicmet.ru')
    expect(target.searchParams.get('product')).toContain('207,5')
    expect(target.searchParams.get('product')).toContain('QA_PRIVATE_ALLOY_X9')
    await picker.locator('.nonferrous-submit').click()
    await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(/QA_PRIVATE_ALLOY_X9/)
    await counterStarted(page)
    await page.locator('#request-form input[name="delivery"]').fill('QA_PRIVATE_DELIVERY_X9')
    await page.locator('#request-form input[name="consent"]').check()
    await page.locator('#request-form button[type="submit"]').click()
    await expect(page.locator('#form-status')).toHaveText('Укажите телефон или email.')
    await expect.poll(async () => (await internalEvents(page)).includes('request_validation_error')).toBe(true)
    const allCalls = [...productCalls, ...await calls(page)]
    const serialized = JSON.stringify(allCalls)
    for (const privateValue of ['QA_PRIVATE_QUERY_X9', 'QA_PRIVATE_ALLOY_X9', 'QA_PRIVATE_DELIVERY_X9', '207.5', '207,5']) {
      expect(serialized).not.toContain(privateValue)
    }
    for (const goal of allCalls.filter(call => call[1] === 'reachGoal')) {
      expect(goal).toHaveLength(3)
      expect(typeof goal[2]).toBe('string')
    }
    const allowedEvents = ['product_kind_selected', 'product_parameters_changed', 'request_validation_error']
    for (const call of allCalls.filter(call => call[1] === 'params')) {
      expect(call).toHaveLength(3)
      expect(Object.keys(call[2] as object)).toEqual(['magicmet'])
      for (const [name, value] of Object.entries((call[2] as { magicmet: Record<string, unknown> }).magicmet)) {
        expect(allowedEvents).toContain(name)
        expect(value).toBe(1)
      }
    }
    for (const goal of allCalls.filter(call => call[1] === 'reachGoal')) expect(allowedEvents).not.toContain(goal[2])
    for (const hit of allCalls.filter(call => call[1] === 'hit')) {
      const hitAddress = new URL(hit[2] as string)
      expect(hitAddress.searchParams.has('product')).toBe(false)
      expect(hitAddress.hash).toBe('')
    }
    expect(traffic.sdk).toHaveLength(2)
    expect(traffic.blocked).toEqual([])
    expect(traffic.mutations).toEqual([])
  })
}

test('pressed-button product kinds are measured as static flags only', async ({ context, page }) => {
  const traffic = await isolateAnalytics(context)
  await page.goto('/produkciya/metizy-i-svarochnye-materialy/krepezh', { waitUntil: 'networkidle' })
  await counterStarted(page)
  const bolts = page.locator('.fastener-types').getByRole('button', { name: 'Болты', exact: true })
  await bolts.click()
  await expect(bolts).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(async () => (await internalEvents(page)).includes('product_kind_selected')).toBe(true)
  expect(await internalEvents(page)).toContain('product_kind_selected')
  for (const call of (await calls(page)).filter(call => call[1] === 'params')) {
    expect(call).toHaveLength(3)
    expect(call[2]).toEqual({ magicmet: { product_kind_selected: 1 } })
  }
  expect(traffic.blocked).toEqual([])
  expect(traffic.mutations).toEqual([])
})
