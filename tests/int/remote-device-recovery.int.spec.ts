import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const script = fs.readFileSync(
  path.join(process.cwd(), 'scripts/diagnose_remote_desktop_commander.ps1'),
  'utf8',
)

describe('safe Remote Desktop Commander recovery', () => {
  it('pins the reviewed release and uses the official remote command', () => {
    expect(script).toContain("$Package = '@wonderwhy-er/desktop-commander@0.2.51'")
    expect(script).toContain('& $Npx.Source --yes $Package remote')
  })

  it('does not mutate critical Windows configuration', () => {
    const forbidden = [
      /New-Service/i,
      /Set-Service/i,
      /Register-ScheduledTask/i,
      /schtasks/i,
      /Set-ItemProperty/i,
      /Remove-Item/i,
      /netsh/i,
      /powercfg/i,
      /bcdedit/i,
      /Disable-WindowsOptionalFeature/i,
    ]

    for (const pattern of forbidden) {
      expect(script).not.toMatch(pattern)
    }
  })

  it('checks for an existing device process before starting', () => {
    expect(script).toContain('Get-CimInstance Win32_Process')
    expect(script).toContain("desktop-commander.+remote")
    expect(script).toContain('will not start a duplicate process')
  })
})
