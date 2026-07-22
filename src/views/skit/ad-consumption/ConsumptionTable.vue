<template>
  <div class="table-shell" :aria-busy="loading">
    <table class="consumption-table">
      <thead>
        <tr>
          <th>会话 / 交易</th>
          <th v-if="showTenant">归属租户</th>
          <th>用户</th>
          <th>剧目 / 集数</th>
          <th>广告源</th>
          <th>当前阶段</th>
          <th>收入证据</th>
          <th>请求时间</th>
          <th><span class="sr-only">操作</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="showTenant ? 9 : 8" class="table-state">正在加载真实消费记录…</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="showTenant ? 9 : 8" class="table-state">
            当前筛选范围没有真实广告消费记录
          </td>
        </tr>
        <tr v-for="row in rows" v-else :key="row.id">
          <td class="identity-cell" data-label="会话 / 交易">
            <strong>{{ row.sessionId }}</strong>
            <small>{{ row.providerTransactionId || '平台交易号待回传' }}</small>
          </td>
          <td v-if="showTenant" data-label="归属租户">
            <span class="tenant-chip">租户 {{ row.tenantId }}</span>
          </td>
          <td data-label="用户">
            <strong>{{ row.memberNickname || memberLabel(row.memberId) }}</strong>
            <small>{{
              row.memberMobileMasked || (row.memberId ? `ID ${row.memberId}` : '无用户标识')
            }}</small>
          </td>
          <td data-label="剧目 / 集数">
            <strong>{{ dramaLabel(row.dramaId) }}</strong>
            <small>{{ episodeLabel(row.episodeNo, row.episodeFrom, row.episodeTo) }}</small>
          </td>
          <td data-label="广告源">
            <strong
              >{{ row.provider
              }}{{ row.networkFirmId ? ` · Firm ${row.networkFirmId}` : '' }}</strong
            >
            <small>
              {{ row.adsourceId ? `Adsource ${row.adsourceId} · ` : '' }}{{ row.placementId }}
            </small>
          </td>
          <td data-label="当前阶段">
            <el-tag size="small" effect="light" :type="consumptionStatusTagType(row.status)">
              {{ consumptionStatusLabel(row.status) }}
            </el-tag>
            <small v-if="row.failureReason" class="error-text">{{ row.failureReason }}</small>
          </td>
          <td class="money-cell" data-label="收入证据">
            <div>
              <span>预估（未结算）</span>
              <strong v-if="row.currency && hasAmount(row.estimatedAmount)">
                <MoneyText v-bind="money(row.currency, row.estimatedAmount as string)" />
              </strong>
              <small v-else>无平台收益事实</small>
            </div>
            <div>
              <span>平台已结算</span>
              <strong v-if="row.currency && hasAmount(row.reconciledAmount)">
                <MoneyText v-bind="money(row.currency, row.reconciledAmount as string)" />
              </strong>
              <small v-else>尚未结算</small>
            </div>
            <small v-if="row.estimatedEcpm"
              >预估 eCPM {{ row.currency }} {{ row.estimatedEcpm }}</small
            >
          </td>
          <td data-label="请求时间">
            <strong>{{ formatDate(row.requestedAt) }}</strong>
            <small>更新 {{ formatDate(row.lastEventAt) }}</small>
          </td>
          <td data-label="操作">
            <button class="trace-button" type="button" @click="emit('select', row.id)">
              查看证据链
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import type { AdConsumptionId, AdConsumptionRowVO } from '@/api/skit/adConsumption'
import { formatDate } from '@/utils/formatTime'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import { decimalAmountToMoneyUnits } from '@/views/skit/ad-monitor/monitoringModel'
import { consumptionStatusLabel, consumptionStatusTagType } from './consumptionModel'

withDefaults(
  defineProps<{ rows: AdConsumptionRowVO[]; loading?: boolean; showTenant?: boolean }>(),
  { loading: false, showTenant: false }
)

const emit = defineEmits<{ (event: 'select', id: AdConsumptionId): void }>()

const money = (currency: string, amount: string) => decimalAmountToMoneyUnits(currency, amount)
const hasAmount = (amount?: string | null) => amount !== null && amount !== undefined
const memberLabel = (memberId?: AdConsumptionId | null) =>
  memberId ? `用户 #${memberId}` : '匿名用户'
const dramaLabel = (dramaId?: AdConsumptionId | null) =>
  dramaId ? `剧目 #${dramaId}` : '剧目信息未回传'
const episodeLabel = (episodeNo: number, episodeFrom: number, episodeTo: number) =>
  episodeFrom === episodeTo
    ? `第 ${episodeNo} 集`
    : `第 ${episodeNo} 集 · 授权范围 ${episodeFrom}–${episodeTo}`
</script>

<style scoped lang="scss">
.table-shell {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

.consumption-table {
  width: 100%;
  min-width: 1320px;
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

  td > small,
  .money-cell span {
    margin-top: 4px;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}

.identity-cell {
  max-width: 235px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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
  display: grid;
  min-width: 190px;
  gap: 7px;

  > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
  }
}

.error-text {
  color: var(--el-color-danger) !important;
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

@media (width <= 768px) {
  .table-shell {
    overflow: visible;
    border: 0;
  }

  .consumption-table {
    display: block;
    min-width: 0;

    thead {
      display: none;
    }

    tbody {
      display: grid;
      gap: 12px;
    }

    tr {
      display: block;
      overflow: hidden;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 14px;
      box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
    }

    td {
      display: grid;
      grid-template-columns: 92px minmax(0, 1fr);
      gap: 8px;
      padding: 10px 12px;

      &::before {
        grid-column: 1;
        color: var(--el-text-color-secondary);
        content: attr(data-label);
      }

      > * {
        grid-column: 2;
        min-width: 0;
      }
    }

    .table-state {
      display: block;
      padding: 28px 16px !important;

      &::before {
        content: none;
      }
    }

    .money-cell {
      min-width: 0;

      &::before {
        grid-row: 1 / span 3;
      }
    }
  }
}
</style>
