# Advertising Access And Revenue Reporting Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep only runtime-effective required fields in advertising access and move official Taku revenue reporting into its own workspace title.

**Architecture:** Preserve existing write-only credential storage and API compatibility, but stop collecting no-op fields in the frontend. Make backend enablement validation provider-specific, extract reporting state into a focused component, and keep readiness as read-only operational status.

**Tech Stack:** Spring Boot, Java 17, Vue 3, Element Plus, TypeScript, Vitest, JUnit 5, Mockito.

## Global Constraints

- Pangle enablement requires App ID plus Server Key; account name and rewarded placement are not collected.
- Taku enablement requires App ID, App Key, and rewarded Placement ID; account name and Taku App Secret are not collected.
- Configured write-only credentials satisfy required validation when the input remains empty.
- Empty secret inputs preserve the current secret.
- Revenue reporting is a sibling workspace title, not an advertising-access subsection.
- Publisher Key is write-only and never echoed.
- Existing backend fields remain backward-compatible until a separate database migration.
- Production code follows RED-GREEN-REFACTOR.

---

### Task 1: Enforce provider-specific backend requirements

**Files:**
- Modify: `../backend/yudao-module-skit/src/test/java/cn/iocoder/yudao/module/skit/service/ad/SkitAdAccountServiceImplTest.java`
- Modify: `../backend/yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/service/ad/SkitAdAccountServiceImpl.java`

**Interfaces:**
- Preserves `saveSettings(Settings)` and credential retention.
- Changes enabled-field validation only.

- [ ] **Step 1: Write failing service tests**

Add these two positive cases and retain the existing invalid-config assertions for a missing effective secret and missing Taku placement:

```java
settings.setPangleEnabled(true);
settings.setPangleAppId("pangle-app");
settings.setPangleAppSecret("server-key");
settings.setPangleUsername("");
settings.setPanglePlacementId("");
settings.setTakuEnabled(false);
service.saveSettings(settings);
```

```java
SkitAdAccountService.Settings taku = disabledSettings();
taku.setTakuEnabled(true);
taku.setTakuAppId("taku-app");
taku.setTakuAppKey("client-key");
taku.setTakuPlacementId("reward-placement");
taku.setTakuUsername("");
taku.setTakuAppSecret("");
service.saveSettings(taku);
verify(accountMapper).updateById(argThat(row -> "TAKU".equals(row.getProvider())
        && "reward-placement".equals(readPlacement(row.getConfigData()))));
```

- [ ] **Step 2: Run the tests and verify the valid Pangle case fails**

Run from `../backend`: `JAVA_HOME=/Users/neo/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home mvn -pl yudao-module-skit -am -Dtest=SkitAdAccountServiceImplTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: FAIL with `AD_ACCOUNT_CONFIG_INVALID` because the old code requires account and placement.

- [ ] **Step 3: Implement provider-specific readiness**

```java
boolean configured = PROVIDER_PANGLE.equals(provider)
        ? StrUtil.isAllNotBlank(normalizedAppId, effectiveAppSecret)
        : StrUtil.isAllNotBlank(normalizedAppId, normalizedPlacementId, effectiveAppKey);
if (Boolean.TRUE.equals(enabled) && !configured) {
    throw exception(AD_ACCOUNT_CONFIG_INVALID, PROVIDER_PANGLE.equals(provider)
            ? "PANGLE 启用前必须配置 App ID 和内容接口 Server Key"
            : "TAKU 启用前必须配置 App ID、App Key 和激励视频广告位");
}
```

- [ ] **Step 4: Run the service tests**

Run the command from Step 2.

Expected: all `SkitAdAccountServiceImplTest` tests pass.

- [ ] **Step 5: Commit backend validation**

```bash
git add yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/service/ad/SkitAdAccountServiceImpl.java yudao-module-skit/src/test/java/cn/iocoder/yudao/module/skit/service/ad/SkitAdAccountServiceImplTest.java
git commit -m "fix(ad): validate only runtime advertising fields"
```

### Task 2: Remove duplicate/no-op agent creation fields

**Files:**
- Modify: `test/unit/skit/tenant/components.spec.ts`
- Modify: `src/views/skit/tenant/AgentForm.vue`
- Modify: `src/api/skit/tenant/index.ts`

**Interfaces:**
- Agent creation sends identity, status, and expiry only.
- Advertising setup happens after creation in the selected agent workspace.

- [ ] **Step 1: Write the failing source contract**

```ts
expect(agentFormSource).not.toContain('pangleUsername')
expect(agentFormSource).not.toContain('panglePlacementId')
expect(agentFormSource).not.toContain('takuUsername')
expect(agentFormSource).not.toContain('takuAppSecret')
expect(agentFormSource).toContain('创建代理商后，请在代理商工作台的“广告接入”中完成运行配置')
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run test/unit/skit/tenant/components.spec.ts`

Expected: FAIL because the current creation form contains all four no-op fields.

- [ ] **Step 3: Remove advertising tabs from agent creation**

Replace both provider tabs with this information block and delete the provider-form state, validators, clear handlers, and secret payload builder:

```vue
<el-alert
  class="mt-16px"
  :closable="false"
  show-icon
  title="创建代理商后，请在代理商工作台的“广告接入”中完成运行配置。"
  type="info"
