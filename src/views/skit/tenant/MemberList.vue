<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="成员" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          class="!w-260px"
          clearable
          placeholder="用户名、昵称、手机号或邀请码"
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
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
        <el-table-column align="center" label="用户编号" min-width="100">
          <template #default="scope">{{ scope.row.userId ?? scope.row.id }}</template>
        </el-table-column>
        <el-table-column align="center" label="用户名" min-width="130" prop="username" />
        <el-table-column align="center" label="昵称" min-width="130" prop="nickname" />
        <el-table-column align="center" label="手机号" min-width="130" prop="mobile" />
        <el-table-column align="center" label="邀请码" min-width="130" prop="inviteCode" />
        <el-table-column align="center" label="上级编号" min-width="110">
          <template #default="scope">
            {{ scope.row.parentUserId ?? scope.row.parentId ?? scope.row.inviterId ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="上级用户" min-width="130">
          <template #default="scope">
            {{ scope.row.parentNickname ?? scope.row.parentName ?? '-' }}
          </template>
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
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as TenantApi from '@/api/skit/tenant'

defineOptions({ name: 'SkitTenantMemberList' })

const props = defineProps<{ tenantId?: number }>()
const loading = ref(false)
const total = ref(0)
const list = ref<TenantApi.TenantMemberVO[]>([])
const queryFormRef = ref<FormInstance>()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: ''
})

const getList = async () => {
  if (!props.tenantId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const data = await TenantApi.getTenantMemberPage({
      tenantId: props.tenantId,
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || undefined
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
