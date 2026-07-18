<script lang="ts" setup>
import { computed, onMounted, ref, unref, watch } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { getLayoutRenderMode, isHeaderNavLayout } from '@/utils/layout'

defineOptions({ name: 'Logo' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('logo')

const appStore = useAppStore()

const show = ref(true)

const title = computed(() => appStore.getTitle)

const layout = computed(() => appStore.getLayout)

const collapse = computed(() => appStore.getCollapse)

onMounted(() => {
  if (unref(collapse)) show.value = false
})

watch(
  () => collapse.value,
  (collapse: boolean) => {
    if (
      getLayoutRenderMode(unref(layout)) === 'topLeft' ||
      getLayoutRenderMode(unref(layout)) === 'cutMenu'
    ) {
      show.value = true
      return
    }
    if (!collapse) {
      setTimeout(() => {
        show.value = !collapse
      }, 400)
    } else {
      show.value = !collapse
    }
  }
)

watch(
  () => layout.value,
  (layout) => {
    const renderMode = getLayoutRenderMode(layout)
    if (renderMode === 'top' || renderMode === 'cutMenu') {
      show.value = true
    } else {
      if (unref(collapse)) {
        show.value = false
      } else {
        show.value = true
      }
    }
  }
)
</script>

<template>
  <div>
    <router-link
      :class="[
        prefixCls,
        getLayoutRenderMode(layout) !== 'classic' ? `${prefixCls}__Top` : '',
        'flex !h-[var(--logo-height)] items-center cursor-pointer pl-8px relative decoration-none overflow-hidden'
      ]"
      to="/"
    >
      <img
        class="app-brand-logo h-[calc(var(--logo-height)-18px)] w-[calc(var(--logo-height)-18px)]"
        src="@/assets/imgs/logo.png"
      />
      <div
        v-if="show"
        :class="[
          'app-brand-title ml-10px text-16px font-700',
          {
            'text-[var(--logo-title-text-color)]': getLayoutRenderMode(layout) === 'classic',
            'text-[var(--top-header-text-color)]':
              getLayoutRenderMode(layout) === 'topLeft' ||
              isHeaderNavLayout(layout) ||
              getLayoutRenderMode(layout) === 'cutMenu'
          }
        ]"
      >
        {{ title }}
      </div>
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.app-brand-logo {
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 8px 18px -10px rgb(31 42 68 / 52%);
}

.app-brand-title {
  max-width: 190px;
  overflow: hidden;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
