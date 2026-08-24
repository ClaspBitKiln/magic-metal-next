import type { GlobalConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  admin: { group: 'Контент сайта' },
  access: { read: () => true, update: isAuthenticated },
  fields: [
    { name: 'companyName', label: 'Компания', type: 'text', defaultValue: 'Мэджик Металл', required: true },
    { name: 'phone', label: 'Телефон', type: 'text', defaultValue: '+7 922 711-73-63', required: true },
    { name: 'email', label: 'Email заявок', type: 'email', defaultValue: 'm1@magicmet.ru', required: true },
    { name: 'heroEyebrow', label: 'Надзаголовок', type: 'text', defaultValue: 'Комплексное снабжение промышленности' },
    { name: 'heroTitle', label: 'Заголовок', type: 'text', defaultValue: 'Металл для сложных промышленных задач' },
    { name: 'heroText', label: 'Описание', type: 'textarea', defaultValue: 'Разбираем спецификацию, проверяем технические требования и комплектуем поставку — от труб и СДТ до редких марок стали.' },
    { name: 'yandexMetrikaId', label: 'ID Яндекс Метрики', type: 'text' },
  ],
}
