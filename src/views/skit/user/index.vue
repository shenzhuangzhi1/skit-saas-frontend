<template>
  <div class="user-management-page">
    <ContentWrap>
      <div class="flex flex-wrap items-start justify-between gap-16px">
        <div>
          <h2 class="m-0 text-22px">用户管理</h2>
          <p class="mb-0 mt-8px text-14px text-[var(--el-text-color-secondary)]">
            管理 App 用户状态、登录密码和邀请关系。所有操作都会由服务端再次校验代理商归属。
          </p>
        </div>
        <TenantScopeBar
          v-model="scopeModel"
          :loading="tenantOptionsLoading"
          remote
          :tenants="tenantOptions"
          @search="loadTenantOptions"
        />
      </div>
      <el-alert
        v-if="tenantOptionsError"
        class="mt-16px"
        :closable="false"
        :title="tenantOptionsError"
        show-icon
        type="warning"
      />
    </ContentWrap>

    <MemberList :target="memberTarget" :show-tenant="scopeManager.isPlatformAdmin.value" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import * as TenantApi from '@/api/skit/tenant'
import TenantScopeBar from '@/views/skit/shared/TenantScopeBar.vue'
import type { TenantScope, TenantScopeSelection } from '@/views/skit/shared/tenantScope'
import { useTenantScope } from '@/views/skit/shared/useTenantScope'
import MemberList from '@/views/skit/tenant/MemberList.vue'

defineOptions({ name: 'SkitAppUserManagement' })

const scopeManager = useTenantScope()
const tenantOptions = ref<Array<{ tenantId: number; name: string }>>([])
const tenantOptionsLoading = ref(false)
const tenantOptionsError = ref('')
let tenantOptionsRequestSeq = 0

const scopeModel = computed<TenantScope>({
  get: () => scopeManager.scope.value,
  set: (value) => {
    const selection: TenantScopeSelection = value.kind === 'all' ? 'all' : value.targetTenantId
    scopeManager.select(selection)
  }
})

const memberTarget = computed<TenantApi.MemberManagementTarget>(() => {
  const scope = scopeModel.value
  if (scope.kind === 'all') return { kind: 'all' }
  if (scope.kind === 'single') return { kind: 'platform', tenantId: scope.targetTenantId }
  return { kind: 'own', tenantId: scope.originalTenantId }
})

const errorText = (cause: unknown) =>
  cause instanceof Error && cause.message ? cause.message : '未知错误'

const loadTenantOptions = async (keyword = '') => {
  const requestSeq = ++tenantOptionsRequestSeq
  tenantOptionsLoading.value = true
  tenantOptionsError.value = ''
  try {
    if (scopeManager.isPlatformAdmin.value) {
      const page = await TenantApi.getTenantAgentPage({
        pageNo: 1,
        pageSize: 100,
        keyword: keyword || undefined
      })
      if (requestSeq !== tenantOptionsRequestSeq) return
      const next = (page.list || []).map((tenant) => ({
        tenantId: tenant.tenantId,
        name: tenant.name
      }))
      const selected =
        scopeModel.value.kind === 'single'
          ? tenantOptions.value.find(
              (tenant) => tenant.tenantId === scopeModel.value.targetTenantId
            )
          : undefined
      if (selected && !next.some((tenant) => tenant.tenantId === selected.tenantId)) {
        next.unshift(selected)
      }
      tenantOptions.value = next
      return
    }

    const invitation = await TenantApi.getTenantInvitation()
    if (requestSeq !== tenantOptionsRequestSeq) return
    tenantOptions.value = [{ tenantId: invitation.tenantId, name: invitation.tenantName }]
  } catch (cause) {
    if (requestSeq !== tenantOptionsRequestSeq) return
    tenantOptions.value = []
    tenantOptionsError.value = `代理商选择列表加载失败：${errorText(cause)}`
  } finally {
    if (requestSeq === tenantOptionsRequestSeq) tenantOptionsLoading.value = false
  }
}

onMounted(() => loadTenantOptions())
</script>

<style scoped>
.user-management-page {
  display: grid;
  gap: 14px;
}
</style>
