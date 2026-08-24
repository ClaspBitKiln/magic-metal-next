import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const Requests: CollectionConfig = {
  slug: 'requests',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'company',
    defaultColumns: ['createdAt', 'company', 'name', 'phone', 'status', 'source'],
    group: 'Заявки',
  },
  access: {
    read: isAuthenticated,
    create: () => true,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'name', label: 'Имя', type: 'text', required: true },
    { name: 'company', label: 'Компания', type: 'text' },
    { name: 'phone', label: 'Телефон', type: 'text', required: true, index: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'message', label: 'Что требуется', type: 'textarea', required: true },
    { name: 'context', label: 'Контекст страницы', type: 'text', index: true },
    {
      name: 'productDirection', label: 'Направление', type: 'select',
      options: [
        { label: 'Трубы электросварные', value: 'electrowelded-pipes' },
        { label: 'Трубы бесшовные', value: 'seamless-pipes' },
        { label: 'СДТ', value: 'pipeline-parts' },
        { label: 'Изоляция', value: 'insulated' },
        { label: 'Другая продукция', value: 'other' },
      ],
    },
    {
      name: 'originPreference', label: 'Происхождение продукции', type: 'select', defaultValue: 'any',
      options: [
        { label: 'Без предпочтений', value: 'any' },
        { label: 'Россия / СНГ', value: 'russia-cis' },
        { label: 'Китай', value: 'china' },
        { label: 'Другое', value: 'other' },
      ],
    },
    { name: 'files', label: 'Приложения', type: 'relationship', relationTo: 'request-files', hasMany: true },
    {
      name: 'status', label: 'Статус', type: 'select', required: true, defaultValue: 'new', index: true,
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'В работе', value: 'in-progress' },
        { label: 'Предложение отправлено', value: 'quoted' },
        { label: 'Закрыта', value: 'closed' },
      ],
    },
    { name: 'source', label: 'Источник', type: 'text', index: true },
    { name: 'landingPage', label: 'Страница входа', type: 'text' },
    { name: 'referrer', label: 'Реферер', type: 'text' },
    { name: 'utmSource', label: 'UTM source', type: 'text' },
    { name: 'utmMedium', label: 'UTM medium', type: 'text' },
    { name: 'utmCampaign', label: 'UTM campaign', type: 'text' },
    { name: 'emailDelivered', label: 'Письмо доставлено', type: 'checkbox', defaultValue: false },
    { name: 'crmDelivered', label: 'Передано в CRM', type: 'checkbox', defaultValue: false },
  ],
}
