import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ApiErrorLogVO } from '@/api/infra/apiErrorLog'
import ApiErrorLogDetail from '@/views/infra/apiErrorLog/ApiErrorLogDetail.vue'

vi.mock('@/config/axios', () => ({ default: {} }))
vi.stubGlobal('ref', ref)

const detail: ApiErrorLogVO = {
  id: 901,
  traceId: 'trace-safe-901',
  userId: 1,
  userType: 2,
  applicationName: 'yudao-server',
  requestMethod: 'PUT',
  requestParams: '{"networkFirmId":8}',
  requestUrl: '/admin-api/skit/tenant/ad-readiness/network-capability',
  userIp: '127.0.0.1',
  userAgent: 'test',
  exceptionTime: new Date('2026-07-22T02:00:00Z'),
  exceptionName: 'org.springframework.jdbc.UncategorizedSQLException',
  exceptionMessage: 'org.springframework.jdbc.UncategorizedSQLException',
  exceptionRootCauseMessage: 'java.sql.SQLException',
  exceptionStackTrace: 'sensitive-stack-must-not-render',
  exceptionClassName: 'SkitTenantAdCapabilityServiceImpl',
  exceptionFileName: 'SkitTenantAdCapabilityServiceImpl.java',
  exceptionMethodName: 'upsertNetworkCapability',
  exceptionLineNumber: 230,
  processUserId: 0,
  processStatus: 0,
  processTime: new Date('2026-07-22T02:00:00Z'),
  resultCode: 500,
  createTime: new Date('2026-07-22T02:00:00Z')
}

describe('API error log detail', () => {
  it('renders the safe exception diagnosis fields without exposing the stack trace', async () => {
    const wrapper = mount(ApiErrorLogDetail, {
      global: {
        stubs: {
          Dialog: {
            props: ['modelValue'],
            template: '<section v-if="modelValue"><slot /></section>'
          },
          'el-descriptions': { template: '<dl><slot /></dl>' },
          'el-descriptions-item': {
            props: ['label'],
            template: '<div><dt>{{ label }}</dt><dd><slot /></dd></div>'
          },
          'dict-tag': true,
          'el-input': {
            props: ['modelValue'],
            template: '<span>{{ modelValue }}</span>'
          }
        }
      }
    })

    await wrapper.vm.open(detail)
    await nextTick()

    expect(wrapper.text()).toContain('异常消息')
    expect(wrapper.text()).toContain('org.springframework.jdbc.UncategorizedSQLException')
    expect(wrapper.text()).toContain('根因消息')
    expect(wrapper.text()).toContain('java.sql.SQLException')
    expect(wrapper.text()).toContain('异常类')
    expect(wrapper.text()).toContain('SkitTenantAdCapabilityServiceImpl')
    expect(wrapper.text()).toContain('异常文件')
    expect(wrapper.text()).toContain('SkitTenantAdCapabilityServiceImpl.java')
    expect(wrapper.text()).toContain('异常方法')
    expect(wrapper.text()).toContain('upsertNetworkCapability')
    expect(wrapper.text()).toContain('异常行号')
    expect(wrapper.text()).toContain('230')
    expect(wrapper.text()).not.toContain('sensitive-stack-must-not-render')
  })
})
