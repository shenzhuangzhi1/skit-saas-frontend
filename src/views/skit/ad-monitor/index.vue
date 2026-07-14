<template>
  <div class="ad-monitor-page">
    <ContentWrap>
      <div class="page-header">
        <div>
          <div class="page-header__title">
            <h1>广告监控</h1>
            <el-tag type="info">只读事实</el-tag>
          </div>
          <p>监控 Taku 广告验证、平台报表、对账差异和多层分成；本页不提供事实修改或删除。</p>
        </div>
        <div class="page-header__meta">
          <span v-if="overview">数据截至 {{ formatDate(overview.asOf) }}</span>
          <span v-if="overview">账号时区 {{ overview.timezone }}</span>
          <el-button :loading="loading" @click="handleRefresh">
            <Icon icon="ep:refresh" />刷新
          </el-button>
        </div>
      </div>

      <TenantScopeBar v-model="scopeModel" :tenants="tenantOptions" />
      <el-alert
        v-if="tenantOptionsError"
        class="mt-12px"
        :closable="false"
        :title="tenantOptionsError"
        type="warning"
      />

      <el-form :inline="true" :model="filters" class="monitor-filters">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="datetimerange"
            value-format="x"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            class="!w-360px"
          />
        </el-form-item>
        <el-form-item label="广告账号">
          <el-input-number
            v-model="filters.adAccountId"
            :min="1"
            :controls="false"
            clearable
            placeholder="全部账号"
            class="!w-150px"
          />
        </el-form-item>
        <el-form-item label="币种">
          <el-input
            v-model="filters.currency"
            clearable
            maxlength="3"
            placeholder="例如 CNY"
            class="!w-120px"
            @input="normalizeCurrency"
          />
        </el-form-item>
        <el-form-item label="事件状态">
          <el-select
            v-model="filters.reconciliationStatus"
            clearable
            placeholder="全部"
            class="!w-190px"
          >
            <el-option label="展示待奖励" value="IMPRESSION_PENDING_REWARD" />
            <el-option label="预估冻结" value="FROZEN" />
            <el-option label="暂挂" value="SUSPENSE" />
            <el-option label="已对账" value="RECONCILED" />
          </el-select>
        </el-form-item>
        <el-form-item label="报表状态">
          <el-select v-model="filters.reportStatus" clearable placeholder="全部" class="!w-150px">
            <el-option label="已对账" value="RECONCILED" />
            <el-option label="部分对账" value="PARTIAL" />
            <el-option label="暂挂" value="SUSPENSE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" />查询</el-button>
          <el-button @click="resetFilters"><Icon icon="ep:refresh-left" />重置</el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <AsyncState
      :loading="loading"
      :error="pageError"
      :empty="loaded && !overview"
      empty-text="当前范围暂无广告监控数据"
    >
      <template v-if="overview">
        <ContentWrap>
          <div class="section-heading">
            <div>
              <h2>平台健康与数据新鲜度</h2>
              <p>奖励回调以签名有效且处理成功为准；客户端奖励信号不授予收益。</p>
            </div>
            <el-tag :type="healthTagType(overview.platformHealth.status)">
              {{ healthStatusLabel(overview.platformHealth.status) }}
            </el-tag>
          </div>
          <div class="health-grid">
            <article>
              <span>奖励回调成功率</span>
              <strong>{{ formatRate(overview.platformHealth.callbackSuccessRate) }}</strong>
            </article>
            <article>
              <span>最近报表状态</span>
              <strong>{{ reportStatusLabel(overview.platformHealth.reportStatus) }}</strong>
            </article>
            <article>
              <span>未关闭告警</span>
              <strong>{{ overview.platformHealth.openAlertCount }}</strong>
            </article>
            <article>
              <span>最近广告会话</span>
              <strong>{{ freshnessTime(overview.freshness.lastSessionAt) }}</strong>
            </article>
            <article>
              <span>最近签名奖励</span>
              <strong>{{ freshnessTime(overview.freshness.lastSignedRewardAt) }}</strong>
            </article>
            <article>
              <span>最近展示回调</span>
              <strong>{{ freshnessTime(overview.freshness.lastImpressionAt) }}</strong>
            </article>
            <article>
              <span>最近报表成功</span>
              <strong>{{ freshnessTime(overview.freshness.lastReportSuccessAt) }}</strong>
            </article>
          </div>
        </ContentWrap>

        <ContentWrap>
          <div class="section-heading">
            <div>
              <h2>收益状态</h2>
              <p>各币种独立展示，不进行隐式汇率换算或跨币种相加。</p>
            </div>
          </div>
          <OverviewCards :groups="overview.groups" />
        </ContentWrap>

        <ContentWrap>
          <div class="section-heading">
            <div>
              <h2>广告验证漏斗</h2>
              <p>“客户端奖励信号”仅为遥测，“服务端签名奖励”才是权益与收益依据。</p>
            </div>
          </div>
          <div v-if="overview.groups.length" class="currency-panels">
            <section v-for="group in overview.groups" :key="group.currency">
              <h3>{{ group.currency }}</h3>
              <FunnelPanel :group="group" />
            </section>
          </div>
          <div v-else class="empty-panel">当前范围暂无漏斗事实</div>
        </ContentWrap>

        <ContentWrap>
          <div class="section-heading">
            <div>
              <h2>小时 / 日趋势</h2>
              <p>趋势由服务端按账号时区和币种聚合。</p>
            </div>
            <el-radio-group v-model="filters.granularity" @change="handleQuery">
              <el-radio-button value="HOUR">小时</el-radio-button>
              <el-radio-button value="DAY">日</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="timeseries?.groups.length" class="currency-panels">
            <section v-for="series in timeseries.groups" :key="series.currency">
              <h3>{{ series.currency }}</h3>
              <div class="native-table-shell">
                <table class="compact-table">
                  <thead>
                    <tr>
                      <th>时间桶</th>
                      <th>请求</th>
                      <th>展示</th>
                      <th>客户端奖励</th>
                      <th>签名奖励</th>
                      <th>冻结</th>
                      <th>已对账</th>
                      <th>暂挂</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="point in series.items" :key="point.bucketStart">
                      <td>{{ formatDate(point.bucketStart) }}</td>
                      <td>{{ point.requestCount }}</td>
                      <td>{{ point.displayCount }}</td>
                      <td>{{ point.clientRewardCount }}</td>
                      <td>{{ point.verifiedRewardCount }}</td>
                      <td><MoneyText v-bind="money(series.currency, point.frozenRevenue)" /></td>
                      <td>
                        <MoneyText v-bind="money(series.currency, point.reconciledRevenue)" />
                      </td>
                      <td><MoneyText v-bind="money(series.currency, point.suspenseRevenue)" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <div v-else class="empty-panel">当前范围暂无趋势数据</div>
        </ContentWrap>

        <ContentWrap>
          <div class="section-heading">
            <div>
              <h2>不可变广告事件</h2>
              <p>筛选和分页均由服务端执行，详情包含回调验签和分成分录轨迹。</p>
            </div>
            <span v-if="eventPage" class="as-of">截至 {{ formatDate(eventPage.asOf) }}</span>
          </div>
          <EventTable
            :rows="eventPage?.list || []"
            :show-tenant="scopeModel.kind === 'all'"
            @select="openEventDetail"
          />
          <Pagination
            v-if="eventPage"
            v-model:limit="eventPagination.pageSize"
            v-model:page="eventPagination.pageNo"
            :total="eventPage.total"
            @pagination="loadDashboard"
          />
        </ContentWrap>

        <ContentWrap>
          <div class="section-heading">
            <div>
              <h2>平台报表对账</h2>
              <p>暂挂差异不可结算；修订记录追加保存，不覆盖历史。</p>
            </div>
            <span v-if="reconciliationPage" class="as-of">
              截至 {{ formatDate(reconciliationPage.asOf) }}
            </span>
          </div>
          <ReconciliationTable
            :rows="reconciliationPage?.list || []"
            :show-tenant="scopeModel.kind === 'all'"
            @select="openReconciliationDetail"
          />
          <Pagination
            v-if="reconciliationPage"
            v-model:limit="reconciliationPagination.pageSize"
            v-model:page="reconciliationPagination.pageNo"
            :total="reconciliationPage.total"
            @pagination="loadDashboard"
          />
        </ContentWrap>
      </template>
    </AsyncState>

    <EventDetailDrawer
      v-model="eventDrawerOpen"
      :detail="eventDetail"
      :loading="eventDetailLoading"
      :error="eventDetailError"
    />

    <el-drawer v-model="reconciliationDrawerOpen" size="min(820px, 94vw)" title="对账差异详情">
      <AsyncState
        :loading="reconciliationDetailLoading"
        :error="reconciliationDetailError"
        :empty="!reconciliationDetail"
      >
        <div v-if="reconciliationDetail" class="reconciliation-detail">
          <section class="detail-summary">
            <div
              ><span>归属租户</span><strong>租户 {{ reconciliationDetail.tenantId }}</strong></div
            >
            <div
              ><span>报表日期</span><strong>{{ reconciliationDetail.reportDate }}</strong></div
            >
            <div
              ><span>报表时区</span><strong>{{ reconciliationDetail.reportTimezone }}</strong></div
            >
            <div
              ><span>应用 / 广告位</span
              ><strong
                >{{ reconciliationDetail.appId }} / {{ reconciliationDetail.placementId }}</strong
              ></div
            >
            <div
              ><span>Network Firm</span
              ><strong>{{ reconciliationDetail.networkFirmId }}</strong></div
            >
            <div
              ><span>预估</span
              ><strong
                ><MoneyText
                  v-bind="
                    money(reconciliationDetail.currency, reconciliationDetail.estimatedAmount)
                  " /></strong
            ></div>
            <div
              ><span>平台实际</span
              ><strong
                ><MoneyText
                  v-bind="
                    money(reconciliationDetail.currency, reconciliationDetail.actualAmount)
                  " /></strong
            ></div>
            <div
              ><span>差异</span
              ><strong
                ><MoneyText
                  v-bind="
                    money(reconciliationDetail.currency, reconciliationDetail.differenceAmount)
                  " /></strong
            ></div>
            <div
              ><span>状态</span
              ><strong>{{ reconciliationStatusLabel(reconciliationDetail.status) }}</strong></div
            >
          </section>

          <section>
            <h3>报表拉取</h3>
            <div v-if="!reconciliationDetail.reportPulls.length" class="empty-panel"
              >暂无拉取记录</div
            >
            <div v-else class="trace-cards">
              <article v-for="pull in reconciliationDetail.reportPulls" :key="pull.id">
                <div
                  ><strong>#{{ pull.id }} {{ pull.status }}</strong
                  ><span>{{ freshnessTime(pull.pulledAt) }}</span></div
                >
                <small>{{ formatDate(pull.rangeStart) }} 至 {{ formatDate(pull.rangeEnd) }}</small>
                <small v-if="pull.errorCode" class="danger-text">{{ pull.errorCode }}</small>
              </article>
            </div>
          </section>

          <section>
            <h3>未匹配事件</h3>
            <div v-if="!reconciliationDetail.unmatchedItems.length" class="empty-panel"
              >无未匹配事件</div
            >
            <div v-else class="trace-cards">
              <article
                v-for="(item, index) in reconciliationDetail.unmatchedItems"
                :key="item.eventId || index"
              >
                <div
                  ><strong>事件 #{{ item.eventId || '-' }}</strong
                  ><MoneyText v-bind="money(reconciliationDetail.currency, item.estimatedAmount)"
                /></div>
                <small>{{ item.reason }}</small>
                <small>{{ item.providerTransactionId || '-' }}</small>
              </article>
            </div>
          </section>

          <section>
            <h3>追加式修订</h3>
            <div v-if="!reconciliationDetail.revisions.length" class="empty-panel">暂无修订</div>
            <div v-else class="trace-cards">
              <article v-for="revision in reconciliationDetail.revisions" :key="revision.id">
                <div>
                  <strong>修订 #{{ revision.revisionNo }}</strong>
                  <el-tag :type="revision.finalRevision ? 'success' : 'info'">
                    {{ revision.finalRevision ? '最终窗口' : '滚动窗口' }}
                  </el-tag>
                </div>
                <small>
                  目标
                  <MoneyText
                    v-bind="money(reconciliationDetail.currency, revision.targetActualAmount)"
                  />
                  · 未匹配
                  <MoneyText
                    v-bind="money(reconciliationDetail.currency, revision.unmatchedActualAmount)"
                  />
                  · {{ reconciliationStatusLabel(revision.status) }}
                </small>
              </article>
            </div>
          </section>
        </div>
      </AsyncState>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type {
  AdAnalyticsBaseQuery,
  AdAnalyticsOverviewVO,
  AdAnalyticsTimeseriesQuery,
  AdAnalyticsTimeseriesVO,
  AnalyticsGranularity
} from '@/api/skit/analytics'
import * as AnalyticsApi from '@/api/skit/analytics'
import type {
  AdEventDetailVO,
  AdEventPageQuery,
  StablePageResult as EventStablePage,
  AdEventRowVO
} from '@/api/skit/adEvent'
import * as EventApi from '@/api/skit/adEvent'
import type {
  ReconciliationDetailVO,
  ReconciliationPageQuery,
  ReconciliationRowVO,
  StablePageResult as ReconciliationStablePage
} from '@/api/skit/reconciliation'
import * as ReconciliationApi from '@/api/skit/reconciliation'
import * as TenantApi from '@/api/skit/tenant'
import { formatDate } from '@/utils/formatTime'
import AsyncState from '@/views/skit/shared/AsyncState.vue'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import TenantScopeBar from '@/views/skit/shared/TenantScopeBar.vue'
import type { TenantScope, TenantScopeSelection } from '@/views/skit/shared/tenantScope'
import { useTenantScope } from '@/views/skit/shared/useTenantScope'
import EventDetailDrawer from './EventDetailDrawer.vue'
import EventTable from './EventTable.vue'
import FunnelPanel from './FunnelPanel.vue'
import OverviewCards from './OverviewCards.vue'
import ReconciliationTable from './ReconciliationTable.vue'
import {
  buildScopedMonitorParams,
  decimalAmountToMoneyUnits,
  loadAdMonitorSnapshot,
  reportStatusLabel,
  reconciliationStatusLabel,
  resolveStablePageAnchor
} from './monitoringModel'

