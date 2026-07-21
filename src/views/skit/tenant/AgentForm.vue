<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="820px" @closed="clearSensitiveFields">
    <el-alert
      v-if="isArchived"
      class="mb-16px"
      :closable="false"
      show-icon
      title="该代理商已归档，当前仅供只读查看。请先在代理商列表恢复后再修改。"
      type="warning"
    />
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :disabled="isArchived"
      :model="formData"
      :rules="formRules"
      label-width="130px"
    >
      <el-tabs>
        <el-tab-pane label="代理商信息">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="代理商名称" prop="name">
                <el-input
                  v-model="formData.name"
                  maxlength="30"
                  placeholder="请输入代理商名称"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                :label="formType === 'create' ? '登录手机号' : '管理员手机号'"
                prop="mobile"
              >
                <el-input
                  v-model="formData.mobile"
                  :disabled="formType === 'update'"
                  maxlength="11"
                  placeholder="请输入 11 位登录手机号"
                />
                <el-text v-if="formType === 'update'" class="mt-4px" size="small" type="info">
                  手机号需通过列表中的“换绑手机号”单独修改
                </el-text>
              </el-form-item>
            </el-col>
            <el-col v-if="formType === 'create'" :span="12">
              <el-form-item label="初始密码" prop="password">
                <InputPassword
                  v-model="formData.password"
                  autocomplete="new-password"
                  maxlength="16"
                  placeholder="请输入 4–16 位初始密码"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="有效期" prop="expireDate">
                <el-date-picker
                  v-model="formData.expireDate"
                  class="!w-full"
                  :disabled-date="disablePastDate"
                  placeholder="请选择有效期日期"
                  type="date"
                  value-format="YYYY-MM-DD"
                />
                <el-text class="mt-4px" size="small" type="info">
                  将按所选日期当天 23:59:59 提交
                </el-text>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                :label="formType === 'create' ? '创建后立即启用' : '代理商状态'"
                prop="status"
              >
                <el-switch
                  v-model="formData.status"
                  :active-value="CommonStatusEnum.ENABLE"
                  inactive-text="停用"
                  :inactive-value="CommonStatusEnum.DISABLE"
                  inline-prompt
                  active-text="启用"
                />
              </el-form-item>
            </el-col>
            <el-col v-if="formType === 'update'" :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input
                  v-model="formData.remark"
                  maxlength="500"
                  :rows="3"
                  placeholder="可选，最多 500 个字符"
                  show-word-limit
                  type="textarea"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane v-if="formType === 'create'" label="穿山甲（可选）">
          <el-alert
            class="mb-18px"
            :closable="false"
            show-icon
            title="启用后必须完整填写账号、App ID、内容接口 Server Key 和广告位；Server Key 不会从服务端回显。"
            type="info"
          />
          <div class="mb-16px flex items-center justify-between gap-12px">
            <div class="flex items-center gap-10px">
              <span>启用穿山甲</span>
              <el-switch
                v-model="formData.pangleEnabled"
                @change="handleProviderToggle('PANGLE')"
              />
              <el-tag v-if="formData.pangleSecretConfigured" size="small" type="success">
                密钥已配置（Server Key）
              </el-tag>
              <el-tag v-else size="small" type="info">密钥未配置（Server Key）</el-tag>
            </div>
            <el-button
              v-if="canClearPangle"
              :loading="clearingProvider === 'PANGLE'"
              plain
              type="danger"
              @click="clearProviderCredentials('PANGLE')"
            >
              清除穿山甲 Server Key
            </el-button>
          </div>
          <template v-if="formData.pangleEnabled">
            <el-form-item label="账号" prop="pangleUsername">
              <el-input
                v-model="formData.pangleUsername"
                maxlength="128"
                placeholder="请输入穿山甲账号"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="App ID" prop="pangleAppId">
              <el-input
                v-model="formData.pangleAppId"
                maxlength="128"
                placeholder="请输入穿山甲 App ID"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="Server Key" prop="pangleAppSecret">
              <InputPassword
                v-model="formData.pangleAppSecret"
                autocomplete="new-password"
                maxlength="2048"
                :placeholder="secretPlaceholder(formData.pangleSecretConfigured)"
              />
              <el-text
                v-if="formData.pangleSecretConfigured"
                class="mt-4px"
                size="small"
                type="success"
              >
                已配置；留空保存会保留原 Server Key
              </el-text>
            </el-form-item>
            <el-form-item label="广告位 ID" prop="panglePlacementId">
              <el-input
                v-model="formData.panglePlacementId"
                maxlength="128"
                placeholder="请输入穿山甲广告位 ID"
                show-word-limit
              />
            </el-form-item>
          </template>
          <el-empty v-else :image-size="64" description="穿山甲未启用，可直接保存代理商" />
        </el-tab-pane>

        <el-tab-pane v-if="formType === 'create'" label="Taku（可选）">
          <el-alert
            class="mb-18px"
            :closable="false"
            show-icon
            title="启用后必须完整填写账号、App ID、客户端 App Key 和广告位；S2S Secret 始终可选。"
            type="info"
          />
          <div class="mb-16px flex items-center justify-between gap-12px">
            <div class="flex items-center gap-10px">
              <span>启用 Taku</span>
              <el-switch v-model="formData.takuEnabled" @change="handleProviderToggle('TAKU')" />
              <el-tag v-if="formData.takuAppKeyConfigured" size="small" type="success">
                App Key 已配置
              </el-tag>
              <el-tag v-else size="small" type="info">App Key 未配置</el-tag>
            </div>
            <el-button
              v-if="canClearTaku"
              :loading="clearingProvider === 'TAKU'"
              plain
              type="danger"
              @click="clearProviderCredentials('TAKU')"
            >
              清除 Taku 密钥
            </el-button>
          </div>
          <template v-if="formData.takuEnabled">
            <el-form-item label="账号" prop="takuUsername">
              <el-input
                v-model="formData.takuUsername"
                maxlength="128"
                placeholder="请输入 Taku 账号"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="App ID" prop="takuAppId">
              <el-input
                v-model="formData.takuAppId"
                maxlength="128"
                placeholder="请输入 Taku App ID"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="客户端 App Key" prop="takuAppKey">
              <InputPassword
                v-model="formData.takuAppKey"
                autocomplete="new-password"
                maxlength="255"
                :placeholder="secretPlaceholder(formData.takuAppKeyConfigured)"
              />
              <el-text
                v-if="formData.takuAppKeyConfigured"
                class="mt-4px"
                size="small"
                type="success"
              >
                已配置；留空保存会保留原 App Key
              </el-text>
            </el-form-item>
            <el-form-item label="S2S Secret（可选）" prop="takuAppSecret">
              <InputPassword
                v-model="formData.takuAppSecret"
                autocomplete="new-password"
                maxlength="2048"
                :placeholder="secretPlaceholder(formData.takuSecretConfigured, true)"
              />
              <el-text
                v-if="formData.takuSecretConfigured"
                class="mt-4px"
                size="small"
                type="success"
              >
                已配置；留空保存会保留原 S2S Secret
              </el-text>
            </el-form-item>
            <el-form-item label="广告位 ID" prop="takuPlacementId">
              <el-input
                v-model="formData.takuPlacementId"
                maxlength="128"
                placeholder="请输入 Taku 广告位 ID"
                show-word-limit
              />
            </el-form-item>
          </template>
          <el-empty v-else :image-size="64" description="Taku 未启用，可直接保存代理商" />
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <el-button v-if="!isArchived" :disabled="formLoading" type="primary" @click="submitForm">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import type { FormInstance, FormRules } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import { CommonStatusEnum } from '@/utils/constants'
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitTenantAgentForm' })

