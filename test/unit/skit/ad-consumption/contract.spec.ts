import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createTenantScope } from '@/views/skit/shared/tenantScope'
import * as consumptionModel from '@/views/skit/ad-consumption/consumptionModel'

const readSource = (path: string) => {
  const absolutePath = resolve(process.cwd(), path)
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : ''
}

describe('advertising consumption management contract', () => {
  it('never forwards a caller-supplied tenant id for tenant administrators', () => {
    const scope = createTenantScope({ roles: ['tenant_admin'], originalTenantId: 17 })

    expect(
      consumptionModel.buildScopedConsumptionParams(scope, {
        tenantId: 999,
        pageNo: 2,
        pageSize: 20,
        dramaId: '9223372036854775807',
        episodeNo: 41,
        networkFirmId: 66,
        status: 'REWARD_VERIFIED'
      })
    ).toEqual({
      pageNo: 2,
      pageSize: 20,
      dramaId: '9223372036854775807',
      episodeNo: 41,
      networkFirmId: 66,
      status: 'REWARD_VERIFIED'
    })
  })

  it('exposes a real tenant-scoped summary, page and detail API without mutations', () => {
    const source = readSource('src/api/skit/adConsumption/index.ts')

    expect(source).toContain("url: '/skit/tenant/ad-consumptions/summary'")
    expect(source).toContain("url: '/skit/tenant/ad-consumptions/page'")
    expect(source).toContain("url: '/skit/tenant/ad-consumptions/get'")
    expect(source).toContain('dramaId?: AdConsumptionId')
    expect(source).toContain('episodeNo?: number')
    expect(source).toContain('networkFirmId?: number')
    expect(source).toContain('memberKeyword?: string')
    expect(source).toContain('providerTransactionId?: string')
    expect(source).toContain('sessionCount: number')
    expect(source).toContain('nativeGrantAccessCount: number')
    expect(source).toContain('clientShownCount: number')
    expect(source).toContain('signedVerifiedAndClientObservedCount: number')
    expect(source).toContain('signedVerifiedCount: number')
    expect(source).toContain('entitledCount: number')
    expect(source).toContain('earlyClosedCount: number')
    expect(source).toContain('currencyGroups: AdConsumptionCurrencySummaryVO[]')
    expect(source).toContain('status: AdConsumptionQueryStatus')
    expect(source).toContain('consumptionStatus: AdConsumptionQueryStatus')
    expect(source).toContain('memberMobileMasked?: string | null')
    expect(source).toContain('episodeFrom: number')
    expect(source).toContain('episodeTo: number')
    expect(source).toContain('eventType: AdConsumptionTimelineEventType')
    expect(source).toContain('export type AdConsumptionId = number | string')
    expect(source).not.toContain('Number(row.id)')
    expect(source).not.toMatch(/request\.(post|put|delete)/)
  })

  it('places consumption details under the advertising center without removing monitoring', () => {
    const source = readSource('src/router/modules/remaining.ts')
    const adCenterStart = source.indexOf("name: 'SkitAdCenter'")
    const withdrawStart = source.indexOf("path: 'withdraw'", adCenterStart)
    const route = source.slice(adCenterStart, withdrawStart)

    expect(adCenterStart).toBeGreaterThan(-1)
    expect(route).toContain("title: '广告中心'")
    expect(route).toContain("path: '/skit/ad-record'")
    expect(route).toContain("path: '/skit/ad-consumption'")
    expect(route).toContain("name: 'SkitAdConsumption'")
    expect(route).toContain("roles: ['super_admin', 'tenant_admin']")
    expect(route).toMatch(/import\('@\/views\/skit\/ad-consumption\/index\.vue'\)/)
  })

  it('keeps filters and pagination on the server and never manufactures fallback records', () => {
    const source = readSource('src/views/skit/ad-consumption/index.vue')

    for (const contract of [
      'TenantScopeBar',
      'getAdConsumptionSummary',
      'getAdConsumptionPage',
      'dateRange',
      'dramaId',
      'episodeNo',
      'networkFirmId',
      'memberKeyword',
      'providerTransactionId',
      'Pagination',
      'pageNo',
      'pageSize'
    ]) {
      expect(source).toContain(contract)
    }
    expect(source).toContain('当前筛选范围没有真实广告消费记录')
    expect(source).toContain('仅展示当前登录租户的数据')
    expect(source).toContain('keyword: keyword || undefined')
    expect(source).toContain('pageSize: 50')
    expect(source).toContain('summaryRequestSeq')
    expect(source).toContain('pageRequestSeq')
    expect(source).toContain('detailRequestSeq')
    expect(source).toContain('@change="markDateRangeCustom"')
    expect(source).toContain('const liveWindow = ref(true)')
    expect(source).toContain('const updateLiveWindow = () =>')
    expect(source).toMatch(/const refresh = \(\) => \{\s*updateLiveWindow\(\)/)
    expect(source).not.toMatch(/mock|fallback|buildRows|seed/i)
  })

  it('makes operational value and money authority explicit', () => {
    const summary = readSource('src/views/skit/ad-consumption/ConsumptionSummaryCards.vue')
    const table = readSource('src/views/skit/ad-consumption/ConsumptionTable.vue')

    expect(summary).toContain('广告会话')
    expect(summary).toContain('展示率')
    expect(summary).toContain('收益 Impression 覆盖率')
    expect(summary).toContain('客户端奖励验签成功率')
    expect(summary).toContain('summary.signedVerifiedAndClientObservedCount')
    expect(summary).toContain('权益解锁率')
    expect(summary).toContain('原生授权访问占比')
    expect(summary).toContain('提前关闭率')
    expect(summary).toContain('失败率')
    expect(summary).toContain('预估收益')
    expect(summary).toContain('平台结算收益')
    expect(table).toContain('预估（未结算）')
    expect(table).toContain('平台已结算')
    expect(table).toContain('尚未结算')
  })

  it('translates lifecycle states in the evidence timeline', () => {
    expect(consumptionModel.consumptionTimelineStatusLabel('CREATED')).toBe('已创建')
    expect(consumptionModel.consumptionTimelineStatusLabel('LOADING')).toBe('加载中')
    expect(consumptionModel.consumptionTimelineStatusLabel('SHOWN')).toBe('已展示')
    expect(consumptionModel.consumptionTimelineStatusLabel('CLIENT_REWARDED')).toBe(
      '客户端已观察奖励'
    )
    expect(consumptionModel.consumptionTimelineStatusLabel('CLOSED')).toBe('已关闭')
    expect(consumptionModel.consumptionTimelineStatusLabel('LOAD_EXPIRED')).toBe('加载已过期')
    expect(consumptionModel.consumptionTimelineStatusLabel('EXPIRED')).toBe('已过期')
    expect(consumptionModel.consumptionTimelineStatusLabel('REVOKED')).toBe('已撤销')
  })

  it('shows an evidence timeline without claiming that player authorization opened playback', () => {
    const source = readSource('src/views/skit/ad-consumption/ConsumptionDetailDrawer.vue')

    for (const stage of [
      'SESSION_CREATED',
      'LOAD_STARTED',
      'SHOWN',
      'CLOSED',
      'REWARD_OBSERVED',
      'REWARD_VERIFIED',
      'ENTITLEMENT_GRANTED',
      'NATIVE_GRANT_REFERENCED',
      'NATIVE_GRANT_USED'
    ]) {
      expect(source).toContain(stage)
    }
    expect(source).toContain('已引用入站授权凭据')
    expect(source).toContain('启动状态未上报')
    expect(source).toContain('adsourceId')
    expect(source).toContain('sdkRequestId')
    expect(source).toContain('providerShowId')
    expect(source).not.toContain('广告素材加载完成')
    expect(source).not.toContain('播放器已打开')
  })
})
