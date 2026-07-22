<template>
  <div class="skit-home">
    <ContentWrap class="skit-home__hero">
      <div>
        <div class="skit-home__eyebrow">
          <span class="skit-home__status-dot"></span>
          服务端事实看板
        </div>
        <h1>短剧 SaaS 管理平台</h1>
        <p>
          当前展示广告会话、签名奖励、平台对账与分成事实。客户端上报只作遥测，不直接产生收益或解锁内容。
        </p>
        <div class="skit-home__scope">
          <el-tag type="info">{{ scopeLabel }}</el-tag>
          <span v-if="snapshot"
            >数据截至 {{ formatDate(snapshot.asOf) }}（{{ snapshot.timezone }}）</span
          >
        </div>
      </div>
      <div class="skit-home__actions">
        <el-button @click="go('SkitAgentManagement')">代理商管理</el-button>
        <el-button type="primary" @click="go('SkitAdRecord')">广告监控</el-button>
        <el-button :loading="loading" :icon="Refresh" circle aria-label="刷新" @click="load" />
      </div>
    </ContentWrap>

    <AsyncState :loading="loading" :error="error" :empty="false">
      <template v-if="snapshot">
        <ContentWrap>
          <div class="section-heading">
            <div>
              <h2>广告验证漏斗</h2>
              <p>跨币种只汇总事件次数；金额始终按币种分别展示。</p>
            </div>
            <el-tag :type="healthTagType(snapshot.platformHealth.status)">
              {{ healthLabel(snapshot.platformHealth.status) }}
            </el-tag>
          </div>
          <div class="count-grid">
            <article v-for="item in countCards" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ countFormat.format(item.value) }}</strong>
              <small>{{ item.hint }}</small>
            </article>
          </div>
        </ContentWrap>

        <ContentWrap>
          <div class="section-heading">
            <div>
              <h2>广告收益与分成</h2>
              <p>金额来自服务端验证与 Taku 报表对账，不显示模拟利润或跨币种合计。</p>
            </div>
          </div>
          <el-empty v-if="snapshot.empty" description="当前租户范围暂无经过验证的广告收益数据" />
          <div v-else class="money-grid">
            <article v-for="group in snapshot.moneyGroups" :key="group.currency">
              <div class="money-card__header">
                <strong>{{ group.currency }}</strong>
                <span>{{ countFormat.format(group.uniqueMemberCount) }} 位相关用户</span>
              </div>
              <dl>
                <div
                  ><dt>预估冻结</dt><dd>{{ group.frozenRevenue }}</dd></div
                >
                <div
                  ><dt>平台已对账</dt><dd>{{ group.reconciledRevenue }}</dd></div
                >
                <div
                  ><dt>暂挂不可结算</dt><dd>{{ group.suspenseRevenue }}</dd></div
                >
                <div
                  ><dt>代理商留存</dt><dd>{{ group.agentRetainedRevenue }}</dd></div
                >
              </dl>
              <div v-if="group.levelShares.length" class="level-shares">
                <span v-for="share in group.levelShares" :key="share.levelNo">
                  第 {{ share.levelNo }} 层 {{ share.amount }}
                </span>
              </div>
              <div v-else class="level-shares level-shares--empty">当前无层级分成</div>
            </article>
          </div>
        </ContentWrap>

        <ContentWrap>
          <div class="section-heading">
            <div>
              <h2>平台健康与新鲜度</h2>
              <p>报表失败、回调异常或长时间无数据时，应在开启强制验证前处理。</p>
            </div>
          </div>
          <div class="health-grid">
            <article>
              <span>奖励回调成功率（0-1）</span>
              <strong>{{ snapshot.platformHealth.callbackSuccessRate }}</strong>
            </article>
            <article>
              <span>报表状态</span>
              <strong>{{ reportStatusLabel(snapshot.platformHealth.reportStatus) }}</strong>
            </article>
            <article>
              <span>未关闭告警</span>
              <strong>{{ snapshot.platformHealth.openAlertCount }}</strong>
            </article>
            <article>
              <span>最近广告会话</span>
              <strong>{{ freshness(snapshot.freshness.lastSessionAt) }}</strong>
            </article>
            <article>
              <span>最近签名奖励</span>
              <strong>{{ freshness(snapshot.freshness.lastSignedRewardAt) }}</strong>
            </article>
            <article>
              <span>最近平台报表</span>
              <strong>{{ freshness(snapshot.freshness.lastReportSuccessAt) }}</strong>
            </article>
          </div>
        </ContentWrap>
      </template>
    </AsyncState>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { getAdAnalyticsOverview } from '@/api/skit/analytics'
