import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/views/skit/admin/AdminTable.vue'), 'utf8')

describe('admin table release-quality UI', () => {
  it('introduces every management page with its configured context', () => {
    expect(source).toContain('class="admin-page-header"')
    expect(source).toContain('{{ page.title }}')
    expect(source).toContain('{{ page.description }}')
    expect(source).toContain('{{ page.parent ||')
  })

  it('uses native disabled behavior for selection-dependent actions', () => {
    expect(source).toContain(':disabled="selectedRows.length !== 1"')
    expect(source).toContain(':disabled="selectedRows.length === 0"')
  })

  it('names icon-only toolbar controls and table selections', () => {
    expect(source).toContain('aria-label="刷新数据"')
    expect(source).toContain(":aria-label=\"advancedVisible ? '收起搜索条件' : '打开搜索条件'\"")
    expect(source).toContain('aria-label="搜索当前页面"')
    expect(source).toContain('aria-label="选择当前页全部记录"')
    expect(source).toContain(':aria-label="`选择记录 ${row.__rowKey}`"')
  })

  it('exposes disclosure state and the current page size', () => {
    expect(source).toContain(':aria-expanded="advancedVisible"')
    expect(source).toContain(':aria-expanded="columnMenuOpen"')
    expect(source).toContain(':aria-expanded="exportMenuOpen"')
    expect(source).toContain(':aria-expanded="pageSizeMenuOpen"')
    expect(source).toContain(':aria-label="`选择每页显示数量，当前 ${pageSize} 条`"')
  })

  it('names free-form search and pagination inputs', () => {
    expect(source).toContain('aria-label="搜索当前页面记录"')
    expect(source).toContain('aria-label="输入目标页码"')
  })

  it('exposes partial page selection as a mixed checkbox state', () => {
    expect(source).toContain(':indeterminate="pageSelectionIndeterminate"')
    expect(source).toContain(
      `:aria-checked="pageSelectionIndeterminate ? 'mixed' : allPageSelected"`
    )
    expect(source).toContain('const pageSelectionIndeterminate = computed')
  })
})
