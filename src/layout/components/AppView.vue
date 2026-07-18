<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useAppStore } from '@/store/modules/app'
import { Footer } from '@/layout/components/Footer'

defineOptions({ name: 'AppView' })

const appStore = useAppStore()

const footer = computed(() => appStore.getFooter)

const tagsViewStore = useTagsViewStore()

const getCaches = computed((): string[] => {
  return tagsViewStore.getCachedViews
})

//region 无感刷新
const routerAlive = ref(true)
// 无感刷新，防止出现页面闪烁白屏
const reload = () => {
  routerAlive.value = false
  nextTick(() => (routerAlive.value = true))
}
// 为组件后代提供刷新方法
provide('reload', reload)
//endregion
</script>

<template>
  <section
    :class="[
      'app-view-shell p-[var(--app-content-padding)] w-full bg-[var(--app-content-bg-color)] dark:bg-[var(--el-bg-color)]',
      {
        '!min-h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-footer-height))] pb-0':
          footer
      }
    ]"
  >
    <router-view v-if="routerAlive">
      <template #default="{ Component, route }">
        <keep-alive :include="getCaches">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </template>
    </router-view>
  </section>
  <Footer v-if="footer" />
</template>

<style lang="scss" scoped>
.app-view-shell {
  position: relative;
  background: transparent !important;

  &::before {
    position: fixed;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(circle at 76% 4%, rgb(99 102 241 / 9%), transparent 28rem),
      radial-gradient(circle at 24% 96%, rgb(20 184 166 / 7%), transparent 26rem);
    content: '';
    inset: 0;
  }
}

:global(.dark) .app-view-shell::before {
  background:
    radial-gradient(circle at 76% 4%, rgb(99 102 241 / 13%), transparent 30rem),
    radial-gradient(circle at 24% 96%, rgb(45 212 191 / 7%), transparent 28rem);
}
</style>
