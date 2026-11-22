[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('mail', 'disk')]
    [string]$Service,
    # For automated browser handoff: pass a variable NAME, never a token argument.
    [string]$FromEnvironment,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$secureRoot = Join-Path $env:LOCALAPPDATA 'MagicMetalYandex360'
$tokenPath = Join-Path $secureRoot ($Service + '.token.dpapi')
$secureToken = $null
$temporaryPath = $null
try {
    if ((Test-Path -LiteralPath $tokenPath) -and -not $Force) {
        throw 'Token already exists. Use -Force only for an intentional replacement.'
    }
    if ($FromEnvironment) {
        $rawToken = [Environment]::GetEnvironmentVariable($FromEnvironment, 'Process')
        if ([string]::IsNullOrWhiteSpace($rawToken) -or $rawToken.Contains("`r") -or $rawToken.Contains("`n")) {
            throw 'The named process environment variable has no valid token.'
        }
        $secureToken = ConvertTo-SecureString -String $rawToken -AsPlainText -Force
        $rawToken = $null
    } else {
        $secureToken = Read-Host ('OAuth token for ' + $Service + ' (hidden input)') -AsSecureString
        if ($secureToken.Length -eq 0) { throw 'Empty token was not saved.' }
    }
    if (-not (Test-Path -LiteralPath $secureRoot)) {
        New-Item -ItemType Directory -Path $secureRoot | Out-Null
    }
    # ACL protects ciphertext/request/result files; DPAPI also binds token to this Windows user.
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetOwner($identity)
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object Security.AccessControl.FileSystemAccessRule(
        $identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'
    )
    $acl.AddAccessRule($rule)
    Set-Acl -LiteralPath $secureRoot -AclObject $acl
    $encrypted = ConvertFrom-SecureString -SecureString $secureToken
    $temporaryPath = Join-Path $secureRoot ([IO.Path]::GetRandomFileName())
    [IO.File]::WriteAllText($temporaryPath, $encrypted, (New-Object Text.UTF8Encoding($false)))
    # Verify DPAPI readback without printing or returning the decrypted token.
    $verified = ConvertTo-SecureString ([IO.File]::ReadAllText($temporaryPath))
    if ($verified.Length -ne $secureToken.Length) { throw 'DPAPI readback verification failed.' }
    $verified.Dispose()
    if (Test-Path -LiteralPath $tokenPath) {
        [IO.File]::Replace($temporaryPath, $tokenPath, $null)
    } else {
        [IO.File]::Move($temporaryPath, $tokenPath)
    }
    $temporaryPath = $null
    Write-Output ('Stored DPAPI token for ' + $Service + '; token contents were not printed.')
} catch {
    # Avoid propagating lower-level exception messages that might include input data.
    Write-Error ('Secure token storage failed for ' + $Service + '. No token contents logged.') -ErrorAction Continue
    exit 1
} finally {
    if ($secureToken) { $secureToken.Dispose() }
    if ($temporaryPath -and (Test-Path -LiteralPath $temporaryPath)) {
        Remove-Item -LiteralPath $temporaryPath -Force
    }
}
