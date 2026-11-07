[CmdletBinding()]
param(
    [ValidateSet('Diagnose', 'Start', 'Recover')]
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

$DiagnosticExit = 0
if ($Action -eq 'Recover') {
    Write-Section 'Existing Obsidian and local API'
    $Obsidian = Get-Process -Name 'Obsidian' -ErrorAction SilentlyContinue
    if (-not $Obsidian) {
        $Candidates = @(
            (Join-Path $env:LOCALAPPDATA 'Obsidian\Obsidian.exe'),
            (Join-Path $env:LOCALAPPDATA 'Programs\Obsidian\Obsidian.exe'),
            (Join-Path $env:ProgramFiles 'Obsidian\Obsidian.exe')
        )
        $Executable = $Candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
        if ($Executable) {
            Start-Process -FilePath $Executable
            Write-Host 'Started the existing Obsidian installation. No vault files or settings changed.'
            Start-Sleep -Seconds 3
        } else {
            Write-Host 'Obsidian is not running and its executable was not found in standard locations.' -ForegroundColor Yellow
        }
    } else {
        Write-Host 'Obsidian is already running; it will not be restarted.'
    }
    Write-Section 'Existing synchronization tasks (read only)'
    foreach ($TaskName in @('MagicMetal Catalog Sync', 'MagicMetal Remote Connection')) {
        try {
            $Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
            $TaskInfo = $Task | Get-ScheduledTaskInfo -ErrorAction Stop
            Write-Host ("Task {0}: state={1}; lastResult={2}; lastRun={3}" -f $TaskName, $Task.State, $TaskInfo.LastTaskResult, $TaskInfo.LastRunTime)
        } catch {
            Write-Host ("Task {0}: unavailable; no replacement was created." -f $TaskName) -ForegroundColor Yellow
        }
    }
    Write-Host 'Task result 0 does not prove that notes were synchronized; content/hash readback is still required.'

    $Diagnostic = Join-Path $PSScriptRoot 'obsidian-recovery.mjs'
    if (Test-Path -LiteralPath $Diagnostic -PathType Leaf) {
        & $Node.Source $Diagnostic
        $DiagnosticExit = $LASTEXITCODE
        if ($DiagnosticExit -ne 0) {
            Write-Host "Local Obsidian diagnostics reported a remaining issue (code $DiagnosticExit). Continuing Remote process check." -ForegroundColor Yellow
        }
    } else {
        $DiagnosticExit = 4
        Write-Host 'The bundled obsidian-recovery.mjs file is missing; local API check was not run.' -ForegroundColor Yellow
    }
}

Write-Section 'Existing process'
try {
    $Existing = Get-CimInstance Win32_Process -ErrorAction Stop |
        Where-Object { $_.CommandLine -match 'desktop-commander.+remote' }
} catch {
    Write-Host 'Cannot inspect existing Remote processes. No new Remote process was started.' -ForegroundColor Yellow
    exit 5
}

if ($Existing) {
    $Existing | ForEach-Object {
        Write-Host "Remote Device already appears to be running (PID $($_.ProcessId))." -ForegroundColor Yellow
    }
    Write-Host 'The script will not start a duplicate process.'
    Write-Host 'A running process alone does not prove ChatGPT tool availability. Keep the current Remote window open.'
    exit $DiagnosticExit
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
$RemoteExit = $LASTEXITCODE
if ($RemoteExit -ne 0) { exit $RemoteExit }
exit $DiagnosticExit
