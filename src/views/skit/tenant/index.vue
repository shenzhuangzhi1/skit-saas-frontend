<template>
  <ContentWrap v-if="!isSuperAdmin">
    <div class="mb-18px">
      <div class="text-18px font-600">我的代理商邀请码</div>
      <el-text type="info">新用户使用此邀请码注册后，会进入当前代理商租户。</el-text>
    </div>
    <el-skeleton v-if="selfInvitationLoading" :rows="3" animated />
    <el-descriptions v-else-if="selfInvitation" :column="1" border>
      <el-descriptions-item label="代理商">{{ selfInvitation.tenantName }}</el-descriptions-item>
      <el-descriptions-item label="代理商编码">{{
        selfInvitation.tenantCode
      }}</el-descriptions-item>
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

  <template v-else>
    <ContentWrap>
      <div class="mb-16px flex items-start justify-between gap-16px">
        <div>
          <div class="text-18px font-600">代理商管理</div>
          <el-text type="info">
            每个代理商对应一个独立租户，并拥有独立的穿山甲、Taku 广告账号和分成规则。
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
            placeholder="名称、联系人或手机号"
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
        <el-table-column align="center" label="租户编号" min-width="100" prop="tenantId" />
        <el-table-column align="center" label="代理商" min-width="150" prop="name" />
        <el-table-column align="center" label="联系人" min-width="120" prop="contactName" />
        <el-table-column align="center" label="联系手机" min-width="130" prop="contactMobile" />
        <el-table-column align="center" label="代理邀请码" min-width="190">
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
        <el-table-column align="center" label="租户套餐" min-width="120">
          <template #default="scope">{{ scope.row.packageName || scope.row.packageId }}</template>
        </el-table-column>
        <el-table-column align="center" label="账号额度" min-width="100" prop="accountCount" />
        <el-table-column align="center" label="穿山甲账号" min-width="190">
          <template #default="scope">
            <div>{{ scope.row.pangleUsername || '-' }}</div>
            <el-tag v-if="scope.row.pangleSecretConfigured" size="small" type="success"
              >密钥已配置</el-tag
            >
            <el-tag v-else size="small" type="warning">密钥未配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="Taku 账号" min-width="190">
          <template #default="scope">
            <div>{{ scope.row.takuUsername || '-' }}</div>
            <el-tag v-if="scope.row.takuAppKeyConfigured" size="small" type="success"
              >App Key 已配置</el-tag
            >
            <el-tag v-else size="small" type="warning">App Key 未配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" min-width="90" prop="status">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="过期时间"
          min-width="180"
          prop="expireTime"
          :formatter="dateFormatter"
        />
        <el-table-column align="center" fixed="right" label="操作" width="150">
          <template #default="scope">
            <el-button link type="primary" @click.stop="manageAgent(scope.row)">管理</el-button>
            <el-button link type="primary" @click.stop="openForm('update', scope.row.tenantId)">
              编辑
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

    <ContentWrap v-if="selectedAgent" class="tenant-detail-wrap">
      <div class="mb-12px flex items-center gap-10px">
        <span class="text-16px font-600">当前代理商：{{ selectedAgent.name }}</span>
        <el-tag>租户 {{ selectedAgent.tenantId }}</el-tag>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="分成规则" name="commission">
          <CommissionRuleEditor :tenant-id="selectedAgent.tenantId" />
        </el-tab-pane>
        <el-tab-pane label="成员体系" name="members" lazy>
          <MemberList :tenant-id="selectedAgent.tenantId" />
        </el-tab-pane>
        <el-tab-pane label="分成账本" name="ledger" lazy>
          <CommissionLedger :tenant-id="selectedAgent.tenantId" />
        </el-tab-pane>
        <el-tab-pane label="App 发布" name="app-release" lazy>
          <AppReleaseEditor :tenant-id="selectedAgent.tenantId" />
        </el-tab-pane>
      </el-tabs>
    </ContentWrap>
  </template>

  <AgentForm ref="agentFormRef" @success="getList" />
</template>

<script lang="ts" setup>
import type { ElTable, FormInstance } from 'element-plus'
import { useClipboard } from '@vueuse/core'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { useUserStore } from '@/store/modules/user'
import * as TenantApi from '@/api/skit/tenant'
import CommissionRuleEditor from './CommissionRuleEditor.vue'
import MemberList from './MemberList.vue'
import CommissionLedger from './CommissionLedger.vue'
import AppReleaseEditor from './AppReleaseEditor.vue'
import AgentForm from './AgentForm.vue'

defineOptions({ name: 'SkitTenantManagement' })

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
const activeTab = ref('commission')
const queryFormRef = ref<FormInstance>()
const agentTableRef = ref<InstanceType<typeof ElTable>>()
const agentFormRef = ref<InstanceType<typeof AgentForm>>()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  status: undefined as number | undefined
})

const getList = async () => {
  if (!isSuperAdmin.value) return
  loading.value = true
  try {
    const data = await TenantApi.getTenantAgentPage({
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || undefined,
      status: queryParams.status
    })
    list.value = data.list || []
    total.value = Number(data.total || 0)
    const current = list.value.find((item) => item.tenantId === selectedAgent.value?.tenantId)
    selectedAgent.value = current || list.value[0]
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
  if (row) selectedAgent.value = row
}

const manageAgent = (row: TenantApi.TenantAgentVO) => {
  selectedAgent.value = row
  agentTableRef.value?.setCurrentRow(row)
  nextTick(() =>
    document.querySelector('.tenant-detail-wrap')?.scrollIntoView({ behavior: 'smooth' })
  )
}

const openCreateForm = () => {
  agentFormRef.value?.open('create')
}

const openForm = (type: 'update', tenantId: number) => {
  agentFormRef.value?.open(type, tenantId)
}

const copyInviteCode = async (inviteCode: string) => {
  await copyToClipboard(inviteCode)
  message.success('代理邀请码已复制')
}

const loadSelfInvitation = async () => {
  selfInvitationLoading.value = true
  try {
    selfInvitation.value = await TenantApi.getTenantInvitation()
  } finally {
    selfInvitationLoading.value = false
  }
}

onMounted(() => (isSuperAdmin.value ? getList() : loadSelfInvitation()))
</script>
