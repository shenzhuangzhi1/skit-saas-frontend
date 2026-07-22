<template>
  <div class="consumption-page">
    <ContentWrap class="hero-card">
      <div class="hero">
        <div>
          <div class="hero__eyebrow">
            <span></span>
            广告中心 · 服务端事实
          </div>
          <h1>广告消费明细</h1>
          <p>
            一个广告会话对应一条记录；失败、提前关闭和未产生收益的会话也会保留，便于定位剧集与广告源差异。
          </p>
        </div>
        <div class="hero__meta">
          <span v-if="page">数据截至 {{ formatDate(page.asOf) }} · {{ page.timezone }}</span>
          <el-button :loading="summaryLoading || pageLoading" @click="refresh">
            <Icon icon="ep:refresh" />刷新真实数据
          </el-button>
        </div>
      </div>

      <div class="scope-panel">
        <TenantScopeBar
          v-model="scopeModel"
          :loading="tenantOptionsLoading"
          remote
          :tenants="tenantOptions"
          @search="loadTenantOptions"
        />
        <p v-if="scopeModel.platformAdmin">
          平台管理员可切换代理商；分页、汇总与详情均由服务端按租户重新校验。
        </p>
        <p v-else>
          仅展示当前登录租户的数据；租户身份来自登录令牌，前端不会传入或覆盖 tenantId。
        </p>
      </div>

      <el-alert
        v-if="tenantOptionsError"
        class="mt-12px"
        :closable="false"
        :title="tenantOptionsError"
        show-icon
        type="warning"
      />

      <el-form label-position="top" :model="filters" class="filter-form" @submit.prevent>
        <div class="filter-grid">
          <el-form-item label="消费时间">
            <el-date-picker
              v-model="filters.dateRange"
              type="datetimerange"
              value-format="x"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              class="filter-control"
              @change="markDateRangeCustom"
            />
          </el-form-item>
          <el-form-item label="剧目 ID">
            <el-input
              v-model="filters.dramaId"
              clearable
              maxlength="128"
              placeholder="全部剧目"
              class="filter-control"
            />
          </el-form-item>
          <el-form-item label="集数">
            <el-input-number
              v-model="filters.episodeNo"
              :min="1"
              :controls="false"
              placeholder="全部集数"
              class="filter-control"
            />
          </el-form-item>
          <el-form-item label="广告平台">
            <el-select
              v-model="filters.provider"
              clearable
              placeholder="全部平台"
              class="filter-control"
            >
              <el-option label="Taku" value="TAKU" />
              <el-option label="穿山甲" value="PANGLE" />
            </el-select>
          </el-form-item>
          <el-form-item label="广告源 Firm ID">
            <el-input-number
              v-model="filters.networkFirmId"
              :min="1"
              :controls="false"
              placeholder="全部广告源"
              class="filter-control"
            />
          </el-form-item>
          <el-form-item label="当前阶段">
            <el-select
              v-model="filters.status"
              clearable
              placeholder="全部阶段"
              class="filter-control"
            >
              <el-option label="会话已创建" value="CREATED" />
              <el-option label="开始加载" value="LOAD_STARTED" />
              <el-option label="客户端已展示" value="SHOWN" />
              <el-option label="已关闭" value="CLOSED" />
              <el-option label="观察到奖励" value="REWARD_OBSERVED" />
              <el-option label="加载已过期" value="LOAD_EXPIRED" />
              <el-option label="签名奖励已验证" value="REWARD_VERIFIED" />
              <el-option label="奖励验证被拒绝" value="REWARD_REJECTED" />
              <el-option label="奖励验证超时" value="VERIFY_TIMEOUT" />
              <el-option label="权益已授予" value="UNLOCKED" />
              <el-option label="失败" value="FAILED" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户">
            <el-input
              v-model="filters.memberKeyword"
              clearable
              maxlength="128"
              placeholder="用户 ID / 脱敏标识"
              class="filter-control"
              @keyup.enter="query"
            />
          </el-form-item>
          <el-form-item label="平台交易 ID">
            <el-input
              v-model="filters.providerTransactionId"
              clearable
              maxlength="128"
              placeholder="精确查询交易"
              class="filter-control"
              @keyup.enter="query"
            />
          </el-form-item>
        </div>
        <div class="filter-actions">
          <el-button type="primary" @click="query"><Icon icon="ep:search" />查询</el-button>
          <el-button @click="resetFilters"><Icon icon="ep:refresh-left" />重置</el-button>
        </div>
      </el-form>
    </ContentWrap>

    <ContentWrap>
      <div class="section-heading">
        <div>
          <h2>消费质量与收益</h2>
          <p>转化率用于排查损耗；预估收益与平台已结算收益始终分开。</p>
        </div>
        <span v-if="summary">共 {{ count(summary.sessionCount) }} 条真实会话</span>
      </div>
      <AsyncState :loading="summaryLoading" :error="summaryError" :empty="false">
        <ConsumptionSummaryCards v-if="summary" :summary="summary" />
        <div v-else-if="!summaryLoading && !summaryError" class="section-state">等待汇总数据</div>
      </AsyncState>
    </ContentWrap>

    <ContentWrap>
      <div class="section-heading">
        <div>
          <h2>逐条消费记录</h2>
          <p>筛选与分页由服务端执行；点击记录查看广告、奖励、权益及授权证据链。</p>
        </div>
        <span v-if="page">{{ count(page.total) }} 条 · 第 {{ page.pageNo }} 页</span>
      </div>

      <div v-if="pageError" class="error-panel" role="alert">
        <el-alert :closable="false" :title="pageError" show-icon type="error" />
        <el-button type="primary" plain @click="loadPage">重新加载</el-button>
      </div>
      <template v-else>
        <ConsumptionTable
          :loading="pageLoading"
          :rows="page?.list || []"
          :show-tenant="scopeModel.kind === 'all'"
          @select="openDetail"
        />
        <div v-if="loaded && !pageLoading && page?.list.length === 0" class="empty-hint">
          当前筛选范围没有真实广告消费记录
        </div>
        <Pagination
          v-if="page"
          v-model:limit="pagination.pageSize"
          v-model:page="pagination.pageNo"
          :total="page.total"
          @pagination="loadPage"
        />
      </template>
    </ContentWrap>

    <ConsumptionDetailDrawer
      v-model="detailOpen"
      :detail="detail"
      :loading="detailLoading"
      :error="detailError"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type {
  AdConsumptionDetailVO,
  AdConsumptionId,
  AdConsumptionPageQuery,
  AdConsumptionPageVO,
  AdConsumptionProvider,
  AdConsumptionQueryStatus,
  AdConsumptionSummaryVO
} from '@/api/skit/adConsumption'
import {
  getAdConsumption,
  getAdConsumptionPage,
  getAdConsumptionSummary
} from '@/api/skit/adConsumption'
import * as TenantApi from '@/api/skit/tenant'
import { formatDate } from '@/utils/formatTime'
import AsyncState from '@/views/skit/shared/AsyncState.vue'
import TenantScopeBar from '@/views/skit/shared/TenantScopeBar.vue'
import type { TenantScope, TenantScopeSelection } from '@/views/skit/shared/tenantScope'
import { useTenantScope } from '@/views/skit/shared/useTenantScope'
import ConsumptionDetailDrawer from './ConsumptionDetailDrawer.vue'
import ConsumptionSummaryCards from './ConsumptionSummaryCards.vue'
import ConsumptionTable from './ConsumptionTable.vue'
import { buildScopedConsumptionParams } from './consumptionModel'

