<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="收益用户" prop="memberId">
        <el-input
          v-model="queryParams.memberId"
          class="!w-220px"
          clearable
          placeholder="请输入用户编号"
          @keyup.enter="handleQuery"
        />
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
      <el-alert
        :closable="false"
        class="mb-16px"
        show-icon
        title="当前为客户端上报的预估分成，尚未经过广告平台服务端对账，不可作为可提现金额。"
        type="warning"
      />
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
        <el-table-column align="center" label="账本编号" min-width="100" prop="id" />
        <el-table-column align="center" label="广告记录" min-width="120" prop="adRecordId" />
        <el-table-column align="center" label="收益用户编号" min-width="120">
          <template #default="scope">
            {{
              isAgentRetention(scope.row)
                ? '代理商'
                : (scope.row.beneficiaryUserId ?? scope.row.memberId ?? '-')
            }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="收益用户" min-width="130">
          <template #default="scope">
            {{
              isAgentRetention(scope.row)
                ? '代理商留存'
                : (scope.row.beneficiaryNickname ?? scope.row.memberName ?? '-')
            }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="广告用户编号" min-width="120">
          <template #default="scope">
            {{ scope.row.sourceUserId ?? scope.row.sourceMemberId ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="广告用户" min-width="130">
          <template #default="scope">
            {{ scope.row.sourceNickname ?? scope.row.sourceMemberName ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="收益层级" min-width="100">
          <template #default="scope">
            {{ levelLabel(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="广告收入" min-width="110">
          <template #default="scope">
            {{ formatAmount(scope.row.revenueAmount ?? scope.row.adRevenue) }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="分成比例" min-width="100">
          <template #default="scope">{{ formatRate(scope.row.rate) }}</template>
        </el-table-column>
        <el-table-column align="center" label="分成金额" min-width="110">
          <template #default="scope">
            <el-tag type="warning">{{ formatAmount(scope.row.commissionAmount) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="账本状态" min-width="130">
          <template #default="scope">
            <el-tag type="warning">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="入账时间"
          min-width="180"
          prop="createTime"
          :formatter="dateFormatter"
        />
      </el-table>
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </template>
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitTenantCommissionLedger' })

const props = defineProps<{ tenantId?: number }>()
const loading = ref(false)
const total = ref(0)
const list = ref<TenantApi.TenantCommissionLedgerVO[]>([])
const queryFormRef = ref<FormInstance>()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  memberId: ''
})

const formatAmount = (value?: number) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : '-'
}

const formatRate = (value?: number) => {
  const rate = Number(value)
  return Number.isFinite(rate) ? `${rate.toFixed(2)}%` : '-'
}

const statusLabel = (status?: string) =>
  String(status || '').toUpperCase() === 'ESTIMATED' ? '预估（未结算）' : status || '-'

const isAgentRetention = (row: TenantApi.TenantCommissionLedgerVO) =>
  Number(row.beneficiaryType) === 2 || Number(row.level) === -1

const levelLabel = (row: TenantApi.TenantCommissionLedgerVO) => {
  if (isAgentRetention(row)) return '代理商留存'
  return Number(row.level || 0) === 0 ? '本人' : `${row.level} 级上级`
}

const getList = async () => {
  if (!props.tenantId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const memberId = Number(queryParams.memberId)
    const data = await TenantApi.getTenantCommissionLedgerPage({
      tenantId: props.tenantId,
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      beneficiaryUserId: Number.isFinite(memberId) && memberId > 0 ? memberId : undefined
    })
    list.value = data.list || []
    total.value = Number(data.total || 0)
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

watch(
  () => props.tenantId,
  () => {
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>