import { formatDate } from '@/utils/formatTime'
import AsyncState from '@/views/skit/shared/AsyncState.vue'
import { useTenantScope } from '@/views/skit/shared/useTenantScope'
import { reportStatusLabel } from '@/views/skit/ad-monitor/monitoringModel'
import { buildDashboardSnapshot, type DashboardSnapshot } from './dashboardModel'

defineOptions({ name: 'Index' })

const router = useRouter()
const loading = ref(false)
const error = ref('')
const snapshot = ref<DashboardSnapshot>()
const countFormat = new Intl.NumberFormat('zh-CN')
const scopeManager = (() => {
  try {
    return useTenantScope()
  } catch (cause) {
    error.value = cause instanceof Error && cause.message ? cause.message : '无法确定当前租户范围'
    return undefined
  }
})()

const scopeLabel = computed(() =>
  scopeManager?.scope.value.kind === 'all' ? '全部代理商（只读）' : '当前代理商租户'
)

const countCards = computed(() => {
  const counts = snapshot.value?.counts
  return [
    { label: '广告请求', value: counts?.requestCount || 0, hint: '客户端请求遥测' },
    { label: '客户端展示', value: counts?.displayCount || 0, hint: '客户端 SHOWN 遥测' },
    { label: '签名奖励', value: counts?.verifiedRewardCount || 0, hint: '收益与解锁依据' },
    { label: '主动跳过', value: counts?.skipCount || 0, hint: '不授予奖励' },
    { label: '加载失败', value: counts?.failureCount || 0, hint: '需要排查' }
  ]
})

const load = async () => {
  if (!scopeManager) return
  loading.value = true
  error.value = ''
  try {
    const overview = await getAdAnalyticsOverview({
      ...scopeManager.query.value,
      timezone: 'UTC+8'
    })
    snapshot.value = buildDashboardSnapshot(overview)
  } catch (cause) {
    snapshot.value = undefined
    error.value = cause instanceof Error && cause.message ? cause.message : '真实首页数据加载失败'
  } finally {
    loading.value = false
  }
}

const go = (routeName: string) => router.push({ name: routeName })
const freshness = (value?: number | null) => (value ? formatDate(value) : '暂无事实')
const healthLabel = (status: DashboardSnapshot['platformHealth']['status']) =>
  ({ HEALTHY: '健康', DEGRADED: '降级', CRITICAL: '严重', NO_DATA: '暂无数据' })[status]
const healthTagType = (status: DashboardSnapshot['platformHealth']['status']) =>
  ({ HEALTHY: 'success', DEGRADED: 'warning', CRITICAL: 'danger', NO_DATA: 'info' })[status] as
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'

onMounted(load)
</script>

<style scoped lang="scss">
.skit-home {
  display: grid;
  min-height: calc(100vh - 84px);
  color: #1e293b;
  background: transparent;
  gap: 6px;
}

.skit-home__hero {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(125deg, rgb(99 102 241 / 10%), transparent 42%),
    radial-gradient(circle at 94% 16%, rgb(20 184 166 / 13%), transparent 32%),
    rgb(255 255 255 / 82%);
  border-color: rgb(99 102 241 / 15%);

  :deep(.el-card__body) {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 27px 28px !important;
    gap: 26px;
  }

  h1 {
    margin: 0;
    font-size: clamp(26px, 3vw, 34px);
    line-height: 1.15;
    letter-spacing: -0.035em;
  }

  p {
    max-width: 820px;
    margin: 10px 0 0;
    line-height: 1.7;
    color: #64748b;
  }
}

