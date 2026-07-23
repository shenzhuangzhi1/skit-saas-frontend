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
const themeActionLabel = computed(() => (isDark.value ? '切换到浅色模式' : '切换到深色模式'))
const currentLanguageLabel = computed(
  () =>
    currentLang.value?.name?.trim() ||
    langMap.value.find((item) => item.lang === currentLang.value?.lang)?.name?.trim() ||
    currentLang.value?.lang ||
    '语言'
)

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
    <header class="login-topbar">
      <RouterLink to="/" class="brand-link" aria-label="返回首页">
        <span class="brand-mark" aria-hidden="true">
          <i></i>
          <i></i>
          <i></i>
        </span>
        <span class="brand-copy">
          <strong>{{ appStore.getTitle }}</strong>
          <small>运营控制台</small>
        </span>
      </RouterLink>

      <div class="login-actions">
        <button
          type="button"
          class="login-action-button"
          :aria-label="themeActionLabel"
          :title="themeActionLabel"
          @click="toggleTheme"
        >
          <Icon :icon="isDark ? 'ep:sunny' : 'ep:moon'" :size="17" aria-hidden="true" />
          <span class="action-copy">{{ isDark ? '浅色模式' : '深色模式' }}</span>
        </button>

        <ElDropdown trigger="click" @command="setLang">
          <button
            type="button"
            class="login-action-button"
            :aria-label="`切换语言，当前${currentLanguageLabel}`"
          >
            <Icon icon="ion:language-sharp" :size="16" aria-hidden="true" />
            <span class="language-copy">{{ currentLanguageLabel }}</span>
            <Icon icon="ep:arrow-down" :size="13" aria-hidden="true" />
          </button>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem v-for="item in langMap" :key="item.lang" :command="item.lang">
                {{ item.name || item.lang }}
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>
    </header>

    <div class="login-shell">
      <section class="product-context" aria-labelledby="product-context-heading">
        <p class="context-eyebrow">短剧 SaaS 运营控制台</p>
        <h1 id="product-context-heading">
          <span>投放、分账、发版，</span>
          <br />
          <span>每一步都清晰可查。</span>
        </h1>
        <p class="context-intro">
          面向平台与代理商团队的统一工作台，让关键操作可追踪、数据边界可核验。
        </p>

        <ul class="capability-list">
          <li>
            <span class="capability-icon" aria-hidden="true">
              <Icon icon="ep:office-building" :size="18" />
            </span>
            <span class="capability-copy">
              <strong>代理商隔离</strong>
              <small>账号、应用与数据按租户边界管理</small>
            </span>
          </li>
          <li>
            <span class="capability-icon" aria-hidden="true">
              <Icon icon="ep:data-analysis" :size="18" />
            </span>
            <span class="capability-copy">
              <strong>广告对账</strong>
              <small>消耗、收益与回调状态统一核验</small>
            </span>
          </li>
          <li>
            <span class="capability-icon" aria-hidden="true">
              <Icon icon="ep:upload-filled" :size="18" />
            </span>
            <span class="capability-copy">
              <strong>版本发布</strong>
              <small>构建资料与发布记录全程留痕</small>
            </span>
          </li>
        </ul>

        <div class="workflow-board" aria-label="短剧运营流程">
          <div class="workflow-board__header">
            <span>运营链路</span>
            <span class="workflow-status">
              <i aria-hidden="true"></i>
              租户权限已隔离
            </span>
          </div>
          <ol>
            <li>
              <span class="workflow-index">01</span>
              <span>
                <strong>内容准备</strong>
                <small>剧集与应用资料</small>
              </span>
              <Icon icon="ep:arrow-right" :size="15" aria-hidden="true" />
            </li>
            <li>
              <span class="workflow-index">02</span>
              <span>
                <strong>广告核验</strong>
                <small>投放与收益对账</small>
              </span>
              <Icon icon="ep:arrow-right" :size="15" aria-hidden="true" />
            </li>
            <li>
              <span class="workflow-index">03</span>
              <span>
                <strong>发布控制</strong>
                <small>构建与版本记录</small>
              </span>
              <Icon icon="ep:check" :size="15" aria-hidden="true" />
            </li>
          </ol>
        </div>
      </section>

      <section class="login-card" aria-labelledby="login-heading">
        <div class="login-card__heading">
          <span class="login-card__eyebrow">安全登录</span>
          <h2 id="login-heading">欢迎回来</h2>
          <p>使用你的管理账号进入工作台</p>
        </div>
        <LoginForm />

        <p class="security-note">
          <Icon icon="ep:lock" :size="13" aria-hidden="true" />
          账号信息将通过安全连接传输
        </p>
      </section>
    </div>

    <footer class="page-footer">© 2025–2026 {{ appStore.getTitle }}</footer>
  </main>
</template>

<style lang="scss" scoped>
.skit-login-page {
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 28px clamp(24px, 4vw, 64px) 24px;
  overflow: auto;
  color: var(--login-text);
  background: var(--el-bg-color-page);
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.login-topbar {
  display: flex;
  width: min(100%, 1180px);
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
}

.login-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-action-button {
  display: inline-flex;
  min-height: 38px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--login-text);
  cursor: pointer;
  background: var(--login-control);
  border: 1px solid var(--login-action-border);
  border-radius: 10px;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-soft),
    border-color var(--motion-duration-fast) var(--motion-ease-soft),
    box-shadow var(--motion-duration-fast) var(--motion-ease-soft);
  align-items: center;
  justify-content: center;
  gap: 7px;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-3);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 3px;
  }
}

