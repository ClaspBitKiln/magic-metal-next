[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('mail', 'disk')]
    [string]$Service,
    [ValidateSet('tools', 'call')]
    [string]$Command = 'tools',
    # Optional: if supplied, ArgsFile contains just the tool's arguments object.
    # Otherwise ArgsFile must contain the full { name, arguments } request.
    [string]$Tool,
    [string]$ArgsFile,
    [string]$OutputFile,
    [switch]$Write
)

$ErrorActionPreference = 'Stop'
$secureRoot = Join-Path $env:LOCALAPPDATA 'MagicMetalYandex360'
$tokenPath = Join-Path $secureRoot ($Service + '.token.dpapi')
$envName = 'YANDEX360_' + $Service.ToUpperInvariant() + '_TOKEN'
$previousToken = [Environment]::GetEnvironmentVariable($envName, 'Process')
$secureToken = $null
$bstr = [IntPtr]::Zero
$temporaryRequest = $null
$exitCode = 1
try {
    if (-not (Test-Path -LiteralPath $tokenPath)) { throw 'No saved DPAPI token.' }
    if ($Command -eq 'call' -and -not $ArgsFile) { throw 'call requires -ArgsFile.' }
    if ($Command -eq 'tools' -and ($Tool -or $ArgsFile -or $Write)) { throw 'Invalid tools options.' }
    $secureToken = ConvertTo-SecureString ([IO.File]::ReadAllText($tokenPath))
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    [Environment]::SetEnvironmentVariable($envName, [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr), 'Process')
    $nodeArgs = @((Join-Path $PSScriptRoot 'cli.mjs'), $Service, $Command)
    if ($ArgsFile) {
        $resolvedArgsFile = (Resolve-Path -LiteralPath $ArgsFile).Path
        if ($Tool) {
            $arguments = [IO.File]::ReadAllText($resolvedArgsFile) | ConvertFrom-Json
            if ($null -eq $arguments -or $arguments -is [Array] -or $arguments -is [string] -or $arguments -is [ValueType]) {
                throw 'Tool arguments must be a JSON object.'
            }
            $temporaryRequest = Join-Path $secureRoot ([IO.Path]::GetRandomFileName() + '.json')
            $requestJson = @{ name = $Tool; arguments = $arguments } | ConvertTo-Json -Depth 100 -Compress
            [IO.File]::WriteAllText($temporaryRequest, $requestJson, (New-Object Text.UTF8Encoding($false)))
            $resolvedArgsFile = $temporaryRequest
        }
        $nodeArgs += @('--file', $resolvedArgsFile)
    }
    if ($Write) { $nodeArgs += '--write' }
    if ($OutputFile) { $nodeArgs += @('--output', $OutputFile) }
    # Native argument array: no command-string evaluation and no token on command line.
    & node @nodeArgs
    $exitCode = $LASTEXITCODE
} catch {
    Write-Error 'Yandex360 secure runner failed. Check token, JSON request and file permissions; credentials were not logged.' -ErrorAction Continue
    $exitCode = 1
} finally {
    [Environment]::SetEnvironmentVariable($envName, $previousToken, 'Process')
    $previousToken = $null
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if ($secureToken) { $secureToken.Dispose() }
    if ($temporaryRequest -and (Test-Path -LiteralPath $temporaryRequest)) {
        Remove-Item -LiteralPath $temporaryRequest -Force
    }
}
exit $exitCode
