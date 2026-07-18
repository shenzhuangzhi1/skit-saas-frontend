<template>
  <div class="skit-fastadmin-page">
    <div class="skit-panel">
      <div v-if="isDramaPage" class="tenant-scope-row">
        <TenantScopeBar v-model="scopeModel" :tenants="tenantOptions" />
        <span v-if="tenantOptionsError || dramaPageError" class="tenant-scope-error">
          {{ tenantOptionsError || dramaPageError }}
        </span>
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

      <div
        v-if="page.sections?.length"
        class="profile-forms"
        :class="{ 'profile-forms--tabs': sectionTabsEnabled }"
      >
        <template v-if="sectionTabsEnabled">
          <div class="config-tabs" role="tablist">
            <button
              v-for="(section, index) in page.sections"
              :key="section.title"
              class="config-tab"
              :class="{ active: activeSectionIndex === index }"
              type="button"
              role="tab"
              :aria-selected="activeSectionIndex === index"
              @click="activeSectionIndex = index"
            >
              {{ section.title }}
            </button>
          </div>
          <section v-if="activeSection" class="profile-section profile-section--tab">
            <div class="commonsearch-grid">
              <label
                v-for="field in activeSection.fields"
                :key="field.prop"
                class="commonsearch-item"
              >
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
              <button
                class="btn btn-success"
                type="button"
                @click="saveProfile(activeSection.title)"
              >
                提交
              </button>
              <button
                class="btn btn-default"
                type="button"
                @click="resetProfile(activeSection.fields)"
              >
                重置
              </button>
            </div>
          </section>
        </template>
        <template v-else>
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
        </template>
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
            v-if="hasAction('导入 SDK 剧单')"
            class="btn btn-primary"
            type="button"
            @click="openDramaImport"
          >
            导入 SDK 剧单
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
            v-if="hasAction('上架')"
            class="btn btn-success"
            :class="{ disabled: selectedRows.length === 0 }"
            type="button"
            @click="batchSetPublishStatus('上架')"
          >
            上架
          </button>
          <button
            v-if="hasAction('下架')"
            class="btn btn-warning-light"
            :class="{ disabled: selectedRows.length === 0 }"
            type="button"
            @click="batchSetPublishStatus('下架')"
          >
            下架
          </button>
          <button
            v-if="selectedRows.length"
            class="btn btn-warning-light"
            type="button"
            @click="clearSelection"
          >
            已选择 {{ selectedRows.length }} 项
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
                    <button
                      v-for="action in rowOperateActions"
                      :key="action.mode"
                      class="btn-operate"
                      type="button"
                      :title="action.label"
                      :aria-label="action.label"
                      @click="openEditor(action.mode, row)"
                    >
                      <Icon v-if="action.icon" :icon="action.icon" />
                      <span v-if="action.text">{{ action.text }}</span>
                    </button>
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
            显示第 {{ rangeStart }} 到第 {{ rangeEnd }} 条记录，总共 {{ displayTotalRows }} 条记录
          </span>
          <span class="page-list">
            每页显示
            <span class="page-size-menu" :class="{ open: pageSizeMenuOpen }">
              <button
                class="btn btn-default page-size"
                type="button"
                @click="pageSizeMenuOpen = !pageSizeMenuOpen"
              >
                {{ pageSize }}
              </button>
              <span v-show="pageSizeMenuOpen" class="dropdown-menu page-size-dropdown">
                <button
                  v-for="size in pageSizes"
                  :key="size"
                  type="button"
                  @click="changePageSize(size)"
                >
                  {{ size }}
                </button>
              </span>
            </span>
            条记录
          </span>
        </div>
        <div class="pull-right pagination">
          <button
            class="page-btn"
            type="button"
            :disabled="currentPage <= 1"
            @click="changePage(currentPage - 1)"
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
            @click="item.page && changePage(item.page)"
          >
            {{ item.label }}
          </button>
          <button
            class="page-btn"
            type="button"
            :disabled="currentPage >= totalPages"
            @click="changePage(currentPage + 1)"
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

    <el-dialog v-model="dramaImportVisible" title="导入 SDK 剧单" width="680px">
      <textarea
        v-model="dramaImportText"
        class="form-control drama-import-input"
        rows="16"
        spellcheck="false"
      ></textarea>
      <template #footer>
        <button class="btn btn-default" type="button" @click="dramaImportVisible = false">
          取消
        </button>
        <button class="btn btn-success" type="button" @click="importDramaCatalog">导入</button>
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
  getSkitAdminRecordPage,
  updateSkitAdminRecord,
  type SkitAdminRecordRespVO
} from '@/api/skit/adminRecord'
import * as TenantApi from '@/api/skit/tenant'
import TenantScopeBar from '@/views/skit/shared/TenantScopeBar.vue'
import type { TenantScope, TenantScopeSelection } from '@/views/skit/shared/tenantScope'
import { useTenantScope } from '@/views/skit/shared/useTenantScope'
import { buildDramaMutationScope, buildDramaQueryScope } from './dramaTenantScope'
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
const isDramaPage = computed(() => page.value.key === 'drama')
const scopeManager = useTenantScope()

