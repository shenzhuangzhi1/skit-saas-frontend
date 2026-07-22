<template>
  <div class="grid gap-16px xl:grid-cols-2">
    <ContentWrap>
      <div class="mb-12px flex items-start justify-between gap-12px">
        <div>
          <div class="text-16px font-600">广告平台账号</div>
          <div class="text-13px text-[var(--el-text-color-secondary)]">
            密钥只写不读；“已配置”仅代表服务端保存了凭据，页面永不回显原值。
          </div>
        </div>
        <el-button :disabled="!accountForm" :loading="saving" type="primary" @click="saveAccount">
          保存账号
        </el-button>
      </div>
      <AsyncState
        :empty="!accountForm"
        empty-text="暂无广告账号配置"
        :error="accountError"
        :loading="accountLoading"
      >
        <el-form v-if="accountForm" label-width="132px">
          <div class="mb-8px flex items-center gap-8px font-600">
            穿山甲
            <el-tag :type="accountForm.pangleSecretConfigured ? 'success' : 'info'" size="small">
              {{
                accountForm.pangleSecretConfigured
                  ? '密钥已配置（Server Key）'
                  : '密钥未配置（Server Key）'
              }}
            </el-tag>
          </div>
          <el-form-item label="启用">
            <el-switch v-model="accountForm.pangleEnabled" />
          </el-form-item>
          <el-form-item label="账号">
            <el-input v-model="accountForm.pangleUsername" maxlength="128" />
          </el-form-item>
          <el-form-item label="App ID">
            <el-input v-model="accountForm.pangleAppId" maxlength="128" />
          </el-form-item>
          <el-form-item label="解锁广告位">
            <el-input v-model="accountForm.panglePlacementId" maxlength="128" />
          </el-form-item>
          <el-form-item label="Pangle Server Key">
            <InputPassword
              v-model="accountForm.pangleAppSecret"
              autocomplete="new-password"
              maxlength="2048"
              :placeholder="
                accountForm.pangleSecretConfigured
                  ? '留空保留已配置 Server Key'
                  : '输入内容接口 Server Key'
              "
            />
          </el-form-item>

          <el-divider />
          <div class="mb-8px flex flex-wrap items-center gap-8px font-600">
            Taku
            <el-tag :type="accountForm.takuAppKeyConfigured ? 'success' : 'info'" size="small">
              {{ accountForm.takuAppKeyConfigured ? 'App Key 已配置' : 'App Key 未配置' }}
            </el-tag>
          </div>
          <el-form-item label="启用">
            <el-switch v-model="accountForm.takuEnabled" />
          </el-form-item>
          <el-form-item label="账号">
            <el-input v-model="accountForm.takuUsername" maxlength="128" />
          </el-form-item>
          <el-form-item label="App ID">
            <el-input v-model="accountForm.takuAppId" maxlength="128" />
          </el-form-item>
          <el-form-item label="解锁广告位">
            <el-input v-model="accountForm.takuPlacementId" maxlength="128" />
          </el-form-item>
          <el-form-item label="客户端 App Key">
            <InputPassword
              v-model="accountForm.takuAppKey"
              autocomplete="new-password"
              maxlength="255"
              :placeholder="
                accountForm.takuAppKeyConfigured ? '留空保留已配置 App Key' : '输入新 App Key'
              "
            />
          </el-form-item>
          <el-form-item label="Taku App Secret">
            <InputPassword
              v-model="accountForm.takuAppSecret"
              autocomplete="new-password"
              maxlength="2048"
              :placeholder="accountForm.takuSecretConfigured ? '留空保留已配置密钥' : '输入新密钥'"
            />
          </el-form-item>
          <el-form-item label="变更原因">
            <el-input
              v-model="accountReason"
              maxlength="500"
              placeholder="必填 10–500 字，用于安全审计"
              show-word-limit
              type="textarea"
            />
          </el-form-item>
        </el-form>
      </AsyncState>
    </ContentWrap>

    <ContentWrap>
      <div class="mb-12px flex items-start justify-between gap-12px">
        <div>
          <div class="text-16px font-600">Taku 官方报表</div>
          <div class="text-13px text-[var(--el-text-color-secondary)]">
            Publisher Key 只写不读；官方报表确认前，收益不能进入可结算余额。
          </div>
        </div>
        <el-button
          :disabled="!reportingForm"
          :loading="reportingSaving"
          type="primary"
          @click="saveReporting"
        >
          保存报表配置
        </el-button>
      </div>
      <AsyncState
        :empty="!reportingForm"
        empty-text="暂无报表配置"
        :error="reportingError"
        :loading="reportingLoading"
      >
        <el-form v-if="reportingForm" label-width="132px">
          <div class="mb-10px flex flex-wrap gap-8px">
            <el-tag :type="reportingForm.credentialConfigured ? 'success' : 'info'">
              {{
                reportingForm.credentialConfigured
                  ? `Publisher Key 已配置 · v${reportingForm.credentialVersion}`
                  : 'Publisher Key 未配置'
              }}
            </el-tag>
            <el-tag :type="reportingForm.permissionVerifiedAt ? 'success' : 'warning'">
              {{ reportingForm.permissionVerifiedAt ? '报表权限已验证' : '报表权限待验证' }}
            </el-tag>
          </div>
          <el-form-item label="Taku App ID">
            <el-input :model-value="reportingForm.appId" disabled />
          </el-form-item>
          <el-form-item label="解锁广告位">
            <el-input :model-value="reportingForm.placementId" disabled />
          </el-form-item>
          <el-form-item label="报表时区">
            <el-select v-model="reportingForm.reportTimezone" class="w-full">
              <el-option label="UTC-8" value="UTC-8" />
              <el-option label="UTC+8" value="UTC+8" />
              <el-option label="UTC+0" value="UTC+0" />
            </el-select>
          </el-form-item>
          <el-form-item label="ISO 币种">
            <el-input v-model="reportingForm.currency" maxlength="3" />
          </el-form-item>
          <el-form-item label="金额精度">
            <el-input-number v-model="reportingForm.amountScale" :max="18" :min="0" />
          </el-form-item>
          <el-form-item label="广告格式">
            <el-input model-value="rewarded_video" disabled />
          </el-form-item>
          <el-form-item label="Publisher Key">
            <InputPassword
              v-model="reportingForm.publisherKey"
              autocomplete="new-password"
              maxlength="4096"
              :placeholder="
                reportingForm.credentialConfigured
                  ? '留空保留当前 Publisher Key'
                  : '输入 Publisher Key'
              "
            />
          </el-form-item>
          <el-form-item label="变更原因">
            <el-input
              v-model="reportingForm.reason"
              maxlength="500"
              placeholder="必填 10–500 字，用于跨租户代管和安全审计"
              :rows="3"
              show-word-limit
              type="textarea"
            />
          </el-form-item>
        </el-form>
      </AsyncState>
    </ContentWrap>

    <ContentWrap>
      <div class="mb-12px text-16px font-600">服务端验奖就绪状态</div>
      <AsyncState
        :empty="!readiness"
        empty-text="暂无就绪状态"
        :error="readinessError"
        :loading="readinessLoading"
      >
        <AdReadinessChecklist
          v-if="readiness"
          :readiness="readiness"
          @rollout="transitionRollout"
        />
      </AsyncState>
    </ContentWrap>

    <ContentWrap v-if="readiness && capabilityForm">
      <div class="mb-12px flex items-start justify-between gap-12px">
        <div>
          <div class="text-16px font-600">服务端验奖配置</div>
          <div class="text-13px text-[var(--el-text-color-secondary)]">
            每次保存都校验就绪版本，避免两位管理员互相覆盖。生产启用要求 HTTPS 回调地址。
          </div>
        </div>
        <el-button :loading="capabilitySaving" type="primary" @click="saveCapability">
          保存验奖配置
        </el-button>
      </div>
      <el-form label-width="150px">
        <el-form-item label="广告账号编号">
          <el-input
            data-testid="capability-ad-account-id"
            :model-value="capabilityAdAccountId || '-'"
            disabled
          />
        </el-form-item>
        <el-form-item label="专用解锁广告位">
          <el-input
            :model-value="
              capabilityForm.dedicatedUnlockPlacementId || '未读取到已启用的 Taku 广告位'
            "
            disabled
          />
        </el-form-item>
        <el-form-item label="广告位已核验">
          <el-switch v-model="capabilityForm.dedicatedPlacementVerified" />
        </el-form-item>
        <el-form-item label="奖励模板已核验">
          <el-switch v-model="capabilityForm.rewardCallbackTemplateVerified" />
        </el-form-item>
        <el-form-item label="展示模板已核验">
          <el-switch v-model="capabilityForm.impressionCallbackTemplateVerified" />
        </el-form-item>
        <el-form-item label="奖励解锁广告源">
          <RewardNetworkSelector
            v-model="capabilityForm.unlockNetworkFirmIds"
            :capabilities="readiness.availableNetworkCapabilities || []"
          />
        </el-form-item>
        <el-form-item label="灰度会员 ID（当前租户）">
          <el-input
            v-model="capabilityForm.shadowTestMemberIds"
            :rows="2"
            placeholder="填写成员体系中的 memberId，支持逗号、中文逗号或换行"
            type="textarea"
          />
        </el-form-item>
        <el-form-item label="最低原生版本">
          <el-input v-model="capabilityForm.minNativeVersion" maxlength="64" />
        </el-form-item>
        <el-form-item label="最低协议版本">
          <el-input :model-value="String(CURRENT_PROTOCOL_VERSION)" disabled />
        </el-form-item>
        <el-form-item label="配置变更原因">
          <el-input
            v-model="capabilityForm.reason"
            maxlength="500"
            placeholder="必填 10–500 字"
            show-word-limit
            type="textarea"
          />
        </el-form-item>
        <el-form-item label="灰度/启用原因">
          <el-input
            v-model="rolloutReason"
            maxlength="500"
            placeholder="点击灰度、启用或关闭前填写 10–500 字"
            show-word-limit
            type="textarea"
          />
        </el-form-item>
      </el-form>
    </ContentWrap>

    <ContentWrap
      v-if="canManageNetworkCapabilities && readiness"
      data-testid="network-capability-manager"
    >
      <div class="mb-12px">
        <div class="text-16px font-600">广告源验奖能力（平台超管）</div>
        <div class="text-13px text-[var(--el-text-color-secondary)]">
          仅登记当前 Taku 账号真实返回的 networkFirmId。此处不读取或保存 adsourceId、密钥等凭据。
        </div>
      </div>
      <div v-if="readiness.availableNetworkCapabilities?.length" class="mb-14px grid gap-8px">
        <div
          v-for="capability in readiness.availableNetworkCapabilities"
          :key="capability.networkFirmId"
          class="flex flex-wrap items-center justify-between gap-8px rounded border border-[var(--el-border-color)] p-8px"
        >
          <span>
            {{ capability.displayName || `networkFirmId ${capability.networkFirmId}` }} ·
            {{ capability.rewardAuthority }} · {{ capability.enabled ? '已启用' : '已停用' }}
          </span>
          <el-button link type="primary" @click="loadNetworkCapability(capability)">
            载入能力字段
          </el-button>
        </div>
      </div>
      <el-form label-width="170px">
        <el-form-item label="广告账号编号">
          <el-input :model-value="capabilityAdAccountId || '-'" disabled />
        </el-form-item>
        <el-form-item label="预期就绪版本">
          <el-input :model-value="String(readiness.readinessVersion)" disabled />
        </el-form-item>
        <el-form-item label="networkFirmId">
          <el-input-number
            v-model="networkCapabilityForm.networkFirmId"
            :min="1"
            :precision="0"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="奖励权限">
          <el-select v-model="networkCapabilityForm.rewardAuthority" class="w-full">
            <el-option label="服务端签名奖励（SIGNED_REWARD）" value="SIGNED_REWARD" />
            <el-option label="不具备奖励权限（NONE）" value="NONE" />
          </el-select>
        </el-form-item>
        <el-form-item label="支持 userId">
          <el-switch v-model="networkCapabilityForm.supportsUserId" />
        </el-form-item>
        <el-form-item label="支持 customData">
          <el-switch v-model="networkCapabilityForm.supportsCustomData" />
        </el-form-item>
        <el-form-item label="稳定交易标识">
          <el-switch v-model="networkCapabilityForm.supportsStableTransaction" />
        </el-form-item>
        <el-form-item label="展示收益回调">
          <el-switch v-model="networkCapabilityForm.supportsImpressionRevenue" />
        </el-form-item>
        <el-form-item label="官方报表">
          <el-switch v-model="networkCapabilityForm.supportsReporting" />
        </el-form-item>
        <el-form-item label="核验/停用原因">
          <el-input
            v-model="networkCapabilityForm.reason"
            maxlength="500"
            placeholder="每次核验或停用均必填 10–500 字"
            show-word-limit
            type="textarea"
          />
        </el-form-item>
        <el-form-item>
          <div class="flex flex-wrap gap-8px">
            <el-button
              :loading="networkCapabilitySaving"
              type="primary"
              @click="saveNetworkCapability(true)"
            >
              核验并启用能力
            </el-button>
            <el-button
              :loading="networkCapabilitySaving"
              type="danger"
              @click="saveNetworkCapability(false)"
            >
              停用能力
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <ContentWrap v-if="readiness">
      <div class="mb-12px text-16px font-600">回调密钥轮换</div>
      <el-alert
        class="mb-14px"
        :closable="false"
        show-icon
        title="Callback Key 由服务端生成并仅显示一次；奖励验签密钥由管理员只写提交，服务端永不回显。"
        type="warning"
      />
      <el-form label-width="150px">
        <el-divider content-position="left">Callback Key</el-divider>
        <el-form-item label="旧版本兼容（分钟）">
          <el-input-number
            v-model="callbackRotation.priorAcceptanceMinutes"
            :max="1440"
            :min="0"
            :precision="0"
          />
        </el-form-item>
        <el-form-item label="轮换原因">
          <el-input
            v-model="callbackRotation.reason"
            maxlength="500"
            placeholder="必填 10–500 字"
            type="textarea"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            :disabled="!capabilityAdAccountId"
            :loading="callbackRotating"
            type="primary"
            @click="rotateCallbackKey"
          >
            生成并轮换 Callback Key
          </el-button>
        </el-form-item>

        <el-divider content-position="left">奖励回调密钥</el-divider>
        <el-form-item label="新密钥">
          <InputPassword
            v-model="rewardRotation.rewardSecret"
            autocomplete="new-password"
            maxlength="2048"
            placeholder="8–2048 个字符，只写不读"
          />
        </el-form-item>
        <el-form-item label="旧版本兼容（分钟）">
          <el-input-number
            v-model="rewardRotation.priorAcceptanceMinutes"
            :max="1440"
            :min="0"
            :precision="0"
          />
        </el-form-item>
        <el-form-item label="轮换原因">
          <el-input
            v-model="rewardRotation.reason"
            maxlength="500"
            placeholder="必填 10–500 字"
            type="textarea"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            :disabled="!capabilityAdAccountId"
            :loading="rewardRotating"
            type="primary"
            @click="rotateRewardSecret"
          >
            轮换奖励回调密钥
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>
  </div>

  <Dialog
    v-model="callbackRevealVisible"
    destroy-on-close
    title="新 Callback Key（仅显示一次）"
    width="760px"
    @closed="clearCallbackReveal"
  >
    <el-alert
      class="mb-14px"
      :closable="false"
      show-icon
      title="关闭窗口后无法再次查看。请立即保存到 Taku 后台的奖励和展示回调配置中。"
      type="warning"
    />
    <el-form v-if="callbackReveal" label-width="150px">
      <el-form-item label="Callback Key">
        <el-input :model-value="callbackReveal.callbackKey" readonly />
      </el-form-item>
      <el-form-item label="奖励回调 URL">
        <el-input :model-value="callbackReveal.rewardCallbackUrl" readonly />
      </el-form-item>
      <el-form-item label="展示回调 URL">
        <el-input :model-value="callbackReveal.impressionCallbackUrl" readonly />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="copyCallbackBundle">复制全部配置</el-button>
      </el-form-item>
    </el-form>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClipboard } from '@vueuse/core'