defineOptions({ name: 'SkitAdMonitor' })

const DAY_MS = 24 * 60 * 60 * 1000
const now = Date.now()
const scopeManager = useTenantScope()
const tenantOptions = ref<Array<{ tenantId: number; name: string }>>([])
const tenantOptionsError = ref('')
const loading = ref(false)
const loaded = ref(false)
const pageError = ref('')
const overview = ref<AdAnalyticsOverviewVO>()
const timeseries = ref<AdAnalyticsTimeseriesVO>()
const eventPage = ref<EventStablePage<AdEventRowVO>>()
const reconciliationPage = ref<ReconciliationStablePage<ReconciliationRowVO>>()
const eventDrawerOpen = ref(false)
const eventDetail = ref<AdEventDetailVO>()
const eventDetailLoading = ref(false)
const eventDetailError = ref('')
const reconciliationDrawerOpen = ref(false)
const reconciliationDetail = ref<ReconciliationDetailVO>()
const reconciliationDetailLoading = ref(false)
const reconciliationDetailError = ref('')

const filters = reactive({
  dateRange: [now - 7 * DAY_MS, now] as number[],
  adAccountId: undefined as number | undefined,
  currency: '',
  reconciliationStatus: '',
  reportStatus: '',
  granularity: 'DAY' as AnalyticsGranularity
})
const eventPagination = reactive({ pageNo: 1, pageSize: 20 })
const reconciliationPagination = reactive({ pageNo: 1, pageSize: 20 })
const eventPageEndAnchor = ref<number>()

