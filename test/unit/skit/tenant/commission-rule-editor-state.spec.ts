import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, reactive, ref, watch } from 'vue'
import CommissionRuleEditor from '@/views/skit/tenant/CommissionRuleEditor.vue'
import { formatUtc8SnapshotDateTime } from '@/views/skit/tenant/workspaceModel'

const {
  getCommissionPlanCurrent,
  getCommissionPlanHistory,
  previewCommissionPlan,
  publishCommissionPlan
} = vi.hoisted(() => ({
  getCommissionPlanCurrent: vi.fn(),
  getCommissionPlanHistory: vi.fn(),
  previewCommissionPlan: vi.fn(),
  publishCommissionPlan: vi.fn()
}))

vi.mock('@/api/skit/tenant', () => ({
  getCommissionPlanCurrent,
  getCommissionPlanHistory,
  previewCommissionPlan,
  publishCommissionPlan
}))

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const responseTimestamp = 1_753_228_800_000

const configuredPlan = {
  tenantId: 23,
  asOf: responseTimestamp,
  timezone: 'UTC+8' as const,
  id: 71,
  version: 7,
  status: 'ACTIVE' as const,
  publishedAt: responseTimestamp,
  totalMemberRateBps: 6000,
  agentRateBps: 4000,
  rules: [{ levelNo: 0, rateBps: 6000 }]
}

const unconfiguredPlan = {
  ...configuredPlan,
  id: null,
  version: 0,
  status: 'UNCONFIGURED' as const,
  publishedAt: null,
  totalMemberRateBps: 0,
  agentRateBps: 10000,
  rules: []
}

const previewResponse = {
  tenantId: 23,
  asOf: responseTimestamp,
  timezone: 'UTC+8' as const,
  currency: 'CNY',
  amountScale: 2,
  grossAmount: '100.00',
  grossAmountUnits: '10000',
  totalMemberRateBps: 6000,
  memberTotal: '60.00',
  memberTotalUnits: '6000',
  agentRateBps: 4000,
  agentAmount: '40.00',
  agentAmountUnits: '4000',
  allocations: [{ levelNo: 0, rateBps: 6000, amount: '60.00', amountUnits: '6000' }]
}

const historyResponse = (
  override: Partial<{
    tenantId: number
    asOf: number
    timezone: 'UTC+8'
    pageNo: number
    pageSize: number
    list: (typeof configuredPlan)[]
    total: number
  }> = {}
) => ({
  tenantId: 23,
  asOf: responseTimestamp,
  timezone: 'UTC+8' as const,
  pageNo: 1,
  pageSize: 10,
  list: [] as (typeof configuredPlan)[],
  total: 0,
  ...override
})

const confirm = vi.fn(() => Promise.resolve())
const warning = vi.fn()

const stubs = {
  ContentWrap: { template: '<section><slot /></section>' },
  CommissionPreview: { template: '<div data-testid="commission-preview" />' },
  Icon: true,
  Pagination: true,
  'el-alert': {
    props: ['title'],
    template: '<div role="alert">{{ title }}<slot /></div>'
  },
  'el-skeleton': { template: '<div data-testid="commission-loading" />' },
  'el-descriptions': { template: '<dl data-testid="commission-plan"><slot /></dl>' },
  'el-descriptions-item': {
    props: ['label'],
    template: '<div><dt>{{ label }}</dt><dd><slot /></dd></div>'
  },
  'el-table': {
    props: ['data'],
    template: '<div data-testid="commission-rule-count">{{ data.length }}</div>'
  },
  'el-table-column': true,
  'el-tag': { template: '<span><slot /></span>' },
  'el-input': true,
  'el-input-number': true,
  'el-form': { template: '<form><slot /></form>' },
  'el-form-item': { template: '<label><slot /></label>' },
  'el-button': {
    props: ['disabled', 'loading'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" :data-loading="String(Boolean(loading))" @click="$emit(\'click\')"><slot /></button>'
  }
}

const mountEditor = () =>
  mount(CommissionRuleEditor, {
    props: { target: { kind: 'platform' as const, tenantId: 23 } },
    global: {
      stubs,
      config: {
        errorHandler: () => undefined
      }
    }
  })

const findButton = (wrapper: VueWrapper, label: string) =>
  wrapper.findAll('button').find((button) => button.text().includes(label))

beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('useMessage', () => ({
    confirm,
    success: vi.fn(),
    warning
  }))
})

