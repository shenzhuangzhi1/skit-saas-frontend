import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref, watch } from 'vue'
import AppBuildMaterialEditor from '@/views/skit/tenant/AppBuildMaterialEditor.vue'
import AppReleaseEditor from '@/views/skit/tenant/AppReleaseEditor.vue'

const {
  getTenantAppBuildMaterial,
  getTenantAppReleaseProfile,
  updateTenantAppBuildMaterial,
  updateTenantAppReleaseProfile
} = vi.hoisted(() => ({
  getTenantAppBuildMaterial: vi.fn(),
  getTenantAppReleaseProfile: vi.fn(),
  updateTenantAppBuildMaterial: vi.fn(),
  updateTenantAppReleaseProfile: vi.fn()
}))

vi.mock('@/api/skit/tenant', () => ({
  getTenantAppBuildMaterial,
  getTenantAppReleaseProfile,
  updateTenantAppBuildMaterial,
  updateTenantAppReleaseProfile
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

const buildMaterial = {
  tenantId: 23,
  apiBaseUrl: 'https://api.example.com',
  appName: '示例短剧',
  nativeVersionCode: 7,
  nativeVersionName: '2.3.0',
  runtimeReleaseNo: 4,
  materialVersion: 3,
  appReleaseProfileConfigured: true,
  takuAppKeyConfigured: true,
  takuAccountConfigured: true,
  pangleSettingsConfigured: true,
  signingConfigured: true
}

const releaseProfile = {
  tenantId: 23,
  profileCode: 'tenant-23',
  channel: 'production',
  minNativeVersion: '2.3.0',
  hotVersion: '2.3.1',
  hotBundleUrl: 'https://updates.example.com/2.3.1.zip',
  hotBundleSha256: 'a'.repeat(64),
  hotReleaseNo: 5,
  hotManifestSignature: 'signed-manifest',
  nativeVersion: '2.3.0',
  nativePackage: 'com.example.skit',
  nativeProtocolVersion: 1,
  runtimeUpdatePublicKey: 'A'.repeat(128),
  runtimeUpdateKeyFingerprint: 'fingerprint',
  status: 0
}

const validateForm = vi.fn(() => Promise.resolve(true))

const stubs = {
  'el-alert': {
    props: ['title'],
    template: '<div class="alert">{{ title }}<slot name="title" /><slot /></div>'
  },
  'el-skeleton': { template: '<div data-testid="editor-loading" />' },
  'el-form': {
    props: ['model'],
    methods: {
      validate() {
        return validateForm()
      }
    },
    template:
      '<form data-testid="editor-form"><output data-testid="loaded-marker">{{ model.appName || model.profileCode }}</output><slot /></form>'
  },
  'el-form-item': { template: '<div><slot /></div>' },
  'el-input': {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template:
      '<textarea :data-placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  'el-input-number': true,
  'el-select': { template: '<div><slot /></div>' },
  'el-option': true,
  'el-radio-group': { template: '<div><slot /></div>' },
  'el-radio': { template: '<span><slot /></span>' },
  'el-divider': { template: '<div><slot /></div>' },
  'el-tag': { template: '<span><slot /></span>' },
  'el-button': {
    props: ['disabled', 'loading'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" :data-loading="String(Boolean(loading))" @click="$emit(\'click\')"><slot /></button>'
  }
}

const mountEditor = (component: typeof AppBuildMaterialEditor | typeof AppReleaseEditor) =>
  mount(component, {
    props: { tenantId: 23 },
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
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('useMessage', () => ({
    success: vi.fn(),
    warning: vi.fn()
  }))
})

afterAll(() => {
  vi.unstubAllGlobals()
})

beforeEach(() => {
  getTenantAppBuildMaterial.mockReset()
  getTenantAppReleaseProfile.mockReset()
  updateTenantAppBuildMaterial.mockReset()
  updateTenantAppReleaseProfile.mockReset()
  validateForm.mockReset()
  validateForm.mockResolvedValue(true)
})

describe.each([
  {
    name: '构建资料编辑器',
    component: AppBuildMaterialEditor,
    load: getTenantAppBuildMaterial,
    save: updateTenantAppBuildMaterial,
    response: buildMaterial,
    markerKey: 'appName',
    errorTitle: '构建资料加载失败'
  },
  {
    name: '发布档案编辑器',
    component: AppReleaseEditor,
    load: getTenantAppReleaseProfile,
    save: updateTenantAppReleaseProfile,
    response: releaseProfile,
    markerKey: 'profileCode',
    errorTitle: '发布档案加载失败'
  }
])('$name', ({ name, component, load, save, response, markerKey, errorTitle }) => {
  it('加载完成前隐藏表单，成功后才显示表单', async () => {
    const request = deferred<typeof response>()
    load.mockReturnValueOnce(request.promise)

    const wrapper = mountEditor(component)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="editor-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(false)

    request.resolve(response)
    await flushPromises()

    expect(wrapper.find('[data-testid="editor-loading"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(true)
  })

  it('加载失败时显示明确错误且重试成功前不显示表单', async () => {
    load.mockRejectedValueOnce(new Error('服务暂时不可用')).mockResolvedValueOnce(response)

    const wrapper = mountEditor(component)
    await flushPromises()

    expect(wrapper.text()).toContain(errorTitle)
    expect(wrapper.text()).toContain('请稍后重试')
    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(false)

    const retryButton = findButton(wrapper, '重新加载')
    expect(retryButton).toBeDefined()

    await retryButton?.trigger('click')
    await flushPromises()

    expect(load).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain(errorTitle)
    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(true)
  })

  it('代理商快速切换时忽略较晚返回的旧请求', async () => {
    const previousRequest = deferred<typeof response>()
    const currentRequest = deferred<typeof response>()
    const currentMarker = `${name}-当前代理商`

    load.mockReturnValueOnce(previousRequest.promise).mockReturnValueOnce(currentRequest.promise)

    const wrapper = mountEditor(component)
    await wrapper.vm.$nextTick()
    await wrapper.setProps({ tenantId: 24 })
    await wrapper.vm.$nextTick()

    currentRequest.resolve({
      ...response,
      tenantId: 24,
      [markerKey]: currentMarker
    } as typeof response)
    await flushPromises()

    expect(wrapper.find('[data-testid="loaded-marker"]').text()).toBe(currentMarker)

    previousRequest.resolve({
      ...response,
      tenantId: 23,
      [markerKey]: `${name}-旧代理商`
    } as typeof response)
    await flushPromises()

    expect(wrapper.find('[data-testid="loaded-marker"]').text()).toBe(currentMarker)
    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(true)
  })

  it('表单校验期间切换代理商不会提交旧点击意图', async () => {
    const validation = deferred<boolean>()
    load.mockResolvedValueOnce(response).mockResolvedValueOnce({
      ...response,
      tenantId: 24,
      [markerKey]: `${name}-当前代理商`
    } as typeof response)
    validateForm.mockReturnValueOnce(validation.promise)

    const wrapper = mountEditor(component)
    await flushPromises()
    await wrapper
      .find('textarea[data-placeholder^="必填 10"]')
      .setValue('这是一条足够长的旧代理商变更原因')
    await findButton(wrapper, '保存')?.trigger('click')

    await wrapper.setProps({ tenantId: 24 })
    await flushPromises()
    await wrapper
      .find('textarea[data-placeholder^="必填 10"]')
      .setValue('这是一条足够长的新代理商变更原因')
    validation.resolve(true)
    await flushPromises()

    expect(save).not.toHaveBeenCalled()
  })

  it('旧保存结束不会清除新代理商的保存中状态', async () => {
    const previousSave = deferred<typeof response>()
    const currentSave = deferred<typeof response>()
    const currentResponse = {
      ...response,
      tenantId: 24,
      [markerKey]: `${name}-当前代理商`
    } as typeof response
    load.mockResolvedValueOnce(response).mockResolvedValueOnce(currentResponse)
    save.mockReturnValueOnce(previousSave.promise).mockReturnValueOnce(currentSave.promise)

    const wrapper = mountEditor(component)
    await flushPromises()
    await wrapper
      .find('textarea[data-placeholder^="必填 10"]')
      .setValue('这是一条足够长的旧代理商变更原因')
    await findButton(wrapper, '保存')?.trigger('click')
    await flushPromises()

    await wrapper.setProps({ tenantId: 24 })
    await flushPromises()
    expect(findButton(wrapper, '保存')?.attributes('data-loading')).toBe('false')

    await wrapper
      .find('textarea[data-placeholder^="必填 10"]')
      .setValue('这是一条足够长的新代理商变更原因')
    await findButton(wrapper, '保存')?.trigger('click')
    await flushPromises()
    expect(findButton(wrapper, '保存')?.attributes('data-loading')).toBe('true')

    previousSave.resolve(response)
    await flushPromises()
    expect(findButton(wrapper, '保存')?.attributes('data-loading')).toBe('true')

    currentSave.resolve(currentResponse)
    await flushPromises()
    expect(findButton(wrapper, '保存')?.attributes('data-loading')).toBe('false')
  })
})

describe('编辑器保存期间切换代理商', () => {
  it('构建资料的旧保存响应不会覆盖新代理商状态', async () => {
    const saveRequest = deferred<typeof buildMaterial>()
    getTenantAppBuildMaterial
      .mockResolvedValueOnce({ ...buildMaterial, materialVersion: 23 })
      .mockResolvedValueOnce({
        ...buildMaterial,
        tenantId: 24,
        appName: '当前代理商构建资料',
        materialVersion: 24
      })
    updateTenantAppBuildMaterial.mockReturnValueOnce(saveRequest.promise)

    const wrapper = mountEditor(AppBuildMaterialEditor)
    await flushPromises()
    await wrapper
      .find('textarea[data-placeholder^="必填 10"]')
      .setValue('这是一条足够长的构建资料变更原因')
    await findButton(wrapper, '保存构建资料版本')?.trigger('click')
    await flushPromises()

    await wrapper.setProps({ tenantId: 24 })
    await flushPromises()
    expect(wrapper.text()).toContain('构建资料版本 24')
    expect(wrapper.find('[data-testid="loaded-marker"]').text()).toBe('当前代理商构建资料')

    saveRequest.resolve({ ...buildMaterial, materialVersion: 99 })
    await flushPromises()

    expect(wrapper.text()).toContain('构建资料版本 24')
    expect(wrapper.text()).not.toContain('构建资料版本 99')
    expect(wrapper.find('[data-testid="loaded-marker"]').text()).toBe('当前代理商构建资料')
  })

  it('发布档案的旧保存响应不会覆盖新代理商表单', async () => {
    const saveRequest = deferred<typeof releaseProfile>()
    getTenantAppReleaseProfile.mockResolvedValueOnce(releaseProfile).mockResolvedValueOnce({
      ...releaseProfile,
      tenantId: 24,
      profileCode: 'tenant-24'
    })
    updateTenantAppReleaseProfile.mockReturnValueOnce(saveRequest.promise)

    const wrapper = mountEditor(AppReleaseEditor)
    await flushPromises()
    await wrapper
      .find('textarea[data-placeholder^="必填 10"]')
      .setValue('这是一条足够长的发布档案变更原因')
    await findButton(wrapper, '保存发布档案')?.trigger('click')
    await flushPromises()

    await wrapper.setProps({ tenantId: 24 })
    await flushPromises()
    expect(wrapper.find('[data-testid="loaded-marker"]').text()).toBe('tenant-24')

    saveRequest.resolve({ ...releaseProfile, profileCode: 'tenant-23-stale-save' })
    await flushPromises()

    expect(wrapper.find('[data-testid="loaded-marker"]').text()).toBe('tenant-24')
  })
})
