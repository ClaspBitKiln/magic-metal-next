/* One optional, deferred counter. No form values or product query strings are sent. */
(() => {
  const script = document.getElementById('magicmet-analytics')
  const id = Number(new URL(script?.src || location.href).searchParams.get('id'))
  if (!Number.isSafeInteger(id) || id <= 0 || window.magicmetAnalyticsReady) return
  window.magicmetAnalyticsReady = true
  const goals = new Set(['phone_click', 'email_click', 'request_click', 'catalog_product_opened', 'standard_opened', 'size_filter_used', 'size_selected', 'request_started', 'specification_attached', 'request_sent', 'request_error'])
  const ym = window.ym = window.ym || function () { (ym.a = ym.a || []).push(arguments) }
  ym.l = Date.now()
  let lastPath = ''
  let started = false
  const pending = []
  const goal = name => {
    if (started) window.ym(id, 'reachGoal', name)
    else if (pending.length < 100) pending.push(name)
  }
  const safeUrl = (value, campaign = false) => {
    try {
      const original = new URL(value, location.origin)
      if (!/^https?:$/.test(original.protocol)) return ''
      const clean = new URL(original.origin + original.pathname)
      if (campaign) for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'yclid']) {
        const value = original.searchParams.get(key)
        if (value && /^[a-zа-яё0-9_.-]{1,100}$/iu.test(value)) clean.searchParams.set(key, value)
      }
      return clean.href
    } catch { return '' }
  }
  const pageView = () => {
    if (!started || lastPath === location.pathname) return
    lastPath = location.pathname
    window.ym(id, 'hit', safeUrl(location.href, true), { referer: safeUrl(document.referrer) })
  }
  document.addEventListener('magicmet:goal', event => {
    if (goals.has(event.detail)) goal(event.detail)
  })
  document.addEventListener('magicmet:page', pageView)
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null
    const link = target?.closest('a')
    let name = ''
    if (link) {
      const href = link.getAttribute('href') || ''
      name = href.startsWith('tel:') ? 'phone_click' : href.startsWith('mailto:') ? 'email_click' : href.includes('#request') ? 'request_click' : href.startsWith('/spravochnik-gost/') ? 'standard_opened' : /^\/produkciya\/[^/]+\/[^/#?]+/.test(href) ? 'catalog_product_opened' : ''
    } else if (target?.closest('.size-series-generic-list th button')) name = 'size_selected'
    if (name) goal(name)
  })
  document.addEventListener('change', event => {
    if (event.target instanceof Element && event.target.closest('.size-series-filter')) goal('size_filter_used')
  })
  const load = () => {
    window.ym(id, 'init', { defer: true, clickmap: false, webvisor: false, trackLinks: false, accurateTrackBounce: true, trackHash: false })
    started = true
    pageView()
    pending.splice(0).forEach(goal)
    const tag = document.createElement('script')
    tag.async = true
    tag.src = 'https://mc.yandex.ru/metrika/tag.js'
    document.head.append(tag)
  }
  const schedule = () => {
    if (window.requestIdleCallback) window.requestIdleCallback(load, { timeout: 2000 })
    else setTimeout(load, 0)
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
})()
