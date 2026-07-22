import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/views/skit/tenant/index.vue'), 'utf8')
const commissionSource = readFileSync(
  resolve(process.cwd(), 'src/views/skit/tenant/CommissionRuleEditor.vue'),
  'utf8'
)
const ledgerSource = readFileSync(
  resolve(process.cwd(), 'src/views/skit/tenant/CommissionLedger.vue'),
  'utf8'
)
const membersSource = readFileSync(
  resolve(process.cwd(), 'src/views/skit/tenant/MemberList.vue'),
  'utf8'
)
const adAccessSource = readFileSync(
  resolve(process.cwd(), 'src/views/skit/tenant/AdAccessEditor.vue'),
  'utf8'
)
const reportingSource = readFileSync(
  resolve(process.cwd(), 'src/views/skit/tenant/ReportingEditor.vue'),
  'utf8'
)

describe('single tenant management workspace shell', () => {
  it('places advertising access inside the same agent detail workspace for both admin roles', () => {
    expect(source).toContain('name="ad-access"')
    expect(source).toContain('<AdAccessEditor')
    expect(source).toContain('tenantWorkspaceTarget(false, selfInvitation.tenantId)')
    expect(source).toContain('tenantWorkspaceTarget(true, selectedAgent.tenantId)')
  })

  it('keeps app release platform-only while sharing commission, members, and ledger', () => {
    expect(source.match(/name="reporting"/g)).toHaveLength(2)
    expect(source.match(/name="commission"/g)).toHaveLength(2)
    expect(source.match(/name="members"/g)).toHaveLength(2)
    expect(source.match(/name="ledger"/g)).toHaveLength(2)
    expect(source.match(/name="app-release"/g)).toHaveLength(1)
  })

  it('passes the same role-derived tenant target into every revenue workspace', () => {
    expect(
      source.match(/:target="tenantWorkspaceTarget\(false, selfInvitation\.tenantId\)"/g)
    ).toHaveLength(5)
    expect(
      source.match(/:target="tenantWorkspaceTarget\(true, selectedAgent\.tenantId\)"/g)
    ).toHaveLength(5)
  })

  it('extracts official revenue reporting into a sibling workspace title', () => {
    expect(source).toContain('label="收益报表"')
    expect(source).toContain('<ReportingEditor')
    expect(reportingSource).toContain('getTenantReportingConfiguration')
    expect(reportingSource).toContain('saveTenantReportingConfiguration')
    expect(adAccessSource).not.toContain('Taku 官方报表')
    expect(adAccessSource).not.toContain('saveReporting')
  })

  it('replaces legacy client estimates with versioned server-authoritative management flows', () => {
    expect(commissionSource).toContain('previewCommissionPlan')
    expect(commissionSource).toContain('publishCommissionPlan')
    expect(commissionSource).toContain('expectedVersion')
    expect(commissionSource).toContain('发布原因')
    expect(commissionSource).not.toContain('updateTenantCommissionRules')

    expect(ledgerSource).toContain('getCommissionLedgerPage')
    expect(ledgerSource).toContain('amountUnits')
    expect(ledgerSource).toContain('currency')
    expect(ledgerSource).not.toContain('客户端上报的预估分成')

    expect(membersSource).toContain('getMemberChildren')
    expect(membersSource).toContain('getMemberAncestors')
    expect(membersSource).toContain('getMemberSubtreeSummary')
    expect(membersSource).toContain('<MemberTree')
  })

  it('exposes audited readiness changes and one-time callback credentials', () => {
    expect(adAccessSource).toContain('configureTenantAdCapability')
    expect(adAccessSource).toContain('transitionTenantAdRollout')
    expect(adAccessSource).toContain('rotateTenantCallbackKey')
    expect(adAccessSource).toContain('rotateTenantRewardSecret')
    expect(adAccessSource).toContain('callbackKey')
    expect(adAccessSource).toContain('仅显示一次')
  })

  it('derives network capability management visibility from the shared role helper', () => {
    expect(source).toContain("hasAnyRole(['super_admin'], userStore.getRoles)")
    expect(source).toContain(':roles="userStore.getRoles"')
  })
})