.brand-link {
  display: flex;
  color: var(--login-text);
  text-decoration: none;
  align-items: center;
  gap: 12px;

  &:focus-visible {
    border-radius: 8px;
    outline: 2px solid var(--el-color-primary);
    outline-offset: 4px;
  }
}

.brand-mark {
  display: grid;
  width: 40px;
  height: 40px;
  padding: 8px;
  background: var(--el-color-primary);
  border-radius: 10px;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;

  i {
    display: block;
    background: var(--skit-active-text);
    border-radius: 2px;

    &:nth-child(1) {
      height: 13px;
      align-self: end;
    }

    &:nth-child(2) {
      height: 20px;
      align-self: center;
    }

    &:nth-child(3) {
      height: 9px;
      align-self: start;
    }
  }
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.2;

  strong {
    max-width: 250px;
    overflow: hidden;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.015em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    margin-top: 3px;
    font-size: 11px;
    color: var(--login-text-secondary);
  }
}

.login-shell {
  display: grid;
  width: min(100%, 1100px);
  padding: clamp(48px, 7vh, 86px) 0;
  margin: auto;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 424px);
  align-items: center;
  gap: clamp(56px, 8vw, 112px);
}

.product-context {
  max-width: 570px;

  h1 {
    max-width: 560px;
    margin: 12px 0 18px;
    font-size: clamp(34px, 4vw, 54px);
    font-weight: 820;
    line-height: 1.14;
    letter-spacing: -0.045em;
    color: var(--login-text);
    text-wrap: balance;
  }
}

.context-eyebrow,
.login-card__eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--el-color-primary);
}

.context-intro {
  max-width: 520px;
  margin: 0;
  font-size: 15px;
  line-height: 1.75;
  color: var(--login-text-secondary);
}

.capability-list {
  display: grid;
  padding: 0;
  margin: 34px 0 0;
  list-style: none;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;

  li {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    gap: 10px;
  }
}

.capability-icon {
  display: grid;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  color: var(--el-color-primary);
  background: var(--skit-primary-soft);
  border-radius: 9px;
  place-items: center;
}

.capability-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 13px;
    color: var(--login-text);
  }

  small {
    font-size: 11px;
    line-height: 1.55;
    color: var(--login-text-secondary);
  }
}

.workflow-board {
  margin-top: 36px;
  overflow: hidden;
  background: var(--skit-surface-solid);
  border: 1px solid var(--skit-border-color);
  border-radius: 18px;
  box-shadow: 0 22px 60px -52px var(--skit-shadow-strong);
}

.workflow-board__header {
  display: flex;
  min-height: 46px;
  padding: 0 18px;
  font-size: 12px;
  font-weight: 750;
  border-bottom: 1px solid var(--skit-border-color);
  align-items: center;
  justify-content: space-between;
}

.workflow-status {
  display: inline-flex;
  font-size: 11px;
  font-weight: 650;
  color: var(--skit-text-secondary);
  align-items: center;
  gap: 6px;

  i {
    width: 7px;
    height: 7px;
    background: var(--skit-accent);
    border-radius: 50%;
    box-shadow: 0 0 0 3px var(--skit-accent-soft);
  }
}

.workflow-board ol {
  display: grid;
  padding: 0;
  margin: 0;
  list-style: none;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  li {
    display: grid;
    min-height: 86px;
    padding: 16px;
    border-right: 1px solid var(--skit-border-color);
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;

    &:last-child {
      border-right: 0;
    }

    > span:nth-child(2) {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 4px;
    }

    strong {
      font-size: 12px;
      color: var(--login-text);
    }

    small {
      overflow: hidden;
      font-size: 10px;
      color: var(--login-text-secondary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    > :last-child {
      color: var(--skit-text-placeholder);
    }
  }
}

.workflow-index {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 800;
  color: var(--el-color-primary);
}

.login-card {
  width: 100%;
  padding: 38px 36px 28px;
  background: var(--login-panel);
  border: 1px solid var(--login-border);
  border-radius: 20px;
  box-shadow: 0 32px 80px -58px var(--login-card-shadow);
}

.login-card__heading {
  margin-bottom: 28px;

  h2 {
    margin: 9px 0 8px;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--login-text);
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--login-text-secondary);
  }
}

.security-note {
  display: flex;
  padding-top: 18px;
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--login-text-secondary);
  border-top: 1px solid var(--login-border);
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.page-footer {
  width: min(100%, 1180px);
  margin: 0 auto;
  font-size: 11px;
  color: var(--login-text-secondary);
  text-align: center;
}

@media (width <= 880px) {
  .skit-login-page {
    padding: 20px clamp(16px, 5vw, 32px) 22px;
  }

  .login-shell {
    width: min(100%, 480px);
    padding: 48px 0 40px;
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .product-context {
    max-width: none;
  }

  .product-context h1 {
    margin-bottom: 12px;
    font-size: clamp(30px, 8vw, 42px);
  }

  .context-intro {
    font-size: 14px;
  }

  .capability-list,
  .workflow-board {
    display: none;
  }
}

@media (width <= 560px) {
  .brand-copy small,
  .action-copy,
  .language-copy {
    display: none;
  }

  .brand-mark {
    width: 36px;
    height: 36px;
    padding: 7px;
  }

  .brand-copy strong {
    max-width: 132px;
    font-size: 14px;
  }

  .login-actions {
    gap: 6px;
  }

  .login-action-button {
    min-width: 38px;
    padding: 0 9px;
  }

  .login-shell {
    padding-top: 42px;
  }

  .product-context h1 {
    font-size: 30px;
  }

  .login-card {
    padding: 30px 24px 24px;
    border-radius: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-action-button {
    transition: none;
  }
}
</style>
