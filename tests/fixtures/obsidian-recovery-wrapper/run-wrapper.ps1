[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$WrapperPath)
$ErrorActionPreference = 'Stop'

function global:Get-Command {
    [CmdletBinding()]
    param([string]$Name)
    if ($env:MM_SCENARIO -eq 'missing-node' -and $Name -eq 'node.exe') { return $null }
    if ($Name -in @('node.exe', 'npm.cmd', 'npx.cmd')) {
        return [pscustomobject]@{Source = (Join-Path $PSScriptRoot 'runtime-stub.ps1')}
    }
    throw "Unexpected command lookup in offline test"
}

function global:Get-Process {
    [CmdletBinding()]
    param([string]$Name)
    Add-Content -LiteralPath $env:MM_WRAPPER_EVENTS -Value 'obsidian-process-check' -Encoding utf8
    if ($env:MM_SCENARIO -ne 'start-existing-obsidian') {
        return [pscustomobject]@{Id = 111; ProcessName = 'Obsidian'}
    }
}

function global:Get-CimInstance {
    [CmdletBinding()]
    param([string]$ClassName)
    Add-Content -LiteralPath $env:MM_WRAPPER_EVENTS -Value 'remote-process-check' -Encoding utf8
    if ($env:MM_SCENARIO -eq 'cim-unavailable') { throw 'Mocked CIM access failure' }
    if ($env:MM_SCENARIO -notin @('broker-unavailable', 'start-missing-remote')) {
        return [pscustomobject]@{ProcessId = 222; CommandLine = 'npx @wonderwhy-er/desktop-commander@0.2.51 remote'}
    }
}

function global:Get-ScheduledTask {
    [CmdletBinding()]
    param([string]$TaskName)
    return [pscustomobject]@{State = 'Ready'; TaskName = $TaskName}
}

function global:Get-ScheduledTaskInfo {
    [CmdletBinding()]
    param([Parameter(ValueFromPipeline = $true)]$InputObject)
    process { return [pscustomobject]@{LastTaskResult = 0; LastRunTime = [datetime]'2026-11-07T00:00:00Z'} }
}

function global:Test-NetConnection {
    [CmdletBinding()]
    param([string]$ComputerName, [int]$Port, [string]$InformationLevel)
    Add-Content -LiteralPath $env:MM_WRAPPER_EVENTS -Value 'broker-probe' -Encoding utf8
    return $env:MM_SCENARIO -ne 'broker-unavailable'
}

function global:Start-Process {
    [CmdletBinding()]
    param([string]$FilePath)
    Add-Content -LiteralPath $env:MM_WRAPPER_EVENTS -Value 'obsidian-start' -Encoding utf8
}

function global:Start-Sleep {
    [CmdletBinding()]
    param([int]$Seconds)
    # No real sleeps in the offline flow test.
}

function global:Test-Path {
    [CmdletBinding()]
    param([string]$LiteralPath, [string]$Path, [string]$PathType)
    if ($env:MM_SCENARIO -eq 'missing-helper' -and $LiteralPath -like '*obsidian-recovery.mjs') { return $false }
    Microsoft.PowerShell.Management\Test-Path @PSBoundParameters
}

& $WrapperPath -Action Recover
exit $LASTEXITCODE
