<template>
  <el-form
    ref="formLogin"
    :model="loginData.loginForm"
    :rules="LoginRules"
    class="login-form skit-login-form"
    size="default"
  >
    <el-row>
      <el-col :span="24">
        <label class="skit-field-label" for="skit-login-username">账号</label>
        <el-form-item prop="username">
          <el-input
            id="skit-login-username"
            v-model="loginData.loginForm.username"
            placeholder="请输入账号"
            :prefix-icon="iconAvatar"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <label class="skit-field-label" for="skit-login-password">密码</label>
        <el-form-item prop="password">
          <el-input
            id="skit-login-password"
            v-model="loginData.loginForm.password"
            placeholder="请输入密码"
            :prefix-icon="iconLock"
            show-password
            type="password"
            @keyup.enter="getCode()"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" class="skit-keep-login">
        <el-form-item>
          <el-checkbox v-model="loginData.loginForm.rememberMe">保持登录状态</el-checkbox>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item>
          <el-button
            :loading="loginLoading"
            class="skit-login-button"
            type="primary"
            @click="getCode()"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-col>
      <Verify
        v-if="loginData.captchaEnable === 'true'"
        ref="verify"
        :captchaType="captchaType"
        :barSize="{ width: '400px', height: '46px' }"
        :imgSize="{ width: '400px', height: '200px' }"
        mode="pop"
        @success="handleLogin"
      />
    </el-row>
  </el-form>
</template>
<script lang="ts" setup>
import { ElLoading } from 'element-plus'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { useIcon } from '@/hooks/web/useIcon'

import * as authUtil from '@/utils/auth'
import * as LoginApi from '@/api/login'
import {
  runLoginChallengeTransition,
  runLoginTransition
} from '@/plugins/microInteractions/transitions'
import { useFormValid } from './useLogin'

defineOptions({ name: 'LoginForm' })

const iconAvatar = useIcon({ icon: 'ep:avatar' })
const iconLock = useIcon({ icon: 'ep:lock' })
const formLogin = ref()
const { validForm } = useFormValid(formLogin)
const { currentRoute, push } = useRouter()
const redirect = ref<string>('')
const loginLoading = ref(false)
const verify = ref()
const captchaType = ref('blockPuzzle') // blockPuzzle 滑块 clickWord 点击文字 pictureWord 文字验证码

const LoginRules = {
  username: [required],
  password: [required]
}
const loginData = reactive({
  isShowPassword: false,
  captchaEnable: import.meta.env.VITE_APP_CAPTCHA_ENABLE,
  loginForm: {
    username: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || '',
    password: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || '',
    captchaVerification: '',
    rememberMe: true // 默认记录我。如果不需要，可手动修改
  }
})

// 获取验证码
const getCode = async () => {
  // 情况一，未开启：则直接登录
  if (loginData.captchaEnable === 'false') {
    await handleLogin({})
  } else {
    // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
    // 弹出验证码
    await runLoginChallengeTransition(() => verify.value.show())
  }
}
// 记住我
const getLoginFormCache = () => {
  const loginForm = authUtil.getLoginForm()
  if (loginForm) {
    loginData.loginForm = {
      ...loginData.loginForm,
      username: loginForm.username ? loginForm.username : loginData.loginForm.username,
      password: loginForm.password ? loginForm.password : loginData.loginForm.password,
      rememberMe: loginForm.rememberMe
    }
  }
}
const loading = ref() // ElLoading.service 返回的实例
// 登录
const handleLogin = async (params: any) => {
  loginLoading.value = true
  try {
    const data = await validForm()
    if (!data) {
      return
    }
    const loginDataLoginForm = { ...loginData.loginForm }
    loginDataLoginForm.captchaVerification = params.captchaVerification
    const res = await LoginApi.login(loginDataLoginForm)
    if (!res) {
      return
    }
    loading.value = ElLoading.service({
      lock: true,
      text: '正在加载系统中...',
      background: 'var(--skit-overlay)'
    })
    if (loginDataLoginForm.rememberMe) {
      authUtil.setLoginForm(loginDataLoginForm)
    } else {
      authUtil.removeLoginForm()
    }
    authUtil.setToken(res)
    if (!redirect.value) {
      redirect.value = '/'
    }
    await runLoginTransition(() => push({ path: redirect.value }))
  } finally {
    loginLoading.value = false
    loading.value?.close?.()
  }
}

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)
onMounted(() => {
  // 登录接口由后端依据用户名解析租户，不能沿用上一次会话的 tenant-id。
  authUtil.removeTenantId()
  getLoginFormCache()
})
</script>

<style lang="scss" scoped>
.skit-login-form {
  width: 100%;
  margin: 0;
  color: var(--login-text-secondary);

  :deep(.el-form-item) {
    margin: 8px 0 17px;
  }

  :deep(.el-input__wrapper) {
    min-height: 46px;
    padding: 0 14px;
    background: var(--login-control);
    border-radius: 14px;
    box-shadow: 0 0 0 1px var(--login-border) inset;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-3) inset;
    }

    &.is-focus {
      background: var(--login-panel);
      box-shadow:
        0 0 0 1px var(--el-color-primary) inset,
        0 0 0 4px var(--skit-primary-soft) !important;
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: var(--login-text);
    -webkit-text-fill-color: var(--login-text);
  }

  :deep(.el-input__inner::placeholder) {
    color: var(--skit-text-placeholder);
    -webkit-text-fill-color: var(--skit-text-placeholder);
  }

  :deep(.el-input-group__prepend),
  :deep(.el-input__prefix) {
    color: var(--skit-text-secondary);
  }
}

.skit-field-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--login-text);
}

.skit-keep-login {
  margin-top: -8px;

  :deep(.el-checkbox__label) {
    font-size: 13px;
    color: var(--login-text-secondary);
  }
}

.skit-login-button {
  width: 100%;
  min-height: 46px;
  font-size: 14px;
  font-weight: 750;
  letter-spacing: 0.12em;
  background: var(--skit-active-gradient);
  border: 0;
  border-radius: 14px;
  box-shadow: 0 16px 30px -18px var(--skit-shadow-strong);

  &:hover,
  &:focus {
    background: var(--skit-active-gradient);
    filter: brightness(1.08);
    transform: translateY(-1px);
  }
}
</style>
