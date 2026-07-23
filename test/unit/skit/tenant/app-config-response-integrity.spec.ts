import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref, watch } from 'vue'
import AppBuildMaterialEditor from '@/views/skit/tenant/AppBuildMaterialEditor.vue'
import AppReleaseEditor from '@/views/skit/tenant/AppReleaseEditor.vue'
import { formatDate } from '@/utils/formatTime'

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

const releaseProfile = {
  tenantId: 23,
  profileCode: 'tenant-23-staging',
  channel: 'staging',
  minNativeVersion: '',
  hotVersion: '',
  hotBundleUrl: '',
  hotBundleSha256: '',
  hotReleaseNo: 0,
  hotManifestSignature: '',
  nativeVersion: '',
  nativePackage: '',
  nativeProtocolVersion: 7,
  runtimeUpdatePublicKey: '',
  runtimeUpdateKeyFingerprint: '',
  status: 1
}

const buildMaterial = {
  tenantId: 23,
  materialVersion: 8,
  apiBaseUrl: '',
  appName: '',
  nativeVersionCode: 17,
  nativeVersionName: '',
  runtimeReleaseNo: 6,
  pangleSettingsConfigured: false,
  signingConfigured: false,
  takuAppKeyConfigured: false,
  takuAccountConfigured: false,
  appReleaseProfileConfigured: false,
  verifiedAt: null
}

const stubs = {
  'el-alert': {
    props: ['title', 'type'],
    template:
      '<div class="alert" :data-alert-type="type">{{ title }}<slot name="title" /><slot /></div>'
  },
  'el-skeleton': { template: '<div data-testid="editor-loading" />' },
  'el-form': {
    props: ['model'],
    methods: {
      validate() {
        return Promise.resolve(true)
      }
    },
    template:
      '<form data-testid="editor-form"><output data-testid="form-model">{{ JSON.stringify(model) }}</output><slot /></form>'
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
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
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

const readFormModel = (wrapper: VueWrapper) =>
  JSON.parse(wrapper.find('[data-testid="form-model"]').text()) as Record<string, unknown>

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
})

describe('App 发布档案响应完整性', () => {
  it('后端返回 null 时明确显示未找到且不开放保存表单', async () => {
    getTenantAppReleaseProfile.mockResolvedValueOnce(null)

    const wrapper = mountEditor(AppReleaseEditor)
    await flushPromises()

    expect(wrapper.text()).toContain('未找到发布档案')
    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('保存发布档案')
    expect(updateTenantAppReleaseProfile).not.toHaveBeenCalled()
  })

  it.each([
    ['缺少字段', { tenantId: 23, profileCode: 'tenant-23' }],
    ['字段类型错误', { ...releaseProfile, nativeProtocolVersion: '1' }]
  ])('后端响应%s时进入加载错误', async (_caseName, response) => {
    getTenantAppReleaseProfile.mockResolvedValueOnce(response)

    const wrapper = mountEditor(AppReleaseEditor)
    await flushPromises()

    expect(wrapper.text()).toContain('发布档案加载失败')
    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(false)
  })

  it('完整响应逐值进入表单并保留后端的关闭态与空值', async () => {
    getTenantAppReleaseProfile.mockResolvedValueOnce(releaseProfile)

    const wrapper = mountEditor(AppReleaseEditor)
    await flushPromises()

    expect(readFormModel(wrapper)).toEqual(releaseProfile)
  })

  it('保存响应畸形时不把残缺档案显示成已保存事实', async () => {
    getTenantAppReleaseProfile.mockResolvedValueOnce(releaseProfile)
    updateTenantAppReleaseProfile.mockResolvedValueOnce({ tenantId: 23 })

    const wrapper = mountEditor(AppReleaseEditor)
    await flushPromises()
    await wrapper
      .find('textarea[data-placeholder="必填 10–500 字，用于安全审计"]')
      .setValue('验证畸形保存响应不会覆盖现有档案')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('保存发布档案'))
      ?.trigger('click')
    await flushPromises()

    expect(updateTenantAppReleaseProfile).toHaveBeenCalledOnce()
    expect(readFormModel(wrapper)).toEqual(releaseProfile)
  })
})

