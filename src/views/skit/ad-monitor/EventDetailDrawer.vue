<template>
  <el-drawer
    :model-value="modelValue"
    size="min(760px, 92vw)"
    title="广告事件证据轨迹"
    @close="emit('update:modelValue', false)"
  >
    <div v-if="loading" class="detail-state">正在读取不可变事件证据…</div>
    <div v-else-if="error" class="detail-error" role="alert">{{ error }}</div>
    <div v-else-if="detail" class="detail">
      <section class="detail__summary">
        <div
          ><span>归属租户</span><strong>租户 {{ detail.tenantId }}</strong></div
        >
        <div
          ><span>事件</span><strong>#{{ detail.id }}</strong></div
        >
        <div
          ><span>会话</span><strong>{{ detail.sessionId || '-' }}</strong></div
        >
        <div
          ><span>平台交易</span><strong>{{ detail.providerTransactionId || '-' }}</strong></div
        >
        <div
          ><span>平台展示</span><strong>{{ detail.providerShowId || '-' }}</strong></div
        >
        <div
          ><span>策略快照</span><strong>{{ detail.policySnapshotId || '-' }}</strong></div
        >
        <div>
          <span>预估收益</span>
          <strong><MoneyText v-bind="money(detail.currency, detail.estimatedAmount)" /></strong>
        </div>
        <div>
          <span>已对账收益</span>
          <strong v-if="detail.reconciledAmount !== null && detail.reconciledAmount !== undefined">
            <MoneyText v-bind="money(detail.currency, detail.reconciledAmount)" />
          </strong>
          <strong v-else>尚未对账</strong>
        </div>
      </section>

      <section class="detail__section">
        <h3>回调与验签</h3>
        <div v-if="detail.callbackAttempts.length === 0" class="detail-state">暂无回调轨迹</div>
        <ol v-else class="trace-list">
          <li v-for="attempt in detail.callbackAttempts" :key="attempt.id">
            <div>
              <strong>{{ attempt.source }}</strong>
              <span>{{ formatDate(attempt.receivedAt) }}</span>
            </div>
            <div>
              <el-tag size="small">{{ callbackSignatureLabel(attempt.signatureStatus) }}</el-tag>
              <span>{{ attempt.status }}</span>
              <span v-if="attempt.errorCode" class="detail-error">{{ attempt.errorCode }}</span>
            </div>
          </li>
        </ol>
      </section>

      <section class="detail__section">
        <h3>分成分录</h3>
        <div v-if="detail.ledgerEntries.length === 0" class="detail-state">暂无分录</div>
        <div v-else class="ledger-list">
          <article v-for="entry in detail.ledgerEntries" :key="entry.id">
            <div>
              <strong>{{ entry.entryType }}</strong>
              <span>{{ entry.balanceBucket }}</span>
            </div>
            <div>
              <span>{{ entry.beneficiaryType }}</span>
              <span v-if="entry.levelNo !== undefined && entry.levelNo !== null">
                第 {{ entry.levelNo }} 层
              </span>
              <strong><MoneyText v-bind="money(entry.currency, entry.amount)" /></strong>
            </div>
          </article>
        </div>
      </section>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import type { AdEventDetailVO } from '@/api/skit/adEvent'
import { formatDate } from '@/utils/formatTime'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import { callbackSignatureLabel, decimalAmountToMoneyUnits } from './monitoringModel'

withDefaults(
  defineProps<{
    modelValue: boolean
    detail?: AdEventDetailVO
    loading?: boolean
    error?: string
  }>(),
  { detail: undefined, loading: false, error: '' }
)
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>()
const money = (currency: string, amount: string) => decimalAmountToMoneyUnits(currency, amount)
</script>

<style scoped>
.detail {
  display: grid;
  gap: 22px;
}

.detail__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail__summary > div,
.ledger-list article {
  display: grid;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  gap: 5px;
}

.detail__summary span,
.trace-list span,
.ledger-list span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.detail__section h3 {
  margin: 0 0 10px;
  font-size: 16px;
}

.trace-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.trace-list li {
  display: grid;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-left: 3px solid var(--el-color-primary);
  gap: 7px;
}

.trace-list li > div,
.ledger-list article > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ledger-list {
  display: grid;
  gap: 8px;
}

.detail-state {
  padding: 26px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.detail-error {
  color: var(--el-color-danger);
}

@media (width <= 560px) {
  .detail__summary {
    grid-template-columns: 1fr;
  }
}
</style>
