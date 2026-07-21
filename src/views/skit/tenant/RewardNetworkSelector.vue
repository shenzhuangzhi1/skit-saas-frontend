<template>
  <div data-testid="reward-network-selector">
    <el-alert
      v-if="options.length === 0"
      :closable="false"
      show-icon
      title="当前广告账号未返回可验证的奖励广告源能力"
      type="warning"
    />
    <div v-else class="grid gap-10px">
      <div
        v-for="option in options"
        :key="option.networkFirmId"
        class="rounded border border-[var(--el-border-color)] p-10px"
        :data-testid="`reward-network-${option.networkFirmId}`"
      >
        <div class="flex flex-wrap items-center justify-between gap-8px">
          <el-checkbox
            :disabled="!option.selectable"
            :model-value="option.selected"
            @change="toggle(option, $event)"
          >
            {{ networkLabel(option) }}
          </el-checkbox>
          <div class="flex flex-wrap gap-6px">
            <el-tag v-if="option.selectable" size="small" type="success"> 可用于奖励解锁 </el-tag>
            <el-tag v-if="option.selected && !option.selectable" size="small" type="danger">
              已选但当前不可用
            </el-tag>
            <el-button
              v-if="option.selected && !option.selectable"
              :data-testid="`remove-reward-network-${option.networkFirmId}`"
              link
              type="danger"
              @click="remove(option.networkFirmId)"
            >
              从选择中移除
            </el-button>
          </div>
        </div>
        <div v-if="option.reasons.length" class="mt-6px text-12px text-[var(--el-color-danger)]">
          {{ option.reasons.join('；') }}
        </div>
      </div>
    </div>
    <div class="mt-8px text-12px text-[var(--el-text-color-secondary)]">
      仅已启用、已验证且具备完整签名奖励身份绑定能力的来源可新增选择；失效的历史选择不会被静默删除。
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { TenantAdNetworkCapabilityVO } from '@/api/skit/tenant'

interface NetworkOption extends TenantAdNetworkCapabilityVO {
  selected: boolean
  selectable: boolean
  reasons: string[]
}

const props = defineProps<{
  modelValue: number[]
  capabilities: TenantAdNetworkCapabilityVO[]
}>()

const emit = defineEmits<{ 'update:modelValue': [networkFirmIds: number[]] }>()

const selectedIds = computed(
  () => new Set(props.modelValue.filter((value) => Number.isSafeInteger(value) && value > 0))
)

const unavailableReasons = (capability: TenantAdNetworkCapabilityVO): string[] => {
  const reasons: string[] = [...(capability.blockers || [])]
  if (capability.selectable === false && reasons.length === 0) {
    reasons.push('后端标记该来源当前不可选')
  }
  if (!capability.enabled) reasons.push('能力已停用')
  if (!capability.verified) reasons.push('能力尚未验证')
  if (capability.rewardAuthority !== 'SIGNED_REWARD') reasons.push('不支持签名奖励')
  if (
    !capability.supportsUserId ||
    !capability.supportsCustomData ||
    !capability.supportsStableTransaction
  ) {
    reasons.push('用户、扩展数据或交易绑定能力不完整')
  }
  return [...new Set(reasons)]
}

const options = computed<NetworkOption[]>(() => {
  const byNetwork = new Map<number, TenantAdNetworkCapabilityVO>()
  props.capabilities.forEach((capability) => {
    if (Number.isSafeInteger(capability.networkFirmId) && capability.networkFirmId > 0) {
      byNetwork.set(capability.networkFirmId, capability)
    }
  })
  selectedIds.value.forEach((networkFirmId) => {
    if (!byNetwork.has(networkFirmId)) {
      byNetwork.set(networkFirmId, {
        networkFirmId,
        rewardAuthority: '',
        enabled: false,
        verified: false,
        selectable: false,
        blockers: ['CAPABILITY_NOT_RETURNED'],
        supportsUserId: false,
        supportsCustomData: false,
        supportsStableTransaction: false,
        supportsImpressionRevenue: false,
        supportsReporting: false
      })
    }
  })
  return [...byNetwork.values()]
    .sort((left, right) => left.networkFirmId - right.networkFirmId)
    .map((capability) => {
      const reasons = unavailableReasons(capability)
      if (!props.capabilities.some((item) => item.networkFirmId === capability.networkFirmId)) {
        reasons.unshift('后端未返回当前账号的该来源能力')
      }
      return {
        ...capability,
        selected: selectedIds.value.has(capability.networkFirmId),
        selectable: reasons.length === 0,
        reasons
      }
    })
})

const networkLabel = (option: NetworkOption) =>
  option.displayName || `networkFirmId ${option.networkFirmId}`

const update = (networkFirmIds: Iterable<number>) =>
  emit(
    'update:modelValue',
    [...new Set(networkFirmIds)].sort((left, right) => left - right)
  )

const toggle = (option: NetworkOption, checked: boolean | string | number) => {
  if (checked === true && !option.selectable) return
  const next = new Set(selectedIds.value)
  if (checked === true) next.add(option.networkFirmId)
  else next.delete(option.networkFirmId)
  update(next)
}

const remove = (networkFirmId: number) => {
  const next = new Set(selectedIds.value)
  next.delete(networkFirmId)
  update(next)
}
</script>
