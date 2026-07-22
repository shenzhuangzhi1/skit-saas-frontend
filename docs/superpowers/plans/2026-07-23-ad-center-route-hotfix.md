# Ad Center Route Hotfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the advertising-center menu from generating duplicated `/skit/ad-center/skit/...` URLs and preserve old broken bookmarks through redirects.

**Architecture:** Fix the shared `pathResolve` contract so absolute Vue Router children override the parent path while relative children are joined. Add hidden compatibility routes for the two already-published bad URLs and test both the helper and route declarations.

**Tech Stack:** Vue 3, Vue Router 5, TypeScript, Vitest.

## Global Constraints

- Official paths remain `/skit/ad-consumption` and `/skit/ad-record`.
- Existing duplicated paths redirect and never appear in menus.
- The shared helper must keep URL, empty-path, and relative-child behavior.
- Production code follows RED-GREEN-REFACTOR; every fix is preceded by a failing test.

---

### Task 1: Correct absolute path resolution

**Files:**
- Create: `test/unit/router/path-resolve.spec.ts`
- Modify: `src/utils/routerHelper.ts:289-294`

**Interfaces:**
- Consumes: `pathResolve(parentPath: string, path: string): string`.
- Produces: Vue-compatible absolute and relative path resolution for menu, breadcrumb, tags, and TabMenu callers.

- [ ] **Step 1: Write the failing helper contract test**

```ts
import { describe, expect, it } from 'vitest'
import { pathResolve } from '@/utils/routerHelper'

describe('pathResolve', () => {
  it('keeps an absolute child independent from its menu parent', () => {
    expect(pathResolve('/skit/ad-center', '/skit/ad-consumption')).toBe('/skit/ad-consumption')
  })

  it('joins a relative child and preserves empty paths and external URLs', () => {
    expect(pathResolve('/skit/ad-center', 'history')).toBe('/skit/ad-center/history')
    expect(pathResolve('/skit/ad-center', '')).toBe('/skit/ad-center')
    expect(pathResolve('/skit/ad-center', 'https://example.com/report')).toBe(
      'https://example.com/report'
    )
  })
})
```

- [ ] **Step 2: Run the test and verify the absolute-child assertion fails**

Run: `pnpm vitest run test/unit/router/path-resolve.spec.ts`

Expected: FAIL because the current result is `/skit/ad-center/skit/ad-consumption`.

- [ ] **Step 3: Implement the minimal helper fix**

```ts
export const pathResolve = (parentPath: string, path: string) => {
  if (isUrl(path)) return path
  if (!path) return parentPath
  if (path.startsWith('/')) return path.replace(/\/+/g, '/')
  return `${parentPath}/${path}`.replace(/\/+/g, '/')
}
```

- [ ] **Step 4: Re-run the helper test**

Run: `pnpm vitest run test/unit/router/path-resolve.spec.ts`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the helper fix**

```bash
git add src/utils/routerHelper.ts test/unit/router/path-resolve.spec.ts
git commit -m "fix(router): preserve absolute advertising routes"
```

### Task 2: Preserve duplicated production bookmarks

**Files:**
- Create: `test/unit/skit/ad-monitor/route-compatibility.spec.ts`
- Modify: `src/router/modules/remaining.ts`

**Interfaces:**
- Consumes: the official `SkitAdConsumption` and `SkitAdRecord` routes.
- Produces: hidden redirect routes for the two duplicated URLs.

- [ ] **Step 1: Write the failing compatibility-route test**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/router/modules/remaining.ts'), 'utf8')

describe('advertising route compatibility', () => {
  it('redirects both previously generated duplicated paths', () => {
    expect(source).toContain("path: '/skit/ad-center/skit/ad-consumption'")
    expect(source).toContain("redirect: '/skit/ad-consumption'")
    expect(source).toContain("path: '/skit/ad-center/skit/ad-record'")
    expect(source).toContain("redirect: '/skit/ad-record'")
    expect(source.match(/hidden:\s*true/g)?.length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm vitest run test/unit/skit/ad-monitor/route-compatibility.spec.ts`

Expected: FAIL because no compatibility routes exist.

- [ ] **Step 3: Add hidden top-level compatibility redirects**

```ts
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
}
```

- [ ] **Step 4: Run route tests and production build**

Run: `pnpm vitest run test/unit/router/path-resolve.spec.ts test/unit/skit/ad-monitor/route.spec.ts test/unit/skit/ad-monitor/route-compatibility.spec.ts && pnpm build:prod`

Expected: all selected tests pass and Vite exits with code 0.

- [ ] **Step 5: Commit compatibility redirects**

```bash
git add src/router/modules/remaining.ts test/unit/skit/ad-monitor/route-compatibility.spec.ts
git commit -m "fix(router): redirect duplicated advertising links"
```