const tableRows = ref<TableRow[]>([])
const tenantOptions = ref<Array<{ tenantId: number; name: string }>>([])
const tenantOptionsError = ref('')
const dramaPageError = ref('')
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
const backendTotalRows = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizes = [10, 25, 50, 100]
const pageSizeMenuOpen = ref(false)
const activeSectionIndex = ref(0)
const jumpValue = ref('')
const editorVisible = ref(false)
const editorMode = ref<'add' | 'edit' | 'view'>('add')
const editorModel = reactive<Record<string, string | number>>({})
const editingKey = ref('')
const dramaImportVisible = ref(false)
const dramaImportText = ref('')
type OperateAction = {
  mode: 'edit' | 'view'
  label: string
  text: string
  icon: string
}

const scopeModel = computed<TenantScope>({
  get: () => scopeManager.scope.value,
  set: (value) => {
    const selection: TenantScopeSelection = value.kind === 'all' ? 'all' : value.targetTenantId
    scopeManager.select(selection)
    currentPage.value = 1
    selectedKeys.value = new Set()
    void loadPageRows(false)
  }
})

const hasSelection = computed(() =>
  page.value.columns.some((column) => column.prop === 'state' || column.prop === '0')
)
const availableColumns = computed(() =>
  page.value.columns.filter((column) => column.prop !== 'state' && column.prop !== '0')
)
const hasTable = computed(() => availableColumns.value.length > 0 || hasSelection.value)
const sectionTabsEnabled = computed(() => (page.value.sections?.length || 0) > 1)
const activeSection = computed(() => {
  const sections = page.value.sections || []
  return sections[activeSectionIndex.value] || sections[0]
})
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
const hasActiveFilters = computed(
  () =>
    Boolean(keyword.value.trim()) ||
    Object.values(advancedModel).some((value) => String(value || '').trim())
)
const hasLocalFilters = computed(() =>
  Object.values(advancedModel).some((value) => String(value || '').trim())
)
const rowOperateActions = computed<OperateAction[]>(() => {
  if (page.value.operateMode === 'detail') {
    return [{ mode: 'view', label: '详情', text: '详情', icon: '' }]
  }
  return [
    { mode: 'view', label: '详情', text: '', icon: 'ep:view' },
    { mode: 'edit', label: '编辑', text: '', icon: 'ep:edit' }
  ]
})
const displayTotalRows = computed(() => {
  if (isDramaPage.value) {
    return backendAvailable.value && !hasLocalFilters.value
      ? backendTotalRows.value
      : filteredRows.value.length
  }
  return backendAvailable.value && !hasLocalFilters.value
    ? Math.max(
        backendTotalRows.value,
        !hasActiveFilters.value && page.value.totalRows !== undefined ? page.value.totalRows : 0
      )
    : !hasActiveFilters.value && page.value.totalRows !== undefined
      ? page.value.totalRows
      : filteredRows.value.length
})
const totalPages = computed(() => Math.max(1, Math.ceil(displayTotalRows.value / pageSize.value)))
const pagedRows = computed(() => {
  if (backendAvailable.value) return filteredRows.value
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const rangeStart = computed(() =>
  hasTable.value ? (displayTotalRows.value ? (currentPage.value - 1) * pageSize.value + 1 : 1) : 0
)
const rangeEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, displayTotalRows.value)
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

const isPositiveInteger = (value: unknown) => {
  const numeric = Number(value)
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null
}

const isNonNegativeInteger = (value: unknown) => {
  const numeric = Number(value)
  return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : null
}

const sourceField = (source: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && String(value).trim()) return value
  }
  return undefined
}

const sdkContentStatus = (value: unknown) => {
  if (Number(value) === 1) return '连载中'
  if (Number(value) === 0) return '已完结'
  return String(value ?? '').trim() || '未知'
}

