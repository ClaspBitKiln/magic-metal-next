/** Public site counter, confirmed by the owner. Never put OAuth credentials here. */
export function getMetrikaCounterId(): string {
  const id = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || '113661397'
  return /^[1-9]\d{0,14}$/.test(id) && Number.isSafeInteger(Number(id)) ? id : ''
}
