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
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
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
            #{{ scope.row.parentUserId ?? scope.row.parentId ?? scope.row.inviterId ?? '-' }}
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
        label="加入时间"
        min-width="180"
        prop="createTime"
        :formatter="dateFormatter"
      />
      <el-table-column align="center" fixed="right" label="操作" width="270">
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row)">详情</el-button>
          <el-button link type="primary" @click="openTree(scope.row)">关系树</el-button>
          <el-button
            :disabled="readOnly"
            link
            :type="scope.row.status === CommonStatusEnum.ENABLE ? 'warning' : 'success'"
            @click="handleStatusChange(scope.row)"
          >
            {{ scope.row.status === CommonStatusEnum.ENABLE ? '停用' : '启用' }}
          </el-button>
          <el-button :disabled="readOnly" link type="primary" @click="openPasswordForm(scope.row)">
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
  </ContentWrap>

  <ContentWrap v-if="treeRoot">
    <div class="mb-16px flex flex-wrap items-center justify-between gap-12px">
      <div>
        <div class="text-16px font-600">师徒关系树：{{ treeRoot.displayName }}</div>
        <div class="mt-6px flex flex-wrap items-center gap-6px text-12px">
          <template v-for="(node, index) in treeAncestors" :key="node.id">
            <el-button link type="primary" @click="selectTreeMember(node.id)">
              {{ node.nickname || `会员 ${node.id}` }}
            </el-button>
            <span v-if="index < treeAncestors.length - 1">/</span>
          </template>
        </div>
      </div>
      <el-button @click="closeTree">关闭关系树</el-button>
    </div>

    <div class="grid gap-20px xl:grid-cols-2">
      <section v-loading="treeLoading" class="min-h-180px rounded border p-14px">
        <div class="mb-10px font-600">按需展开直属成员</div>
        <MemberTree
          :nodes="[treeRoot]"
          @load-children="loadTreeChildren"
          @select="selectTreeMember"
        />
      </section>

      <section class="rounded border p-14px">
        <div class="mb-10px font-600">子树已对账收益</div>
        <el-form label-width="76px">
          <el-form-item label="统计时间">
            <el-date-picker
              v-model="summaryRange"
              end-placeholder="结束时间"
              range-separator="至"
              start-placeholder="开始时间"
              type="datetimerange"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="币种">
            <el-input v-model="summaryCurrency" maxlength="3" placeholder="USD" />
          </el-form-item>
          <el-form-item label="平台">
            <el-select v-model="summaryProvider" clearable placeholder="全部平台">
              <el-option label="穿山甲" value="PANGLE" />
              <el-option label="Taku" value="TAKU" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :loading="summaryLoading" type="primary" @click="loadSubtreeSummary">
              查询已对账收益
            </el-button>
          </el-form-item>
        </el-form>

        <el-descriptions v-if="subtreeSummary" :column="2" border>
          <el-descriptions-item label="子树会员">
            {{ subtreeSummary.memberCount }} 人
          </el-descriptions-item>
          <el-descriptions-item label="贡献会员">
            {{ subtreeSummary.contributingMemberCount }} 人
          </el-descriptions-item>
          <el-descriptions-item label="已验奖事件">
            {{ subtreeSummary.rewardedEventCount }} 次
          </el-descriptions-item>
          <el-descriptions-item label="统计口径">官方对账账本</el-descriptions-item>
        </el-descriptions>
        <div v-if="subtreeSummary" class="mt-12px grid gap-10px">
          <div
            v-for="amount in subtreeSummary.amounts"
            :key="amount.amountScale"
            class="rounded border p-10px"
          >
            <div class="flex justify-between gap-10px">
              <span>广告总收入</span>
              <MoneyText
                :amount-scale="amount.amountScale"
                :amount-units="amount.grossRevenueUnits"
                :currency="subtreeSummary.currency"
              />
            </div>
            <div class="flex justify-between gap-10px">
              <span>会员分成</span>
              <MoneyText
                :amount-scale="amount.amountScale"
                :amount-units="amount.memberAllocationUnits"
                :currency="subtreeSummary.currency"
              />
            </div>
            <div class="flex justify-between gap-10px">
              <span>代理商留存</span>
              <MoneyText
                :amount-scale="amount.amountScale"
                :amount-units="amount.agentRetentionUnits"
                :currency="subtreeSummary.currency"
              />
            </div>
            <el-tag class="mt-6px" :type="amount.conserved ? 'success' : 'danger'" size="small">
              {{ amount.conserved ? '金额守恒' : '金额异常' }}
            </el-tag>
          </div>
        </div>
      </section>
    </div>
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
        <el-descriptions-item label="邀请码">{{
          detailMember.inviteCode || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="直属成员"
          >{{ detailMember.childCount ?? 0 }} 人</el-descriptions-item
        >
        <el-descriptions-item label="上级编号">
          {{ detailMember.parentUserId ?? detailMember.parentId ?? detailMember.inviterId ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="所属层级">
          第 {{ detailMember.depth ?? detailMember.level ?? 0 }} 层
        </el-descriptions-item>
        <el-descriptions-item label="加入时间">
          {{ formatMemberDate(detailMember.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="最近登录">
          {{ formatMemberDate(detailMember.loginTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
    <template #footer><el-button @click="detailVisible = false">关 闭</el-button></template>
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
      <el-form-item label="成员"
        ><el-input :model-value="selectedMemberLabel" disabled
      /></el-form-item>
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
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import MemberTree from './MemberTree.vue'
import type { MemberTreeBranch } from './workspaceModel'

defineOptions({ name: 'SkitTenantMemberList' })

interface MemberPasswordFormData {
  password: string
  confirmPassword: string
}

const props = withDefaults(
  defineProps<{ target: TenantApi.ManagementTenantTarget; readOnly?: boolean }>(),
  { readOnly: false }
)
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

const treeRoot = ref<MemberTreeBranch>()
const treeAncestors = ref<TenantApi.MemberTreeNodeVO[]>([])
const treeLoading = ref(false)
const summaryLoading = ref(false)
const summaryRange = ref<[string, string]>()
const summaryCurrency = ref('USD')
const summaryProvider = ref<TenantApi.TenantAdProvider>()
const subtreeSummary = ref<TenantApi.MemberSubtreeSummaryVO>()
let treeRequestId = 0

const targetKey = computed(() => `${props.target.kind}:${props.target.tenantId}`)
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
  const currentTarget = targetKey.value
  const requestId = ++listRequestId
  loading.value = true
  try {
    const data = await TenantApi.getManagedTenantMemberPage(props.target, {
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword.trim() || undefined,
      status: queryParams.status
    })
    if (requestId !== listRequestId || currentTarget !== targetKey.value) return
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
  const currentTarget = targetKey.value
  const requestId = ++detailRequestId
  detailLoading.value = true
  try {
    const data = await TenantApi.getManagedTenantMember(props.target, id)
    if (requestId !== detailRequestId || currentTarget !== targetKey.value) return
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

const toTreeBranch = (node: TenantApi.MemberTreeNodeVO): MemberTreeBranch => ({
  memberId: node.id,
  displayName: node.nickname || `会员 ${node.id}`,
  directChildCount: Number(node.directChildCount || 0),
  loaded: false,
  children: []
})
const memberToTreeBranch = (member: TenantApi.TenantMemberVO): MemberTreeBranch => ({
  memberId: member.id,
  displayName: member.nickname || member.mobile || `会员 ${member.id}`,
  directChildCount: Number(member.childCount || 0),
  loaded: false,
  children: []
})
const findBranch = (root: MemberTreeBranch, memberId: number): MemberTreeBranch | undefined => {
  if (root.memberId === memberId) return root
  for (const child of root.children) {
    const found = findBranch(child, memberId)
    if (found) return found
  }
  return undefined
}

const loadAncestors = async (memberId: number, currentRequestId: number) => {
  const response = await TenantApi.getMemberAncestors(props.target, memberId, { timezone: 'UTC+8' })
  if (currentRequestId !== treeRequestId) return
  treeAncestors.value = response.list || []
}

const openTree = async (member: TenantApi.TenantMemberVO) => {
  const currentRequestId = ++treeRequestId
  treeRoot.value = memberToTreeBranch(member)
  treeAncestors.value = []
  subtreeSummary.value = undefined
  treeLoading.value = true
  try {
    await loadAncestors(member.id, currentRequestId)
  } finally {
    if (currentRequestId === treeRequestId) treeLoading.value = false
  }
  await nextTick()
  document.querySelector('.tenant-detail-wrap')?.scrollIntoView({ behavior: 'smooth' })
}

const selectTreeMember = async (memberId: number) => {
  const existing = treeRoot.value ? findBranch(treeRoot.value, memberId) : undefined
  const currentRequestId = ++treeRequestId
  treeRoot.value = existing
    ? { ...existing, children: [...existing.children] }
    : { memberId, displayName: `会员 ${memberId}`, loaded: false, children: [] }
  subtreeSummary.value = undefined
  treeLoading.value = true
  try {
    await loadAncestors(memberId, currentRequestId)
    const selected = treeAncestors.value.find((node) => node.id === memberId)
    if (selected && treeRoot.value?.memberId === memberId) {
      treeRoot.value.displayName = selected.nickname || `会员 ${memberId}`
      treeRoot.value.directChildCount = Number(selected.directChildCount || 0)
    }
  } finally {
    if (currentRequestId === treeRequestId) treeLoading.value = false
  }
}

const loadTreeChildren = async (memberId: number, cursor?: string) => {
  const root = treeRoot.value
  if (!root) return
  const branch = findBranch(root, memberId)
  if (!branch || branch.loading) return
  branch.loading = true
  const currentRequestId = treeRequestId
  try {
    const response = await TenantApi.getMemberChildren(props.target, memberId, {
      cursor,
      pageSize: 50,
      timezone: 'UTC+8'
    })
    if (currentRequestId !== treeRequestId) return
    const merged = new Map(branch.children.map((child) => [child.memberId, child]))
    response.list.forEach((node) => {
      if (!merged.has(node.id)) merged.set(node.id, toTreeBranch(node))
    })
    branch.children = [...merged.values()]
    branch.loaded = true
    branch.nextCursor = response.nextCursor || undefined
  } finally {
    branch.loading = false
  }
}

const loadSubtreeSummary = async () => {
  const memberId = treeRoot.value?.memberId
  const currency = summaryCurrency.value.trim().toUpperCase()
  if (!memberId || !summaryRange.value) {
    message.warning('请先选择统计开始和结束时间')
    return
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    message.warning('币种必须是三个大写字母')
    return
  }
  summaryLoading.value = true
  try {
    subtreeSummary.value = await TenantApi.getMemberSubtreeSummary(props.target, memberId, {
      startTime: summaryRange.value[0],
      endTime: summaryRange.value[1],
      currency,
      provider: summaryProvider.value,
      statisticBasis: 'RECONCILED_LEDGER',
      timezone: 'UTC+8'
    })
  } finally {
    summaryLoading.value = false
  }
}

const closeTree = () => {
  treeRequestId++
  treeRoot.value = undefined
  treeAncestors.value = []
  subtreeSummary.value = undefined
}

const clearMemberPassword = () => {
  passwordForm.value = { password: '', confirmPassword: '' }
}
const handleStatusChange = async (member: TenantApi.TenantMemberVO) => {
  const currentTarget = targetKey.value
  if (props.readOnly) return
  const nextStatus =
    member.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  const action = nextStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    const { value } = await message.prompt(
      `请输入${action}成员“${member.nickname || member.mobile}”的原因（10–500 字）。${
        action === '停用' ? '停用后其现有登录会话将失效。' : ''
      }`,
      `${action}成员`
    )
    const reason = String(value || '').trim()
    if (reason.length < 10 || reason.length > 500) {
      message.warning('状态变更原因长度必须为 10–500 个字符')
      return
    }
    if (currentTarget !== targetKey.value || props.readOnly) return
    await TenantApi.updateManagedTenantMemberStatus(props.target, {
      id: member.id,
      status: nextStatus,
      reason
    })
    message.success(`成员已${action}`)
    await getList()
  } catch {
    // 用户取消时不修改；请求错误由全局请求层提示。
  }
}

const openPasswordForm = async (member: TenantApi.TenantMemberVO) => {
  if (props.readOnly) return
  selectedMember.value = member
  clearMemberPassword()
  passwordVisible.value = true
  await nextTick()
  passwordFormRef.value?.clearValidate()
}

const submitPasswordReset = async () => {
  const currentTarget = targetKey.value
  const memberId = selectedMember.value?.id
  if (!memberId || props.readOnly) return
  const valid = await passwordFormRef.value?.validate()
  if (!valid) return
  try {
    const { value } = await message.prompt(
      `请输入重置成员“${selectedMemberLabel.value}”密码的原因（10–500 字）。提交后会撤销其现有登录会话。`,
      '重置成员密码'
    )
    const reason = String(value || '').trim()
    if (reason.length < 10 || reason.length > 500) {
      message.warning('密码重置原因长度必须为 10–500 个字符')
      return
    }
    if (
      currentTarget !== targetKey.value ||
      memberId !== selectedMember.value?.id ||
      props.readOnly
    )
      return
    passwordLoading.value = true
    await TenantApi.resetManagedTenantMemberPassword(props.target, {
      id: memberId,
      password: passwordForm.value.password,
      reason
    })
    clearMemberPassword()
    message.success('成员密码重置成功')
    passwordVisible.value = false
  } catch {
    // 用户取消时保留对话框；请求错误由全局请求层提示。
  } finally {
    passwordLoading.value = false
  }
}

watch(
  targetKey,
  () => {
    listRequestId++
    queryParams.pageNo = 1
    list.value = []
    total.value = 0
    detailVisible.value = false
    clearMemberDetail()
    passwordVisible.value = false
    clearMemberPassword()
    closeTree()
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
