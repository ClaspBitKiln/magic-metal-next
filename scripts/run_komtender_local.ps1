# Magic Metal — KomTender local runner
$ErrorActionPreference = "Stop"
$repo = (git rev-parse --show-toplevel 2>$null)
if (-not $repo) { throw "Not inside magic-metal-next git repository" }
Set-Location $repo
if (-not $env:KOMTENDER_API_KEY) {
  throw "KOMTENDER_API_KEY is not available in the local process. Do not paste it into this script."
}
$env:PYTHONUNBUFFERED="1"
python scripts/chzsi_komtender_search.py
if ($LASTEXITCODE -ne 0) { throw "KomTender runner failed with exit code $LASTEXITCODE" }
if (-not (Test-Path "artifacts/chzsi_komtender_material_tenders.xlsx")) {
  throw "Runner finished without expected Excel artifact"
}
Write-Host "KOMTENDER_LOCAL_RUNNER=PASS"
Write-Host "ARTIFACT=artifacts/chzsi_komtender_material_tenders.xlsx"
