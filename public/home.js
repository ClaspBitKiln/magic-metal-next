const form = document.querySelector('#request-form')
const status = document.querySelector('#form-status')
const button = form?.querySelector('button')
const startedAt = document.querySelector('#started-at')
const landingPage = document.querySelector('#landing-page')
if (startedAt) startedAt.value = String(Date.now())
if (landingPage) landingPage.value = location.href
const params = new URLSearchParams(location.search)
const selectedProduct = params.get('product') || params.get('material')
const requestText = form?.querySelector('textarea[name="message"]')
if (selectedProduct && requestText && !requestText.value) requestText.value = `${selectedProduct}: `

form?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const data = new FormData(form)
  if (!data.get('phone') && !data.get('email')) {
    status.textContent = 'Укажите телефон или email.'
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