.skit-home__eyebrow,
.skit-home__scope,
.skit-home__actions,
.section-heading,
.money-card__header,
.level-shares {
  display: flex;
  align-items: center;
}

.skit-home__eyebrow {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #0f766e;
  gap: 8px;
}

.skit-home__status-dot {
  width: 8px;
  height: 8px;
  background: #14b8a6;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgb(20 184 166 / 14%);
}

.skit-home__scope {
  margin-top: 16px;
  font-size: 13px;
  color: #667085;
  gap: 10px;
}

.skit-home__actions {
  flex: 0 0 auto;
  gap: 8px;
}

.section-heading {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 19px;
    letter-spacing: -0.015em;
  }

  p {
    margin: 6px 0 0;
    font-size: 13px;
    color: #667085;
  }
}

.count-grid,
.money-grid,
.health-grid {
  display: grid;
  gap: 12px;
}

.count-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.count-grid article,
.health-grid article,
.money-grid article {
  position: relative;
  overflow: hidden;
  background: rgb(255 255 255 / 76%);
  border: 1px solid rgb(148 163 184 / 17%);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    border-color: rgb(99 102 241 / 34%);
    transform: translateY(-2px);
    box-shadow: 0 18px 36px -28px rgb(79 70 229 / 44%);
  }
}

.count-grid article::before,
.health-grid article::before {
  position: absolute;
  top: 0;
  left: 18px;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #14b8a6);
  border-radius: 0 0 8px 8px;
  content: '';
}

.count-grid article,
.health-grid article {
  padding: 18px;

  span,
  small {
    display: block;
    color: #707887;
  }

  strong {
    display: block;
    margin: 8px 0;
    font-size: 26px;
    letter-spacing: -0.025em;
    color: #1e293b;
  }
}

.money-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.money-grid article {
  padding: 18px;
}

.money-card__header {
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #eceef3;

  strong {
    font-size: 18px;
  }

  span {
    font-size: 13px;
    color: #667085;
  }
}

.money-grid dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;

  div {
    min-width: 0;
  }

  dt {
    font-size: 12px;
    color: #667085;
  }

  dd {
    margin: 5px 0 0;
    overflow: hidden;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.level-shares {
  flex-wrap: wrap;
  gap: 8px;

  span {
    padding: 5px 8px;
    font-size: 12px;
    color: #4f46e5;
    background: #eef2ff;
    border-radius: 8px;
  }
}

.level-shares--empty {
  font-size: 12px;
  color: #98a2b3;
}

.health-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

:global(.dark) .skit-home {
  color: #edf0f5;

  .skit-home__hero {
    background:
      linear-gradient(125deg, rgb(99 102 241 / 17%), transparent 43%),
      radial-gradient(circle at 94% 16%, rgb(45 212 191 / 10%), transparent 34%),
      rgb(15 23 42 / 86%);
  }

  .skit-home__hero p,
  .section-heading p,
  .skit-home__scope,
  .count-grid article span,
  .count-grid article small,
  .health-grid article span,
  .health-grid article small,
  .money-card__header span,
  .money-grid dt {
    color: #aab2c0;
  }

  .count-grid article,
  .health-grid article,
  .money-grid article {
    background: rgb(23 32 51 / 80%);
    border-color: rgb(148 163 184 / 12%);
  }

  .count-grid article strong,
  .health-grid article strong {
    color: #f2f4f8;
  }

  .money-card__header {
    border-bottom-color: rgb(255 255 255 / 8%);
  }

  .level-shares span {
    color: #c7d2fe;
    background: rgb(99 102 241 / 14%);
  }
}

@media (width <= 960px) {
  .count-grid,
  .health-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .skit-home__hero :deep(.el-card__body) {
    flex-direction: column;
  }
}

@media (width <= 640px) {
  .count-grid,
  .health-grid,
  .money-grid {
    grid-template-columns: 1fr;
  }

  .skit-home__actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