interface AgentFormData {
  tenantId?: number
  archivedTime?: number | null
  name: string
  mobile: string
  password: string
  status: number
  expireDate: string
  remark: string
  pangleUsername: string
  pangleAppId: string
  pangleAppSecret: string
  panglePlacementId: string
  pangleEnabled: boolean
  pangleSecretConfigured: boolean
  takuUsername: string
  takuAppId: string
  takuAppKey: string
  takuAppSecret: string
  takuPlacementId: string
  takuEnabled: boolean
  takuAppKeyConfigured: boolean
  takuSecretConfigured: boolean
}

type ProviderConfiguredKey =
  | 'pangleSecretConfigured'
  | 'takuAppKeyConfigured'
  | 'takuSecretConfigured'

const { t } = useI18n()
const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const clearingProvider = ref<TenantApi.TenantAdProvider>()
const formType = ref<'create' | 'update'>('create')
const formRef = ref<FormInstance>()

const createEmptyForm = (): AgentFormData => ({
  tenantId: undefined,
  archivedTime: undefined,
  name: '',
  mobile: '',
  password: '',
  status: CommonStatusEnum.ENABLE,
  expireDate: '',
  remark: '',
  pangleUsername: '',
  pangleAppId: '',
  pangleAppSecret: '',
  panglePlacementId: '',
  pangleEnabled: false,
  pangleSecretConfigured: false,
  takuUsername: '',
  takuAppId: '',
  takuAppKey: '',
  takuAppSecret: '',
  takuPlacementId: '',
  takuEnabled: false,
  takuAppKeyConfigured: false,
  takuSecretConfigured: false
})

