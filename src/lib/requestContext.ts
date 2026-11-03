/**
 * Recover the selected item when the static form posts without JavaScript.
 * Never trust a Referer from another origin or treat it as an authorization signal.
 */
export function fallbackRequestContext(requestUrl: string, referer: string | null): string {
  if (!referer) return ''
  try {
    const target = new URL(requestUrl)
    const source = new URL(referer)
    if (!['http:', 'https:'].includes(target.protocol) || source.origin !== target.origin) return ''
    const context = ['product', 'detail', 'material', 'standard']
      .map((key) => source.searchParams.get(key)?.trim())
      .filter((value): value is string => Boolean(value))
      .join('; ')
    return context.slice(0, 300)
  } catch {
    return ''
  }
}
