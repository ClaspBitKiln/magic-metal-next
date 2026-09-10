const clean = (value?: string) => value?.trim().toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/gi, '') ?? ''

export type ProductIdentityInput = {
  product?: string
  designation?: string
  standard?: string
  diameter?: string | number
  wall?: string | number
  thickness?: string | number
  length?: string | number
}

export const normalizeProductIdentity = (input: ProductIdentityInput) => ({
  productKey: clean(input.product),
  designationKey: clean(input.designation),
  standardKey: clean(input.standard),
  diameterKey: input.diameter === undefined ? '' : clean(String(input.diameter).replace(',', '.')),
  wallKey: input.wall === undefined ? '' : clean(String(input.wall).replace(',', '.')),
  thicknessKey: input.thickness === undefined ? '' : clean(String(input.thickness).replace(',', '.')),
  lengthKey: input.length === undefined ? '' : clean(String(input.length).replace(',', '.')),
})

export const buildProductIdentityKey = (input: ProductIdentityInput) => {
  const value = normalizeProductIdentity(input)
  return [value.productKey, value.designationKey, value.standardKey, value.diameterKey, value.wallKey, value.thicknessKey, value.lengthKey].join('|')
}
