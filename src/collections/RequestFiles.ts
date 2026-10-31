import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { assertRequestFileStorageReady } from '../lib/requestFileStorage'

export const RequestFiles: CollectionConfig = {
  slug: 'request-files',
  labels: { singular: 'Файл заявки', plural: 'Файлы заявок' },
  admin: { group: 'Заявки' },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [{ name: 'description', label: 'Описание', type: 'text' }],
  hooks: {
    beforeOperation: [({ operation, req }) => {
      if ((operation === 'create' || operation === 'update') && req.file) assertRequestFileStorageReady()
    }],
  },
  upload: {
    disableLocalStorage: process.env.NODE_ENV === 'production',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/*',
      'application/dxf',
      'image/vnd.dwg',
      'application/octet-stream',
    ],
  },
}