const normalizeSdkDrama = (source: Record<string, unknown>): TableRow | null => {
  const pangleDramaId = isPositiveInteger(
    sourceField(source, 'pangleDramaId', 'dramaId', 'drama_id', 'contentId', 'nativeId', 'id')
  )
  const episodes = isPositiveInteger(
    sourceField(source, 'total', 'episodeCount', 'count', 'episodes')
  )
  const freeEpisodes = isNonNegativeInteger(
    sourceField(source, 'freeSet', 'free_set', 'freeEpisodes')
  )
  const unlockSize = isPositiveInteger(sourceField(source, 'lockSet', 'lock_set', 'unlockSize'))
  if (
    !pangleDramaId ||
    !episodes ||
    freeEpisodes === null ||
    freeEpisodes > episodes ||
    !unlockSize
  ) {
    return null
  }
  return {
    pangleDramaId,
    title: String(sourceField(source, 'title', 'scriptName', 'name') || '').trim() || '未命名短剧',
    cover: String(sourceField(source, 'coverImage', 'cover_image', 'cover', 'poster') || '').trim(),
    category: String(sourceField(source, 'type', 'category') || '').trim() || '热播',
    episodes,
    freeEpisodes,
    unlockSize,
    contentStatus: sdkContentStatus(source.status),
    publishStatus: '下架'
  }
}

const sdkCatalogItems = (payload: unknown): Record<string, unknown>[] => {
  const candidate = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { list?: unknown }).list)
      ? (payload as { list: unknown[] }).list
      : []
  return candidate.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object'
  )
}

const dramaMutationScope = (reason: string) => {
  if (!isDramaPage.value) return {}
  try {
    return buildDramaMutationScope(scopeModel.value, reason)
  } catch {
    ElMessage.warning('请先选择代理商')
    return null
  }
}

const loadTenantOptions = async () => {
  tenantOptionsError.value = ''
  try {
    if (scopeManager.isPlatformAdmin.value) {
      const result = await TenantApi.getTenantAgentPage({ pageNo: 1, pageSize: 100 })
      tenantOptions.value = (result.list || []).map((tenant) => ({
        tenantId: tenant.tenantId,
        name: tenant.name
      }))
      return
    }
    const invitation = await TenantApi.getTenantInvitation()
    tenantOptions.value = [{ tenantId: invitation.tenantId, name: invitation.tenantName }]
  } catch {
    tenantOptions.value = []
    tenantOptionsError.value = '代理商列表加载失败'
  }
}

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
  if (page.value.status === 'empty' || isDramaPage.value) return []
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
    row[column.prop] = valueFor(page.value.key, column.prop, index)
  })
  return row
}

const loadPageRows = async (fallback = true) => {
  const seq = backendLoadSeq.value + 1
  backendLoadSeq.value = seq
  if (!hasTable.value) {
    tableRows.value = []
    backendAvailable.value = false
    backendTotalRows.value = 0
    loading.value = false
    return
  }
  dramaPageError.value = ''
  loading.value = true
  try {
    const result = await fetchBackendRows(page.value.key)
    if (seq !== backendLoadSeq.value) return
    backendAvailable.value = true
    backendTotalRows.value = Number(result.total || 0)
    tableRows.value = (result.list || []).map((record) => mapBackendRecord(record))
  } catch (cause) {
    if (seq !== backendLoadSeq.value) return
    backendAvailable.value = isDramaPage.value
    backendTotalRows.value = 0
    tableRows.value = []
    if (isDramaPage.value) {
      dramaPageError.value =
        cause instanceof Error && cause.message.includes('select one tenant')
          ? '请先选择代理商'
          : '真实剧单加载失败'
    } else if (fallback) {
      tableRows.value = buildRows()
    }
  } finally {
    if (seq === backendLoadSeq.value) {
      loading.value = false
    }
  }
}