defineOptions({ name: 'SkitAdConsumption' })

const DAY_MS = 24 * 60 * 60 * 1000
const initialNow = Date.now()
const countFormatter = new Intl.NumberFormat('zh-CN')
const scopeManager = useTenantScope()

const tenantOptions = ref<Array<{ tenantId: number; name: string }>>([])
const tenantOptionsError = ref('')
const tenantOptionsLoading = ref(false)
const summary = ref<AdConsumptionSummaryVO>()
const page = ref<AdConsumptionPageVO>()
const summaryLoading = ref(false)
const pageLoading = ref(false)
const loaded = ref(false)
const summaryError = ref('')
const pageError = ref('')
const detailOpen = ref(false)
const detail = ref<AdConsumptionDetailVO>()
const detailLoading = ref(false)
const detailError = ref('')
const liveWindow = ref(true)
let summaryRequestSeq = 0
let pageRequestSeq = 0
let detailRequestSeq = 0
let tenantOptionsRequestSeq = 0

const filters = reactive({
  dateRange: [initialNow - 7 * DAY_MS, initialNow] as number[],
  dramaId: '',
  episodeNo: undefined as number | undefined,
  provider: '' as '' | AdConsumptionProvider,
  networkFirmId: undefined as number | undefined,
  status: '' as '' | AdConsumptionQueryStatus,
  memberKeyword: '',
  providerTransactionId: ''
})