import { InputPassword } from '@/components/InputPassword'
import { hasAnyRole } from '@/utils/role'
import AsyncState from '@/views/skit/shared/AsyncState.vue'
import * as TenantApi from '@/api/skit/tenant'
import AdReadinessChecklist from './AdReadinessChecklist.vue'
import RewardNetworkSelector from './RewardNetworkSelector.vue'
import {
  buildAdAccountWritePayload,
  CURRENT_PROTOCOL_VERSION,
  isTenantAdProductionReady,
  parseShadowMemberIds,
  parseUnlockNetworkFirmIds,
  resolveTenantAdAccountId,
  sanitizeAdAccountResponse,
  sanitizeReportingConfiguration,
  type ManagementTenantTarget,
  type SafeAdAccountForm,
  type SafeReportingConfigurationForm
} from './workspaceModel'

defineOptions({ name: 'SkitTenantAdAccessEditor' })

const props = withDefaults(
  defineProps<{
    target: ManagementTenantTarget
    roles?: string[]
  }>(),
  { roles: () => [] }
)
const { copy: copyToClipboard } = useClipboard({ legacy: true })
const accountForm = ref<SafeAdAccountForm>()
const accountReason = ref('')
const accountLoading = ref(false)
const accountError = ref('')
const readiness = ref<TenantApi.TenantAdReadinessVO>()
const readinessLoading = ref(false)
const readinessError = ref('')
const saving = ref(false)
const reportingForm = ref<SafeReportingConfigurationForm>()
const reportingLoading = ref(false)
const reportingError = ref('')
const reportingSaving = ref(false)
const capabilityAdAccountId = computed(() =>
  resolveTenantAdAccountId(readiness.value, reportingForm.value)
)
const canManageNetworkCapabilities = computed(
  () => props.target.kind === 'platform' && hasAnyRole(['super_admin'], props.roles)
)
interface CapabilityForm {
  dedicatedUnlockPlacementId: string
  dedicatedPlacementVerified: boolean
  rewardCallbackTemplateVerified: boolean
  impressionCallbackTemplateVerified: boolean
  unlockNetworkFirmIds: number[]
  shadowTestMemberIds: string
  minNativeVersion: string
  reason: string
}
const capabilityForm = ref<CapabilityForm>()
const capabilitySaving = ref(false)
interface NetworkCapabilityForm {
  networkFirmId?: number
  rewardAuthority: 'SIGNED_REWARD' | 'NONE'
  supportsUserId: boolean
  supportsCustomData: boolean
  supportsStableTransaction: boolean
  supportsImpressionRevenue: boolean
  supportsReporting: boolean
  reason: string
}
const networkCapabilityForm = reactive<NetworkCapabilityForm>({
  networkFirmId: undefined,
  rewardAuthority: 'SIGNED_REWARD',
  supportsUserId: false,
  supportsCustomData: false,
  supportsStableTransaction: false,
  supportsImpressionRevenue: false,
  supportsReporting: false,
  reason: ''
})
const networkCapabilitySaving = ref(false)
const rolloutReason = ref('')
const callbackRotation = reactive({ priorAcceptanceMinutes: 30, reason: '' })
const rewardRotation = reactive({ priorAcceptanceMinutes: 30, rewardSecret: '', reason: '' })
const callbackRotating = ref(false)
const rewardRotating = ref(false)
const callbackReveal = ref<TenantApi.TenantCallbackKeyRotateVO>()
const callbackRevealVisible = ref(false)
let requestId = 0