const scopeModel = computed<TenantScope>({
  get: () => scopeManager.scope.value,
  set: (value) => {
    const selection: TenantScopeSelection = value.kind === 'all' ? 'all' : value.targetTenantId
    scopeManager.select(selection)
  }
})
const errorText = (cause: unknown) =>
  cause instanceof Error && cause.message ? cause.message : '真实广告监控数据加载失败'

const resetSnapshot = () => {
  overview.value = undefined
  timeseries.value = undefined
  eventPage.value = undefined
  reconciliationPage.value = undefined
}

const queryWindow = () => {
  const [start, end] = filters.dateRange || []
  return {
    requestedEnd: end,
    startTime: start ? formatDate(start) : undefined,
    endTime: end ? formatDate(end) : undefined,
    reportDateStart: start ? formatDate(start, 'YYYY-MM-DD') : undefined,
    reportDateEnd: end ? formatDate(end, 'YYYY-MM-DD') : undefined
  }
}

const loadDashboard = async () => {
  pageError.value = ''
  eventDrawerOpen.value = false
  reconciliationDrawerOpen.value = false
  loading.value = true
  const window = queryWindow()
  const baseInput = {
    adAccountId: filters.adAccountId,
    startTime: window.startTime,
    endTime: window.endTime,
    timezone: 'Asia/Shanghai',
    currency: filters.currency || undefined
  }
  const overviewQuery = buildScopedMonitorParams(scopeModel.value, baseInput)
  const timeseriesQuery = buildScopedMonitorParams(scopeModel.value, {
    ...baseInput,
    granularity: filters.granularity
  })
  const eventsQuery = buildScopedMonitorParams(scopeModel.value, {
    ...baseInput,
    endTime: eventPageEndAnchor.value ? formatDate(eventPageEndAnchor.value) : window.endTime,
    ...eventPagination,
    provider: 'TAKU',
    sourceVerificationStatus: 'UNSIGNED_OBSERVATION',
    reconciliationStatus: filters.reconciliationStatus || undefined
  })
  const reconciliationQuery = buildScopedMonitorParams(scopeModel.value, {
    adAccountId: filters.adAccountId,
    ...reconciliationPagination,
    status: filters.reportStatus || undefined,
    currency: filters.currency || undefined,
    reportDateStart: window.reportDateStart,
    reportDateEnd: window.reportDateEnd,
    timezone: 'Asia/Shanghai'
  })
  try {
    const snapshot = await loadAdMonitorSnapshot(
      {
        overview: (query) => AnalyticsApi.getAdAnalyticsOverview(query as AdAnalyticsBaseQuery),
        timeseries: (query) =>
          AnalyticsApi.getAdAnalyticsTimeseries(query as unknown as AdAnalyticsTimeseriesQuery),
        events: (query) => EventApi.getAdEventPage(query as unknown as AdEventPageQuery),
        reconciliation: (query) =>
          ReconciliationApi.getReconciliationPage(query as unknown as ReconciliationPageQuery)
      },
      {
        overview: overviewQuery,
        timeseries: timeseriesQuery,
        events: eventsQuery,
        reconciliation: reconciliationQuery
      }
    )
    overview.value = snapshot.overview
    timeseries.value = snapshot.timeseries
    eventPage.value = snapshot.events
    reconciliationPage.value = snapshot.reconciliation
    if (eventPageEndAnchor.value === undefined) {
      eventPageEndAnchor.value = resolveStablePageAnchor(window.requestedEnd, snapshot.events.asOf)
    }
  } catch (cause) {
    resetSnapshot()
    pageError.value = errorText(cause)
  } finally {
    loading.value = false
    loaded.value = true
  }
}

