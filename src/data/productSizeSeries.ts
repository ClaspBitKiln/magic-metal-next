import { sectionSizeSeries } from './sectionSizeSeries'
import { pipeSizeSeries } from './pipeSizeSeries'
import { otherSizeSeries } from './otherSizeSeries'
import { sdtSizeSeries } from './sdtSizeSeries'
import { sheetSizeSeries } from './sheetSizeSeries'
import { coilSizeSeries } from './coilSizeSeries'
import { profileSizeSeries } from './profileSizeSeries'
import { coldPipeSizeSeries } from './coldPipeSizeSeries'
import { calibratedSquareSizeSeries } from './calibratedSquareSizeSeries'
import { stainlessHotPipeSizeSeries } from './stainlessHotPipeSizeSeries'
import { stainlessColdPipeSizeSeries } from './stainlessColdPipeSizeSeries'
import { teeSizeSeries } from './teeSizeSeries'
import { teeExecution1SizeSeries } from './teeExecution1SizeSeries'
import { reducerSizeSeries } from './reducerSizeSeries'
import { reducerExecution1SizeSeries } from './reducerExecution1SizeSeries'
import { galvanizedSizeSeries } from './galvanizedSizeSeries'
import { stainlessSheetSizeSeries } from './stainlessSheetSizeSeries'
import { additionalPipeSizeSeries } from './additionalPipeSizeSeries'

export const productSizeSeries = [...sectionSizeSeries, ...coldPipeSizeSeries, ...pipeSizeSeries, ...otherSizeSeries, ...sdtSizeSeries, ...sheetSizeSeries, ...coilSizeSeries, ...profileSizeSeries, ...calibratedSquareSizeSeries, ...stainlessHotPipeSizeSeries, ...stainlessColdPipeSizeSeries, ...teeSizeSeries, ...teeExecution1SizeSeries, ...reducerSizeSeries, ...reducerExecution1SizeSeries, ...galvanizedSizeSeries, ...stainlessSheetSizeSeries, ...additionalPipeSizeSeries]

export const getProductSizeSeries = (categorySlug: string, productSlug: string) => productSizeSeries.filter((table) => table.categorySlug === categorySlug && table.productSlug === productSlug)

export const hasProductSizeSeries = (href: string) => productSizeSeries.some((table) => href === `/produkciya/${table.categorySlug}/${table.productSlug}`)

export const getSizeSeriesSummary = (href: string) => productSizeSeries.find((table) => href === `/produkciya/${table.categorySlug}/${table.productSlug}` && table.summary)?.summary
