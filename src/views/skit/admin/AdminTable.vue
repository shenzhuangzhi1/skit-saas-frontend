<template>
  <div class="skit-fastadmin-page">
    <div class="skit-panel">
      <div v-if="page.status === 'broken'" class="skit-alert skit-alert--warning">
        线上该菜单当前返回 404，本地已预留可用的数据管理页。
      </div>
      <div v-if="page.status === 'empty'" class="skit-alert skit-alert--info">
        线上页面当前为空状态，本地保留刷新和后续字段接入入口。
      </div>

      <div v-show="advancedVisible" class="commonsearch-table">
        <div class="commonsearch-grid">
          <label v-for="field in page.searchFields" :key="field.prop" class="commonsearch-item">
            <span>{{ field.label }}</span>
            <select
              v-if="field.type === 'select'"
              v-model="advancedModel[field.prop]"
              class="form-control"
            >
              <option value="">全部</option>
              <option value="正常">正常</option>
              <option value="待处理">待处理</option>
              <option value="禁用">禁用</option>
            </select>
            <div v-else-if="field.type === 'dateRange'" class="date-range">
              <input
                v-model="advancedModel[`${field.prop}Start`]"
                class="form-control"
                placeholder="开始日期"
              />
              <span>-</span>
              <input
                v-model="advancedModel[`${field.prop}End`]"
                class="form-control"
                placeholder="结束日期"
              />
            </div>
            <input
              v-else
              v-model="advancedModel[field.prop]"
              class="form-control"
              :placeholder="field.label"
            />
          </label>
        </div>
        <div class="commonsearch-actions">
          <button class="btn btn-success" type="button" @click="applySearch">提交</button>
          <button class="btn btn-default" type="button" @click="resetSearch()">重置</button>
        </div>
      </div>

      <div v-if="page.sections?.length" class="profile-forms">
        <section v-for="section in page.sections" :key="section.title" class="profile-section">
          <h3>{{ section.title }}</h3>
          <div class="commonsearch-grid">
            <label v-for="field in section.fields" :key="field.prop" class="commonsearch-item">
              <span>{{ field.label }}</span>
              <textarea
                v-if="field.prop === 'content'"
                v-model="formModel[field.prop]"
                class="form-control"
                rows="3"
              ></textarea>
              <input v-else v-model="formModel[field.prop]" class="form-control" />
            </label>
          </div>
          <div class="commonsearch-actions">
            <button class="btn btn-success" type="button" @click="saveProfile(section.title)">
              提交
            </button>
            <button class="btn btn-default" type="button" @click="resetProfile(section.fields)">
              重置
            </button>
          </div>
        </section>
      </div>

      <div v-if="hasTable" class="fixed-table-toolbar">
        <div class="toolbar">
          <button class="btn btn-primary" type="button" title="刷新" @click="refreshTable">
            <Icon icon="ep:refresh" />
          </button>
          <button
            v-if="hasAction('添加')"
            class="btn btn-success"
            type="button"
            title="添加"
            @click="openEditor('add')"
          >
            添加
          </button>
          <button
            v-if="hasAction('编辑')"
            class="btn btn-success"
            :class="{ disabled: selectedRows.length !== 1 }"
            type="button"
            title="编辑"
            @click="openEditor('edit')"
          >
            编辑
          </button>
          <button
            v-if="hasAction('删除')"
            class="btn btn-danger"
            :class="{ disabled: selectedRows.length === 0 }"
            type="button"
            title="删除"
            @click="deleteSelected"
          >
            删除
          </button>
          <button
            v-if="hasAction('审核通过')"
            class="btn btn-success"
            :class="{ disabled: selectedRows.length === 0 }"
            type="button"
            @click="batchSetStatus('审核通过')"
          >
            审核通过
          </button>
          <button
            v-if="hasAction('审核拒绝')"
            class="btn btn-danger"
            :class="{ disabled: selectedRows.length === 0 }"
            type="button"
            @click="batchSetStatus('审核拒绝')"
          >
            审核拒绝
          </button>
          <button
            v-if="selectedRows.length"
            class="btn btn-warning-light"
            type="button"
            @click="clearSelection"
          >
            Multiple selection mode: {{ selectedRows.length }} checked
          </button>
        </div>

        <div class="columns columns-right btn-group pull-right">
          <div class="keep-open btn-group" :class="{ open: columnMenuOpen }">
            <button
              class="btn btn-default"
              type="button"
              title="普通搜索"
              @click="advancedVisible = !advancedVisible"
            >
              <Icon icon="ep:search" />
            </button>
            <button
              class="btn btn-default dropdown-toggle"
              type="button"
              title="切换"
              @click="columnMenuOpen = !columnMenuOpen"
            >
              <Icon icon="ep:grid" />
            </button>
            <div v-show="columnMenuOpen" class="dropdown-menu column-menu">
              <label v-for="column in availableColumns" :key="column.prop">
                <input
                  type="checkbox"
                  :checked="visibleColumnKeys.has(column.prop)"
                  @change="toggleColumn(column.prop)"
                />
                {{ column.label }}
              </label>
            </div>
          </div>
          <div class="export btn-group" :class="{ open: exportMenuOpen }">
            <button
              class="btn btn-default dropdown-toggle"
              type="button"
              title="导出数据"
              @click="exportMenuOpen = !exportMenuOpen"
            >
              <Icon icon="ep:download" />
            </button>
            <div v-show="exportMenuOpen" class="dropdown-menu export-menu">
              <button type="button" @click="exportRows('json')">JSON</button>
              <button type="button" @click="exportRows('csv')">CSV</button>
              <button type="button" @click="exportRows('txt')">TXT</button>
              <button type="button" @click="exportRows('xls')">MS-Excel</button>
            </div>
          </div>
          <div class="search input-group">
            <input v-model="keywordInput" class="form-control search-input" placeholder="搜索" />
            <button class="btn btn-default" type="button" @click="applySearch">
              <Icon icon="ep:search" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="hasTable" class="fixed-table-container">
        <div v-if="loading" class="fixed-table-loading">正在努力地加载数据中，请稍候……</div>
        <div class="fixed-table-body">
          <table class="table table-striped table-bordered table-hover table-nowrap">
            <thead>
              <tr>
                <th v-if="hasSelection" class="bs-checkbox">
                  <input type="checkbox" :checked="allPageSelected" @change="togglePageSelection" />
                </th>
                <th
                  v-for="column in visibleColumns"
                  :key="column.prop"
                  :style="columnStyle(column)"
                >
                  <span>{{ column.label }}</span>
                  <span class="sortable"></span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pagedRows.length">
                <td :colspan="visibleColumns.length + (hasSelection ? 1 : 0)" class="no-record">
                  没有找到匹配的记录
                </td>
              </tr>
              <tr v-for="row in pagedRows" :key="String(row.__rowKey)">
                <td v-if="hasSelection" class="bs-checkbox">
                  <input
                    type="checkbox"
                    :checked="selectedKeys.has(String(row.__rowKey))"
                    @change="toggleRow(row)"
                  />
                </td>
                <td
                  v-for="column in visibleColumns"
                  :key="column.prop"
                  :style="columnStyle(column)"
                >
                  <template v-if="column.prop === 'operate'">
                    <button class="btn-link" type="button" @click="openEditor('view', row)"
                      >详情</button
                    >
                    <button class="btn-link" type="button" @click="openEditor('edit', row)"
                      >编辑</button
                    >
                  </template>
                  <span
                    v-else-if="isStatusColumn(column.prop)"
                    :class="statusClass(row[column.prop])"
                  >
                    {{ row[column.prop] }}
                  </span>
                  <span v-else>{{ row[column.prop] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="hasTable" class="fixed-table-pagination">
        <div class="pull-left pagination-detail">
          <span>
            显示第 {{ rangeStart }} 到第 {{ rangeEnd }} 条记录，总共
            {{ filteredRows.length }} 条记录
          </span>
          <span class="page-list">
            每页显示
            <select
              v-model.number="pageSize"
              class="btn btn-default page-size"
              @change="currentPage = 1"
            >
              <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
            </select>
            条记录
          </span>
        </div>
        <div class="pull-right pagination">
          <button
            class="page-btn"
            type="button"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            上一页
          </button>
          <button
            v-for="item in pageButtons"
            :key="item.key"
            class="page-btn"
            :class="{ active: item.page === currentPage, ellipsis: !item.page }"
            type="button"
            :disabled="!item.page"
            @click="item.page && (currentPage = item.page)"
          >
            {{ item.label }}
          </button>
          <button
            class="page-btn"
            type="button"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            下一页
          </button>
          <input v-model="jumpValue" class="pagination-jump" />
          <button class="page-btn" type="button" @click="jumpPage">Go</button>
        </div>
      </div>
    </div>

    <el-dialog v-model="editorVisible" :title="editorTitle" width="560px">
      <div class="dialog-form">
        <label v-for="column in editableColumns" :key="column.prop" class="commonsearch-item">
          <span>{{ column.label }}</span>
          <input
            v-model="editorModel[column.prop]"
            class="form-control"
            :disabled="editorMode === 'view'"
          />
        </label>
      </div>
      <template #footer>
        <button class="btn btn-default" type="button" @click="editorVisible = false">取消</button>
        <button
          v-if="editorMode !== 'view'"
          class="btn btn-success"
          type="button"
          @click="saveEditor"
        >
          提交
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  createSkitAdminRecord,
  deleteSkitAdminRecord,
  deleteSkitAdminRecordList,
  getSkitSystemConfig,
  getSkitAdminRecordPage,
  updateSkitSystemConfig,
  updateSkitAdminRecord,
  type SkitAdminRecordRespVO
} from '@/api/skit/adminRecord'
import { skitPageConfigs, type SkitColumn, type SkitSearchField } from './pageConfig'

defineOptions({ name: 'SkitAdminTable' })

const props = defineProps<{
  pageKey?: string
}>()

type CellValue = string | number | null | undefined
type TableRow = Record<string, CellValue>

const route = useRoute()
const pageKey = computed(() => (props.pageKey || route.meta?.skitPageKey || 'adRecord') as string)
const page = computed(() => skitPageConfigs[pageKey.value] || skitPageConfigs.adRecord)

const tableRows = ref<TableRow[]>([])
const selectedKeys = ref(new Set<string>())
const visibleColumnKeys = ref(new Set<string>())
const advancedModel = reactive<Record<string, string>>({})
const formModel = reactive<Record<string, string>>({})
const keywordInput = ref('')
const keyword = ref('')
const advancedVisible = ref(false)
const columnMenuOpen = ref(false)
const exportMenuOpen = ref(false)
const loading = ref(false)
const backendAvailable = ref(false)
const backendLoadSeq = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizes = [10, 25, 50, 100]
const backendPageSize = 200
const jumpValue = ref('')
const editorVisible = ref(false)
const editorMode = ref<'add' | 'edit' | 'view'>('add')
const editorModel = reactive<Record<string, string | number>>({})
const editingKey = ref('')

const hasSelection = computed(() =>
  page.value.columns.some((column) => column.prop === 'state' || column.prop === '0')
)
const availableColumns = computed(() =>
  page.value.columns.filter((column) => column.prop !== 'state' && column.prop !== '0')
)
const hasTable = computed(() => availableColumns.value.length > 0 || hasSelection.value)
const isSystemConfigPage = computed(() => page.value.key === 'systemConfig')
const visibleColumns = computed(() =>
  availableColumns.value.filter((column) => visibleColumnKeys.value.has(column.prop))
)
const editableColumns = computed(() =>
  availableColumns.value.filter(
    (column) =>
      ![
        'operate',
        'preview',
        'avatar',
        'createtime',
        'updatetime',
        'logintime',
        'paytime'
      ].includes(column.prop)
  )
)
const selectedRows = computed(() =>
  tableRows.value.filter((row) => selectedKeys.value.has(String(row.__rowKey)))
)
const filteredRows = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return tableRows.value.filter((row) => {
    const keywordMatched =
      !text ||
      visibleColumns.value.some((column) =>
        String(row[column.prop] || '')
          .toLowerCase()
          .includes(text)
      )
    if (!keywordMatched) return false
    return page.value.searchFields.every((field) => fieldMatched(row, field))
  })
})
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value))
)
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const rangeStart = computed(() =>
  filteredRows.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0
)
const rangeEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, filteredRows.value.length)
)
const allPageSelected = computed(
  () =>
    pagedRows.value.length > 0 &&
    pagedRows.value.every((row) => selectedKeys.value.has(String(row.__rowKey)))
)
const editorTitle = computed(() => {
  if (editorMode.value === 'add') return `添加${page.value.title}`
  if (editorMode.value === 'view') return `${page.value.title}详情`
  return `编辑${page.value.title}`
})
const pageButtons = computed(() => {
  const total = totalPages.value
  const page = currentPage.value
  const list: Array<{ key: string; label: string; page?: number }> = []
  const pushPage = (value: number) =>
    list.push({ key: `p-${value}`, label: String(value), page: value })
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pushPage(i)
    return list
  }
  pushPage(1)
  const start = Math.max(2, page - 2)
  const end = Math.min(total - 1, page + 2)
  if (start > 2) list.push({ key: 'e-left', label: '...' })
  for (let i = start; i <= end; i++) pushPage(i)
  if (end < total - 1) list.push({ key: 'e-right', label: '...' })
  pushPage(total)
  return list
})

