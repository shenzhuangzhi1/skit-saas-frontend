<template>
  <div class="grid gap-10px md:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="row in totals"
      :key="`${row.balanceBucket}:${row.currency}`"
      class="rounded border p-12px"
    >
      <el-tag class="mb-6px" size="small">{{ bucketLabel(row.balanceBucket) }}</el-tag>
      <div class="text-18px font-600">
        <MoneyText
          :amount-scale="row.amountScale"
          :amount-units="row.amountUnits"
          :currency="row.currency"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import { groupLedgerAmounts, type LedgerBalanceBucket, type LedgerMoneyRow } from './workspaceModel'

const props = defineProps<{ rows: LedgerMoneyRow[] }>()
const totals = computed(() => groupLedgerAmounts(props.rows))

const bucketLabel = (bucket: LedgerBalanceBucket) =>
  ({
    FROZEN: '冻结',
    AVAILABLE: '可用结算',
    NON_SETTLEABLE: '不可结算',
    SETTLED: '可结算',
    ADJUSTMENT: '调整',
    REVERSAL: '冲正',
    SUSPENSE: '暂挂'
  })[bucket]
</script>
