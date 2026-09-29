export const REQUEST_CONSENT_ERROR =
  'Подтвердите согласие на обработку персональных данных.'

export function hasRequestConsent(value: FormDataEntryValue | null): boolean {
  return value === 'on' || value === 'true' || value === '1'
}
