import { describe, expect, it } from 'vitest'
import {
  buildAdAccountWritePayload,
  buildCommissionPreview,
  buildMemberBreadcrumb,
  groupLedgerAmounts,
  mergeMemberChildren,
  sanitizeAdAccountResponse,
  sanitizeReportingConfiguration,
  validateCommissionDraft
} from '@/views/skit/tenant/workspaceModel'

describe('tenant revenue workspace model', () => {
  it('treats provider credentials as write-only even if a malformed response contains them', () => {
    const form = sanitizeAdAccountResponse({
      pangleUsername: 'pangle-account',
      pangleSecretConfigured: true,
      pangleAppSecret: 'must-not-survive',
      takuAppKeyConfigured: true,
      takuAppKey: 'must-not-survive-either',
      takuSecretConfigured: true,
      takuAppSecret: 'also-secret'
    })

    expect(form.pangleUsername).toBe('pangle-account')
    expect(form.pangleAppSecret).toBe('')
    expect(form.takuAppKey).toBe('')
    expect(form.takuAppSecret).toBe('')
    expect(JSON.stringify(form)).not.toContain('must-not-survive')
  })

  it('only sends newly entered secrets and only lets platform admins target a tenant', () => {
    const base = sanitizeAdAccountResponse({
      pangleEnabled: false,
      takuEnabled: true,
      takuAppKeyConfigured: true
    })

    expect(buildAdAccountWritePayload(base, { kind: 'own', tenantId: 17 })).toEqual({
      pangleUsername: '',
      pangleAppId: '',
      panglePlacementId: '',
      pangleEnabled: false,
      takuUsername: '',
      takuAppId: '',
      takuPlacementId: '',
      takuEnabled: true
    })

    expect(
      buildAdAccountWritePayload(
        { ...base, takuAppKey: ' replacement-key ', takuAppSecret: ' replacement-secret ' },
        { kind: 'platform', tenantId: 23 }
      )
    ).toMatchObject({
      tenantId: 23,
      takuAppKey: 'replacement-key',
      takuAppSecret: 'replacement-secret'
    })
  })

  it('never copies a Publisher Key from a reporting configuration response', () => {
    const form = sanitizeReportingConfiguration({
      adAccountId: 9,
      appId: 'taku-app',
      placementId: 'reward-placement',
      reportTimezone: 'UTC+8',
      currency: 'USD',
      amountScale: 8,
      adFormat: 'rewarded_video',
      credentialConfigured: true,
      credentialVersion: 2,
      publisherKey: 'must-never-render'
    })

    expect(form.publisherKey).toBe('')
    expect(form.credentialConfigured).toBe(true)
    expect(JSON.stringify(form)).not.toContain('must-never-render')
  })

  it('supports arbitrary commission levels and makes the agent remainder explicit', () => {
    const draft = [
      { levelNo: 0, rateBps: 5000 },
      { levelNo: 1, rateBps: 1800 },
      { levelNo: 2, rateBps: 700 },
      { levelNo: 8, rateBps: 100 }
    ]

    expect(validateCommissionDraft(draft)).toEqual({ valid: true, error: '' })
    expect(buildCommissionPreview(draft, 10000)).toEqual({
      amountUnits: 10000n,
      memberShares: [
        { levelNo: 0, amountUnits: 5000n },
        { levelNo: 1, amountUnits: 1800n },
        { levelNo: 2, amountUnits: 700n },
        { levelNo: 8, amountUnits: 100n }
      ],
      agentRateBps: 2400,
      agentAmountUnits: 2400n
    })
    expect(validateCommissionDraft([...draft, { levelNo: 8, rateBps: 1 }]).valid).toBe(false)
    expect(validateCommissionDraft([{ levelNo: 0, rateBps: 10001 }]).valid).toBe(false)
  })

  it('keeps ledger buckets and currencies separate with exact integer money', () => {
    expect(
      groupLedgerAmounts([
        { balanceBucket: 'FROZEN', currency: 'CNY', amountUnits: '105', amountScale: 2 },
        { balanceBucket: 'FROZEN', currency: 'CNY', amountUnits: '-5', amountScale: 2 },
        { balanceBucket: 'REVERSAL', currency: 'CNY', amountUnits: '-20', amountScale: 2 },
        { balanceBucket: 'SETTLED', currency: 'USD', amountUnits: '250', amountScale: 2 }
      ])
    ).toEqual([
      {
        balanceBucket: 'FROZEN',
        currency: 'CNY',
        amountUnits: 100n,
        amountScale: 2
      },
      {
        balanceBucket: 'REVERSAL',
        currency: 'CNY',
        amountUnits: -20n,
        amountScale: 2
      },
      {
        balanceBucket: 'SETTLED',
        currency: 'USD',
        amountUnits: 250n,
        amountScale: 2
      }
    ])
  })

  it('merges lazy member pages without loading or duplicating the complete tenant tree', () => {
    const first = mergeMemberChildren(undefined, {
      list: [{ memberId: 8, displayName: '徒弟 A', directChildCount: 2 }],
      nextCursor: 'after-8'
    })
    const second = mergeMemberChildren(first, {
      list: [
        { memberId: 8, displayName: '徒弟 A', directChildCount: 2 },
        { memberId: 9, displayName: '徒弟 B', directChildCount: 0 }
      ]
    })

    expect(first.loaded).toBe(true)
    expect(first.nextCursor).toBe('after-8')
    expect(second.children.map((item) => item.memberId)).toEqual([8, 9])
    expect(second.nextCursor).toBeUndefined()
  })

  it('orders the ancestor path as a root-to-member breadcrumb', () => {
    expect(
      buildMemberBreadcrumb(
        [
          { memberId: 3, displayName: '师傅', distance: 1 },
          { memberId: 1, displayName: '师祖', distance: 2 }
        ],
        { memberId: 7, displayName: '当前用户' }
      ).map((item) => item.displayName)
    ).toEqual(['师祖', '师傅', '当前用户'])
  })
})
