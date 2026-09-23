import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const KomTenderPositions: CollectionConfig = {
  slug: 'komtender-positions',
  labels: { singular: 'Позиция тендера', plural: 'Позиции тендеров' },
  admin: { useAsTitle: 'sourceName', defaultColumns: ['sourceName','category','grade','quantity','unitPrice'], group: 'Procurement' },
  access: { read:isAuthenticated, create:isAuthenticated, update:isAuthenticated, delete:isAuthenticated },
  fields: [
    { name:'tender', label:'Тендер', type:'relationship', relationTo:'komtender-tenders', required:true, index:true },
    { name:'sourceName', label:'Исходное наименование', type:'text', required:true, index:true },
    { name:'normalizedName', label:'Нормализованное наименование', type:'text', index:true },
    { name:'category', label:'Категория', type:'text', index:true },
    { name:'grade', label:'Марка', type:'text', index:true },
    { name:'diameterMm', label:'Диаметр, мм', type:'number', index:true },
    { name:'thicknessMm', label:'Толщина, мм', type:'number', index:true },
    { name:'widthMm', label:'Ширина, мм', type:'number' },
    { name:'lengthMm', label:'Длина, мм', type:'number' },
    { name:'gost', label:'ГОСТ/ТУ', type:'text', index:true },
    { name:'unit', label:'Единица', type:'text' },
    { name:'quantity', label:'Количество', type:'number', index:true },
    { name:'unitPrice', label:'Цена за единицу', type:'number', index:true },
    { name:'totalPrice', label:'Сумма', type:'number' },
    { name:'classifier', label:'Классификатор', type:'json' },
    { name:'normalizedConfidence', label:'Уверенность нормализации', type:'number' },
  ],
}