const loadTenantOptions = async () => {
  tenantOptionsError.value = ''
  try {
    if (scopeManager.isPlatformAdmin.value) {
      const page = await TenantApi.getTenantAgentPage({ pageNo: 1, pageSize: 100 })
      tenantOptions.value = (page.list || []).map((tenant) => ({
        tenantId: tenant.tenantId,
        name: tenant.name
      }))
    } else {
      const invitation = await TenantApi.getTenantInvitation()
      tenantOptions.value = [{ tenantId: invitation.tenantId, name: invitation.tenantName }]
    }
  } catch (cause) {
    tenantOptions.value = []
    tenantOptionsError.value = `代理商选择列表加载失败：${errorText(cause)}`
  }
}

const handleQuery = () => {
  eventPagination.pageNo = 1
  reconciliationPagination.pageNo = 1
  eventPageEndAnchor.value = undefined
  loadDashboard()
}

const handleRefresh = () => handleQuery()

const resetFilters = () => {
  const resetNow = Date.now()
  filters.dateRange = [resetNow - 7 * DAY_MS, resetNow]
  filters.adAccountId = undefined
  filters.currency = ''
  filters.reconciliationStatus = ''
  filters.reportStatus = ''
  filters.granularity = 'DAY'
  handleQuery()
}

const normalizeCurrency = (value: string) => {
  filters.currency = value
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
}

