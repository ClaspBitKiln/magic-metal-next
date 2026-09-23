# Magic Metal Trade Automation

## Purpose

Use this skill for practical tender-to-trade research for Magic Metal.

The objective is simple:

**find a real tender -> identify the exact product -> find where to buy it -> calculate delivery and cost -> estimate sale price and margin -> state the next action.**

Do not build an unnecessarily complex model. Prefer verified facts, a small number of good supplier options, and an actionable result.

## Workflow

### 1. Find relevant tenders

Prioritize tenders where:
- the customer is not MMK;
- the product matches Magic Metal's catalog;
- the customer is an end user / industrial or construction buyer where possible;
- the tender is current or has useful historical value.

Use KomTender API when authenticated access is available. Public pages may be used for discovery and verification.

Never claim API data was obtained unless an actual authenticated response was received.

### 2. Normalize the position

For each relevant position extract:
- product;
- steel grade;
- GOST/TU;
- dimensions;
- quantity;
- unit;
- delivery location;
- deadline.

If a parameter is unknown, mark it unknown. Do not invent it.

### 3. Find suppliers

For every important position search in this order:
1. manufacturer;
2. major distributor / stockist;
3. regional warehouse;
4. alternative producer;
5. import source when economically relevant.

Search by the exact combination of product + grade + size + GOST, not only by the generic product name.

### 4. Find market leaders

Identify several significant manufacturers or suppliers of the exact product.

Use factual labels:
- manufacturer;
- major producer;
- regional supplier;
- stockist;
- specialist producer.

Do not call a company the market leader unless there is reliable evidence for that claim.

### 5. Compare prices

For each serious source record:
- supplier;
- manufacturer status;
- exact product match;
- price;
- VAT;
- price basis;
- date;
- stock / production lead time;
- minimum lot;
- source.

Prefer current, directly verifiable prices.

### 6. Calculate logistics

Calculate delivery from supplier to tender destination.

Normalize to:

**purchase price + delivery = landed cost**

For imports include applicable customs, terminal, broker, certification and other mandatory costs.

Do not mix VAT-inclusive and VAT-exclusive prices without normalization.

### 7. Calculate trade economics

Show:
- landed cost;
- target selling price;
- gross profit per tonne;
- total gross profit;
- margin %.

Use simple scenarios such as 10%, 15%, and 20% when useful.

### 8. Check customer history

For promising customers, find previous relevant procurements.

Record:
- date;
- product;
- quantity/value when available;
- interval between purchases;
- repeated product groups.

Use history to identify a likely monitoring window, not as a guaranteed forecast.

### 9. Final answer

For each opportunity provide:

**CLIENT**
- name / INN
- tender
- deadline
- destination

**PRODUCT**
- exact specification
- quantity

**SUPPLIERS**
- 2–5 serious sources when possible
- manufacturer(s)
- price and evidence

**ECONOMICS**
- purchase
- logistics
- landed cost
- target client price
- profit
- margin

**ACTION**
- what Magic Metal should do next.

## Search depth

Normally find several supplier options.

For a large or strategically important tender, continue deeper:
- exact manufacturer search;
- alternative manufacturer;
- regional supplier;
- warehouse;
- import source;
- logistics comparison.

Stop when additional searching is unlikely to materially change the commercial decision.

## Evidence rules

Every important commercial fact must have a source.

Evidence:
- A = official manufacturer / official price / direct verified source;
- B = established supplier with explicit product evidence;
- C = marketplace/search listing requiring confirmation;
- D = secondary mention.

Never present C/D as confirmed current availability.

Separate:
- FACT;
- SOURCE CLAIM;
- INFERENCE;
- UNKNOWN.

## Priority

Prioritize opportunities with:
- exact product fit;
- meaningful volume/value;
- current deadline;
- repeat customer;
- favorable logistics;
- realistic supplier availability;
- room for Magic Metal margin.

Do not rank opportunities using an opaque score. Explain why an opportunity is commercially interesting.

## Non-negotiable rules

Never invent:
- prices;
- stock;
- quantities;
- suppliers;
- manufacturers;
- winners;
- participants;
- technical equivalence.

A technical alternative is not automatically acceptable.

A low nominal price is not automatically the best source: compare technical compliance and landed cost.

## Core commands

When the user says: «Ищи поставщиков»

run:
tender -> exact specification -> manufacturers -> suppliers -> prices -> logistics -> landed cost -> margin -> action

When the user says: «Ищи глубоко»

also search alternative manufacturers, regional sources, warehouses and imports.

When the user says: «Найди лидеров»

build a concise market map of significant manufacturers and suppliers for the exact product.

When the user says: «Проверь клиента»

analyze the customer's relevant procurement history and recurring demand.

When the user says: «Сделай сделку»

combine:
customer + tender + supplier market + trade economics.
