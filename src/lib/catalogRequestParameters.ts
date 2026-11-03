export type CatalogRequestParameters = {
  size?: string
  grade: string
  knownStandard: boolean
  standard: string
}

// A table's product already includes its authoritative size and source standard.
// Only the standalone form supplies a free-text size; a requested standard is
// explicitly separate from the standard describing a selected table row.
export function catalogRequestHref(href: string, origin: string, parameters: CatalogRequestParameters) {
  const url = new URL(href, origin)
  const detail = [
    url.searchParams.get('product') || '',
    parameters.size?.trim() ? `Размер / обозначение: ${parameters.size.trim()}` : '',
    parameters.grade.trim() ? `Марка стали / материала: ${parameters.grade.trim()}` : '',
    parameters.knownStandard && parameters.standard.trim()
      ? `Требуемый ГОСТ / ТУ: ${parameters.standard.trim()}`
      : 'ГОСТ / ТУ: помогите подобрать стандарт',
  ].filter(Boolean).join('; ')
  url.searchParams.set('product', detail)
  url.hash = 'request'
  return url.href
}

// Enhance only this product's request links. Keep their real href current so
// native keyboard, modified click, middle click and copy-link behavior survive.
// CompactSizeRows creates links after hydration, so observe those additions too.
export function enhanceCatalogRequestLinks(
  scope: HTMLElement,
  requestHref: string,
  origin: string,
  parameters: Omit<CatalogRequestParameters, 'size'>,
) {
  const target = new URL(requestHref, origin)
  const pageOrigin = new URL(origin).origin
  const links = new Map<HTMLAnchorElement, { base: string; enriched: string }>()
  const refresh = (anchor: HTMLAnchorElement) => {
    const current = anchor.getAttribute('href')
    if (!current) return
    const previous = links.get(anchor)
    // React or a row picker may have replaced href with a different base.
    const base = previous && current === previous.enriched ? previous.base : current
    let url: URL
    try { url = new URL(base, origin) } catch { return }
    if (url.origin !== pageOrigin || url.origin !== target.origin || url.pathname !== target.pathname || url.hash !== '#request') return
    const enriched = catalogRequestHref(base, origin, parameters)
    links.set(anchor, { base, enriched })
    if (current !== enriched) anchor.setAttribute('href', enriched)
  }
  const refreshAll = () => scope.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(refresh)
  const prepareNativeAction = (event: Event) => {
    const node = event.target
    const anchor = node instanceof Element ? node.closest<HTMLAnchorElement>('a[href]') : null
    if (anchor && scope.contains(anchor)) refresh(anchor)
  }
  refreshAll()
  const observer = new MutationObserver(refreshAll)
  observer.observe(scope, { subtree: true, childList: true, attributes: true, attributeFilter: ['href'] })
  const events = ['click', 'auxclick', 'contextmenu', 'focusin'] as const
  events.forEach(name => scope.addEventListener(name, prepareNativeAction, true))
  return () => {
    observer.disconnect()
    events.forEach(name => scope.removeEventListener(name, prepareNativeAction, true))
    // Restore only our own value; never overwrite another component's update.
    links.forEach(({ base, enriched }, anchor) => {
      if (anchor.getAttribute('href') === enriched) anchor.setAttribute('href', base)
    })
  }
}
