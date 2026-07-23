import { describe, expect, it } from 'vitest'
import {
  isAgentPageRow,
  isCommissionLedgerPageRowFor,
  isMemberPageRowFor
} from '@/views/skit/tenant/pageRowIntegrity'

const timestamp = 1_753_228_800_000

const agentRow = {
  tenantId: 23,
  tenantCode: 'AG0023',
  rootInviteCode: 'A12345678901',
  name: '华东代理商',
  mobile: '13800000000',
  status: 0,
  expireTime: timestamp,
  pangleEnabled: false,
  pangleSecretConfigured: false,
  takuEnabled: false,
  takuAppKeyConfigured: false
}

const memberRow = {
  id: 7,
  userId: 7,
  tenantId: 23,
  username: '13800000000',
  mobile: '13800000000',
  inviteCode: 'M12345678901',
  level: 2,
  depth: 2,
  status: 0,
  childCount: 3,
  createTime: timestamp
}

const ledgerRow = {
  tenantId: 23,
  id: 7,
  eventId: 9,
  sourceMemberId: 11,
  provider: 'PANGLE',
  placementId: 'rewarded-video',
  beneficiaryType: 'MEMBER',
  beneficiaryMemberId: 11,
  levelNo: 0,
  rateBps: 6000,
  ruleVersion: 3,
  entryType: 'SETTLEMENT',
  balanceBucket: 'AVAILABLE',
  currency: 'USD',
  amountScale: 2,
  grossAmount: '1.00',
  grossAmountUnits: '100',
  amount: '0.60',
  amountUnits: '60',
  revisionNo: 1,
  occurredAt: timestamp,
  createdAt: timestamp
}

describe('tenant page row integrity', () => {
  it('rejects partial agent rows that would otherwise look disabled or unconfigured', () => {
    expect(isAgentPageRow(agentRow)).toBe(true)
    expect(isAgentPageRow({ tenantId: 23, tenantCode: 'AG0023' })).toBe(false)
    expect(isAgentPageRow({ ...agentRow, pangleEnabled: undefined })).toBe(false)
  })

  it('rejects partial and cross-tenant member rows in a concrete tenant workspace', () => {
    expect(isMemberPageRowFor({ kind: 'platform', tenantId: 23 })(memberRow)).toBe(true)
    expect(
      isMemberPageRowFor({ kind: 'platform', tenantId: 23 })({ ...memberRow, tenantId: 24 })
    ).toBe(false)
    expect(isMemberPageRowFor({ kind: 'all' })({ ...memberRow, tenantId: 24 })).toBe(true)
    expect(isMemberPageRowFor({ kind: 'platform', tenantId: 23 })({ id: 7, tenantId: 23 })).toBe(
      false
    )
  })

  it('rejects partial ledger rows and non-epoch response timestamps', () => {
    const guard = isCommissionLedgerPageRowFor(23)
    expect(guard(ledgerRow)).toBe(true)
    expect(guard({ tenantId: 23, id: 7 })).toBe(false)
    expect(guard({ ...ledgerRow, occurredAt: '2025-07-23 08:00:00' })).toBe(false)
    expect(guard({ ...ledgerRow, rateBps: undefined })).toBe(false)
  })
})
