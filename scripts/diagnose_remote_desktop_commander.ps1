[CmdletBinding()]
param(
    [ValidateSet('Diagnose', 'Start')]
    [string]$Action = 'Diagnose'
)

$ErrorActionPreference = 'Stop'
$Package = '@wonderwhy-er/desktop-commander@0.2.51'
$RemoteHostName = 'mcp.desktopcommander.app'

function Write-Section {
    param([Parameter(Mandatory = $true)][string]$Text)
    Write-Host "`n=== $Text ===" -ForegroundColor Cyan
}

Write-Host 'Magic Metal: Remote Desktop Commander safe recovery' -ForegroundColor Green
Write-Host 'This script does not change Windows services, registry, firewall, power settings, startup tasks, or existing application configuration.'

Write-Section 'Runtime'
$Node = Get-Command 'node.exe' -ErrorAction SilentlyContinue
$Npm = Get-Command 'npm.cmd' -ErrorAction SilentlyContinue
$Npx = Get-Command 'npx.cmd' -ErrorAction SilentlyContinue

if (-not $Node -or -not $Npm -or -not $Npx) {
    Write-Host 'Node.js or npx is not available in the current user PATH.' -ForegroundColor Red
    Write-Host 'No changes were made. Install or repair Node.js manually before retrying.'
    exit 2
}

Write-Host "Node: $(& $Node.Source --version) ($($Node.Source))"
Write-Host "npm:  $(& $Npm.Source --version)"
Write-Host "npx:  $($Npx.Source)"

Write-Section 'Existing process'
$Existing = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'desktop-commander.+remote' }

if ($Existing) {
    $Existing | ForEach-Object {
        Write-Host "Remote Device already appears to be running (PID $($_.ProcessId))." -ForegroundColor Yellow
    }
    Write-Host 'The script will not start a duplicate process.'
    exit 0
}

Write-Host 'No active Remote Device process was found.'

Write-Section 'Network reachability'
$Reachable = Test-NetConnection -ComputerName $RemoteHostName -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $Reachable) {
    Write-Host "Cannot reach ${RemoteHostName}:443." -ForegroundColor Red
    Write-Host 'No network or firewall settings were changed. Check the internet connection and retry.'
    exit 3
}

Write-Host "${RemoteHostName}:443 is reachable."

if ($Action -eq 'Diagnose') {
    Write-Section 'Result'
    Write-Host 'The computer is ready for a safe user-session start.' -ForegroundColor Green
    Write-Host 'Run this script with -Action Start, or use start_remote_desktop_commander.cmd.'
    exit 0
}

Write-Section 'Starting official Remote Device'
Write-Host "Command: npx --yes $Package remote"
Write-Host 'Keep this window open. On first run, complete the browser authorization shown by the official client.'
Write-Host 'Press Ctrl+C to stop the Remote Device.'

& $Npx.Source --yes $Package remote
exit $LASTEXITCODE