watch(filteredRows, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

const hasAction = (action: string) => page.value.toolbar.some((item) => item.includes(action))

const fieldMatched = (row: TableRow, field: SkitSearchField) => {
  const exact = (advancedModel[field.prop] || '').trim().toLowerCase()
  const start = (advancedModel[`${field.prop}Start`] || '').trim()
  const end = (advancedModel[`${field.prop}End`] || '').trim()
  if (!exact && !start && !end) return true
  const value = String(row[field.prop] || '').toLowerCase()
  if (exact && !value.includes(exact)) return false
  if (start && String(row[field.prop] || '') < start) return false
  if (end && String(row[field.prop] || '') > end) return false
  return true
}

const buildRows = () => {
  if (page.value.status === 'empty') return []
  const count = Math.min(page.value.totalRows || 12, 2000)
  return Array.from({ length: count }, (_, index) => {
    const row = buildRow(index + 1)
    row.__rowKey = `${page.value.key}-${index + 1}`
    return row
  })
}

const buildRow = (index: number) => {
  const row: TableRow = {}
  page.value.columns.forEach((column) => {
    row[column.prop] = valueFor(column.prop, index)
  })
  return row
}

const loadPageRows = async (fallback = true) => {
  const seq = backendLoadSeq.value + 1
  backendLoadSeq.value = seq
  if (!hasTable.value) {
    tableRows.value = []
    backendAvailable.value = false
    loading.value = false
    return
  }
  loading.value = true
  try {
    const records = await fetchAllBackendRows(page.value.key)
    if (seq !== backendLoadSeq.value) return
    backendAvailable.value = true
    tableRows.value = records.map((record) => mapBackendRecord(record))
  } catch {
    if (seq !== backendLoadSeq.value) return
    backendAvailable.value = false
    if (fallback) {
      tableRows.value = buildRows()
    }
  } finally {
    if (seq === backendLoadSeq.value) {
      loading.value = false
    }
  }
}

const fetchAllBackendRows = async (targetPageKey: string) => {
  const firstPage = await getSkitAdminRecordPage({
    pageNo: 1,
    pageSize: backendPageSize,
    pageKey: targetPageKey
  })
  const records = [...(firstPage.list || [])]
  const total = Math.min(Number(firstPage.total || records.length), 2000)
  const pageCount = Math.ceil(total / backendPageSize)
  for (let pageNo = 2; pageNo <= pageCount; pageNo++) {
    const result = await getSkitAdminRecordPage({
      pageNo,
      pageSize: backendPageSize,
      pageKey: targetPageKey
    })
    records.push(...(result.list || []))
  }
  return records.slice(0, total)
}

const mapBackendRecord = (record: SkitAdminRecordRespVO) => {
  const row: TableRow = {}
  const data = record.recordData || {}
  page.value.columns.forEach((column) => {
    row[column.prop] = normalizeCellValue(data[column.prop])
  })
  Object.entries(data).forEach(([key, value]) => {
    if (row[key] === undefined) {
      row[key] = normalizeCellValue(value)
    }
  })
  row.__rowKey = record.rowKey || `${record.pageKey}-${record.id}`
  row.__backendId = record.id
  row.__backendSort = record.sort || 0
  return row
}

const normalizeCellValue = (value: unknown): CellValue => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? '是' : '否'
  return JSON.stringify(value)
}

