<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'WorkspaceSwitch' })

const route = useRoute()
const router = useRouter()

const activeWorkspace = computed(() => (route.path.startsWith('/skit') ? 'admin' : 'overview'))

const switchWorkspace = (path: string) => {
  if (route.path !== path) {
    router.push(path)
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
  background: rgb(241 245 249 / 82%);
  border: 1px solid rgb(148 163 184 / 17%);
  border-radius: 14px;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 0 11px;
    color: #64748b;
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
      color: #4f46e5;
      background: #fff;
      box-shadow: 0 7px 18px -12px rgb(30 41 59 / 48%);
    }
  }
}

:global(.dark) .workspace-switch {
  background: #0b1120;
  border-color: rgb(255 255 255 / 8%);

  button {
    color: #aab2c0;

    &.is-active {
      color: #c7d2fe;
      background: #1e293b;
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
