<template>
  <section class="overview-groups" aria-label="广告收益汇总">
    <article v-for="group in groups" :key="group.currency" class="overview-group">
      <header class="overview-group__header">
        <div>
          <span class="overview-group__eyebrow">币种</span>
          <strong>{{ group.currency }}</strong>
        </div>
        <div class="overview-group__members">
          <span>独立会员</span>
          <strong>{{ count(group.uniqueMemberCount) }}</strong>
        </div>
      </header>

      <div class="overview-group__grid">
        <div class="metric metric--frozen">
          <span>预估冻结</span>
          <strong><MoneyText v-bind="money(group.currency, group.frozenRevenue)" /></strong>
          <small>已验证、等待平台报表</small>
        </div>
        <div class="metric metric--reconciled">
          <span>已对账</span>
          <strong><MoneyText v-bind="money(group.currency, group.reconciledRevenue)" /></strong>
          <small>平台报表已分配</small>
        </div>
        <div class="metric metric--suspense">
          <span>暂挂</span>
          <strong><MoneyText v-bind="money(group.currency, group.suspenseRevenue)" /></strong>
          <small>差异待核查，不可结算</small>
        </div>
        <div class="metric metric--agent">
          <span>代理商留存</span>
          <strong><MoneyText v-bind="money(group.currency, group.agentRetainedRevenue)" /></strong>
          <small>按生效分成版本计算</small>
        </div>
      </div>

      <div v-if="group.levelShares.length" class="overview-group__shares">
        <span
          v-for="share in group.levelShares"
          :key="`${group.currency}-${share.levelNo}`"
          class="share-chip"
        >
          第 {{ share.levelNo }} 层
          <MoneyText v-bind="money(group.currency, share.amount)" />
        </span>
      </div>
    </article>
  </section>
</template>

<script lang="ts" setup>
import type { AdAnalyticsOverviewGroupVO } from '@/api/skit/analytics'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import { decimalAmountToMoneyUnits } from './monitoringModel'

defineProps<{ groups: AdAnalyticsOverviewGroupVO[] }>()

const formatter = new Intl.NumberFormat('zh-CN')
const count = (value: number) => formatter.format(value)
const money = (currency: string, amount: string) => decimalAmountToMoneyUnits(currency, amount)
</script>

<style scoped>
.overview-groups {
  display: grid;
  gap: 16px;
}

.overview-group {
  padding: 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
}

.overview-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.overview-group__header > div:first-child {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.overview-group__eyebrow,
.overview-group__members span,
.metric span,
.metric small {
  color: var(--el-text-color-secondary);
}

.overview-group__members {
  display: flex;
  gap: 8px;
}

.overview-group__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric {
  display: grid;
  padding: 14px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  gap: 6px;
}

.metric strong {
  font-size: 20px;
}

.metric--frozen {
  border-left: 3px solid var(--el-color-warning);
}

.metric--reconciled {
  border-left: 3px solid var(--el-color-success);
}

.metric--suspense {
  border-left: 3px solid var(--el-color-danger);
}

.metric--agent {
  border-left: 3px solid var(--el-color-primary);
}

.overview-group__shares {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.share-chip {
  padding: 5px 9px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

@media (width <= 960px) {
  .overview-group__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 560px) {
  .overview-group__grid {
    grid-template-columns: 1fr;
  }
}
</style>
