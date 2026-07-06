<template>
  <div class="skit-page">
    <div class="skit-page__head">
      <div>
        <div class="skit-page__crumb">{{ page.parent || '短剧 SaaS' }}</div>
        <div class="skit-page__title-row">
          <h1>{{ page.title }}</h1>
          <el-tag :type="tagType" effect="light">{{ currentStatusText }}</el-tag>
        </div>
        <div class="skit-page__meta">
          <span>{{ page.liveRoute }}</span>
          <span>{{ page.apiPath }}</span>
        </div>
      </div>
      <div class="skit-page__metric">
        <span>总记录</span>
        <strong>{{ page.totalRows ?? rows.length }}</strong>
      </div>
    </div>

    <el-alert
      v-if="page.status === 'broken'"
      class="mb-12px"
      type="warning"
      :closable="false"
      show-icon
      title="线上该菜单当前返回 404，本地已预留可用的数据管理页。"
    />
    <el-alert
      v-if="page.status === 'empty'"
      class="mb-12px"
      type="info"
      :closable="false"
      show-icon
      title="线上页面当前为空状态，本地保留刷新和后续字段接入入口。"
    />

    <template v-if="page.sections?.length">
      <el-card
        v-for="section in page.sections"
        :key="section.title"
        shadow="never"
        class="skit-section"
      >
        <template #header>
          <div class="skit-card-header">
            <span>{{ section.title }}</span>
            <div>
              <el-button :icon="Refresh" @click="notifyAction('重置')">重置</el-button>
              <el-button type="primary" :icon="Check" @click="notifyAction('提交')">提交</el-button>
            </div>
          </div>
        </template>
        <el-form label-position="top" class="skit-form-grid">
          <el-form-item v-for="field in section.fields" :key="field.prop" :label="field.label">
            <el-select
              v-if="field.type === 'select'"
              v-model="searchModel[field.prop]"
              class="w-1/1"
              placeholder="全部"
              clearable
            >
              <el-option label="正常" value="normal" />
              <el-option label="禁用" value="disabled" />
            </el-select>
            <el-input v-else v-model="searchModel[field.prop]" clearable />
          </el-form-item>
        </el-form>
      </el-card>
    </template>

    <el-card v-if="page.searchFields.length" shadow="never" class="skit-search">
      <el-form label-position="top" class="skit-form-grid">
        <el-form-item v-for="field in visibleSearchFields" :key="field.prop" :label="field.label">
          <el-date-picker
            v-if="field.type === 'dateRange'"
            v-model="searchModel[field.prop]"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="w-1/1"
          />
          <el-select
            v-else-if="field.type === 'select'"
            v-model="searchModel[field.prop]"
            class="w-1/1"
            placeholder="全部"
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="正常" value="normal" />
            <el-option label="禁用" value="disabled" />
            <el-option label="待审核" value="pending" />
          </el-select>
          <el-input v-else v-model="searchModel[field.prop]" clearable />
        </el-form-item>
      </el-form>
      <div class="skit-search__actions">
        <el-button
          v-if="page.searchFields.length > collapsedSearchCount"
          text
          type="primary"
          @click="searchExpanded = !searchExpanded"
        >
          {{ searchExpanded ? '收起' : '展开全部' }}
        </el-button>
        <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        <el-button type="primary" :icon="Search" @click="notifyAction('搜索')">搜索</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="skit-table-card">
      <template #header>
        <div class="skit-card-header">
          <div class="skit-card-title">
            <span>{{ page.title }}</span>
            <small>{{ page.description }}</small>
          </div>
          <div class="skit-toolbar">
            <el-button
              v-for="action in toolbarActions"
              :key="action"
              :type="buttonType(action)"
              :icon="actionIcon(action)"
              @click="notifyAction(action)"
            >
              {{ action }}
            </el-button>
          </div>
        </div>
      </template>

      <el-empty
        v-if="!visibleColumns.length && !rows.length"
        :description="page.status === 'empty' ? '暂无字段' : '暂无数据'"
      />
      <el-table
        v-else
        :data="rows"
        border
        stripe
        height="520"
        class="skit-table"
        row-key="id"
      >
        <el-table-column v-if="hasSelection" type="selection" width="48" fixed="left" />
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="column.minWidth || 120"
          :fixed="column.prop === 'operate' ? 'right' : false"
        >
          <template #default="{ row }">
            <template v-if="column.prop === 'operate'">
              <el-button link type="primary" :icon="View" @click="notifyAction('详情')">详情</el-button>
              <el-button link type="primary" :icon="Edit" @click="notifyAction('编辑')">编辑</el-button>
            </template>
            <el-tag v-else-if="isStatusColumn(column.prop)" :type="statusTagType(row[column.prop])">
              {{ row[column.prop] }}
            </el-tag>
            <el-avatar v-else-if="column.prop === 'avatar'" :size="28">
              {{ String(row.nickname || '用').slice(0, 1) }}
            </el-avatar>
            <span v-else>{{ row[column.prop] }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Check,
  Close,
  Delete,
  Download,
  Edit,
  Plus,
  Refresh,
  Search,
  Setting,
  View
} from '@element-plus/icons-vue'
import { skitPageConfigs, statusText, type SkitPageConfig } from './pageConfig'

