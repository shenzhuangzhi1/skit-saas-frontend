<template>
  <div class="table-shell" :aria-busy="loading">
    <table class="member-table">
      <thead>
        <tr>
          <th v-if="showTenant">归属租户</th>
          <th>用户</th>
          <th>结算正常次数</th>
          <th>结算金额</th>
          <th>预估金额</th>
          <th>结算率</th>
          <th>最近消费时间</th>
          <th><span class="sr-only">操作</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="showTenant ? 8 : 7" class="table-state">正在加载按用户汇总…</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="showTenant ? 8 : 7" class="table-state">
            当前筛选范围没有结算正常的广告消费
          </td>
        </tr>
        <tr v-for="row in rows" v-else :key="memberRowKey(row)">
          <td v-if="showTenant" data-label="归属租户">
            <span class="tenant-chip">租户 {{ row.tenantId }}</span>
          </td>
          <td class="identity-cell" data-label="用户">
            <strong>{{ row.memberNickname || `用户 #${row.memberId}` }}</strong>
            <small>{{ row.memberMobileMasked || `ID ${row.memberId}` }}</small>
          </td>
          <td data-label="结算正常次数">
            <strong>{{ count(row.settledImpressionCount) }}</strong>
            <small>次已结算广告</small>
          </td>
          <td class="money-cell" data-label="结算金额">
            <strong v-if="row.currency && row.settledAmountUnits != null">
              <MoneyText v-bind="money(row, 'settled')" :decimals="4" />
            </strong>
            <small v-else>无</small>
          </td>
          <td class="money-cell" data-label="预估金额">
            <strong v-if="row.currency && row.estimatedAmountUnits != null">
              <MoneyText v-bind="money(row, 'estimated')" :decimals="4" />
            </strong>
            <small v-else>—</small>
          </td>
          <td data-label="结算率">
            <strong>{{ settlementRate(row) }}</strong>
            <small>结算金额 / 预估金额</small>
          </td>
          <td data-label="最近消费时间">
            <strong>{{ formatDate(row.lastConsumedAt) }}</strong>
            <small>首次 {{ formatDate(row.firstConsumedAt) }}</small>
          </td>
          <td data-label="操作">
            <button class="trace-button" type="button" @click="emit('select', row.memberId)">
              查看用户明细
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import type { AdConsumptionId, AdConsumptionMemberRowVO } from '@/api/skit/adConsumption'
import { formatDate } from '@/utils/formatTime'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import { formatConversionRate } from './consumptionModel'

withDefaults(
  defineProps<{ rows: AdConsumptionMemberRowVO[]; loading?: boolean; showTenant?: boolean }>(),
  { loading: false, showTenant: false }
)

const emit = defineEmits<{ (event: 'select', memberId: AdConsumptionId): void }>()

const formatter = new Intl.NumberFormat('zh-CN')
const count = (value: number) => formatter.format(value)

const money = (row: AdConsumptionMemberRowVO, which: 'settled' | 'estimated') => ({
  currency: row.currency as string,
  amountScale: row.amountScale as number,
  amountUnits: (which === 'settled' ? row.settledAmountUnits : row.estimatedAmountUnits) as
    | number
    | string
})

const settlementRate = (row: AdConsumptionMemberRowVO): string => {
  if (row.settledAmountUnits == null || row.estimatedAmountUnits == null) return '—'
  return formatConversionRate(Number(row.settledAmountUnits), Number(row.estimatedAmountUnits))
}

const memberRowKey = (row: AdConsumptionMemberRowVO) =>
  `${row.tenantId}:${row.memberId}:${row.currency}:${row.amountScale}`
</script>

<style scoped lang="scss">
.table-shell {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

.member-table {
  width: 100%;
  min-width: 1120px;
  border-collapse: separate;
  border-spacing: 0;

  th,
  td {
    padding: 13px 14px;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    font-size: 12px;
    font-weight: 700;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-lighter);
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover td {
    background: var(--el-fill-color-light);
  }

  td strong,
  td small {
    display: block;
  }

  td > small {
    margin-top: 4px;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}

.identity-cell {
  min-width: 160px;
}

.tenant-chip {
  display: inline-flex;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 999px;
}

.money-cell {
  min-width: 130px;
}

.trace-button {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  background: var(--el-color-primary-light-9);
  border: 0;
  border-radius: 8px;
}

.table-state {
  padding: 44px !important;
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
