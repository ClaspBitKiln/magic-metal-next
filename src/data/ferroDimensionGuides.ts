import type { ProductDimensionGuide } from './productDimensionGuides'
import { productDetailCatalog } from './productDetailCatalog'

// Ferrosplavy are specified by chemical composition and fraction, not fictitious size matrices.
const sourceBySlug: Record<string,string> = {
 ferromarganec:'https://protect.gost.ru/gost/details/b06fdcd8-0230-4fac-a82a-256948be4a9d',
 ferrosilicij:'https://protect.gost.ru/gost/details/1872205b-94f6-4441-9342-d881a7b0cd21',
 ferrohrom:'https://meganorm.ru/mega_doc/norm/gost_gosudarstvennyj-standart/22/gost_4757-91_iso_5448-81_mezhgosudarstvennyy_standart.html',
 ferrosilikomarganec:'https://protect.gost.ru/gost/details/3651fa61-33c1-42a2-90b5-20b01e77395c',
 ferromolibden:'https://protect.gost.ru/gost?month=0&page=234&search=&year=0',
 ferrovanadij:'https://meganorm.ru/Data2/1/4294827/4294827466.htm',
 ferrotitan:'https://protect.gost.ru/gost?month=0&page=234&search=&year=0',
 ferroniobij:'https://protect.gost.ru/gost/details/02db6230-3a4c-43ec-9003-c22e646983a0',
}
export const ferroDimensionGuides: ProductDimensionGuide[] = productDetailCatalog
 .filter(item=>item.categorySlug==='ferrosplavy')
 .map(item=>({
  categorySlug:item.categorySlug,
  productSlug:item.slug,
  title:'Подбор '+item.shortTitle.toLowerCase()+' по спецификации',
  parameters:[
   'Укажите полное обозначение марки и нормативный документ (ГОСТ или ТУ).',
   'Уточните химический состав и предельные примеси по документу качества конкретной партии.',
   'Согласуйте фракцию, массу, упаковку и условия поставки.',
  ],
  note:'Это параметры запроса, не подтверждение складского остатка. Размеры фракции и химический состав не выводятся из названия марки автоматически.',
  standard:item.standards[0]||'ГОСТ/ТУ изготовителя',
  source:{label:'Документ/реестр: '+(item.standards[0]||'нормативы'),url:sourceBySlug[item.slug]},
 }))