const formData = ref<AgentFormData>(createEmptyForm())
const isArchived = computed(() => Boolean(formData.value.archivedTime))
const canClearPangle = computed(
  () =>
    formType.value === 'update' &&
    !isArchived.value &&
    Boolean(formData.value.pangleSecretConfigured || formData.value.pangleEnabled)
)
const canClearTaku = computed(
  () =>
    formType.value === 'update' &&
    !isArchived.value &&
    Boolean(
      formData.value.takuAppKeyConfigured ||
      formData.value.takuSecretConfigured ||
      formData.value.takuEnabled
    )
)

const isBlank = (value?: string) => !String(value || '').trim()

const requiredOnCreate = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (formType.value === 'create' && isBlank(value)) {
    callback(new Error('创建代理商时不能为空'))
    return
  }
  callback()
}

const validMobileOnCreate = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (formType.value === 'create' && !/^1[3-9]\d{9}$/.test(String(value || ''))) {
    callback(new Error('请输入正确的 11 位手机号码'))
    return
  }
  callback()
}

const toEndOfDayTimestamp = (date: string) => {
  const [year, month, day] = String(date || '')
    .split('-')
    .map(Number)
  if (!year || !month || !day) return Number.NaN
  const endTime = new Date(year, month - 1, day, 23, 59, 59, 0)
  if (
    endTime.getFullYear() !== year ||
    endTime.getMonth() !== month - 1 ||
    endTime.getDate() !== day
  ) {
    return Number.NaN
  }
  return endTime.getTime()
}

const validateExpiry = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  const timestamp = toEndOfDayTimestamp(value)
  if (!Number.isFinite(timestamp)) {
    callback(new Error('请选择有效期日期'))
    return
  }
  if (timestamp <= Date.now()) {
    callback(new Error('有效期必须晚于当前时间'))
    return
  }
  callback()
}

const requiredWhenEnabled =
  (provider: TenantApi.TenantAdProvider, label: string) =>
  (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    const enabled =
      provider === 'PANGLE' ? formData.value.pangleEnabled : formData.value.takuEnabled
    if (enabled && isBlank(value)) {
      callback(new Error(`启用${provider === 'PANGLE' ? '穿山甲' : 'Taku'}时${label}不能为空`))
      return
    }
    callback()
  }

const requiredSecretWhenEnabled =
  (provider: TenantApi.TenantAdProvider, configuredKey: ProviderConfiguredKey, label: string) =>
  (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    const enabled =
      provider === 'PANGLE' ? formData.value.pangleEnabled : formData.value.takuEnabled
    if (enabled && isBlank(value) && !formData.value[configuredKey]) {
      callback(new Error(`启用${provider === 'PANGLE' ? '穿山甲' : 'Taku'}时${label}不能为空`))
      return
    }
    callback()
  }

