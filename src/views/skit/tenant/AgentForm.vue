<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-tabs>
        <el-tab-pane label="代理商信息">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="代理商名称" prop="name">
                <el-input v-model="formData.name" placeholder="请输入代理商名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="租户套餐" prop="packageId">
                <el-select v-model="formData.packageId" class="w-full" placeholder="请选择租户套餐">
                  <el-option
                    v-for="item in packageList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系人" prop="contactName">
                <el-input v-model="formData.contactName" placeholder="请输入联系人" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系手机" prop="contactMobile">
                <el-input
                  v-model="formData.contactMobile"
                  maxlength="11"
                  placeholder="请输入联系手机"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="账号额度" prop="accountCount">
                <el-input-number
                  v-model="formData.accountCount"
                  :min="1"
                  controls-position="right"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="过期时间" prop="expireTime">
                <el-date-picker
                  v-model="formData.expireTime"
                  class="!w-full"
                  type="date"
                  value-format="x"
                  placeholder="请选择过期时间"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item v-if="formType === 'create'" label="管理员账号" prop="username">
                <el-input
                  v-model="formData.username"
                  autocomplete="off"
                  placeholder="请输入管理员账号"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                :label="formType === 'create' ? '管理员密码' : '重置管理员密码'"
                prop="password"
              >
                <InputPassword
                  v-model="formData.password"
                  autocomplete="new-password"
                  :placeholder="formType === 'create' ? '请输入管理员密码' : '留空则不修改'"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="租户状态" prop="status">
                <el-radio-group v-model="formData.status">
                  <el-radio
                    v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                    :key="dict.value"
                    :value="dict.value"
                  >
                    {{ dict.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="穿山甲账号">
          <el-alert
            class="mb-18px"
            :closable="false"
            show-icon
            title="穿山甲主账号在 SDK 初始化时绑定；保存后还需为该代理商生成对应白标包。"
            type="warning"
          />
          <el-form-item label="账号" prop="pangleUsername">
            <el-input v-model="formData.pangleUsername" placeholder="请输入穿山甲账号" />
          </el-form-item>
          <el-form-item label="App ID" prop="pangleAppId">
            <el-input v-model="formData.pangleAppId" placeholder="请输入穿山甲 App ID" />
          </el-form-item>
          <el-form-item label="App Secret" prop="pangleAppSecret">
            <InputPassword
              v-model="formData.pangleAppSecret"
              autocomplete="new-password"
              :placeholder="secretPlaceholder(formData.pangleSecretConfigured)"
            />
            <el-text
              v-if="formData.pangleSecretConfigured"
              class="mt-4px"
              size="small"
              type="success"
            >
              已配置密钥；留空则保持不变
            </el-text>
          </el-form-item>
          <el-form-item label="广告位 ID" prop="panglePlacementId">
            <el-input v-model="formData.panglePlacementId" placeholder="请输入穿山甲广告位 ID" />
          </el-form-item>
        </el-tab-pane>

        <el-tab-pane label="Taku 账号">
          <el-alert
            class="mb-18px"
            :closable="false"
            show-icon
            title="Taku 主账号在 SDK 初始化时绑定；保存后还需为该代理商生成对应白标包。"
            type="warning"
          />
          <el-form-item label="账号" prop="takuUsername">
            <el-input v-model="formData.takuUsername" placeholder="请输入 Taku 账号" />
          </el-form-item>
          <el-form-item label="App ID" prop="takuAppId">
            <el-input v-model="formData.takuAppId" placeholder="请输入 Taku App ID" />
          </el-form-item>
          <el-form-item label="客户端 App Key" prop="takuAppKey">
            <InputPassword
              v-model="formData.takuAppKey"
              autocomplete="new-password"
              :placeholder="secretPlaceholder(formData.takuAppKeyConfigured)"
            />
            <el-text
              v-if="formData.takuAppKeyConfigured"
              class="mt-4px"
              size="small"
              type="success"
            >
              已配置客户端 App Key；留空则保持不变
            </el-text>
          </el-form-item>
          <el-form-item label="S2S Secret（可选）" prop="takuAppSecret">
            <InputPassword
              v-model="formData.takuAppSecret"
              autocomplete="new-password"
              :placeholder="secretPlaceholder(formData.takuSecretConfigured)"
            />
            <el-text
              v-if="formData.takuSecretConfigured"
              class="mt-4px"
              size="small"
              type="success"
            >
              已配置密钥；留空则保持不变
            </el-text>
          </el-form-item>
          <el-form-item label="广告位 ID" prop="takuPlacementId">
            <el-input v-model="formData.takuPlacementId" placeholder="请输入 Taku 广告位 ID" />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as TenantPackageApi from '@/api/system/tenantPackage'
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitTenantAgentForm' })

interface AgentFormData extends TenantApi.TenantAgentSaveReqVO {
  pangleSecretConfigured: boolean
  takuAppKeyConfigured: boolean
  takuSecretConfigured: boolean
}

const { t } = useI18n()
const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formRef = ref<FormInstance>()
const packageList = ref<TenantPackageApi.TenantPackageVO[]>([])

const createEmptyForm = (): AgentFormData => ({
  tenantId: undefined,
  name: '',
  contactName: '',
  contactMobile: '',
  status: CommonStatusEnum.ENABLE,
  packageId: undefined as unknown as number,
  expireTime: '',
  accountCount: 1,
  username: '',
  password: '',
  pangleUsername: '',
  pangleAppId: '',
  pangleAppSecret: '',
  panglePlacementId: '',
  pangleSecretConfigured: false,
  takuUsername: '',
  takuAppId: '',
  takuAppKey: '',
  takuAppSecret: '',
  takuPlacementId: '',
  takuAppKeyConfigured: false,
  takuSecretConfigured: false
})

const formData = ref<AgentFormData>(createEmptyForm())

const requiredOnCreate = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (formType.value === 'create' && !value) {
    callback(new Error('创建代理商时不能为空'))
    return
  }
  callback()
}

const requiredSecret =
  (configuredKey: 'pangleSecretConfigured' | 'takuAppKeyConfigured' | 'takuSecretConfigured') =>
  (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value && !formData.value[configuredKey]) {
      callback(new Error('首次配置广告账号时密钥不能为空'))
      return
    }
    callback()
  }

