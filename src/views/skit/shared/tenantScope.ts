export type TenantScopeSelection = number | 'all'

export type TenantScope =
  | {
      kind: 'own'
      platformAdmin: false
      originalTenantId: number
      targetTenantId: number
    }
  | {
      kind: 'all'
      platformAdmin: true
      originalTenantId: number
      targetTenantId?: undefined
    }
  | {
      kind: 'single'
      platformAdmin: true
      originalTenantId: number
      targetTenantId: number
    }

export interface TenantScopeInput {
  roles: readonly string[]
  originalTenantId: number
  requestedTenantId?: number
}

export interface MoneyUnits {
  currency: string
  amountUnits: number | string | bigint
  amountScale: number
}

export interface GroupedMoneyUnits {
  currency: string
  amountUnits: bigint
  amountScale: number
}

const requireTenantId = (value: number): number => {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Tenant ID must be a positive safe integer')
  }
  return value
}

export const createTenantScope = (input: TenantScopeInput): TenantScope => {
  const originalTenantId = requireTenantId(input.originalTenantId)
  if (input.roles.includes('super_admin')) {
    return input.requestedTenantId === undefined
      ? { kind: 'all', platformAdmin: true, originalTenantId }
      : {
          kind: 'single',
          platformAdmin: true,
          originalTenantId,
          targetTenantId: requireTenantId(input.requestedTenantId)
        }
  }
  if (!input.roles.includes('tenant_admin')) {
    throw new Error('A management role is required')
  }
  return {
    kind: 'own',
    platformAdmin: false,
    originalTenantId,
    targetTenantId: originalTenantId
  }
}

export const selectTenantScope = (
  current: TenantScope,
  selection: TenantScopeSelection
): TenantScope => {
  if (!current.platformAdmin) {
    if (selection !== current.originalTenantId) {
      throw new Error('Tenant administrators are bound to the original login tenant')
    }
    return current
  }
  if (selection === 'all') {
    return {
      kind: 'all',
      platformAdmin: true,
      originalTenantId: current.originalTenantId
    }
  }
  return {
    kind: 'single',
    platformAdmin: true,
    originalTenantId: current.originalTenantId,
    targetTenantId: requireTenantId(selection)
  }
}

/** Tenant-admin APIs derive scope from the original token. Only a platform admin may send tenantId. */
export const tenantScopeQuery = (scope: TenantScope): Readonly<{ tenantId?: number }> =>
  scope.kind === 'single' ? { tenantId: scope.targetTenantId } : {}

const exactUnits = (value: MoneyUnits['amountUnits']): bigint => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error('Money units must be an exact integer')
    return BigInt(value)
  }
  if (!/^-?(0|[1-9]\d*)$/.test(value)) throw new Error('Money units must be an exact integer')
  return BigInt(value)
}

export const groupMoneyByCurrency = (items: readonly MoneyUnits[]): GroupedMoneyUnits[] => {
  const groups = new Map<string, GroupedMoneyUnits>()
  for (const item of items) {
    if (!/^[A-Z]{3}$/.test(item.currency)) throw new Error('Currency must be an ISO code')
    if (!Number.isInteger(item.amountScale) || item.amountScale < 0 || item.amountScale > 18) {
      throw new Error('Money scale must be an integer from 0 to 18')
    }
    const existing = groups.get(item.currency)
    if (existing && existing.amountScale !== item.amountScale) {
      throw new Error(`Money scale differs for ${item.currency}`)
    }
    if (existing) {
      existing.amountUnits += exactUnits(item.amountUnits)
    } else {
      groups.set(item.currency, {
        currency: item.currency,
        amountUnits: exactUnits(item.amountUnits),
        amountScale: item.amountScale
      })
    }
  }
  return [...groups.values()].sort((left, right) => left.currency.localeCompare(right.currency))
}

export const formatMoneyUnits = (item: MoneyUnits): string => {
  const exact = groupMoneyByCurrency([item])[0]
  const negative = exact.amountUnits < 0n
  const absolute = negative ? -exact.amountUnits : exact.amountUnits
  if (exact.amountScale === 0) {
    return `${exact.currency} ${negative ? '-' : ''}${absolute}`
  }
  const padded = absolute.toString().padStart(exact.amountScale + 1, '0')
  const integer = padded.slice(0, -exact.amountScale)
  const fraction = padded.slice(-exact.amountScale)
  return `${exact.currency} ${negative ? '-' : ''}${integer}.${fraction}`
}
