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
        <el-button :disabled="readOnly || loading" @click="addRule">
          <Icon icon="ep:plus" />新增层级
        </el-button>
        <el-button :disabled="loading" :loading="previewing" @click="previewRules">
          精确预览
        </el-button>
        <el-button
          :disabled="readOnly || loading"
          :loading="publishing"
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
    <template v-else>
      <el-descriptions :column="4" border class="mb-16px">
        <el-descriptions-item label="当前版本"
          >v{{ currentPlan?.version ?? 0 }}</el-descriptions-item
        >
        <el-descriptions-item label="状态">{{ planStatusLabel }}</el-descriptions-item>
        <el-descriptions-item label="会员合计">
          {{ formatRate(currentPlan?.totalMemberRateBps ?? 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="代理商留存">
          {{ formatRate(currentPlan?.agentRateBps ?? 10000) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table :data="rules" row-key="levelNo">
        <el-table-column label="收益层级" min-width="220">
          <template #default="scope">
            <div class="flex items-center gap-12px">
              <el-input-number
                v-model="scope.row.levelNo"
                :disabled="readOnly"
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
              :disabled="readOnly"
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
        <el-input v-model="previewForm.currency" maxlength="3" placeholder="币种，如 CNY">
          <template #prepend>币种</template>
        </el-input>
        <el-input-number
          v-model="previewForm.amountUnits"
          :min="0"
          :precision="0"
          controls-position="right"
        />
        <el-input-number
          v-model="previewForm.amountScale"
          :max="18"
          :min="0"
          :precision="0"
          controls-position="right"
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

      <el-form v-if="!readOnly" class="mt-16px" label-width="90px">
        <el-form-item label="发布原因" required>
          <el-input
            v-model="reason"
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

  <ContentWrap>
    <div class="mb-12px text-16px font-600">发布历史</div>
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
        <template #default="scope">{{ scope.row.rules?.length || 0 }}</template>
      </el-table-column>
      <el-table-column align="center" label="发布时间" min-width="180" prop="publishedAt" />
    </el-table>
    <Pagination
      v-model:limit="historyQuery.pageSize"
      v-model:page="historyQuery.pageNo"
      :total="history.total"
      @pagination="loadHistory"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as TenantApi from '@/api/skit/tenant'
import CommissionPreview from './CommissionPreview.vue'
import { validateCommissionDraft } from './workspaceModel'

defineOptions({ name: 'SkitTenantCommissionRuleEditor' })

const props = withDefaults(
  defineProps<{ target: TenantApi.ManagementTenantTarget; readOnly?: boolean }>(),
  { readOnly: false }
)
const message = useMessage()
const loading = ref(false)
const historyLoading = ref(false)
const previewing = ref(false)
const publishing = ref(false)
const currentPlan = ref<TenantApi.CommissionPlanVO>()
const rules = ref<TenantApi.CommissionRuleBpsVO[]>([])
const preview = ref<TenantApi.CommissionPlanPreviewVO>()
const reason = ref('')
const previewForm = reactive({ currency: 'CNY', amountUnits: 10000, amountScale: 2 })
const historyQuery = reactive({ pageNo: 1, pageSize: 10 })
const history = reactive({ list: [] as TenantApi.CommissionPlanVO[], total: 0 })
let requestId = 0

const targetKey = computed(() => `${props.target.kind}:${props.target.tenantId}`)
const totalRateBps = computed(() =>
  rules.value.reduce((total, rule) => total + Number(rule.rateBps || 0), 0)
)
const draftValidation = computed(() => validateCommissionDraft(rules.value))
const planStatusLabel = computed(() => {
  const status = currentPlan.value?.status
  if (status === 'ACTIVE') return '生效中'
  if (status === 'ARCHIVED') return '已归档'
  return '尚未配置'
})

const formatRate = (rateBps: number) => `${(Number(rateBps || 0) / 100).toFixed(2)}%`
const levelLabel = (levelNo: number) => (levelNo === 0 ? '本人' : `${levelNo} 级上级`)
const ruleDescription = (levelNo: number) =>
  levelNo === 0 ? '广告用户本人获得的比例' : `广告用户向上第 ${levelNo} 级邀请人获得的比例`

const resetDraft = (plan: TenantApi.CommissionPlanVO) => {
  currentPlan.value = plan
  rules.value = (plan.rules.length ? plan.rules : [{ levelNo: 0, rateBps: 10000 }]).map((rule) => ({
    levelNo: Number(rule.levelNo),
    rateBps: Number(rule.rateBps)
  }))
  preview.value = undefined
  reason.value = ''
}

const loadCurrent = async (currentRequestId = requestId) => {
  const plan = await TenantApi.getCommissionPlanCurrent(props.target, 'UTC+8')
  if (currentRequestId !== requestId) return
  resetDraft(plan)
}

const loadHistory = async () => {
  const currentRequestId = requestId
  historyLoading.value = true
  try {
    const data = await TenantApi.getCommissionPlanHistory(props.target, {
      pageNo: historyQuery.pageNo,
      pageSize: historyQuery.pageSize,
      timezone: 'UTC+8'
    })
    if (currentRequestId !== requestId) return
    history.list = data.list || []
    history.total = Number(data.total || 0)
  } finally {
    if (currentRequestId === requestId) historyLoading.value = false
  }
}

const loadWorkspace = async () => {
  const currentRequestId = ++requestId
  loading.value = true
  historyQuery.pageNo = 1
  history.list = []
  history.total = 0
  try {
    await Promise.all([loadCurrent(currentRequestId), loadHistory()])
  } finally {
    if (currentRequestId === requestId) loading.value = false
  }
}

const addRule = () => {
  if (props.readOnly) return
  const nextLevel = rules.value.length
    ? Math.max(...rules.value.map((item) => item.levelNo)) + 1
    : 0
  rules.value.push({ levelNo: nextLevel, rateBps: 0 })
  preview.value = undefined
}

const removeRule = (index: number) => {
  if (props.readOnly) return
  rules.value.splice(index, 1)
  preview.value = undefined
}

const validateDraft = () => {
  if (!draftValidation.value.valid) {
    message.warning(draftValidation.value.error)
    return false
  }
  if (!/^[A-Z]{3}$/.test(previewForm.currency.trim().toUpperCase())) {
    message.warning('币种必须是三个大写字母')
    return false
  }
  if (!Number.isSafeInteger(previewForm.amountUnits) || previewForm.amountUnits < 0) {
    message.warning('预览金额最小单位必须是非负安全整数')
    return false
  }
  return true
}

const previewRules = async () => {
  if (!validateDraft()) return
  previewing.value = true
  try {
    preview.value = await TenantApi.previewCommissionPlan(props.target, {
      amountUnits: previewForm.amountUnits,
      amountScale: previewForm.amountScale,
      currency: previewForm.currency.trim().toUpperCase(),
      timezone: 'UTC+8',
      rules: rules.value
    })
  } finally {
    previewing.value = false
  }
}

const publishRules = async () => {
  if (props.readOnly || !validateDraft()) return
  const normalizedReason = reason.value.trim()
  if (normalizedReason.length < 10 || normalizedReason.length > 500) {
    message.warning('发布原因长度必须为 10–500 个字符')
    return
  }
  await message.confirm(
    `将基于当前版本 v${currentPlan.value?.version ?? 0} 发布新规则。历史规则不会被覆盖，确认继续吗？`,
    '发布分成规则'
  )
  publishing.value = true
  try {
    await TenantApi.publishCommissionPlan(props.target, {
      expectedVersion: currentPlan.value?.version ?? 0,
      rules: rules.value,
      reason: normalizedReason
    })
    message.success('分成规则新版本已发布')
    await loadWorkspace()
  } finally {
    publishing.value = false
  }
}

watch(targetKey, loadWorkspace, { immediate: true })
</script>
