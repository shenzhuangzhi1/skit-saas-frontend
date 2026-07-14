<template>
  <section class="funnel" aria-label="广告验证漏斗">
    <article v-for="item in items" :key="item.key" class="funnel__stage">
      <div class="funnel__label">
        <span>{{ item.label }}</span>
        <span :class="['authority', `authority--${item.authority}`]">
          {{ item.authority === 'server' ? '服务端证据' : '客户端遥测' }}
        </span>
      </div>
      <strong>{{ formatter.format(item.count) }}</strong>
    </article>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { AdAnalyticsOverviewGroupVO } from '@/api/skit/analytics'
import { buildFunnelItems } from './monitoringModel'

const props = defineProps<{ group: AdAnalyticsOverviewGroupVO }>()
const items = computed(() => buildFunnelItems(props.group))
const formatter = new Intl.NumberFormat('zh-CN')
</script>

<style scoped>
.funnel {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 10px;
  overflow-x: auto;
}

.funnel__stage {
  min-width: 120px;
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
}

.funnel__label {
  display: grid;
  min-height: 44px;
  gap: 4px;
  color: var(--el-text-color-regular);
}

.funnel__stage strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
}

.authority {
  width: fit-content;
  padding: 1px 6px;
  font-size: 11px;
  border-radius: 999px;
}

.authority--server {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.authority--telemetry {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
</style>
