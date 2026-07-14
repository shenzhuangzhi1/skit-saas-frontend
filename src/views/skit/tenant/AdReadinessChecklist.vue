<template>
  <div>
    <div class="grid gap-8px md:grid-cols-2">
      <div v-for="gate in gates" :key="gate.key" class="flex items-center justify-between gap-12px">
        <span>{{ gate.label }}</span>
        <el-tag :type="gate.ready ? 'success' : 'danger'">
          {{ gate.ready ? '已通过' : '未通过' }}
        </el-tag>
      </div>
    </div>
    <div v-if="readiness.blockers.length" class="mt-12px text-[var(--el-color-danger)]">
      阻断项：{{ readiness.blockers.join('、') }}
    </div>
    <div class="mt-16px flex flex-wrap gap-8px">
      <el-button
        :disabled="!readiness.shadowReady"
        data-testid="shadow-rollout"
        @click="$emit('rollout', 'SHADOW_TEST_USERS')"
      >
        开启灰度验证
      </el-button>
      <el-button
        :disabled="!readiness.productionReady"
        data-testid="enforce-rollout"
        type="primary"
        @click="$emit('rollout', 'ENFORCED')"
      >
        启用生产解锁
      </el-button>
      <el-button data-testid="disable-rollout" @click="$emit('rollout', 'OFF')">
        关闭服务端解锁
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type {
  TenantAdReadinessVO as TenantAdReadiness,
  TenantAdRolloutState as AdRolloutState
} from '@/api/skit/tenant'

const props = defineProps<{ readiness: TenantAdReadiness }>()
defineEmits<{ rollout: [state: AdRolloutState] }>()

const gates = computed(() => [
  { key: 'tenant', label: '代理商状态', ready: props.readiness.tenantActive },
  { key: 'account', label: 'App、账号与密钥', ready: props.readiness.accountReady },
  { key: 'callback-key', label: 'Callback Key', ready: props.readiness.callbackKeyConfigured },
  { key: 'reward-secret', label: '奖励回调密钥', ready: props.readiness.rewardSecretConfigured },
  {
    key: 'placement',
    label: '解锁专用广告位',
    ready: props.readiness.dedicatedUnlockPlacement
  },
  {
    key: 'reward-template',
    label: '奖励回调模板',
    ready: props.readiness.rewardCallbackTemplateVerified
  },
  {
    key: 'impression-template',
    label: '展示回调模板',
    ready: props.readiness.impressionCallbackTemplateVerified
  },
  {
    key: 'network',
    label: '广告源服务端能力',
    ready: props.readiness.unlockNetworksAuthoritative
  },
  {
    key: 'report-credential',
    label: '报表凭据',
    ready: props.readiness.reportingCredentialConfigured
  },
  {
    key: 'report-permission',
    label: '报表权限',
    ready: props.readiness.reportingPermissionVerified
  },
  { key: 'report-fresh', label: '最近官方报表', ready: props.readiness.reportFresh },
  {
    key: 'signed-reward',
    label: '最近真实签名奖励',
    ready: props.readiness.signedRewardCallbackObserved
  },
  {
    key: 'impression',
    label: '最近展示回调',
    ready: props.readiness.impressionCallbackObserved
  },
  { key: 'release', label: 'App 发布与签名', ready: props.readiness.nativeReleaseReady },
  { key: 'protocol', label: '最低协议版本', ready: props.readiness.protocolReady },
  { key: 'shadow', label: '灰度会员范围', ready: props.readiness.shadowMembersValid }
])
</script>
