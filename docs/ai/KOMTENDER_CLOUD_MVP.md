# KomTender Cloud MVP

The existing Next.js application is now the server boundary for KomTender. The API key is read only from the server environment.

## Endpoints

- GET /api/komtender/info — quota/connection health check.
- GET /api/komtender/tender/:id — one full tender.
- POST /api/komtender/normalize — deterministic metal normalization.
- POST /api/komtender/collect — protected collector endpoint. Send header x-collector-secret and JSON {"ids":["..."]}; max 20 full cards per run.

## Required server secrets

- KOMTENDER_API_KEY
- KOMTENDER_COLLECTOR_SECRET

Do not use NEXT_PUBLIC_ variables for either secret.

## Architecture

KomTender → server adapter → collector → normalized records → procurement database → analytics/AI.

The collector intentionally starts with an explicit list of tender IDs. This makes the first production smoke test safe and prevents accidental consumption of the daily quota. The next implementation step is persistence and template-driven discovery.
