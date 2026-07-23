<template>
  <el-alert
    class="mb-16px"
    :closable="false"
    show-icon
    type="info"
    title="热更新只更新前端业务包；穿山甲/Taku SDK、包名与签名变更必须重新构建该代理商的原生 APK。"
  />
  <el-skeleton v-if="loading" :rows="8" animated />
  <section
    v-else-if="loadError"
    class="max-w-760px rounded-8px border border-[var(--el-color-danger-light-7)] bg-[var(--el-color-danger-light-9)] p-20px"
    data-testid="app-release-profile-load-error"
    role="alert"
  >
    <div class="text-16px font-600 text-[var(--el-color-danger)]">发布档案加载失败</div>
    <p class="mb-16px mt-6px text-14px text-[var(--el-text-color-secondary)]">
      {{ loadError }}
    </p>
    <el-button type="primary" @click="load">重新加载</el-button>
  </section>
  <section
    v-else-if="notFound"
    class="max-w-760px rounded-8px border border-[var(--el-color-warning-light-7)] bg-[var(--el-color-warning-light-9)] p-20px"
    data-testid="app-release-profile-not-found"
    role="status"
  >
    <div class="text-16px font-600 text-[var(--el-color-warning)]">未找到发布档案</div>
    <p class="mb-16px mt-6px text-14px text-[var(--el-text-color-secondary)]">
      当前代理商尚未创建 App 发布档案，请先由服务端完成初始化。
    </p>
    <el-button @click="load">重新加载</el-button>
  </section>
  <el-form
    v-else-if="loaded && formData"
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="150px"
    class="max-w-760px"
  >
    <el-form-item label="发布档案代码">
      <el-input v-model="formData.profileCode" disabled />
    </el-form-item>
    <el-form-item label="发布渠道" prop="channel">
      <el-select v-model="formData.channel" class="w-220px">
        <el-option label="生产" value="production" />
        <el-option label="预发布" value="staging" />
      </el-select>
    </el-form-item>
    <el-form-item label="最低原生版本" prop="minNativeVersion">
      <el-input v-model="formData.minNativeVersion" placeholder="例如 2026.07.10" />
    </el-form-item>
    <el-form-item label="热更新版本" prop="hotVersion">
      <el-input v-model="formData.hotVersion" placeholder="例如 2.3.0" />
    </el-form-item>
    <el-form-item label="热更新包 HTTPS 地址" prop="hotBundleUrl">
      <el-input
        v-model="formData.hotBundleUrl"
        placeholder="https://updates.example.com/.../2.3.0.zip"
      />
    </el-form-item>
    <el-form-item label="包 SHA-256" prop="hotBundleSha256">
      <el-input v-model="formData.hotBundleSha256" placeholder="64 位十六进制 SHA-256" />
    </el-form-item>
    <el-form-item label="热更新发布序号" prop="hotReleaseNo">
      <el-input-number v-model="formData.hotReleaseNo" :min="0" :precision="0" />
      <span class="ml-12px text-12px text-gray-500">签名范围或公钥变更时必须递增</span>
    </el-form-item>
    <el-form-item label="租户热更新 RSA 公钥" prop="runtimeUpdatePublicKey">
      <el-input
        v-model="formData.runtimeUpdatePublicKey"
        :autosize="{ minRows: 3, maxRows: 7 }"
        maxlength="4096"
        placeholder="该代理商 APK 内置公钥的 X.509 DER Base64；每个代理商独立配置"
        show-word-limit
        type="textarea"
      />
    </el-form-item>
    <el-form-item label="公钥指纹">
      <el-input
        v-model="formData.runtimeUpdateKeyFingerprint"
        disabled
        placeholder="保存后由服务端校验公钥并生成 SHA-256 指纹"
      />
    </el-form-item>
    <el-form-item label="热更新清单签名" prop="hotManifestSignature">
      <el-input
        v-model="formData.hotManifestSignature"
        :autosize="{ minRows: 3, maxRows: 6 }"
        maxlength="1024"
        placeholder="CI 使用该代理商私钥生成的 SHA256withRSA Base64 签名"
        show-word-limit
        type="textarea"
      />
    </el-form-item>
    <el-form-item label="当前原生版本">
      <el-input v-model="formData.nativeVersion" placeholder="仅供发布记录" />
    </el-form-item>
    <el-form-item label="原生包名">
      <el-input v-model="formData.nativePackage" placeholder="仅供发布记录，不填写任何密钥" />
    </el-form-item>
    <el-form-item label="原生协议版本" prop="nativeProtocolVersion">
      <el-input-number v-model="formData.nativeProtocolVersion" :min="1" :precision="0" />
    </el-form-item>
    <el-form-item label="是否启用" prop="status">
      <el-radio-group v-model="formData.status">
        <el-radio :value="0">启用</el-radio>
        <el-radio :value="1">关闭</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="变更原因" required>
      <el-input
        v-model="reason"
        maxlength="500"
        placeholder="必填 10–500 字，用于安全审计"
        show-word-limit
        type="textarea"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" :disabled="!loaded || !formData" :loading="saving" @click="save">
        保存发布档案
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitAppReleaseEditor' })

const props = defineProps<{ tenantId: number }>()
const message = useMessage()
const loading = ref(false)
const loaded = ref(false)
const loadError = ref('')
const notFound = ref(false)
const loadSequence = ref(0)
const saving = ref(false)
const saveSequence = ref(0)
const formRef = ref<FormInstance>()
const reason = ref('')
const formData = ref<TenantApi.TenantAppReleaseProfileVO | null>(null)