const buildRecordData = (source: Record<string, unknown>) => {
  const data: Record<string, unknown> = {}
  page.value.columns.forEach((column) => {
    if (['operate', 'state', '0'].includes(column.prop)) return
    data[column.prop] = source[column.prop] ?? ''
  })
  Object.entries(source).forEach(([key, value]) => {
    if (!key.startsWith('__')) {
      data[key] = value ?? ''
    }
  })
  return data
}

const deriveBackendStatus = (data: Record<string, unknown>) => {
  const text = String(data.status || data.payment_status_text || data.ban_status_text || '')
  if (text.includes('待') || text.includes('审核')) return 1
  if (text.includes('禁') || text.includes('拒')) return 2
  return 0
}

const backendId = (row: TableRow) => {
  const id = Number(row.__backendId)
  return Number.isFinite(id) && id > 0 ? id : undefined
}

const valueFor = (prop: string, index: number): string | number => {
  const id = 1000 + index
  if (prop === 'id') return sampleId(index)
  if (prop === 'trans_id')
    return `${index % 2 ? '9626eb0ab960ccb72d' : 'bcb045b828a19f135c'}${index}`
  if (prop === 'network_firm_id') return [28, 15, 8][index % 3]
  if (prop === 'reward_points') return index * 10
  if (prop === 'publisher_revenue') return (index * 0.021).toFixed(3)
  if (prop.endsWith('_id') || prop === 'user_id' || prop === 'uid')
    return [14, 149, 22, 1032][index % 4]
  if (prop.includes('time') || prop === 'createtime' || prop === 'updatetime') {
    const hour = String((9 + index) % 24).padStart(2, '0')
    return `2026-07-${String((index % 6) + 1).padStart(2, '0')} ${hour}:24:53`
  }
  if (prop === 'log_date') return `2026-07-${String((index % 6) + 1).padStart(2, '0')}`
  if (prop === 'ad_network') return ['kuaishou', 'kuaishou', 'csj', 'gdt'][index % 4]
  if (prop === 'user_text') return `模拟用户${index} (#${id})`
  if (prop === 'inviter_text') return index % 3 === 0 ? '无' : `上级用户${index}`
  if (prop === 'mini_program_text') return `精准短剧 (#${(index % 3) + 1})`
  if (prop === 'nickname') return `模拟昵称${index}`
  if (prop === 'username') return `admin${index}`
  if (prop === 'email') return `user${index}@example.com`
  if (prop === 'mobile') return `138****${String(1000 + index).slice(-4)}`
  if (prop === 'appid') return `tt8f3ff98211592ad30${index}`
  if (prop === 'appsecret') return '******'
  if (prop.includes('ip')) return `192.0.2.${index}`
  if (prop === 'browser') return 'Mozilla/5.0'
  if (prop === 'status' || prop.includes('status')) return index % 3 === 0 ? '待处理' : '正常'
  if (prop.startsWith('is_')) return index % 2 === 0 ? '否' : '是'
  if (prop.includes('money') || prop === 'fee') return (index * 3.27).toFixed(2)
  if (prop.includes('score') || prop === 'before' || prop === 'after') return index * 100
  if (prop.includes('ratio') || prop.includes('rate')) return `${10 + index}%`
  if (prop === 'operate' || prop === 'state' || prop === '0') return ''
  return dictionaryValue(prop, index)
}

