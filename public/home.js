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

form?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const data = new FormData(form)
  if (!String(data.get('phone') || '').trim() && !String(data.get('email') || '').trim()) {
    status.textContent = 'Укажите телефон или email.'
    return
  }
  const hasFiles = data.getAll('files').some((file) => file instanceof File && file.size > 0)
  if (!String(data.get('message') || '').trim() && !hasFiles) {
    status.textContent = 'Прикрепите файл или опишите, что требуется.'
    requestText?.focus()
    return
  }
  button.disabled = true
  status.textContent = 'Отправляем…'
  try {
    const response = await fetch('/api/request', { method: 'POST', body: data })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || 'Не удалось отправить заявку')
    form.reset()
    status.textContent = 'Заявка принята. Мы свяжемся с вами.'
  } catch (error) {
    status.textContent = error.message || 'Не удалось отправить. Напишите на m1@magicmet.ru.'
  } finally {
    button.disabled = false
  }
})
