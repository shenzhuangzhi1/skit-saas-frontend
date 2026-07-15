<template>
  <div class="table-shell" :aria-busy="loading">
    <table class="reconciliation-table">
      <thead>
        <tr>
          <th>报表日期</th>
          <th v-if="showTenant">归属租户</th>
          <th>账号</th>
          <th>状态</th>
          <th>预估</th>
          <th>平台实际</th>
          <th>差异</th>
          <th>展示匹配</th>
          <th>修订</th>
          <th><span class="sr-only">差异详情</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="showTenant ? 10 : 9" class="table-state">正在加载平台报表…</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="showTenant ? 10 : 9" class="table-state">当前筛选范围暂无对账记录</td>
        </tr>
        <tr v-for="row in rows" v-else :key="row.id">
          <td>{{ row.reportDate }}</td>
          <td v-if="showTenant"
            ><span class="status-pill">租户 {{ row.tenantId }}</span></td
          >
          <td>{{ row.adAccountId }}</td>
          <td
            ><span class="status-pill">{{ reconciliationStatusLabel(row.status) }}</span></td
          >
          <td><MoneyText v-bind="money(row.currency, row.estimatedAmount)" /></td>
          <td><MoneyText v-bind="money(row.currency, row.actualAmount)" /></td>
          <td><MoneyText v-bind="money(row.currency, row.differenceAmount)" /></td>
          <td>{{ row.matchedImpressions }} / {{ row.reportImpressions }}</td>
          <td>{{ row.latestRevisionNo ? `#${row.latestRevisionNo}` : '-' }}</td>
          <td>
            <button class="detail-button" type="button" @click="emit('select', row.id)">
              查看差异
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import type { ReconciliationRowVO } from '@/api/skit/reconciliation'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import { decimalAmountToMoneyUnits, reconciliationStatusLabel } from './monitoringModel'

withDefaults(
  defineProps<{ rows: ReconciliationRowVO[]; loading?: boolean; showTenant?: boolean }>(),
  { loading: false, showTenant: false }
)
const emit = defineEmits<{ (event: 'select', id: number): void }>()
const money = (currency: string, amount: string) => decimalAmountToMoneyUnits(currency, amount)
</script>

<style scoped>
.table-shell {
  overflow-x: auto;
}

.reconciliation-table {
  width: 100%;
  min-width: 1040px;
  border-collapse: separate;
  border-spacing: 0;
}

.reconciliation-table th,
.reconciliation-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.reconciliation-table th {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.status-pill {
  display: inline-block;
  padding: 2px 7px;
  font-size: 12px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-radius: 999px;
}

.detail-button {
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
