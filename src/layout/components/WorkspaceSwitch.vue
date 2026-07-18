<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { runWorkspaceTransition } from '@/plugins/microInteractions/transitions'

defineOptions({ name: 'WorkspaceSwitch' })

const route = useRoute()
const router = useRouter()

const activeWorkspace = computed(() => (route.path.startsWith('/skit') ? 'admin' : 'overview'))

const switchWorkspace = (path: string) => {
  if (route.path !== path) {
    const direction = path.startsWith('/skit') ? 1 : -1
    return runWorkspaceTransition(() => router.push(path), direction)
  }
}
</script>

<template>
  <div class="workspace-switch" aria-label="工作台切换">
    <button
      type="button"
      :class="{ 'is-active': activeWorkspace === 'overview' }"
      @click="switchWorkspace('/index')"
    >
      <Icon icon="ep:data-analysis" :size="15" />
      <span>数据总览</span>
    </button>
    <button
      type="button"
      :class="{ 'is-active': activeWorkspace === 'admin' }"
      @click="switchWorkspace('/skit/user')"
    >
      <Icon icon="ep:monitor" :size="15" />
      <span>管理后台</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.workspace-switch {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  padding: 4px;
  margin-left: 10px;
  background: var(--skit-surface-muted);
  border: 1px solid var(--skit-border-color);
  border-radius: 14px;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 0 11px;
    color: var(--skit-text-secondary);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 9px;
    gap: 6px;
    transition:
      color 0.18s ease,
      background-color 0.18s ease,
      box-shadow 0.18s ease;

    &:hover {
      color: var(--el-color-primary);
    }

    &.is-active {
      font-weight: 700;
      color: var(--el-color-primary);
      background: var(--skit-surface-elevated);
      box-shadow: 0 7px 18px -12px var(--skit-shadow-strong);
    }
  }
}

@media (width <= 900px) {
  .workspace-switch span {
    display: none;
  }

  .workspace-switch button {
    width: 32px;
    padding: 0;
  }
}
</style>