const fetchBackendRows = (targetPageKey: string) => {
  const tenantScope = targetPageKey === 'drama' ? buildDramaQueryScope(scopeModel.value) : {}
  return getSkitAdminRecordPage({
    pageNo: currentPage.value,
    pageSize: pageSize.value,
    pageKey: targetPageKey,
    ...tenantScope,
    keyword: keyword.value.trim() || undefined
  })
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

const valueFor = (targetPageKey: string, prop: string, index: number): string | number => {
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
  if (prop === 'payment_status_text') return index % 4 === 0 ? '已打款' : '未打款'
  if (prop === 'ban_status_text') return '未封禁'
  if (prop === 'status' || prop.includes('status')) return index % 3 === 0 ? '待处理' : '正常'
  if (prop.startsWith('is_')) return index % 2 === 0 ? '否' : '是'
  if (prop === 'fee') return (index * 0.03).toFixed(2)
  if (prop === 'real_money') return (index * 3.24).toFixed(2)
  if (prop.includes('money') || prop === 'fee') return (index * 3.27).toFixed(2)
  if (prop.includes('score') || prop === 'before' || prop === 'after') return index * 100
  if (prop.includes('ratio') || prop.includes('rate')) return `${10 + index}%`
  if (prop === 'operate' || prop === 'state' || prop === '0') return ''
  return dictionaryValue(targetPageKey, prop, index)
}

const sampleId = (index: number) => {
  const ids = [23267, 21566, 21565, 20178, 20176, 17665, 17663, 17661, 16582, 16581]
  return ids[index - 1] || 16000 - index
}

const titleFor = (targetPageKey: string, index: number) => {
  if (targetPageKey === 'drama') {
    const names = ['重生后我逆袭成王', '闪婚后傅总追妻忙', '保洁妈妈是首富', '离婚后前夫后悔了']
    return `${names[(index - 1) % names.length]} ${index}`
  }
  if (targetPageKey === 'operationLog') return `后台访问 ${index}`
  if (targetPageKey === 'announcement') return `公告标题 ${index}`
  return `记录标题 ${index}`
}

const dictionaryValue = (targetPageKey: string, prop: string, index: number) => {
  const dictionary: Record<string, string | number> = {
    title: titleFor(targetPageKey, index),
    category: ['都市', '逆袭', '甜宠', '悬疑'][index % 4],
    episodes: 80 + (index % 20),
    content: `公告正文摘要 ${index}`,
    url: `/manystore/${targetPageKey}?page=${index}`,
    cover: `/uploads/20260708/drama-cover-${index}.jpg`,
    avatar: `/uploads/20260708/avatar-${index}.png`,
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
    agent_ratio: 20 + index,
    member_self_ratio: 100,
    member_parent_ratio: 10,
    member_grandparent_ratio: 5,
    descendant_count: index % 7,
    today_agent_points: index * 12,
    total_agent_points: index * 320,
    remark: '默认分佣规则',
    login_type: '手机号',
    device_id: `device-${String(index).padStart(4, '0')}`,
    idf: `idf-${String(index).padStart(4, '0')}`,
    idfa: `idfa-${String(index).padStart(4, '0')}`,
    idfv: `idfv-${String(index).padStart(4, '0')}`,
    oaid: `oaid-${String(index).padStart(4, '0')}`,
    imei: `860000000000${String(index).padStart(3, '0')}`,
    android_id: `android-${String(index).padStart(4, '0')}`,
    device_platform: index % 2 === 0 ? 'android' : 'ios',
    device_brand: index % 2 === 0 ? 'Redmi' : 'iPhone',
    device_model: index % 2 === 0 ? 'K70' : 'iPhone 15',
    os_name: index % 2 === 0 ? 'Android' : 'iOS',
    os_version: index % 2 === 0 ? 'Android 13' : 'iOS 17',
    android_version: index % 2 === 0 ? '13' : '-',
    app_version: `1.0.${index % 9}`,
    app_build: `100${index}`,
    package_name: 'com.skit.duanju',
    network_type: 'wifi',
    sim_state: 'ready',
    sim_operator: index % 2 === 0 ? '中国移动' : '中国联通',
    sim_count: index % 2 === 0 ? 2 : 1,
    province: '示例省',
    city: '示例市',
    district: '示例区',
    country: '中国',
    address: `示例市短剧产业园 ${index} 号`,
    location: '示例位置',
    latitude: '23.1291',
    longitude: '113.2644',
    screen_size: index % 2 === 0 ? '1080x2400' : '1179x2556',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    user_agent: `Mozilla/5.0 SkitApp/${index}`,
    info_hash: `infohash-${index}`,
    install_time: `2026-07-${String((index % 6) + 1).padStart(2, '0')} 08:00:00`,
    invite_code: `SKIT${1000 + index}`,
    ban_status_text: '未封禁',
    ban_reason: '-',
    direct_user_count: index % 8,
    ad_reward_ratio: 100,
    logintime: `2026-07-${String((index % 6) + 1).padStart(2, '0')} ${String((8 + index) % 24).padStart(2, '0')}:18:00`,
    loginip: `192.0.2.${index}`,
    jointime: `2026-06-${String((index % 20) + 1).padStart(2, '0')} ${String((8 + index) % 24).padStart(2, '0')}:18:00`,
    name: `精准短剧 ${index}`,
    ad_base_score: 10,
    self_commission_rate: 100,
    max_ad_score: 1000,
    withdraw_min_amount: '1.00',
    withdraw_fee_rate: '0',
    withdraw_fixed_fee: '0',
    access_token_expiretime: `2026-07-${String((index % 6) + 1).padStart(2, '0')} 23:59:59`,
    mini_program_id: (index % 3) + 1,
    third_id: `third-${index}`,
    openid: `openid-${index}`,
    unionid: `unionid-${index}`,
    anonymous_openid: `anonymous-${index}`,
    scene: '登录',
    ad_slot: 'rewarded',
    rewarded_count: index % 4,
    host_app_name: 'Douyin',
    host_app_version: '30.8.0',
    type: targetPageKey === 'douyinTrafficRecord' ? 'active' : '广告奖励',
    callback_url: 'https://callback.example.com/skit',
    model: 'V2047A',
    request_time: `2026-07-${String((index % 6) + 1).padStart(2, '0')} ${String((9 + index) % 24).padStart(2, '0')}:10:00`,
    request_ip: `198.51.100.${index}`,
    param_ip: `203.0.113.${index}`,
    os: index % 2 === 0 ? 'android' : 'ios',
    csite: 'site',
    sl: 'sl',
    dedupe_hash: `dedupe-${index}`
  }
  return dictionary[prop] || `${prop}-${index}`
}

const columnStyle = (column: SkitColumn) => ({
  minWidth: `${column.minWidth || column.width || 110}px`
})

const isStatusColumn = (prop: string) =>
  prop === 'status' || prop.toLowerCase().includes('status') || prop.startsWith('is_')
const statusClass = (value: CellValue) => {
  const text = String(value)
  if (text.includes('待')) return 'label label-warning'
  if (text.includes('是') || text.includes('禁') || text.includes('拒')) return 'label label-danger'
  return 'label label-success'
}

const applySearch = async () => {
  keyword.value = keywordInput.value
  currentPage.value = 1
  await loadPageRows()
}

const resetSearch = async (message = true, reload = true) => {
  keywordInput.value = ''
  keyword.value = ''
  Object.keys(advancedModel).forEach((key) => delete advancedModel[key])
  currentPage.value = 1
  if (reload) await loadPageRows()
  if (message) ElMessage.success('已重置搜索')
}

const changePageSize = async (size: number) => {
  pageSizeMenuOpen.value = false
  if (pageSize.value === size && currentPage.value === 1) return
  pageSize.value = size
  currentPage.value = 1
  await loadPageRows()
}

const changePage = async (target: number) => {
  const nextPage = Math.min(Math.max(1, Math.floor(target)), totalPages.value)
  if (nextPage === currentPage.value) return
  currentPage.value = nextPage
  await loadPageRows()
}

const loadProfileModel = async () => {
  resetProfileModel()
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
  const managementScope = dramaMutationScope('删除目标租户短剧目录记录')
  if (!managementScope) return
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
      await deleteSkitAdminRecordList(ids, managementScope)
    } else if (ids.length === 1) {
      await deleteSkitAdminRecord(ids[0], managementScope)
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

const batchSetPublishStatus = async (status: '上架' | '下架') => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择短剧')
    return
  }
  const managementScope = dramaMutationScope('更新穿山甲短剧目录上架状态')
  if (!managementScope) return
  selectedRows.value.forEach((row) => {
    row.publishStatus = status
  })
  if (backendAvailable.value) {
    await Promise.all(
      selectedRows.value
        .map((row) => {
          const id = backendId(row)
          if (!id) return undefined
          return updateSkitAdminRecord({
            id,
            ...managementScope,
            pageKey: page.value.key,
            rowKey: String(row.__rowKey || ''),
            recordData: buildRecordData(row),
            status: deriveBackendStatus(row),
            sort: Number(row.__backendSort || 0)
          })
        })
        .filter((request): request is Promise<boolean> => Boolean(request))
    )
    await loadPageRows(false)
  }
  ElMessage.success(`${status}成功`)
}

