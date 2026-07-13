<template>
  <Dialog v-model="dialogVisible" title="换绑管理员手机号" width="500px">
    <el-alert
      class="mb-16px"
      :closable="false"
      show-icon
      title="换绑后，管理员用户名和登录手机号会同步变更为新手机号。"
      type="warning"
    />
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
      <el-form-item label="代理商">
        <el-input :model-value="agentName" disabled />
      </el-form-item>
      <el-form-item label="当前手机号">
        <el-input :model-value="currentMobile" disabled />
      </el-form-item>
      <el-form-item label="新手机号" prop="mobile">
        <el-input
          v-model="formData.mobile"
          autocomplete="off"
          maxlength="11"
          placeholder="请输入新的 11 位登录手机号"
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
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitTenantAgentMobileForm' })

interface MobileFormData {
  tenantId?: number
  mobile: string
}

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const agentName = ref('')
const currentMobile = ref('')
const formData = ref<MobileFormData>({ tenantId: undefined, mobile: '' })

const validateChangedMobile = (
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void
) => {
  if (value === currentMobile.value) {
    callback(new Error('新手机号不能与当前手机号相同'))
    return
  }
  callback()
}

const formRules = reactive<FormRules<MobileFormData>>({
  mobile: [
    { required: true, message: '新手机号不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的 11 位手机号码', trigger: 'blur' },
    { validator: validateChangedMobile, trigger: 'blur' }
  ]
})

const open = async (agent: TenantApi.TenantAgentVO) => {
  dialogVisible.value = true
  agentName.value = agent.name
  currentMobile.value = agent.mobile
  formData.value = { tenantId: agent.tenantId, mobile: '' }
  await nextTick()
  formRef.value?.clearValidate()
}
defineExpose({ open })

const emit = defineEmits<{ success: [] }>()
const submitForm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid || !formData.value.tenantId) return
  try {
    await message.confirm(
      `确认将“${agentName.value}”的管理员登录手机号换绑为 ${formData.value.mobile} 吗？`,
      '换绑管理员手机号'
    )
    formLoading.value = true
    const data: TenantApi.TenantAgentMobileUpdateReqVO = {
      tenantId: formData.value.tenantId,
      mobile: formData.value.mobile
    }
    await TenantApi.updateTenantAgentMobile(data)
    message.success('管理员手机号换绑成功')
    dialogVisible.value = false
    emit('success')
  } catch {
    // 用户取消时保留对话框；请求错误由全局请求层提示。
  } finally {
    formLoading.value = false
  }
}
</script>
