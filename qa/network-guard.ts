import type { BrowserContext } from '@playwright/test'

// Production QA must not create real leads or visits in the business counter.
export async function guardQaContext(context: BrowserContext) {
  await context.route('**/*', route => {
    const request = route.request()
    const hostname = new URL(request.url()).hostname
    const metrika = ['mc.yandex.ru', 'mc.yandex.com', 'mc.webvisor.org']
      .some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
    return metrika || !['GET', 'HEAD'].includes(request.method())
      ? route.abort()
      : route.continue()
  })
}