const sampleId = (index: number) => {
  const ids = [23267, 21566, 21565, 20178, 20176, 17665, 17663, 17661, 16582, 16581]
  return ids[index - 1] || 16000 - index
}

const dictionaryValue = (prop: string, index: number) => {
  const dictionary: Record<string, string | number> = {
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
    rewarded_count: index % 4,
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

const columnStyle = (column: SkitColumn) => ({
  minWidth: `${column.minWidth || column.width || 110}px`
})

const isStatusColumn = (prop: string) =>
  prop === 'status' || prop.includes('status') || prop.startsWith('is_')
const statusClass = (value: CellValue) => {
  const text = String(value)
  if (text.includes('待')) return 'label label-warning'
  if (text.includes('是') || text.includes('禁') || text.includes('拒')) return 'label label-danger'
  return 'label label-success'
}

const applySearch = () => {
  keyword.value = keywordInput.value
  currentPage.value = 1
}

const resetSearch = (message = true) => {
  keywordInput.value = ''
  keyword.value = ''
  Object.keys(advancedModel).forEach((key) => delete advancedModel[key])
  currentPage.value = 1
  if (message) ElMessage.success('已重置搜索')
}

const loadProfileModel = async () => {
  resetProfileModel()
  if (!isSystemConfigPage.value) return
  try {
    applyProfileValues(await getSkitSystemConfig())
  } catch {
    ElMessage.warning('系统配置读取失败，已使用默认配置')
  }
}

const refreshTable = async () => {
  await loadPageRows()
  clearSelection()
  ElMessage.success('刷新成功')
}

const toggleColumn = (prop: string) => {
  const next = new Set(visibleColumnKeys.value)
  if (next.has(prop)) {
    if (next.size === 1) {
      ElMessage.warning('至少保留一列')
      return
    }
    next.delete(prop)
  } else {
    next.add(prop)
  }
  visibleColumnKeys.value = next
}

const toggleRow = (row: TableRow) => {
  const next = new Set(selectedKeys.value)
  const key = String(row.__rowKey)
  next.has(key) ? next.delete(key) : next.add(key)
  selectedKeys.value = next
}

const togglePageSelection = () => {
  const next = new Set(selectedKeys.value)
  if (allPageSelected.value) {
    pagedRows.value.forEach((row) => next.delete(String(row.__rowKey)))
  } else {
    pagedRows.value.forEach((row) => next.add(String(row.__rowKey)))
  }
  selectedKeys.value = next
}

const clearSelection = () => {
  selectedKeys.value = new Set()
}

const deleteSelected = async () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择记录')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条记录？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  if (backendAvailable.value) {
    const ids = selectedRows.value.map((row) => backendId(row)).filter(Boolean) as number[]
    if (ids.length > 1) {
      await deleteSkitAdminRecordList(ids)
    } else if (ids.length === 1) {
      await deleteSkitAdminRecord(ids[0])
    }
    await loadPageRows(false)
    clearSelection()
    ElMessage.success('删除成功')
    return
  }
  const removing = new Set(selectedRows.value.map((row) => String(row.__rowKey)))
  tableRows.value = tableRows.value.filter((row) => !removing.has(String(row.__rowKey)))
  clearSelection()
  ElMessage.success('删除成功')
}