defineOptions({ name: 'SkitAdminTable' })

const props = defineProps<{
  pageKey?: string
}>()

const route = useRoute()
const searchModel = reactive<Record<string, string | string[]>>({})
const searchExpanded = ref(false)
const collapsedSearchCount = 12

const pageKey = computed(() => {
  return (props.pageKey || route.meta?.skitPageKey || 'adRecord') as string
})

const page = computed<SkitPageConfig>(() => skitPageConfigs[pageKey.value] || skitPageConfigs.adRecord)
const currentStatusText = computed(() => statusText[page.value.status || 'ready'])
const tagType = computed(() => {
  if (page.value.status === 'broken') return 'warning'
  if (page.value.status === 'empty') return 'info'
  return 'success'
})

const visibleSearchFields = computed(() => {
  if (searchExpanded.value) return page.value.searchFields
  return page.value.searchFields.slice(0, collapsedSearchCount)
})

const hasSelection = computed(() =>
  page.value.columns.some((column) => column.prop === 'state' || column.prop === '0')
)
const visibleColumns = computed(() =>
  page.value.columns.filter((column) => column.prop !== 'state' && column.prop !== '0')
)
const toolbarActions = computed(() => [...new Set(page.value.toolbar)])

watch(pageKey, () => {
  Object.keys(searchModel).forEach((key) => delete searchModel[key])
  searchExpanded.value = false
})

const rows = computed(() => {
  if (page.value.status === 'empty') return []
  const size = Math.min(page.value.totalRows || 8, 12)
  return Array.from({ length: size }, (_, index) => buildRow(page.value, index + 1))
})

const buildRow = (config: SkitPageConfig, index: number) => {
  const row: Record<string, string | number> = {}
  config.columns.forEach((column) => {
    row[column.prop] = valueFor(column.prop, index)
  })
  return row
}

const valueFor = (prop: string, index: number): string | number => {
  const id = 1000 + index
  if (prop === 'id') return index
  if (prop.endsWith('_id') || prop === 'user_id') return id
  if (prop.includes('time') || prop === 'createtime' || prop === 'updatetime') {
    return `2026-07-${String((index % 6) + 1).padStart(2, '0')} ${String(9 + index).padStart(2, '0')}:24:53`
  }
  if (prop === 'log_date') return `2026-07-${String((index % 6) + 1).padStart(2, '0')}`
  if (prop === 'user_text') return `模拟用户${index} (#${id})`
  if (prop === 'inviter_text') return index % 3 === 0 ? '无' : `上级用户${index}`
  if (prop === 'mini_program_text') return `精准短剧 (#${(index % 3) + 1})`
  if (prop === 'nickname') return `模拟昵称${index}`
  if (prop === 'username') return `admin${index}`
  if (prop === 'email') return `user${index}@example.com`
  if (prop === 'mobile') return `138****${String(1000 + index).slice(-4)}`
  if (prop === 'appid') return `tt-demo-appid-${index}`
  if (prop === 'appsecret') return '******'
  if (prop === 'trans_id') return `mock-trans-${String(index).padStart(6, '0')}`
  if (prop.includes('ip')) return `192.0.2.${index}`
  if (prop === 'browser') return 'Mozilla/5.0'
  if (prop === 'status' || prop.includes('status')) return index % 3 === 0 ? '待处理' : '正常'
  if (prop.startsWith('is_')) return index % 2 === 0 ? '否' : '是'
  if (prop.includes('money') || prop.includes('revenue') || prop === 'fee') return `¥${(index * 3.27).toFixed(2)}`
  if (prop.includes('score') || prop === 'before' || prop === 'after') return index * 100
  if (prop.includes('ratio') || prop.includes('rate')) return `${10 + index}%`
  if (prop === 'operate' || prop === 'state' || prop === '0') return ''
  const dictionary: Record<string, string> = {
    title: `公告标题 ${index}`,
    content: `公告正文摘要 ${index}`,
    filename: `upload-${index}.png`,
    preview: '预览',
    filesize: `${300 + index * 12} KB`,
    imagewidth: '1254',
    imageheight: '1254',
    imagetype: 'png',
    storage: 'local',
    mimetype: 'image/png',
    ad_network: 'Taku',
    withdraw_type: '积分提现',
    account_type: '微信',
    account: `mock-account-${index}`,
    review_mode: '人工审核',
    payment_status_text: '未打款',
    reject_reason: '-',
    memo: '广告奖励',
    login_type: '手机号',
    device_platform: index % 2 === 0 ? 'android' : 'ios',
    device_brand: index % 2 === 0 ? 'Redmi' : 'iPhone',
    device_model: index % 2 === 0 ? 'K70' : 'iPhone 15',
    os_name: index % 2 === 0 ? 'Android' : 'iOS',
    os_version: index % 2 === 0 ? 'Android 13' : 'iOS 17',
    network_type: 'wifi',
    province: '示例省',
    city: '示例市',
    district: '示例区',
    location: '示例位置',
    invite_code: `SKIT${1000 + index}`,
    ban_status_text: '未封禁',
    name: `精准短剧 ${index}`,
    scene: '登录',
    ad_slot: 'rewarded',
    host_app_name: 'Douyin',
    host_app_version: '30.8.0',
    type: 'active',
    callback_url: 'https://callback.example.com/skit',
    model: 'V2047A',
    csite: 'site',
    sl: 'sl'
  }
  return dictionary[prop] || `${prop}-${index}`
}