const pagination = reactive({ pageNo: 1, pageSize: 20 })

const scopeModel = computed<TenantScope>({
  get: () => scopeManager.scope.value,
  set: (value) => {
    const selection: TenantScopeSelection = value.kind === 'all' ? 'all' : value.targetTenantId
    scopeManager.select(selection)
  }
})

const count = (value: number) => countFormatter.format(value)
const errorText = (cause: unknown, message: string) =>
  cause instanceof Error && cause.message ? cause.message : message
const scopeKey = () =>
  `${scopeModel.value.kind}:${
    scopeModel.value.kind === 'single' ? scopeModel.value.targetTenantId : 'all'
  }`

const baseQuery = () => {
  const [start, end] = filters.dateRange || []
  return buildScopedConsumptionParams(scopeModel.value, {
    startTime: start ? formatDate(start) : undefined,
    endTime: end ? formatDate(end) : undefined,
    timezone: 'UTC+8',
    dramaId: filters.dramaId.trim() || undefined,
    episodeNo: filters.episodeNo,
    provider: filters.provider || undefined,
    networkFirmId: filters.networkFirmId,
    status: filters.status || undefined,
    memberKeyword: filters.memberKeyword.trim() || undefined,
    providerTransactionId: filters.providerTransactionId.trim() || undefined
  })
}

const loadSummary = async () => {
  const requestSeq = ++summaryRequestSeq
  const requestedScope = scopeKey()
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const result = await getAdConsumptionSummary(baseQuery())
    if (requestSeq !== summaryRequestSeq || requestedScope !== scopeKey()) return
    summary.value = result
  } catch (cause) {
    if (requestSeq !== summaryRequestSeq || requestedScope !== scopeKey()) return
    summary.value = undefined
    summaryError.value = errorText(cause, '真实广告消费汇总加载失败')
  } finally {
    if (requestSeq === summaryRequestSeq) summaryLoading.value = false
  }
}

const loadPage = async () => {
  const requestSeq = ++pageRequestSeq
  const requestedScope = scopeKey()
  pageLoading.value = true
  pageError.value = ''
  detailOpen.value = false
  try {
    const params = {
      ...baseQuery(),
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize
    } as AdConsumptionPageQuery
    const result = await getAdConsumptionPage(params)
    if (requestSeq !== pageRequestSeq || requestedScope !== scopeKey()) return
    page.value = result
  } catch (cause) {
    if (requestSeq !== pageRequestSeq || requestedScope !== scopeKey()) return
    page.value = undefined
    pageError.value = errorText(cause, '真实广告消费记录加载失败')
  } finally {
    if (requestSeq === pageRequestSeq) {
      pageLoading.value = false
      loaded.value = true
    }
  }
}

const loadAll = async () => {
  await Promise.all([loadSummary(), loadPage()])
}

const updateLiveWindow = () => {
  if (!liveWindow.value) return
  const now = Date.now()
  filters.dateRange = [now - 7 * DAY_MS, now]
}

const markDateRangeCustom = () => {
  liveWindow.value = false
}

const query = () => {
  updateLiveWindow()
  pagination.pageNo = 1
  loadAll()
}

const refresh = () => {
  updateLiveWindow()
  return loadAll()
}

const resetFilters = () => {
  const resetNow = Date.now()
  liveWindow.value = true
  filters.dateRange = [resetNow - 7 * DAY_MS, resetNow]
  filters.dramaId = ''
  filters.episodeNo = undefined
  filters.provider = ''
  filters.networkFirmId = undefined
  filters.status = ''
  filters.memberKeyword = ''
  filters.providerTransactionId = ''
  query()
}

const openDetail = async (id: AdConsumptionId) => {
  const requestSeq = ++detailRequestSeq
  const requestedScope = scopeKey()
  detailOpen.value = true
  detail.value = undefined
  detailError.value = ''
  detailLoading.value = true
  try {
    const scope = buildScopedConsumptionParams(scopeModel.value, {
      timezone: page.value?.timezone || 'UTC+8'
    })
    const result = await getAdConsumption(id, scope)
    if (requestSeq !== detailRequestSeq || requestedScope !== scopeKey()) return
    detail.value = result
  } catch (cause) {
    if (requestSeq !== detailRequestSeq || requestedScope !== scopeKey()) return
    detailError.value = errorText(cause, '广告消费证据链加载失败')
  } finally {
    if (requestSeq === detailRequestSeq) detailLoading.value = false
  }
}

