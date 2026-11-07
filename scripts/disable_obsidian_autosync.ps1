# Disable only the known Magic Metal note-sync triggers; preserve remote access.
# Run on the owner's Windows host. Default: preview. Use -Apply to change.
[CmdletBinding()]
param([switch]$Apply)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -ne 'DESKTOP-BNPIVK2') {
    throw 'Run on the authorized Windows host DESKTOP-BNPIVK2.'
}

# Enumerate successfully before treating a missing task as absent.
$TaskName = 'MagicMetal Catalog Sync'
$Tasks = @(Get-ScheduledTask -TaskPath '\' -ErrorAction Stop |
    Where-Object { $_.TaskName -eq $TaskName })
$Startup = [Environment]::GetFolderPath('Startup')
if ([string]::IsNullOrWhiteSpace($Startup)) { throw 'Startup folder is unavailable.' }
$Links = @('MagicMetal Catalog Sync.lnk', 'MagicMetal Obsidian Sync.lnk')
$Backup = Join-Path $env:LOCALAPPDATA ('MagicMetalObsidianSync\disabled-startup\' + [guid]::NewGuid().ToString())

foreach ($Task in $Tasks) {
    if ($Task.Settings.Enabled) {
        if ($Apply) {
            Disable-ScheduledTask -TaskName $TaskName -TaskPath '\' -ErrorAction Stop | Out-Null
            $After = Get-ScheduledTask -TaskName $TaskName -TaskPath '\' -ErrorAction Stop
            if ($After.Settings.Enabled) { throw 'Scheduled task is still enabled.' }
            Write-Output 'Disabled: MagicMetal Catalog Sync'
        } else { Write-Output 'Would disable: MagicMetal Catalog Sync' }
    } else { Write-Output 'Already disabled: MagicMetal Catalog Sync' }
}
if ($Tasks.Count -eq 0) { Write-Output 'Absent: MagicMetal Catalog Sync' }

foreach ($Name in $Links) {
    $Source = Join-Path $Startup $Name
    if (Test-Path -LiteralPath $Source -PathType Leaf) {
        if ($Apply) {
            New-Item -ItemType Directory -Path $Backup -Force | Out-Null
            $Destination = Join-Path $Backup $Name
            $BeforeHash = (Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash
            Move-Item -LiteralPath $Source -Destination $Destination -ErrorAction Stop
            if ((Test-Path -LiteralPath $Source) -or
                (Get-FileHash -LiteralPath $Destination -Algorithm SHA256).Hash -ne $BeforeHash) {
                throw "Startup backup verification failed: $Name"
            }
            Write-Output "Moved out of Startup, backup verified: $Name"
        } else { Write-Output "Would move out of Startup: $Name" }
    } else { Write-Output "Absent: $Name" }
}

Write-Output 'Remote Connection task and Desktop Commander startup are unchanged.'
Write-Output 'No notes or sync scripts deleted. An already running sync is not interrupted.'
if ($Apply -and (Test-Path -LiteralPath $Backup)) { Write-Output "Startup backup: $Backup" }
Write-Output 'This operation does not verify Obsidian read/write access or complete a stage sync.'
