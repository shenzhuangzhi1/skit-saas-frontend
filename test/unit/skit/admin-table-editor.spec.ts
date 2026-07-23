import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/views/skit/admin/AdminTable.vue'), 'utf8')

describe('admin table editor', () => {
  it('preserves valid zero values when an existing row is opened', () => {
    expect(source).toContain("editorModel[column.prop] = target[column.prop] ?? ''")
    expect(source).not.toContain("editorModel[column.prop] = target[column.prop] || ''")
  })

  it('never replaces a failed management query with fabricated rows', () => {
    expect(source).toContain('真实数据加载失败，请重试')
    expect(source).not.toContain('tableRows.value = buildRows()')
    expect(source).not.toContain('Number(result.total || 0)')
    expect(source).not.toContain('(result.list || [])')
    expect(source).not.toContain('record.recordData || {}')
    expect(source).not.toContain('record.rowKey || `${record.pageKey}-${record.id}`')
  })

  it('keeps load failures distinct from a truthful empty result', () => {
    expect(source).toContain('const dataLoadError = computed')
    expect(source).toContain('v-if="dataLoadError" class="table-load-error"')
    expect(source).toContain('v-if="!dataLoadError" class="fixed-table-body"')
    expect(source).toContain('v-if="hasTable && !dataLoadError" class="fixed-table-pagination"')
    expect(source).toContain("if (loaded) ElMessage.success('刷新成功')")
  })

  it('does not optimistically mutate batch status before the server accepts it', () => {
    expect(source).toContain("...('status' in row ? { status } : {})")
    expect(source).toContain('buildRecordData({ ...row, publishStatus: status })')
    expect(source).not.toContain('row.status = status')
    expect(source).not.toContain('row.payment_status_text =')
    expect(source).not.toContain('row.publishStatus = status')
  })

  it('does not optimistically mutate an edited row before the server accepts it', () => {
    expect(source).toContain('buildRecordData({ ...row, ...editorModel })')
    expect(source).not.toContain('Object.assign(row, editorModel)')
  })

  it('maps rejected reviews before generic pending review text', () => {
    const rejected = source.indexOf("if (text.includes('禁') || text.includes('拒')) return 2")
    const pending = source.indexOf("if (text.includes('待') || text === '审核中') return 1")
    expect(rejected).toBeGreaterThan(-1)
    expect(pending).toBeGreaterThan(rejected)
  })
})
