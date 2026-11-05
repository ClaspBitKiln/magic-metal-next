import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'
const result = { status: null, heading: false, selected: false, jsFailures: 0, pageErrors: 0, navigation: 'not-started' }
const browser = await chromium.launch()
try {
 const context = await browser.newContext()
 await context.route('**/*', route => !['GET','HEAD'].includes(route.request().method()) || /yandex|google-analytics|googletagmanager/.test(route.request().url()) ? route.abort() : route.continue())
 const page = await context.newPage()
 page.on('pageerror', error => { result.pageErrors++; console.log('Client error class:', error.name) })
 page.on('response', response => { if (/\.js(?:[?#]|$)/.test(response.url()) && response.status() >= 400) result.jsFailures++ })
 try {
  const response = await page.goto(process.env.BASE_URL + '/produkciya/listovoy-prokat/holodnokatanyj', { waitUntil:'domcontentloaded', timeout:25000 })
  result.status = response?.status() || null; result.navigation = 'loaded'
  result.heading = await page.locator('h1').count() === 1
  await page.getByRole('button',{name:'2000 × 6000 мм',exact:true}).click({timeout:8000})
  await page.waitForTimeout(1500)
  result.selected = await page.getByRole('button',{name:'2000 × 6000 мм',exact:true}).getAttribute('aria-pressed') === 'true'
 } catch { result.navigation = 'browser-timeout-or-action-error' }
 console.log(JSON.stringify(result))
 const status = `HTTP${result.status}-H${Number(result.heading)}-UI${Number(result.selected)}-JS${result.jsFailures}-ERR${result.pageErrors}-${result.navigation}`
 if(process.env.GITHUB_OUTPUT)writeFileSync(process.env.GITHUB_OUTPUT,`status=${status}\n`,{flag:'a'})
 if(!result.selected || result.jsFailures || result.pageErrors)process.exitCode=1
} finally { await browser.close() }