/>
```

Narrow the client create contract to:

```ts
export interface TenantAgentCreateReqVO {
  name: string
  mobile: string
  password: string
  status: number
  expireTime: number
}
```

- [ ] **Step 4: Re-run the component contract**

Run the command from Step 2.

Expected: component contract passes.

- [ ] **Step 5: Commit the focused agent form**

```bash
git add src/views/skit/tenant/AgentForm.vue src/api/skit/tenant/index.ts test/unit/skit/tenant/components.spec.ts
git commit -m "refactor(admin): move ad setup out of agent creation"
```

### Task 3: Extract the revenue-reporting editor

**Files:**
- Create: `src/views/skit/tenant/ReportingEditor.vue`
- Modify: `src/views/skit/tenant/AdAccessEditor.vue`
- Modify: `src/views/skit/tenant/index.vue`
- Modify: `test/unit/skit/tenant/workspace-shell.spec.ts`
- Modify: `test/unit/skit/tenant/components.spec.ts`

**Interfaces:**
- `ReportingEditor` consumes `target: ManagementTenantTarget`.
- `AdAccessEditor` no longer fetches or saves reporting configuration.

- [ ] **Step 1: Write failing workspace tests**

```ts
expect(source.match(/name="reporting"/g)).toHaveLength(2)
expect(source).toContain('<ReportingEditor')
expect(adAccessSource).not.toContain('getTenantReportingConfiguration')
expect(adAccessSource).not.toContain('saveTenantReportingConfiguration')
expect(reportingSource).toContain('Publisher Key')
expect(reportingSource).not.toContain(':model-value="reportingForm.appId"')
expect(reportingSource).not.toContain(':model-value="reportingForm.placementId"')
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run test/unit/skit/tenant/workspace-shell.spec.ts test/unit/skit/tenant/components.spec.ts`

Expected: FAIL because reporting is embedded in `AdAccessEditor`.

- [ ] **Step 3: Create `ReportingEditor.vue`**

Create the component with the existing `sanitizeReportingConfiguration`, `getTenantReportingConfiguration`, and `saveTenantReportingConfiguration` contracts. Its editable form contains exactly:

```vue
<el-form v-if="form" label-width="132px">
  <el-form-item label="报表时区" required>
    <el-select v-model="form.reportTimezone">
      <el-option label="UTC-8" value="UTC-8" />
      <el-option label="UTC+8" value="UTC+8" />
      <el-option label="UTC+0" value="UTC+0" />
    </el-select>
  </el-form-item>
  <el-form-item label="ISO 币种" required>
    <el-input v-model="form.currency" maxlength="3" />
  </el-form-item>
  <el-form-item label="金额精度" required>
    <el-input-number v-model="form.amountScale" :max="18" :min="0" />
  </el-form-item>
  <el-form-item label="Publisher Key" :required="!form.credentialConfigured">
    <InputPassword v-model="form.publisherKey" autocomplete="new-password" maxlength="4096" />
  </el-form-item>
  <el-form-item label="变更原因" required>
    <el-input v-model="form.reason" maxlength="500" show-word-limit type="textarea" />
  </el-form-item>
</el-form>
```

Display `appId`, `placementId`, `adFormat`, `credentialVersion`, and `permissionVerifiedAt` in an `el-descriptions` status block above the form, not as disabled form inputs.

- [ ] **Step 4: Add sibling workspace tabs**

Add this tab once for each role branch in `tenant/index.vue`:

```vue
<el-tab-pane label="收益报表" name="reporting" lazy>
  <ReportingEditor :target="tenantWorkspaceTarget(false, selfInvitation.tenantId)" />
