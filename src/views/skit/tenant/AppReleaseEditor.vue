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
    <el-form-item label="当前原生版本">
      <el-input v-model="formData.nativeVersion" placeholder="仅供发布记录" />
    </el-form-item>
    <el-form-item label="原生包名">
      <el-input v-model="formData.nativePackage" placeholder="仅供发布记录，不填写任何密钥" />
    </el-form-item>
    <el-form-item label="是否启用" prop="status">
      <el-radio-group v-model="formData.status">
        <el-radio :value="0">启用</el-radio>
        <el-radio :value="1">关闭</el-radio>
      </el-radio-group>
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
const emptyProfile = (): TenantApi.TenantAppReleaseProfileVO => ({
  tenantId: props.tenantId,
  profileCode: '',
  channel: 'production',
  minNativeVersion: '',
  hotVersion: '',
  hotBundleUrl: '',
  hotBundleSha256: '',
  nativeVersion: '',
  nativePackage: '',
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
  ]
})

const load = async () => {
  loading.value = true
  try {
    const profile = await TenantApi.getTenantAppReleaseProfile(props.tenantId)
    formData.value = { ...emptyProfile(), ...profile, tenantId: props.tenantId }
  } finally {
    loading.value = false
  }
}

const save = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  saving.value = true
  try {
    formData.value = await TenantApi.updateTenantAppReleaseProfile({
      ...formData.value,
      hotBundleSha256: formData.value.hotBundleSha256.toLowerCase()
    })
    message.success('发布档案已保存')
  } finally {
    saving.value = false
  }
}

watch(() => props.tenantId, load, { immediate: true })
</script>
