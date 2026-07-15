<template>
  <section>
    <div class="mb-8px font-600">收益精确预览</div>
    <div class="mb-8px flex justify-between gap-12px">
      <span>广告总收益</span>
      <MoneyText :amount-scale="amountScale" :amount-units="amountUnits" :currency="currency" />
    </div>
    <div v-for="share in shares" :key="share.levelNo" class="flex justify-between gap-12px">
      <span>{{ levelLabel(share.levelNo) }}（{{ formatRate(share.rateBps) }}）</span>
      <MoneyText
        :amount-scale="amountScale"
        :amount-units="share.amountUnits"
        :currency="currency"
      />
    </div>
    <div class="mt-8px flex justify-between gap-12px font-600">
      <span>代理商留存（{{ formatRate(agentRateBps) }}）</span>
      <MoneyText
        :amount-scale="amountScale"
        :amount-units="agentAmountUnits"
        :currency="currency"
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
import MoneyText from '@/views/skit/shared/MoneyText.vue'

defineProps<{
  currency: string
  amountUnits: number | string | bigint
  amountScale: number
  shares: Array<{
    levelNo: number
    rateBps: number
    amountUnits: number | string | bigint
  }>
  agentRateBps: number
  agentAmountUnits: number | string | bigint
}>()

const levelLabel = (levelNo: number) => (levelNo === 0 ? '本人' : `${levelNo} 级上级`)
const formatRate = (rateBps: number) => `${(rateBps / 100).toFixed(2)}%`
</script>
