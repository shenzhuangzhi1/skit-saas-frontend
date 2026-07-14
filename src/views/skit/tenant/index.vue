<template>
  <template v-if="!isSuperAdmin">
    <ContentWrap>
      <div class="mb-18px">
        <div class="text-18px font-600">我的代理商邀请码</div>
        <el-text type="info">新用户使用此邀请码注册后，会进入当前代理商租户。</el-text>
      </div>
      <el-skeleton v-if="selfInvitationLoading" :rows="3" animated />
      <el-descriptions v-else-if="selfInvitation" :column="1" border>
        <el-descriptions-item label="代理商">{{ selfInvitation.tenantName }}</el-descriptions-item>
        <el-descriptions-item label="代理商编码">
          {{ selfInvitation.tenantCode }}
        </el-descriptions-item>
        <el-descriptions-item label="根邀请码">
          <div class="flex items-center gap-10px">
            <code class="text-18px font-700">{{ selfInvitation.rootInviteCode }}</code>
            <el-button type="primary" @click="copyInviteCode(selfInvitation.rootInviteCode)">
              复制邀请码
            </el-button>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </ContentWrap>

    <ContentWrap v-if="selfInvitation" class="tenant-detail-wrap">
      <div class="mb-12px flex items-center gap-10px">
        <span class="text-16px font-600">租户业务管理</span>
        <el-tag>租户 {{ selfInvitation.tenantId }}</el-tag>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="广告接入" name="ad-access" lazy>
          <AdAccessEditor :target="tenantWorkspaceTarget(false, selfInvitation.tenantId)" />
        </el-tab-pane>
        <el-tab-pane label="分成规则" name="commission" lazy>
          <CommissionRuleEditor :target="tenantWorkspaceTarget(false, selfInvitation.tenantId)" />
        </el-tab-pane>
        <el-tab-pane label="成员体系" name="members" lazy>
          <MemberList :target="tenantWorkspaceTarget(false, selfInvitation.tenantId)" />
        </el-tab-pane>
        <el-tab-pane label="分成账本" name="ledger" lazy>
          <CommissionLedger :target="tenantWorkspaceTarget(false, selfInvitation.tenantId)" />
        </el-tab-pane>
      </el-tabs>
    </ContentWrap>
  </template>

  <template v-else>
    <ContentWrap>
      <div class="mb-16px flex items-start justify-between gap-16px">
        <div>
          <div class="text-18px font-600">代理商管理</div>
          <el-text type="info">
            登录手机号同时作为管理员账号；代理商统一使用系统标准套餐，归档不会删除业务历史。
          </el-text>
        </div>
        <el-button type="primary" @click="openCreateForm">
          <Icon icon="ep:office-building" /> 新增代理商
        </el-button>
      </div>

      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
        <el-form-item label="代理商" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            class="!w-260px"
            clearable
            maxlength="64"
            placeholder="名称、编码或登录手机号"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" class="!w-180px" clearable placeholder="全部状态">
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
      <el-table
        ref="agentTableRef"
        v-loading="loading"
        :data="list"
        :show-overflow-tooltip="true"
        highlight-current-row
        row-key="tenantId"
        @current-change="selectAgent"
      >
        <el-table-column align="center" label="代理商" min-width="180">
          <template #default="scope">
            <div class="font-600">{{ scope.row.name }}</div>
            <el-text size="small" type="info">
              {{ scope.row.tenantCode }} · 租户 {{ scope.row.tenantId }}
            </el-text>
          </template>
        </el-table-column>
        <el-table-column align="center" label="登录手机号" min-width="130" prop="mobile" />
        <el-table-column align="center" label="根邀请码" min-width="190">
          <template #default="scope">
            <div class="flex items-center justify-center gap-6px">
              <code>{{ scope.row.rootInviteCode || '-' }}</code>
              <el-button
                v-if="scope.row.rootInviteCode"
                link
                type="primary"
                @click.stop="copyInviteCode(scope.row.rootInviteCode)"
              >
                复制
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label="穿山甲" min-width="165">
          <template #default="scope">
            <el-tag :type="scope.row.pangleEnabled ? 'success' : 'info'" size="small">
              {{ scope.row.pangleEnabled ? '已启用' : '未启用' }}
            </el-tag>
            <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
              {{ scope.row.pangleSecretConfigured ? '密钥已配置' : '密钥未配置' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label="Taku" min-width="175">
          <template #default="scope">
            <el-tag :type="scope.row.takuEnabled ? 'success' : 'info'" size="small">
              {{ scope.row.takuEnabled ? '已启用' : '未启用' }}
            </el-tag>
            <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
              {{ scope.row.takuAppKeyConfigured ? 'App Key 已配置' : 'App Key 未配置' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" min-width="100">
          <template #default="scope">
            <el-tag v-if="isArchived(scope.row)" type="info">已归档</el-tag>
            <dict-tag v-else :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="有效期至"
          min-width="180"
          prop="expireTime"
          :formatter="dateFormatter"
        />
        <el-table-column align="center" fixed="right" label="操作" width="190">
          <template #default="scope">
            <el-button link type="primary" @click.stop="manageAgent(scope.row)">管理</el-button>
            <el-button
              :disabled="isArchived(scope.row)"
              link
              type="primary"
              @click.stop="openForm(scope.row)"
            >
              编辑
            </el-button>
            <el-dropdown
              trigger="click"
              @command="(command) => handleAgentCommand(command, scope.row)"
            >
              <el-button link type="primary" @click.stop>更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="mobile" :disabled="isArchived(scope.row)">
                    换绑手机号
                  </el-dropdown-item>
                  <el-dropdown-item command="password" :disabled="isArchived(scope.row)">
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item command="rotate" :disabled="isArchived(scope.row)" divided>
                    轮换根邀请码
                  </el-dropdown-item>
                  <el-dropdown-item v-if="isArchived(scope.row)" command="restore">
                    恢复代理商
                  </el-dropdown-item>
                  <el-dropdown-item v-else command="archive" class="!text-[var(--el-color-danger)]">
                    归档代理商
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <ContentWrap v-if="selectedAgent" class="tenant-detail-wrap">
      <div class="mb-12px flex flex-wrap items-center gap-10px">
        <span class="text-16px font-600">当前代理商：{{ selectedAgent.name }}</span>
        <el-tag>租户 {{ selectedAgent.tenantId }}</el-tag>
        <el-tag type="info">{{ selectedAgent.tenantCode }}</el-tag>
        <el-tag v-if="selectedAgentArchived" type="warning">已归档 · 只读审计</el-tag>
        <el-button
          v-if="selectedAgent.rootInviteCode"
          link
          type="primary"
          @click="copyInviteCode(selectedAgent.rootInviteCode)"
        >
          根邀请码 {{ selectedAgent.rootInviteCode }}（复制）
        </el-button>
      </div>
      <el-alert
        v-if="selectedAgentArchived"
        class="mb-12px"
        :closable="false"
        show-icon
        title="该代理商已归档。成员与分成账本保留供审计；配置、身份和成员状态操作需恢复后进行。"
        type="warning"
      />
      <el-tabs v-model="activeTab">
        <el-tab-pane :disabled="selectedAgentArchived" label="广告接入" name="ad-access" lazy>
          <AdAccessEditor :target="tenantWorkspaceTarget(true, selectedAgent.tenantId)" />
        </el-tab-pane>
        <el-tab-pane label="分成规则" name="commission" lazy>
          <CommissionRuleEditor
            :read-only="selectedAgentArchived"
            :target="tenantWorkspaceTarget(true, selectedAgent.tenantId)"
          />
        </el-tab-pane>
        <el-tab-pane label="成员体系" name="members" lazy>
          <MemberList
            :read-only="selectedAgentArchived"
            :target="tenantWorkspaceTarget(true, selectedAgent.tenantId)"
          />
        </el-tab-pane>
        <el-tab-pane label="分成账本" name="ledger" lazy>
          <CommissionLedger :target="tenantWorkspaceTarget(true, selectedAgent.tenantId)" />
        </el-tab-pane>
        <el-tab-pane :disabled="selectedAgentArchived" label="App 发布" name="app-release" lazy>
          <AppReleaseEditor :tenant-id="selectedAgent.tenantId" />
        </el-tab-pane>
      </el-tabs>
    </ContentWrap>

    <AgentForm ref="agentFormRef" @success="getList" />
    <AgentMobileForm ref="agentMobileFormRef" @success="getList" />
    <AgentPasswordForm ref="agentPasswordFormRef" @success="getList" />
  </template>
</template>

<script lang="ts" setup>
import type { ElTable, FormInstance } from 'element-plus'
import { useClipboard } from '@vueuse/core'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { useUserStore } from '@/store/modules/user'
import * as TenantApi from '@/api/skit/tenant'
import AdAccessEditor from './AdAccessEditor.vue'
import CommissionRuleEditor from './CommissionRuleEditor.vue'
import MemberList from './MemberList.vue'
import CommissionLedger from './CommissionLedger.vue'
import AppReleaseEditor from './AppReleaseEditor.vue'
import AgentForm from './AgentForm.vue'
import AgentMobileForm from './AgentMobileForm.vue'
import AgentPasswordForm from './AgentPasswordForm.vue'
import { tenantWorkspaceTarget } from './workspaceModel'

defineOptions({ name: 'SkitTenantManagement' })

type AgentCommand = 'mobile' | 'password' | 'rotate' | 'archive' | 'restore'

const userStore = useUserStore()
const message = useMessage()
const { copy: copyToClipboard } = useClipboard({ legacy: true })
const isSuperAdmin = computed(() => userStore.getRoles.includes('super_admin'))
const selfInvitationLoading = ref(false)
const selfInvitation = ref<TenantApi.TenantInvitationVO>()
const loading = ref(false)
const total = ref(0)
const list = ref<TenantApi.TenantAgentVO[]>([])
const selectedAgent = ref<TenantApi.TenantAgentVO>()
const activeTab = ref('ad-access')
const queryFormRef = ref<FormInstance>()
const agentTableRef = ref<InstanceType<typeof ElTable>>()
const agentFormRef = ref<InstanceType<typeof AgentForm>>()
const agentMobileFormRef = ref<InstanceType<typeof AgentMobileForm>>()
const agentPasswordFormRef = ref<InstanceType<typeof AgentPasswordForm>>()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  status: undefined as number | undefined
})

const isArchived = (agent?: TenantApi.TenantAgentVO) => Boolean(agent?.archivedTime)
const selectedAgentArchived = computed(() => isArchived(selectedAgent.value))

const ensureReadableTab = () => {
  if (selectedAgentArchived.value && ['ad-access', 'app-release'].includes(activeTab.value)) {
    activeTab.value = 'members'
  }
}

const getList = async () => {
  if (!isSuperAdmin.value) return
  loading.value = true
  try {
    const data = await TenantApi.getTenantAgentPage({
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword.trim() || undefined,
      status: queryParams.status
    })
    list.value = data.list || []
    total.value = Number(data.total || 0)
    const current = list.value.find((item) => item.tenantId === selectedAgent.value?.tenantId)
    selectedAgent.value = current || list.value[0]
    ensureReadableTab()
    await nextTick()
    if (selectedAgent.value) {
      agentTableRef.value?.setCurrentRow(selectedAgent.value)
    }
  } finally {
    loading.value = false
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

const selectAgent = (row?: TenantApi.TenantAgentVO) => {
  if (!row) return
  selectedAgent.value = row
  ensureReadableTab()
}

const manageAgent = (row: TenantApi.TenantAgentVO) => {
  selectedAgent.value = row
  ensureReadableTab()
  agentTableRef.value?.setCurrentRow(row)
  nextTick(() =>
    document.querySelector('.tenant-detail-wrap')?.scrollIntoView({ behavior: 'smooth' })
  )
}

const openCreateForm = () => {
  agentFormRef.value?.open('create')
}

const openForm = (agent: TenantApi.TenantAgentVO) => {
  if (isArchived(agent)) return
  agentFormRef.value?.open('update', agent.tenantId)
}

const copyInviteCode = async (inviteCode: string) => {
  await copyToClipboard(inviteCode)
  message.success('代理邀请码已复制')
}

const archiveAgent = async (agent: TenantApi.TenantAgentVO) => {
  try {
    await message.confirm(
      `确认归档“${agent.name}”吗？归档会停用租户和管理员、撤销登录，但会完整保留成员、邀请、广告、分成和发布历史。`,
      '归档代理商'
    )
    await TenantApi.archiveTenantAgent(agent.tenantId)
    message.success('代理商已归档')
    await getList()
  } catch {
    // 用户取消时不修改；请求错误由全局请求层提示。
  }
}

const restoreAgent = async (agent: TenantApi.TenantAgentVO) => {
  try {
    await message.confirm(
      `确认恢复“${agent.name}”吗？租户和管理员将重新启用，不完整的广告平台配置不会自动启用。`,
      '恢复代理商'
    )
    await TenantApi.restoreTenantAgent(agent.tenantId)
    message.success('代理商已恢复')
    await getList()
  } catch {
    // 用户取消时不修改；请求错误由全局请求层提示。
  }
}

const rotateRootInvite = async (agent: TenantApi.TenantAgentVO) => {
  try {
    await message.confirm(
      `确认轮换“${agent.name}”的根邀请码吗？旧码将不能用于后续注册，已有邀请关系不会改变。`,
      '轮换根邀请码'
    )
    const newCode = await TenantApi.rotateTenantAgentRootInvite(agent.tenantId)
    await getList()
    message.alertSuccess(`根邀请码已轮换为：${newCode}`)
  } catch {
    // 用户取消时不修改；请求错误由全局请求层提示。
  }
}

const handleAgentCommand = (command: string | number | object, agent: TenantApi.TenantAgentVO) => {
  const action = String(command) as AgentCommand
  if (action !== 'restore' && isArchived(agent)) return
  if (action === 'mobile') {
    agentMobileFormRef.value?.open(agent)
  } else if (action === 'password') {
    agentPasswordFormRef.value?.open(agent)
  } else if (action === 'rotate') {
    rotateRootInvite(agent)
  } else if (action === 'archive') {
    archiveAgent(agent)
  } else if (action === 'restore') {
    restoreAgent(agent)
  }
}

const loadSelfInvitation = async () => {
  selfInvitationLoading.value = true
  try {
    selfInvitation.value = await TenantApi.getTenantInvitation()
  } finally {
    selfInvitationLoading.value = false
  }
}

watch(selectedAgentArchived, ensureReadableTab)
onMounted(() => (isSuperAdmin.value ? getList() : loadSelfInvitation()))
</script>
