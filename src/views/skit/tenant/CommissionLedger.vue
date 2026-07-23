<template>
  <ContentWrap>
    <el-alert
      :closable="false"
      class="mb-16px"
      show-icon
      title="分成账本由服务端验奖和广告平台对账生成，只读且不可删除。查询固定同一时间快照，并严格按币种展示。"
      type="info"
    />
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="币种" prop="currency" required>
        <el-input
          v-model="queryParams.currency"
          class="!w-120px"
          maxlength="3"
          placeholder="USD"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="收益会员" prop="beneficiaryMemberId">
        <el-input
          v-model="queryParams.beneficiaryMemberId"
          class="!w-160px"
          clearable
          placeholder="会员编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="广告平台" prop="provider">
        <el-select v-model="queryParams.provider" class="!w-130px" clearable>
          <el-option label="穿山甲" value="PANGLE" />
          <el-option label="Taku" value="TAKU" />
        </el-select>
      </el-form-item>
      <el-form-item label="余额桶" prop="balanceBucket">
        <el-select v-model="queryParams.balanceBucket" class="!w-150px" clearable>
          <el-option label="冻结预估" value="FROZEN" />
          <el-option label="可用结算" value="AVAILABLE" />
          <el-option label="不可结算" value="NON_SETTLEABLE" />
        </el-select>
      </el-form-item>
      <el-form-item label="分录类型" prop="entryType">
        <el-select v-model="queryParams.entryType" class="!w-170px" clearable>
          <el-option label="冻结预估" value="ESTIMATE" />
          <el-option label="释放预估" value="ESTIMATE_RELEASE" />
          <el-option label="正式结算" value="SETTLEMENT" />
          <el-option label="对账调整" value="ADJUSTMENT" />
          <el-option label="历史未验奖" value="LEGACY_ESTIMATE" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <div v-if="asOf && !listError" class="mb-12px text-12px text-[var(--el-text-color-secondary)]">
      固定查询快照：{{ formatUtc8SnapshotDateTime(asOf) }}（{{ timezone }}）
    </div>
    <section
      v-if="listError"
      class="rounded-8px border border-[var(--el-color-danger-light-7)] bg-[var(--el-color-danger-light-9)] p-16px"
      data-testid="commission-ledger-error"
      role="alert"
    >
      <div class="font-600 text-[var(--el-color-danger)]">分成账本加载失败</div>
      <p class="mb-12px mt-6px text-14px text-[var(--el-text-color-secondary)]">
        {{ listError }}
      </p>
      <el-button @click="getList">重新加载</el-button>
    </section>
    <template v-else>
      <LedgerSummary v-if="list.length" class="mb-16px" :rows="summaryRows" />
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" row-key="id">
        <el-table-column align="center" label="分录编号" min-width="100" prop="id" />
        <el-table-column align="center" label="广告事件" min-width="110" prop="eventId" />
        <el-table-column align="center" label="广告用户" min-width="150">
          <template #default="scope">
            <div>{{ scope.row.sourceMemberName || '-' }}</div>
            <el-text size="small" type="info">#{{ scope.row.sourceMemberId }}</el-text>
          </template>
        </el-table-column>
        <el-table-column align="center" label="收益方" min-width="170">
          <template #default="scope">
            <div>{{ beneficiaryLabel(scope.row) }}</div>
            <el-text v-if="scope.row.beneficiaryMemberId" size="small" type="info">
              #{{ scope.row.beneficiaryMemberId }} · {{ levelLabel(scope.row.levelNo) }}
            </el-text>
          </template>
        </el-table-column>
        <el-table-column align="center" label="平台/广告位" min-width="150">
          <template #default="scope">
            <el-tag size="small">{{ scope.row.provider }}</el-tag>
            <div class="mt-4px text-12px">{{ scope.row.placementId || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column align="center" label="分成比例" min-width="105">
          <template #default="scope">{{ formatRate(scope.row.rateBps) }}</template>
        </el-table-column>
        <el-table-column align="center" label="广告收入" min-width="125">
          <template #default="scope">
            <MoneyText
              :amount-scale="scope.row.amountScale"
              :amount-units="scope.row.grossAmountUnits"
              :currency="scope.row.currency"
            />
          </template>
        </el-table-column>
        <el-table-column align="center" label="本次分成" min-width="125">
          <template #default="scope">
            <MoneyText
              :amount-scale="scope.row.amountScale"
              :amount-units="scope.row.amountUnits"
              :currency="scope.row.currency"
            />
          </template>
        </el-table-column>
        <el-table-column align="center" label="不可变状态" min-width="160">
          <template #default="scope">
            <el-tag :type="bucketType(scope.row.balanceBucket)" size="small">
              {{ bucketLabel(scope.row.balanceBucket) }}
            </el-tag>
            <div class="mt-4px text-12px">{{ entryTypeLabel(scope.row.entryType) }}</div>
          </template>
        </el-table-column>
        <el-table-column align="center" label="规则/修订" min-width="110">
          <template #default="scope">
            v{{ scope.row.ruleVersion }} / r{{ scope.row.revisionNo }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="发生时间" min-width="180">
          <template #default="scope">
            {{ formatUtc8SnapshotDateTime(scope.row.occurredAt) }}
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </template>
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import * as TenantApi from '@/api/skit/tenant'
import { requireStablePageResult } from '@/api/skit/tenant/pageIntegrity'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import LedgerSummary from './LedgerSummary.vue'
import { isCommissionLedgerPageRowFor } from './pageRowIntegrity'
import { formatUtc8SnapshotDateTime } from './workspaceModel'

defineOptions({ name: 'SkitTenantCommissionLedger' })

const props = defineProps<{ target: TenantApi.ManagementTenantTarget }>()
const message = useMessage()
const loading = ref(false)
const total = ref(0)
const list = ref<TenantApi.CommissionLedgerVO[]>([])
const listError = ref('')
const asOf = ref<number>()
const timezone = ref<TenantApi.TakuReportTimezone>('UTC+8')
const queryFormRef = ref<FormInstance>()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  beneficiaryMemberId: '',
  provider: undefined as TenantApi.TenantAdProvider | undefined,
  entryType: undefined as TenantApi.CommissionLedgerEntryType | undefined,
  balanceBucket: undefined as TenantApi.CommissionLedgerBalanceBucket | undefined,
  currency: 'USD'
})
let requestId = 0

const targetKey = computed(() => `${props.target.kind}:${props.target.tenantId}`)
const summaryRows = computed(() =>
  list.value.map((row) => ({
    balanceBucket: row.balanceBucket,
    currency: row.currency,
    amountUnits: row.amountUnits,
    amountScale: row.amountScale
  }))
)

const formatRate = (rateBps: number) => `${(rateBps / 100).toFixed(2)}%`
const levelLabel = (levelNo: number) => (levelNo === 0 ? '本人' : `${levelNo} 级上级`)
const beneficiaryLabel = (row: TenantApi.CommissionLedgerVO) =>
  row.beneficiaryType === 'AGENT'
    ? '代理商留存'
    : row.beneficiaryMemberName || `会员 ${row.beneficiaryMemberId || '-'}`
const bucketLabel = (bucket: TenantApi.CommissionLedgerBalanceBucket) =>
  ({ FROZEN: '冻结预估', AVAILABLE: '可用结算', NON_SETTLEABLE: '不可结算' })[bucket]
const bucketType = (bucket: TenantApi.CommissionLedgerBalanceBucket) =>
  bucket === 'AVAILABLE' ? 'success' : bucket === 'FROZEN' ? 'warning' : 'danger'
const entryTypeLabel = (entryType: TenantApi.CommissionLedgerEntryType) =>
  ({
    ESTIMATE: '冻结预估',
    ESTIMATE_RELEASE: '释放预估',
    SETTLEMENT: '正式结算',
    ADJUSTMENT: '对账调整',
    LEGACY_ESTIMATE: '历史未验奖'
  })[entryType]
const errorText = (cause: unknown, fallback: string) =>
  cause instanceof Error && cause.message ? cause.message : fallback

const getList = async () => {
  const normalizedCurrency = queryParams.currency.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
    message.warning('币种必须是三个大写字母')
    return
  }
  const currentRequestId = ++requestId
  const target = { ...props.target }
  const expectedAsOf = asOf.value
  const query = {
    pageNo: queryParams.pageNo,
    pageSize: queryParams.pageSize,
    beneficiaryMemberId: undefined as number | undefined,
    provider: queryParams.provider,
    entryType: queryParams.entryType,
    balanceBucket: queryParams.balanceBucket,
    currency: normalizedCurrency,
    asOf: expectedAsOf ? formatUtc8SnapshotDateTime(expectedAsOf) : undefined,
    timezone: timezone.value
  }
  loading.value = true
  listError.value = ''
  try {
    const memberId = Number(queryParams.beneficiaryMemberId)
    query.beneficiaryMemberId =
      Number.isSafeInteger(memberId) && memberId > 0 ? memberId : undefined
    const data = await TenantApi.getCommissionLedgerPage(target, query)
    if (currentRequestId !== requestId) return
    const verified = requireStablePageResult(
      data,
      '分成账本',
      isCommissionLedgerPageRowFor(target.tenantId),
      {
        tenantId: target.tenantId,
        asOf: expectedAsOf,
        timezone: query.timezone,
        pageNo: query.pageNo,
        pageSize: query.pageSize
      }
    )
    list.value = verified.list
    total.value = verified.total
    asOf.value = verified.asOf
    timezone.value = verified.timezone as TenantApi.TakuReportTimezone
  } catch (cause) {
    if (currentRequestId !== requestId) return
    list.value = []
    total.value = 0
    listError.value = `请稍后重试。${errorText(cause, '服务暂时不可用。')}`
  } finally {
    if (currentRequestId === requestId) loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  asOf.value = undefined
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.currency = 'USD'
  handleQuery()
}

watch(
  targetKey,
  () => {
    requestId++
    queryParams.pageNo = 1
    asOf.value = undefined
    list.value = []
    total.value = 0
    listError.value = ''
    getList()
  },
  { immediate: true }
)
</script>
