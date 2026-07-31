<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { getIcon, Icon as IconifyIcon } from '@iconify/vue'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'Icon' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('icon')

const props = defineProps({
  // icon name
  icon: propTypes.string,
  // icon color
  color: propTypes.string,
  // icon size
  size: propTypes.number.def(16),
  // icon svg class
  svgClass: propTypes.string.def('')
})

const isLocal = computed(() => props.icon?.startsWith('svg-icon:'))

const symbolId = computed(() => {
  return unref(isLocal) ? `#icon-${props.icon.split('svg-icon:')[1]}` : props.icon
})

// Pass bundled icon data rather than a name. Unknown names therefore render
// nothing locally and can never activate Iconify's remote API loader.
const bundledIcon = computed(() => {
  const name = unref(symbolId)
  return !unref(isLocal) && typeof name === 'string' ? getIcon(name) : null
})

const getSvgClass = computed(() => {
  const { svgClass } = props
  return `iconify ${svgClass}`
})
</script>

<template>
  <ElIcon :class="prefixCls" :color="color" :size="size">
    <svg v-if="isLocal" :class="getSvgClass" :data-icon="symbolId">
      <use :xlink:href="symbolId" />
    </svg>

    <IconifyIcon
      v-else-if="bundledIcon"
      :icon="bundledIcon"
      :class="getSvgClass"
      :data-icon="symbolId"
      :style="{ fontSize: `${size}px`, color }"
    />
  </ElIcon>
</template>