const formRules = reactive<FormRules<AgentFormData>>({
  name: [
    { required: true, message: '代理商名称不能为空', trigger: 'blur' },
    { max: 30, message: '代理商名称不能超过 30 个字符', trigger: 'blur' }
  ],
  mobile: [
    { validator: requiredOnCreate, trigger: 'blur' },
    { validator: validMobileOnCreate, trigger: 'blur' }
  ],
  password: [
    { validator: requiredOnCreate, trigger: 'blur' },
    { min: 4, max: 16, message: '管理员密码长度为 4–16 位', trigger: 'blur' }
  ],
  expireDate: [{ validator: validateExpiry, trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  remark: [{ max: 500, message: '备注不能超过 500 个字符', trigger: 'blur' }],
  pangleUsername: [{ validator: requiredWhenEnabled('PANGLE', '账号'), trigger: 'blur' }],
  pangleAppId: [{ validator: requiredWhenEnabled('PANGLE', 'App ID'), trigger: 'blur' }],
  pangleAppSecret: [
    {
      validator: requiredSecretWhenEnabled('PANGLE', 'pangleSecretConfigured', 'Server Key'),
      trigger: 'blur'
    }
  ],
  panglePlacementId: [{ validator: requiredWhenEnabled('PANGLE', '广告位 ID'), trigger: 'blur' }],
  takuUsername: [{ validator: requiredWhenEnabled('TAKU', '账号'), trigger: 'blur' }],
  takuAppId: [{ validator: requiredWhenEnabled('TAKU', 'App ID'), trigger: 'blur' }],
  takuAppKey: [
    {
      validator: requiredSecretWhenEnabled('TAKU', 'takuAppKeyConfigured', '客户端 App Key'),
      trigger: 'blur'
    }
  ],
  takuPlacementId: [{ validator: requiredWhenEnabled('TAKU', '广告位 ID'), trigger: 'blur' }]
})

const secretPlaceholder = (configured: boolean, optional = false) => {
  if (configured) return '已配置；输入新值可替换'
  return optional ? '可选；请输入新凭证' : '请输入凭证'
}

const disablePastDate = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

const toDateOnly = (value: number) => {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

const applyAgent = (data: TenantApi.TenantAgentVO) => {
  formData.value = {
    tenantId: data.tenantId,
    archivedTime: data.archivedTime,
    name: data.name || '',
    mobile: data.mobile || '',
    password: '',
    status: data.status,
    expireDate: toDateOnly(data.expireTime),
    remark: data.remark || '',
    pangleUsername: data.pangleUsername || '',
    pangleAppId: data.pangleAppId || '',
    pangleAppSecret: '',
    panglePlacementId: data.panglePlacementId || '',
    pangleEnabled: Boolean(data.pangleEnabled),
    pangleSecretConfigured: Boolean(data.pangleSecretConfigured),
    takuUsername: data.takuUsername || '',
    takuAppId: data.takuAppId || '',
    takuAppKey: '',
    takuAppSecret: '',
    takuPlacementId: data.takuPlacementId || '',
    takuEnabled: Boolean(data.takuEnabled),
    takuAppKeyConfigured: Boolean(data.takuAppKeyConfigured),
    takuSecretConfigured: Boolean(data.takuSecretConfigured)
  }
}

const loadAgent = async (tenantId: number) => {
  const data = await TenantApi.getTenantAgent(tenantId)
  applyAgent(data)
  await nextTick()
  formRef.value?.clearValidate()
}

const open = async (type: 'create' | 'update', tenantId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增代理商' : '编辑代理商'
  formType.value = type
  formData.value = createEmptyForm()
  await nextTick()
  formRef.value?.clearValidate()
  if (type === 'update' && tenantId) {
    formLoading.value = true
    try {
      await loadAgent(tenantId)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const handleProviderToggle = (provider: TenantApi.TenantAdProvider) => {
  const fields =
    provider === 'PANGLE'
      ? ['pangleUsername', 'pangleAppId', 'pangleAppSecret', 'panglePlacementId']
      : ['takuUsername', 'takuAppId', 'takuAppKey', 'takuAppSecret', 'takuPlacementId']
  formRef.value?.clearValidate(fields)
}

const emit = defineEmits<{ success: [] }>()

const clearSensitiveFields = () => {
  formData.value.password = ''
  formData.value.pangleAppSecret = ''
  formData.value.takuAppKey = ''
  formData.value.takuAppSecret = ''
}

const clearProviderCredentials = async (provider: TenantApi.TenantAdProvider) => {
  const tenantId = formData.value.tenantId
  if (!tenantId || isArchived.value) return
  const providerName = provider === 'PANGLE' ? '穿山甲' : 'Taku'
  try {
    const { value } = await message.prompt(
      `请输入清除${providerName}密钥并停用平台的原因（10–500 字）。密钥无法恢复。`,
      `清除${providerName}密钥`
    )
    const reason = String(value || '').trim()
    if (reason.length < 10 || reason.length > 500) {
      message.warning('清除原因长度必须为 10–500 个字符')
      return
    }
    clearingProvider.value = provider
    await TenantApi.clearTenantAdAccountCredentials({ tenantId, provider, reason })
    if (provider === 'PANGLE') {
      formData.value.pangleAppSecret = ''
      formData.value.pangleSecretConfigured = false
      formData.value.pangleEnabled = false
    } else {
      formData.value.takuAppKey = ''
      formData.value.takuAppSecret = ''
      formData.value.takuAppKeyConfigured = false
      formData.value.takuSecretConfigured = false
      formData.value.takuEnabled = false
    }
    handleProviderToggle(provider)
    message.success(`${providerName}密钥已清除，平台已停用`)
    emit('success')
  } catch {
    // 用户取消时保持当前表单；请求错误由全局请求层提示。
  } finally {
    clearingProvider.value = undefined
  }
}

const applySecretFields = (data: TenantApi.TenantAgentCreateReqVO) => {
  if (!isBlank(formData.value.pangleAppSecret)) {
    data.pangleAppSecret = formData.value.pangleAppSecret
  }
  if (!isBlank(formData.value.takuAppKey)) {
    data.takuAppKey = formData.value.takuAppKey
  }
  if (!isBlank(formData.value.takuAppSecret)) {
    data.takuAppSecret = formData.value.takuAppSecret
  }
}

const submitForm = async () => {
  if (isArchived.value) return
  const valid = await formRef.value?.validate()
  if (!valid) return
  const expireTime = toEndOfDayTimestamp(formData.value.expireDate)
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      const data: TenantApi.TenantAgentCreateReqVO = {
        name: formData.value.name.trim(),
        mobile: formData.value.mobile.trim(),
        password: formData.value.password,
        status: formData.value.status,
        expireTime,
        pangleUsername: formData.value.pangleUsername.trim(),
        pangleAppId: formData.value.pangleAppId.trim(),
        panglePlacementId: formData.value.panglePlacementId.trim(),
        pangleEnabled: formData.value.pangleEnabled,
        takuUsername: formData.value.takuUsername.trim(),
        takuAppId: formData.value.takuAppId.trim(),
        takuPlacementId: formData.value.takuPlacementId.trim(),
        takuEnabled: formData.value.takuEnabled
      }
      applySecretFields(data)
      await TenantApi.createTenantAgent(data)
      message.success(t('common.createSuccess'))
    } else {
      if (!formData.value.tenantId) return
      const data: TenantApi.TenantAgentUpdateReqVO = {
        tenantId: formData.value.tenantId,
        name: formData.value.name.trim(),
        status: formData.value.status,
        expireTime,
        remark: formData.value.remark.trim()
      }
      await TenantApi.updateTenantAgent(data)
      message.success(t('common.updateSuccess'))
    }
    clearSensitiveFields()
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
