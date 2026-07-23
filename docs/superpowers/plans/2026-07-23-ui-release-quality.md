# Admin UI Release Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove misleading failure states and raise the admin frontend's login, dialog, and generic management UI to release quality without changing business behavior.

**Architecture:** Keep the existing Vue views and APIs. Add explicit view-state branches at the two editors, harden the shared dialog once for all consumers, restyle the login shell around existing authentication logic, and derive management-page hierarchy from `pageConfig`.

**Tech Stack:** Vue 3, TypeScript, Element Plus, SCSS, Vitest, Vite.

## Global Constraints

- Real data failures must remain visible; never substitute mock or initialized data.
- Existing API, auth, route, permission, and tenant-scope contracts stay unchanged.
- Reuse current design tokens and support light, dark, mobile, and reduced-motion modes.
- Production code follows RED-GREEN-REFACTOR.

---

### Task 1: Make editor loading truthful

**Files:**
- Modify: `src/views/skit/tenant/AppBuildMaterialEditor.vue`
- Modify: `src/views/skit/tenant/AppReleaseEditor.vue`
- Test: `test/unit/skit/tenant/`

- [x] Add failing contracts for mutually exclusive loading, failure, and ready states.
- [x] Add explicit error state and retry action to both editors.
- [x] Confirm new-mode initialization and existing save behavior remain intact.
- [x] Run the targeted tenant editor tests.

### Task 2: Harden the shared dialog

**Files:**
- Modify: `src/components/Dialog/src/Dialog.vue`
- Test: `test/unit/`

- [x] Add failing accessibility and responsive-width contracts.
- [x] Replace clickable header icons with named buttons and hidden decorative icons.
- [x] Clamp non-fullscreen width to the viewport and add focus-visible styling.
- [x] Run the targeted dialog tests.

### Task 3: Rebuild the login presentation

**Files:**
- Modify: `src/views/Login/Login.vue`
- Modify: `src/views/Login/components/LoginForm.vue`
- Create: `src/views/Login/components/captchaSizing.ts`
- Modify: `src/components/Verifition/src/Verify.vue`
- Modify: `src/components/Verifition/src/Verify/VerifySlide.vue`
- Modify: `index.html`
- Test: `test/unit/`

- [x] Add failing login UI and form-semantic contracts.
- [x] Build the two-column short-drama operations shell with a mobile single-column fallback.
- [x] Preserve auth logic and add control/input accessibility semantics.
- [x] Fit the captcha to its real mobile box model without re-requesting it during resize.
- [x] Run the targeted login tests.

### Task 4: Add management-page hierarchy and control semantics

**Files:**
- Modify: `src/views/skit/admin/AdminTable.vue`
- Create: `test/unit/skit/admin-table-ui.spec.ts`

- [x] Add failing source contracts for title, description, labels, and native disabled states.
- [x] Render the page header from `pageConfig`.
- [x] Add names and mixed-state semantics to selection and icon-only controls.
- [x] Replace visual-only disabled classes with native disabled behavior.
- [x] Run the targeted admin table tests.

### Task 5: Verify and review the integrated UI

- [x] Run `pnpm test:unit`.
- [x] Run `pnpm ts:check`.
- [x] Run `pnpm build:prod`.
- [x] Inspect the local login in light/dark modes at 1440, 390, and 320px; verify admin hierarchy and controls through focused contracts.
- [x] Review the scoped diff for regressions, stale duplicates, TODOs, and accidental business changes.