const openDramaImport = () => {
  if (!dramaMutationScope('同步穿山甲 SDK 真实剧单')) return
  dramaImportText.value = ''
  dramaImportVisible.value = true
}

const importDramaCatalog = async () => {
  const managementScope = dramaMutationScope('同步穿山甲 SDK 真实剧单')
  if (!managementScope) return
  let payload: unknown
  try {
    payload = JSON.parse(dramaImportText.value)
  } catch {
    ElMessage.error('剧单 JSON 格式无效')
    return
  }
  const dramas = sdkCatalogItems(payload).map(normalizeSdkDrama).filter(Boolean) as TableRow[]
  if (!dramas.length) {
    ElMessage.error('未找到可用的 SDK 剧目')
    return
  }
  const existingResult = backendAvailable.value
    ? await getSkitAdminRecordPage({
        pageNo: 1,
        pageSize: 100,
        pageKey: page.value.key,
        ...buildDramaQueryScope(scopeModel.value)
      })
    : undefined
  const existingRows = existingResult
    ? existingResult.list.map((record) => mapBackendRecord(record))
    : tableRows.value
  const existing = new Map(
    existingRows
      .filter((row) => isPositiveInteger(row.pangleDramaId))
      .map((row) => [String(row.pangleDramaId), row])
  )
  if (backendAvailable.value) {
    const persistDrama = (drama: TableRow) => {
      const current = existing.get(String(drama.pangleDramaId))
      const recordData = buildRecordData({
        ...(current || {}),
        ...drama,
        publishStatus: current?.publishStatus || drama.publishStatus
      })
      const id = current ? backendId(current) : undefined
      if (id) {
        return updateSkitAdminRecord({
          id,
          ...managementScope,
          pageKey: page.value.key,
          rowKey: String(current?.__rowKey || `drama-${drama.pangleDramaId}`),
          recordData,
          status: deriveBackendStatus(recordData),
          sort: Number(current?.__backendSort || 0)
        })
      }
      return createSkitAdminRecord({
        ...managementScope,
        pageKey: page.value.key,
        rowKey: `drama-${drama.pangleDramaId}`,
        recordData,
        status: 0,
        sort: 0
      })
    }
    for (let start = 0; start < dramas.length; start += 5) {
      await Promise.all(dramas.slice(start, start + 5).map(persistDrama))
    }
    await loadPageRows(false)
  } else {
    tableRows.value = dramas
  }
  dramaImportVisible.value = false
  ElMessage.success(`已导入 ${dramas.length} 部短剧`)
}

