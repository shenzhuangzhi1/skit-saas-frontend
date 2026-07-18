<script lang="ts" setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useLocaleStore } from '@/store/modules/locale'
import { useLocale } from '@/hooks/web/useLocale'
import { LoginForm } from './components'
import { runThemeTransition } from '@/plugins/microInteractions/transitions'

defineOptions({ name: 'Login' })

const appStore = useAppStore()
const localeStore = useLocaleStore()

const isDark = computed(() => appStore.getIsDark)
const currentLang = computed(() => localeStore.getCurrentLocale)
const langMap = computed(() => localeStore.getLocaleMap)

const toggleTheme = (event: MouseEvent) => {
  return runThemeTransition(
    () => appStore.setIsDark(!appStore.getIsDark),
    event.currentTarget as HTMLElement
  )
}

const setLang = (lang: LocaleType) => {
  if (lang === currentLang.value.lang) return
  localeStore.setCurrentLocale({ lang })
  const { changeLocale } = useLocale()
  changeLocale(lang)
  window.location.reload()
}
</script>

<template>
  <main class="skit-login-page" :class="{ 'is-dark': isDark }">
    <div class="login-orb login-orb--pink"></div>
    <div class="login-orb login-orb--blue"></div>

    <div class="login-actions">
      <button
        type="button"
        class="login-action-button login-action-button--icon"
        :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
        @click="toggleTheme"
      >
        <Icon :icon="isDark ? 'ep:sunny' : 'ep:moon'" :size="17" />
        <span>{{ isDark ? '浅色模式' : '深色模式' }}</span>
      </button>

      <ElDropdown trigger="click" @command="setLang">
        <button type="button" class="login-action-button">
          <Icon icon="ion:language-sharp" :size="16" />
          <span>{{ currentLang.name }}</span>
          <Icon icon="ep:arrow-down" :size="13" />
        </button>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem v-for="item in langMap" :key="item.lang" :command="item.lang">
              {{ item.name }}
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>

    <section class="login-container">
      <RouterLink to="/" class="brand-link" aria-label="返回首页">
        <img src="@/assets/imgs/logo.png" alt="" class="brand-logo" />
        <span>{{ appStore.getTitle }}</span>
      </RouterLink>

      <div class="login-card">
        <div class="login-card__heading">
          <span class="login-card__eyebrow">SKIT CONSOLE</span>
          <h1>欢迎回来</h1>
          <p>登录后进入短剧 SaaS 管理工作台</p>
        </div>
        <LoginForm />
      </div>

      <p class="security-note">
        <Icon icon="ep:lock" :size="13" />
        账号信息将通过安全连接传输
      </p>
      <p class="page-footer">© 2025–2026 {{ appStore.getTitle }}</p>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.skit-login-page {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 32px 24px;
  overflow: hidden auto;
  color: var(--login-text);
  background: var(--login-bg);
}

.login-orb {
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  filter: blur(4px);
}

.login-orb--pink {
  bottom: -130px;
  left: 8%;
  width: 330px;
  height: 330px;
  background: var(--login-orb-primary);
  animation: login-orb-pink 15s ease-in-out infinite alternate;
}

.login-orb--blue {
  top: 14%;
  right: 8%;
  width: 220px;
  height: 220px;
  background: var(--login-orb-accent);
  animation: login-orb-blue 18s ease-in-out infinite alternate;
}

@keyframes login-orb-pink {
  to {
    transform: translate3d(42px, -28px, 0) scale(1.08);
  }
}

@keyframes login-orb-blue {
  to {
    transform: translate3d(-34px, 24px, 0) scale(0.94);
  }
}

.login-actions {
  position: absolute;
  top: 24px;
  right: 28px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-action-button {
  display: inline-flex;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 650;
  color: var(--login-text);
  cursor: pointer;
  background: var(--login-control);
  border: 1px solid var(--login-action-border);
  border-radius: 999px;
  outline: 0;
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(18px);
  gap: 6px;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-1px);
  }
}

.login-action-button--icon {
  padding: 0 12px;
  color: var(--el-color-primary);
  background: var(--login-action-bg);
  border-color: var(--skit-border-strong);
  border-radius: 12px;
  box-shadow: 0 10px 24px -18px var(--skit-shadow-strong);
}

.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 404px);
}

.brand-link {
  display: flex;
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: var(--login-text);
  text-decoration: none;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.brand-logo {
  width: 42px;
  height: 42px;
  object-fit: cover;
  border: 1px solid var(--login-action-border);
  border-radius: 13px;
  box-shadow:
    0 14px 28px -16px var(--skit-shadow-strong),
    0 0 0 5px var(--skit-primary-soft);
}

.login-card {
  width: 100%;
  padding: 38px 36px 34px;
  background: var(--login-panel);
  border: 1px solid var(--login-border);
  border-radius: 26px;
  box-shadow: 0 32px 90px -50px var(--login-card-shadow);
  backdrop-filter: blur(24px) saturate(130%);
}

.login-card__heading {
  margin-bottom: 28px;
  text-align: center;

  h1 {
    margin: 7px 0 8px;
    font-size: 25px;
    font-weight: 760;
    letter-spacing: -0.025em;
    color: var(--login-text);
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--login-text-secondary);
  }
}

.login-card__eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.13em;
  color: var(--skit-accent);
}

.security-note,
.page-footer {
  display: flex;
  margin: 18px 0 0;
  font-size: 12px;
  color: var(--login-text-secondary);
  text-align: center;
  align-items: center;
  gap: 5px;
}

.page-footer {
  margin-top: 12px;
}

@media (width <= 640px) {
  .skit-login-page {
    justify-content: flex-start;
    min-height: 100%;
    padding: 84px 16px 30px;
  }

  .login-actions {
    top: 20px;
    right: 18px;
  }

  .login-card {
    padding: 32px 24px 28px;
    border-radius: 21px;
  }
}
</style>
