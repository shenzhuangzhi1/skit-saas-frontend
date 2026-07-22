<template>
  <el-drawer
    :model-value="modelValue"
    size="min(820px, 96vw)"
    title="广告消费证据链"
    @close="emit('update:modelValue', false)"
  >
    <div v-if="loading" class="detail-state">正在读取服务端事实…</div>
    <el-alert v-else-if="error" :closable="false" :title="error" show-icon type="error" />
    <div v-else-if="detail" class="detail">
      <section class="detail__hero">
        <div>
          <span>广告会话</span>
          <strong>{{ detail.sessionId }}</strong>
          <small>{{ detail.providerTransactionId || '平台交易号待回传' }}</small>
        </div>
        <el-tag :type="consumptionStatusTagType(detail.status)" effect="dark">
          {{ consumptionStatusLabel(detail.status) }}
        </el-tag>
      </section>

      <el-alert
        :closable="false"
        show-icon
        type="info"
        title="启动状态未上报"
        description="这里只能确认该广告会话是否引用了入站原生授权凭据；不能据此认定本次广告签发了新授权或播放器 Activity 已启动。"
      />

      <section class="detail__summary">
        <div
          ><span>归属租户</span><strong>租户 {{ detail.tenantId }}</strong></div
        >
        <div>
          <span>用户</span>
          <strong>{{ detail.memberNickname || memberLabel(detail.memberId) }}</strong>
          <small>{{ detail.memberMobileMasked || '无脱敏手机号' }}</small>
        </div>
        <div
          ><span>剧目</span><strong>{{ dramaLabel(detail.dramaId) }}</strong></div
        >
        <div>
          <span>解锁范围</span
          ><strong>{{ episodeLabel(detail.episodeFrom, detail.episodeTo) }}</strong>
        </div>
        <div
          ><span>广告平台</span><strong>{{ detail.provider }}</strong></div
        >
        <div
          ><span>Network Firm</span><strong>{{ detail.networkFirmId || '未回传' }}</strong></div
        >
        <div
          ><span>Adsource ID</span><strong>{{ detail.adsourceId || '未回传' }}</strong></div
        >
        <div
          ><span>广告位</span><strong>{{ detail.placementId }}</strong></div
        >
        <div
          ><span>SDK Request ID</span><strong>{{ detail.sdkRequestId || '未回传' }}</strong></div
        >
        <div
          ><span>Provider Show ID</span
          ><strong>{{ detail.providerShowId || '未回传' }}</strong></div
        >
        <div>
          <span>原生访问凭据</span>
          <strong>{{ nativeGrantReferenced ? '已引用入站授权凭据' : '未引用原生授权凭据' }}</strong>
          <small>启动状态未上报</small>
        </div>
        <div>
          <span>预估收益（未结算）</span>
          <strong v-if="detail.currency && hasAmount(detail.estimatedAmount)">
            <MoneyText v-bind="money(detail.currency, detail.estimatedAmount as string)" />
          </strong>
          <strong v-else>无平台收益事实</strong>
          <small>预估 eCPM {{ detail.estimatedEcpm || '暂无' }}</small>
        </div>
        <div>
          <span>平台已结算</span>
          <strong v-if="detail.currency && hasAmount(detail.reconciledAmount)">
            <MoneyText v-bind="money(detail.currency, detail.reconciledAmount as string)" />
          </strong>
          <strong v-else>尚未结算</strong>
          <small>结算 eCPM {{ detail.reconciledEcpm || '暂无' }}</small>
        </div>
      </section>

      <section v-if="detail.failureReason" class="failure-panel" role="alert">
        <div><Icon icon="ep:warning-filled" /></div>
        <div>
          <strong>广告链路异常</strong>
          <p>{{ detail.failureReason }}</p>
        </div>
      </section>

      <section class="detail__section">
        <div class="section-heading">
          <div>
            <h3>消费时间线</h3>
            <p>仅展示服务端已保存的事件，不补齐或推测缺失步骤。</p>
          </div>
          <span>截至 {{ formatDate(detail.asOf) }} · {{ detail.timezone }}</span>
        </div>
        <div v-if="orderedTimeline.length === 0" class="detail-state">暂无阶段证据</div>
        <ol v-else class="timeline">
          <li v-for="item in orderedTimeline" :key="timelineKey(item)">
            <div class="timeline__marker" :class="markerClass(item.status)"></div>
            <article>
              <header>
                <div>
                  <strong>{{ consumptionTimelineEventLabel(item.eventType) }}</strong>
                  <small>{{ sourceLabel(item.source) }}</small>
                </div>
                <el-tag size="small" :type="timelineStatusTagType(item.status)">
                  {{ consumptionTimelineStatusLabel(item.status) }}
                </el-tag>
              </header>
              <time>{{ item.occurredAt ? formatDate(item.occurredAt) : '时间未上报' }}</time>
              <p v-if="item.sequenceNo !== null && item.sequenceNo !== undefined">
                回调序号 {{ item.sequenceNo }}
              </p>
              <p v-if="item.episodeNo">关联第 {{ item.episodeNo }} 集</p>
              <code v-if="item.errorCode">{{ item.errorCode }}</code>
            </article>
          </li>
        </ol>
      </section>
    </div>
    <div v-else class="detail-state">请选择一条消费记录</div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type {
  AdConsumptionDetailVO,
  AdConsumptionId,
  AdConsumptionTimelineItemVO,
  AdConsumptionTimelineEventType
} from '@/api/skit/adConsumption'
import { formatDate } from '@/utils/formatTime'
import MoneyText from '@/views/skit/shared/MoneyText.vue'
import { decimalAmountToMoneyUnits } from '@/views/skit/ad-monitor/monitoringModel'
import {
  consumptionStatusLabel,
  consumptionStatusTagType,
  consumptionTimelineEventLabel,
  consumptionTimelineStatusLabel,
  timelineStatusTagType
} from './consumptionModel'