const actionIcon = (action: string) => {
  if (action.includes('刷新')) return Refresh
  if (action.includes('搜索')) return Search
  if (action.includes('添加')) return Plus
  if (action.includes('编辑')) return Edit
  if (action.includes('删除') || action.includes('封号')) return Delete
  if (action.includes('导出')) return Download
  if (action.includes('审核通过') || action.includes('提交')) return Check
  if (action.includes('审核拒绝')) return Close
  return Setting
}

const buttonType = (action: string) => {
  if (action.includes('删除') || action.includes('拒绝') || action.includes('封号')) return 'danger'
  if (action.includes('添加') || action.includes('通过')) return 'success'
  if (action.includes('导出')) return 'warning'
  return 'default'
}

const isStatusColumn = (prop: string) => prop === 'status' || prop.includes('status') || prop.startsWith('is_')
const statusTagType = (value: string | number) => {
  const text = String(value)
  if (text.includes('待')) return 'warning'
  if (text.includes('是') || text.includes('禁')) return 'danger'
  return 'success'
}

const resetSearch = () => {
  Object.keys(searchModel).forEach((key) => delete searchModel[key])
}

const notifyAction = (action: string) => {
  ElMessage.info(`${page.value.title}：${action}`)
}
</script>

<style scoped lang="scss">
.skit-page {
  --skit-border: #d7dde8;
  --skit-text: #1f2937;
  --skit-muted: #667085;
  padding: 12px;
}

.skit-page__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.skit-page__crumb {
  margin-bottom: 6px;
  color: var(--skit-muted);
  font-size: 13px;
}

.skit-page__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  h1 {
    margin: 0;
    color: var(--skit-text);
    font-size: 22px;
    font-weight: 650;
    line-height: 1.25;
  }
}

.skit-page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 8px;
  color: var(--skit-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.skit-page__metric {
  min-width: 120px;
  padding: 10px 14px;
  border: 1px solid var(--skit-border);
  border-radius: 6px;
  background: #fff;
  text-align: right;

  span {
    display: block;
    color: var(--skit-muted);
    font-size: 12px;
  }

  strong {
    color: var(--skit-text);
    font-size: 24px;
    line-height: 1.2;
  }
}

.skit-search,
.skit-section,
.skit-table-card {
  margin-bottom: 12px;
  border-radius: 6px;
}

.skit-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.skit-card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    color: var(--skit-text);
    font-size: 15px;
    font-weight: 650;
  }

  small {
    max-width: 760px;
    color: var(--skit-muted);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
  }
}

.skit-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.skit-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 4px 12px;
}

.skit-search__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.skit-table {
  width: 100%;
}

@media (max-width: 768px) {
  .skit-page {
    padding: 8px;
  }

  .skit-page__head,
  .skit-card-header,
  .skit-search__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .skit-page__metric {
    width: 100%;
    text-align: left;
  }

  .skit-toolbar {
    justify-content: flex-start;
  }
}
</style>