const errorText = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

const capabilityErrorText = (error: unknown) => {
  const message = errorText(error, '验奖配置保存失败')
  if (message.includes('SHADOW_MEMBER_TENANT_MISMATCH')) {
    return '灰度会员 ID 不属于当前租户，请从成员体系复制当前租户的 memberId'
  }
  if (message.includes('CROSS_TENANT_CONFIGURATION')) {
    return '广告账号不属于当前租户，请重新选择当前租户的 Taku 广告账号'
  }
  if (message.includes('REQUIRED_FIELD_INVALID')) {
    return '请填写最低原生版本，并确认已启用有效的 Taku 广告账号'
  }
  return message
}

const resetNetworkCapabilityForm = () => {
  Object.assign(networkCapabilityForm, {
    networkFirmId: undefined,
    rewardAuthority: 'SIGNED_REWARD',
    supportsUserId: false,
    supportsCustomData: false,
    supportsStableTransaction: false,
    supportsImpressionRevenue: false,
    supportsReporting: false,
    reason: ''
  } satisfies NetworkCapabilityForm)
}

const loadNetworkCapability = (capability: TenantApi.TenantAdNetworkCapabilityVO) => {
  Object.assign(networkCapabilityForm, {
    networkFirmId: capability.networkFirmId,
    rewardAuthority:
      capability.rewardAuthority === 'SIGNED_REWARD' ? 'SIGNED_REWARD' : ('NONE' as const),
    supportsUserId: capability.supportsUserId,
    supportsCustomData: capability.supportsCustomData,
    supportsStableTransaction: capability.supportsStableTransaction,
    supportsImpressionRevenue: capability.supportsImpressionRevenue,
    supportsReporting: capability.supportsReporting,
    reason: ''
  })
}

