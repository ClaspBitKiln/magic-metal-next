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
if (region && delivery && !delivery.value) delivery.value = region === 'uzbekistan' ? 'Узбекистан' : region === 'kazakhstan' ? 'Казахстан' : region

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
    track('request_validation_error')
    status.textContent = 'Укажите телефон или email.'
    return
  }
  const digits = phone.replace(/\D/g, '').length
  if ((phone && (!/^\+?[\d\s().-]+$/.test(phone) || digits < 7 || digits > 15)) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    track('request_validation_error')
    status.textContent = 'Проверьте телефон или email: укажите действительный способ связи.'
    return
  }
  if (data.getAll('files').reduce((sum, file) => sum + (file instanceof File ? file.size : 0), 0) > 4 * 1024 * 1024) {
    track('request_validation_error')
    status.textContent = 'Файлы — суммарно до 4 МБ. Большие файлы отправьте на m1@magicmet.ru.'
    return
  }
  const hasFiles = data.getAll('files').some((file) => file instanceof File && file.size > 0)
  if (!String(data.get('message') || '').trim() && !hasFiles) {
    track('request_validation_error')
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
    if (!recorded) throw new Error('Сервер не подтвердил получение заявки. Уточните статус по телефону или email перед повторной отправкой.')
    track('request_sent')
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


// Homepage shares the existing product-page languages and Google Translate.
// Russian remains independent of the external script.
{
  const selector = document.getElementById('home-language')
  const supported = { ru: 'RU', uz: 'UZ', kk: 'KZ', ky: 'KG', be: 'BY', tr: 'TR', en: 'EN' }
  const status = document.getElementById('home-language-status')
  let language = 'ru'
  try {
    const saved = localStorage.getItem('magicmet-language')
    if (saved && Object.hasOwn(supported, saved)) language = saved
  } catch { /* storage may be disabled */ }

  const selected = language
  const heading = selector?.querySelector('summary')
  if (heading) {
    heading.textContent = supported[language]
    heading.setAttribute('aria-label', 'Язык сайта: ' + language.toUpperCase())
  }
  selector?.querySelectorAll('button[data-lang]').forEach(button => {
    if (button.dataset.lang === language) button.setAttribute('aria-current', 'true')
    button.addEventListener('click', () => {
      const next = button.dataset.lang
      if (!Object.hasOwn(supported, next)) return
      try { localStorage.setItem('magicmet-language', next) } catch { /* cookie still works */ }
      const value = next === 'ru' ? '' : '/ru/' + next
      const expiry = next === 'ru' ? ';max-age=0' : ';max-age=31536000'
      document.cookie = 'googtrans=' + value + ';path=/' + expiry + ';SameSite=Lax'
      document.cookie = 'googtrans=' + value + ';path=/;domain=.' + location.hostname + expiry + ';SameSite=Lax'
      location.reload()
    })
  })
  if (selected !== 'ru') {
    if (status) {
      status.hidden = false
      status.textContent = 'Загружаем машинный перевод…'
    }
    let initialized = false
    const callback = () => {
      if (initialized) return
      const TranslateElement = window.google?.translate?.TranslateElement
      if (!TranslateElement) return
      initialized = true
      try {
        new TranslateElement({
          pageLanguage: 'ru',
          includedLanguages: Object.keys(supported).join(','),
          autoDisplay: false,
        }, 'home-google-translate')
      } catch {
        if (status) status.textContent = 'Перевод недоступен. Выберите RU для оригинала.'
      }
    }
    window.googleTranslateHomeInit = callback
    const widget = document.createElement('div')
    widget.id = 'home-google-translate'
    widget.style.display = 'none'
    selector?.appendChild(widget)
    const script = document.createElement('script')
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateHomeInit'
    script.async = true
    script.onerror = () => {
      if (status) status.textContent = 'Перевод недоступен. Выберите RU для оригинала.'
      if (selector) selector.open = true
    }
    script.onload = callback
    document.body.appendChild(script)
    setTimeout(() => {
      const ready = widget.querySelector('.goog-te-combo')
      if (status) status.textContent = ready
        ? 'Сервис перевода загружен. Перевод может быть неполным.'
        : 'Перевод недоступен. Выберите RU для оригинала.'
      if (!ready && selector) selector.open = true
    }, 12000)
  }
}