const openEditor = (mode: 'add' | 'edit' | 'view', row?: TableRow) => {
  if (mode !== 'view' && !dramaMutationScope('维护穿山甲短剧目录元数据')) return
  if (mode === 'edit' && !row && selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条记录')
    return
  }
  editorMode.value = mode
  const target = row || selectedRows.value[0] || {}
  editingKey.value = String(target.__rowKey || '')
  Object.keys(editorModel).forEach((key) => delete editorModel[key])
  editableColumns.value.slice(0, 18).forEach((column) => {
    editorModel[column.prop] = target[column.prop] ?? ''
  })
  editorVisible.value = true
}

const saveEditor = async () => {
  const managementScope = dramaMutationScope('维护穿山甲短剧目录元数据')
  if (!managementScope) return
  if (editorMode.value === 'add') {
    if (backendAvailable.value) {
      const rowKey = `${page.value.key}-custom-${Date.now()}`
      const data = buildRecordData(editorModel)
      await createSkitAdminRecord({
        ...managementScope,
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
        (column.prop === 'id'
          ? tableRows.value.length + 1
          : valueFor(page.value.key, column.prop, 1))
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
            ...managementScope,
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
  changePage(target)
}

const saveProfile = async (section: string) => {
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
    await resetSearch(false, false)
    await loadProfileModel()
    currentPage.value = 1
    pageSize.value = 10
    pageSizeMenuOpen.value = false
    activeSectionIndex.value = 0
    advancedVisible.value = false
    columnMenuOpen.value = false
    exportMenuOpen.value = false
    tenantOptionsError.value = ''
    dramaPageError.value = ''
    if (isDramaPage.value) {
      await loadTenantOptions()
    }
    await loadPageRows()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.skit-fastadmin-page {
  min-height: calc(100vh - 100px);
  padding: 15px;
  font-size: 14px;
  line-height: 1.4286;
  color: var(--admin-text);
  background: var(--admin-page-bg);
}

.skit-panel {
  min-height: 172px;
  padding: 15px;
  color: var(--admin-text);
  background: var(--admin-surface);
  border-radius: 3px;
  box-shadow: none;
}

.tenant-scope-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--admin-border);
}

.tenant-scope-error {
  color: var(--el-color-danger);
}

.commonsearch-table {
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--admin-border);
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
    font-weight: 600;
    color: var(--admin-text);
  }
}

.form-control {
  width: 100%;
  height: 34px;
  padding: 6px 12px;
  font-size: 14px;
  color: var(--admin-text-secondary);
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-strong);
  border-radius: 0;
  outline: none;
  box-shadow: none;

  &:focus {
    border-color: var(--admin-primary);
  }
}

textarea.form-control {
  height: auto;
}

.drama-import-input {
  min-height: 300px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.45;
  resize: vertical;
}

.date-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16px minmax(0, 1fr);
  align-items: center;
  gap: 6px;

  span {
    margin: 0;
    color: var(--admin-text-secondary);
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

.profile-forms--tabs {
  display: block;
}

.config-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: -1px;
  border-bottom: 1px solid var(--admin-border-strong);
}

.config-tab {
  height: 38px;
  min-width: 110px;
  padding: 8px 15px;
  font-size: 14px;
  line-height: 20px;
  color: var(--admin-primary);
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: 3px 3px 0 0;

  &.active {
    color: var(--admin-text);
    cursor: default;
    background: var(--admin-surface);
    border-color: var(--admin-border-strong);
  }

  &:not(.active):hover {
    color: var(--admin-primary);
    background: var(--admin-surface-hover);
  }
}