const loadAccount = async (currentRequestId: number) => {
  accountLoading.value = true
  accountError.value = ''
  accountForm.value = undefined
  try {
    const response = await TenantApi.getManagedTenantAdAccount(props.target)
    if (currentRequestId !== requestId) return
    accountForm.value = sanitizeAdAccountResponse(response)
    if (capabilityForm.value && !capabilityForm.value.dedicatedUnlockPlacementId) {
      capabilityForm.value.dedicatedUnlockPlacementId = accountForm.value.takuPlacementId
    }
  } catch (error) {
    if (currentRequestId !== requestId) return
    accountError.value = errorText(error, '广告账号加载失败')
  } finally {
    if (currentRequestId === requestId) accountLoading.value = false
  }
}

const loadReadiness = async (currentRequestId: number) => {
  readinessLoading.value = true
  readinessError.value = ''
  readiness.value = undefined
  try {
    const response = await TenantApi.getTenantAdReadiness(props.target)
    if (currentRequestId !== requestId) return
    readiness.value = response
    capabilityForm.value = {
      dedicatedUnlockPlacementId:
        response.dedicatedUnlockPlacementId || accountForm.value?.takuPlacementId || '',
      dedicatedPlacementVerified: Boolean(response.dedicatedPlacementVerified),
      rewardCallbackTemplateVerified: Boolean(response.rewardCallbackTemplateVerified),
      impressionCallbackTemplateVerified: Boolean(response.impressionCallbackTemplateVerified),
      unlockNetworkFirmIds: [...(response.unlockNetworkFirmIds || [])],
      shadowTestMemberIds: (response.shadowTestMemberIds || []).join(', '),
      minNativeVersion: response.minNativeVersion || '',
      reason: ''
    }
  } catch (error) {
    if (currentRequestId !== requestId) return
    readinessError.value = errorText(error, '广告就绪状态加载失败')
  } finally {
    if (currentRequestId === requestId) readinessLoading.value = false
  }
}

