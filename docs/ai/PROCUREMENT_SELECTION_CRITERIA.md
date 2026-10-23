# Magic Metal — criteria for the optimal procurement option

## 1. Decision principle

The optimal purchase is **not the lowest advertised price**. It is the procurement route that can actually be executed for the requested specification at the best defensible landed economics, while meeting availability, timing and evidence requirements.

Decision order:

1. Technical qualification.
2. Procurement readiness / evidence.
3. Freshness of price and availability.
4. Landed cost.
5. Availability and lead time.
6. Supplier reliability.
7. Logistics efficiency.
8. Market benchmark as a sanity check.

The system may show a cheaper but non-ready observation, but it must not automatically select it as the procurement winner.

## 2. What was learned from external systems

### Odoo
Odoo's tender/RFQ flow compares alternative vendor RFQs side-by-side and explicitly compares vendor, quantity, unit price, total price and related order information. Its tender workflow supports choosing different vendors for individual product lines. This is useful for Magic Metal because a multi-line RFQ should not be forced into a single-supplier decision. [Odoo documentation](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/purchase/manage_deals/calls_for_tenders.html)

### ERPNext
ERPNext records supplier quotations so multiple supplier prices can be compared over time, and its Supplier Scorecard evaluates dimensions such as response time, delivered quality and delivery timeliness. This supports separating **current offer economics** from **supplier execution history**. [Supplier Quotation](https://docs.frappe.io/erpnext/supplier-quotation) · [Supplier Scorecard](https://docs.frappe.io/erpnext/supplier-scorecard)

### Procurement risk
Current procurement practice increasingly treats supplier disruption as a cost/risk component rather than a separate afterthought. The system therefore keeps risk/freshness/evidence alongside cost rather than selecting by nominal price alone.

## 3. Hard gates for automatic winner

An offer cannot become the automatic winner when:

- price is missing or not numeric;
- availability is explicitly unknown;
- technical match requires unresolved clarification;
- price data is materially stale under the configured freshness policy;
- availability data is materially stale under the configured freshness policy.

Such offers remain visible to the manager and may be used as market observations, but they are not silently treated as executable procurement.

## 4. Scoring model

The current engine combines:

- landed cost — 30%;
- specification match — 20%;
- availability — 15%;
- lead time — 10%;
- supplier reliability — 10%;
- logistics efficiency — 5%;
- benchmark sanity check — 10%.

A second quality layer incorporates supplier history, freshness, evidence and normalized cost. The result is then subjected to the hard readiness gates above.

This deliberately keeps **qualification before optimization**: an apparently cheap but unverified offer cannot win automatically.

## 5. What the model does not yet claim

The MVP does not invent supplier confirmations, stock, logistics tariffs or technical equivalence. A Metalinfo observation remains an observed market signal until verified.

Quantity splitting, consolidated transport and route capacity should be evaluated as a separate procurement-plan layer once reliable quantity and logistics data are available. This avoids pretending that line-level ranking alone solves a multi-supplier RFQ.

## 6. Re-analysis / improvement loop

After each implementation step, review:

- false winners caused by stale or weak evidence;
- nominal-price winners that lose on landed cost;
- suppliers with good historical scores but poor current availability;
- split procurement that becomes more expensive after extra transport runs;
- missing data that should trigger clarification instead of a guess;
- cases where no offer is safely executable.

If the preferred mechanism cannot be implemented with reliable data, select the next-best source/strategy rather than degrading the decision model with assumptions.

## 7. MVP target

For one RFQ line the manager should see:

**exact requirement → real observations → qualified offers → landed cost → ranked options → one defensible recommended procurement option → reasons/risks → manager approval.**

The client never receives supplier names, purchase prices, internal scores, evidence URLs or internal ranking details.
