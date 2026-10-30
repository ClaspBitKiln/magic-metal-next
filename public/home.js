const form = document.querySelector('#request-form')
const status = document.querySelector('#form-status')
const button = form?.querySelector('button')
const startedAt = document.querySelector('#started-at')
const landingPage = document.querySelector('#landing-page')
if (startedAt) startedAt.value = String(Date.now())
if (landingPage) landingPage.value = location.href
const params = new URLSearchParams(location.search)
const selectedProduct = ['product', 'detail', 'material', 'standard'].map((key) => params.get(key)).filter(Boolean).join('; ')
const requestText = form?.querySelector('textarea[name="message"]')
if (selectedProduct && requestText && !requestText.value) requestText.value = `${selectedProduct}: `
const region = params.get('region')
const delivery = form?.querySelector('input[name="delivery"]')
if (region && delivery && !delivery.value) delivery.value = region === 'uzbekistan' ? 'Узбекистан' : region

const track = (goal) => document.dispatchEvent(new CustomEvent('magicmet:goal', { detail: goal }))
let formStarted = false
form?.addEventListener('focusin', () => {
  if (!formStarted) { formStarted = true; track('request_started') }
})
const fileInput = form?.querySelector('input[name="files"]')
const fileSelectionStatus = document.querySelector('#file-selection-status')
const supportedFileExtensions = new Set(['xlsx', 'xls', 'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'dwg', 'dxf', 'mp3', 'm4a', 'wav', 'ogg', 'webm'])
const maxTotalFileSize = 4 * 1024 * 1024
const renderSelectedFiles = () => {
  if (!fileSelectionStatus) return
  const files = Array.from(fileInput?.files || [])
  fileSelectionStatus.hidden = files.length === 0
  if (!files.length) {
    fileSelectionStatus.textContent = ''
    return
  }
  const total = files.reduce((size, file) => size + file.size, 0)
  const empty = files.filter(file => file.size === 0)
  const invalid = files.filter(file => !supportedFileExtensions.has(file.name.split('.').pop()?.toLowerCase() || ''))
  const totalLabel = (total / (1024 * 1024)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })
  const names = files.map(file => file.name).join('; ')
  const warning = total > maxTotalFileSize
    ? ' Превышен лимит 4 МБ. Уберите файлы или отправьте их на m1@magicmet.ru.'
    : invalid.length
      ? ' Неподдерживаемый формат: ' + invalid.map(file => file.name).join(', ') + '.'
      : empty.length ? '' : ' Файлы готовы к отправке.'
  const emptyWarning = empty.length
    ? ' Пустые файлы не будут отправлены: ' + empty.map(file => file.name).join(', ') + '. ' + (invalid.length || total > maxTotalFileSize ? 'Проверьте остальные вложения перед отправкой.' : files.some(file => file.size > 0) ? 'Остальные непустые файлы можно отправить.' : 'Выберите непустой файл или опишите, что требуется.')
    : ''
  fileSelectionStatus.textContent = 'Прикреплено: ' + files.length + ' (' + totalLabel + ' МБ). ' + names + '.' + warning + emptyWarning
}
fileInput?.addEventListener('change', () => {
  renderSelectedFiles()
  if (fileInput.files?.length) track('specification_attached')
})
form?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const data = new FormData(form)
  const phone = String(data.get('phone') || '').trim()
  const email = String(data.get('email') || '').trim()
  if (!phone && !email) {
    status.textContent = 'Укажите телефон или email.'
    return
  }
  const digits = phone.replace(/\D/g, '').length
  if ((phone && (!/^\+?[\d\s().-]+$/.test(phone) || digits < 7 || digits > 15)) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    status.textContent = 'Проверьте телефон или email: укажите действительный способ связи.'
    return
  }
  if (data.getAll('files').reduce((sum, file) => sum + (file instanceof File ? file.size : 0), 0) > 4 * 1024 * 1024) {
    status.textContent = 'Файлы — суммарно до 4 МБ. Большие файлы отправьте на m1@magicmet.ru.'
    return
  }
  const hasFiles = data.getAll('files').some((file) => file instanceof File && file.size > 0)
  if (!String(data.get('message') || '').trim() && !hasFiles) {
    status.textContent = 'Прикрепите файл или опишите, что требуется.'
    requestText?.focus()
    return
  }
  data.set('referrer', document.referrer)
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) data.set(key, params.get(key) || '')
  data.set('context', ['product', 'detail', 'material', 'standard'].map((key) => params.get(key)).filter(Boolean).join('; '))
  button.disabled = true
  status.textContent = 'Отправляем…'
  try {
    const response = await fetch('/api/request', { method: 'POST', body: data, signal: AbortSignal.timeout(45000) })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || 'Не удалось отправить заявку')
    const recorded = result.ok === true && (typeof result.id === 'number' || (typeof result.id === 'string' && result.id.length > 0) || result.emailDelivered === true || result.crmDelivered === true)
    if (recorded) track('request_sent')
    form.reset()
    renderSelectedFiles()
    status.textContent = result.id ? `Заявка № ${result.id} принята. Мы свяжемся с вами.` : 'Заявка принята. Мы свяжемся с вами.'
  } catch (error) {
    track('request_error')
    status.textContent = error.name === 'TimeoutError' ? 'Время ожидания истекло. Заявка могла поступить — уточните по телефону или email перед повторной отправкой.' : error.message || 'Не удалось отправить. Напишите на m1@magicmet.ru.'
  } finally {
    button.disabled = false
  }
})

// Close the native menu after navigation, including same-page anchors.
document.querySelector('.mobile-menu')?.addEventListener('click', event => {
  if (event.target instanceof Element && event.target.closest('a')) event.currentTarget.open = false
})