const loadReporting = async (currentRequestId: number) => {
  reportingLoading.value = true
  reportingError.value = ''
  reportingForm.value = undefined
  try {
    const response = await TenantApi.getTenantReportingConfiguration(props.target)
    if (currentRequestId !== requestId) return
    reportingForm.value = sanitizeReportingConfiguration(response)
  } catch (error) {
    if (currentRequestId !== requestId) return
    reportingError.value = errorText(error, 'Taku 报表配置加载失败')
  } finally {
    if (currentRequestId === requestId) reportingLoading.value = false
  }
}

const reload = () => {
  const currentRequestId = ++requestId
  accountReason.value = ''
  rolloutReason.value = ''
  callbackRotation.reason = ''
  rewardRotation.reason = ''
  rewardRotation.rewardSecret = ''
  resetNetworkCapabilityForm()
  clearCallbackReveal()
  void loadAccount(currentRequestId)
  void loadReadiness(currentRequestId)
  void loadReporting(currentRequestId)
}

const saveAccount = async () => {
  if (!accountForm.value) return
  const reason = accountReason.value.trim()
  if (reason.length < 10 || reason.length > 500) {
    ElMessage.warning('变更原因必须为 10–500 个字符')
    return
  }
  saving.value = true
  try {
    const payload = buildAdAccountWritePayload(accountForm.value, props.target)
    const response = await TenantApi.saveManagedTenantAdAccount(props.target, {
      ...payload,
      reason
    })
    accountForm.value = sanitizeAdAccountResponse(response)
    accountReason.value = ''
    ElMessage.success('广告账号已保存；输入框中的密钥已清空')
    await loadReadiness(requestId)
  } catch (error) {
    ElMessage.error(errorText(error, '广告账号保存失败'))
  } finally {
    saving.value = false
  }
}

