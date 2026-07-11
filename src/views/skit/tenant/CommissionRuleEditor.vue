<template>
  <ContentWrap>
    <div class="mb-16px flex items-start justify-between gap-16px">
      <div>
        <div class="text-16px font-600">广告分成规则</div>
        <el-text type="info">
          第 0 层代表广告用户本人，第 1 层起依次代表其上级。可增加任意层级，总分成比例不能超过
          100%。
        </el-text>
      </div>
      <div class="flex shrink-0 gap-8px">
        <el-button :disabled="!tenantId || loading" @click="addRule">
          <Icon icon="ep:plus" />新增层级
        </el-button>
        <el-button :disabled="!tenantId" :loading="saving" type="primary" @click="saveRules">
          保存规则
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!tenantId"
      :closable="false"
      title="请先在代理商列表中选择一个租户"
      type="info"
      show-icon
    />

    <el-table v-else v-loading="loading" :data="rules" row-key="level">
      <el-table-column label="收益层级" min-width="220">
        <template #default="scope">
          <div class="flex items-center gap-12px">
            <el-input-number
              v-model="scope.row.level"
              :min="0"
              :precision="0"
              controls-position="right"
            />
            <el-tag>{{ levelLabel(scope.row.level) }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分成比例" min-width="220">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.rate"
            :min="0"
            :max="100"
            :precision="2"
            controls-position="right"
          />
          <span class="ml-8px">%</span>
        </template>
      </el-table-column>
      <el-table-column label="说明" min-width="260">
        <template #default="scope">
          {{ ruleDescription(scope.row.level) }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="100">
        <template #default="scope">
          <el-button
            v-if="scope.row.level !== 0"
            link
            type="danger"
            @click="removeRule(scope.$index)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="tenantId" class="mt-16px flex justify-end">
      <el-tag :type="totalRate > 100 ? 'danger' : 'success'" size="large">
        当前总分成：{{ totalRate.toFixed(2) }}%
      </el-tag>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitTenantCommissionRuleEditor' })

const props = defineProps<{ tenantId?: number }>()
const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const rules = ref<TenantApi.CommissionRuleVO[]>([])

const totalRate = computed(() =>
  rules.value.reduce((total, rule) => total + Number(rule.rate || 0), 0)
)

const levelLabel = (level: number) => (level === 0 ? '本人' : `${level} 级上级`)
const ruleDescription = (level: number) =>
  level === 0 ? '广告收益归属用户本人获得的比例' : `广告用户向上第 ${level} 级邀请人获得的比例`

const loadRules = async () => {
  if (!props.tenantId) {
    rules.value = []
    return
  }
  loading.value = true
  try {
    const data = await TenantApi.getTenantCommissionRules(props.tenantId)
    const loadedRules = Array.isArray(data) ? data : data?.rules
    rules.value = (loadedRules?.length ? loadedRules : [{ level: 0, rate: 100 }])
      .map((item) => ({ level: Number(item.level), rate: Number(item.rate) }))
      .sort((a, b) => a.level - b.level)
  } finally {
    loading.value = false
  }
}

const addRule = () => {
  const nextLevel = rules.value.length ? Math.max(...rules.value.map((item) => item.level)) + 1 : 0
  rules.value.push({ level: nextLevel, rate: 0 })
}

const removeRule = (index: number) => {
  rules.value.splice(index, 1)
}

const validateRules = () => {
  if (!rules.value.length) {
    message.warning('请至少配置一层分成规则')
    return false
  }
  const levels = rules.value.map((item) => Number(item.level))
  if (levels.some((level) => !Number.isInteger(level) || level < 0)) {
    message.warning('收益层级必须是大于等于 0 的整数')
    return false
  }
  if (new Set(levels).size !== levels.length) {
    message.warning('收益层级不能重复')
    return false
  }
  if (!levels.includes(0)) {
    message.warning('必须保留第 0 层本人分成规则')
    return false
  }
  if (rules.value.some((item) => Number(item.rate) < 0 || Number(item.rate) > 100)) {
    message.warning('每层分成比例必须在 0% 到 100% 之间')
    return false
  }
  if (totalRate.value > 100) {
    message.warning('所有层级的总分成比例不能超过 100%')
    return false
  }
  return true
}

const saveRules = async () => {
  if (!props.tenantId || !validateRules()) return
  saving.value = true
  try {
    await TenantApi.updateTenantCommissionRules({
      tenantId: props.tenantId,
      rules: rules.value
        .map((item) => ({ level: Number(item.level), rate: Number(item.rate) }))
        .sort((a, b) => a.level - b.level)
    })
    message.success('分成规则保存成功')
    await loadRules()
  } finally {
    saving.value = false
  }
}

watch(() => props.tenantId, loadRules, { immediate: true })
</script>
