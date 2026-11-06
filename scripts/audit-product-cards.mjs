import { chromium } from '@playwright/test'
import { auditVerdict } from './product-card-audit-report.mjs'
import { productDetailCatalog } from '../src/data/productDetailCatalog.ts'
import { pipeCatalog } from '../src/data/pipeCatalog.ts'
import { sdtCatalog } from '../src/data/sdtCatalog.ts'
import { alloyGradeExamples } from '../src/data/alloyGradeExamples.ts'
import { materialPageSlugs, getMaterialPageSlug } from '../src/data/materialPageLinks.ts'
import fs from 'node:fs/promises'
import path from 'node:path'
const base = process.env.QA_BASE || 'https://magicmet.ru'
const output = process.env.QA_OUTPUT || '/workspace/work/swarm-card-20261103/full-card-audit'
const widths = (process.env.QA_VIEWPORTS || '320,390,1536').split(',').map(Number)
const routes = [...productDetailCatalog.map(x => ({ path: `/produkciya/${x.categorySlug}/${x.slug}`, title: x.title })), ...pipeCatalog.map(x => ({ path: `/produkciya/${x.categorySlug}/${x.slug}`, title: x.title })), ...sdtCatalog.map(x => ({ path: `/produkciya/sdt/${x.slug}`, title: x.title }))]
const proxyURL = !base.includes('127.0.0.1') && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
const proxy = proxyURL ? { server: new URL(proxyURL).origin } : undefined
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', proxy, args: ['--no-sandbox'] })
const cases = [], links = new Set(), jobs = routes.flatMap(route => widths.map(width => ({ ...route, width })))
let next = 0
try {
 const context = await browser.newContext({ proxy })
 await context.route('**/*', route => !['GET', 'HEAD'].includes(route.request().method()) || /(?:yandex|google-analytics|googletagmanager)/.test(new URL(route.request().url()).hostname) ? route.abort() : route.continue())
 async function worker() {
  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  while (next < jobs.length) {
   const job = jobs[next++]
   try {
    await page.setViewportSize({ width: job.width, height: 900 })
    const response = await page.goto(base + job.path, { waitUntil: 'domcontentloaded', timeout: 40000 })
    await page.locator('.technical-catalog-summary').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(200)
    const metrics = await page.evaluate(({expectedGrades, knownGrades}) => {
     const visible = n => { const b = n.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(n).visibility !== 'hidden' }
     const position = n => n ? Math.round(n.getBoundingClientRect().top + scrollY) : null
     const summary = document.querySelector('.technical-catalog-summary'), selection = document.querySelector('.product-document-selection')
     const rows = [...summary.querySelectorAll('dl > div')]
     const materials = rows.filter(row => /Марки|Материал|Группа/.test(row.querySelector('dt')?.textContent || '')).flatMap(row => [...row.querySelectorAll('dd > span')].map(n => ({ label: n.textContent.trim(), href: n.querySelector('a')?.getAttribute('href') || null })))
     const gradeReference = [...document.querySelectorAll('.nonferrous-grade-reference-list > a,.nonferrous-grade-reference-list > span')].map(n => ({ label: n.textContent.trim(), href: n.tagName === 'A' ? n.getAttribute('href') : null }))
     const unstructuredGradeReferences = [...document.querySelectorAll('.nonferrous-note strong')].filter(n => n.textContent.includes('Марки')).map(n => n.textContent)
     materials.push(...gradeReference)
     const gradePanel = document.querySelector('.nonferrous-grade-reference') || [...document.querySelectorAll('.nonferrous-note')].find(n => /Марки/.test(n.textContent))
     if (gradePanel && !gradeReference.length) for (const label of expectedGrades) {
       if (gradePanel.textContent.includes(label)) materials.push({label, href: [...gradePanel.querySelectorAll('a')].find(n => n.textContent.trim() === label)?.getAttribute('href') || null})
     }
     const tableGradeCells = []
     for (const table of document.querySelectorAll('.product-size-series table')) {
       const headings = [...(table.tHead?.rows[0]?.cells || [])]
       const indexes = headings.map((n,i) => /марка|материал/iu.test(n.textContent) ? i : -1).filter(i => i >= 0)
       for (const row of table.querySelectorAll('tbody tr')) for (const i of indexes) {
         const cell = row.cells[i]; if (!cell) continue
         tableGradeCells.push(cell.textContent.trim())
         for (const designation of knownGrades) {
           const label = designation.replace(/^Сталь\s*/iu,'')
           const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
           if (new RegExp('(?<![\\p{L}\\p{N}])'+escaped+'(?![\\p{L}\\p{N}])','iu').test(cell.textContent)) materials.push({label:designation,href:[...cell.querySelectorAll('a')].find(a => a.textContent.trim() === label || a.textContent.trim() === designation)?.getAttribute('href') || null})
         }
       }
     }
     const controls = [...(selection?.querySelectorAll('input:not([type=hidden]):not([type=radio]):not([type=checkbox]),select,textarea') || [])].filter(visible)
     const primary = selection?.querySelector('.nonferrous-submit,.fastener-submit,button[type=submit],.product-document-request-action')
     const form = selection?.querySelector('.nonferrous-shapes,.nonferrous-fields select,.fastener-types,.rope-sales-picker,.galv-presets button,.galv-fields select,input:not([type=hidden])')
     return { h1: [...document.querySelectorAll('h1')].map(n => n.textContent.trim()), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, titleSize: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize), summarySize: parseFloat(getComputedStyle(summary.querySelector('h2')).fontSize), selectionTop: position(selection), firstChoiceTop: position(form), firstControlTop: position(controls[0]), inputSizes: controls.map(n => parseFloat(getComputedStyle(n).fontSize)), primaryHeight: primary && visible(primary) ? primary.getBoundingClientRect().height : null, unstructuredGradeReferences, structuredGradeReferenceCount: gradeReference.length, tableGradeCells, categoryImages: [...document.querySelectorAll('.product-document-image img')].map(n => n.getAttribute('src')), materials, referenceLinks: [...document.querySelectorAll('a[href^="/spravochnik-materialov/"],a[href^="/spravochnik-gost/"]')].map(n => n.getAttribute('href')), invalidAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(n => n.hash && !document.getElementById(decodeURIComponent(n.hash.slice(1)))).map(n => n.hash), copyText: rows.filter(row => /Марки|Материал/.test(row.querySelector('dt')?.textContent || '')).map(row => row.querySelector('dd')?.textContent), duplicateFacts: document.querySelectorAll('.product-document-highlight').length, requestLinks: [...document.querySelectorAll('a[href*="#request"]')].map(n => ({ text: n.textContent.trim(), href: n.getAttribute('href') })) }
    }, {expectedGrades: alloyGradeExamples[job.path.split('/').at(-1)]?.grades || [], knownGrades: Object.keys(materialPageSlugs)})
    const findings = []
    if (response.status() !== 200) findings.push('http_status')
    if (metrics.h1.length !== 1 || metrics.h1[0] !== job.title) findings.push('product_identity')
    if (metrics.overflow > 1) findings.push('page_overflow')
    if (metrics.inputSizes.some(x => x < 16)) findings.push('small_input_font')
    if (metrics.primaryHeight !== null && metrics.primaryHeight < 44) findings.push('small_primary_target')
    if (metrics.firstChoiceTop > (job.width < 700 ? 900 : 800)) findings.push('choice_below_useful_screen')
    if (metrics.invalidAnchors.length) findings.push('unresolved_anchors')
    const gradeLinks = metrics.materials.map(m => ({ ...m, expected: getMaterialPageSlug(m.label) })).filter(m => m.expected ? m.href !== `/spravochnik-materialov/${m.expected}` : Boolean(m.href))
    if (gradeLinks.length) findings.push('inconsistent_material_link')
    if (metrics.unstructuredGradeReferences.length && metrics.structuredGradeReferenceCount === 0) findings.push('unstructured_grade_reference')
    for (const href of metrics.referenceLinks) links.add(href)
    const result = { ...job, status: response.status(), findings, gradeLinks, ...metrics, normativeReview: 'not_performed', visualMatchA: 'not_verified' }
    cases.push(result)
    if (job.width === 390 && /\/(med|bronza|krepezh|vodogazoprovodnye|ugolok|otvody-besshovnye)$/.test(job.path)) {
      const name = job.path.split('/').at(-1)
      await page.screenshot({ path: path.join(output, name + '-390.png'), fullPage: true })
    }
    if (cases.length % 15 === 0) await fs.writeFile(path.join(output, 'progress.json'), JSON.stringify({ completed: cases.length, total: jobs.length }))
   } catch (error) { cases.push({ ...job, error: error.message.split('\n')[0], findings: ['request_or_render_failed'], visualMatchA: 'not_verified', normativeReview: 'not_performed' }) }
  }
  await page.close()
 }
 await Promise.all([worker(), worker(), worker()])
 const linkChecks = []
 const parser = await context.newPage()
 for (const href of links) {
  try {
   const response = await context.request.get(new URL(href, base).href, { maxRedirects: 0, timeout: 30000 })
   const html = await response.text()
   const identity = await parser.evaluate(source => { const doc = new DOMParser().parseFromString(source, 'text/html'); return { title: doc.querySelector('h1')?.textContent, canonical: doc.querySelector('link[rel=canonical]')?.getAttribute('href') } }, html)
   linkChecks.push({ href, status: response.status(), ...identity })
  } catch (error) { linkChecks.push({ href, error: error.message.split('\n')[0] }) }
 }
 const summary = { base, checkedAt: new Date().toISOString(), routes: routes.length, cases: cases.length, expectedCases: jobs.length, widths, findingCounts: {}, uniqueReferenceLinks: links.size, badReferenceLinks: linkChecks.filter(x => x.status !== 200 || (x.canonical && new URL(x.canonical, base).pathname !== x.href)).length, sourceRef: process.env.QA_SOURCE_REF || 'unrecorded', visualMatchA: 'not_verified', normativeReview: 'not_performed', realRfqSent: false }
 for (const c of cases) for (const finding of c.findings) summary.findingCounts[finding] = (summary.findingCounts[finding] || 0) + 1
 const verdict = auditVerdict(summary)
 Object.assign(summary, { verdict: verdict.status, exitCode: verdict.exitCode, blockingReasons: verdict.reasons })
 await fs.writeFile(path.join(output, 'audit.json'), JSON.stringify({ summary, cases, linkChecks }, null, 2))
 console.log(JSON.stringify(summary))
 process.exitCode = verdict.exitCode
} finally { await browser.close() }
