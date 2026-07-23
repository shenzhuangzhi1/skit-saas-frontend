import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReportingEditor from '@/views/skit/tenant/ReportingEditor.vue'

const { getTenantReportingConfiguration, saveTenantReportingConfiguration } = vi.hoisted(() => ({
  getTenantReportingConfiguration: vi.fn(),
  saveTenantReportingConfiguration: vi.fn()
}))

vi.mock('@/api/skit/tenant', () => ({
  getTenantReportingConfiguration,
  saveTenantReportingConfiguration
}))

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const reportingConfiguration = (tenantId: number, appId: string) => ({
  tenantId,
  adAccountId: tenantId * 10,
  appId,
  placementId: `placement-${tenantId}`,
  reportTimezone: 'UTC+8' as const,
  currency: 'CNY',
  amountScale: 2,
  adFormat: 'rewarded_video' as const,
  credentialConfigured: true,
  credentialVersion: 3,
  permissionVerifiedAt: null
})

const stubs = {
  ContentWrap: { template: '<section><slot /></section>' },
  AsyncState: { template: '<div><slot /></div>' },
  InputPassword: true,
  'el-form': { template: '<form><slot /></form>' },
  'el-form-item': { template: '<label><slot /></label>' },
  'el-row': { template: '<div><slot /></div>' },
  'el-col': { template: '<div><slot /></div>' },
  'el-input': true,
  'el-input-number': true,
  'el-select': { template: '<div><slot /></div>' },
  'el-option': true,
  'el-tag': { template: '<span><slot /></span>' },
  'el-button': { template: '<button><slot /></button>' }
}

beforeEach(() => {
  getTenantReportingConfiguration.mockReset()
  saveTenantReportingConfiguration.mockReset()
})

describe('ReportingEditor request boundaries', () => {
  it('does not let an old tenant save response overwrite the newly selected tenant', async () => {
    const oldSave = deferred<ReturnType<typeof reportingConfiguration>>()
    getTenantReportingConfiguration
      .mockResolvedValueOnce(reportingConfiguration(23, 'tenant-a-app'))
      .mockResolvedValueOnce(reportingConfiguration(24, 'tenant-b-app'))
    saveTenantReportingConfiguration.mockReturnValueOnce(oldSave.promise)

    const wrapper = mount(ReportingEditor, {
      props: { target: { kind: 'platform' as const, tenantId: 23 } },
      global: { stubs }
    })
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      form?: ReturnType<typeof reportingConfiguration> & {
        publisherKey: string
        reason: string
      }
      save: () => Promise<void>
    }
    if (!vm.form) throw new Error('expected tenant A form')
    vm.form.reason = '保存租户 A 的官方收益报表配置'

    const savePromise = vm.save()
    expect(saveTenantReportingConfiguration).toHaveBeenCalledWith(
      { kind: 'platform', tenantId: 23 },
      expect.any(Object)
    )

    await wrapper.setProps({ target: { kind: 'platform', tenantId: 24 } })
    await flushPromises()
    expect(vm.form?.appId).toBe('tenant-b-app')

    oldSave.resolve(reportingConfiguration(24, 'stale-save-response'))
    await savePromise
    await flushPromises()

    expect(vm.form?.appId).toBe('tenant-b-app')
  })

  it('preserves edits made while a same-tenant save request is in flight', async () => {
    const pendingSave = deferred<ReturnType<typeof reportingConfiguration>>()
    getTenantReportingConfiguration.mockResolvedValueOnce(
      reportingConfiguration(23, 'tenant-a-app')
    )
    saveTenantReportingConfiguration.mockReturnValueOnce(pendingSave.promise)

    const wrapper = mount(ReportingEditor, {
      props: { target: { kind: 'platform' as const, tenantId: 23 } },
      global: { stubs }
    })
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      form?: ReturnType<typeof reportingConfiguration> & {
        publisherKey: string
        reason: string
      }
      save: () => Promise<void>
    }
    if (!vm.form) throw new Error('expected reporting form')
    vm.form.reason = '保存当前租户的官方收益报表配置'

    const savePromise = vm.save()
    vm.form.currency = 'USD'
    vm.form.reason = '请求期间继续编辑且必须保留的新变更原因'
    pendingSave.resolve(reportingConfiguration(23, 'tenant-a-app'))
    await savePromise
    await flushPromises()

    expect(vm.form.currency).toBe('USD')
    expect(vm.form.reason).toBe('请求期间继续编辑且必须保留的新变更原因')
  })

  it('does not strand the saving state when a second click has invalid input', async () => {
    const pendingSave = deferred<ReturnType<typeof reportingConfiguration>>()
    getTenantReportingConfiguration.mockResolvedValueOnce(
      reportingConfiguration(23, 'tenant-a-app')
    )
    saveTenantReportingConfiguration.mockReturnValueOnce(pendingSave.promise)

    const wrapper = mount(ReportingEditor, {
      props: { target: { kind: 'platform' as const, tenantId: 23 } },
      global: { stubs }
    })
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      form?: ReturnType<typeof reportingConfiguration> & {
        publisherKey: string
        reason: string
      }
      saving: boolean
      save: () => Promise<void>
    }
    if (!vm.form) throw new Error('expected reporting form')
    vm.form.reason = '保存当前租户的官方收益报表配置'

    const firstSave = vm.save()
    expect(vm.saving).toBe(true)
    vm.form.reason = ''
    await vm.save()
    expect(saveTenantReportingConfiguration).toHaveBeenCalledTimes(1)

    pendingSave.resolve(reportingConfiguration(23, 'server-confirmed-app'))
    await firstSave
    await flushPromises()

    expect(vm.saving).toBe(false)
    expect(vm.form?.appId).toBe('tenant-a-app')
    expect(vm.form?.reason).toBe('')
  })
})
