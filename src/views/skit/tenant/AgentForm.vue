<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="720px" @closed="clearSensitiveFields">
    <el-alert
      v-if="isArchived"
      class="mb-16px"
      :closable="false"
      show-icon
      title="该代理商已归档，当前仅供只读查看。请先在代理商列表恢复后再修改。"
      type="warning"
    />
    <el-alert
      v-if="formType === 'create'"
      class="mb-16px"
      :closable="false"
      show-icon
      title="创建代理商后，请在代理商工作台的“广告接入”中完成运行配置。"
      type="info"
    />
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :disabled="isArchived"
      :model="formData"
      :rules="formRules"
      label-width="130px"
    >
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
}

const { t } = useI18n()
const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
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
  remark: ''
})

const formData = ref<AgentFormData>(createEmptyForm())
const isArchived = computed(() => Boolean(formData.value.archivedTime))
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
  remark: [{ max: 500, message: '备注不能超过 500 个字符', trigger: 'blur' }]
})

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
    remark: data.remark || ''
  }
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
      applyAgent(await TenantApi.getTenantAgent(tenantId))
      await nextTick()
      formRef.value?.clearValidate()
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits<{ success: [] }>()
const clearSensitiveFields = () => {
  formData.value.password = ''
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
        expireTime
      }
      await TenantApi.createTenantAgent(data)
      message.success(t('common.createSuccess'))
    } else {
      if (!formData.value.tenantId) return
      await TenantApi.updateTenantAgent({
        tenantId: formData.value.tenantId,
        name: formData.value.name.trim(),
        status: formData.value.status,
        expireTime,
        remark: formData.value.remark.trim()
      })
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
