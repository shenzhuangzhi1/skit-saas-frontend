<template>
  <div class="skit-dashboard">
    <section class="skit-dashboard__hero">
      <div class="skit-dashboard__copy">
        <div class="skit-dashboard__eyebrow">
          <span class="skit-dashboard__dot"></span>
          运营控制台
        </div>
        <h1>短剧 SaaS 管理平台</h1>
        <p>会员、广告收益、积分、提现、代理、设备风控和抖音小程序投流统一看板。</p>
      </div>
      <div class="skit-dashboard__actions">
        <el-button :icon="Refresh" @click="refreshDashboard">刷新</el-button>
        <el-button type="primary" :icon="Grid" @click="go('SkitAdRecord')">广告记录</el-button>
      </div>
      <div class="skit-dashboard__summary">
        <div>
          <span>线上观测版本</span>
          <strong>v1.0.62</strong>
        </div>
        <div>
          <span>更新时间</span>
          <strong>{{ refreshText }}</strong>
        </div>
        <div>
          <span>业务模块</span>
          <strong>{{ totalMenuItems }}</strong>
        </div>
      </div>
    </section>

    <section class="skit-stat-grid" aria-label="核心指标">
      <button
        v-for="item in primaryStats"
        :key="item.label"
        class="skit-stat"
        :class="`skit-stat--${item.tone}`"
        :style="{ '--accent': item.color }"
        type="button"
        @click="item.routeName && go(item.routeName)"
      >
        <span class="skit-stat__icon">
          <Icon :icon="item.icon" :size="22" />
        </span>
        <span class="skit-stat__label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.caption }}</small>
        <span class="skit-stat__open">
          {{ item.meta }}
          <Icon icon="ep:arrow-right" :size="14" />
        </span>
      </button>
    </section>

    <section class="skit-ops-board" aria-label="今日运营">
      <div class="skit-section-title">
        <span>今日运营</span>
        <small>注册、广告、收益和积分换算</small>
      </div>
      <div class="skit-ops-grid">
        <div
          v-for="item in operationStats"
          :key="item.label"
          class="skit-ops"
          :class="`skit-ops--${item.tone}`"
        >
          <span class="skit-ops__icon">
            <Icon :icon="item.icon" :size="17" />
          </span>
          <span class="skit-ops__label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.hint }}</small>
        </div>
      </div>
    </section>

    <section class="skit-signal-grid" aria-label="业务信号">
      <article v-for="item in signalCards" :key="item.label" class="skit-signal">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.description }}</small>
      </article>
    </section>

    <section class="skit-layout">
      <section class="skit-panel skit-panel--menu">
        <div class="skit-panel__header">
          <div>
            <span>业务入口</span>
            <small>{{ skitMenuGroups.length }} 个分组，{{ totalMenuItems }} 个模块</small>
          </div>
        </div>
        <div class="skit-menu-groups">
          <div v-for="group in skitMenuGroups" :key="group.title" class="skit-menu-group">
            <div class="skit-menu-group__title">{{ group.title }}</div>
            <button
              v-for="item in group.items"
              :key="item.key"
              class="skit-menu-item"
              type="button"
              @click="go(item.routeName)"
            >
              <span>{{ item.title }}</span>
              <el-tag
                v-if="item.status"
                :type="item.status === 'broken' ? 'warning' : 'info'"
                effect="light"
              >
                {{ item.status === 'broken' ? '线上 404' : '空状态' }}
              </el-tag>
              <small v-else-if="item.totalRows !== undefined">{{ item.totalRows }} 条</small>
              <Icon v-else icon="ep:arrow-right" :size="14" />
            </button>
          </div>
        </div>
      </section>

      <section class="skit-panel">
        <div class="skit-panel__header">
          <div>
            <span>关键数据面</span>
            <small>按运营优先级查看核心表</small>
          </div>
        </div>
        <el-table :data="rankRows" height="392" class="skit-rank-table">
          <el-table-column prop="module" label="模块" min-width="130" />
          <el-table-column prop="records" label="记录数" width="110" align="right" />
          <el-table-column prop="focus" label="运营重点" min-width="220" />
          <el-table-column prop="route" label="入口" width="120">
            <template #default="{ row }">
              <el-button link type="primary" @click="go(row.routeName)">打开</el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Grid, Refresh } from '@element-plus/icons-vue'
import { getSkitDashboardSummary, type SkitDashboardSummaryRespVO } from '@/api/skit/adminRecord'
import { skitMenuGroups } from '@/views/skit/admin/pageConfig'

defineOptions({ name: 'Index' })

