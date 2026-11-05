import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import CatalogTree from '../src/components/CatalogTree'
import CatalogKindLinks from '../src/components/CatalogKindLinks'
import { homeCatalogGroups } from '../src/data/homeCatalog'
import { getCatalogProductKinds } from '../src/data/catalogProductKinds'

const root = process.cwd()
const file = path.join(root, 'public/home-static.html')
let home = fs.readFileSync(file, 'utf8')
// The approved static catalog contains curated wording and rope controls.
// Updating kind navigation must not regenerate these unrelated sections.
if (process.argv.includes('--kinds-only')) {
  home = home.replace(/<nav class="catalog-kind-links(?: home-size-series)?"[^>]*>[\s\S]*?<\/nav>/g, '')
  for (const item of homeCatalogGroups.flatMap(group => group.items)) {
    if (!getCatalogProductKinds(item.href).length) continue
    const href = item.href.split(/[?#]/)[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const row = new RegExp('<details class="catalog-item">(?:(?!</details>)[\\s\\S])*?<a href="' + href + '(?:#sizes)?">(?:(?!</details>)[\\s\\S])*?</details>')
    if (!row.test(home)) throw new Error(`Catalog row not found: ${item.title}`)
    home = home.replace(row, match => match + renderToStaticMarkup(<CatalogKindLinks href={item.href} title={item.title} home />))
  }
  // Reuse the existing 44px native-link styles, rather than shipping the
  // category-page stylesheet in the dependency-free homepage.
  home = home.replace(/\s*<style data-catalog-kinds>[\s\S]*?<\/style>/, '')
  // The old .catalog grid and .catalog-tools toolbar have no elements in the
  // restored DOM or homepage JS. Remove only these obsolete catalog rules.
  home = home.replace(/\.catalog(?:-tools)?(?:\s+[^{}]+)?\s*\{[^{}]*\}/g, '')
  const compactStyles = (fs.readFileSync(path.join(root, 'src/components/CatalogTree.css'), 'utf8')
    + '\n.restored-catalog .catalog-kind-links { flex-direction:row; gap:8px; background:#fff; }')
    .replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').trim()
  home = home.replace(/(<style data-catalog-tree>)[\s\S]*?(<\/style>)/, (_match, open: string, close: string) => open + compactStyles + close)
  fs.writeFileSync(file, home)
  console.log('Updated kind navigation; existing catalog wording preserved')
  process.exit(0)
}
const start = home.indexOf('    <section class="section products"')
const end = home.indexOf('    <section class="request"', start)
if (start < 0 || end < 0) throw new Error('Homepage catalog section boundaries not found')
const catalog = `<section class="section products" id="products"><div class="section-head"><h2>Что мы<br><em>можем поставить</em></h2><p>Откройте категорию, затем нужную номенклатуру: размеры, ГОСТы, марки и исполнения. Наличие и срок поставки подтвердим по вашей спецификации.</p></div>${renderToStaticMarkup(<CatalogTree />)}</section>\n`
home = home.slice(0, start) + '    ' + catalog + home.slice(end)
const styles = fs.readFileSync(path.join(root, 'src/components/CatalogTree.css'), 'utf8')
  + '\n' + fs.readFileSync(path.join(root, 'src/components/CatalogKindLinks.css'), 'utf8')
home = home.replace(/\s*<link rel="stylesheet" href="\/catalog-tree.css">/, '')
home = home.replace(/\s*<style data-catalog-tree>[\s\S]*?<\/style>/, '')
home = home.replace('</head>', `  <style data-catalog-tree>${styles}</style>\n</head>`)
fs.writeFileSync(file, home)
console.log('Restored static catalog from existing homeCatalogGroups')
