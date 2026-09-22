$ErrorActionPreference = 'Stop'

$BridgeRoot = Join-Path $env:LOCALAPPDATA 'MagicMetal\PlaywrightMCP'
$AnthonyProfile = Join-Path $BridgeRoot 'Anthony-Roberts'
$DoQuocAnProfile = Join-Path $BridgeRoot 'Do-Quoc-An'
$Package = '@playwright/mcp@0.0.81'

New-Item -ItemType Directory -Force -Path $AnthonyProfile | Out-Null
New-Item -ItemType Directory -Force -Path $DoQuocAnProfile | Out-Null

function Start-AccountBridge {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Profile,
        [Parameter(Mandatory = $true)][int]$Port
    )

    $Arguments = @(
        '/c', 'npx', '--yes', $Package,
        '--host', '127.0.0.1',
        '--port', $Port,
        '--user-data-dir', $Profile,
        '--allowed-origins', 'https://chatgpt.com',
        '--image-responses', 'omit',
        '--codegen', 'none'
    )

    Start-Process -FilePath 'cmd.exe' -ArgumentList $Arguments -WindowStyle Normal
    Write-Host "$Name bridge: http://127.0.0.1:$Port/mcp"
}

Start-AccountBridge -Name 'Anthony Roberts (Owner)' -Profile $AnthonyProfile -Port 8931
Start-AccountBridge -Name 'Do Quoc An (Editor)' -Profile $DoQuocAnProfile -Port 8932

Write-Host 'Each browser profile must be signed in once. Do not use these profiles for ordinary browsing.'
