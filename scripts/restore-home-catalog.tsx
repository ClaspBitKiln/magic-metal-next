import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import CatalogTree from '../src/components/CatalogTree'

const root = process.cwd()
const file = path.join(root, 'public/home-static.html')
let home = fs.readFileSync(file, 'utf8')
const start = home.indexOf('    <section class="section products"')
const end = home.indexOf('    <section class="request"', start)
if (start < 0 || end < 0) throw new Error('Homepage catalog section boundaries not found')
const catalog = `<section class="section products" id="products"><div class="section-head"><h2>Что мы<br><em>можем поставить</em></h2><p>Откройте категорию, затем нужную номенклатуру: размеры, ГОСТы, марки и исполнения. Наличие и срок поставки подтвердим по вашей спецификации.</p></div>${renderToStaticMarkup(<CatalogTree />)}</section>\n`
home = home.slice(0, start) + '    ' + catalog + home.slice(end)
const styles = fs.readFileSync(path.join(root, 'src/components/CatalogTree.css'), 'utf8')
home = home.replace(/\s*<link rel="stylesheet" href="\/catalog-tree.css">/, '')
home = home.replace(/\s*<style data-catalog-tree>[\s\S]*?<\/style>/, '')
home = home.replace('</head>', `  <style data-catalog-tree>${styles}</style>\n</head>`)
fs.writeFileSync(file, home)
console.log('Restored static catalog from existing homeCatalogGroups')