const batchSetStatus = async (status: string) => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择记录')
    return
  }
  selectedRows.value.forEach((row) => {
    if ('status' in row) row.status = status
    if ('payment_status_text' in row && status === '审核通过') row.payment_status_text = '待打款'
  })
  if (backendAvailable.value) {
    await Promise.all(
      selectedRows.value
        .map((row) => {
          const id = backendId(row)
          if (!id) return undefined
          const data = buildRecordData(row)
          return updateSkitAdminRecord({
            id,
            pageKey: page.value.key,
            rowKey: String(row.__rowKey || ''),
            recordData: data,
            status: deriveBackendStatus(data),
            sort: Number(row.__backendSort || 0)
          })
        })
        .filter((request): request is Promise<boolean> => Boolean(request))
    )
  }
  ElMessage.success(status)
}

const openEditor = (mode: 'add' | 'edit' | 'view', row?: TableRow) => {
  if (mode === 'edit' && !row && selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条记录')
    return
  }
  editorMode.value = mode
  const target = row || selectedRows.value[0] || {}
  editingKey.value = String(target.__rowKey || '')
  Object.keys(editorModel).forEach((key) => delete editorModel[key])
  editableColumns.value.slice(0, 18).forEach((column) => {
    editorModel[column.prop] = target[column.prop] || ''
  })
  editorVisible.value = true
}

