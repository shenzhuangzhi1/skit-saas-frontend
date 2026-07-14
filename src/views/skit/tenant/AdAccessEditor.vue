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
              {{ accountForm.pangleSecretConfigured ? '密钥已配置' : '密钥未配置' }}
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
          <el-form-item label="App Secret">
            <InputPassword
              v-model="accountForm.pangleAppSecret"
              autocomplete="new-password"
              maxlength="2048"
              :placeholder="
                accountForm.pangleSecretConfigured ? '留空保留已配置密钥' : '输入新密钥'
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
        <AdReadinessChecklist v-if="readiness" :readiness="readiness" />
      </AsyncState>
    </ContentWrap>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import AsyncState from '@/views/skit/shared/AsyncState.vue'
import * as TenantApi from '@/api/skit/tenant'
import AdReadinessChecklist from './AdReadinessChecklist.vue'
import {
  buildAdAccountWritePayload,
  sanitizeAdAccountResponse,
  sanitizeReportingConfiguration,
  type ManagementTenantTarget,
  type SafeAdAccountForm,
  type SafeReportingConfigurationForm
} from './workspaceModel'

defineOptions({ name: 'SkitTenantAdAccessEditor' })

const props = defineProps<{ target: ManagementTenantTarget }>()
const accountForm = ref<SafeAdAccountForm>()
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
let requestId = 0

const errorText = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

const loadAccount = async (currentRequestId: number) => {
  accountLoading.value = true
  accountError.value = ''
  accountForm.value = undefined
  try {
    const response = await TenantApi.getManagedTenantAdAccount(props.target)
    if (currentRequestId !== requestId) return
    accountForm.value = sanitizeAdAccountResponse(response)
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
  void loadAccount(currentRequestId)
  void loadReadiness(currentRequestId)
  void loadReporting(currentRequestId)
}

const saveAccount = async () => {
  if (!accountForm.value) return
  saving.value = true
  try {
    const payload = buildAdAccountWritePayload(accountForm.value, props.target)
    const response = await TenantApi.saveManagedTenantAdAccount(props.target, payload)
    accountForm.value = sanitizeAdAccountResponse(response)
    ElMessage.success('广告账号已保存；输入框中的密钥已清空')
    await loadReadiness(requestId)
  } catch (error) {
    ElMessage.error(errorText(error, '广告账号保存失败'))
  } finally {
    saving.value = false
  }
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