</el-tab-pane>
```

Use the platform target for the super-admin branch. Remove reporting imports, state, load, and save from `AdAccessEditor`.

- [ ] **Step 5: Run workspace tests**

Run the command from Step 2.

Expected: all selected tests pass.

- [ ] **Step 6: Commit the reporting split**

```bash
git add src/views/skit/tenant/ReportingEditor.vue src/views/skit/tenant/AdAccessEditor.vue src/views/skit/tenant/index.vue test/unit/skit/tenant/workspace-shell.spec.ts test/unit/skit/tenant/components.spec.ts
git commit -m "feat(admin): split revenue reporting from ad access"
```

### Task 4: Reduce advertising access to effective required fields

**Files:**
- Modify: `src/views/skit/tenant/workspaceModel.ts`
- Modify: `src/views/skit/tenant/AdAccessEditor.vue`
- Modify: `src/api/skit/tenant/index.ts`
- Modify: `test/unit/skit/tenant/workspace-model.spec.ts`
- Modify: `test/unit/skit/tenant/components.spec.ts`
- Modify: `test/unit/skit/tenant/api-contract.spec.ts`

**Interfaces:**
- Produces `validateAdAccountForm(form): string[]`.
- Produces a write payload containing only enabled flags, Pangle App ID/optional new Server Key, and Taku App ID/Placement ID/optional new App Key.

- [ ] **Step 1: Write failing form-model tests**

```ts
expect(validateAdAccountForm({
  ...empty,
  pangleEnabled: true,
  pangleAppId: 'p-angle',
  pangleSecretConfigured: true
})).toEqual([])

expect(validateAdAccountForm({
  ...empty,
  takuEnabled: true,
  takuAppId: 'taku-app',
  takuPlacementId: '',
  takuAppKeyConfigured: true
})).toContain('Taku 激励视频 Placement ID 不能为空')
```

Assert the payload has no `pangleUsername`, `panglePlacementId`, `takuUsername`, or `takuAppSecret`.

- [ ] **Step 2: Run model/API tests and verify failure**

Run: `pnpm vitest run test/unit/skit/tenant/workspace-model.spec.ts test/unit/skit/tenant/api-contract.spec.ts test/unit/skit/tenant/components.spec.ts`

Expected: FAIL because current forms and payloads contain no-op fields.

- [ ] **Step 3: Implement the minimal safe form model**

```ts
export interface SafeAdAccountForm {
  pangleAppId: string
  pangleAppSecret: string
  pangleEnabled: boolean
  pangleSecretConfigured: boolean
  takuAppId: string
  takuAppKey: string
  takuPlacementId: string
  takuEnabled: boolean
  takuAppKeyConfigured: boolean
}
```

The validator treats `secretConfigured || Boolean(newSecret.trim())` as credential-ready. The payload omits empty secrets so the backend retains existing values.

- [ ] **Step 4: Update the advertising editor**

Replace the account form fields with the safe-form properties listed in Step 3, using `:required="accountForm.pangleEnabled"` and `:required="accountForm.takuEnabled"`. At the top of `saveAccount`, run:

```ts
const validationErrors = validateAdAccountForm(accountForm.value)
if (validationErrors.length) {
  ElMessage.warning(validationErrors[0])
  return
}
```

Retain the existing readiness cards. Resolve the capability account without report state:

```ts
const capabilityAdAccountId = computed(() =>
  resolveTenantAdAccountId(readiness.value, undefined)
)
```

- [ ] **Step 5: Run all frontend tests, type checking, and production build**

Run: `pnpm test:unit && pnpm ts:check && pnpm build:prod`

Expected: all unit tests pass, vue-tsc exits 0, and Vite production build exits 0.

- [ ] **Step 6: Run backend regression suite**

Run from `../backend`: `JAVA_HOME=/Users/neo/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home mvn -pl yudao-module-skit -am -Dtest=SkitAdAccountServiceImplTest,SkitTenantBusinessControllerTest,SkitMemberServiceImplTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: all selected backend tests pass.

- [ ] **Step 7: Commit advertising access simplification**

```bash
git add src/views/skit/tenant/workspaceModel.ts src/views/skit/tenant/AdAccessEditor.vue src/api/skit/tenant/index.ts test/unit/skit/tenant/workspace-model.spec.ts test/unit/skit/tenant/components.spec.ts test/unit/skit/tenant/api-contract.spec.ts
git commit -m "refactor(admin): keep only effective ad access fields"
```