afterAll(() => {
  vi.unstubAllGlobals()
})

beforeEach(() => {
  getCommissionPlanCurrent.mockReset()
  getCommissionPlanHistory.mockReset()
  previewCommissionPlan.mockReset()
  publishCommissionPlan.mockReset()
  confirm.mockClear()
  warning.mockClear()
  getCommissionPlanHistory.mockImplementation(
    (target: { tenantId: number }, query: { pageNo: number; pageSize: number }) =>
      Promise.resolve(
        historyResponse({
          tenantId: target.tenantId,
          pageNo: query.pageNo,
          pageSize: query.pageSize
        })
      )
  )
})

describe('CommissionRuleEditor real-data state', () => {
  it('clears the previous tenant plan, draft, and preview as soon as a new load starts', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    previewCommissionPlan.mockResolvedValueOnce(previewResponse)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      currentPlan?: typeof configuredPlan
      rules: Array<{ levelNo: number; rateBps: number }>
      preview?: typeof previewResponse
      previewForm: { currency: string; amountUnits?: number; amountScale?: number }
    }
    Object.assign(vm.previewForm, { currency: 'CNY', amountUnits: 10000, amountScale: 2 })
    await findButton(wrapper, '精确预览')?.trigger('click')
    await flushPromises()
    expect(vm.preview).toEqual(previewResponse)

    const nextPlan = deferred<typeof configuredPlan>()
    const nextHistory = deferred<ReturnType<typeof historyResponse>>()
    getCommissionPlanCurrent.mockReturnValueOnce(nextPlan.promise)
    getCommissionPlanHistory.mockReturnValueOnce(nextHistory.promise)

    await wrapper.setProps({ target: { kind: 'platform', tenantId: 24 } })
    await wrapper.vm.$nextTick()

    expect(vm.currentPlan).toBeUndefined()
    expect(vm.rules).toEqual([])
    expect(vm.preview).toBeUndefined()

    nextPlan.resolve({ ...configuredPlan, tenantId: 24, version: 8 })
    nextHistory.resolve(historyResponse({ tenantId: 24 }))
    await flushPromises()
  })

  it('ignores an old tenant preview response that arrives after the tenant changes', async () => {
    const oldPreview = deferred<typeof previewResponse>()
    getCommissionPlanCurrent
      .mockResolvedValueOnce(configuredPlan)
      .mockResolvedValueOnce({ ...configuredPlan, tenantId: 24, version: 8 })
    previewCommissionPlan.mockReturnValueOnce(oldPreview.promise)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      preview?: typeof previewResponse
      previewForm: { currency: string; amountUnits?: number; amountScale?: number }
    }
    Object.assign(vm.previewForm, { currency: 'CNY', amountUnits: 10000, amountScale: 2 })
    await findButton(wrapper, '精确预览')?.trigger('click')
    await wrapper.setProps({ target: { kind: 'platform', tenantId: 24 } })
    await flushPromises()

    oldPreview.resolve(previewResponse)
    await flushPromises()

    expect(vm.preview).toBeUndefined()
  })

  it('rejects a cross-tenant preview instead of displaying unverified allocation data', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    previewCommissionPlan.mockResolvedValueOnce({ ...previewResponse, tenantId: 24 })

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      preview?: typeof previewResponse
      previewForm: { currency: string; amountUnits?: number; amountScale?: number }
    }
    Object.assign(vm.previewForm, { currency: 'CNY', amountUnits: 10000, amountScale: 2 })

    await findButton(wrapper, '精确预览')?.trigger('click')
    await flushPromises()

    expect(vm.preview).toBeUndefined()
    expect(wrapper.text()).toContain('分成预览失败')
    expect(wrapper.find('[data-testid="commission-preview"]').exists()).toBe(false)
  })

  it('rejects an ISO-string preview timestamp instead of accepting a mismatched API shape', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    previewCommissionPlan.mockResolvedValueOnce({
      ...previewResponse,
      asOf: '2026-07-23T00:00:00Z'
    })

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      preview?: typeof previewResponse
      previewForm: { currency: string; amountUnits?: number; amountScale?: number }
    }
    Object.assign(vm.previewForm, { currency: 'CNY', amountUnits: 10000, amountScale: 2 })

    await findButton(wrapper, '精确预览')?.trigger('click')
    await flushPromises()

    expect(vm.preview).toBeUndefined()
    expect(wrapper.text()).toContain('分成预览失败')
  })

  it('invalidates a displayed preview as soon as any preview input changes', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    previewCommissionPlan.mockResolvedValueOnce(previewResponse)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      preview?: typeof previewResponse
      previewForm: { currency: string; amountUnits?: number; amountScale?: number }
    }
    Object.assign(vm.previewForm, { currency: 'CNY', amountUnits: 10000, amountScale: 2 })
    await findButton(wrapper, '精确预览')?.trigger('click')
    await flushPromises()
    expect(vm.preview).toEqual(previewResponse)

    vm.previewForm.amountUnits = 20000
    await wrapper.vm.$nextTick()

    expect(vm.preview).toBeUndefined()
    expect(wrapper.find('[data-testid="commission-preview"]').exists()).toBe(false)
  })

  it('ignores a preview response when its amount changes while the request is in flight', async () => {
    const pendingPreview = deferred<typeof previewResponse>()
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    previewCommissionPlan.mockReturnValueOnce(pendingPreview.promise)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      preview?: typeof previewResponse
      previewForm: { currency: string; amountUnits?: number; amountScale?: number }
    }
    Object.assign(vm.previewForm, { currency: 'CNY', amountUnits: 10000, amountScale: 2 })
    await findButton(wrapper, '精确预览')?.trigger('click')

    vm.previewForm.amountUnits = 20000
    pendingPreview.resolve(previewResponse)
    await flushPromises()

    expect(vm.preview).toBeUndefined()
  })

  it('shows an explicit retry state after load failure without fake plan values or publishing', async () => {
    getCommissionPlanCurrent.mockRejectedValueOnce(new Error('服务暂时不可用'))

    const wrapper = mountEditor()
    await flushPromises()

    expect(wrapper.text()).toContain('分成规则加载失败')
    expect(wrapper.text()).toContain('请稍后重试')
    expect(wrapper.text()).not.toContain('v0')
    expect(wrapper.text()).not.toContain('0.00%')
    expect(wrapper.text()).not.toContain('100.00%')
    expect(wrapper.find('[data-testid="commission-plan"]').exists()).toBe(false)
    expect(findButton(wrapper, '发布新版本')?.attributes('disabled')).toBeDefined()

    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    await findButton(wrapper, '重新加载')?.trigger('click')
    await flushPromises()

    expect(getCommissionPlanCurrent).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('分成规则加载失败')
    expect(wrapper.find('[data-testid="commission-plan"]').exists()).toBe(true)
  })

  it('rejects a malformed plan instead of formatting missing rates as zero', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce({
      ...configuredPlan,
      totalMemberRateBps: undefined
    })

    const wrapper = mountEditor()
    await flushPromises()

    expect(wrapper.text()).toContain('分成规则加载失败')
    expect(wrapper.find('[data-testid="commission-plan"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('0.00%')
  })

  it('rejects ISO-string plan timestamps because the backend contract is epoch milliseconds', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce({
      ...configuredPlan,
      asOf: '2026-07-23T00:00:00Z',
      publishedAt: '2026-07-23T00:00:00Z'
    })

    const wrapper = mountEditor()
    await flushPromises()

    expect(wrapper.text()).toContain('分成规则加载失败')
    expect(wrapper.find('[data-testid="commission-plan"]').exists()).toBe(false)
  })

  it('keeps a server-returned unconfigured plan empty instead of fabricating a 100% rule', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(unconfiguredPlan)

    const wrapper = mountEditor()
    await flushPromises()

    expect(wrapper.get('[data-testid="commission-rule-count"]').text()).toBe('0')
    const vm = wrapper.vm as unknown as {
      rules: Array<{ levelNo: number; rateBps: number }>
    }
    expect(vm.rules).toEqual([])
  })

  it('clears stale history and shows a retry state when history pagination fails', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    getCommissionPlanHistory.mockResolvedValueOnce(
      historyResponse({ list: [configuredPlan], total: 1 })
    )

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      history: { list: (typeof configuredPlan)[]; total: number }
      historyError: string
      loadHistory: () => Promise<void>
    }
    expect(vm.history.list).toHaveLength(1)

    getCommissionPlanHistory.mockRejectedValueOnce(new Error('历史接口不可用'))
    await expect(vm.loadHistory()).resolves.toBeUndefined()
    await flushPromises()

    expect(vm.history.list).toEqual([])
    expect(vm.history.total).toBe(0)
    expect(vm.historyError).toContain('历史接口不可用')
    expect(wrapper.text()).toContain('发布历史加载失败')
  })

  it('rejects an empty cross-tenant history page instead of treating it as real empty history', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    getCommissionPlanHistory.mockResolvedValueOnce(historyResponse({ tenantId: 24 }))

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      history: { list: (typeof configuredPlan)[]; total: number }
      historyError: string
    }

    expect(vm.history.list).toEqual([])
    expect(vm.history.total).toBe(0)
    expect(vm.historyError).toContain('分成历史')
    expect(wrapper.text()).toContain('发布历史加载失败')
  })

  it('rejects an ISO-string history snapshot timestamp instead of treating it as real history', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    getCommissionPlanHistory.mockResolvedValueOnce({
      ...historyResponse(),
      asOf: '2026-07-23T00:00:00Z'
    })

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      history: { list: (typeof configuredPlan)[]; total: number }
      historyError: string
    }

    expect(vm.history.list).toEqual([])
    expect(vm.historyError).toContain('分成历史')
    expect(wrapper.text()).toContain('发布历史加载失败')
  })

  it('does not let an older history page overwrite a newer page response', async () => {
    const pageTwo = deferred<ReturnType<typeof historyResponse>>()
    const pageThree = deferred<ReturnType<typeof historyResponse>>()
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      historyQuery: { pageNo: number; pageSize: number }
      history: { list: (typeof configuredPlan)[]; total: number }
      loadHistory: () => Promise<void>
    }
    getCommissionPlanHistory
      .mockReturnValueOnce(pageTwo.promise)
      .mockReturnValueOnce(pageThree.promise)

    vm.historyQuery.pageNo = 2
    const oldLoad = vm.loadHistory()
    vm.historyQuery.pageNo = 3
    const newLoad = vm.loadHistory()

    pageThree.resolve(
      historyResponse({
        pageNo: 3,
        list: [{ ...configuredPlan, version: 9 }],
        total: 3
      })
    )
    await newLoad
    pageTwo.resolve(
      historyResponse({
        pageNo: 2,
        list: [{ ...configuredPlan, version: 8 }],
        total: 3
      })
    )
    await oldLoad

    expect(vm.history.list[0].version).toBe(9)
  })

  it('reuses the first history snapshot as a formatted GET parameter on later pages', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      historyQuery: { pageNo: number; pageSize: number }
      loadHistory: () => Promise<void>
    }

    vm.historyQuery.pageNo = 2
    await vm.loadHistory()

    expect(getCommissionPlanHistory).toHaveBeenLastCalledWith(
      { kind: 'platform', tenantId: 23 },
      {
        pageNo: 2,
        pageSize: 10,
        asOf: formatUtc8SnapshotDateTime(responseTimestamp),
        timezone: 'UTC+8'
      }
    )
  })

  it('starts a user-added level at zero basis points', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(unconfiguredPlan)

    const wrapper = mountEditor()
    await flushPromises()
    await findButton(wrapper, '新增层级')?.trigger('click')

    const vm = wrapper.vm as unknown as {
      rules: Array<{ levelNo: number; rateBps: number }>
    }
    expect(vm.rules).toEqual([{ levelNo: 0, rateBps: 0 }])
  })

  it('requires a user-entered preview amount instead of showing a fabricated example amount', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      previewForm: { currency: string; amountUnits?: number; amountScale?: number }
    }

    expect(vm.previewForm.amountUnits).toBeUndefined()
    await findButton(wrapper, '精确预览')?.trigger('click')
    await flushPromises()

    expect(previewCommissionPlan).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledWith('请输入预览金额最小单位')
  })

  it('refuses to publish when no server plan version is loaded', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      currentPlan?: typeof configuredPlan
      rules: Array<{ levelNo: number; rateBps: number }>
      reason: string
    }
    vm.currentPlan = undefined
    vm.rules = [{ levelNo: 0, rateBps: 6000 }]
    vm.reason = '测试缺失服务端版本时必须拒绝发布'
    await wrapper.vm.$nextTick()

    await findButton(wrapper, '发布新版本')?.trigger('click')
    await flushPromises()

    expect(publishCommissionPlan).not.toHaveBeenCalled()
    expect(confirm).not.toHaveBeenCalled()
  })

  it('publishes with the exact version returned by the server', async () => {
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan).mockResolvedValueOnce({
      ...configuredPlan,
      version: 8
    })
    publishCommissionPlan.mockResolvedValueOnce(undefined)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as { reason: string }
    vm.reason = '将本人分成比例调整为当前审核通过的比例'
    await wrapper.vm.$nextTick()

    await findButton(wrapper, '发布新版本')?.trigger('click')
    await flushPromises()

    expect(confirm).toHaveBeenCalledWith(
      '将基于当前版本 v7 发布新规则。历史规则不会被覆盖，确认继续吗？',
      '发布分成规则'
    )
    expect(publishCommissionPlan).toHaveBeenCalledWith(
      { kind: 'platform', tenantId: 23 },
      {
        expectedVersion: 7,
        rules: [{ levelNo: 0, rateBps: 6000 }],
        reason: '将本人分成比例调整为当前审核通过的比例'
      }
    )
  })

  it('cancels an old tenant publish intent when the tenant changes during confirmation', async () => {
    const pendingConfirmation = deferred<void>()
    getCommissionPlanCurrent
      .mockResolvedValueOnce(configuredPlan)
      .mockResolvedValueOnce({ ...configuredPlan, tenantId: 24, version: 8 })
    confirm.mockReturnValueOnce(pendingConfirmation.promise)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as { reason: string }
    vm.reason = '准备发布旧租户规则但尚未完成二次确认'
    await wrapper.vm.$nextTick()

    await findButton(wrapper, '发布新版本')?.trigger('click')
    await wrapper.setProps({ target: { kind: 'platform', tenantId: 24 } })
    await flushPromises()
    pendingConfirmation.resolve()
    await flushPromises()

    expect(publishCommissionPlan).not.toHaveBeenCalled()
  })

  it('cancels publishing when rules change after the user opens confirmation', async () => {
    const pendingConfirmation = deferred<void>()
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    confirm.mockReturnValueOnce(pendingConfirmation.promise)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      reason: string
      rules: Array<{ levelNo: number; rateBps: number }>
    }
    vm.reason = '准备发布但会在确认期间继续修改当前分成规则'
    await wrapper.vm.$nextTick()

    await findButton(wrapper, '发布新版本')?.trigger('click')
    vm.rules[0].rateBps = 5000
    pendingConfirmation.resolve()
    await flushPromises()

    expect(publishCommissionPlan).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledWith('分成规则已变化，请重新确认后发布')
  })

  it('cancels publishing when the reason changes after confirmation opens', async () => {
    const pendingConfirmation = deferred<void>()
    getCommissionPlanCurrent.mockResolvedValueOnce(configuredPlan)
    confirm.mockReturnValueOnce(pendingConfirmation.promise)

    const wrapper = mountEditor()
    await flushPromises()
    const vm = wrapper.vm as unknown as { reason: string }
    vm.reason = '准备发布并等待当前分成规则的二次确认'
    await wrapper.vm.$nextTick()

    await findButton(wrapper, '发布新版本')?.trigger('click')
    vm.reason = '确认窗口打开后修改为另一条发布原因'
    pendingConfirmation.resolve()
    await flushPromises()

    expect(publishCommissionPlan).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledWith('发布原因已变化，请重新确认后发布')
  })
})
