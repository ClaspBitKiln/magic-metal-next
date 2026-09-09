# OMK Market discovery — 2026-09-09

## Why this source matters

Magic Metal has a user-confirmed working/contractual relationship with OMK, including the Vyksa Metallurgical Plant (VMZ). OMK Market is therefore treated as a priority commercial source in the internal sourcing layer.

## Official OMK sources reviewed

- OMK Market catalog: https://market.omk.ru/catalog/
- OMK Market home: https://market.omk.ru/
- OMK official tubular product catalog: https://omk.ru/upload/iblock/ffc/%D0%9A%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3%20%D1%82%D1%80%D1%83%D0%B1%D0%BD%D0%BE%D0%B9%20%D0%BF%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%86%D0%B8%D0%B8.pdf

## Storefront structure captured

OMK Market exposes flat products, steel tubes, shaped products and long products. The store provides search, product cards, dimensions, grade, GOST, manufacturer, warehouse/location, quantity, VAT price and cart ordering.

Examples observed from current public storefront pages:

- VMZ electric-welded tube 108×3, St20, GOST 10705-80: stock shown in Shchyolkovo, Bataysk, Krasnodar and Kazan with warehouse quantities and prices.
- VMZ electric-welded tube 219×6, St20, GOST 10705-80: stock and price available in the storefront.
- VMZ hot-rolled seamless tube 219×8, St20 and 09G2S, GOST 8731/8732: product cards and warehouse-price data available.
- VMZ profile 120×80×5, St1-3ps/sp, GOST 30245-2003: multiple warehouse locations with quantities and prices.
- VMZ hot-rolled sheet 10×1500×6000 St3ps/sp GOST 14637-2024; 14×2000×6000 09G2S GOST 19281-2014; 20×1600×13000 S355 GOST 27772-2021: warehouse availability and VAT-inclusive prices are shown.

## Normalization rule

For OMK data capture the normalized offer/availability record should preserve:

`externalKey`, `productType`, `designation`, `diameterMm`, `wallMm`, `profileAmm`, `profileBmm`, `thicknessMm`, `lengthMm`, `grade`, `standard`, `manufacturer`, `warehouse`, `quantityT`, `pieceCount`, `priceRubT`, `vatIncluded`, `observedAt`, `sourceUrl`.

## Important distinction

OMK's storefront data are OFFER / AVAILABILITY evidence. OMK corporate product catalogs are CAPABILITY evidence. Do not infer current stock from the corporate catalog alone.

## Public-site rule

These data are ingested into Magic Metal's own storage. The public Magic Metal catalog remains unified and does not expose OMK/VMZ as a selectable supplier.