const releaseProfileStringFields = [
  'profileCode',
  'minNativeVersion',
  'hotVersion',
  'hotBundleUrl',
  'hotBundleSha256',
  'hotManifestSignature',
  'nativeVersion',
  'nativePackage',
  'runtimeUpdatePublicKey',
  'runtimeUpdateKeyFingerprint'
] as const

const isTenantAppReleaseProfile = (
  value: unknown,
  tenantId: number
): value is TenantApi.TenantAppReleaseProfileVO => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const profile = value as Record<string, unknown>
  return (
    profile.tenantId === tenantId &&
    Number.isInteger(profile.tenantId) &&
    releaseProfileStringFields.every((field) => typeof profile[field] === 'string') &&
    (profile.channel === 'production' || profile.channel === 'staging') &&
    Number.isInteger(profile.hotReleaseNo) &&
    Number(profile.hotReleaseNo) >= 0 &&
    Number.isInteger(profile.nativeProtocolVersion) &&
    Number(profile.nativeProtocolVersion) >= 1 &&
    (profile.status === 0 || profile.status === 1)
  )
}

const requiredWhenEnabled = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (formData.value?.status === 0 && !String(value || '').trim()) {
    callback(new Error('启用前必须填写该项'))
    return
  }
  callback()
}
const rules = reactive<FormRules<TenantApi.TenantAppReleaseProfileVO>>({
  minNativeVersion: [{ validator: requiredWhenEnabled, trigger: 'blur' }],
  hotVersion: [{ validator: requiredWhenEnabled, trigger: 'blur' }],
  hotBundleUrl: [
    { validator: requiredWhenEnabled, trigger: 'blur' },
    { pattern: /^https:\/\//i, message: '热更新包必须使用 HTTPS', trigger: 'blur' }
  ],
  hotBundleSha256: [
    { validator: requiredWhenEnabled, trigger: 'blur' },
    { pattern: /^[a-f0-9]{64}$/i, message: 'SHA-256 必须为 64 位十六进制', trigger: 'blur' }
  ],
  runtimeUpdatePublicKey: [
    { validator: requiredWhenEnabled, trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9+/]+={0,2}$/,
      message: '公钥必须是无换行的 X.509 DER Base64',
      trigger: 'blur'
    },
    { min: 128, max: 4096, message: '公钥长度必须为 128–4096 个字符', trigger: 'blur' }
  ],
  hotManifestSignature: [{ validator: requiredWhenEnabled, trigger: 'blur' }],
  nativeProtocolVersion: [
    { required: true, message: '原生协议版本不能为空', trigger: 'change' },
    { type: 'integer', min: 1, message: '原生协议版本必须是正整数', trigger: 'change' }
  ]
})

const load = async () => {
  const sequence = loadSequence.value + 1
  const tenantId = props.tenantId
  loadSequence.value = sequence
  saveSequence.value += 1
  saving.value = false
  loading.value = true
  loaded.value = false
  loadError.value = ''
  notFound.value = false
  formData.value = null
  try {
    const profile = await TenantApi.getTenantAppReleaseProfile(tenantId)
    if (sequence !== loadSequence.value) return
    if (profile === null) {
      notFound.value = true
      return
    }
    if (!isTenantAppReleaseProfile(profile, tenantId)) {
      throw new Error('Invalid app release profile response')
    }
    formData.value = { ...profile }
    reason.value = ''
    loaded.value = true
  } catch {
    if (sequence !== loadSequence.value) return
    formData.value = null
    loaded.value = false
    notFound.value = false
    loadError.value = '暂时无法读取发布档案，请稍后重试。'
  } finally {
    if (sequence === loadSequence.value) {
      loading.value = false
    }
  }
}

const save = async () => {
  const profile = formData.value
  if (!loaded.value || !profile) return
  const tenantId = props.tenantId
  const sequence = loadSequence.value
  const valid = await formRef.value?.validate()
  if (!valid) return
  if (tenantId !== props.tenantId || sequence !== loadSequence.value) return
  const normalizedReason = reason.value.trim()
  if (normalizedReason.length < 10 || normalizedReason.length > 500) {
    message.warning('变更原因长度必须为 10–500 个字符')
    return
  }
  const saveId = saveSequence.value + 1
  saveSequence.value = saveId
  saving.value = true
  try {
    const response = await TenantApi.updateTenantAppReleaseProfile({
      ...profile,
      hotBundleSha256: profile.hotBundleSha256.toLowerCase(),
      hotManifestSignature: profile.hotManifestSignature.trim(),
      runtimeUpdatePublicKey: profile.runtimeUpdatePublicKey.trim(),
      reason: normalizedReason
    })
    if (
      saveId !== saveSequence.value ||
      tenantId !== props.tenantId ||
      sequence !== loadSequence.value
    ) {
      return
    }
    if (!isTenantAppReleaseProfile(response, tenantId)) {
      message.warning('服务端未返回完整发布档案，请重新加载确认')
      return
    }
    formData.value = { ...response }
    reason.value = ''
    message.success('发布档案已保存')
  } finally {
    if (saveId === saveSequence.value) {
      saving.value = false
    }
  }
}

watch(() => props.tenantId, load, { immediate: true })
</script>
