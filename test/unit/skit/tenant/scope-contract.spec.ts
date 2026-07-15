import { describe, expect, it } from 'vitest'
import {
  managementTenantBody,
  managementTenantQuery,
  tenantWorkspaceTarget
} from '@/views/skit/tenant/workspaceModel'

describe('tenant workspace request scope', () => {
  it('omits tenantId for the tenant admin bound to the original login tenant', () => {
    expect(managementTenantQuery({ kind: 'own', tenantId: 17 })).toEqual({})
    expect(managementTenantBody({ kind: 'own', tenantId: 17 }, { expectedVersion: 3 })).toEqual({
      expectedVersion: 3
    })
  })

  it('requires the super admin to send one explicitly selected target tenant', () => {
    expect(managementTenantQuery({ kind: 'platform', tenantId: 23 })).toEqual({ tenantId: 23 })
    expect(
      managementTenantBody({ kind: 'platform', tenantId: 23 }, { expectedVersion: 3 })
    ).toEqual({
      tenantId: 23,
      expectedVersion: 3
    })
  })

  it('builds the same role-locked scope for every agent detail tab', () => {
    expect(tenantWorkspaceTarget(false, 17)).toEqual({ kind: 'own', tenantId: 17 })
    expect(tenantWorkspaceTarget(true, 23)).toEqual({ kind: 'platform', tenantId: 23 })
  })
})
