<template>
  <div>
    <div class="mb-12px flex flex-wrap gap-8px">
      <el-tag>状态 {{ readiness.rolloutState }}</el-tag>
      <el-tag type="info">就绪版本 v{{ readiness.readinessVersion }}</el-tag>
      <el-tag :type="readiness.callbackPublicUrlHttps ? 'success' : 'warning'">
        {{ readiness.callbackPublicUrlHttps ? '生产回调为 HTTPS' : '生产回调尚未启用 HTTPS' }}
      </el-tag>
    </div>
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
    <div v-if="hasPerNetworkEvidence" class="mt-16px" data-testid="network-readiness-list">
      <div class="mb-8px font-600">逐广告源验奖证据</div>
      <div v-if="networkRows.length === 0" class="text-[var(--el-color-danger)]">
        尚未选择奖励解锁广告源
      </div>
      <div v-else class="grid gap-10px">
        <div
          v-for="network in networkRows"
          :key="network.networkFirmId"
          class="rounded border border-[var(--el-border-color)] p-10px"
        >
          <div class="flex flex-wrap items-center justify-between gap-8px">
            <span>{{ networkLabel(network) }}</span>
            <div class="flex flex-wrap gap-6px">
              <el-tag :type="network.enabled ? 'success' : 'danger'" size="small">
                {{ network.enabled ? '能力已启用' : '能力已停用' }}
              </el-tag>
              <el-tag :type="network.verified ? 'success' : 'danger'" size="small">
                {{ network.verified ? '能力已验证' : '能力未验证' }}
              </el-tag>
              <el-tag size="small" type="info">{{ network.rewardAuthority || 'NONE' }}</el-tag>
              <el-tag :type="network.authoritative ? 'success' : 'danger'" size="small">
                {{ network.authoritative ? '签名能力可信' : '签名能力未通过' }}
              </el-tag>
              <el-tag :type="network.signedRewardObserved ? 'success' : 'danger'" size="small">
                {{ network.signedRewardObserved ? '奖励已观测' : '奖励未观测' }}
              </el-tag>
              <el-tag :type="network.impressionObserved ? 'success' : 'danger'" size="small">
                {{ network.impressionObserved ? '展示已观测' : '展示未观测' }}
              </el-tag>
              <el-tag :type="network.pairedSourceObserved ? 'success' : 'danger'" size="small">
                {{ network.pairedSourceObserved ? '同源配对已通过' : '同源配对未通过' }}
              </el-tag>
            </div>
          </div>
          <div
            v-if="network.blockers.length"
            class="mt-6px text-12px text-[var(--el-color-danger)]"
          >
            阻断项：{{ network.blockers.join('、') }}
          </div>
          <div class="mt-6px grid gap-4px text-12px text-[var(--el-text-color-secondary)]">
            <div>最近签名奖励：{{ evidenceTime(network.lastSignedRewardCallbackAt) }}</div>
            <div>最近展示回调：{{ evidenceTime(network.lastImpressionCallbackAt) }}</div>
            <div v-if="safeRefs(network.sourceRefs).length">
              安全来源引用：{{ safeRefs(network.sourceRefs).join('、') }}
            </div>
            <div v-if="safeRefs(network.signedRewardSourceRefs).length">
              签名奖励来源：{{ safeRefs(network.signedRewardSourceRefs).join('、') }}
            </div>
            <div v-if="safeRefs(network.impressionSourceRefs).length">
              展示来源：{{ safeRefs(network.impressionSourceRefs).join('、') }}
            </div>
            <div v-if="safeRefs(network.pairedSourceRefs).length">
              配对来源（安全截断）：{{ safeRefs(network.pairedSourceRefs).join('、') }}
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="missingSignedRewardNetworkFirmIds.length"
        class="mt-8px text-[var(--el-color-danger)]"
      >
        缺少签名奖励证据：{{ networkIdSetLabel(missingSignedRewardNetworkFirmIds) }}
      </div>
      <div
        v-if="missingImpressionNetworkFirmIds.length"
        class="mt-6px text-[var(--el-color-danger)]"
      >
        缺少展示证据：{{ networkIdSetLabel(missingImpressionNetworkFirmIds) }}
      </div>
      <div
        v-if="missingPairedSourceNetworkFirmIds.length"
        class="mt-6px text-[var(--el-color-danger)]"
      >
        缺少同源配对证据：{{ networkIdSetLabel(missingPairedSourceNetworkFirmIds) }}
      </div>
      <div
        v-if="readiness.productionReady && !perNetworkReady"
        class="mt-8px text-[var(--el-color-danger)]"
      >
        逐广告源证据未全部通过，聚合状态不作为生产放行依据。
      </div>
    </div>
    <div
      v-if="!hasPerNetworkEvidence && selectedNetworkIds.length > 0"
      class="mt-12px text-[var(--el-color-danger)]"
    >
      后端未返回逐广告源证据，聚合状态不能用于生产放行。
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
        :disabled="!productionRolloutReady"
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
  TenantAdNetworkReadinessVO,
  TenantAdReadinessVO as TenantAdReadiness,
  TenantAdRolloutState as AdRolloutState
} from '@/api/skit/tenant'
import { isTenantAdProductionReady } from './workspaceModel'