.profile-section {
  padding: 12px;
  border: 1px solid var(--admin-border);

  h3 {
    margin: 0 0 12px;
    font-size: 15px;
    color: var(--admin-text);
  }
}

.profile-section--tab {
  min-height: 210px;
  border-top: 0;
  border-color: var(--admin-border-strong);
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
  height: 34px;
  min-width: 34px;
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.4286;
  color: var(--admin-text);
  white-space: nowrap;
  cursor: pointer;
  background: var(--admin-surface);
  border: 1px solid transparent;
  border-radius: 3px;
  align-items: center;
  justify-content: center;

  &.disabled,
  &:disabled {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.btn-default {
  background: var(--admin-surface);
  border-color: var(--admin-border-strong);
}

.btn-primary {
  color: var(--admin-active-text);
  background: var(--admin-primary-gradient);
  border-color: transparent;
}

.btn-success {
  color: var(--admin-active-text);
  background: var(--el-color-success);
  border-color: var(--el-color-success);
}

.btn-danger {
  color: var(--admin-active-text);
  background: var(--el-color-danger);
  border-color: var(--el-color-danger);
}

.btn-warning-light {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 13%, transparent);
  border-color: color-mix(in srgb, var(--el-color-warning) 46%, transparent);
}

.keep-open,
.export {
  position: relative;
}

.page-size-menu {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}

.dropdown-menu {
  position: absolute;
  top: 37px;
  right: 0;
  z-index: 10;
  min-width: 150px;
  padding: 6px 0;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-strong);
  border-radius: 4px;
  box-shadow: var(--admin-dropdown-shadow);
}

.column-menu {
  label {
    display: block;
    padding: 4px 12px;
    color: var(--admin-text);
    white-space: nowrap;
    cursor: pointer;
  }
}

.export-menu {
  button {
    display: block;
    width: 100%;
    padding: 5px 16px;
    color: var(--admin-text);
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
  }
}

.page-size-dropdown {
  right: auto;
  left: 0;
  min-width: 58px;

  button {
    display: block;
    width: 100%;
    padding: 5px 14px;
    color: var(--admin-text);
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;

    &:hover {
      background: var(--admin-surface-hover);
    }
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
  z-index: 2;
  padding: 8px;
  color: var(--admin-text);
  text-align: center;
  background: var(--admin-overlay);
  inset: 0 0 auto;
}

.table {
  width: 100%;
  min-width: 760px;
  margin-bottom: 0;
  color: var(--admin-text);
  background: var(--admin-surface);
  border-collapse: collapse;

  th,
  td {
    padding: 8px;
    font-size: 14px;
    color: var(--admin-text);
    white-space: nowrap;
    vertical-align: middle;
    border: 1px solid var(--admin-border);
  }

  th {
    font-weight: 700;
    background: var(--admin-surface-soft);
    border-bottom-width: 2px;
  }

  tbody tr:nth-of-type(odd) {
    background: color-mix(in srgb, var(--admin-surface-soft) 58%, transparent);
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
  margin-left: 6px;
  font-size: 12px;
  color: var(--admin-muted);
  content: '↕';
}

.no-record {
  height: 42px;
  color: var(--admin-text-secondary);
  text-align: center;
}

.btn-operate {
  display: inline-flex;
  height: 22px;
  min-width: 22px;
  padding: 0 4px;
  margin-right: 4px;
  line-height: 1;
  color: var(--admin-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 2px;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--admin-primary-soft);
  }

  span {
    line-height: 20px;
  }
}

.label {
  display: inline;
  padding: 0.2em 0.6em 0.3em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  color: var(--admin-active-text);
  white-space: nowrap;
  border-radius: 0.25em;
}

.label-success {
  background-color: var(--el-color-success);
}

.label-warning {
  background-color: var(--el-color-warning);
}

.label-danger {
  background-color: var(--el-color-danger);
}

.fixed-table-pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  color: var(--admin-text);
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
  color: var(--admin-text);
}

.page-btn {
  height: 34px;
  min-width: 34px;
  padding: 6px 12px;
  color: var(--admin-text-secondary);
  cursor: pointer;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-strong);

  &.active {
    color: var(--admin-active-text);
    background: var(--admin-primary-gradient);
    border-color: transparent;
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
  border: 1px solid var(--admin-border-strong);
}

