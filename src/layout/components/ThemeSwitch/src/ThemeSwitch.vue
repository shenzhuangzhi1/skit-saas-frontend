<script lang="ts" setup>
import { useAppStore } from '@/store/modules/app'
import { useIcon } from '@/hooks/web/useIcon'
import { useDesign } from '@/hooks/web/useDesign'
import { runThemeTransition } from '@/plugins/microInteractions/transitions'

defineOptions({ name: 'ThemeSwitch' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('theme-switch')

const Sun = useIcon({ icon: 'emojione-monotone:sun', color: 'var(--theme-switch-icon)' })

const CrescentMoon = useIcon({
  icon: 'emojione-monotone:crescent-moon',
  color: 'var(--theme-switch-icon)'
})

const appStore = useAppStore()

// 初始化获取是否是暗黑主题
const isDark = computed(() => appStore.getIsDark)
const themeSwitch = ref()

const toggleTheme = (value: boolean) => {
  const origin = themeSwitch.value?.$el as HTMLElement | undefined
  return runThemeTransition(() => appStore.setIsDark(value), origin)
}

// 设置switch的背景颜色
const trackColor = 'var(--theme-switch-track)'
</script>

<template>
  <ElSwitch
    ref="themeSwitch"
    :model-value="isDark"
    aria-label="切换亮色和深色模式"
    :active-color="trackColor"
    :active-icon="Sun"
    :border-color="trackColor"
    :class="prefixCls"
    :inactive-color="trackColor"
    :inactive-icon="CrescentMoon"
    inline-prompt
    @change="toggleTheme"
  />
</template>
<style lang="scss" scoped>
:deep(.el-switch__core .el-switch__inner .is-icon) {
  overflow: visible;
}
</style>
