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

## Supplier constraints

The procurement domain now supports per-offer quantity constraints:

- confirmed available quantity is mandatory for quantity-level allocation;
- `minOrderQuantity` — minimum order quantity;
- `maxOrderQuantity` — supplier/order cap;
- `orderStep` — order multiple/step.

Unknown quantity is never converted into invented stock. A line is only closed when the sum of valid allocations covers the requested quantity exactly.

## Reliability and freshness

`rankOffers` is the canonical offer-ranking entry point and now incorporates:

- supplier execution-history reliability;
- price freshness;
- availability freshness;
- logistics-data freshness;
- evidence strength;
- landed-cost normalization.

`rankingEnhanced.ts` remains only as a backward-compatible wrapper and does not apply the scoring a second time.

## Logistics benchmark: ATI.SU

ATI.SU Average Rates is connected as an internal logistics benchmark provider. Its API exposes route averages, lower/upper range, route cost, distance and load count; data is updated daily and the API supports 20 t fully loaded vehicles. The API is paid and uses a Bearer token. The integration uses `GET /priceline/license/v2/all_directions` and `POST /priceline/license/v1/average_prices`.

Configured priority lanes:

- Moscow → Tashkent — 20 t closed body;
- Chelyabinsk → Tashkent — 20 t closed body;
- Ekaterinburg → Tashkent — 20 t closed body;
- China → Tashkent — configured as a separate multimodal lane; if ATI has no matching city direction, no invented rate is stored.

Every ATI result is stored in Payload `logistics-benchmarks` with `evidenceLevel=observed`. It is a market benchmark, never a Magic Metal carrier contract tariff.

A Vercel cron refreshes the previous day's ATI data daily at `06:30`. Secrets are not stored in Git: `ATI_API_TOKEN` and `CRON_SECRET` must be configured in the deployment environment.

## Quantity-level Split Procurement

`optimizeSplitProcurement` is now the canonical split optimizer. It evaluates:

1. partial allocation of one RFQ line across multiple offers;
2. supplier stock and order constraints;
3. currency consistency;
4. route capacity;
5. fixed and variable transport costs;
6. physical-origin consolidation of multiple suppliers into one transport run where the route supports it;
7. fallback logistics only as an explicitly risky/unverified case;
8. complete landed cost;
9. Single Source versus Split Procurement economics.

The optimizer uses bounded subset generation and beam pruning rather than unrestricted combinatorial enumeration. It returns ranked complete procurement plans and only marks a plan `recommended=true` when its logistics evidence is verified and no logistics-risk warning is present.

Observed ATI routes can be enabled for preliminary internal economics with `allowObservedRoutes=true`, but those plans retain a logistics-risk warning and cannot be recommended as final procurement decisions.

## Supplier rules

- confirmed supplier/manufacturer may participate in procurement discovery;
- `verify`, `reference`, `historical`, `disabled` entries cannot silently become procurement routes;
- ChZSI and KUMZ remain separate internal layers;
- client never receives supplier/source identifiers;
- market/reference data is evidence, not automatic stock confirmation.

## Verification status

Implemented in code and covered by targeted integration tests for:

- reliability/freshness scoring;
- exact quantity closure;
- partial quantity split;
- single-source versus split landed-cost comparison;
- transport consolidation;
- route capacity;
- unknown stock rejection;
- observed-route risk;
- supplier minimum/maximum/step constraints at the optimizer layer.

The repository environment available in this session does not provide a local clone/runtime for executing Vitest, so test execution is not claimed as passed. GitHub commits were applied successfully; runtime/CI verification remains the next verification action.

## Remaining work

1. Configure ATI API license/token in deployment and run the first live refresh if not already configured.
2. Verify ATI coverage for the four priority lanes; China may require a different logistics benchmark source because ATI city-direction data may not exist.
3. Obtain direct/contract logistics tariffs for priority lanes and mark them `verified`.
4. Complete Margin Engine and minimum acceptable margin constraints.
5. Complete Risk Engine.
6. Complete QA Gate before client quote.
7. Complete Client Quote boundary/output.
