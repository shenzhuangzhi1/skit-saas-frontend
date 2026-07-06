<template>
  <div class="skit-dashboard">
    <section class="skit-dashboard__head">
      <div>
        <div class="skit-dashboard__eyebrow">控制台</div>
        <h1>短剧 SaaS 管理平台</h1>
        <p>会员、广告收益、积分、提现、代理、设备风控和抖音小程序投流统一看板。</p>
      </div>
      <div class="skit-dashboard__status">
        <span>线上观测版本</span>
        <strong>v1.0.62</strong>
      </div>
    </section>

    <section class="skit-stat-grid">
      <button
        v-for="item in primaryStats"
        :key="item.label"
        class="skit-stat"
        :style="{ '--accent': item.color }"
        type="button"
        @click="item.routeName && go(item.routeName)"
      >
        <Icon :icon="item.icon" :size="24" />
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </button>
    </section>

    <section class="skit-ops-grid">
      <div v-for="item in operationStats" :key="item.label" class="skit-ops">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <section class="skit-layout">
      <el-card shadow="never" class="skit-panel">
        <template #header>
          <div class="skit-panel__header">
            <span>业务菜单</span>
            <el-button type="primary" :icon="Grid" @click="go('SkitAdRecord')">广告记录</el-button>
          </div>
        </template>
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
            </button>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="skit-panel">
        <template #header>
          <div class="skit-panel__header">
            <span>关键数据面</span>
            <el-button :icon="Refresh" @click="refreshDashboard">刷新</el-button>
          </div>
        </template>
        <el-table :data="rankRows" border stripe height="372">
          <el-table-column prop="module" label="模块" min-width="130" />
          <el-table-column prop="records" label="记录数" width="110" align="right" />
          <el-table-column prop="focus" label="运营重点" min-width="220" />
          <el-table-column prop="route" label="入口" width="120">
            <template #default="{ row }">
              <el-button link type="primary" @click="go(row.routeName)">打开</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="skit-refresh-time">更新时间 {{ refreshText }}</div>
      </el-card>
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
const money = (value: number) => `￥${Number(value || 0).toFixed(2)}`

const primaryStats = computed(() => [
  {
    label: '总会员数',
    value: String(summary.value.totalMembers),
    icon: 'ep:user-filled',
    color: '#2f80ed',
    routeName: 'SkitUser'
  },
  {
    label: '总广告次数',
    value: String(summary.value.totalAdCount),
    icon: 'ep:histogram',
    color: '#16a34a',
    routeName: 'SkitAdRecord'
  },
  {
    label: '总收益',
    value: money(summary.value.totalRevenue),
    icon: 'ep:money',
    color: '#b7791f',
    routeName: 'SkitAdRecord'
  },
  {
    label: '总利润',
    value: money(summary.value.totalProfit),
    icon: 'ep:trend-charts',
    color: '#d92d20',
    routeName: 'SkitWithdraw'
  }
])

const operationStats = computed(() => [
  { label: '今日注册', value: String(summary.value.todayRegisterCount) },
  { label: '今日广告次数', value: String(summary.value.todayAdCount) },
  { label: '今日收益', value: money(summary.value.todayRevenue) },
  { label: '今日利润', value: money(summary.value.todayProfit) },
  { label: '奖励折算', value: money(summary.value.rewardExchange) },
  { label: '积分/元', value: String(summary.value.scorePerYuan) }
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
  --skit-text: #1f2937;
  --skit-muted: #667085;
  --skit-border: #d7dde8;
  padding: 12px;
}

.skit-dashboard__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 12px;
  padding: 18px;
  border: 1px solid var(--skit-border);
  border-radius: 6px;
  background: #fff;

  h1 {
    margin: 0;
    color: var(--skit-text);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.25;
  }

  p {
    max-width: 760px;
    margin: 8px 0 0;
    color: var(--skit-muted);
    font-size: 14px;
    line-height: 1.6;
  }
}

.skit-dashboard__eyebrow {
  margin-bottom: 6px;
  color: #276749;
  font-size: 13px;
  font-weight: 650;
}

.skit-dashboard__status {
  min-width: 126px;
  padding: 10px 12px;
  border: 1px solid #c8d1df;
  border-radius: 6px;
  text-align: right;

  span {
    display: block;
    color: var(--skit-muted);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 4px;
    color: var(--skit-text);
    font-size: 18px;
  }
}

.skit-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.skit-stat {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 4px 10px;
  min-height: 98px;
  padding: 16px;
  border: 1px solid var(--skit-border);
  border-left: 4px solid var(--accent);
  border-radius: 6px;
  background: #fff;
  color: var(--skit-text);
  cursor: pointer;
  text-align: left;

  :deep(.el-icon),
  :deep(svg) {
    color: var(--accent);
  }

  span {
    color: var(--skit-muted);
    font-size: 13px;
  }

  strong {
    grid-column: 2;
    font-size: 24px;
    line-height: 1.1;
  }
}

.skit-ops-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.skit-ops {
  padding: 12px 14px;
  border: 1px solid var(--skit-border);
  border-radius: 6px;
  background: #fff;

  span {
    display: block;
    color: var(--skit-muted);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 6px;
    color: var(--skit-text);
    font-size: 18px;
  }
}

.skit-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.9fr);
  gap: 12px;
}

.skit-panel {
  border-radius: 6px;
}

.skit-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  span {
    color: var(--skit-text);
    font-weight: 650;
  }
}

.skit-menu-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.skit-menu-group {
  min-width: 0;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fbfcfe;
}

.skit-menu-group__title {
  margin-bottom: 8px;
  color: var(--skit-text);
  font-size: 14px;
  font-weight: 650;
}

.skit-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 6px 4px;
  border: 0;
  border-bottom: 1px solid #edf0f5;
  background: transparent;
  color: var(--skit-text);
  cursor: pointer;
  font-size: 13px;
  text-align: left;

  &:last-child {
    border-bottom: 0;
  }

  small {
    flex: none;
    color: var(--skit-muted);
  }
}

.skit-refresh-time {
  margin-top: 10px;
  color: var(--skit-muted);
  font-size: 12px;
  text-align: right;
}

@media (max-width: 1200px) {
  .skit-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .skit-ops-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .skit-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .skit-dashboard {
    padding: 8px;
  }

  .skit-dashboard__head,
  .skit-panel__header {
    align-items: stretch;
    flex-direction: column;
  }

  .skit-dashboard__status {
    width: 100%;
    text-align: left;
  }

  .skit-stat-grid,
  .skit-ops-grid,
  .skit-menu-groups {
    grid-template-columns: 1fr;
  }
}
</style>