const detailScope = () =>
  buildScopedMonitorParams(scopeModel.value, {
    timezone: overview.value?.timezone || 'Asia/Shanghai'
  })

const openEventDetail = async (id: number) => {
  eventDrawerOpen.value = true
  eventDetail.value = undefined
  eventDetailError.value = ''
  eventDetailLoading.value = true
  try {
    eventDetail.value = await EventApi.getAdEvent(id, detailScope())
  } catch (cause) {
    eventDetailError.value = errorText(cause)
  } finally {
    eventDetailLoading.value = false
  }
}

const openReconciliationDetail = async (id: number) => {
  reconciliationDrawerOpen.value = true
  reconciliationDetail.value = undefined
  reconciliationDetailError.value = ''
  reconciliationDetailLoading.value = true
  try {
    reconciliationDetail.value = await ReconciliationApi.getReconciliation(id, detailScope())
  } catch (cause) {
    reconciliationDetailError.value = errorText(cause)
  } finally {
    reconciliationDetailLoading.value = false
  }
}

const money = (currency: string, amount: string) => decimalAmountToMoneyUnits(currency, amount)
const freshnessTime = (value?: number | null) => (value ? formatDate(value) : '暂无')
const formatRate = (value: string) => {
  const rate = Number(value)
  return Number.isFinite(rate) ? `${(rate * 100).toFixed(2)}%` : value
}
const healthStatusLabel = (status: string) =>
  ({ HEALTHY: '健康', DEGRADED: '降级', CRITICAL: '严重异常', NO_DATA: '暂无数据' })[status] ||
  status
