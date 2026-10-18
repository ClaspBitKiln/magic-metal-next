import { formatDimensionValue, formatDimensionDesignation } from '@/lib/dimensionDisplay'

// Server-rendered catalog data: import only from server components/routes.
// Source: MetalService XLS dated 2026-10-16; owner confirmed stock standard 2026-10-18.
// Explicit source anchors only. Prices and tax calculations are intentionally absent.
// Dimensions retain their source designation; an absent unit of dimension is not inferred.
// Generic/ungrouped profnastil entries and ambiguous continuations are excluded.

export type CatalogStockAssortmentRow = {
  id: string
  description: string
  nameFieldLabel: string
  sizeDesignation: string
  dimensionLabel: string
  unit: string
  group: string
}

const stockByRoute: Readonly<Record<string, readonly CatalogStockAssortmentRow[]>> = {
  "sortovoy-i-fasonny-prokat/armatura": [
    // sortovojprokat.xls Лист1!A7:D7 (left)
    {"id": "9a1372bc831ae6173d2a", "description": "кл А1 А240", "nameFieldLabel": "Марка", "sizeDesignation": "8", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A8:D8 (left)
    {"id": "c2911a6b0c3a46119c38", "description": "кл А1 А240", "nameFieldLabel": "Марка", "sizeDesignation": "8 ; 14", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A9:D9 (left)
    {"id": "d394a4f8c146d196e6c0", "description": "кл А1 А240", "nameFieldLabel": "Марка", "sizeDesignation": "14", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A10:D10 (left); sortovojprokat.xls Лист1!A11:D11 (left)
    {"id": "1af067bca6a57c988912", "description": "кл А1 А240", "nameFieldLabel": "Марка", "sizeDesignation": "18", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A12:D12 (left); sortovojprokat.xls Лист1!A13:D13 (left)
    {"id": "0aeb5b41af8c8ac78e58", "description": "кл А1 А240", "nameFieldLabel": "Марка", "sizeDesignation": "20", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A14:D14 (left); sortovojprokat.xls Лист1!A15:D15 (left)
    {"id": "16feeaac7903ad59382e", "description": "кл А1 А240", "nameFieldLabel": "Марка", "sizeDesignation": "22", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A16:D16 (left); sortovojprokat.xls Лист1!A17:D17 (left)
    {"id": "c1c1fb7f4c9ecd7b2acf", "description": "кл А1 А240", "nameFieldLabel": "Марка", "sizeDesignation": "25", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A18:D18 (left); sortovojprokat.xls Лист1!A19:D19 (left)
    {"id": "094d2ef379b658c1bfb4", "description": "кл А1 А240 6м", "nameFieldLabel": "Марка", "sizeDesignation": "6", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A20:D20 (left); sortovojprokat.xls Лист1!A21:D21 (left)
    {"id": "aefe56baafd0ca484f60", "description": "кл А1 А240 6м", "nameFieldLabel": "Марка", "sizeDesignation": "8", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A22:D22 (left); sortovojprokat.xls Лист1!A23:D23 (left)
    {"id": "87fa1eff452ee9d166d9", "description": "кл А1 А240С", "nameFieldLabel": "Марка", "sizeDesignation": "10", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A24:D24 (left); sortovojprokat.xls Лист1!A25:D25 (left)
    {"id": "711d9a377d14cb792976", "description": "кл А1 А240С", "nameFieldLabel": "Марка", "sizeDesignation": "16", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A26:D26 (left); sortovojprokat.xls Лист1!A27:D27 (left)
    {"id": "3a43c683eb361fe69286", "description": "кл А1 А240С 6м", "nameFieldLabel": "Марка", "sizeDesignation": "10", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A28:D28 (left)
    {"id": "b6c2a3a908baf1260a65", "description": "кл А1 мотки А240", "nameFieldLabel": "Марка", "sizeDesignation": "8", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A29:D29 (left)
    {"id": "e3bc700881fce79dbad4", "description": "кл А1 мотки А240С", "nameFieldLabel": "Марка", "sizeDesignation": "10", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A30:D30 (left); sortovojprokat.xls Лист1!A31:D31 (left)
    {"id": "df3b0d444e0977d56ecf", "description": "кл А1 Ст3", "nameFieldLabel": "Марка", "sizeDesignation": "12", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A32:D32 (left)
    {"id": "c7ddd9f4bb41cabb95f5", "description": "кл А1 Ст3", "nameFieldLabel": "Марка", "sizeDesignation": "25", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A33:D33 (left)
    {"id": "315156cb3691e7e8336b", "description": "кл А1 Ст3", "nameFieldLabel": "Марка", "sizeDesignation": "36", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A34:D34 (left); sortovojprokat.xls Лист1!A35:D35 (left)
    {"id": "feccb8cc631dfd11ddef", "description": "кл А1 Ст3 6м", "nameFieldLabel": "Марка", "sizeDesignation": "6", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A36:D36 (left); sortovojprokat.xls Лист1!A37:D37 (left)
    {"id": "06c5b3905ac60dea4669", "description": "кл А1 Ст3 6м", "nameFieldLabel": "Марка", "sizeDesignation": "8", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A38:D38 (left)
    {"id": "d148d11172eb04dc9033", "description": "кл А1 Ст3 6м", "nameFieldLabel": "Марка", "sizeDesignation": "10", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A39:D39 (left)
    {"id": "f8618a4ecc70ad4f728a", "description": "кл А1 Ст3 6м", "nameFieldLabel": "Марка", "sizeDesignation": "12", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A40:D40 (left)
    {"id": "5b722935a6509fad9814", "description": "кл А3 1000-6000 некондиция", "nameFieldLabel": "Марка", "sizeDesignation": "12", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A42:D42 (left)
    {"id": "9d537c333d4452abf822", "description": "кл А3 1000-6000 некондиция", "nameFieldLabel": "Марка", "sizeDesignation": "16", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A44:D44 (left)
    {"id": "b46ac1cff92f7280438d", "description": "кл А3 25Г2С", "nameFieldLabel": "Марка", "sizeDesignation": "6", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A45:D45 (left)
    {"id": "151426e64dbcf8c61dc1", "description": "кл А3 25Г2С", "nameFieldLabel": "Марка", "sizeDesignation": "12", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A46:D46 (left)
    {"id": "71b3dfbd94c2f5e3f531", "description": "кл А3 25Г2С", "nameFieldLabel": "Марка", "sizeDesignation": "16", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A47:D47 (left)
    {"id": "a9552a2a774dde3f2d08", "description": "кл А3 25Г2С", "nameFieldLabel": "Марка", "sizeDesignation": "18", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A48:D48 (left)
    {"id": "df5d47862e07b2d37227", "description": "кл А3 25Г2С", "nameFieldLabel": "Марка", "sizeDesignation": "20 ; 22; 25", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A49:D49 (left)
    {"id": "33f0ea09590606a350dd", "description": "кл А3 25Г2С", "nameFieldLabel": "Марка", "sizeDesignation": "32", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A50:D50 (left)
    {"id": "34eb106dc4548984de9a", "description": "кл А3 35ГС", "nameFieldLabel": "Марка", "sizeDesignation": "6", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A51:D51 (left); sortovojprokat.xls Лист1!A52:D52 (left)
    {"id": "258c0749f55ddafb6ed6", "description": "кл А3 35ГС", "nameFieldLabel": "Марка", "sizeDesignation": "8", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A53:D53 (left)
    {"id": "e4aa5e2ec97f2aed4a4f", "description": "кл А3 35ГС", "nameFieldLabel": "Марка", "sizeDesignation": "10", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A54:D54 (left)
    {"id": "6baa0d3933d261579a64", "description": "кл А3 35ГС", "nameFieldLabel": "Марка", "sizeDesignation": "32", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A55:D55 (left); sortovojprokat.xls Лист1!A56:D56 (left)
    {"id": "4007bdb8f83660a07df0", "description": "кл А3 А400;500", "nameFieldLabel": "Марка", "sizeDesignation": "8", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A57:D57 (left); sortovojprokat.xls Лист1!A58:D58 (left)
    {"id": "842d2107ececbd7af7a7", "description": "кл А3 А400;500", "nameFieldLabel": "Марка", "sizeDesignation": "10", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A59:D59 (left); sortovojprokat.xls Лист1!A60:D60 (left)
    {"id": "227800329907ce835202", "description": "кл А3 А400;500", "nameFieldLabel": "Марка", "sizeDesignation": "12", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A61:D61 (left); sortovojprokat.xls Лист1!A62:D62 (left)
    {"id": "2466b263e2ab8e2eacfa", "description": "кл А3 А400;500", "nameFieldLabel": "Марка", "sizeDesignation": "14", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A63:D63 (left); sortovojprokat.xls Лист1!A64:D64 (left)
    {"id": "bfd72fd48056f0e29f5b", "description": "кл А3 А400;500", "nameFieldLabel": "Марка", "sizeDesignation": "16", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A65:D65 (left); sortovojprokat.xls Лист1!A66:D66 (left)
    {"id": "cefcc50bab26738f7fcc", "description": "кл А3 А400;500", "nameFieldLabel": "Марка", "sizeDesignation": "18", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
    // sortovojprokat.xls Лист1!A67:D67 (left); sortovojprokat.xls Лист1!A68:D68 (left)
    {"id": "5e4ec3dd6ebcdc9735e2", "description": "кл А3 А400;500", "nameFieldLabel": "Марка", "sizeDesignation": "20", "dimensionLabel": "диаметр", "unit": "т", "group": "АРМАТУРА"},
  ],
  "sortovoy-i-fasonny-prokat/katanka": [
    // sortovojprokat.xls Лист1!A306:D306 (left); sortovojprokat.xls Лист1!A307:D307 (left)
    {"id": "63bef347b72691b28c89", "description": "", "nameFieldLabel": "", "sizeDesignation": "5.5", "dimensionLabel": "диаметр", "unit": "т", "group": "КАТАНКА"},
    // sortovojprokat.xls Лист1!A308:D308 (left); sortovojprokat.xls Лист1!A309:D309 (left)
    {"id": "50b4466d50d501d446be", "description": "", "nameFieldLabel": "", "sizeDesignation": "6.5", "dimensionLabel": "диаметр", "unit": "т", "group": "КАТАНКА"},
    // sortovojprokat.xls Лист1!A310:D310 (left)
    {"id": "9ea971484a4432064d2b", "description": "", "nameFieldLabel": "", "sizeDesignation": "8", "dimensionLabel": "диаметр", "unit": "т", "group": "КАТАНКА"},
    // sortovojprokat.xls Лист1!A311:D311 (left); sortovojprokat.xls Лист1!A312:D312 (left)
    {"id": "082bebe87c253b371c43", "description": "мотки", "nameFieldLabel": "", "sizeDesignation": "5.5", "dimensionLabel": "диаметр", "unit": "т", "group": "КАТАНКА"},
    // sortovojprokat.xls Лист1!A313:D313 (left); sortovojprokat.xls Лист1!A314:D314 (left)
    {"id": "11f3ef4f98cd82230e9b", "description": "мотки", "nameFieldLabel": "", "sizeDesignation": "6", "dimensionLabel": "диаметр", "unit": "т", "group": "КАТАНКА"},
    // sortovojprokat.xls Лист1!A315:D315 (left); sortovojprokat.xls Лист1!A316:D316 (left)
    {"id": "78b64ed48015ab2cd23f", "description": "мотки", "nameFieldLabel": "", "sizeDesignation": "6.5", "dimensionLabel": "диаметр", "unit": "т", "group": "КАТАНКА"},
    // sortovojprokat.xls Лист1!A317:D317 (left); sortovojprokat.xls Лист1!A318:D318 (left)
    {"id": "85defa10a90df09a528c", "description": "мотки", "nameFieldLabel": "", "sizeDesignation": "8", "dimensionLabel": "диаметр", "unit": "т", "group": "КАТАНКА"},
    // sortovojprokat.xls Лист1!A319:D319 (left); sortovojprokat.xls Лист1!A320:D320 (left)
    {"id": "4c541a1f294cbfc0bf74", "description": "мотки", "nameFieldLabel": "", "sizeDesignation": "10", "dimensionLabel": "диаметр", "unit": "т", "group": "КАТАНКА"},
    // sortovojprokat.xls Лист1!A321:D321 (left); sortovojprokat.xls Лист1!A322:D322 (left)
    {"id": "fa9fa988d26d4ae09723", "description": "мотки", "nameFieldLabel": "", "sizeDesignation": "12", "dimensionLabel": "диаметр", "unit": "т", "group": "КАТАНКА"},
  ],
  "metizy-i-svarochnye-materialy/setki": [
    // metizy.xls Лист1!A195:D195 (left)
    {"id": "9d77867f89f91f9607a4", "description": "10.00x1.00", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A196:D196 (left)
    {"id": "b8f8972811f8baf0860f", "description": "10.00x1.00 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A198:D198 (left)
    {"id": "ba696a54bb6b9e36d6f0", "description": "15.00x1.20", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A199:D199 (left)
    {"id": "5f20e3995d24e56baff5", "description": "15.00x1.40", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A200:D200 (left)
    {"id": "9404573ca2d2cf603b92", "description": "20.00x1.20", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A201:D201 (left)
    {"id": "1b79ed6319be27441c0c", "description": "20.00x1.20 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A203:D203 (left)
    {"id": "1c43b25a4dfa8748f68d", "description": "20.00x1.60", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A204:D204 (left)
    {"id": "d8b9265f035805b32616", "description": "20.00x2.00", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A205:D205 (left)
    {"id": "ae7ceb2842337df5f033", "description": "20.00x2.00 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A207:D207 (left)
    {"id": "df5752fa6406f8834e58", "description": "35.00x1.60 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A209:D209 (left)
    {"id": "29973ccc684863823fef", "description": "35.00x2.00", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A210:D210 (left)
    {"id": "16c30c8545cc56285a98", "description": "35.00x2.00 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A212:D212 (left)
    {"id": "1360974528ca0e489588", "description": "50.00x1.80 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА ПЛЕТЕНАЯ"},
    // metizy.xls Лист1!A220:D220 (left)
    {"id": "5cca76bbf0a587e75ef7", "description": "50.00x5.00", "nameFieldLabel": "Наименование", "sizeDesignation": "380", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A221:D221 (left)
    {"id": "23e8e9cb73ae39c09f3f", "description": "50.00x5.00", "nameFieldLabel": "Наименование", "sizeDesignation": "500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A222:D222 (left)
    {"id": "ff623cd846aacdb041e0", "description": "50.00x5.00", "nameFieldLabel": "Наименование", "sizeDesignation": "510", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A223:D223 (left); metizy.xls Лист1!A224:D224 (left)
    {"id": "cf80e6627b2b603e339b", "description": "50.00x5.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A225:D225 (left)
    {"id": "694e20e6ba164cc1bcdb", "description": "100.00x10.00 В500С", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A227:D227 (left)
    {"id": "78da7e07732228222df3", "description": "100.00x2.50", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A228:D228 (left); metizy.xls Лист1!A229:D229 (left)
    {"id": "91854eb77749fb2c9527", "description": "100.00x3.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A230:D230 (left)
    {"id": "5713a6a8a74181d7cdc7", "description": "100.00x4.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A231:D231 (left)
    {"id": "4eaf2dcb143d75089b35", "description": "100.00x5.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A232:D232 (left)
    {"id": "6a91b00f3e146038ebf0", "description": "100.00x6.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A233:D233 (left)
    {"id": "79e9c88fcd9f647ec7e8", "description": "100.00x6.00 В500С", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A235:D235 (left)
    {"id": "b80deae2b50fdd537f36", "description": "100.00x8.00 В500С", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A237:D237 (left)
    {"id": "fa96a9c078ec890fcafd", "description": "115.00x2.50", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A238:D238 (left)
    {"id": "ad9bc726b227cfe9478e", "description": "150.00x10.00 В500С", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A240:D240 (left)
    {"id": "2cc36485df3c6bab5752", "description": "150.00x3.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A241:D241 (left); metizy.xls Лист1!A242:D242 (left)
    {"id": "2ad5e7e6b8aa77e4d252", "description": "150.00x4.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A243:D243 (left)
    {"id": "af70dcd966c86bbd62a8", "description": "150.00x5.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A244:D244 (left)
    {"id": "2637e1a3aa1b8a8b3746", "description": "150.00x6.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A245:D245 (left)
    {"id": "0d92eece53720077a020", "description": "150.00x6.00 В500С", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A247:D247 (left)
    {"id": "b12010c291f8c5278cc6", "description": "150.00x8.00 В500С", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A249:D249 (left)
    {"id": "6bbb5321e7d1a879ec3f", "description": "200.00x10.00 В500С", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A251:D251 (left)
    {"id": "d3a1b272b745fb9a4cb5", "description": "200.00x12.00 В500С", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A253:D253 (left)
    {"id": "deea7b295092b05f9c40", "description": "200.00x4.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A254:D254 (left)
    {"id": "8d49146c3f15f82b0d6f", "description": "200.00x5.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A255:D255 (left)
    {"id": "ac0d0065c7306304b50f", "description": "200.00x6.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!A256:D256 (left)
    {"id": "c986a31617da629d2dcc", "description": "200.00x8.00 В500С", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ (продолжение)"},
    // metizy.xls Лист1!F154:I154 (right)
    {"id": "a2c614390b4f47b08801", "description": "2.00x0.40", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ ТКАНАЯ"},
    // metizy.xls Лист1!F155:I155 (right)
    {"id": "6e923e016aed719b6b97", "description": "5.00x0.70", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ ТКАНАЯ"},
    // metizy.xls Лист1!F156:I156 (right)
    {"id": "7e3838f4f5cc2e5f6fce", "description": "5.00x1.00", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ ТКАНАЯ"},
    // metizy.xls Лист1!F157:I157 (right)
    {"id": "e356f80121717e130ca5", "description": "5.00x1.20", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ ТКАНАЯ"},
    // metizy.xls Лист1!F158:I158 (right)
    {"id": "79bfe4e110a772235fff", "description": "10.00x0.80", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ ТКАНАЯ"},
    // metizy.xls Лист1!F159:I159 (right)
    {"id": "6bb068edcbb308ca8121", "description": "10.00x1.00", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ ТКАНАЯ"},
    // metizy.xls Лист1!F160:I160 (right)
    {"id": "c6438f8f7a247b9ded44", "description": "14.00x0.80", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ ТКАНАЯ"},
    // metizy.xls Лист1!F161:I161 (right)
    {"id": "a658ee68b810fac3e62d", "description": "14.00x0.80 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ ТКАНАЯ"},
    // metizy.xls Лист1!F165:I165 (right)
    {"id": "45240abb2b455840fa8c", "description": "20.00x0.80 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F167:I167 (right)
    {"id": "940af0eb81ed53d35f02", "description": "20.00x1.00 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F169:I169 (right)
    {"id": "1fd1ca38f4d42daba6fb", "description": "20.00x1.20 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F171:I171 (right)
    {"id": "8f1a00b52fd9c4e3ac0f", "description": "25.00x0.80 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F173:I173 (right)
    {"id": "51bb611c5c5a34d68096", "description": "25.00x1.20 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F175:I175 (right)
    {"id": "1b5a045cc748d1f88ac4", "description": "25.00x1.60 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F177:I177 (right)
    {"id": "ab862ec65f04d0151114", "description": "25.00x1.80 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F179:I179 (right)
    {"id": "3c83728e2148fb055f79", "description": "25.00x2.00", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F180:I180 (right)
    {"id": "b0a642c17750bb047b16", "description": "50.00x1.40", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F181:I181 (right)
    {"id": "b27dc403cec6fa03a5d7", "description": "50.00x1.40 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500 ; 2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F183:I183 (right)
    {"id": "8ab786fb2543fdbd13ff", "description": "50.00x1.60", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F184:I184 (right)
    {"id": "5a3f9eb37280d0585f46", "description": "50.00x1.60", "nameFieldLabel": "Наименование", "sizeDesignation": "1800", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F185:I185 (right)
    {"id": "924e86bffdc252ac2a98", "description": "50.00x1.60 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500 ; 2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F187:I187 (right)
    {"id": "26fd0deb8b43a978df75", "description": "50.00x1.60 оцинк 45 м", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F189:I189 (right)
    {"id": "56868602af942ec97b36", "description": "50.00x1.80", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F190:I190 (right)
    {"id": "ed909815f1b1b5e7c9ba", "description": "50.00x1.80 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500 ; 2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F192:I192 (right)
    {"id": "b7e82e531bfe04e1a232", "description": "50.00x2.00", "nameFieldLabel": "Наименование", "sizeDesignation": "1500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F193:I193 (right)
    {"id": "42d10c9c6c58c1791c41", "description": "50.00x2.00 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1450", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F195:I195 (right)
    {"id": "298575b84d0677eb7662", "description": "50.00x2.00 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500 ; 2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F197:I197 (right)
    {"id": "0715cfd66bece00c012f", "description": "50.00x2.50", "nameFieldLabel": "Наименование", "sizeDesignation": "1500 ; 2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F198:I198 (right)
    {"id": "285b533d394c9ad212ab", "description": "50.00x2.50 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1500 ; 2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F200:I200 (right)
    {"id": "74a83a06a00ee12db634", "description": "50.00x3.00", "nameFieldLabel": "Наименование", "sizeDesignation": "350 ; 380", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F201:I201 (right)
    {"id": "3c5fec5f6b15bb414888", "description": "50.00x3.00", "nameFieldLabel": "Наименование", "sizeDesignation": "380", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F202:I202 (right)
    {"id": "6ac754e0ac9a756a93e5", "description": "50.00x3.00", "nameFieldLabel": "Наименование", "sizeDesignation": "500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F203:I203 (right)
    {"id": "ee356b8fdd0e649c928b", "description": "50.00x3.00", "nameFieldLabel": "Наименование", "sizeDesignation": "510 ; 640; 640", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F204:I204 (right)
    {"id": "0e7ceca94e2109cedb48", "description": "50.00x3.00", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F205:I205 (right)
    {"id": "11e744fb27f7d9765f5c", "description": "50.00x3.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F206:I206 (right)
    {"id": "1fe256996e913de93b65", "description": "50.00x3.00 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "500 ; 2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F208:I208 (right)
    {"id": "a3c0760186758ea3d94f", "description": "50.00x4.00", "nameFieldLabel": "Наименование", "sizeDesignation": "350 ; 380; 500", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F209:I209 (right)
    {"id": "10045c7f9444b24941dc", "description": "50.00x4.00", "nameFieldLabel": "Наименование", "sizeDesignation": "510 ; 640", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F210:I210 (right)
    {"id": "cae3beccc75cc52ce0dd", "description": "50.00x4.00", "nameFieldLabel": "Наименование", "sizeDesignation": "1000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F211:I211 (right)
    {"id": "0ee5096fcddf139c7eb8", "description": "50.00x4.00", "nameFieldLabel": "Наименование", "sizeDesignation": "2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
    // metizy.xls Лист1!F212:I212 (right)
    {"id": "8e1ec5f28ff3db586c3f", "description": "50.00x4.00 оцинк", "nameFieldLabel": "Наименование", "sizeDesignation": "500 ; 2000", "dimensionLabel": "ширина", "unit": "м2", "group": "СЕТКА СТАЛЬНАЯ СВАРНАЯ"},
  ],
  "metizy-i-svarochnye-materialy/lenta-upakovochnaya": [
    // metizy.xls Лист1!A171:D171 (left); metizy.xls Лист1!A172:D172 (left)
    {"id": "76e8dcdfa9c2256872ac", "description": "19", "nameFieldLabel": "Ширина", "sizeDesignation": "0,7", "dimensionLabel": "толщина", "unit": "т", "group": "ЛЕНТА Х/К УПАКОВОЧНАЯ"},
    // metizy.xls Лист1!A173:D173 (left)
    {"id": "1cf96cbdf6d5227034cb", "description": "19", "nameFieldLabel": "Ширина", "sizeDesignation": "0,8", "dimensionLabel": "толщина", "unit": "т", "group": "ЛЕНТА Х/К УПАКОВОЧНАЯ"},
    // metizy.xls Лист1!A174:D174 (left)
    {"id": "7d23e5848ba4fa1f34d7", "description": "20", "nameFieldLabel": "Ширина", "sizeDesignation": "0,3", "dimensionLabel": "толщина", "unit": "т", "group": "ЛЕНТА Х/К УПАКОВОЧНАЯ"},
    // metizy.xls Лист1!A175:D175 (left); metizy.xls Лист1!A176:D176 (left)
    {"id": "14050c81c6cd206efe42", "description": "20", "nameFieldLabel": "Ширина", "sizeDesignation": "0,4", "dimensionLabel": "толщина", "unit": "т", "group": "ЛЕНТА Х/К УПАКОВОЧНАЯ"},
    // metizy.xls Лист1!A177:D177 (left); metizy.xls Лист1!A178:D178 (left); metizy.xls Лист1!A179:D179 (left); metizy.xls Лист1!A180:D180 (left)
    {"id": "8632b6413115482158ab", "description": "20", "nameFieldLabel": "Ширина", "sizeDesignation": "0,5", "dimensionLabel": "толщина", "unit": "т", "group": "ЛЕНТА Х/К УПАКОВОЧНАЯ"},
    // metizy.xls Лист1!A181:D181 (left); metizy.xls Лист1!A182:D182 (left); metizy.xls Лист1!A183:D183 (left); metizy.xls Лист1!A184:D184 (left)
    {"id": "471c5c866699020afcc8", "description": "20", "nameFieldLabel": "Ширина", "sizeDesignation": "0,7", "dimensionLabel": "толщина", "unit": "т", "group": "ЛЕНТА Х/К УПАКОВОЧНАЯ"},
    // metizy.xls Лист1!A185:D185 (left); metizy.xls Лист1!A186:D186 (left); metizy.xls Лист1!A187:D187 (left)
    {"id": "a6ebad4efaea1f009caf", "description": "20", "nameFieldLabel": "Ширина", "sizeDesignation": "0,8", "dimensionLabel": "толщина", "unit": "т", "group": "ЛЕНТА Х/К УПАКОВОЧНАЯ"},
    // metizy.xls Лист1!A188:D188 (left)
    {"id": "81d31ff6c5c17f96c75a", "description": "20", "nameFieldLabel": "Ширина", "sizeDesignation": "1", "dimensionLabel": "толщина", "unit": "т", "group": "ЛЕНТА Х/К УПАКОВОЧНАЯ"},
    // metizy.xls Лист1!A189:D189 (left)
    {"id": "5563ce1689274b8d5d99", "description": "32", "nameFieldLabel": "Ширина", "sizeDesignation": "0,7 ; 0,8", "dimensionLabel": "толщина", "unit": "т", "group": "ЛЕНТА Х/К УПАКОВОЧНАЯ"},
  ],
  "listovoy-prokat/profnastil": [
    // profnastil.xls Лист1!A9:D9 (left)
    {"id": "a35adc5e84f47908bfb5", "description": "Н75 750(800)-0.8 RAL 7038 Уценка", "nameFieldLabel": "Наименование", "sizeDesignation": "0.8", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A11:D11 (left)
    {"id": "acb51d6fd683033a8f53", "description": "НС35 1000(1060)-0.45 RAL 1018", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A13:D13 (left)
    {"id": "02eb9fabbd1f82c2f1e9", "description": "НС35 1000(1060)-0.5 RAL 6005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A15:D15 (left)
    {"id": "6a451e4246add44f0b59", "description": "НС44 1000(1064)-0.4 RAL 6005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A17:D17 (left)
    {"id": "422a6f726571959bb347", "description": "С10 1100(1170)-0.5 RAL 7004", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A19:D19 (left)
    {"id": "4b1af789e857b6b56664", "description": "С20 1100(1150)-0.35 RAL 3005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A21:D21 (left)
    {"id": "651435c166b806a887f8", "description": "С20 1100(1150)-0.35 RAL 5005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A23:D23 (left)
    {"id": "960fd51eb7c317cc414f", "description": "С20 1100(1150)-0.35 RAL 6005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A25:D25 (left)
    {"id": "85a91d46e3e7f7d564bb", "description": "С20 1100(1150)-0.35 RAL 7004", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A27:D27 (left)
    {"id": "146033142c429c00283a", "description": "С20 1100(1150)-0.35 RAL 7024", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A29:D29 (left)
    {"id": "137cccaa7fb9a4d8929c", "description": "С20 1100(1150)-0.35 RAL 8017", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A31:D31 (left)
    {"id": "c27263f9c148e0539197", "description": "С20 1100(1150)-0.4 RAL 3005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A33:D33 (left)
    {"id": "523890440de3cf2309de", "description": "С20 1100(1150)-0.4 RAL 5005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A35:D35 (left)
    {"id": "1ed7c16ab726681bdfb4", "description": "С20 1100(1150)-0.4 RAL 6005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A37:D37 (left)
    {"id": "82452f485b04a35264be", "description": "С20 1100(1150)-0.4 RAL 7004", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A39:D39 (left)
    {"id": "3d024de490e55fb64dd9", "description": "С20 1100(1150)-0.4 RAL 7024", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A41:D41 (left)
    {"id": "f937ecd9d743dfbb24f3", "description": "С20 1100(1150)-0.4 RAL 8017", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A43:D43 (left)
    {"id": "31133720ae13c8dd09a1", "description": "С20 1100(1150)-0.45 RAL 3005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A45:D45 (left)
    {"id": "87974d3cfe35c73dccee", "description": "С20 1100(1150)-0.45 RAL 5005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A47:D47 (left)
    {"id": "855fafdcd520ed5914cd", "description": "С20 1100(1150)-0.45 RAL 6005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A49:D49 (left)
    {"id": "0990c48baa50cd772c15", "description": "С20 1100(1150)-0.45 RAL 7004", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A51:D51 (left)
    {"id": "2809a95ced518b683e34", "description": "С20 1100(1150)-0.45 RAL 7024", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A53:D53 (left)
    {"id": "9a9b7ee035bee81977bb", "description": "С20 1100(1150)-0.45 RAL 8017", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A55:D55 (left)
    {"id": "a381cb71139913c2c60a", "description": "С20 1100(1150)-0.5 RAL 3005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A57:D57 (left)
    {"id": "c5c6c9672e76e8f69c4c", "description": "С20 1100(1150)-0.5 RAL 5005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A59:D59 (left)
    {"id": "d5ac9dd3bce2bd9b387a", "description": "С20 1100(1150)-0.5 RAL 6005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A61:D61 (left)
    {"id": "1056bcc15771837276b5", "description": "С20 1100(1150)-0.5 RAL 7004", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A63:D63 (left)
    {"id": "1dfeca7e5c5e150e8fca", "description": "С20 1100(1150)-0.5 RAL 7024", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A65:D65 (left)
    {"id": "29dd85a3232fb8606e39", "description": "С20 1100(1150)-0.5 RAL 8017", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A67:D67 (left)
    {"id": "82225e2398c0eea5db0c", "description": "С20 1100(1150)-0.5 RAL 9003", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ"},
    // profnastil.xls Лист1!A76:D76 (left)
    {"id": "3dc22fe8d58dd3d299cc", "description": "С8 1150(1200)-0.35 RAL 7024 А", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A78:D78 (left)
    {"id": "1f06d93e00718bd0ec43", "description": "С8 1150(1200)-0.35 RAL 8017", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A80:D80 (left)
    {"id": "cc022aa1154a4504d001", "description": "С8 1150(1200)-0.35 RAL 8017 А", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A82:D82 (left)
    {"id": "301bf09f4a2635f3be81", "description": "С8 1150(1200)-0.35 RAL 9003", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A84:D84 (left)
    {"id": "d783745fe784f9143efa", "description": "С8 1150(1200)-0.4 RAL 3005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A86:D86 (left)
    {"id": "1cd379c276ebc17ae91c", "description": "С8 1150(1200)-0.4 RAL 3005 А", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A88:D88 (left)
    {"id": "26548f977bf22579845f", "description": "С8 1150(1200)-0.4 RAL 5005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A90:D90 (left)
    {"id": "874042362515016a33d0", "description": "С8 1150(1200)-0.4 RAL 5005 А", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A92:D92 (left)
    {"id": "b06a34cc505dacedd833", "description": "С8 1150(1200)-0.4 RAL 6005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A94:D94 (left)
    {"id": "c292f5235aca2f66cdb4", "description": "С8 1150(1200)-0.4 RAL 6005 А", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A96:D96 (left)
    {"id": "fc2d70c54bc1a1c6f886", "description": "С8 1150(1200)-0.4 RAL 7004", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A98:D98 (left)
    {"id": "d6bef04b69cbe1a573ce", "description": "С8 1150(1200)-0.4 RAL 7004 А", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A100:D100 (left)
    {"id": "dcd0045d06f2d41db691", "description": "С8 1150(1200)-0.4 RAL 7024", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A102:D102 (left)
    {"id": "8bde4009beb70dac2f13", "description": "С8 1150(1200)-0.4 RAL 7024 А", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A104:D104 (left)
    {"id": "15d1a330fabe52bb497d", "description": "С8 1150(1200)-0.4 RAL 8017", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A106:D106 (left)
    {"id": "368587b809bac5d7a40d", "description": "С8 1150(1200)-0.4 RAL 8017 А", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A108:D108 (left)
    {"id": "b53e4a30664fa084dc8c", "description": "С8 1150(1200)-0.4 RAL 9003", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A110:D110 (left)
    {"id": "553879280b196311acd4", "description": "С8 1150(1200)-0.4 RAL 9003 А", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A112:D112 (left)
    {"id": "564c2c047460a86fca11", "description": "С8 1150(1200)-0.4 W001", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A114:D114 (left)
    {"id": "ffe3211bca0d3bdb9e69", "description": "С8 1150(1200)-0.4 W004", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A116:D116 (left)
    {"id": "0e90dff3cf32bf8a5413", "description": "С8 1150(1200)-0.4 W005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A118:D118 (left)
    {"id": "f6a0dc276b82ec6a57f8", "description": "С8 1150(1200)-0.45 RAL 3005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A120:D120 (left)
    {"id": "bd7051531dda6da338c8", "description": "С8 1150(1200)-0.45 RAL 5005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A122:D122 (left)
    {"id": "ca9bfde1bc11e9a3b5ea", "description": "С8 1150(1200)-0.45 RAL 6005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A124:D124 (left)
    {"id": "74d92c1e6b37cc021165", "description": "С8 1150(1200)-0.45 RAL 7004", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A126:D126 (left)
    {"id": "651df26088696b310234", "description": "С8 1150(1200)-0.45 RAL 7024", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A128:D128 (left)
    {"id": "c94668128291ef4b56bf", "description": "С8 1150(1200)-0.45 RAL 8017", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A130:D130 (left)
    {"id": "bc5c48718786ca163acc", "description": "С8 1150(1200)-0.45 RAL 9003", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A132:D132 (left)
    {"id": "3df52841d6a306e3ba63", "description": "С8 1150(1200)-0.5 RAL 3005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A134:D134 (left)
    {"id": "3b247c165f4250e156d8", "description": "С8 1150(1200)-0.5 RAL 5005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A136:D136 (left)
    {"id": "555bf0392fa4378ecd6b", "description": "С8 1150(1200)-0.5 RAL 5021", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A138:D138 (left)
    {"id": "9a013b09d6ebaf2e3005", "description": "С8 1150(1200)-0.5 RAL 6005", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A140:D140 (left)
    {"id": "99a79e752186536609e6", "description": "С8 1150(1200)-0.5 RAL 7004", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОКРАШЕННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A148:D148 (left)
    {"id": "3ffc95d1f97cffaf6755", "description": "С20 1100(1150)-0.5 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A150:D150 (left)
    {"id": "1466edbcdd7b02e0f564", "description": "С20 1100(1150)-0.55 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.55", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A152:D152 (left)
    {"id": "13211eefbf650ac81fc1", "description": "С20 1100(1150)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A154:D154 (left)
    {"id": "6db4b5b9a904873ae10d", "description": "С21 1000(1050)-0.45 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A156:D156 (left)
    {"id": "510d51a6d073ba695e62", "description": "С21 1000(1050)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A158:D158 (left)
    {"id": "57d314a8af609c1be60b", "description": "С21 1000(1051)-0.4 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A160:D160 (left)
    {"id": "f0694449830aeb140e2d", "description": "С21 1000(1051)-0.45 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A162:D162 (left)
    {"id": "5587889b798366332285", "description": "С21 1000(1051)-0.5", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A163:D163 (left)
    {"id": "9245627f8f01a554548f", "description": "С21 1000(1051)-0.5 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A165:D165 (left)
    {"id": "11725cff0ecc837670a9", "description": "С21 1000(1051)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A167:D167 (left)
    {"id": "1de05b2387e78149aaad", "description": "С8 1150(1200)-0.3 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.3", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A169:D169 (left); profnastil.xls Лист1!A171:D171 (left)
    {"id": "1413902233fb5db986eb", "description": "С8 1150(1200)-0.35 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.35", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A173:D173 (left); profnastil.xls Лист1!A175:D175 (left)
    {"id": "b51de70244818cba7afb", "description": "С8 1150(1200)-0.4 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A177:D177 (left)
    {"id": "354a97f1063c55e03248", "description": "С8 1150(1200)-0.45 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A179:D179 (left)
    {"id": "7fd36010f938f7d1a423", "description": "С8 1150(1200)-0.5 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!A181:D181 (left)
    {"id": "8ed89b2c64b20f964fb6", "description": "С8 1150(1200)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ (продолжение)"},
    // profnastil.xls Лист1!F86:I86 (right)
    {"id": "eff7b775c67be6f31c0f", "description": "Н114 600(646)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F88:I88 (right)
    {"id": "e2b07b27f79fb7c52054", "description": "Н114 600(646)-0.9 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.9", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F90:I90 (right)
    {"id": "94427a7f0d71421ff16d", "description": "Н114 750(807)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F92:I92 (right)
    {"id": "991d25d13a18534f781c", "description": "Н114 750(807)-0.8 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.8", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F94:I94 (right)
    {"id": "6d028f4b0c073049d588", "description": "Н114 750(807)-0.9 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.9", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F96:I96 (right); profnastil.xls Лист1!F97:I97 (right)
    {"id": "a624206476af632dcae9", "description": "Н114 750(807)-1 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "1", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F98:I98 (right)
    {"id": "cd2a4bc1a0a6453de978", "description": "Н57 750(805)-0.6 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.6", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F100:I100 (right)
    {"id": "b1193d3dd59a09ead699", "description": "Н57 750(805)-0.65 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.65", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F102:I102 (right)
    {"id": "3cd2b0e7e4f18b716fce", "description": "Н57 750(805)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F104:I104 (right)
    {"id": "ad3a4996c32d6d1e68fe", "description": "Н57 750(805)-0.8 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.8", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F106:I106 (right)
    {"id": "6dd8c6f8d238ea7806af", "description": "Н60 845(902)-0.5 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F108:I108 (right)
    {"id": "d157fdb5850f1f8854c8", "description": "Н60 845(902)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F110:I110 (right)
    {"id": "509646bbf91e9c307089", "description": "Н60 845(902)-0.8 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.8", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F112:I112 (right)
    {"id": "2327f77c06e82f7263e7", "description": "Н60 845(902)-0.9 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.9", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F114:I114 (right)
    {"id": "905026235e32642832ee", "description": "Н75 750(800)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F116:I116 (right)
    {"id": "106aee86e405242ec0db", "description": "Н75 750(800)-0.8 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.8", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F118:I118 (right)
    {"id": "edc336bd921333ec561d", "description": "Н75 750(800)-0.9 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.9", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F120:I120 (right)
    {"id": "2e743e887cf82c2a2419", "description": "НС35 1000(1060)-0.45 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F122:I122 (right)
    {"id": "63a9927666ab96e02f85", "description": "НС35 1000(1060)-0.5 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F124:I124 (right)
    {"id": "b49b8a6c4d0cd1197cc8", "description": "НС35 1000(1060)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F126:I126 (right)
    {"id": "e2799175345ffe12d240", "description": "НС35 1000(1060)-0.8 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.8", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F128:I128 (right)
    {"id": "25e94a502927aee2c0ad", "description": "НС44 1000(1064)-0.5 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.5", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F130:I130 (right); profnastil.xls Лист1!F132:I132 (right)
    {"id": "b83f5e5342efc23b8208", "description": "НС44 1000(1064)-0.7 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.7", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F134:I134 (right)
    {"id": "17a31af8aca6c46e1584", "description": "НС44 1000(1064)-0.8 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.8", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F136:I136 (right)
    {"id": "24ce62006a2e7aa3fed2", "description": "С10 1100(1154)-0.4 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F138:I138 (right)
    {"id": "66d63bb5549dfb327d36", "description": "С20 1100(1150)-0.4 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.4", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
    // profnastil.xls Лист1!F140:I140 (right)
    {"id": "cc1b826540a575311285", "description": "С20 1100(1150)-0.45 цинк", "nameFieldLabel": "Наименование", "sizeDesignation": "0.45", "dimensionLabel": "толщина", "unit": "м", "group": "ПРОФНАСТИЛ ОЦИНКОВАННЫЙ"},
  ],
}

export function getCatalogStockAssortment(categorySlug: string, slug: string): readonly CatalogStockAssortmentRow[] {
  return stockByRoute[`${categorySlug}/${slug}`] ?? []
}

export function catalogStockRequestHref(row: CatalogStockAssortmentRow, title: string): string {
  const product = [
    title,
    row.group,
    row.description ? `${row.nameFieldLabel ? `${row.nameFieldLabel}: ` : ''}${formatDimensionDesignation(row.description)}` : '',
    row.sizeDesignation ? `${row.dimensionLabel || 'размерное обозначение'} ${formatDimensionValue(row.sizeDesignation)}` : '',
    `единица учёта ${row.unit}`,
  ].filter(Boolean).join('; ')
  return `/?product=${encodeURIComponent(product)}#request`
}
