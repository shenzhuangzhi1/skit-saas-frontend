<template>
  <el-alert
    class="mb-16px"
    :closable="false"
    show-icon
    type="info"
    title="热更新只更新前端业务包；穿山甲/Taku SDK、包名与签名变更必须重新构建该代理商的原生 APK。"
  />
  <el-skeleton v-if="loading" :rows="8" animated />
  <el-form
    v-else
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
      <el-button type="primary" :loading="saving" @click="save">保存发布档案</el-button>
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
const saving = ref(false)
const formRef = ref<FormInstance>()
const reason = ref('')
const emptyProfile = (): TenantApi.TenantAppReleaseProfileVO => ({
  tenantId: props.tenantId,
  profileCode: '',
  channel: 'production',
  minNativeVersion: '',
  hotVersion: '',
  hotBundleUrl: '',
  hotBundleSha256: '',
  hotReleaseNo: 0,
  hotManifestSignature: '',
  nativeVersion: '',
  nativePackage: '',
  nativeProtocolVersion: 1,
  runtimeUpdatePublicKey: '',
  runtimeUpdateKeyFingerprint: '',
  status: 1
})
const formData = ref<TenantApi.TenantAppReleaseProfileVO>(emptyProfile())
const requiredWhenEnabled = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (formData.value.status === 0 && !String(value || '').trim()) {
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
  loading.value = true
  try {
    const profile = await TenantApi.getTenantAppReleaseProfile(props.tenantId)
    formData.value = { ...emptyProfile(), ...profile, tenantId: props.tenantId }
    reason.value = ''
  } finally {
    loading.value = false
  }
}

const save = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  const normalizedReason = reason.value.trim()
  if (normalizedReason.length < 10 || normalizedReason.length > 500) {
    message.warning('变更原因长度必须为 10–500 个字符')
    return
  }
  saving.value = true
  try {
    formData.value = await TenantApi.updateTenantAppReleaseProfile({
      ...formData.value,
      hotBundleSha256: formData.value.hotBundleSha256.toLowerCase(),
      hotManifestSignature: formData.value.hotManifestSignature.trim(),
      runtimeUpdatePublicKey: formData.value.runtimeUpdatePublicKey.trim(),
      reason: normalizedReason
    })
    reason.value = ''
    message.success('发布档案已保存')
  } finally {
    saving.value = false
  }
}

watch(() => props.tenantId, load, { immediate: true })
</script>
