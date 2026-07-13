<template>
  <ContentWrap>
    <el-alert
      v-if="readOnly"
      class="mb-16px"
      :closable="false"
      show-icon
      title="代理商已归档，成员资料仅供审计查看，不能修改状态或重置密码。"
      type="warning"
    />
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="成员" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          class="!w-260px"
          clearable
          maxlength="64"
          placeholder="用户名、昵称、手机号或邀请码"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-160px" clearable placeholder="全部状态">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button :disabled="!tenantId" @click="handleQuery">
          <Icon icon="ep:search" />搜索
        </el-button>
        <el-button :disabled="!tenantId" @click="resetQuery">
          <Icon icon="ep:refresh" />重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-alert
      v-if="!tenantId"
      :closable="false"
      title="请先在代理商列表中选择一个租户"
      type="info"
      show-icon
    />
    <template v-else>
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" row-key="id">
        <el-table-column align="center" label="用户编号" min-width="100">
          <template #default="scope">{{ scope.row.userId ?? scope.row.id }}</template>
        </el-table-column>
        <el-table-column align="center" label="昵称" min-width="130" prop="nickname" />
        <el-table-column align="center" label="手机号" min-width="130" prop="mobile" />
        <el-table-column align="center" label="邀请码" min-width="140" prop="inviteCode" />
        <el-table-column align="center" label="上级用户" min-width="150">
          <template #default="scope">
            <div>{{ scope.row.parentNickname ?? scope.row.parentName ?? '-' }}</div>
            <el-text size="small" type="info">
              {{ scope.row.parentUserId ?? scope.row.parentId ?? scope.row.inviterId ?? '-' }}
            </el-text>
          </template>
        </el-table-column>
        <el-table-column align="center" label="直属成员" min-width="100">
          <template #default="scope">{{ scope.row.childCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column align="center" label="所属层级" min-width="100">
          <template #default="scope">第 {{ scope.row.depth ?? scope.row.level ?? 0 }} 层</template>
        </el-table-column>
        <el-table-column align="center" label="状态" min-width="90" prop="status">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="最近登录"
          min-width="180"
          prop="loginTime"
          :formatter="dateFormatter"
        />
        <el-table-column
          align="center"
          label="加入时间"
          min-width="180"
          prop="createTime"
          :formatter="dateFormatter"
        />
        <el-table-column align="center" fixed="right" label="操作" width="220">
          <template #default="scope">
            <el-button link type="primary" @click="openDetail(scope.row)">详情</el-button>
            <el-button
              :disabled="readOnly"
              link
              :type="scope.row.status === CommonStatusEnum.ENABLE ? 'warning' : 'success'"
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === CommonStatusEnum.ENABLE ? '停用' : '启用' }}
            </el-button>
            <el-button
              :disabled="readOnly"
              link
              type="primary"
              @click="openPasswordForm(scope.row)"
            >
              重置密码
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </template>
  </ContentWrap>

  <Dialog v-model="detailVisible" title="成员详情" width="660px" @closed="clearMemberDetail">
    <div v-loading="detailLoading" class="min-h-180px">
      <el-descriptions v-if="detailMember" :column="2" border>
        <el-descriptions-item label="用户编号">
          {{ detailMember.userId ?? detailMember.id }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="detailMember.status" />
        </el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailMember.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ detailMember.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邀请码">
          {{ detailMember.inviteCode || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="直属成员">
          {{ detailMember.childCount ?? 0 }} 人
        </el-descriptions-item>
        <el-descriptions-item label="上级编号">
          {{ detailMember.parentUserId ?? detailMember.parentId ?? detailMember.inviterId ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="上级用户">
          {{ detailMember.parentNickname ?? detailMember.parentName ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="所属层级">
          第 {{ detailMember.depth ?? detailMember.level ?? 0 }} 层
        </el-descriptions-item>
        <el-descriptions-item label="加入时间">
          {{ formatMemberDate(detailMember.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="最近登录" :span="2">
          {{ formatMemberDate(detailMember.loginTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
    <template #footer>
      <el-button @click="detailVisible = false">关 闭</el-button>
    </template>
  </Dialog>

  <Dialog
    v-model="passwordVisible"
    title="重置成员密码"
    width="500px"
    @closed="clearMemberPassword"
  >
    <el-alert
      class="mb-16px"
      :closable="false"
      show-icon
      title="重置成功后，该成员当前登录会话将失效。"
      type="warning"
    />
    <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
      <el-form-item label="成员">
        <el-input :model-value="selectedMemberLabel" disabled />
      </el-form-item>
      <el-form-item label="新密码" prop="password">
        <InputPassword
          v-model="passwordForm.password"
          autocomplete="new-password"
          maxlength="32"
          placeholder="请输入 6–32 位新密码"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <InputPassword
          v-model="passwordForm.confirmPassword"
          autocomplete="new-password"
          maxlength="32"
          placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :loading="passwordLoading" type="primary" @click="submitPasswordReset">
        确 定
      </el-button>
      <el-button @click="passwordVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitTenantMemberList' })

interface MemberPasswordFormData {
  password: string
  confirmPassword: string
}

const props = withDefaults(defineProps<{ tenantId?: number; readOnly?: boolean }>(), {
  readOnly: false
})
const message = useMessage()
const loading = ref(false)
const total = ref(0)
const list = ref<TenantApi.TenantMemberVO[]>([])
const queryFormRef = ref<FormInstance>()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  status: undefined as number | undefined
})
let listRequestId = 0

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailMember = ref<TenantApi.TenantMemberVO>()
let detailRequestId = 0

const passwordVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref<FormInstance>()
const selectedMember = ref<TenantApi.TenantMemberVO>()
const passwordForm = ref<MemberPasswordFormData>({ password: '', confirmPassword: '' })
const selectedMemberLabel = computed(() => {
  if (!selectedMember.value) return ''
  return (
    selectedMember.value.nickname || selectedMember.value.mobile || String(selectedMember.value.id)
  )
})

const validateConfirmedPassword = (
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void
) => {
  if (value !== passwordForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const passwordRules = reactive<FormRules<MemberPasswordFormData>>({
  password: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, max: 32, message: '成员密码长度为 6–32 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmedPassword, trigger: 'blur' }
  ]
})

const getList = async () => {
  const tenantId = props.tenantId
  const requestId = ++listRequestId
  if (!tenantId) {
    list.value = []
    total.value = 0
    loading.value = false
    return
  }
  loading.value = true
  try {
    const data = await TenantApi.getTenantMemberPage({
      tenantId,
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword.trim() || undefined,
      status: queryParams.status
    })
    if (requestId !== listRequestId || tenantId !== props.tenantId) return
    list.value = data.list || []
    total.value = Number(data.total || 0)
  } finally {
    if (requestId === listRequestId) loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

const loadMemberDetail = async (id: number) => {
  const tenantId = props.tenantId
  if (!tenantId) return
  const requestId = ++detailRequestId
  detailLoading.value = true
  try {
    const data = await TenantApi.getTenantMember(id, tenantId)
    if (requestId !== detailRequestId || tenantId !== props.tenantId) return
    detailMember.value = data
  } finally {
    if (requestId === detailRequestId) detailLoading.value = false
  }
}

const openDetail = async (member: TenantApi.TenantMemberVO) => {
  detailVisible.value = true
  detailMember.value = undefined
  await loadMemberDetail(member.id)
}

const clearMemberDetail = () => {
  detailRequestId++
  detailLoading.value = false
  detailMember.value = undefined
}

const formatMemberDate = (value?: number) => (value ? formatDate(value) : '-')

const clearMemberPassword = () => {
  passwordForm.value.password = ''
  passwordForm.value.confirmPassword = ''
}

const handleStatusChange = async (member: TenantApi.TenantMemberVO) => {
  const tenantId = props.tenantId
  if (!tenantId || props.readOnly) return
  const nextStatus =
    member.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  const action = nextStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await message.confirm(
      `确认${action}成员“${member.nickname || member.mobile}”吗？${
        action === '停用' ? '停用后其现有登录会话将失效。' : ''
      }`,
      `${action}成员`
    )
    if (tenantId !== props.tenantId || props.readOnly) return
    const data: TenantApi.TenantMemberStatusUpdateReqVO = {
      tenantId,
      id: member.id,
      status: nextStatus
    }
    await TenantApi.updateTenantMemberStatus(data)
    message.success(`成员已${action}`)
    await getList()
    if (detailVisible.value && detailMember.value?.id === member.id) {
      await loadMemberDetail(member.id)
    }
  } catch {
    // 用户取消时不修改；请求错误由全局请求层提示。
  }
}

const openPasswordForm = async (member: TenantApi.TenantMemberVO) => {
  if (props.readOnly) return
  selectedMember.value = member
  passwordForm.value = { password: '', confirmPassword: '' }
  passwordVisible.value = true
  await nextTick()
  passwordFormRef.value?.clearValidate()
}

const submitPasswordReset = async () => {
  const tenantId = props.tenantId
  const memberId = selectedMember.value?.id
  if (!tenantId || !memberId || props.readOnly) return
  const valid = await passwordFormRef.value?.validate()
  if (!valid) return
  try {
    await message.confirm(
      `确认重置成员“${selectedMemberLabel.value}”的密码并撤销其现有登录会话吗？`,
      '重置成员密码'
    )
    if (
      tenantId !== props.tenantId ||
      memberId !== selectedMember.value?.id ||
      props.readOnly ||
      !passwordVisible.value
    ) {
      return
    }
    passwordLoading.value = true
    const data: TenantApi.TenantMemberPasswordResetReqVO = {
      tenantId,
      id: memberId,
      password: passwordForm.value.password
    }
    await TenantApi.resetTenantMemberPassword(data)
    clearMemberPassword()
    message.success('成员密码重置成功')
    passwordVisible.value = false
    await getList()
  } catch {
    // 用户取消时保留对话框；请求错误由全局请求层提示。
  } finally {
    passwordLoading.value = false
  }
}

watch(
  () => props.tenantId,
  () => {
    list.value = []
    total.value = 0
    queryParams.pageNo = 1
    detailVisible.value = false
    clearMemberDetail()
    passwordVisible.value = false
    clearMemberPassword()
    getList()
  },
  { immediate: true }
)

watch(
  () => props.readOnly,
  (readOnly) => {
    if (readOnly) {
      passwordVisible.value = false
      clearMemberPassword()
    }
  }
)
</script>
