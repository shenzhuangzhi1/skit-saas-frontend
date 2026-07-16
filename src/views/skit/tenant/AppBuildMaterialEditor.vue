<template>
  <el-alert
    class="mb-16px"
    :closable="false"
    show-icon
    type="info"
    title="APK 暂由本地 Mac 构建，本页面只保存租户构建资料；不会在 SaaS 服务器或 GitHub Actions 上打包。"
  />
  <el-alert
    v-if="material"
    class="mb-16px"
    :closable="false"
    show-icon
    type="success"
  >
    <template #title>
      构建资料版本 {{ material.materialVersion || '未保存' }} ·
      {{ material.verifiedAt ? `最近校验 ${formatTime(material.verifiedAt)}` : '尚未保存' }}
    </template>
    <div class="mt-4px flex flex-wrap gap-8px">
      <el-tag :type="material.appReleaseProfileConfigured ? 'success' : 'warning'" size="small">
        {{ material.appReleaseProfileConfigured ? 'App 发布档案已配置' : '请先配置 App 发布档案' }}
      </el-tag>
      <el-tag :type="material.takuAppKeyConfigured ? 'success' : 'warning'" size="small">
        {{ material.takuAppKeyConfigured ? 'Taku App Key 已配置' : 'Taku App Key 未配置' }}
      </el-tag>
      <el-tag :type="material.takuAccountConfigured ? 'success' : 'warning'" size="small">
        {{ material.takuAccountConfigured ? 'Taku 账号已配置' : 'Taku 账号未完整配置' }}
      </el-tag>
      <el-tag :type="material.pangleSettingsConfigured ? 'success' : 'warning'" size="small">
        {{ material.pangleSettingsConfigured ? '穿山甲设置已配置' : '穿山甲设置未配置' }}
      </el-tag>
      <el-tag :type="material.signingConfigured ? 'success' : 'warning'" size="small">
        {{ material.signingConfigured ? '发布签名已配置' : '发布签名未配置' }}
      </el-tag>
    </div>
  </el-alert>

  <el-skeleton v-if="loading" :rows="10" animated />
  <el-form
    v-else
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="170px"
    class="max-w-900px"
  >
    <el-form-item label="API HTTPS 地址" prop="apiBaseUrl">
      <el-input v-model="formData.apiBaseUrl" placeholder="例如 https://api.example.com" />
    </el-form-item>
    <el-form-item label="应用名称" prop="appName">
      <el-input v-model="formData.appName" maxlength="128" placeholder="打包后显示的应用名称" />
    </el-form-item>
    <el-form-item label="原生 versionCode" prop="nativeVersionCode">
      <el-input-number v-model="formData.nativeVersionCode" :min="1" :max="2100000000" :precision="0" />
    </el-form-item>
    <el-form-item label="原生 versionName" prop="nativeVersionName">
      <el-input v-model="formData.nativeVersionName" placeholder="例如 2.3.0" />
    </el-form-item>
    <el-form-item label="运行时发布序号" prop="runtimeReleaseNo">
      <el-input-number v-model="formData.runtimeReleaseNo" :min="1" :precision="0" />
      <span class="ml-12px text-12px text-gray-500">每次原生运行时变更必须递增</span>
    </el-form-item>
    <el-divider content-position="left">仅写入敏感资料</el-divider>
    <el-alert
      class="mb-16px"
      :closable="false"
      show-icon
      type="warning"
      title="密钥只写不读：留空表示保留服务端已保存的密文，保存成功后输入框会清空。"
    />
    <el-form-item label="穿山甲 SDK 设置 JSON">
      <el-input
        v-model="secrets.pangleSettingsJson"
        :autosize="{ minRows: 5, maxRows: 12 }"
        placeholder="粘贴穿山甲设置文件 JSON；已有配置可留空保留"
        type="textarea"
      />
    </el-form-item>
    <el-form-item label="发布 keystore Base64">
      <el-input
        v-model="secrets.releaseKeystoreBase64"
        :autosize="{ minRows: 3, maxRows: 8 }"
        placeholder="粘贴 release keystore 的 Base64；已有配置可留空保留"
        type="textarea"
      />
    </el-form-item>
    <el-form-item label="store password">
      <el-input v-model="secrets.storePassword" show-password placeholder="已有配置可留空保留" />
    </el-form-item>
    <el-form-item label="key alias">
      <el-input v-model="secrets.keyAlias" placeholder="已有配置可留空保留" />
    </el-form-item>
    <el-form-item label="key password">
      <el-input v-model="secrets.keyPassword" show-password placeholder="已有配置可留空保留" />
    </el-form-item>
    <el-form-item label="变更原因" prop="reason">
      <el-input
        v-model="formData.reason"
        maxlength="500"
        placeholder="必填 10–500 字，用于安全审计"
        show-word-limit
        type="textarea"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" :loading="saving" @click="save">保存构建资料版本</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitAppBuildMaterialEditor' })

const props = defineProps<{ tenantId: number }>()
const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const material = ref<TenantApi.TenantAppBuildMaterialVO>()

type BuildForm = {
  tenantId: number
  apiBaseUrl: string
  appName: string
  nativeVersionCode: number
  nativeVersionName: string
  runtimeReleaseNo: number
  reason: string
}

const emptyForm = (): BuildForm => ({
  tenantId: props.tenantId,
  apiBaseUrl: '',
  appName: '',
  nativeVersionCode: 1,
  nativeVersionName: '',
  runtimeReleaseNo: 1,
  reason: ''
})
const formData = ref<BuildForm>(emptyForm())
const secrets = reactive({
  pangleSettingsJson: '',
  releaseKeystoreBase64: '',
  storePassword: '',
  keyAlias: '',
  keyPassword: ''
})

const rules = reactive<FormRules<BuildForm>>({
  apiBaseUrl: [
    { required: true, message: 'API 地址不能为空', trigger: 'blur' },
    { pattern: /^https:\/\/[^\s]+$/i, message: 'API 地址必须使用 HTTPS', trigger: 'blur' }
  ],
  appName: [{ required: true, min: 1, max: 128, message: '应用名称长度必须为 1–128 个字符', trigger: 'blur' }],
  nativeVersionCode: [
    { required: true, type: 'integer', min: 1, max: 2100000000, message: 'versionCode 必须是 1–2100000000 的整数', trigger: 'change' }
  ],
  nativeVersionName: [
    { required: true, pattern: /^\d+(\.\d+){1,3}([.-][A-Za-z0-9._-]+)?$/, message: '版本号格式例如 2.3.0', trigger: 'blur' }
  ],
  runtimeReleaseNo: [
    { required: true, type: 'integer', min: 1, message: '运行时发布序号必须是正整数', trigger: 'change' }
  ],
  reason: [{ required: true, min: 10, max: 500, message: '变更原因长度必须为 10–500 个字符', trigger: 'blur' }]
})

const formatTime = (value: string) => value.replace('T', ' ').replace(/\.\d+$/, '')

const load = async () => {
  loading.value = true
  try {
    const response = await TenantApi.getTenantAppBuildMaterial(props.tenantId)
    material.value = response
    formData.value = {
      tenantId: props.tenantId,
      apiBaseUrl: response.apiBaseUrl || '',
      appName: response.appName || '',
      nativeVersionCode: response.nativeVersionCode || 1,
      nativeVersionName: response.nativeVersionName || '',
      runtimeReleaseNo: Math.max(response.runtimeReleaseNo || 1, 1),
      reason: ''
    }
    Object.assign(secrets, {
      pangleSettingsJson: '',
      releaseKeystoreBase64: '',
      storePassword: '',
      keyAlias: '',
      keyPassword: ''
    })
  } finally {
    loading.value = false
  }
}

const save = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  const reason = formData.value.reason.trim()
  if (reason.length < 10 || reason.length > 500) {
    message.warning('变更原因长度必须为 10–500 个字符')
    return
  }
  saving.value = true
  try {
    const response = await TenantApi.updateTenantAppBuildMaterial({
      ...formData.value,
      apiBaseUrl: formData.value.apiBaseUrl.trim(),
      appName: formData.value.appName.trim(),
      nativeVersionName: formData.value.nativeVersionName.trim(),
      pangleSettingsJson: secrets.pangleSettingsJson.trim(),
      releaseKeystoreBase64: secrets.releaseKeystoreBase64.replace(/\s+/g, ''),
      storePassword: secrets.storePassword,
      keyAlias: secrets.keyAlias.trim(),
      keyPassword: secrets.keyPassword,
      reason
    })
    material.value = response
    formData.value.reason = ''
    Object.assign(secrets, {
      pangleSettingsJson: '',
      releaseKeystoreBase64: '',
      storePassword: '',
      keyAlias: '',
      keyPassword: ''
    })
    message.success(`构建资料版本 ${response.materialVersion} 已保存`)
  } finally {
    saving.value = false
  }
}

watch(() => props.tenantId, load, { immediate: true })
</script>