const healthTagType = (status: string) =>
  ({ HEALTHY: 'success', DEGRADED: 'warning', CRITICAL: 'danger', NO_DATA: 'info' })[status] ||
  'info'
watch(
  () =>
    `${scopeModel.value.kind}:${scopeModel.value.kind === 'single' ? scopeModel.value.targetTenantId : ''}`,
  () => {
    eventPagination.pageNo = 1
    reconciliationPagination.pageNo = 1
    eventPageEndAnchor.value = undefined
    loadDashboard()
  }
)

onMounted(async () => {
  await loadTenantOptions()
  await loadDashboard()
})
</script>

<style scoped>
.ad-monitor-page {
  display: grid;
  gap: 16px;
}

.page-header,
.page-header__title,
.page-header__meta,
.section-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-header {
  align-items: flex-start;
  margin-bottom: 18px;
}

.page-header__title {
  justify-content: flex-start;
}

.page-header h1,
.section-heading h2,
.currency-panels h3,
.reconciliation-detail h3 {
  margin: 0;
}

.page-header p,
.section-heading p {
  margin: 5px 0 0;
  color: var(--el-text-color-secondary);
}

.page-header__meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  justify-content: flex-end;
}

.monitor-filters {
  margin-top: 18px;
  margin-bottom: -18px;
}

.section-heading {
  margin-bottom: 16px;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.health-grid article,
.detail-summary > div {
  display: grid;
  padding: 14px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  gap: 6px;
}

.health-grid span,
.detail-summary span,
.trace-cards small,
.as-of {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.health-grid strong {
  font-size: 17px;
}

.currency-panels,
.reconciliation-detail {
  display: grid;
  gap: 18px;
}

.currency-panels > section {
  display: grid;
  gap: 10px;
}

.native-table-shell {
  overflow-x: auto;
}

.compact-table {
  width: 100%;
  min-width: 920px;
  border-spacing: 0;
}

.compact-table th,
.compact-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.compact-table th {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.empty-panel {
  padding: 26px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.reconciliation-detail section {
  display: grid;
  gap: 10px;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.trace-cards {
  display: grid;
  gap: 8px;
}

.trace-cards article {
  display: grid;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-left: 3px solid var(--el-color-primary);
  gap: 6px;
}

.trace-cards article > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.danger-text {
  color: var(--el-color-danger) !important;
}

@media (width <= 980px) {
  .health-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 560px) {
  .health-grid,
  .detail-summary {
    grid-template-columns: 1fr;
  }
}
</style>
