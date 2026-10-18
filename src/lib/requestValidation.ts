export const REQUEST_CONSENT_ERROR =
  'Подтвердите согласие на обработку персональных данных.'

export function hasRequestConsent(value: FormDataEntryValue | null): boolean {
  return value === 'on' || value === 'true' || value === '1'
}

export const REQUEST_CONTACT_ERROR = 'Проверьте телефон или email: укажите действительный способ связи.'

export function hasValidRequestContact(phone: string, email: string): boolean {
  const validPhone = !phone || (/^\+?[\d\s().-]+$/.test(phone) && phone.replace(/\D/g, '').length >= 7 && phone.replace(/\D/g, '').length <= 15)
  const validEmail = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return Boolean(phone || email) && validPhone && validEmail
}
