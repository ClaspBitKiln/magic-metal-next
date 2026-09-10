# Phase 4 — Procurement Engine: real supplier data

## Implemented

The existing Payload `supplier-offers` collection is the operational offer source for the Procurement Engine adapter. Supplier/source identifiers remain internal and are converted into the domain `Offer` model.

## Product Identity

Supplier offers now receive indexed normalized identity fields:

- `productKey`
- `designationKey`
- `standardKey`
- `diameterKey`
- `wallKey`
- `thicknessKey`
- `lengthKey`
- `productIdentityKey`

The adapter queries PostgreSQL/Payload by indexed identity fields instead of scanning the full active offer catalog. Existing records can be populated by `scripts/backfill_supplier_offer_identity.ts`.

## Logistics benchmark: ATI.SU

ATI.SU Average Rates is connected as an internal logistics benchmark provider. Its API exposes route averages, lower/upper range, route cost, distance and load count; data is updated daily and the API supports 20 t fully loaded vehicles. The API is paid and uses a Bearer token. The integration uses `GET /priceline/license/v2/all_directions` and `POST /priceline/license/v1/average_prices`.

Configured priority lanes:

- Moscow → Tashkent — 20 t closed body;
- Chelyabinsk → Tashkent — 20 t closed body;
- Ekaterinburg → Tashkent — 20 t closed body;
- China → Tashkent — configured as a separate multimodal lane; if ATI has no matching city direction, no invented rate is stored.

Every ATI result is stored in Payload `logistics-benchmarks` with `evidenceLevel=observed`. It is a market benchmark, never a Magic Metal carrier contract tariff.

A Vercel cron refreshes the previous day's ATI data daily at `06:30`. Secrets are not stored in Git: `ATI_API_TOKEN` and `CRON_SECRET` must be configured in the deployment environment.

## Split Procurement

The optimizer can optionally consume observed ATI benchmarks for preliminary internal economics (`allowObservedRoutes=true`). Such plans always carry a logistics-risk warning and cannot become final `recommended=true` plans until the route is verified.

Deterministic procurement recommendations still require `status=verified` route economics.

## Supplier rules

- confirmed supplier/manufacturer may participate in procurement discovery;
- `verify`, `reference`, `historical`, `disabled` entries cannot silently become procurement routes;
- ChZSI and KUMZ remain separate internal layers;
- client never receives supplier/source identifiers;
- market/reference data is evidence, not automatic stock confirmation.

## Remaining work

1. Configure ATI API license/token in deployment and run the first live refresh.
2. Verify ATI coverage for the four priority lanes; China may require a different logistics benchmark source because ATI city-direction data may not exist.
3. Obtain direct/contract logistics tariffs for priority lanes and mark them `verified`.
4. Add supplier reliability and freshness scoring from observed procurement history.
5. Add quantity-level split within one RFQ line.
6. Add margin engine and minimum acceptable margin constraints.
7. Add QA gate before client quote.
