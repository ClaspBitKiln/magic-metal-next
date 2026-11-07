if ($args -contains '--version') {
    Write-Output 'v24.0.0-offline-test-stub'
    $global:LASTEXITCODE = 0
} elseif ($args -contains '--yes') {
    Add-Content -LiteralPath $env:MM_WRAPPER_EVENTS -Value 'npx-start' -Encoding utf8
    $global:LASTEXITCODE = 0
} else {
    Add-Content -LiteralPath $env:MM_WRAPPER_EVENTS -Value 'local-diagnostic' -Encoding utf8
    $global:LASTEXITCODE = [int]$env:MM_LOCAL_STATUS
}