const auditedReason = (value: string, label: string) => {
  const reason = value.trim()
  if (reason.length < 10 || reason.length > 500) {
    ElMessage.warning(`${label}必须为 10–500 个字符`)
    return ''
  }
  return reason
}

const saveNetworkCapability = async (enabled: boolean) => {
  if (!canManageNetworkCapabilities.value) return
  const currentReadiness = readiness.value
  const adAccountId = capabilityAdAccountId.value
  const networkFirmId = networkCapabilityForm.networkFirmId
  if (!currentReadiness || !adAccountId) {
    ElMessage.warning('未读取到当前租户已启用的 Taku 广告账号')
    return
  }
  if (
    typeof networkFirmId !== 'number' ||
    !Number.isSafeInteger(networkFirmId) ||
    networkFirmId <= 0
  ) {
    ElMessage.warning('networkFirmId 必须是正整数')
    return
  }
  const reason = auditedReason(networkCapabilityForm.reason, '核验/停用原因')
  if (!reason) return
  networkCapabilitySaving.value = true
  try {
    await TenantApi.verifyTenantAdNetworkCapability(props.target, {
      adAccountId,
      networkFirmId,
      rewardAuthority: networkCapabilityForm.rewardAuthority,
      enabled,
      supportsUserId: networkCapabilityForm.supportsUserId,
      supportsCustomData: networkCapabilityForm.supportsCustomData,
      supportsStableTransaction: networkCapabilityForm.supportsStableTransaction,
      supportsImpressionRevenue: networkCapabilityForm.supportsImpressionRevenue,
      supportsReporting: networkCapabilityForm.supportsReporting,
      expectedReadinessVersion: currentReadiness.readinessVersion,
      reason
    })
    networkCapabilityForm.reason = ''
    ElMessage.success(enabled ? '广告源能力已核验并启用' : '广告源能力已停用')
    await loadReadiness(requestId)
  } catch (error) {
    ElMessage.error(errorText(error, enabled ? '广告源能力核验失败' : '广告源能力停用失败'))
  } finally {
    networkCapabilitySaving.value = false
  }
}

