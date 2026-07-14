<template>
  <el-skeleton v-if="loading" :rows="4" animated />
  <div v-else-if="error" role="alert">
    <el-alert :closable="false" :title="error" show-icon type="error" />
  </div>
  <div v-else-if="empty" class="py-32px text-center text-[var(--el-text-color-secondary)]">
    {{ emptyText }}
  </div>
  <slot v-else />
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    loading?: boolean
    error?: string
    empty: boolean
    emptyText?: string
  }>(),
  {
    loading: false,
    error: '',
    emptyText: '暂无数据'
  }
)
</script>
