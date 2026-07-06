import request from '@/config/axios'
import type { RegisterVO, UserLoginVO } from './types'

const isSkitDemoLogin = () => import.meta.env.VITE_SKIT_DEMO_LOGIN === 'true'

export interface SmsCodeVO {
  mobile: string
  scene: number
}

export interface SmsLoginVO {
  mobile: string
  code: string
}

// 登录
export const login = (data: UserLoginVO) => {
  if (isSkitDemoLogin()) {
    if (data.username !== '123456' || data.password !== '123456') {
      return Promise.reject(new Error('账号或密码错误'))
    }
    return Promise.resolve({
      id: 1,
      accessToken: 'skit-demo-access-token',
      refreshToken: 'skit-demo-refresh-token',
      userId: 1,
      userType: 2,
      clientId: 'skit-saas-demo',
      expiresTime: Date.now() + 7 * 24 * 60 * 60 * 1000
    })
  }
  return request.post({
    url: '/system/auth/login',
    data,
    headers: {
      isEncrypt: false
    }
  })
}

// 注册
export const register = (data: RegisterVO) => {
  return request.post({ url: '/system/auth/register', data })
}

// 使用租户名，获得租户编号
export const getTenantIdByName = (name: string) => {
  return request.get({ url: '/system/tenant/get-id-by-name?name=' + name })
}

// 使用租户域名，获得租户信息
export const getTenantByWebsite = (website: string) => {
  return request.get({ url: '/system/tenant/get-by-website?website=' + website })
}

// 登出
export const loginOut = () => {
  return request.post({ url: '/system/auth/logout' })
}

// 获取用户权限信息
export const getInfo = () => {
  if (isSkitDemoLogin()) {
    return Promise.resolve({
      permissions: ['*:*:*'],
      roles: ['admin'],
      user: {
        id: 1,
        username: '123456',
        nickname: '123456',
        deptId: 0,
        email: '123456@example.com',
        mobile: '',
        sex: 0,
        avatar: '',
        loginIp: '127.0.0.1',
        loginDate: new Date().toISOString()
      },
      menus: []
    })
  }
  return request.get({ url: '/system/auth/get-permission-info' })
}

//获取登录验证码
export const sendSmsCode = (data: SmsCodeVO) => {
  return request.post({ url: '/system/auth/send-sms-code', data })
}

// 短信验证码登录
export const smsLogin = (data: SmsLoginVO) => {
  return request.post({ url: '/system/auth/sms-login', data })
}

// 社交快捷登录，使用 code 授权码
export function socialLogin(type: string, code: string, state: string) {
  return request.post({
    url: '/system/auth/social-login',
    data: {
      type,
      code,
      state
    }
  })
}

// 社交授权的跳转
export const socialAuthRedirect = (type: number, redirectUri: string) => {
  return request.get({
    url: '/system/auth/social-auth-redirect?type=' + type + '&redirectUri=' + redirectUri
  })
}
// 获取验证图片以及 token
export const getCode = (data: any) => {
  return request.postOriginal({ url: 'system/captcha/get', data })
}

// 滑动或者点选验证
export const reqCheck = (data: any) => {
  return request.postOriginal({ url: 'system/captcha/check', data })
}

// 通过短信重置密码
export const smsResetPassword = (data: any) => {
  return request.post({ url: '/system/auth/reset-password', data })
}
