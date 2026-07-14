<template>
  <div class="table-shell" :aria-busy="loading">
    <table class="monitor-table">
      <thead>
        <tr>
          <th>事件 / 会话</th>
          <th v-if="showTenant">归属租户</th>
          <th>会员</th>
          <th>平台 / 广告位</th>
          <th>证据</th>
          <th>收益状态</th>
          <th>预估 / 已对账</th>
          <th>发生时间</th>
          <th><span class="sr-only">详情</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="showTenant ? 9 : 8" class="table-state">正在加载真实事件…</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="showTenant ? 9 : 8" class="table-state">当前筛选范围暂无广告事件</td>
        </tr>
        <tr v-for="row in rows" v-else :key="row.id">
          <td>
            <strong>#{{ row.id }}</strong>
            <small>{{ row.sessionId || '-' }}</small>
          </td>
          <td v-if="showTenant"
            ><span class="status-pill">租户 {{ row.tenantId }}</span></td
          >
          <td>{{ row.memberId || '-' }}</td>
          <td>
            <strong>{{ row.provider }}</strong>
            <small>{{ row.placementId }}</small>
          </td>
          <td>
            <span class="status-pill">{{ matchLabel(row.matchStatus) }}</span>
            <small>{{ sourceVerificationLabel(row.sourceVerificationStatus) }}</small>
          </td>
          <td>{{ reconciliationStatusLabel(row.reconciliationStatus) }}</td>
          <td>
            <MoneyText v-bind="money(row.currency, row.estimatedAmount)" />
            <small v-if="row.reconciledAmount !== null && row.reconciledAmount !== undefined">
              <MoneyText v-bind="money(row.currency, row.reconciledAmount)" />
            </small>
            <small v-else>尚未对账</small>
          </td>
          <td>{{ formatDate(row.occurredTime) }}</td>
          <td>
            <button class="trace-button" type="button" @click="emit('select', row.id)">
              查看轨迹
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import type { AdEventRowVO } from '@/api/skit/adEvent'
import { formatDate } from '@/utils/formatTime'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import {
  decimalAmountToMoneyUnits,
  reconciliationStatusLabel,
  sourceVerificationLabel
} from './monitoringModel'

withDefaults(defineProps<{ rows: AdEventRowVO[]; loading?: boolean; showTenant?: boolean }>(), {
  loading: false,
  showTenant: false
})
const emit = defineEmits<{ (event: 'select', id: number): void }>()

const money = (currency: string, amount: string) => decimalAmountToMoneyUnits(currency, amount)
const matchLabel = (status: string) =>
  ({ MATCHED: '已匹配', UNMATCHED: '未匹配', CONFLICT: '证据冲突' })[status] || status
</script>

<style scoped>
.table-shell {
  overflow-x: auto;
}

.monitor-table {
  width: 100%;
  min-width: 1120px;
  border-collapse: separate;
  border-spacing: 0;
}

.monitor-table th,
.monitor-table td {
  padding: 12px;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.monitor-table th {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.monitor-table td strong,
.monitor-table td small {
  display: block;
}

.monitor-table td small {
  max-width: 220px;
  margin-top: 4px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill {
  display: inline-block;
  padding: 2px 7px;
  font-size: 12px;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-radius: 999px;
}

.trace-button {
  color: var(--el-color-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.table-state {
  padding: 30px !important;
  color: var(--el-text-color-secondary);
  text-align: center !important;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
