# Magic Metal — Procurement Engine Architecture

## Purpose
Internal procurement orchestration for converting a customer RFQ into the best verified purchasing route and a client-safe quotation.

## Core principle
The engine optimizes the complete business outcome, not the lowest listed price.

`RFQ → normalize → discover → verify → compare → landed cost → benchmark → rank → approve → quote → learn`

## Domain objects

### RFQ
Customer request and original attachments/text.

### RFQItem
Normalized requirement with extraction confidence and unresolved fields.

### ProductIdentity
Canonical Magic Metal product identity independent of any supplier naming.

### Source
External data channel with explicit role(s): manufacturer, supplier, marketplace, reference, benchmark.

### Supplier
Commercial counterparty through which Magic Metal can actually procure a scoped product family.

### Manufacturer
Actual producer, when known and relevant.

### Offer
A time-stamped procurement proposal from a source/supplier for an RFQ item.

### Benchmark
Independent market-price observation or index. It is not an offer.

### ProcurementDecision
Ranked recommendation with reasons, risk, landed cost and expected margin.

### Quote
Client-facing commercial result that hides internal sources and margin logic.

## State machine

`received → parsed → normalized → sourcing → offers_found → verified → ranked → awaiting_internal_approval → quoted → won/lost → closed`

An item may branch to `clarification_required` or `no_procurement_route`.

## Source priority

1. Magic Metal known stock/history.
2. Confirmed direct manufacturer/commercial portal.
3. Confirmed warehouse supplier.
4. Authorized distributor.
5. Aggregator/marketplace.
6. Specialist sourcing/manual RFQ.
7. Production/custom order.

Priority is not absolute: landed cost, availability, specification fit, deadline and reliability can override source priority.

## Initial source map

### Direct/commercial
- Metallservice — base reference/procurement layer for common market positions.
- MMK Market — official commercial channel.
- NLMK Shop / client portal — official commercial channel.
- Severstal Market — official commercial channel.
- OMK Market — official commercial channel.
- EVRAZ Market — official commercial channel.
- Mechel-Service — commercial distribution channel.
- UralArm — manufacturer/supplier scoped to SDT and pipeline valves.
- CHZSI — manufacturer/supplier for special steels and related products.
- KUMZ — manufacturer/supplier for aluminum, magnesium and related products.

### Aggregators
- E-Metall.
- MC.ru.
- PoiskMetalla.
- HardHub.

### Reference
- 23met.
- Metalline.
- official manufacturer technical documentation.
- GOST/TU and equivalent standards sources.

### Benchmark / market intelligence
- Metalinfo.
- Fastmarkets.
- Argus.
- LME where applicable.

## Connector contract
Every adapter must expose normalized operations conceptually equivalent to:

- `search(criteria)`
- `getOffer(offerRef)`
- `getAvailability(criteria)` where supported
- `getPrice(criteria)` where supported
- `getFreshness()`
- `health()`

Adapters must never leak provider-specific structures into domain logic.

## Offer normalization
Normalize units, currencies, decimal separators, dimensions, grades, standards, stock states, locations and timestamps. Preserve the raw source reference for auditability.

## Matching
Use deterministic matching first:
1. product family;
2. standard;
3. grade;
4. dimensions;
5. quantity/lot;
6. certification requirements.

Then allow controlled semantic matching for alternate names and abbreviations. Technical substitutions require explicit policy and may require human approval.

## Ranking model
Base score can combine:
- landed cost: 25–35%;
- specification match: 15–25%;
- availability: 10–20%;
- lead time: 5–15%;
- supplier reliability: 5–15%;
- logistics: 5–10%;
- documentation/certification: 5–10%;
- benchmark advantage: 5–10%.

Weights are configuration, not hard-coded business truth.

## Supplier reliability
Track historical:
- response rate;
- response speed;
- quote accuracy;
- stock accuracy;
- delivery performance;
- claims/rejections;
- document quality;
- actual completed purchases;
- price variance from quote to invoice;
- region/product specialization.

## Landed cost
At minimum:
`purchase price + supplier-side charges + pickup + freight + handling + customs/export/import costs where applicable + insurance + destination delivery + financing/risk allowance`

Do not hard-code Uzbekistan logistics assumptions into the domain model; use configurable lanes and tariffs.

## Benchmark layer
Benchmark observations are independent of offers. Store:
- benchmark source;
- instrument/index/market;
- product scope;
- region;
- timestamp;
- value/currency/unit;
- methodology if available.

The engine may flag an offer as unusually cheap/expensive relative to benchmark, but must not treat benchmark as a guaranteed executable price.

## Public catalog eligibility
A product may be public only when at least one current procurement route is known and sufficiently reliable. A reference-only match does not qualify.

## Security
No credentials, API keys, supplier passwords or private access tokens in source control. Connector secrets belong to environment/secret management.

## Testing strategy
Unit tests for:
- RFQ parsing fixtures;
- dimension/grade/standard normalization;
- source-role validation;
- offer deduplication;
- exact vs alternative matching;
- ranking;
- landed cost;
- publication eligibility.

Integration tests use fixtures or sandbox endpoints. Live provider access is never required for deterministic unit tests.