const saveCapability = async () => {
  const form = capabilityForm.value
  const currentReadiness = readiness.value
  const adAccountId = capabilityAdAccountId.value
  if (!form || !currentReadiness || !adAccountId) {
    ElMessage.warning('未读取到当前租户已启用的 Taku 广告账号')
    return
  }
  if (currentReadiness.rolloutState !== 'OFF' && form.unlockNetworkFirmIds.length === 0) {
    ElMessage.warning('至少选择一个已验证的奖励解锁广告源')
    return
  }
  let unlockNetworkFirmIds: number[]
  try {
    unlockNetworkFirmIds = parseUnlockNetworkFirmIds(form.unlockNetworkFirmIds.join(','))
  } catch (error) {
    ElMessage.warning(errorText(error, '奖励解锁广告源选择无效'))
    return
  }
  const reason = auditedReason(form.reason, '配置变更原因')
  if (!reason) return
  capabilitySaving.value = true
  try {
    const response = await TenantApi.configureTenantAdCapability(props.target, {
      adAccountId,
      dedicatedUnlockPlacementId: form.dedicatedUnlockPlacementId.trim(),
      dedicatedPlacementVerified: form.dedicatedPlacementVerified,
      rewardCallbackTemplateVerified: form.rewardCallbackTemplateVerified,
      impressionCallbackTemplateVerified: form.impressionCallbackTemplateVerified,
      unlockNetworkFirmIds,
      shadowTestMemberIds: parseShadowMemberIds(form.shadowTestMemberIds),
      minNativeVersion: form.minNativeVersion.trim(),
      minProtocolVersion: CURRENT_PROTOCOL_VERSION,
      expectedReadinessVersion: currentReadiness.readinessVersion,
      reason
    })
    ElMessage.success(`验奖配置已保存，当前就绪版本 v${response.readinessVersion}`)
    await loadReadiness(requestId)
  } catch (error) {
    ElMessage.error(capabilityErrorText(error))
  } finally {
    capabilitySaving.value = false
  }
}

const transitionRollout = async (targetState: TenantApi.TenantAdRolloutState) => {
  const currentReadiness = readiness.value
  const form = capabilityForm.value
  if (!currentReadiness || !form) return
  const reason = auditedReason(rolloutReason.value, '灰度/启用原因')
  if (!reason) return
  if (targetState === 'ENFORCED' && !isTenantAdProductionReady(currentReadiness)) {
    ElMessage.warning('生产就绪门禁尚未全部通过，不能启用生产解锁')
    return
  }
  await ElMessageBox.confirm(
    `确认将服务端验奖状态切换为 ${targetState} 吗？该操作会立即影响本租户 App 解锁。`,
    '切换验奖状态'
  )
  const response = await TenantApi.transitionTenantAdRollout(props.target, {
    targetState,
    minNativeVersion: form.minNativeVersion.trim(),
    minProtocolVersion: CURRENT_PROTOCOL_VERSION,
    expectedReadinessVersion: currentReadiness.readinessVersion,
    reason
  })
  rolloutReason.value = ''
  ElMessage.success(`验奖状态已切换为 ${response.rolloutState}`)
  await loadReadiness(requestId)
}

