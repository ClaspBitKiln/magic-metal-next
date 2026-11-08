# Offline harness: only scheduled-task cmdlets are mocked; file operations are real.
[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$ScriptPath)
$ErrorActionPreference = 'Stop'

function global:Get-ScheduledTask {
    [CmdletBinding()]
    param([string]$TaskName, [string]$TaskPath)
    if ($TaskPath -ne '\') { throw 'Unexpected task path' }
    if ($env:MM_DISABLE_SCENARIO -eq 'enumeration-failure') { throw 'Mock task enumeration failure' }
    $Tasks = @(Get-Content -LiteralPath $env:MM_DISABLE_STATE -Raw | ConvertFrom-Json)
    if ($TaskName) { return @($Tasks | Where-Object { $_.TaskName -eq $TaskName }) }
    return $Tasks
}

function global:Disable-ScheduledTask {
    [CmdletBinding()]
    param([string]$TaskName, [string]$TaskPath)
    Add-Content -LiteralPath $env:MM_DISABLE_EVENTS -Value $TaskName
    if ($TaskPath -ne '\' -or $TaskName -ne 'MagicMetal Catalog Sync') { throw 'Unexpected task mutation' }
    if ($env:MM_DISABLE_SCENARIO -eq 'disable-failure') { throw 'Mock task disable failure' }
    if ($env:MM_DISABLE_SCENARIO -eq 'disable-no-effect') { return }
    $Tasks = @(Get-Content -LiteralPath $env:MM_DISABLE_STATE -Raw | ConvertFrom-Json)
    foreach ($Task in $Tasks) {
        if ($Task.TaskName -eq $TaskName) { $Task.Settings.Enabled = $false }
    }
    ConvertTo-Json -InputObject $Tasks -Depth 4 | Set-Content -LiteralPath $env:MM_DISABLE_STATE
}

try {
    & $ScriptPath -Apply:($env:MM_DISABLE_APPLY -eq '1')
    exit 0
} catch {
    Write-Output $_.Exception.Message
    exit 1
}
