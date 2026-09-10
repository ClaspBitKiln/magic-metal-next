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

The normalizer canonicalizes decimal formatting, Cyrillic `ё/е`, punctuation and ГОСТ formatting so equivalent RFQ/offer representations can reach the same lookup path.

## Flow

`RFQ → normalize → Product Identity → indexed SupplierOffers lookup → technical match → Offer → landed cost → ranking → split plans`

## Supplier rules

- confirmed supplier/manufacturer may participate in procurement discovery;
- `verify`, `reference`, `historical`, `disabled` entries cannot silently become procurement routes;
- ChZSI and KUMZ remain separate internal layers;
- client never receives supplier/source identifiers;
- market/reference data is evidence, not automatic stock confirmation.

## Logistics

`private/data/logistics-routes.json` is now evidence-backed rather than a list of invented universal surcharges.

Current route states are deliberately conservative:

- Moscow → Tashkent: observed market benchmark, not a Magic Metal contract tariff;
- Chelyabinsk → Tashkent: observed market benchmark, including a published 20 t calculation;
- Ekaterinburg → Tashkent: observed market route;
- China → Tashkent: official FESCO route evidence, quote-based tariff;
- Vladivostok → Tashkent: official FESCO weekly rail service, 13–14 day transit, quote-based tariff.

Only `status=verified` routes may be used as deterministic route tariffs in a recommended procurement plan. `observed` routes are evidence/benchmark only.

The split optimizer now:

- matches origin + destination;
- gates deterministic route costing on verified status;
- checks route capacity;
- groups transport by supplier + origin rather than city alone;
- records a risk when a route tariff is not verified;
- refuses to mark a plan recommended when unresolved logistics risk remains.

## Important operational step

Run `scripts/backfill_supplier_offer_identity.ts` once after deployment/migration so historical supplier offers receive indexed identity fields.

## Remaining work

1. Obtain direct/contract logistics tariffs for priority lanes and mark them `verified`.
2. Add supplier reliability and freshness scoring from observed procurement history.
3. Add quantity-level split within one RFQ line.
4. Add margin engine and minimum acceptable margin constraints.
5. Add QA gate before client quote.
