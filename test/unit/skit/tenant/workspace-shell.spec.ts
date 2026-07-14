import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/views/skit/tenant/index.vue'), 'utf8')

describe('single tenant management workspace shell', () => {
  it('places advertising access inside the same agent detail workspace for both admin roles', () => {
    expect(source).toContain('name="ad-access"')
    expect(source).toContain('<AdAccessEditor')
    expect(source).toContain('tenantWorkspaceTarget(false, selfInvitation.tenantId)')
    expect(source).toContain('tenantWorkspaceTarget(true, selectedAgent.tenantId)')
  })

  it('keeps app release platform-only while sharing commission, members, and ledger', () => {
    expect(source.match(/name="commission"/g)).toHaveLength(2)
    expect(source.match(/name="members"/g)).toHaveLength(2)
    expect(source.match(/name="ledger"/g)).toHaveLength(2)
    expect(source.match(/name="app-release"/g)).toHaveLength(1)
  })
})
