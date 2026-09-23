import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const KomTenderTenders: CollectionConfig = {
  slug: 'komtender-tenders',
  labels: { singular: 'Тендер KomTender', plural: 'Тендеры KomTender' },
  admin: { useAsTitle: 'title', defaultColumns: ['externalId','title','customerName','startPrice','publishedAt'], group: 'Procurement' },
  access: { read: isAuthenticated, create: isAuthenticated, update: isAuthenticated, delete: isAuthenticated },
  fields: [
    { name:'externalId', label:'ID KomTender', type:'text', required:true, unique:true, index:true },
    { name:'eisNumber', label:'Номер ЕИС', type:'text', index:true },
    { name:'title', label:'Название', type:'text', required:true, index:true },
    { name:'customerName', label:'Заказчик', type:'text', index:true },
    { name:'customerInn', label:'ИНН заказчика', type:'text', index:true },
    { name:'startPrice', label:'Начальная цена', type:'number', index:true },
    { name:'currency', label:'Валюта', type:'text' },
    { name:'publishedAt', label:'Опубликован', type:'date', index:true },
    { name:'deadline', label:'Окончание подачи', type:'date', index:true },
    { name:'region', label:'Регион', type:'text', index:true },
    { name:'city', label:'Город', type:'text' },
    { name:'stage', label:'Стадия', type:'text', index:true },
    { name:'purchaseType', label:'Тип закупки', type:'text', index:true },
    { name:'etp', label:'ЭТП', type:'text' },
    { name:'url', label:'URL', type:'text' },
    { name:'rawJson', label:'Raw JSON', type:'json' },
    { name:'rawHash', label:'Хэш raw', type:'text', index:true },
    { name:'collectedAt', label:'Дата сбора', type:'date', required:true, index:true },
  ],
}