const props = defineProps<{ readiness: TenantAdReadiness }>()
defineEmits<{ rollout: [state: AdRolloutState] }>()

interface NetworkReadinessDisplay {
  networkFirmId: number
  displayName?: string
  rewardAuthority: string
  enabled: boolean
  verified: boolean
  authoritative: boolean
  signedRewardObserved: boolean
  impressionObserved: boolean
  pairedSourceObserved: boolean
  lastSignedRewardCallbackAt?: TenantAdReadiness['lastSignedRewardCallbackAt']
  lastImpressionCallbackAt?: TenantAdReadiness['lastImpressionCallbackAt']
  sourceRefs?: string[]
  signedRewardSourceRefs?: string[]
  impressionSourceRefs?: string[]
  pairedSourceRefs?: string[]
  blockers: string[]
}

const selectedNetworkIds = computed(() => props.readiness.unlockNetworkFirmIds || [])
const hasPerNetworkEvidence = computed(() => Array.isArray(props.readiness.networkReadiness))
const missingSignedRewardNetworkFirmIds = computed(
  () => props.readiness.missingSignedRewardNetworkFirmIds || []
)
const missingImpressionNetworkFirmIds = computed(
  () => props.readiness.missingImpressionNetworkFirmIds || []
)
const missingPairedSourceNetworkFirmIds = computed(
  () => props.readiness.missingPairedSourceNetworkFirmIds || []
)

const networkRows = computed<NetworkReadinessDisplay[]>(() => {
  if (!hasPerNetworkEvidence.value) return []
  const byNetwork = new Map<number, NetworkReadinessDisplay>()
  const returnedNetworks = props.readiness.networkReadiness || []
  returnedNetworks.forEach((network) => {
    byNetwork.set(network.networkFirmId, network)
  })
  selectedNetworkIds.value.forEach((networkFirmId) => {
    if (!byNetwork.has(networkFirmId)) {
      byNetwork.set(networkFirmId, {
        networkFirmId,
        rewardAuthority: 'NONE',
        enabled: false,
        verified: false,
        authoritative: false,
        signedRewardObserved: false,
        impressionObserved: false,
        pairedSourceObserved: false,
        sourceRefs: [],
        signedRewardSourceRefs: [],
        impressionSourceRefs: [],
        pairedSourceRefs: [],
        blockers: ['NETWORK_READINESS_MISSING']
      })
    }
  })
  return [...byNetwork.values()].sort((left, right) => left.networkFirmId - right.networkFirmId)
})

const perNetworkReady = computed(() => isTenantAdProductionReady(props.readiness))

const productionRolloutReady = computed(() => perNetworkReady.value)

const networkLabel = (network: Pick<TenantAdNetworkReadinessVO, 'networkFirmId' | 'displayName'>) =>
  network.displayName || `networkFirmId ${network.networkFirmId}`

const safeRefs = (refs?: string[]) => [
  ...new Set((refs || []).filter((ref) => /^[0-9a-f]{12}$/.test(ref)))
]

const evidenceTime = (value: TenantAdReadiness['lastSignedRewardCallbackAt']) =>
  value === null || value === undefined ? '尚未观测' : String(value)

const networkIdSetLabel = (networkFirmIds: number[]) =>
  networkFirmIds.map((networkFirmId) => `networkFirmId ${networkFirmId}`).join('、')

const gates = computed(() => [
  { key: 'tenant', label: '代理商状态', ready: props.readiness.tenantActive },
  { key: 'account', label: 'App、账号与密钥', ready: props.readiness.accountReady },
  { key: 'callback-key', label: 'Callback Key', ready: props.readiness.callbackKeyConfigured },
  { key: 'reward-secret', label: '奖励回调密钥', ready: props.readiness.rewardSecretConfigured },
  {
    key: 'callback-https',
    label: '生产回调 HTTPS',
    ready: Boolean(props.readiness.callbackPublicUrlHttps)
  },
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
  {
    key: 'paired-source',
    label: '同一广告源奖励+展示配对',
    ready: props.readiness.pairedSourceEvidenceObserved
  },
  { key: 'release', label: 'App 发布与签名', ready: props.readiness.nativeReleaseReady },
  { key: 'protocol', label: '最低协议版本', ready: props.readiness.protocolReady },
  { key: 'shadow', label: '灰度会员范围', ready: props.readiness.shadowMembersValid }
])
</script>
