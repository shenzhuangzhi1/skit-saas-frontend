<template>
  <ContentWrap>
    <div class="mb-16px flex flex-wrap items-start justify-between gap-12px">
      <div>
        <div class="text-18px font-600">收益报表</div>
        <div class="mt-4px text-13px text-[var(--el-text-color-secondary)]">
          配置 Taku 官方收益对账口径。Publisher Key 只写不读，官方报表确认前收益不能进入可结算余额。
        </div>
      </div>
      <el-button :disabled="!form || saving" :loading="saving" type="primary" @click="save">
        保存报表配置
      </el-button>
    </div>

    <AsyncState :empty="!form" empty-text="暂无报表配置" :error="error" :loading="loading">
      <el-form v-if="form" label-width="150px">
        <div class="mb-14px flex flex-wrap gap-8px">
          <el-tag :type="form.credentialConfigured ? 'success' : 'info'">
            {{
              form.credentialConfigured
                ? `Publisher Key 已配置 · v${form.credentialVersion}`
                : 'Publisher Key 未配置'
            }}
          </el-tag>
          <el-tag :type="form.permissionVerifiedAt ? 'success' : 'warning'">
            {{ form.permissionVerifiedAt ? '报表权限已验证' : '报表权限待验证' }}
          </el-tag>
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Taku App ID">
              <el-input :model-value="form.appId" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="激励视频广告位">
              <el-input :model-value="form.placementId" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="广告格式">
              <el-input model-value="rewarded_video" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报表时区" required>
              <el-select v-model="form.reportTimezone" class="w-full" :disabled="saving">
                <el-option label="UTC-8" value="UTC-8" />
                <el-option label="UTC+8" value="UTC+8" />
                <el-option label="UTC+0" value="UTC+0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="ISO 币种" required>
              <el-input
                v-model="form.currency"
                :disabled="saving"
                maxlength="3"
                placeholder="USD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额精度" required>
              <el-input-number
                v-model="form.amountScale"
                :disabled="saving"
                :max="18"
                :min="0"
                :precision="0"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Publisher Key" :required="!form.credentialConfigured">
              <InputPassword
                v-model="form.publisherKey"
                autocomplete="new-password"
                :disabled="saving"
                maxlength="4096"
                :placeholder="
                  form.credentialConfigured
                    ? '留空保留当前 Publisher Key'
                    : '首次配置时必须填写 Publisher Key'
                "
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="变更原因" required>
              <el-input
                v-model="form.reason"
                :disabled="saving"
                maxlength="500"
                placeholder="必填 10–500 字，用于跨租户代管和安全审计"
                :rows="3"
                show-word-limit
                type="textarea"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </AsyncState>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import AsyncState from '@/views/skit/shared/AsyncState.vue'
import * as TenantApi from '@/api/skit/tenant'
import {
  sanitizeReportingConfiguration,
  type ManagementTenantTarget,
  type SafeReportingConfigurationForm
} from './workspaceModel'

defineOptions({ name: 'SkitTenantReportingEditor' })

const props = defineProps<{ target: ManagementTenantTarget }>()
const form = ref<SafeReportingConfigurationForm>()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
let requestId = 0
let saveId = 0

const errorText = (cause: unknown, fallback: string) =>
  cause instanceof Error && cause.message ? cause.message : fallback
const reportingDraftSignature = (value: SafeReportingConfigurationForm) =>
  JSON.stringify({
    reportTimezone: value.reportTimezone,
    currency: value.currency,
    amountScale: value.amountScale,
    credentialVersion: value.credentialVersion,
    publisherKey: value.publisherKey,
    reason: value.reason
  })

const load = async () => {
  const currentRequestId = ++requestId
  const target = { ...props.target }
  saveId += 1
  saving.value = false
  loading.value = true
  error.value = ''
  form.value = undefined
  try {
    const response = await TenantApi.getTenantReportingConfiguration(target)
    if (currentRequestId !== requestId) return
    form.value = sanitizeReportingConfiguration(response, target.tenantId)
  } catch (cause) {
    if (currentRequestId !== requestId) return
    error.value = errorText(cause, 'Taku 报表配置加载失败')
  } finally {
    if (currentRequestId === requestId) loading.value = false
  }
}

const save = async () => {
  const current = form.value
  if (!current) return
  const publisherKey = current.publisherKey.trim()
  const currency = current.currency.trim().toUpperCase()
  const reason = current.reason.trim()
  if (!current.credentialConfigured && !publisherKey) {
    ElMessage.warning('首次配置收益报表时 Publisher Key 不能为空')
    return
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    ElMessage.warning('ISO 币种必须是三个大写字母')
    return
  }
  if (
    !Number.isInteger(current.amountScale) ||
    current.amountScale < 0 ||
    current.amountScale > 18
  ) {
    ElMessage.warning('金额精度必须是 0–18 的整数')
    return
  }
  if (reason.length < 10 || reason.length > 500) {
    ElMessage.warning('变更原因必须为 10–500 个字符')
    return
  }
  const currentRequestId = requestId
  const currentSaveId = ++saveId
  const target = { ...props.target }
  const draftSignature = reportingDraftSignature(current)
  saving.value = true
  try {
    const response = await TenantApi.saveTenantReportingConfiguration(target, {
      credentialVersion: current.credentialVersion,
      ...(publisherKey ? { publisherKey } : {}),
      reportTimezone: current.reportTimezone,
      currency,
      amountScale: current.amountScale,
      adFormat: 'rewarded_video',
      reason
    })
    if (currentRequestId !== requestId || currentSaveId !== saveId) return
    if (!form.value || reportingDraftSignature(form.value) !== draftSignature) {
      ElMessage.warning('保存期间表单已变化，已保留当前编辑内容，请重新保存')
      return
    }
    form.value = sanitizeReportingConfiguration(response, target.tenantId)
    ElMessage.success('收益报表配置已保存；Publisher Key 输入已清空')
  } catch (cause) {
    if (currentRequestId !== requestId || currentSaveId !== saveId) return
    ElMessage.error(errorText(cause, 'Taku 报表配置保存失败'))
  } finally {
    if (currentRequestId === requestId && currentSaveId === saveId) {
      saving.value = false
    }
  }
}

watch(() => `${props.target.kind}:${props.target.tenantId}`, load, { immediate: true })
</script>
