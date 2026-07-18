import { describe, expect, it } from 'vitest'
import { createTenantScope, selectTenantScope } from '@/views/skit/shared/tenantScope'
import { buildDramaMutationScope, buildDramaQueryScope } from '@/views/skit/admin/dramaTenantScope'

describe('drama catalog tenant scope', () => {
  it('requires a platform administrator to select one tenant', () => {
    const scope = createTenantScope({ roles: ['super_admin'], originalTenantId: 1 })

    expect(() => buildDramaQueryScope(scope)).toThrow(/select one tenant/i)
    expect(() => buildDramaMutationScope(scope, '同步穿山甲 SDK 真实剧单')).toThrow(
      /select one tenant/i
    )
  })

  it('forwards the explicitly selected tenant and audited mutation reason', () => {
    const platform = createTenantScope({ roles: ['super_admin'], originalTenantId: 1 })
    const scope = selectTenantScope(platform, 162)

    expect(buildDramaQueryScope(scope)).toEqual({ tenantId: 162 })
    expect(buildDramaMutationScope(scope, '同步穿山甲 SDK 真实剧单')).toEqual({
      tenantId: 162,
      reason: '同步穿山甲 SDK 真实剧单'
    })
  })

  it('keeps a tenant administrator on the login tenant without a caller supplied tenant id', () => {
    const scope = createTenantScope({ roles: ['tenant_admin'], originalTenantId: 162 })

    expect(buildDramaQueryScope(scope)).toEqual({})
    expect(buildDramaMutationScope(scope, '维护穿山甲短剧目录元数据')).toEqual({})
  })
})