const loadTenantOptions = async (keyword = '') => {
  const requestSeq = ++tenantOptionsRequestSeq
  tenantOptionsError.value = ''
  tenantOptionsLoading.value = true
  try {
    if (scopeManager.isPlatformAdmin.value) {
      const tenants = await TenantApi.getTenantAgentPage({
        pageNo: 1,
        pageSize: 50,
        keyword: keyword || undefined
      })
      if (requestSeq !== tenantOptionsRequestSeq) return
      const next = (tenants.list || []).map((tenant) => ({
        tenantId: tenant.tenantId,
        name: tenant.name
      }))
      const selected =
        scopeModel.value.kind === 'single'
          ? tenantOptions.value.find(
              (tenant) => tenant.tenantId === scopeModel.value.targetTenantId
            )
          : undefined
      if (selected && !next.some((tenant) => tenant.tenantId === selected.tenantId)) {
        next.unshift(selected)
      }
      tenantOptions.value = next
    } else {
      const tenant = await TenantApi.getTenantInvitation()
      if (requestSeq !== tenantOptionsRequestSeq) return
      tenantOptions.value = [{ tenantId: tenant.tenantId, name: tenant.tenantName }]
    }
  } catch (cause) {
    if (requestSeq !== tenantOptionsRequestSeq) return
    tenantOptions.value = []
    tenantOptionsError.value = `代理商选择列表加载失败：${errorText(cause, '未知错误')}`
  } finally {
    if (requestSeq === tenantOptionsRequestSeq) tenantOptionsLoading.value = false
  }
}

watch(
  () =>
    `${scopeModel.value.kind}:${scopeModel.value.kind === 'single' ? scopeModel.value.targetTenantId : ''}`,
  () => {
    detailRequestSeq += 1
    detailOpen.value = false
    detail.value = undefined
    query()
  }
)

onMounted(async () => {
  await Promise.all([loadTenantOptions(), loadAll()])
})
</script>

<style scoped lang="scss">
.consumption-page {
  display: grid;
  min-height: calc(100vh - 84px);
  gap: 14px;
}

.hero-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 88% -20%, rgb(99 102 241 / 16%), transparent 35%),
    linear-gradient(145deg, var(--el-bg-color), var(--el-fill-color-light));
  border-color: var(--el-border-color-lighter);
}

.hero,
.hero__meta,
.section-heading,
.filter-actions,
.scope-panel {
  display: flex;
  align-items: center;
}

.hero,
.section-heading,
.scope-panel {
  justify-content: space-between;
  gap: 18px;
}

.hero {
  align-items: flex-start;

  h1 {
    margin: 0;
    font-size: clamp(27px, 3vw, 36px);
    line-height: 1.15;
    letter-spacing: -0.035em;
    color: var(--el-text-color-primary);
  }

  p {
    max-width: 830px;
    margin: 9px 0 0;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }
}

.hero__eyebrow {
  display: flex;
  align-items: center;
  margin-bottom: 7px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--el-color-primary);
  text-transform: uppercase;
  gap: 7px;

  span {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgb(16 185 129 / 12%);
  }
}

.hero__meta {
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  gap: 8px;
}

.scope-panel {
  padding: 12px 14px;
  margin-top: 18px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 12px;

  p {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.filter-form {
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(290px, 1.6fr) repeat(7, minmax(130px, 1fr));
  gap: 0 12px;

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 5px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }
}

.filter-control {
  width: 100% !important;
}

.filter-actions {
  justify-content: flex-end;
  gap: 8px;
}

.section-heading {
  margin-bottom: 15px;

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 18px;
    color: var(--el-text-color-primary);
  }

  p,
  > span {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.section-state,
.empty-hint {
  padding: 30px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.empty-hint {
  padding: 12px 0 0;
  font-size: 12px;
}

.error-panel {
  display: grid;
  justify-items: start;
  gap: 10px;
}

@media (width <= 1500px) {
  .filter-grid {
    grid-template-columns: repeat(4, minmax(150px, 1fr));
  }
}

@media (width <= 900px) {
  .hero,
  .scope-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero__meta {
    align-items: flex-start;
  }

  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 560px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
