<template>
  <div :class="prefixCls" class="skit-login-page">
    <div class="skit-login-screen">
      <div class="skit-login-card">
        <div class="skit-login-head">
          <img alt="" src="@/assets/imgs/skit/login-head.png" />
        </div>
        <img alt="" class="skit-login-avatar" src="@/assets/imgs/skit/avatar.png" />
        <LoginForm />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useDesign } from '@/hooks/web/useDesign'
import { LoginForm } from './components'

defineOptions({ name: 'Login' })

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('login')
</script>

<style lang="scss" scoped>
.skit-login-page {
  min-height: 100%;
  overflow: auto;
  background: #f1f4fd;
}

.skit-login-screen {
  width: min(430px, calc(100vw - 32px));
  padding: 100px 0 48px;
  margin: 0 auto;
}

.skit-login-card {
  min-height: 508px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e8f0;
  box-shadow: 0 8px 24px rgb(52 73 126 / 8%);
}

.skit-login-head img {
  display: block;
  width: 100%;
}

.skit-login-avatar {
  display: block;
  width: 100px;
  height: 100px;
  margin: -53px auto 30px;
  border-radius: 50%;
}

@media (width <= 640px) {
  .skit-login-screen {
    padding-top: 56px;
  }
}
</style>
