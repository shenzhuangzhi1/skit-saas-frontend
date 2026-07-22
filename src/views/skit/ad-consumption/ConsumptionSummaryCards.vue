<template>
  <section class="consumption-summary" aria-label="广告消费价值指标">
    <div class="metric-grid">
      <article class="metric-card metric-card--primary">
        <div class="metric-card__icon"><Icon icon="ep:connection" /></div>
        <div>
          <span>广告会话</span>
          <strong>{{ count(summary.sessionCount) }}</strong>
          <small>包含失败、关闭及零收益会话</small>
        </div>
      </article>
      <article class="metric-card">
        <div class="metric-card__icon metric-card__icon--cyan"><Icon icon="ep:view" /></div>
        <div>
          <span>客户端展示率</span>
          <strong>{{ rate(summary.clientShownCount, summary.sessionCount) }}</strong>
          <small
            >{{ count(summary.clientShownCount) }} 次客户端 SHOWN /
            {{ count(summary.sessionCount) }} 次会话</small
          >
        </div>
      </article>
      <article class="metric-card">
        <div class="metric-card__icon metric-card__icon--blue"><Icon icon="ep:data-line" /></div>
        <div>
          <span>收益 Impression 覆盖率</span>
          <strong>{{ rate(summary.platformImpressionCount, summary.sessionCount) }}</strong>
          <small>{{ count(summary.platformImpressionCount) }} 条可信平台收益事实</small>
        </div>
      </article>
      <article class="metric-card">
        <div class="metric-card__icon metric-card__icon--green"
          ><Icon icon="ep:circle-check"
        /></div>
        <div>
          <span>客户端奖励验签成功率</span>
          <strong>{{
            rate(summary.signedVerifiedAndClientObservedCount, summary.clientRewardObservedCount)
          }}</strong>
          <small
            >{{ count(summary.signedVerifiedAndClientObservedCount) }} 次同会话验签 /
            {{ count(summary.clientRewardObservedCount) }} 次客户端奖励观察；服务端共验签
            {{ count(summary.signedVerifiedCount) }} 次</small
          >
        </div>
      </article>
      <article class="metric-card">
        <div class="metric-card__icon metric-card__icon--green"><Icon icon="ep:unlock" /></div>
        <div>
          <span>权益解锁率</span>
          <strong>{{ rate(summary.entitledCount, summary.signedVerifiedCount) }}</strong>
          <small>{{ count(summary.entitledCount) }} 次权益授予</small>
        </div>
      </article>
      <article class="metric-card">
        <div class="metric-card__icon metric-card__icon--violet"><Icon icon="ep:key" /></div>
        <div>
          <span>原生授权访问占比</span>
          <strong>{{ rate(summary.nativeGrantAccessCount, summary.sessionCount) }}</strong>
          <small>{{ count(summary.nativeGrantAccessCount) }} 次会话引用入站授权凭据</small>
        </div>
      </article>
      <article
        class="metric-card"
        :class="{ 'metric-card--warning': summary.earlyClosedCount > 0 }"
      >
        <div class="metric-card__icon metric-card__icon--amber"
          ><Icon icon="ep:switch-button"
        /></div>
        <div>
          <span>提前关闭率</span>
          <strong>{{ rate(summary.earlyClosedCount, summary.sessionCount) }}</strong>
          <small>{{ count(summary.earlyClosedCount) }} 条未进入奖励验证</small>
        </div>
      </article>
      <article class="metric-card" :class="{ 'metric-card--danger': summary.failedCount > 0 }">
        <div class="metric-card__icon metric-card__icon--red"><Icon icon="ep:warning" /></div>
        <div>
          <span>失败率</span>
          <strong>{{ rate(summary.failedCount, summary.sessionCount) }}</strong>
          <small>{{ count(summary.failedCount) }} 条需排查</small>
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
          <span>{{ count(group.platformImpressionCount) }} 条平台 Impression 收益事实</span>
        </header>
        <div>
          <span>预估收益</span>
          <strong v-if="hasAmount(group.estimatedAmount)">
            <MoneyText v-bind="money(group.currency, group.estimatedAmount as string)" />
          </strong>
          <strong v-else>暂无收益事实</strong>
          <small>未结算 · 预估 eCPM {{ group.estimatedEcpm || '暂无' }}</small>
        </div>
        <div>
          <span>平台结算收益</span>
          <strong v-if="hasAmount(group.reconciledAmount)">
            <MoneyText v-bind="money(group.currency, group.reconciledAmount as string)" />
          </strong>
          <strong v-else>尚未结算</strong>
          <small>结算 eCPM {{ group.reconciledEcpm || '暂无' }} · 以平台报表为准</small>
        </div>
      </article>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { AdConsumptionSummaryVO } from '@/api/skit/adConsumption'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import { decimalAmountToMoneyUnits } from '@/views/skit/ad-monitor/monitoringModel'
import { formatConversionRate } from './consumptionModel'

defineProps<{ summary: AdConsumptionSummaryVO }>()

const formatter = new Intl.NumberFormat('zh-CN')
const count = (value: number) => formatter.format(value)
const rate = (numerator: number, denominator: number) =>
  formatConversionRate(numerator, denominator)
const money = (currency: string, amount: string) => decimalAmountToMoneyUnits(currency, amount)
const hasAmount = (amount?: string | null) => amount !== null && amount !== undefined
</script>

<style scoped lang="scss">
.consumption-summary {
  display: grid;
  gap: 14px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

  &--danger {
    border-color: rgb(239 68 68 / 22%);
  }

  &--warning {
    border-color: rgb(245 158 11 / 24%);
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

  &--blue {
    color: #2563eb;
    background: var(--el-fill-color-light);
  }

  &--green {
    color: #059669;
    background: var(--el-color-success-light-9);
  }

  &--violet {
    color: #7c3aed;
    background: var(--el-color-primary-light-9);
  }

  &--red {
    color: #dc2626;
    background: var(--el-color-danger-light-9);
  }

  &--amber {
    color: #d97706;
    background: var(--el-color-warning-light-9);
  }
}

.money-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.money-card {
  display: grid;
  grid-template-columns: minmax(120px, 0.6fr) repeat(2, minmax(160px, 1fr));
  align-items: center;
  padding: 16px 18px;
  background: #0f172a;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 14px;
  box-shadow: 0 12px 30px rgb(15 23 42 / 14%);
  gap: 18px;

  header,
  > div {
    display: grid;
    gap: 3px;
  }

  header strong {
    font-size: 19px;
    color: #fff;
  }

  span,
  small {
    font-size: 11px;
    color: #94a3b8;
  }

  > div > strong {
    font-size: 19px;
    color: #f8fafc;
  }
}

@media (width <= 1280px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (width <= 760px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .money-card {
    grid-template-columns: 1fr;
  }
}

@media (width <= 480px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