const saveEditor = async () => {
  if (editorMode.value === 'add') {
    if (backendAvailable.value) {
      const rowKey = `${page.value.key}-custom-${Date.now()}`
      const data = buildRecordData(editorModel)
      await createSkitAdminRecord({
        pageKey: page.value.key,
        rowKey,
        recordData: data,
        status: deriveBackendStatus(data),
        sort: 0
      })
      await loadPageRows(false)
      editorVisible.value = false
      ElMessage.success('保存成功')
      return
    }
    const row: TableRow = { __rowKey: `${page.value.key}-custom-${Date.now()}` }
    page.value.columns.forEach((column) => {
      row[column.prop] =
        editorModel[column.prop] ||
        (column.prop === 'id' ? tableRows.value.length + 1 : valueFor(column.prop, 1))
    })
    tableRows.value.unshift(row)
  } else {
    const row = tableRows.value.find((item) => String(item.__rowKey) === editingKey.value)
    if (row) {
      Object.assign(row, editorModel)
      if (backendAvailable.value) {
        const id = backendId(row)
        if (id) {
          const data = buildRecordData(row)
          await updateSkitAdminRecord({
            id,
            pageKey: page.value.key,
            rowKey: String(row.__rowKey || ''),
            recordData: data,
            status: deriveBackendStatus(data),
            sort: Number(row.__backendSort || 0)
          })
          await loadPageRows(false)
        }
      }
    }
  }
  editorVisible.value = false
  ElMessage.success('保存成功')
}

const exportRows = (format: 'json' | 'csv' | 'txt' | 'xls') => {
  exportMenuOpen.value = false
  const columns = visibleColumns.value
  const rows = filteredRows.value
  let content = ''
  let type = 'text/plain;charset=utf-8'
  let ext = format
  if (format === 'json') {
    content = JSON.stringify(rows, null, 2)
    type = 'application/json;charset=utf-8'
  } else {
    const lines = [
      columns.map((column) => column.label).join(','),
      ...rows.map((row) => columns.map((column) => csvCell(row[column.prop])).join(','))
    ]
    content = lines.join('\n')
    if (format === 'xls') {
      ext = 'xls'
      type = 'application/vnd.ms-excel;charset=utf-8'
    } else if (format === 'csv') {
      type = 'text/csv;charset=utf-8'
    }
  }
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${page.value.key}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  ElMessage.success('导出成功')
}

