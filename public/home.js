const canvas = document.querySelector('.hero-canvas')
for (let index = 1; index <= 18; index += 1) {
  const row = String(index).padStart(2, '0')
  const picture = document.createElement('picture')
  picture.className = 'hero-tile'
  picture.innerHTML = `<source media="(max-width:700px)" srcset="/images/hero-tiles/640/${row}.webp?v=20261012-1"><source media="(max-width:1200px)" srcset="/images/hero-tiles/1024/${row}.webp?v=20261012-1"><img src="/images/hero-tiles/1440/${row}.webp?v=20261012-1" alt="" width="1440" height="45">`
  canvas?.append(picture)
}

const form = document.querySelector('#request-form')
const status = document.querySelector('#form-status')
const button = form?.querySelector('button')
const startedAt = document.querySelector('#started-at')
const landingPage = document.querySelector('#landing-page')
if (startedAt) startedAt.value = String(Date.now())
if (landingPage) landingPage.value = location.href
const selectedProduct = new URLSearchParams(location.search).get('product')
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
