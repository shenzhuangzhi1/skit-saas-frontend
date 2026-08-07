<template>
  <section class="member-summary" aria-label="按用户结算消费概览">
    <div class="metric-grid">
      <article class="metric-card metric-card--primary">
        <div class="metric-card__icon"><Icon icon="ep:user" /></div>
        <div>
          <span>结算正常用户</span>
          <strong>{{ count(summary.memberCount) }}</strong>
          <small>窗口内有已结算消费的用户数</small>
        </div>
      </article>
      <article class="metric-card">
        <div class="metric-card__icon metric-card__icon--cyan"><Icon icon="ep:connection" /></div>
        <div>
          <span>已结算消费次数</span>
          <strong>{{ count(summary.settledImpressionCount) }}</strong>
          <small>仅统计 RECONCILED + REWARDED 收益事件</small>
        </div>
      </article>
    </div>

    <div v-if="summary.currencyGroups.length" class="money-grid">
      <article
        v-for="group in summary.currencyGroups"
        :key="`${group.currency}-${group.amountScale}`"
        class="money-card"
      >
        <header>
          <strong>{{ group.currency }}</strong>
          <span>{{ count(group.settledImpressionCount) }} 次已结算消费</span>
        </header>
        <div>
          <span>结算金额</span>
          <strong v-if="group.settledAmountUnits != null">
            <MoneyText
              :amount-scale="group.amountScale"
              :amount-units="group.settledAmountUnits"
              :currency="group.currency"
            />
          </strong>
          <small v-else>暂无结算金额</small>
        </div>
        <div>
          <span>平台预估</span>
          <strong v-if="group.estimatedAmountUnits != null">
            <MoneyText
              :amount-scale="group.amountScale"
              :amount-units="group.estimatedAmountUnits"
              :currency="group.currency"
              :decimals="4"
            />
          </strong>
          <small v-else>暂无预估</small>
        </div>
      </article>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { AdConsumptionMemberSummaryVO } from '@/api/skit/adConsumption'
import MoneyText from '@/views/skit/shared/MoneyText.vue'

defineProps<{ summary: AdConsumptionMemberSummaryVO }>()

const formatter = new Intl.NumberFormat('zh-CN')
const count = (value: number) => formatter.format(value)
</script>

<style scoped lang="scss">
.member-summary {
  display: grid;
  gap: 14px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  min-width: 0;
  padding: 16px;
  background: linear-gradient(145deg, var(--el-bg-color), var(--el-fill-color-lighter));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 4%);
  gap: 12px;

  &--primary {
    border-color: rgb(79 70 229 / 20%);
    box-shadow: 0 12px 28px rgb(79 70 229 / 8%);
  }

  span,
  small {
    display: block;
  }

  span {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  strong {
    display: block;
    margin: 4px 0 3px;
    font-size: clamp(20px, 2vw, 28px);
    line-height: 1.15;
    color: var(--el-text-color-primary);
  }

  small {
    overflow: hidden;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.metric-card__icon {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 11px;
  place-items: center;

  &--cyan {
    color: #0891b2;
    background: var(--el-fill-color-light);
  }
}

.money-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.money-card {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 10px;
    gap: 10px;

    strong {
      font-size: 15px;
    }

    span {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-top: 8px;
    gap: 10px;
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  small {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
