<template>
  <ContentWrap>
    <div class="mb-16px flex flex-wrap items-start justify-between gap-16px">
      <div>
        <div class="text-16px font-600">广告分成规则</div>
        <el-text type="info">
          第 0 层是广告用户本人，第 1 层起依次是师傅、师祖。比例以基点保存，100 基点等于
          1%，剩余比例自动作为代理商留存。
        </el-text>
      </div>
      <div class="flex flex-wrap gap-8px">
        <el-button :disabled="readOnly || !workspaceReady || draftLocked" @click="addRule">
          <Icon icon="ep:plus" />新增层级
        </el-button>
        <el-button
          :disabled="!workspaceReady || draftLocked"
          :loading="previewing"
          @click="previewRules"
        >
          精确预览
        </el-button>
        <el-button
          :disabled="readOnly || !workspaceReady || draftLocked"
          :loading="publishing || confirming"
          type="primary"
          @click="publishRules"
        >
          发布新版本
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="readOnly"
      class="mb-16px"
      :closable="false"
      show-icon
      title="代理商已归档，当前规则和历史版本仅供审计查看。"
      type="warning"
    />

    <el-skeleton v-if="loading" :rows="5" animated />
    <section
      v-else-if="loadError"
      class="rounded-8px border border-[var(--el-color-danger-light-7)] bg-[var(--el-color-danger-light-9)] p-20px"
      data-testid="commission-rule-load-error"
      role="alert"
    >
      <div class="text-16px font-600 text-[var(--el-color-danger)]">分成规则加载失败</div>
      <p class="mb-16px mt-6px text-14px text-[var(--el-text-color-secondary)]">
        {{ loadError }}
      </p>
      <el-button type="primary" @click="loadWorkspace">重新加载</el-button>
    </section>
    <template v-else-if="currentPlan">
      <el-descriptions :column="4" border class="mb-16px">
        <el-descriptions-item label="当前版本">v{{ currentPlan.version }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ planStatusLabel }}</el-descriptions-item>
        <el-descriptions-item label="会员合计">
          {{ formatRate(currentPlan.totalMemberRateBps) }}
        </el-descriptions-item>
        <el-descriptions-item label="代理商留存">
          {{ formatRate(currentPlan.agentRateBps) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table :data="rules" row-key="levelNo">
        <el-table-column label="收益层级" min-width="220">
          <template #default="scope">
            <div class="flex items-center gap-12px">
              <el-input-number
                v-model="scope.row.levelNo"
                :disabled="readOnly || draftLocked"
                :min="0"
                :precision="0"
                controls-position="right"
              />
              <el-tag>{{ levelLabel(scope.row.levelNo) }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分成比例（基点）" min-width="260">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.rateBps"
              :disabled="readOnly || draftLocked"
              :max="10000"
              :min="0"
              :precision="0"
              controls-position="right"
            />
            <span class="ml-8px">{{ formatRate(scope.row.rateBps) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="260">
          <template #default="scope">{{ ruleDescription(scope.row.levelNo) }}</template>
        </el-table-column>
        <el-table-column v-if="!readOnly" align="center" label="操作" width="100">
          <template #default="scope">
            <el-button
              v-if="scope.row.levelNo !== 0"
              :disabled="draftLocked"
              link
              type="danger"
              @click="removeRule(scope.$index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-16px grid gap-12px md:grid-cols-4">
        <el-input
          v-model="previewForm.currency"
          :disabled="draftLocked"
          maxlength="3"
          placeholder="币种，如 CNY"
        >
          <template #prepend>币种</template>
        </el-input>
        <el-input-number
          v-model="previewForm.amountUnits"
          :disabled="draftLocked"
          :min="0"
          :precision="0"
          controls-position="right"
          placeholder="请输入金额最小单位"
        />
        <el-input-number
          v-model="previewForm.amountScale"
          :disabled="draftLocked"
          :max="18"
          :min="0"
          :precision="0"
          controls-position="right"
          placeholder="请输入金额精度"
        />
        <el-tag :type="draftValidation.valid ? 'success' : 'danger'" size="large">
          {{
            draftValidation.valid ? `会员合计 ${formatRate(totalRateBps)}` : draftValidation.error
          }}
        </el-tag>
      </div>

      <CommissionPreview
        v-if="preview"
        class="mt-16px rounded border p-16px"
        :agent-amount-units="preview.agentAmountUnits"
        :agent-rate-bps="preview.agentRateBps"
        :amount-scale="preview.amountScale"
        :amount-units="preview.grossAmountUnits"
        :currency="preview.currency"
        :shares="preview.allocations"
      />
      <el-alert
        v-else-if="previewError"
        class="mt-16px"
        :closable="false"
        show-icon
        :title="previewError"
        type="error"
      />

      <el-form v-if="!readOnly" class="mt-16px" label-width="90px">
        <el-form-item label="发布原因" required>
          <el-input
            v-model="reason"
            :disabled="draftLocked"
            maxlength="500"
            minlength="10"
            placeholder="请说明本次比例调整原因（10–500 字）"
            show-word-limit
            type="textarea"
          />
        </el-form-item>
      </el-form>
    </template>
  </ContentWrap>

  <ContentWrap v-if="workspaceReady">
    <div class="mb-12px text-16px font-600">发布历史</div>
    <section
      v-if="historyError"
      class="rounded-8px border border-[var(--el-color-danger-light-7)] bg-[var(--el-color-danger-light-9)] p-16px"
      data-testid="commission-history-error"
      role="alert"
    >
      <div class="font-600 text-[var(--el-color-danger)]">发布历史加载失败</div>
      <p class="mb-12px mt-6px text-14px text-[var(--el-text-color-secondary)]">
        {{ historyError }}
      </p>
      <el-button @click="loadHistory">重新加载历史</el-button>
    </section>
    <template v-else>
      <el-table v-loading="historyLoading" :data="history.list" :show-overflow-tooltip="true">
        <el-table-column align="center" label="版本" min-width="90">
          <template #default="scope">v{{ scope.row.version }}</template>
        </el-table-column>
        <el-table-column align="center" label="状态" min-width="110" prop="status" />
        <el-table-column align="center" label="会员合计" min-width="110">
          <template #default="scope">{{ formatRate(scope.row.totalMemberRateBps) }}</template>
        </el-table-column>
        <el-table-column align="center" label="代理商留存" min-width="120">
          <template #default="scope">{{ formatRate(scope.row.agentRateBps) }}</template>
        </el-table-column>
        <el-table-column align="center" label="层级数" min-width="90">
          <template #default="scope">{{ scope.row.rules.length }}</template>
        </el-table-column>
        <el-table-column align="center" label="发布时间" min-width="180">
          <template #default="scope">
            {{ scope.row.publishedAt ? formatDate(scope.row.publishedAt) : '尚未发布' }}
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        v-model:limit="historyQuery.pageSize"
        v-model:page="historyQuery.pageNo"
        :total="history.total"
        @pagination="loadHistory"
      />
    </template>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as TenantApi from '@/api/skit/tenant'
import { formatDate } from '@/utils/formatTime'
import CommissionPreview from './CommissionPreview.vue'
import { formatUtc8SnapshotDateTime, validateCommissionDraft } from './workspaceModel'

defineOptions({ name: 'SkitTenantCommissionRuleEditor' })

const props = withDefaults(
  defineProps<{ target: TenantApi.ManagementTenantTarget; readOnly?: boolean }>(),
  { readOnly: false }
)
const message = useMessage()
const loading = ref(false)
const historyLoading = ref(false)
const previewing = ref(false)
const confirming = ref(false)
const publishing = ref(false)
const currentPlan = ref<TenantApi.CommissionPlanVO>()
const loadError = ref('')
const historyError = ref('')
const rules = ref<TenantApi.CommissionRuleBpsVO[]>([])
const preview = ref<TenantApi.CommissionPlanPreviewVO>()
const previewError = ref('')
const reason = ref('')
const previewForm = reactive<{
  currency: string
  amountUnits?: number
  amountScale?: number
}>({
  currency: '',
  amountUnits: undefined,
  amountScale: undefined
})
const historyQuery = reactive({ pageNo: 1, pageSize: 10 })
const history = reactive({ list: [] as TenantApi.CommissionPlanVO[], total: 0 })
const historyAsOf = ref<number>()
let requestId = 0
let historyRequestId = 0
let previewRequestId = 0

const targetKey = computed(() => `${props.target.kind}:${props.target.tenantId}`)
const draftLocked = computed(() => confirming.value || publishing.value)
const workspaceReady = computed(
  () => !loading.value && !loadError.value && Boolean(currentPlan.value)
)
const totalRateBps = computed(() =>
  rules.value.reduce((total, rule) => total + Number(rule.rateBps), 0)
)
const draftValidation = computed(() => validateCommissionDraft(rules.value))
const planStatusLabel = computed(() => {
  const status = currentPlan.value?.status
  if (status === 'ACTIVE') return '生效中'
  if (status === 'ARCHIVED') return '已归档'
  return '尚未配置'
})

const formatRate = (rateBps: number) => `${(rateBps / 100).toFixed(2)}%`
const levelLabel = (levelNo: number) => (levelNo === 0 ? '本人' : `${levelNo} 级上级`)
const ruleDescription = (levelNo: number) =>
  levelNo === 0 ? '广告用户本人获得的比例' : `广告用户向上第 ${levelNo} 级邀请人获得的比例`
const errorText = (cause: unknown, fallback: string) =>
  cause instanceof Error && cause.message ? cause.message : fallback
const copyRules = (source: readonly TenantApi.CommissionRuleBpsVO[]) =>
  source.map((rule) => ({ levelNo: rule.levelNo, rateBps: rule.rateBps }))
const rulesSignature = (source: readonly TenantApi.CommissionRuleBpsVO[]) =>
  JSON.stringify(copyRules(source))
const previewDraft = () => ({
  currency: previewForm.currency.trim().toUpperCase(),
  amountUnits: previewForm.amountUnits,
  amountScale: previewForm.amountScale,
  rules: copyRules(rules.value)
})
const previewSignature = (draft = previewDraft()) => JSON.stringify(draft)
const isNonNegativeUnits = (value: unknown): value is string =>
  typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value)
const isNonNegativeAmount = (value: unknown): value is string =>
  typeof value === 'string' && /^(0|[1-9]\d*)(?:\.\d+)?$/.test(value)
const isEpochTimestamp = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0

const assertCommissionPlan = (
  plan: TenantApi.CommissionPlanVO,
  expectedTenantId = props.target.tenantId
) => {
  if (
    typeof plan !== 'object' ||
    plan === null ||
    !Number.isSafeInteger(plan.tenantId) ||
    plan.tenantId <= 0 ||
    plan.tenantId !== expectedTenantId ||
    !isEpochTimestamp(plan.asOf) ||
    !(plan.publishedAt === null || isEpochTimestamp(plan.publishedAt)) ||
    plan.timezone !== 'UTC+8' ||
    !Number.isSafeInteger(plan.version) ||
    plan.version < 0 ||
    !['UNCONFIGURED', 'ACTIVE', 'ARCHIVED'].includes(plan.status) ||
    !Number.isInteger(plan.totalMemberRateBps) ||
    plan.totalMemberRateBps < 0 ||
    plan.totalMemberRateBps > 10000 ||
    !Number.isInteger(plan.agentRateBps) ||
    plan.agentRateBps < 0 ||
    plan.agentRateBps > 10000 ||
    !Array.isArray(plan.rules)
  ) {
    throw new Error('服务端返回的分成规则不完整')
  }
  const ruleValidation = validateCommissionDraft(plan.rules)
  if (
    (plan.status === 'UNCONFIGURED' && plan.rules.length !== 0) ||
    (plan.status !== 'UNCONFIGURED' && !ruleValidation.valid)
  ) {
    throw new Error('服务端返回的分成层级无效')
  }
  const memberRate = plan.rules.reduce((total, rule) => total + rule.rateBps, 0)
  if (
    memberRate !== plan.totalMemberRateBps ||
    plan.agentRateBps !== 10000 - plan.totalMemberRateBps
  ) {
    throw new Error('服务端返回的分成比例不一致')
  }
}

const resetDraft = (plan: TenantApi.CommissionPlanVO) => {
  assertCommissionPlan(plan)
  currentPlan.value = plan
  rules.value = plan.rules.map((rule) => ({
    levelNo: Number(rule.levelNo),
    rateBps: Number(rule.rateBps)
  }))
  preview.value = undefined
  previewError.value = ''
  reason.value = ''
}

const clearWorkspace = () => {
  currentPlan.value = undefined
  rules.value = []
  preview.value = undefined
  previewError.value = ''
  previewing.value = false
  confirming.value = false
  publishing.value = false
  reason.value = ''
  previewForm.currency = ''
  previewForm.amountUnits = undefined
  previewForm.amountScale = undefined
  history.list = []
  history.total = 0
  historyAsOf.value = undefined
  historyError.value = ''
  historyRequestId += 1
  previewRequestId += 1
}

const loadCurrent = async (currentRequestId = requestId) => {
  const plan = await TenantApi.getCommissionPlanCurrent(props.target, 'UTC+8')
  if (currentRequestId !== requestId) return
  resetDraft(plan)
}

const loadHistory = async () => {
  const currentWorkspaceRequestId = requestId
  const currentHistoryRequestId = ++historyRequestId
  const target = { ...props.target }
  const expectedAsOf = historyAsOf.value
  const query = {
    pageNo: historyQuery.pageNo,
    pageSize: historyQuery.pageSize,
    asOf: expectedAsOf ? formatUtc8SnapshotDateTime(expectedAsOf) : undefined,
    timezone: 'UTC+8' as const
  }
  historyLoading.value = true
  historyError.value = ''
  try {
    const data = await TenantApi.getCommissionPlanHistory(target, query)
    if (currentWorkspaceRequestId !== requestId || currentHistoryRequestId !== historyRequestId) {
      return
    }
    if (
      !data ||
      data.tenantId !== target.tenantId ||
      !isEpochTimestamp(data.asOf) ||
      (expectedAsOf !== undefined && data.asOf !== expectedAsOf) ||
      data.timezone !== query.timezone ||
      data.pageNo !== query.pageNo ||
      data.pageSize !== query.pageSize ||
      !Array.isArray(data.list) ||
      !Number.isSafeInteger(data.total) ||
      data.total < 0 ||
      data.total < data.list.length
    ) {
      throw new Error('服务端返回的分成历史不完整')
    }
    data.list.forEach((plan) => assertCommissionPlan(plan, target.tenantId))
    historyAsOf.value = data.asOf
    history.list = data.list
    history.total = data.total
  } catch (cause) {
    if (currentWorkspaceRequestId !== requestId || currentHistoryRequestId !== historyRequestId) {
      return
    }
    history.list = []
    history.total = 0
    historyError.value = `请稍后重试。${errorText(cause, '服务暂时不可用。')}`
  } finally {
    if (currentWorkspaceRequestId === requestId && currentHistoryRequestId === historyRequestId) {
      historyLoading.value = false
    }
  }
}

const loadWorkspace = async () => {
  const currentRequestId = ++requestId
  loading.value = true
  loadError.value = ''
  historyQuery.pageNo = 1
  clearWorkspace()
  try {
    await Promise.all([loadCurrent(currentRequestId), loadHistory()])
  } catch (error) {
    if (currentRequestId !== requestId) return
    requestId += 1
    clearWorkspace()
    loadError.value =
      error instanceof Error && error.message
        ? `请稍后重试。${error.message}`
        : '请稍后重试。服务暂时不可用。'
    loading.value = false
    historyLoading.value = false
  } finally {
    if (currentRequestId === requestId) loading.value = false
  }
}

const addRule = () => {
  if (props.readOnly || !workspaceReady.value || draftLocked.value) return
  const nextLevel = rules.value.length
    ? Math.max(...rules.value.map((item) => item.levelNo)) + 1
    : 0
  rules.value.push({ levelNo: nextLevel, rateBps: 0 })
  preview.value = undefined
  previewError.value = ''
}

const removeRule = (index: number) => {
  if (props.readOnly || draftLocked.value) return
  rules.value.splice(index, 1)
  preview.value = undefined
  previewError.value = ''
}

const validateRules = () => {
  if (!draftValidation.value.valid) {
    message.warning(draftValidation.value.error)
    return false
  }
  return true
}

const validatePreviewInput = () => {
  if (!validateRules()) return false
  if (previewForm.amountUnits === undefined) {
    message.warning('请输入预览金额最小单位')
    return false
  }
  if (!Number.isSafeInteger(previewForm.amountUnits) || previewForm.amountUnits < 0) {
    message.warning('预览金额最小单位必须是非负安全整数')
    return false
  }
  if (
    previewForm.amountScale === undefined ||
    !Number.isInteger(previewForm.amountScale) ||
    previewForm.amountScale < 0 ||
    previewForm.amountScale > 18
  ) {
    message.warning('金额精度必须是 0–18 的整数')
    return false
  }
  if (!/^[A-Z]{3}$/.test(previewForm.currency.trim().toUpperCase())) {
    message.warning('币种必须是三个大写字母')
    return false
  }
  return true
}

function assertCommissionPreview(
  value: unknown,
  expected: {
    amountUnits: number
    amountScale: number
    currency: string
    rules: TenantApi.CommissionRuleBpsVO[]
  }
): asserts value is TenantApi.CommissionPlanPreviewVO {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('服务端返回的分成预览不完整')
  }
  const result = value as Record<string, unknown>
  const memberRateBps = expected.rules.reduce((total, rule) => total + rule.rateBps, 0)
  if (
    result.tenantId !== props.target.tenantId ||
    result.timezone !== 'UTC+8' ||
    result.currency !== expected.currency ||
    result.amountScale !== expected.amountScale ||
    result.grossAmountUnits !== String(expected.amountUnits) ||
    result.totalMemberRateBps !== memberRateBps ||
    result.agentRateBps !== 10000 - memberRateBps ||
    !isEpochTimestamp(result.asOf) ||
    !isNonNegativeAmount(result.grossAmount) ||
    !isNonNegativeAmount(result.memberTotal) ||
    !isNonNegativeAmount(result.agentAmount) ||
    !isNonNegativeUnits(result.memberTotalUnits) ||
    !isNonNegativeUnits(result.agentAmountUnits) ||
    !Array.isArray(result.allocations) ||
    result.allocations.length !== expected.rules.length
  ) {
    throw new Error('服务端返回的分成预览不完整')
  }

  const expectedRules = new Map(expected.rules.map((rule) => [rule.levelNo, rule.rateBps]))
  const grossUnits = BigInt(String(expected.amountUnits))
  let allocationUnits = 0n
  for (const allocation of result.allocations) {
    if (typeof allocation !== 'object' || allocation === null || Array.isArray(allocation)) {
      throw new Error('服务端返回的分成预览层级不完整')
    }
    const row = allocation as Record<string, unknown>
    const expectedRate = Number.isInteger(row.levelNo)
      ? expectedRules.get(row.levelNo as number)
      : undefined
    if (
      expectedRate === undefined ||
      row.rateBps !== expectedRate ||
      !isNonNegativeAmount(row.amount) ||
      !isNonNegativeUnits(row.amountUnits) ||
      BigInt(row.amountUnits) !== (grossUnits * BigInt(expectedRate)) / 10000n
    ) {
      throw new Error('服务端返回的分成预览层级不完整')
    }
    expectedRules.delete(row.levelNo as number)
    allocationUnits += BigInt(row.amountUnits)
  }
  if (
    expectedRules.size ||
    allocationUnits !== BigInt(result.memberTotalUnits) ||
    allocationUnits + BigInt(result.agentAmountUnits) !== grossUnits
  ) {
    throw new Error('服务端返回的分成预览金额不一致')
  }
}

const previewRules = async () => {
  if (!workspaceReady.value || draftLocked.value || !validatePreviewInput()) return
  const currentWorkspaceRequestId = requestId
  const { amountUnits, amountScale } = previewForm
  if (amountUnits === undefined || amountScale === undefined) return
  const draft = previewDraft()
  const draftSignature = previewSignature(draft)
  const currentPreviewRequestId = ++previewRequestId
  const currency = draft.currency
  const ruleSnapshot = draft.rules
  preview.value = undefined
  previewError.value = ''
  previewing.value = true
  try {
    const result = await TenantApi.previewCommissionPlan(props.target, {
      amountUnits,
      amountScale,
      currency,
      timezone: 'UTC+8',
      rules: ruleSnapshot
    })
    if (
      currentWorkspaceRequestId !== requestId ||
      currentPreviewRequestId !== previewRequestId ||
      previewSignature() !== draftSignature
    ) {
      return
    }
    assertCommissionPreview(result, { amountUnits, amountScale, currency, rules: ruleSnapshot })
    preview.value = result
  } catch (cause) {
    if (
      currentWorkspaceRequestId !== requestId ||
      currentPreviewRequestId !== previewRequestId ||
      previewSignature() !== draftSignature
    ) {
      return
    }
    preview.value = undefined
    previewError.value = `分成预览失败，请重试。${errorText(cause, '服务暂时不可用。')}`
  } finally {
    if (currentWorkspaceRequestId === requestId && currentPreviewRequestId === previewRequestId) {
      previewing.value = false
    }
  }
}

const publishRules = async () => {
  if (props.readOnly || draftLocked.value) return
  const plan = currentPlan.value
  if (!workspaceReady.value || !plan || !Number.isSafeInteger(plan.version) || plan.version < 0) {
    message.warning('当前规则版本未加载，无法发布')
    return
  }
  const ruleSnapshot = copyRules(rules.value)
  const validation = validateCommissionDraft(ruleSnapshot)
  if (!validation.valid) {
    message.warning(validation.error)
    return
  }
  const ruleSnapshotSignature = rulesSignature(ruleSnapshot)
  const normalizedReason = reason.value.trim()
  if (normalizedReason.length < 10 || normalizedReason.length > 500) {
    message.warning('发布原因长度必须为 10–500 个字符')
    return
  }
  const currentRequestId = requestId
  const target = { ...props.target }
  confirming.value = true
  try {
    await message.confirm(
      `将基于当前版本 v${plan.version} 发布新规则。历史规则不会被覆盖，确认继续吗？`,
      '发布分成规则'
    )
  } catch {
    return
  } finally {
    if (currentRequestId === requestId) confirming.value = false
  }
  if (currentRequestId !== requestId || !workspaceReady.value || currentPlan.value !== plan) return
  if (rulesSignature(rules.value) !== ruleSnapshotSignature) {
    message.warning('分成规则已变化，请重新确认后发布')
    return
  }
  if (reason.value.trim() !== normalizedReason) {
    message.warning('发布原因已变化，请重新确认后发布')
    return
  }
  publishing.value = true
  try {
    await TenantApi.publishCommissionPlan(target, {
      expectedVersion: plan.version,
      rules: ruleSnapshot,
      reason: normalizedReason
    })
    if (currentRequestId !== requestId) return
    message.success('分成规则新版本已发布')
    await loadWorkspace()
  } finally {
    if (currentRequestId === requestId) publishing.value = false
  }
}

watch(
  previewSignature,
  () => {
    previewRequestId += 1
    preview.value = undefined
    previewError.value = ''
    previewing.value = false
  },
  { flush: 'sync' }
)
watch(targetKey, loadWorkspace, { immediate: true })
</script>