const EVENT_ORDER: AdConsumptionTimelineEventType[] = [
  'SESSION_CREATED',
  'LOAD_STARTED',
  'SHOWN',
  'CLOSED',
  'REWARD_OBSERVED',
  'FAILED',
  'REWARD_VERIFIED',
  'ENTITLEMENT_GRANTED',
  'NATIVE_GRANT_REFERENCED',
  'NATIVE_GRANT_USED'
]

const timelineKey = (item: AdConsumptionTimelineItemVO) =>
  `${item.source}:${item.eventType}:${item.id}:${item.sequenceNo ?? 'none'}`

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    detail?: AdConsumptionDetailVO
    loading?: boolean
    error?: string
  }>(),
  { detail: undefined, loading: false, error: '' }
)

const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>()

const orderedTimeline = computed(() =>
  [...(props.detail?.timeline || [])].sort((left, right) => {
    if (left.occurredAt && right.occurredAt && left.occurredAt !== right.occurredAt) {
      return left.occurredAt - right.occurredAt
    }
    return EVENT_ORDER.indexOf(left.eventType) - EVENT_ORDER.indexOf(right.eventType)
  })
)

const nativeGrantReferenced = computed(
  () =>
    props.detail?.playerAccessEvidence === 'NATIVE_GRANT_REFERENCED' ||
    props.detail?.timeline.some((item) => item.eventType === 'NATIVE_GRANT_REFERENCED') === true
)

const money = (currency: string, amount: string) => decimalAmountToMoneyUnits(currency, amount)
const hasAmount = (amount?: string | null) => amount !== null && amount !== undefined
const memberLabel = (memberId?: AdConsumptionId | null) =>
  memberId ? `用户 #${memberId}` : '匿名用户'
const dramaLabel = (dramaId?: AdConsumptionId | null) => (dramaId ? `剧目 #${dramaId}` : '未回传')
const episodeLabel = (episodeFrom: number, episodeTo: number) =>
  episodeFrom === episodeTo ? `第 ${episodeFrom} 集` : `第 ${episodeFrom}–${episodeTo} 集`
const sourceLabel = (source: string) =>
  ({
    SESSION: '广告会话',
    CLIENT: '客户端遥测',
    CALLBACK: '平台回调',
    CALLBACK_ATTEMPT: '回调处理',
    SERVER: '服务端验证',
    ENTITLEMENT: '权益服务',
    PLAYER_GRANT: '播放器授权服务'
  })[source] || source
const markerClass = (status: string) => `timeline__marker--${timelineStatusTagType(status)}`
</script>

<style scoped lang="scss">
.detail {
  display: grid;
  color: var(--el-text-color-primary);
  gap: 18px;
}

.detail__hero,
.section-heading,
.detail__hero > div,
.timeline header {
  display: flex;
  align-items: center;
}

.detail__hero,
.section-heading {
  justify-content: space-between;
  gap: 16px;
}

.detail__hero {
  padding: 18px;
  background: radial-gradient(circle at 94% 8%, rgb(99 102 241 / 18%), transparent 38%), #0f172a;
  border-radius: 14px;

  > div {
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
  }

  span,
  small {
    font-size: 11px;
    color: #94a3b8;
  }

  strong {
    max-width: 520px;
    overflow: hidden;
    font-size: 17px;
    color: #fff;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.detail__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  > div {
    display: grid;
    min-width: 0;
    padding: 13px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    gap: 5px;
  }

  span,
  small {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  strong {
    overflow-wrap: anywhere;
  }
}

.failure-panel {
  display: flex;
  padding: 14px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 10px;
  gap: 10px;

  p {
    margin: 4px 0 0;
    font-size: 12px;
  }
}

.detail__section {
  padding-top: 4px;
}

.section-heading {
  align-items: flex-end;
  margin-bottom: 14px;

  h3,
  p {
    margin: 0;
  }

  p,
  > span {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.timeline {
  padding: 0;
  margin: 0;
  list-style: none;

  li {
    position: relative;
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 12px;

    &:not(:last-child)::before {
      position: absolute;
      top: 18px;
      bottom: -8px;
      left: 6px;
      width: 2px;
      background: var(--el-border-color);
      content: '';
    }
  }

  article {
    padding: 0 0 18px;
  }

  header {
    justify-content: space-between;
    gap: 10px;

    > div {
      display: grid;
      gap: 2px;
    }

    small {
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }
  }

  time,
  p {
    display: block;
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  code {
    display: inline-block;
    padding: 3px 6px;
    margin-top: 6px;
    font-size: 11px;
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
    border-radius: 5px;
  }
}

.timeline__marker {
  z-index: 1;
  width: 13px;
  height: 13px;
  margin-top: 3px;
  background: var(--el-text-color-placeholder);
  border: 3px solid var(--el-bg-color);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--el-border-color);

  &--success {
    background: var(--el-color-success);
  }

  &--danger {
    background: var(--el-color-danger);
  }

  &--warning {
    background: var(--el-color-warning);
  }
}

.detail-state {
  padding: 36px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@media (width <= 600px) {
  .detail__summary {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