const router = useRouter()
const refreshAt = ref(new Date())
const dashboardSummary = ref<SkitDashboardSummaryRespVO | null>(null)
const countFormat = new Intl.NumberFormat('zh-CN')

const defaultSummary: SkitDashboardSummaryRespVO = {
  totalMembers: 63,
  totalAdCount: 943,
  totalRevenue: 487.14,
  totalProfit: -179.76,
  todayRegisterCount: 0,
  todayAdCount: 1,
  todayRevenue: 0.02,
  todayProfit: 0,
  rewardExchange: 666.91,
  scorePerYuan: 1000
}

const summary = computed(() => dashboardSummary.value || defaultSummary)
const count = (value: number) => countFormat.format(Number(value || 0))
const money = (value: number) => `￥${Number(value || 0).toFixed(2)}`
const percent = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`

const adYield = computed(() =>
  summary.value.totalAdCount ? summary.value.totalRevenue / summary.value.totalAdCount : 0
)
const profitRate = computed(() =>
  summary.value.totalRevenue ? (summary.value.totalProfit / summary.value.totalRevenue) * 100 : 0
)
const totalMenuItems = computed(() =>
  skitMenuGroups.reduce((sum, group) => sum + group.items.length, 0)
)

const primaryStats = computed(() => [
  {
    label: '总会员数',
    value: count(summary.value.totalMembers),
    icon: 'ep:user-filled',
    color: '#2f80ed',
    tone: 'blue',
    caption: `今日新增 ${count(summary.value.todayRegisterCount)}`,
    meta: '用户管理',
    routeName: 'SkitUser'
  },
  {
    label: '总广告次数',
    value: count(summary.value.totalAdCount),
    icon: 'ep:histogram',
    color: '#16a34a',
    tone: 'green',
    caption: `今日 ${count(summary.value.todayAdCount)} 次`,
    meta: '广告记录',
    routeName: 'SkitAdRecord'
  },
  {
    label: '总收益',
    value: money(summary.value.totalRevenue),
    icon: 'ep:money',
    color: '#b7791f',
    tone: 'gold',
    caption: `均次 ${money(adYield.value)}`,
    meta: '收益明细',
    routeName: 'SkitAdRecord'
  },
  {
    label: '总利润',
    value: money(summary.value.totalProfit),
    icon: 'ep:trend-charts',
    color: '#d92d20',
    tone: 'red',
    caption: `利润率 ${percent(profitRate.value)}`,
    meta: '提现审核',
    routeName: 'SkitWithdraw'
  }
])

const operationStats = computed(() => [
  {
    label: '今日注册',
    value: count(summary.value.todayRegisterCount),
    icon: 'ep:user',
    hint: '新增会员',
    tone: 'blue'
  },
  {
    label: '今日广告次数',
    value: count(summary.value.todayAdCount),
    icon: 'ep:data-line',
    hint: '激励视频',
    tone: 'green'
  },
  {
    label: '今日收益',
    value: money(summary.value.todayRevenue),
    icon: 'ep:coin',
    hint: '广告回传',
    tone: 'gold'
  },
  {
    label: '今日利润',
    value: money(summary.value.todayProfit),
    icon: 'ep:trend-charts',
    hint: '扣减成本',
    tone: 'red'
  },
  {
    label: '奖励折算',
    value: money(summary.value.rewardExchange),
    icon: 'ep:present',
    hint: '积分价值',
    tone: 'teal'
  },
  {
    label: '积分/元',
    value: count(summary.value.scorePerYuan),
    icon: 'ep:scale-to-original',
    hint: '兑换比例',
    tone: 'indigo'
  }
])

const rankRows = [
  {
    module: '积分记录',
    records: 1932,
    focus: '积分变更前后值、奖励备注、用户积分账本',
    routeName: 'SkitScoreLog'
  },
  {
    module: '广告记录',
    records: 943,
    focus: 'Taku 平台 ID、交易 ID、展示收益和业务积分',
    routeName: 'SkitAdRecord'
  },
  {
    module: '登录记录',
    records: 101,
    focus: '登录方式、设备标识、地理位置、系统版本',
    routeName: 'SkitLoginRecord'
  },
  {
    module: '设备日志',
    records: 103,
    focus: 'VPN、代理、模拟器、Root、USB 调试风险',
    routeName: 'SkitDeviceLog'
  },
  {
    module: '用户管理',
    records: 63,
    focus: '积分、余额、邀请码、直属用户和封禁状态',
    routeName: 'SkitUser'
  },
  {
    module: '积分提现',
    records: 26,
    focus: '提现金额、手续费、审核和微信打款状态',
    routeName: 'SkitWithdraw'
  },
  {
    module: '抖音登录记录',
    records: 16,
    focus: '小程序用户、OpenID、宿主 App 和 IP',
    routeName: 'SkitDouyinLoginRecord'
  }
]

const signalCards = computed(() => [
  {
    label: '广告均次收益',
    value: money(adYield.value),
    description: `${count(summary.value.totalAdCount)} 次广告贡献 ${money(summary.value.totalRevenue)}`
  },
  {
    label: '利润状态',
    value: profitRate.value < 0 ? '倒挂' : '正常',
    description: `当前利润率 ${percent(profitRate.value)}`
  },
  {
    label: '提现压力',
    value: count(rankRows.find((row) => row.module === '积分提现')?.records || 0),
    description: '待关注审核、手续费和微信打款链路'
  }
])

const refreshText = computed(() => {
  return refreshAt.value.toLocaleString('zh-CN', { hour12: false })
})

const refreshDashboard = async () => {
  try {
    dashboardSummary.value = await getSkitDashboardSummary()
  } catch {
    dashboardSummary.value = null
  } finally {
    refreshAt.value = new Date()
  }
}

const go = (routeName: string) => {
  router.push({ name: routeName })
}

onMounted(refreshDashboard)
</script>

<style scoped lang="scss">
.skit-dashboard {
  --skit-bg: #f4f6f9;
  --skit-surface: #ffffff;
  --skit-text: #18212f;
  --skit-subtle: #475467;
  --skit-muted: #7a8699;
  --skit-border: #dde3ed;
  --skit-border-soft: #edf1f6;
  --skit-blue: #2563eb;
  --skit-green: #14915f;
  --skit-gold: #b46b09;
  --skit-red: #cf3a2f;
  --skit-teal: #0f8f83;
  --skit-indigo: #4f46e5;
  min-height: calc(100vh - 84px);
  padding: 16px;
  background: var(--skit-bg);
  color: var(--skit-text);
}

.skit-dashboard__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px 24px;
  margin-bottom: 14px;
  padding: 18px 20px;
  border: 1px solid var(--skit-border);
  border-radius: 8px;
  background: var(--skit-surface);
  box-shadow: 0 10px 30px rgb(16 24 40 / 6%);
}

.skit-dashboard__copy {
  min-width: 0;

  h1 {
    margin: 0;
    color: var(--skit-text);
    font-size: 23px;
    font-weight: 720;
    line-height: 1.25;
  }

  p {
    max-width: 820px;
    margin: 8px 0 0;
    color: var(--skit-subtle);
    font-size: 14px;
    line-height: 1.55;
  }
}

.skit-dashboard__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  color: var(--skit-green);
  font-size: 13px;
  font-weight: 700;
}

.skit-dashboard__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--skit-green);
  box-shadow: 0 0 0 4px rgb(20 145 95 / 12%);
}

.skit-dashboard__actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
  min-width: 202px;
}

.skit-dashboard__summary {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--skit-border-soft);
  border-radius: 7px;
  background: #f8fafc;

  div {
    min-width: 0;
    padding: 11px 14px;
    border-right: 1px solid var(--skit-border-soft);

    &:last-child {
      border-right: 0;
    }
  }

  span {
    display: block;
    color: var(--skit-muted);
    font-size: 12px;
  }

  strong {
    display: block;
    overflow: hidden;
    margin-top: 4px;
    color: var(--skit-text);
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.skit-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.skit-stat {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 148px;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid var(--skit-border);
  border-radius: 8px;
  background: var(--skit-surface);
  color: var(--skit-text);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  :deep(.el-icon),
  :deep(svg) {
    color: var(--accent);
  }

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 40%, var(--skit-border));
    box-shadow: 0 14px 32px rgb(16 24 40 / 10%);
    transform: translateY(-1px);
  }

  &::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 3px;
    background: var(--accent);
    content: '';
  }

  strong {
    margin-top: 11px;
    color: var(--skit-text);
    font-size: 28px;
    font-weight: 760;
    line-height: 1.1;
  }

  small {
    margin-top: 8px;
    color: var(--skit-muted);
    font-size: 13px;
  }
}

.skit-stat__icon {
  display: inline-grid;
  width: 38px;
  height: 38px;
  margin-bottom: 12px;
  place-items: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 11%, #fff);
}

.skit-stat__label {
  color: var(--skit-subtle);
  font-size: 13px;
  font-weight: 650;
}

.skit-stat__open {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 14px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.skit-ops-board,
.skit-signal,
.skit-panel {
  border: 1px solid var(--skit-border);
  border-radius: 8px;
  background: var(--skit-surface);
  box-shadow: 0 8px 24px rgb(16 24 40 / 5%);
}

.skit-ops-board {
  margin-bottom: 14px;
  padding: 14px;
}

.skit-section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  span {
    color: var(--skit-text);
    font-size: 15px;
    font-weight: 760;
  }

  small {
    color: var(--skit-muted);
    font-size: 12px;
  }
}

.skit-ops-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.skit-ops {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 2px 10px;
  min-height: 78px;
  padding: 10px;
  border: 1px solid var(--skit-border-soft);
  border-radius: 6px;
  background: #fbfcff;

  strong,
  small {
    grid-column: 2;
  }

  strong {
    color: var(--skit-text);
    font-size: 18px;
    font-weight: 740;
    line-height: 1.2;
  }

  small {
    color: var(--skit-muted);
    font-size: 12px;
  }
}

.skit-ops__icon {
  display: inline-grid;
  width: 30px;
  height: 30px;
  grid-row: 1 / span 3;
  place-items: center;
  border-radius: 7px;
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 10%, #fff);
}

.skit-ops__label {
  color: var(--skit-subtle);
  font-size: 12px;
  font-weight: 650;
}

.skit-ops--blue {
  --tone: var(--skit-blue);
}

.skit-ops--green {
  --tone: var(--skit-green);
}

.skit-ops--gold {
  --tone: var(--skit-gold);
}

.skit-ops--red {
  --tone: var(--skit-red);
}

.skit-ops--teal {
  --tone: var(--skit-teal);
}

.skit-ops--indigo {
  --tone: var(--skit-indigo);
}

.skit-signal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.skit-signal {
  min-height: 104px;
  padding: 14px;

  span {
    display: block;
    color: var(--skit-subtle);
    font-size: 12px;
    font-weight: 700;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: var(--skit-text);
    font-size: 22px;
    font-weight: 760;
    line-height: 1.1;
  }

  small {
    display: block;
    margin-top: 10px;
    color: var(--skit-muted);
    font-size: 12px;
    line-height: 1.45;
  }
}

.skit-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
  gap: 14px;
}

.skit-panel {
  min-width: 0;
  padding: 14px;
}

.skit-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  span {
    display: block;
    color: var(--skit-text);
    font-size: 15px;
    font-weight: 760;
  }

  small {
    display: block;
    margin-top: 3px;
    color: var(--skit-muted);
    font-size: 12px;
  }
}

.skit-menu-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.skit-menu-group {
  min-width: 0;
  padding: 11px;
  border: 1px solid var(--skit-border-soft);
  border-radius: 6px;
  background: #fbfcff;
}

.skit-menu-group__title {
  margin-bottom: 7px;
  color: var(--skit-text);
  font-size: 13px;
  font-weight: 760;
}

.skit-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  padding: 6px 3px;
  border: 0;
  border-bottom: 1px solid var(--skit-border-soft);
  background: transparent;
  color: var(--skit-text);
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition:
    color 0.18s ease,
    background 0.18s ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    color: var(--skit-blue);
    background: #f6f9ff;
  }

  > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    flex: none;
    color: var(--skit-muted);
  }
}

.skit-rank-table {
  border: 1px solid var(--skit-border-soft);
  border-radius: 6px;

  :deep(.el-table__header-wrapper th) {
    background: #f8fafc;
    color: var(--skit-subtle);
    font-weight: 740;
  }

  :deep(.el-table__row) {
    height: 48px;
  }

  :deep(.el-table__cell) {
    border-color: var(--skit-border-soft);
  }
}

@media (max-width: 1200px) {
  .skit-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .skit-ops-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .skit-signal-grid,
  .skit-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .skit-dashboard {
    padding: 10px;
  }

  .skit-dashboard__hero {
    grid-template-columns: 1fr;
  }

  .skit-dashboard__actions,
  .skit-panel__header {
    align-items: stretch;
    flex-direction: column;
  }

  .skit-dashboard__actions {
    justify-content: flex-start;
  }

  .skit-dashboard__summary {
    grid-template-columns: 1fr;

    div {
      border-right: 0;
      border-bottom: 1px solid var(--skit-border-soft);

      &:last-child {
        border-bottom: 0;
      }
    }
  }

  .skit-stat-grid,
  .skit-ops-grid,
  .skit-signal-grid,
  .skit-menu-groups {
    grid-template-columns: 1fr;
  }

  .skit-stat {
    min-height: 132px;
  }
}
</style>