const rotateCallbackKey = async () => {
  const currentReadiness = readiness.value
  const adAccountId = capabilityAdAccountId.value
  if (!currentReadiness || !adAccountId) return
  const reason = auditedReason(callbackRotation.reason, '轮换原因')
  if (!reason) return
  await ElMessageBox.confirm('新 Callback Key 只显示一次，确认现在轮换吗？', '轮换 Callback Key')
  callbackRotating.value = true
  try {
    callbackReveal.value = await TenantApi.rotateTenantCallbackKey(props.target, {
      adAccountId,
      expectedReadinessVersion: currentReadiness.readinessVersion,
      priorAcceptanceMinutes: callbackRotation.priorAcceptanceMinutes,
      reason
    })
    callbackRotation.reason = ''
    callbackRevealVisible.value = true
    await loadReadiness(requestId)
  } catch (error) {
    ElMessage.error(errorText(error, 'Callback Key 轮换失败'))
  } finally {
    callbackRotating.value = false
  }
}

const rotateRewardSecret = async () => {
  const currentReadiness = readiness.value
  const adAccountId = capabilityAdAccountId.value
  if (!currentReadiness || !adAccountId) return
  const rewardSecret = rewardRotation.rewardSecret.trim()
  const reason = auditedReason(rewardRotation.reason, '轮换原因')
  if (!reason) return
  if (rewardSecret.length < 8 || rewardSecret.length > 2048) {
    ElMessage.warning('奖励回调密钥长度必须为 8–2048 个字符')
    return
  }
  await ElMessageBox.confirm('新奖励回调密钥不会被服务端回显，确认现在轮换吗？', '轮换奖励回调密钥')
  rewardRotating.value = true
  try {
    const response = await TenantApi.rotateTenantRewardSecret(props.target, {
      adAccountId,
      expectedReadinessVersion: currentReadiness.readinessVersion,
      priorAcceptanceMinutes: rewardRotation.priorAcceptanceMinutes,
      rewardSecret,
      reason
    })
    rewardRotation.rewardSecret = ''
    rewardRotation.reason = ''
    ElMessage.success(`奖励回调密钥已轮换为 v${response.version}；输入框已清空`)
    await loadReadiness(requestId)
  } catch (error) {
    ElMessage.error(errorText(error, '奖励回调密钥轮换失败'))
  } finally {
    rewardRotating.value = false
  }
}

const copyCallbackBundle = async () => {
  const reveal = callbackReveal.value
  if (!reveal) return
  await copyToClipboard(
    `Callback Key: ${reveal.callbackKey}\n奖励回调 URL: ${reveal.rewardCallbackUrl}\n展示回调 URL: ${reveal.impressionCallbackUrl}`
  )
  ElMessage.success('回调配置已复制')
}

function clearCallbackReveal() {
  callbackRevealVisible.value = false
  callbackReveal.value = undefined
}

const saveReporting = async () => {
  const form = reportingForm.value
  if (!form) return
  const reason = form.reason.trim()
  if (reason.length < 10 || reason.length > 500) {
    ElMessage.warning('变更原因必须为 10–500 个字符')
    return
  }
  reportingSaving.value = true
  try {
    const publisherKey = form.publisherKey.trim()
    const response = await TenantApi.saveTenantReportingConfiguration(props.target, {
      credentialVersion: form.credentialVersion,
      ...(publisherKey ? { publisherKey } : {}),
      reportTimezone: form.reportTimezone,
      currency: form.currency.trim().toUpperCase(),
      amountScale: form.amountScale,
      adFormat: 'rewarded_video',
      reason
    })
    reportingForm.value = sanitizeReportingConfiguration(response)
    ElMessage.success('报表配置已保存；Publisher Key 输入已清空')
    await loadReadiness(requestId)
  } catch (error) {
    ElMessage.error(errorText(error, 'Taku 报表配置保存失败'))
  } finally {
    reportingSaving.value = false
  }
}

watch(() => `${props.target.kind}:${props.target.tenantId}`, reload, { immediate: true })
</script>
