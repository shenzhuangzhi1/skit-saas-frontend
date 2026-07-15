import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AsyncState from '@/views/skit/shared/AsyncState.vue'
import TenantScopeBar from '@/views/skit/shared/TenantScopeBar.vue'
import { createTenantScope } from '@/views/skit/shared/tenantScope'

describe('AsyncState', () => {
  it('renders an API error instead of the successful data slot', () => {
    const wrapper = mount(AsyncState, {
      props: { error: '报表服务不可用', empty: false },
      slots: { default: '<div class="fake-zero">¥0.00</div>' },
      global: {
        stubs: {
          'el-alert': { props: ['title'], template: '<div class="error">{{ title }}</div>' },
          'el-skeleton': true
        }
      }
    })

    expect(wrapper.text()).toContain('报表服务不可用')
    expect(wrapper.find('.fake-zero').exists()).toBe(false)
  })

  it('distinguishes a genuine empty response from a loading response', async () => {
    const wrapper = mount(AsyncState, {
      props: { loading: true, empty: true },
      slots: { default: '<div class="data">data</div>' },
      global: { stubs: { 'el-skeleton': { template: '<div class="loading" />' } } }
    })
    expect(wrapper.find('.loading').exists()).toBe(true)

    await wrapper.setProps({ loading: false })
    expect(wrapper.text()).toContain('暂无数据')
    expect(wrapper.find('.data').exists()).toBe(false)
  })
})

describe('TenantScopeBar', () => {
  it('does not expose a tenant selector to a tenant admin', () => {
    const wrapper = mount(TenantScopeBar, {
      props: {
        modelValue: createTenantScope({ roles: ['tenant_admin'], originalTenantId: 17 }),
        tenants: [{ tenantId: 17, name: '代理商 A' }]
      },
      global: { stubs: { 'el-tag': { template: '<span><slot /></span>' } } }
    })
    expect(wrapper.text()).toContain('代理商 A')
    expect(wrapper.find('[data-testid="tenant-scope-select"]').exists()).toBe(false)
  })

  it('exposes explicit all/single selection to a super admin', () => {
    const wrapper = mount(TenantScopeBar, {
      props: {
        modelValue: createTenantScope({ roles: ['super_admin'], originalTenantId: 1 }),
        tenants: [{ tenantId: 23, name: '代理商 B' }]
      },
      global: {
        stubs: {
          'el-select': { template: '<select data-testid="tenant-scope-select" />' },
          'el-option': true
        }
      }
    })
    expect(wrapper.find('[data-testid="tenant-scope-select"]').exists()).toBe(true)
  })
})