const csvCell = (value: CellValue) => {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

const jumpPage = () => {
  const target = Number(jumpValue.value)
  if (!Number.isFinite(target)) return
  currentPage.value = Math.min(Math.max(1, Math.floor(target)), totalPages.value)
}

const saveProfile = async (section: string) => {
  if (isSystemConfigPage.value) {
    try {
      await updateSkitSystemConfig(buildProfilePayload())
      applyProfileValues(await getSkitSystemConfig())
    } catch {
      ElMessage.error(`${section}保存失败`)
      return
    }
  }
  ElMessage.success(`${section}保存成功`)
}

const resetProfileModel = () => {
  Object.keys(formModel).forEach((key) => delete formModel[key])
  applyProfileValues({})
}

const applyProfileValues = (values: Record<string, unknown>) => {
  page.value.sections?.forEach((section) => {
    section.fields.forEach((field) => {
      formModel[field.prop] = normalizeProfileValue(values[field.prop], field.prop)
    })
  })
}

const buildProfilePayload = () => {
  const payload: Record<string, string> = {}
  page.value.sections?.forEach((section) => {
    section.fields.forEach((field) => {
      payload[field.prop] = formModel[field.prop] ?? ''
    })
  })
  return payload
}

const normalizeProfileValue = (value: unknown, prop: string) => {
  if (value === null || value === undefined) return defaultProfileValue(prop)
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

const resetProfile = (fields: SkitSearchField[]) => {
  fields.forEach((field) => {
    formModel[field.prop] = defaultProfileValue(field.prop)
  })
  ElMessage.success('已重置')
}

const defaultProfileValue = (prop: string) => {
  const values: Record<string, string> = {
    username: '123456',
    email: '123456@qq.com',
    nickname: '123456',
    site_name: '短剧 SaaS 管理平台',
    site_title: '精准短剧',
    site_logo: '/favicon.ico',
    site_icp: '粤ICP备00000000号',
    site_copyright: 'Copyright © 2026',
    upload_storage: 'local',
    upload_max_size: '20MB',
    upload_exts: 'jpg,png,gif,mp4,zip,pdf',
    upload_cdn_url: '',
    upload_callback_url: '/admin-api/skit/upload/callback',
    score_per_yuan: '1000',
    withdraw_min_amount: '1.00',
    withdraw_fee_rate: '0',
    withdraw_fixed_fee: '0',
    withdraw_review_mode: '人工审核',
    ad_base_score: '10',
    max_ad_score: '1000',
    self_commission_rate: '100',
    agent_commission_rate: '10',
    reward_enabled: '开启',
    sms_sign: '精准短剧',
    mail_host: 'smtp.example.com',
    mail_username: 'notice@example.com',
    mail_from: 'notice@example.com',
    notify_webhook: '',
    name: '我的网站',
    reviewStatus: '待审核'
  }
  return values[prop] || ''
}

watch(
  pageKey,
  async () => {
    tableRows.value = []
    selectedKeys.value = new Set()
    visibleColumnKeys.value = new Set(availableColumns.value.map((column) => column.prop))
    resetSearch(false)
    await loadProfileModel()
    currentPage.value = 1
    pageSize.value = 10
    advancedVisible.value = false
    columnMenuOpen.value = false
    exportMenuOpen.value = false
    await loadPageRows()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.skit-fastadmin-page {
  min-height: calc(100vh - 100px);
  padding: 15px;
  background: #f1f4f6;
  color: #333;
  font-size: 14px;
  line-height: 1.42857143;
}

.skit-panel {
  min-height: 172px;
  padding: 15px;
  border-radius: 3px;
  background: #fff;
  color: #333;
  box-shadow: none;
}

.skit-alert {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 3px;
  font-size: 13px;
}

.skit-alert--warning {
  border: 1px solid #faebcc;
  background: #fcf8e3;
  color: #8a6d3b;
}

.skit-alert--info {
  border: 1px solid #bce8f1;
  background: #d9edf7;
  color: #31708f;
}

.commonsearch-table {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.commonsearch-grid,
.dialog-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(178px, 1fr));
  gap: 10px 12px;
}

.commonsearch-item {
  display: block;
  min-width: 0;

  span {
    display: block;
    margin-bottom: 5px;
    color: #333;
    font-weight: 600;
  }
}

.form-control {
  width: 100%;
  height: 34px;
  padding: 6px 12px;
  border: 1px solid #d2d6de;
  border-radius: 0;
  background: #fff;
  color: #555;
  font-size: 14px;
  outline: none;
  box-shadow: none;

  &:focus {
    border-color: #3c8dbc;
  }
}

textarea.form-control {
  height: auto;
}

.date-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16px minmax(0, 1fr);
  align-items: center;
  gap: 6px;

  span {
    margin: 0;
    color: #777;
    text-align: center;
  }
}

.commonsearch-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.profile-forms {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.profile-section {
  padding: 12px;
  border: 1px solid #eee;

  h3 {
    margin: 0 0 12px;
    color: #333;
    font-size: 15px;
  }
}

.fixed-table-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.toolbar,
.columns-right,
.btn-group,
.search {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar {
  flex-wrap: wrap;
}

.columns-right {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.42857143;
  white-space: nowrap;

  &.disabled,
  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    pointer-events: none;
  }
}

.btn-default {
  border-color: #ddd;
  background: #fff;
}

.btn-primary {
  border-color: #367fa9;
  background: #3c8dbc;
  color: #fff;
}

.btn-success {
  border-color: #008d4c;
  background: #00a65a;
  color: #fff;
}

.btn-danger {
  border-color: #d73925;
  background: #dd4b39;
  color: #fff;
}

.btn-warning-light {
  border-color: #f0ad4e;
  background: #fff8e6;
  color: #8a6d3b;
}

.keep-open,
.export {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 37px;
  right: 0;
  z-index: 10;
  min-width: 150px;
  padding: 6px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 6px 12px rgb(0 0 0 / 18%);
}

.column-menu {
  label {
    display: block;
    padding: 4px 12px;
    color: #333;
    cursor: pointer;
    white-space: nowrap;
  }
}

.export-menu {
  button {
    display: block;
    width: 100%;
    padding: 5px 16px;
    border: 0;
    background: transparent;
    color: #333;
    cursor: pointer;
    text-align: left;
  }
}

.search {
  margin-left: 2px;

  .search-input {
    width: 166px;
    border-radius: 0;
  }
}

.fixed-table-container {
  position: relative;
  overflow-x: auto;
  border-radius: 4px;
}

.fixed-table-loading {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 2;
  padding: 8px;
  background: rgb(255 255 255 / 85%);
  color: #333;
  text-align: center;
}

.table {
  width: 100%;
  min-width: 760px;
  margin-bottom: 0;
  border-collapse: collapse;
  background: #fff;
  color: #333;

  th,
  td {
    padding: 8px;
    border: 1px solid #f4f4f4;
    color: #333;
    font-size: 14px;
    vertical-align: middle;
    white-space: nowrap;
  }

  th {
    border-bottom-width: 2px;
    background: #fff;
    font-weight: 700;
  }

  tbody tr:nth-of-type(odd) {
    background: #f9f9f9;
  }
}

.table-nowrap {
  th,
  td {
    white-space: nowrap;
  }
}

.bs-checkbox {
  width: 44px;
  min-width: 44px;
  text-align: center;
}

.sortable::after {
  content: '↕';
  margin-left: 6px;
  color: #ddd;
  font-size: 12px;
}

.no-record {
  height: 42px;
  color: #777;
  text-align: center;
}

.btn-link {
  margin-right: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #3c8dbc;
  cursor: pointer;
}

.label {
  display: inline;
  padding: 0.2em 0.6em 0.3em;
  border-radius: 0.25em;
  color: #fff;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.label-success {
  background-color: #00a65a;
}

.label-warning {
  background-color: #f39c12;
}

.label-danger {
  background-color: #dd4b39;
}

.fixed-table-pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  color: #333;
}

.pagination-detail,
.pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.page-size {
  width: 58px;
  min-width: 58px;
  padding: 4px 8px;
  color: #333;
}

.page-btn {
  min-width: 34px;
  height: 34px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #fff;
  color: #777;
  cursor: pointer;

  &.active {
    border-color: #3c8dbc;
    background: #3c8dbc;
    color: #fff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
}

.pagination-jump {
  width: 52px;
  height: 34px;
  padding: 6px;
  border: 1px solid #ddd;
}

@media (max-width: 768px) {
  .skit-fastadmin-page {
    padding: 10px;
  }

  .fixed-table-toolbar,
  .fixed-table-pagination {
    flex-direction: column;
  }

  .columns-right,
  .pagination {
    justify-content: flex-start;
  }

  .search .search-input {
    width: 168px;
  }
}
</style>
