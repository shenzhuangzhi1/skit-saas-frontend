<template>
  <div class="flex flex-wrap items-center gap-10px" data-testid="tenant-scope-bar">
    <span class="text-14px font-600">数据范围</span>
    <template v-if="modelValue.platformAdmin">
      <el-select
        data-testid="tenant-scope-select"
        :model-value="selection"
        :filterable="remote"
        :loading="loading"
        :remote="remote"
        :remote-method="remote ? searchTenants : undefined"
        placeholder="选择代理商"
        class="!w-240px"
        @change="changeSelection"
        @visible-change="handleVisibleChange"
      >
        <el-option label="全部代理商" value="all" />
        <el-option
          v-for="tenant in tenants"
          :key="tenant.tenantId"
          :label="tenant.name"
          :value="tenant.tenantId"
        />
      </el-select>
      <el-tag v-if="modelValue.kind === 'all'" type="info">跨租户只读汇总</el-tag>
    </template>
    <el-tag v-else type="success">{{ ownTenantName }}</el-tag>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { selectTenantScope, type TenantScope, type TenantScopeSelection } from './tenantScope'

export interface TenantScopeOption {
  tenantId: number
  name: string
}

const props = defineProps<{
  modelValue: TenantScope
  tenants: readonly TenantScopeOption[]
  remote?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: TenantScope): void
  (event: 'search', keyword: string): void
}>()

const selection = computed<TenantScopeSelection>(() =>
  props.modelValue.kind === 'single' ? props.modelValue.targetTenantId : 'all'
)

const ownTenantName = computed(
  () =>
    props.tenants.find((item) => item.tenantId === props.modelValue.originalTenantId)?.name ||
    `租户 ${props.modelValue.originalTenantId}`
)

const changeSelection = (value: TenantScopeSelection) => {
  emit('update:modelValue', selectTenantScope(props.modelValue, value))
}

const searchTenants = (keyword: string) => emit('search', keyword.trim())
const handleVisibleChange = (visible: boolean) => {
  if (visible && props.remote) emit('search', '')
}
</script>
