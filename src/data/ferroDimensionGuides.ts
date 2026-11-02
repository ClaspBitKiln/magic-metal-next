import type { ProductDimensionGuide } from './productDimensionGuides'
import { productDetailCatalog } from './productDetailCatalog'

// Ferrosplavy are specified by chemical composition and fraction, not fictitious size matrices.
const sourceBySlug: Record<string,string> = {
 ferromarganec:'https://protect.gost.ru/gost/details/b06fdcd8-0230-4fac-a82a-256948be4a9d',
 ferrosilicij:'https://protect.gost.ru/gost/details/1872205b-94f6-4441-9342-d881a7b0cd21',
 ferrohrom:'https://protect.gost.ru/gost?month=0&page=234&search=&year=0',
 ferrosilikomarganec:'https://protect.gost.ru/gost/details/3651fa61-33c1-42a2-90b5-20b01e77395c',
 ferromolibden:'https://protect.gost.ru/gost?month=0&page=234&search=&year=0',
 ferrovanadij:'https://protect.gost.ru/gost?month=0&page=1019&search=&year=0',
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
  source:{label:'Росстандарт: '+(item.standards[0]||'нормативы'),url:sourceBySlug[item.slug]},
 }))