@media (width <= 768px) {
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

<style scoped lang="scss">
.skit-fastadmin-page {
  min-height: calc(100vh - 100px);
  padding: 0;
  color: var(--admin-text);
  background: var(--admin-page-bg);
}

.skit-panel {
  min-height: 172px;
  padding: 20px;
  color: var(--admin-text);
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  box-shadow: var(--admin-shadow);
  backdrop-filter: blur(18px);
}

.commonsearch-table {
  padding: 16px;
  margin-bottom: 16px;
  background: var(--admin-surface-soft);
  border: 1px solid var(--admin-border);
  border-radius: 13px;
}

.commonsearch-item span,
.profile-section h3,
.fixed-table-pagination,
.column-menu label,
.export-menu button,
.page-size-dropdown button {
  color: var(--admin-text);
}

.form-control,
.page-size,
.pagination-jump {
  color: var(--admin-text);
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-strong);
  border-radius: 10px;
  box-shadow: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;

  &::placeholder {
    color: var(--admin-muted);
  }

  &:hover {
    border-color: var(--el-color-primary-light-3);
  }

  &:focus {
    border-color: var(--el-color-primary);
    box-shadow: var(--admin-focus-ring);
  }
}

.date-range span,
.no-record {
  color: var(--admin-text-secondary);
}

.config-tabs {
  gap: 5px;
  padding: 5px;
  margin-bottom: 12px;
  background: var(--admin-surface-soft);
  border: 1px solid var(--admin-border);
  border-radius: 12px;
}

.config-tab {
  color: var(--admin-text-secondary);
  border: 0;
  border-radius: 9px;

  &.active {
    color: var(--admin-primary);
    background: var(--admin-surface);
    border: 0;
    box-shadow: var(--admin-control-shadow);
  }

  &:not(.active):hover {
    color: var(--admin-primary);
    background: var(--admin-surface-hover);
  }
}

.profile-section,
.profile-section--tab {
  padding: 16px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 13px;
}

.fixed-table-toolbar {
  padding: 4px 0 8px;
}

.btn {
  height: 36px;
  color: var(--admin-text);
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-strong);
  border-radius: 10px;
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
}

.btn-default {
  color: var(--admin-text-secondary);
  background: var(--admin-surface);
  border-color: var(--admin-border-strong);

  &:hover {
    color: var(--admin-primary);
    background: var(--admin-primary-soft);
    border-color: var(--el-color-primary-light-5);
  }
}

.btn-primary {
  color: var(--admin-active-text);
  background: var(--admin-primary-gradient);
  border-color: transparent;
  box-shadow: var(--admin-primary-shadow);
}

.btn-success {
  color: var(--admin-active-text);
  background: var(--el-color-success);
  border-color: var(--el-color-success);
}

.btn-danger {
  color: var(--admin-active-text);
  background: var(--el-color-danger);
  border-color: var(--el-color-danger);
}

.btn-warning-light {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 13%, transparent);
  border-color: color-mix(in srgb, var(--el-color-warning) 46%, transparent);
}

.dropdown-menu {
  padding: 6px;
  color: var(--admin-text);
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  box-shadow: var(--admin-dropdown-shadow);
}

.column-menu label,
.export-menu button,
.page-size-dropdown button {
  border-radius: 8px;

  &:hover {
    color: var(--admin-primary);
    background: var(--admin-surface-hover);
  }
}

.fixed-table-container {
  overflow: hidden auto;
  border: 1px solid var(--admin-border);
  border-radius: 13px;
}

.fixed-table-loading {
  color: var(--admin-text);
  background: var(--admin-overlay);
  backdrop-filter: blur(3px);
}

.table {
  color: var(--admin-text);
  background: var(--admin-surface);

  th,
  td {
    padding: 11px 12px;
    color: var(--admin-text);
    border-color: var(--admin-border);
  }

  th {
    color: var(--admin-text-secondary);
    background: var(--admin-surface-soft);
  }

  tbody tr:nth-of-type(odd) {
    background: color-mix(in srgb, var(--admin-surface-soft) 58%, transparent);
  }

  tbody tr:hover {
    background: var(--admin-surface-hover);
  }
}

.sortable::after {
  color: var(--admin-muted);
}

.btn-operate {
  color: var(--admin-primary);
  border-radius: 7px;

  &:hover {
    background: var(--admin-primary-soft);
  }
}

.page-btn {
  color: var(--admin-text-secondary);
  background: var(--admin-surface);
  border-color: var(--admin-border);
  border-radius: 9px;

  &:hover:not(:disabled),
  &.active {
    color: var(--admin-active-text);
    background: var(--admin-primary-gradient);
    border-color: transparent;
  }
}

input[type='checkbox'] {
  accent-color: var(--el-color-primary);
}

@media (width <= 768px) {
  .skit-fastadmin-page {
    padding: 0;
  }

  .skit-panel {
    padding: 14px;
    border-radius: 13px;
  }
}
</style>
