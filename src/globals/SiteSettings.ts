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
    { name: 'heroEyebrow', label: 'Надзаголовок', type: 'text', defaultValue: 'Поставка металла под требования проекта' },
    { name: 'heroTitle', label: 'Заголовок', type: 'text', defaultValue: 'Металл для сложных промышленных задач' },
    { name: 'heroText', label: 'Описание', type: 'textarea', defaultValue: 'Находим редкие и нестандартные позиции, сверяем ГОСТ, ТУ и документы, комплектуем и доставляем металл по России и СНГ.' },
    { name: 'yandexMetrikaId', label: 'ID Яндекс Метрики', type: 'text' },
  ],
}