const formRules = reactive<FormRules<AgentFormData>>({
  name: [{ required: true, message: '代理商名称不能为空', trigger: 'blur' }],
  packageId: [{ required: true, message: '租户套餐不能为空', trigger: 'change' }],
  contactName: [{ required: true, message: '联系人不能为空', trigger: 'blur' }],
  contactMobile: [
    { required: true, message: '联系手机不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  accountCount: [{ required: true, message: '账号额度不能为空', trigger: 'blur' }],
  expireTime: [{ required: true, message: '过期时间不能为空', trigger: 'change' }],
  username: [{ validator: requiredOnCreate, trigger: 'blur' }],
  password: [{ validator: requiredOnCreate, trigger: 'blur' }],
  pangleUsername: [{ required: true, message: '穿山甲账号不能为空', trigger: 'blur' }],
  pangleAppId: [{ required: true, message: '穿山甲 App ID 不能为空', trigger: 'blur' }],
  pangleAppSecret: [{ validator: requiredSecret('pangleSecretConfigured'), trigger: 'blur' }],
  panglePlacementId: [{ required: true, message: '穿山甲广告位 ID 不能为空', trigger: 'blur' }],
  takuUsername: [{ required: true, message: 'Taku 账号不能为空', trigger: 'blur' }],
  takuAppId: [{ required: true, message: 'Taku App ID 不能为空', trigger: 'blur' }],
  takuAppKey: [{ validator: requiredSecret('takuAppKeyConfigured'), trigger: 'blur' }],
  takuPlacementId: [{ required: true, message: 'Taku 广告位 ID 不能为空', trigger: 'blur' }]
})

const secretPlaceholder = (configured: boolean) =>
  configured ? '已配置；输入新值可替换' : '请输入凭证'

const open = async (type: 'create' | 'update', tenantId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增代理商' : '编辑代理商'
  formType.value = type
  formData.value = createEmptyForm()
  formRef.value?.resetFields()
  formLoading.value = true
  try {
    packageList.value = await TenantPackageApi.getTenantPackageList()
    if (type === 'update' && tenantId) {
      const data = await TenantApi.getTenantAgent(tenantId)
      formData.value = {
        ...createEmptyForm(),
        ...data,
        password: '',
        pangleAppSecret: '',
        takuAppKey: '',
        takuAppSecret: '',
        pangleSecretConfigured: Boolean(data.pangleSecretConfigured),
        takuAppKeyConfigured: Boolean(data.takuAppKeyConfigured),
        takuSecretConfigured: Boolean(data.takuSecretConfigured)
      }
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open })

const emit = defineEmits<{ success: [] }>()
const submitForm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const {
      pangleSecretConfigured: _pangleConfigured,
      takuAppKeyConfigured: _takuAppKeyConfigured,
      takuSecretConfigured: _takuConfigured,
      ...raw
    } = formData.value
    const data: TenantApi.TenantAgentSaveReqVO = { ...raw }
    if (!data.password) delete data.password
    if (!data.pangleAppSecret) delete data.pangleAppSecret
    if (!data.takuAppKey) delete data.takuAppKey
    if (!data.takuAppSecret) delete data.takuAppSecret
    if (formType.value === 'create') {
      delete data.tenantId
      await TenantApi.createTenantAgent(data)
      message.success(t('common.createSuccess'))
    } else {
      delete data.username
      await TenantApi.updateTenantAgent(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
