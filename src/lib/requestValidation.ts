export const REQUEST_CONSENT_ERROR =
  'Подтвердите согласие на обработку персональных данных.'

export const REQUEST_FILE_EXTENSIONS = ['xlsx', 'xls', 'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'dwg', 'dxf'] as const
export const REQUEST_MAX_TOTAL_FILE_SIZE = 4 * 1024 * 1024

export function hasRequestConsent(value: FormDataEntryValue | null): boolean {
  return value === 'on' || value === 'true' || value === '1'
}
