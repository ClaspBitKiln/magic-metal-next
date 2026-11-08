if ($args -contains '--version') {
    if ($env:MM_SCENARIO -eq 'old-node') { Write-Output 'v20.19.0' }
    else { Write-Output 'v24.0.0-offline-test-stub' }
    $global:LASTEXITCODE = 0
} elseif ($args -contains '--yes') {
    if ($args -notcontains '@wonderwhy-er/desktop-commander@0.3.1') { throw 'Unexpected Remote version' }
    Add-Content -LiteralPath $env:MM_WRAPPER_EVENTS -Value 'npx-start' -Encoding utf8
    $global:LASTEXITCODE = 0
} else {
    Add-Content -LiteralPath $env:MM_WRAPPER_EVENTS -Value 'local-diagnostic' -Encoding utf8
    $global:LASTEXITCODE = [int]$env:MM_LOCAL_STATUS
}
