export type ManagementTenantTarget =
  | { kind: 'own'; tenantId: number }
  | { kind: 'platform'; tenantId: number }

const requireTenantId = (tenantId: number): number => {
  if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
    throw new Error('Tenant ID must be a positive safe integer')
  }
  return tenantId
}

export const managementTenantQuery = (
  target: ManagementTenantTarget
): Readonly<{ tenantId?: number }> =>
  target.kind === 'platform' ? { tenantId: requireTenantId(target.tenantId) } : {}

export const managementTenantBody = <T extends object>(
  target: ManagementTenantTarget,
  body: T
): T & { tenantId?: number } =>
  target.kind === 'platform'
    ? ({ tenantId: requireTenantId(target.tenantId), ...body } as T & { tenantId: number })
    : { ...body }
