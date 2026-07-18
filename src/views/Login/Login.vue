<script lang="ts" setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useLocaleStore } from '@/store/modules/locale'
import { useLocale } from '@/hooks/web/useLocale'
import { LoginForm } from './components'

defineOptions({ name: 'Login' })

const appStore = useAppStore()
const localeStore = useLocaleStore()

const isDark = computed(() => appStore.getIsDark)
const currentLang = computed(() => localeStore.getCurrentLocale)
const langMap = computed(() => localeStore.getLocaleMap)

const toggleTheme = () => appStore.setIsDark(!appStore.getIsDark)

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
  --login-bg:
    radial-gradient(circle at 16% 12%, rgb(99 102 241 / 20%) 0 190px, transparent 370px),
    radial-gradient(circle at 88% 22%, rgb(20 184 166 / 13%) 0 180px, transparent 360px),
    linear-gradient(145deg, #f8fafc 0%, #eef2ff 47%, #f0fdfa 100%);
  --login-panel: rgb(255 255 255 / 94%);
  --login-control: rgb(255 255 255 / 80%);
  --login-border: rgb(216 222 233 / 92%);
  --login-text: #171b24;
  --login-text-secondary: #707887;

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
  background: rgb(99 102 241 / 15%);
}

.login-orb--blue {
  top: 14%;
  right: 8%;
  width: 220px;
  height: 220px;
  background: rgb(20 184 166 / 11%);
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
  border: 1px solid rgb(255 255 255 / 78%);
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
    color: #4f46e5;
    border-color: rgb(99 102 241 / 40%);
    transform: translateY(-1px);
  }
}

.login-action-button--icon {
  padding: 0 12px;
  color: #4f46e5;
  background: linear-gradient(135deg, rgb(238 242 255 / 96%), rgb(240 253 250 / 92%));
  border-color: rgb(99 102 241 / 28%);
  border-radius: 12px;
  box-shadow: 0 10px 24px -18px rgb(79 70 229 / 72%);
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
  border: 1px solid rgb(255 255 255 / 68%);
  border-radius: 13px;
  box-shadow:
    0 14px 28px -16px rgb(79 70 229 / 58%),
    0 0 0 5px rgb(99 102 241 / 8%);
}

.login-card {
  width: 100%;
  padding: 38px 36px 34px;
  background: var(--login-panel);
  border: 1px solid var(--login-border);
  border-radius: 26px;
  box-shadow: 0 32px 90px -50px rgb(30 41 59 / 68%);
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
  color: #0f766e;
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

.skit-login-page.is-dark {
  --login-bg:
    radial-gradient(circle at 16% 12%, rgb(99 102 241 / 22%) 0 190px, transparent 380px),
    radial-gradient(circle at 88% 22%, rgb(45 212 191 / 14%) 0 180px, transparent 370px),
    linear-gradient(145deg, #080f1f 0%, #0b1120 48%, #111827 100%);
  --login-panel: rgb(15 23 42 / 90%);
  --login-control: rgb(15 23 42 / 82%);
  --login-border: rgb(255 255 255 / 11%);
  --login-text: #f8fafc;
  --login-text-secondary: #a7b0c0;

  .login-action-button {
    border-color: rgb(255 255 255 / 11%);
  }

  .login-action-button--icon {
    color: #c7d2fe;
    background: linear-gradient(135deg, rgb(99 102 241 / 22%), rgb(20 184 166 / 10%));
    border-color: rgb(129 140 248 / 32%);
  }
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
