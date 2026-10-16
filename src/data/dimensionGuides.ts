import { productDimensionGuides } from './productDimensionGuides'
import { nonferrousDimensionGuides } from './nonferrousDimensionGuides'
import { pipeDimensionGuides } from './pipeDimensionGuides'
import { weldedSdtDimensionGuides } from './weldedSdtDimensionGuides'

export const dimensionGuides = [...productDimensionGuides, ...nonferrousDimensionGuides, ...pipeDimensionGuides, ...weldedSdtDimensionGuides]
export const getDimensionGuide = (categorySlug: string, productSlug: string) =>
  dimensionGuides.find(guide => guide.categorySlug === categorySlug && guide.productSlug === productSlug)
export const hasDimensionGuide = (href: string) =>
  dimensionGuides.some(guide => href === `/produkciya/${guide.categorySlug}/${guide.productSlug}`)
