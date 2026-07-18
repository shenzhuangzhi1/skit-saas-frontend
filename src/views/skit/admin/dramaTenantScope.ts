import type { TenantScope } from '@/views/skit/shared/tenantScope'

export interface DramaTenantQueryScope {
  tenantId?: number
}

export interface DramaTenantMutationScope extends DramaTenantQueryScope {
  reason?: string
}

const requireSelectedTenant = (scope: TenantScope) => {
  if (scope.kind === 'all') {
    throw new Error('A platform administrator must select one tenant')
  }
  return scope
}

export const buildDramaQueryScope = (scope: TenantScope): DramaTenantQueryScope => {
  const selected = requireSelectedTenant(scope)
  return selected.kind === 'single' ? { tenantId: selected.targetTenantId } : {}
}

export const buildDramaMutationScope = (
  scope: TenantScope,
  reason: string
): DramaTenantMutationScope => {
  const selected = requireSelectedTenant(scope)
  return selected.kind === 'single' ? { tenantId: selected.targetTenantId, reason } : {}
}
