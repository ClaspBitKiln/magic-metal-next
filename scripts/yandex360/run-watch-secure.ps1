$ErrorActionPreference = 'Stop'
$secureRoot = Join-Path $env:LOCALAPPDATA 'MagicMetalYandex360'
$previous = @{}
$secureValues = @()
$exitCode = 1
try {
    foreach ($service in @('mail', 'disk')) {
        $name = 'YANDEX360_' + $service.ToUpperInvariant() + '_TOKEN'
        $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
        $secure = ConvertTo-SecureString ([IO.File]::ReadAllText((Join-Path $secureRoot ($service + '.token.dpapi'))))
        $secureValues += $secure
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        try { [Environment]::SetEnvironmentVariable($name, [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr), 'Process') }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    }
    & node (Join-Path $secureRoot 'watch.mjs')
    $exitCode = $LASTEXITCODE
} catch { Write-Error 'Watch could not start. Credentials were not logged.' -ErrorAction Continue }
finally {
    foreach ($name in $previous.Keys) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
    foreach ($value in $secureValues) { $value.Dispose() }
}
exit $exitCode
