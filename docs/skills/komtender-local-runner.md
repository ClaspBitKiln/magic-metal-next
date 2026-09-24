# KomTender Local Runner — Magic Metal

## Purpose
Reliable execution path for real KomTender API tests when the API credential exists only on the local Magic Metal runtime.

## Architecture
ChatGPT/agent -> GitHub code + skill -> local runner -> KomTender API -> Excel artifact.

Use GitHub Actions for code/compile checks. Use the local runner for live KomTender calls when the credential is not available as a GitHub secret.

## Non-negotiable security
- Never put KOMTENDER_API_KEY in source, GitHub files, commit messages, logs, memory, or Obsidian.
- Never print the value. Presence may be reported only as configured/not configured.
- Never ask the user to paste the key during normal testing if an existing local runtime is expected to have it.

## Execution
Run from the repository root:
powershell -ExecutionPolicy Bypass -File scripts/run_komtender_local.ps1

The runner calls:
python scripts/chzsi_komtender_search.py

Expected artifact:
artifacts/chzsi_komtender_material_tenders.xlsx

## Diagnostics
If live execution fails:
1. Confirm repository root.
2. Confirm Python is available.
3. Confirm openpyxl is installed.
4. Confirm KOMTENDER_API_KEY is present (boolean only).
5. Call KomTender /info.
6. Check remaining quota.
7. Call templates.
8. Call the configured template.
9. Fetch full cards.
10. Save a machine-readable status file.
Do not replace a live API result with web search.

## Efficiency rule
Do not send large inline PowerShell/Python payloads through TRIGGERcmd. Keep executable logic in repository files and pass only a short command to the local runner.

## Data quality
The CHZSI search:
- uses the material list from data/chzsi_materials.json;
- scans template pages;
- fetches full cards;
- searches descriptions, customers and positions;
- keeps tenders with at least 72 hours remaining;
- writes Excel with customer, INN, matched materials, positions, quantity, price, region, dates and URL.

## Recovery
If TRIGGERcmd returns "Trigger sent. No result", this is not evidence of KomTender failure. The local command is asynchronous and stdout may not be returned. Verify the artifact/status through the configured project file channel instead.

## Acceptance test
PASS requires:
- actual KomTender API response;
- at least one successful /info call;
- successful template/card retrieval;
- Excel artifact created;
- no API key leakage.