describe('App 构建资料响应完整性', () => {
  it('接受后端 LocalDateTime 序列化出的 epoch 毫秒并显示校验时间', async () => {
    const verifiedAt = Date.UTC(2026, 6, 23, 4, 5, 6)
    getTenantAppBuildMaterial.mockResolvedValueOnce({
      ...buildMaterial,
      verifiedAt
    })

    const wrapper = mountEditor(AppBuildMaterialEditor)
    await flushPromises()

    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(true)
    expect(wrapper.text()).toContain(`最近校验 ${formatDate(verifiedAt)}`)
    expect(wrapper.text()).not.toContain('构建资料加载失败')
  })

  it.each([
    ['ISO 字符串', '2026-07-23T12:05:06'],
    ['零时间戳', 0],
    ['负时间戳', -1],
    ['小数时间戳', 1774248306000.5]
  ])('拒绝 verifiedAt 的%s响应', async (_caseName, verifiedAt) => {
    getTenantAppBuildMaterial.mockResolvedValueOnce({
      ...buildMaterial,
      verifiedAt
    })

    const wrapper = mountEditor(AppBuildMaterialEditor)
    await flushPromises()

    expect(wrapper.text()).toContain('构建资料加载失败')
    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(false)
  })

  it('materialVersion 为 0 时显示未创建草稿提示且不冒充成功版本', async () => {
    getTenantAppBuildMaterial.mockResolvedValueOnce({
      ...buildMaterial,
      materialVersion: 0,
      nativeVersionCode: 1,
      runtimeReleaseNo: 1
    })

    const wrapper = mountEditor(AppBuildMaterialEditor)
    await flushPromises()

    const summary = wrapper
      .findAll('.alert')
      .find((alert) => alert.text().includes('尚未创建构建资料'))
    expect(summary).toBeDefined()
    expect(summary?.text()).toContain('新建草稿')
    expect(summary?.text()).toContain('版本需人工确认')
    expect(summary?.attributes('data-alert-type')).not.toBe('success')

    const model = readFormModel(wrapper)
    expect(model).not.toHaveProperty('nativeVersionCode')
    expect(model).not.toHaveProperty('runtimeReleaseNo')
  })

  it.each([
    ['缺少字段', { tenantId: 23, materialVersion: 2 }],
    ['versionCode 非正整数', { ...buildMaterial, nativeVersionCode: 0 }],
    ['运行时发布序号非正整数', { ...buildMaterial, runtimeReleaseNo: 0 }],
    ['资料版本超出安全整数', { ...buildMaterial, materialVersion: Number.MAX_SAFE_INTEGER + 1 }],
    [
      'versionCode 超出安全整数',
      { ...buildMaterial, nativeVersionCode: Number.MAX_SAFE_INTEGER + 1 }
    ],
    [
      '运行时发布序号超出安全整数',
      { ...buildMaterial, runtimeReleaseNo: Number.MAX_SAFE_INTEGER + 1 }
    ]
  ])('已创建资料的响应%s时进入加载错误', async (_caseName, response) => {
    getTenantAppBuildMaterial.mockResolvedValueOnce(response)

    const wrapper = mountEditor(AppBuildMaterialEditor)
    await flushPromises()

    expect(wrapper.text()).toContain('构建资料加载失败')
    expect(wrapper.find('[data-testid="editor-form"]').exists()).toBe(false)
  })

  it('完整响应逐值进入表单并保留空字符串与未配置状态', async () => {
    getTenantAppBuildMaterial.mockResolvedValueOnce(buildMaterial)

    const wrapper = mountEditor(AppBuildMaterialEditor)
    await flushPromises()

    expect(readFormModel(wrapper)).toEqual({
      tenantId: 23,
      apiBaseUrl: '',
      appName: '',
      nativeVersionCode: 17,
      nativeVersionName: '',
      runtimeReleaseNo: 6,
      reason: ''
    })
    expect(wrapper.text()).toContain('Taku App Key 未配置')
    expect(wrapper.text()).toContain('发布签名未配置')
  })
})
