import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createHmac } from 'node:crypto'

import config from '@/payload.config'

export const runtime = 'nodejs'

const MAX_TOTAL_FILE_SIZE = 25 * 1024 * 1024
const MAX_REQUEST_SIZE = 28 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['xlsx', 'xls', 'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'dwg', 'dxf', 'mp3', 'm4a', 'wav', 'ogg', 'webm'])
const requestLog = new Map<string, number[]>()

function text(form: FormData, key: string, max = 4000) {
  return String(form.get(key) || '').trim().slice(0, max)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character)
}

function isRateLimited(ip: string) {
  const now = Date.now()
  const recent = (requestLog.get(ip) || []).filter((time) => now - time < 15 * 60 * 1000)
  if (recent.length >= 5) return true
  recent.push(now)
  requestLog.set(ip, recent)
  return false
}

function safeFileName(value: string) {
  const cleaned = value.normalize('NFKC').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\.{2,}/g, '.').slice(-180)
  return cleaned || 'attachment'
}

function hasExpectedSignature(buffer: Buffer, extension: string) {
  const starts = (...bytes: number[]) => bytes.every((byte, index) => buffer[index] === byte)
  if (extension === 'pdf') return buffer.subarray(0, 5).toString() === '%PDF-'
  if (extension === 'png') return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
  if (extension === 'jpg' || extension === 'jpeg') return starts(0xff, 0xd8, 0xff)
  if (extension === 'webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
  if (['docx', 'xlsx'].includes(extension)) return starts(0x50, 0x4b)
  if (['doc', 'xls'].includes(extension)) return starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)
  if (extension === 'dwg') return buffer.subarray(0, 4).toString() === 'AC10'
  if (extension === 'dxf') return buffer.subarray(0, 1024).toString('utf8').replace(/^\uFEFF/, '').trimStart().startsWith('0\nSECTION') || buffer.subarray(0, 1024).toString('utf8').replace(/^\uFEFF/, '').trimStart().startsWith('0\r\nSECTION')
  if (extension === 'mp3') return buffer.subarray(0, 3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  if (extension === 'm4a') return buffer.subarray(4, 8).toString() === 'ftyp'
  if (extension === 'wav') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WAVE'
  if (extension === 'ogg') return buffer.subarray(0, 4).toString() === 'OggS'
  if (extension === 'webm') return starts(0x1a, 0x45, 0xdf, 0xa3)
  return false
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_REQUEST_SIZE) return NextResponse.json({ error: 'Запрос превышает допустимый размер' }, { status: 413 })
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (isRateLimited(ip)) return NextResponse.json({ error: 'Слишком много запросов' }, { status: 429 })

  const form = await request.formData()
  if (text(form, 'website', 200)) return NextResponse.json({ ok: true })
  const startedAt = Number(text(form, 'startedAt', 20))
  if (Number.isFinite(startedAt) && Date.now() - startedAt < 1800) return NextResponse.json({ error: 'Проверка формы не пройдена' }, { status: 400 })

  const name = text(form, 'name', 120)
  const company = text(form, 'company', 180)
  const phone = text(form, 'phone', 80)
  const email = text(form, 'email', 180)
  const message = text(form, 'message', 8000)
  const context = text(form, 'context', 300)
  const productDirection = text(form, 'productDirection', 80)
  if (!name || !phone || !message) return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 })

  const files = form.getAll('files').filter((value): value is File => value instanceof File && value.size > 0)
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > MAX_TOTAL_FILE_SIZE) return NextResponse.json({ error: 'Файлы превышают 25 МБ' }, { status: 413 })
  if (files.some((file) => !ALLOWED_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase() || ''))) return NextResponse.json({ error: 'Недопустимый тип файла' }, { status: 415 })

  const payload = await getPayload({ config })
  const uploadedIds: number[] = []
  const attachments: { filename: string; content: Buffer; contentType?: string }[] = []

  const preparedFiles = await Promise.all(files.map(async (file) => {
    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    return { file, buffer, extension, filename: safeFileName(file.name) }
  }))
  const invalidFile = preparedFiles.find(({ buffer, extension }) => !hasExpectedSignature(buffer, extension))
  if (invalidFile) return NextResponse.json({ error: `Содержимое файла «${invalidFile.filename}» не соответствует его формату` }, { status: 415 })

  for (const { file, buffer, filename } of preparedFiles) {
    const uploaded = await payload.create({
      collection: 'request-files',
      data: { description: `Заявка: ${company || name}` },
      file: { data: buffer, mimetype: file.type || 'application/octet-stream', name: filename, size: file.size },
      overrideAccess: true,
    })
    uploadedIds.push(uploaded.id)
    attachments.push({ filename, content: buffer, contentType: file.type || undefined })
  }

  const landingPage = text(form, 'landingPage', 1000)
  const source = text(form, 'utm_source', 200) || (text(form, 'referrer', 1000) ? 'referral' : 'direct')
  const created = await payload.create({
    collection: 'requests',
    data: {
      name, company, phone, email: email || null, message, context,
      productDirection: (productDirection || null) as 'electrowelded-pipes' | 'seamless-pipes' | 'pipeline-parts' | 'insulated' | 'other' | null,
      originPreference: 'any',
      files: uploadedIds,
      status: 'new',
      source,
      landingPage,
      referrer: text(form, 'referrer', 1000),
      utmSource: text(form, 'utm_source', 200),
      utmMedium: text(form, 'utm_medium', 200),
      utmCampaign: text(form, 'utm_campaign', 200),
    },
    overrideAccess: true,
  })

  let emailDelivered = false
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }, disableFileAccess: true, disableUrlAccess: true,
      })
      await transporter.sendMail({
        from: process.env.SMTP_USER, to: process.env.REQUEST_TO_EMAIL || 'm1@magicmet.ru', replyTo: email || undefined,
        subject: `Заявка с сайта: ${company || name}`,
        html: `<h2>Новая заявка с сайта</h2><p><b>Имя:</b> ${escapeHtml(name)}</p><p><b>Компания:</b> ${escapeHtml(company || '—')}</p><p><b>Телефон:</b> ${escapeHtml(phone)}</p><p><b>Email:</b> ${escapeHtml(email || '—')}</p><p><b>Направление:</b> ${escapeHtml(productDirection || 'не выбрано')}</p><p><b>Контекст:</b> ${escapeHtml(context || 'не указан')}</p><p><b>Запрос:</b><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p><hr><p>Источник: ${escapeHtml(source)}<br>Страница: ${escapeHtml(landingPage)}</p>`,
        attachments,
      })
      emailDelivered = true
    } catch (error) { payload.logger.error({ err: error, msg: 'Заявка сохранена, но SMTP-доставка не выполнена' }) }
  }

  let crmDelivered = false
  const workflowUrl = process.env.N8N_WEBHOOK_URL || process.env.CRM_WEBHOOK_URL || 'https://cloud.activepieces.com/api/v1/webhooks/fglfaNe3jXxDWgHGKW1cX'
  if (workflowUrl) {
    try {
      const workflowPayload = JSON.stringify({
        event: 'website.request.created',
        occurredAt: new Date().toISOString(),
        request: { id: created.id, name, company, phone, email, message, context, productDirection, source, landingPage, fileIds: uploadedIds },
      })
      const signature = process.env.N8N_WEBHOOK_SECRET
        ? createHmac('sha256', process.env.N8N_WEBHOOK_SECRET).update(workflowPayload).digest('hex')
        : ''
      const crmResponse = await fetch(workflowUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(signature ? { 'x-magicmet-signature': `sha256=${signature}` } : {}) },
        signal: AbortSignal.timeout(8000),
        body: workflowPayload,
      })
      crmDelivered = crmResponse.ok
    } catch (error) { payload.logger.error({ err: error, msg: 'Заявка сохранена, но доставка в Activepieces/n8n/CRM не выполнена' }) }
  }

  if (emailDelivered || crmDelivered) {
    await payload.update({ collection: 'requests', id: created.id, data: { emailDelivered, crmDelivered }, overrideAccess: true })
  }

  return NextResponse.json({ ok: true, id: created.id })
}
