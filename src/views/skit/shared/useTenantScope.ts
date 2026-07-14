import { computed, readonly, ref } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getTenantId } from '@/utils/auth'
import {
  createTenantScope,
  selectTenantScope,
  tenantScopeQuery,
  type TenantScopeSelection
} from './tenantScope'

export const useTenantScope = () => {
  const userStore = useUserStore()
  const originalTenantId = Number(getTenantId())
  const current = ref(
    createTenantScope({ roles: userStore.getRoles, originalTenantId })
  )

  const select = (selection: TenantScopeSelection) => {
    current.value = selectTenantScope(current.value, selection)
  }

  return {
    scope: readonly(current),
    query: computed(() => tenantScopeQuery(current.value)),
    isPlatformAdmin: computed(() => current.value.platformAdmin),
    select
  }
}
