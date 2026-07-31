import { useI18n } from '@/hooks/web/useI18n'
import { PRODUCT_AD_MONITOR_ROUTE_NAME } from '@/router/productMenu'
import { Layout, getParentLayout } from '@/utils/routerHelper'

const { t } = useI18n()

/**
 * The complete production route tree for the Skit management console.
 *
 * Router registration, role-filtered menu generation, and route contracts all
 * consume this source. Feature source outside this tree is quarantined and
 * cannot become reachable through backend-provided menu data.
 */
const productRoutes: AppRouteRecordRaw[] = [
  {
    path: '/redirect',
    component: Layout,
    name: 'RedirectRoot',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: { hidden: true, noTagsView: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/index',
    name: 'Home',
    meta: {},
    children: [
      {
        path: 'index',
        component: () => import('@/views/Home/Index.vue'),
        name: 'Index',
        meta: {
          title: '数据总览',
          icon: 'ep:home-filled',
          noCache: false,
          affix: true
        }
      }
    ]
  },
  {
    path: '/skit',
    component: Layout,
    redirect: '/skit/user-center/agents',
    name: 'SkitSaas',
    meta: {
      title: '管理后台',
      icon: 'ep:video-play',
      alwaysShow: true
    },
    children: [
      {
        path: 'general',
        component: getParentLayout(),
        redirect: '/skit/general/attachment',
        name: 'SkitGeneral',
        meta: { title: '常规管理', icon: 'ep:setting', alwaysShow: true },
        children: [
          {
            path: 'attachment',
            component: () => import('@/views/skit/admin/AdminTable.vue'),
            name: 'SkitAttachment',
            props: { pageKey: 'attachment' },
            meta: { title: '附件管理', icon: 'ep:folder-opened', noCache: false }
          },
          {
            path: 'operation-log',
            component: () => import('@/views/skit/admin/AdminTable.vue'),
            name: 'SkitOperationLog',
            props: { pageKey: 'operationLog' },
            meta: { title: '操作日志', icon: 'ep:document', noCache: false }
          },
          {
            path: 'api-error-log',
            component: () => import('@/views/infra/apiErrorLog/index.vue'),
            name: 'SkitApiErrorLog',
            meta: {
              title: '错误日志',
              icon: 'ep:warning',
              noCache: true,
              roles: ['super_admin']
            }
          }
        ]
      },
      {
        path: 'drama',
        component: () => import('@/views/skit/admin/AdminTable.vue'),
        name: 'SkitDrama',
        props: { pageKey: 'drama' },
        meta: { title: '短剧管理', icon: 'ep:video-camera', noCache: false }
      },
      {
        path: 'ad-center',
        component: getParentLayout(),
        redirect: '/skit/ad-consumption',
        name: 'SkitAdCenter',
        meta: {
          title: '广告中心',
          icon: 'ep:histogram',
          alwaysShow: true,
          roles: ['super_admin', 'tenant_admin']
        },
        children: [
          {
            path: '/skit/ad-consumption',
            component: () => import('@/views/skit/ad-consumption/index.vue'),
            name: 'SkitAdConsumption',
            meta: {
              title: '消费明细',
              icon: 'ep:list',
              noCache: false,
              roles: ['super_admin', 'tenant_admin']
            }
          },
          {
            path: '/skit/ad-record',
            component: () => import('@/views/skit/ad-monitor/index.vue'),
            name: PRODUCT_AD_MONITOR_ROUTE_NAME,
            meta: {
              title: '广告监控',
              icon: 'ep:data-analysis',
              noCache: false,
              roles: ['super_admin', 'tenant_admin']
            }
          }
        ]
      },
      {
        path: 'withdraw',
        component: () => import('@/views/skit/admin/AdminTable.vue'),
        name: 'SkitWithdraw',
        props: { pageKey: 'withdraw' },
        meta: { title: '积分提现', icon: 'ep:wallet', noCache: false }
      },
      {
        path: 'score-log',
        component: () => import('@/views/skit/admin/AdminTable.vue'),
        name: 'SkitScoreLog',
        props: { pageKey: 'scoreLog' },
        meta: { title: '积分记录', icon: 'ep:coin', noCache: false }
      },
      {
        path: 'login-record',
        component: () => import('@/views/skit/admin/AdminTable.vue'),
        name: 'SkitLoginRecord',
        props: { pageKey: 'loginRecord' },
        meta: { title: '登录记录', icon: 'ep:key', noCache: false }
      },
      {
        path: 'device-log',
        component: () => import('@/views/skit/admin/AdminTable.vue'),
        name: 'SkitDeviceLog',
        props: { pageKey: 'deviceLog' },
        meta: { title: '设备日志', icon: 'ep:monitor', noCache: false }
      },
      {
        path: 'user-center',
        component: getParentLayout(),
        redirect: '/skit/user-center/agents',
        name: 'SkitUserCenter',
        meta: {
          title: '用户管理',
          icon: 'ep:user',
          alwaysShow: true,
          roles: ['super_admin', 'tenant_admin']
        },
        children: [
          {
            path: 'agents',
            component: () => import('@/views/skit/tenant/index.vue'),
            name: 'SkitAgentManagement',
            meta: {
              title: '代理商管理',
              icon: 'ep:office-building',
              noCache: true,
              roles: ['super_admin', 'tenant_admin']
            }
          },
          {
            path: 'users',
            component: () => import('@/views/skit/user/index.vue'),
            name: 'SkitAppUserManagement',
            meta: {
              title: '用户管理',
              icon: 'ep:user-filled',
              noCache: true,
              roles: ['super_admin', 'tenant_admin']
            }
          }
        ]
      },
      {
        path: 'user',
        redirect: '/skit/user-center/agents',
        name: 'SkitUserLegacyRedirect',
        meta: { hidden: true, noTagsView: true }
      },
      {
        path: 'announcement',
        component: () => import('@/views/skit/admin/AdminTable.vue'),
        name: 'SkitAnnouncement',
        props: { pageKey: 'announcement' },
        meta: { title: '公告管理', icon: 'ep:bell', noCache: false }
      }
    ]
  },
  {
    path: '/skit/ad-center/skit/ad-consumption',
    redirect: '/skit/ad-consumption',
    name: 'SkitAdConsumptionLegacyRedirect',
    meta: { hidden: true, noTagsView: true }
  },
  {
    path: '/skit/ad-center/skit/ad-record',
    redirect: '/skit/ad-record',
    name: 'SkitAdRecordLegacyRedirect',
    meta: { hidden: true, noTagsView: true }
  },
  {
    path: '/user',
    component: Layout,
    name: 'UserInfo',
    meta: { hidden: true },
    children: [
      {
        path: 'profile',
        component: () => import('@/views/Profile/Index.vue'),
        name: 'Profile',
        meta: {
          canTo: true,
          hidden: true,
          noTagsView: false,
          icon: 'ep:user',
          title: t('common.profile')
        }
      },
      {
        path: 'notify-message',
        component: () => import('@/views/system/notify/my/index.vue'),
        name: 'MyNotifyMessage',
        meta: {
          canTo: true,
          hidden: true,
          noTagsView: false,
          icon: 'ep:message',
          title: '我的站内信'
        }
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/Login/Login.vue'),
    name: 'Login',
    meta: { hidden: true, title: t('router.login'), noTagsView: true }
  },
  {
    path: '/403',
    component: () => import('@/views/Error/403.vue'),
    name: 'NoAccess',
    meta: { hidden: true, title: '403', noTagsView: true }
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    name: 'NoFound',
    meta: { hidden: true, title: '404', noTagsView: true }
  },
  {
    path: '/500',
    component: () => import('@/views/Error/500.vue'),
    name: 'Error',
    meta: { hidden: true, title: '500', noTagsView: true }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/Error/404.vue'),
    name: '',
    meta: { title: '404', hidden: true, breadcrumb: false }
  }
]

export default productRoutes
