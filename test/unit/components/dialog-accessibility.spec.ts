import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/components/Dialog/src/Dialog.vue'), 'utf8')

const template = source.slice(source.indexOf('<template>'), source.indexOf('</template>'))
const style = source.slice(source.indexOf('<style'))

describe('shared Dialog accessibility', () => {
  it('connects the custom heading to the dialog accessible name', () => {
    expect(template).toContain('#header="{ close, titleId, titleClass }"')
    expect(template).toContain(':id="titleId"')
    expect(template).toContain(':class="titleClass"')
  })

  it('exposes fullscreen and close actions as labelled semantic buttons', () => {
    const actionButtons = template.match(/<button[\s\S]*?<\/button>/g) ?? []

    expect(actionButtons).toHaveLength(2)

    const fullscreenButton = actionButtons.find((button) => button.includes('最大化弹窗'))
    expect(fullscreenButton).toBeDefined()
    expect(fullscreenButton).toContain('type="button"')
    expect(fullscreenButton).toContain("'还原弹窗'")
    expect(fullscreenButton).toContain('@click="toggleFull"')
    expect(fullscreenButton).toContain('aria-hidden="true"')

    const closeButton = actionButtons.find((button) => button.includes('关闭弹窗'))
    expect(closeButton).toBeDefined()
    expect(closeButton).toContain('type="button"')
    expect(closeButton).toContain('@click.stop="close"')
    expect(closeButton).toContain('aria-hidden="true"')
  })

  it('keeps keyboard focus and a practical touch target visible', () => {
    expect(style).toContain('.com-dialog__action')
    expect(style).toMatch(/min-width:\s*40px/)
    expect(style).toMatch(/min-height:\s*40px/)
    expect(style).toContain('&:focus-visible')
    expect(style).toMatch(/outline:\s*2px solid var\(--el-color-primary\)/)
  })

  it('caps custom widths on compact screens without constraining fullscreen mode', () => {
    expect(template).toContain(':width="width"')
    expect(template).toContain(':fullscreen="isFullscreen"')
    expect(style).toContain('max-width: calc(100vw - 32px)')
    expect(style).toMatch(/:not\(\.is-fullscreen\)/)
  })
})
