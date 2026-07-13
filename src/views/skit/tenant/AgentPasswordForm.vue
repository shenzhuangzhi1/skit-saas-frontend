<template>
  <Dialog
    v-model="dialogVisible"
    title="重置管理员密码"
    width="500px"
    @closed="clearSensitiveFields"
  >
    <el-alert
      class="mb-16px"
      :closable="false"
      show-icon
      title="重置成功后，该代理商管理员的现有登录会话将失效。"
      type="warning"
    />
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
      <el-form-item label="代理商">
        <el-input :model-value="agentName" disabled />
      </el-form-item>
      <el-form-item label="新密码" prop="password">
        <InputPassword
          v-model="formData.password"
          autocomplete="new-password"
          maxlength="16"
          placeholder="请输入 4–16 位新密码"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <InputPassword
          v-model="formData.confirmPassword"
          autocomplete="new-password"
          maxlength="16"
          placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :loading="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitTenantAgentPasswordForm' })

interface PasswordFormData {
  tenantId?: number
  password: string
  confirmPassword: string
}

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const agentName = ref('')
const formData = ref<PasswordFormData>({ tenantId: undefined, password: '', confirmPassword: '' })

const validateConfirmedPassword = (
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void
) => {
  if (value !== formData.value.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const formRules = reactive<FormRules<PasswordFormData>>({
  password: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 4, max: 16, message: '管理员密码长度为 4–16 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmedPassword, trigger: 'blur' }
  ]
})

const open = async (agent: TenantApi.TenantAgentVO) => {
  dialogVisible.value = true
  agentName.value = agent.name
  formData.value = { tenantId: agent.tenantId, password: '', confirmPassword: '' }
  await nextTick()
  formRef.value?.clearValidate()
}
defineExpose({ open })

const emit = defineEmits<{ success: [] }>()
const clearSensitiveFields = () => {
  formData.value.password = ''
  formData.value.confirmPassword = ''
}

const submitForm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid || !formData.value.tenantId) return
  try {
    await message.confirm(
      `确认重置“${agentName.value}”的管理员密码并撤销现有登录会话吗？`,
      '重置管理员密码'
    )
    formLoading.value = true
    const data: TenantApi.TenantAgentPasswordResetReqVO = {
      tenantId: formData.value.tenantId,
      password: formData.value.password
    }
    await TenantApi.resetTenantAgentPassword(data)
    clearSensitiveFields()
    message.success('管理员密码重置成功')
    dialogVisible.value = false
    emit('success')
  } catch {
    // 用户取消时保留对话框；请求错误由全局请求层提示。
  } finally {
    formLoading.value = false
  }
}
</script>
