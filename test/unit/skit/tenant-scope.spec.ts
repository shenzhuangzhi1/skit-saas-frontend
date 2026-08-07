import { describe, expect, it } from 'vitest'
import {
  createTenantScope,
  formatMoneyUnits,
  formatMoneyUnitsRounded,
  groupMoneyByCurrency,
  selectTenantScope,
  tenantScopeQuery
} from '@/views/skit/shared/tenantScope'

describe('tenant management scope', () => {
  it('keeps a tenant admin bound to the original login tenant', () => {
    const own = createTenantScope({ roles: ['tenant_admin'], originalTenantId: 17 })

    expect(own).toMatchObject({ kind: 'own', targetTenantId: 17 })
    expect(() => selectTenantScope(own, 23)).toThrow(/original login tenant/i)
    expect(tenantScopeQuery(own)).toEqual({})
  })

  it('lets a super admin explicitly select one tenant or all tenants', () => {
    const platform = createTenantScope({ roles: ['super_admin'], originalTenantId: 1 })

    expect(selectTenantScope(platform, 23)).toMatchObject({ kind: 'single', targetTenantId: 23 })
    expect(selectTenantScope(platform, 'all')).toMatchObject({ kind: 'all' })
    expect(tenantScopeQuery(selectTenantScope(platform, 23))).toEqual({ tenantId: 23 })
    expect(tenantScopeQuery(selectTenantScope(platform, 'all'))).toEqual({})
  })

  it('rejects unauthorized roles and never forwards caller supplied tenant values', () => {
    expect(() => createTenantScope({ roles: ['member'], originalTenantId: 17 })).toThrow(
      /management role/i
    )
    const own = createTenantScope({
      roles: ['tenant_admin'],
      originalTenantId: 17,
      requestedTenantId: 23
    })
    expect(tenantScopeQuery(own)).toEqual({})
    expect(own.targetTenantId).toBe(17)
  })
})

describe('currency aware totals', () => {
  it('formats integer units without floating point conversion', () => {
    expect(formatMoneyUnits({ currency: 'CNY', amountUnits: 1234, amountScale: 2 })).toBe(
      'CNY 12.34'
    )
    expect(formatMoneyUnits({ currency: 'USD', amountUnits: -5, amountScale: 2 })).toBe('USD -0.05')
  })

  it('groups exact integer units by currency and scale without merging currencies', () => {
    expect(
      groupMoneyByCurrency([
        { currency: 'CNY', amountUnits: 1234, amountScale: 2 },
        { currency: 'USD', amountUnits: 500, amountScale: 2 },
        { currency: 'CNY', amountUnits: 66, amountScale: 2 }
      ])
    ).toEqual([
      { currency: 'CNY', amountUnits: 1300n, amountScale: 2 },
      { currency: 'USD', amountUnits: 500n, amountScale: 2 }
    ])
  })

  it('rejects mixed scales for one currency instead of silently rounding', () => {
    expect(() =>
      groupMoneyByCurrency([
        { currency: 'CNY', amountUnits: 1, amountScale: 2 },
        { currency: 'CNY', amountUnits: 1, amountScale: 4 }
      ])
    ).toThrow(/scale/i)
  })
})

describe('display rounding keeps storage exact', () => {
  it('rounds the real 22-scale CNY estimate to a readable ad value', () => {
    // 0.0340172045180000067358 CNY (fx-converted estimate, 22 decimals)
    expect(
      formatMoneyUnitsRounded(
        { currency: 'CNY', amountUnits: 340172045180000067358n, amountScale: 22 },
        4
      )
    ).toBe('CNY 0.034')
  })

  it('carries into the integer part on half-up', () => {
    expect(
      formatMoneyUnitsRounded({ currency: 'CNY', amountUnits: 99996n, amountScale: 5 }, 4)
    ).toBe('CNY 1')
    expect(
      formatMoneyUnitsRounded({ currency: 'CNY', amountUnits: 99994n, amountScale: 5 }, 4)
    ).toBe('CNY 0.9999')
  })

  it('trims trailing zeros and keeps negative signs', () => {
    expect(
      formatMoneyUnitsRounded({ currency: 'CNY', amountUnits: -3400n, amountScale: 4 }, 4)
    ).toBe('CNY -0.34')
    expect(
      formatMoneyUnitsRounded({ currency: 'USD', amountUnits: 3400n, amountScale: 4 }, 0)
    ).toBe('USD 0')
  })

  it('clamps decimals above the stored scale to the exact value', () => {
    expect(
      formatMoneyUnitsRounded({ currency: 'CNY', amountUnits: 3400n, amountScale: 4 }, 6)
    ).toBe('CNY 0.34')
  })
})
