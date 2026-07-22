# Agent And App User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the misleading single user menu with separate agent and App-user pages while enforcing global-versus-tenant scope on the server.

**Architecture:** Reuse the existing guarded member APIs for one tenant, add a platform-only global page branch, and enrich rows with tenant metadata. A dedicated user page owns the dynamic agent filter; the existing tenant workspace remains the agent-management page.

**Tech Stack:** Spring Boot, MyBatis Plus, Java 17, Vue 3, Element Plus, TypeScript, Vitest, JUnit 5, Mockito.

## Global Constraints

- Super administrators see all App users and may narrow results by a dynamically loaded agent.
- Tenant administrators are bound to their login tenant by `SkitAdminTenantScopeGuard`.
- The client never treats a request-supplied `tenantId` as authority.
- Only `super_admin` may create agents.
- `/skit/user` remains a hidden compatibility redirect.
- No fixed agent list and no mock user rows.
- Production code follows RED-GREEN-REFACTOR.

---

### Task 1: Add the guarded global member page

**Files:**
- Modify: `../backend/yudao-module-skit/src/test/java/cn/iocoder/yudao/module/skit/controller/admin/tenant/SkitTenantBusinessControllerTest.java`
- Modify: `../backend/yudao-module-skit/src/test/java/cn/iocoder/yudao/module/skit/service/member/SkitMemberServiceImplTest.java`
- Modify: `../backend/yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/controller/admin/tenant/SkitTenantBusinessController.java`
- Modify: `../backend/yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/service/member/SkitMemberService.java`
- Modify: `../backend/yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/service/member/SkitMemberServiceImpl.java`
- Modify: `../backend/yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/dal/mysql/member/SkitMemberMapper.java`

**Interfaces:**
- Produces: `getGlobalMemberPage(PageParam, String, Integer): PageResult<MemberView>`.
- Produces row fields: `tenantId`, `tenantCode`, `tenantName`, and `agentName`.
- Preserves: `getMemberPage(...)` for a guarded single-tenant read.

- [ ] **Step 1: Write failing controller tests for both branches**

Add a test which stubs `readTenantOrGlobal`, invokes `controller.getMemberPage(req)`, and verifies the tenant callback calls `getMemberPage` while the global supplier calls `getGlobalMemberPage`:

```java
@Test
void memberPageUsesGuardedTenantOrPlatformGlobalBranch() {
    SkitTenantBusinessController.MemberPageReqVO request =
            new SkitTenantBusinessController.MemberPageReqVO();
    request.setPageNo(1);
    request.setPageSize(20);
    when(adminTenantScopeGuard.readTenantOrGlobal(eq(null), eq(true), any(), any()))
            .thenAnswer(invocation -> ((Supplier<?>) invocation.getArgument(3)).get());
    when(memberService.getGlobalMemberPage(any(), eq(null), eq(null)))
            .thenReturn(new PageResult<>(Collections.emptyList(), 0L));

    controller.getMemberPage(request);

    verify(memberService).getGlobalMemberPage(request, null, null);
    verify(adminTenantScopeGuard).readTenantOrGlobal(eq(null), eq(true), any(), any());
}
```

- [ ] **Step 2: Run the controller test and verify compilation fails on the missing method**

Run from `../backend`: `JAVA_HOME=/Users/neo/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home mvn -pl yudao-module-skit -am -Dtest=SkitTenantBusinessControllerTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: FAIL because `getGlobalMemberPage` does not exist.

- [ ] **Step 3: Add explicit-tenant mapper helpers and the global service contract**

```java
PageResult<MemberView> getGlobalMemberPage(PageParam pageParam, String keyword, Integer status);
```

```java
@Select("SELECT * FROM `skit_member` WHERE `tenant_id`=#{tenantId} AND `id`=#{id} AND `deleted`=b'0'")
SkitMemberDO selectByTenantAndId(@Param("tenantId") Long tenantId, @Param("id") Long id);

default Long selectCountByTenantAndInviterId(Long tenantId, Long inviterId) {
    return selectCount(new LambdaQueryWrapperX<SkitMemberDO>()
            .eq(SkitMemberDO::getTenantId, tenantId)
            .eq(SkitMemberDO::getInviterId, inviterId));
}
```

- [ ] **Step 4: Implement the platform global query and tenant metadata enrichment**

```java
@Override
public PageResult<MemberView> getGlobalMemberPage(PageParam pageParam, String keyword, Integer status) {
    return TenantUtils.executeIgnore(() -> convertPage(memberMapper.selectPage(pageParam, keyword, status)));
}
```

Extend `MemberView` with tenant metadata and populate it from `member.getTenantId()`, `tenantService.getTenant(tenantId)`, and `agentMapper.selectByTenantId(tenantId)`. Parent and child queries must include the row tenant ID.

- [ ] **Step 5: Route omitted tenant IDs through `readTenantOrGlobal`**

```java
return success(adminTenantScopeGuard.readTenantOrGlobal(reqVO.getTenantId(), true,
        scope -> memberService.getMemberPage(reqVO, reqVO.getKeyword(), reqVO.getStatus()),
        () -> memberService.getGlobalMemberPage(reqVO, reqVO.getKeyword(), reqVO.getStatus())));
```

- [ ] **Step 6: Run backend member and controller tests**

Run from `../backend`: `JAVA_HOME=/Users/neo/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home mvn -pl yudao-module-skit -am -Dtest=SkitTenantBusinessControllerTest,SkitMemberServiceImplTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: both test classes pass.

- [ ] **Step 7: Commit the guarded backend query**

```bash
git add yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/controller/admin/tenant/SkitTenantBusinessController.java yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/service/member/SkitMemberService.java yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/service/member/SkitMemberServiceImpl.java yudao-module-skit/src/main/java/cn/iocoder/yudao/module/skit/dal/mysql/member/SkitMemberMapper.java yudao-module-skit/src/test/java/cn/iocoder/yudao/module/skit/controller/admin/tenant/SkitTenantBusinessControllerTest.java yudao-module-skit/src/test/java/cn/iocoder/yudao/module/skit/service/member/SkitMemberServiceImplTest.java
git commit -m "feat(admin): add tenant-safe global member page"
```

### Task 2: Add the dynamic App-user page

**Files:**
- Create: `src/views/skit/user/index.vue`
- Create: `test/unit/skit/user/management.spec.ts`
- Modify: `src/api/skit/tenant/index.ts`
- Modify: `src/views/skit/tenant/MemberList.vue`

**Interfaces:**
- Produces: `MemberManagementTarget = ManagementTenantTarget | { kind: 'all' }`.
- Produces: `getManagedTenantMemberPage(target, params)` supporting the read-only all-tenant target.
- Consumes: dynamically searched `getTenantAgentPage` results.

- [ ] **Step 1: Write failing frontend contracts**

The test imports the API with a mocked request client and asserts `{ kind: 'all' }` sends no `tenantId`; it also mounts the new page and verifies a super administrator sees `TenantScopeBar` while a tenant administrator gets an own-tenant target.

```ts
expect(get).toHaveBeenCalledWith({
  url: '/skit/tenant/member/page',
  params: { pageNo: 1, pageSize: 10 },
  skipErrorMessage: true
})
expect(source).toContain('<TenantScopeBar')
expect(source).toContain('getTenantAgentPage')
expect(source).toContain('<MemberList')
```

- [ ] **Step 2: Run the new test and verify it fails**

Run: `pnpm vitest run test/unit/skit/user/management.spec.ts`

Expected: FAIL because the user page and all-tenant target do not exist.

- [ ] **Step 3: Add the member read target and tenant row fields**

```ts
export type MemberManagementTarget = ManagementTenantTarget | { kind: 'all' }

export interface TenantMemberVO {
  id: number
  userId: number
  username: string
  nickname?: string
  mobile: string
  inviteCode: string
  parentId?: number
  parentUserId?: number
  parentName?: string
  parentNickname?: string
  inviterId?: number
  level?: number
  depth?: number
  status: number
  childCount?: number
  createTime?: number
  loginTime?: number
  tenantId: number
  tenantCode?: string
  tenantName?: string
  agentName?: string
}
```

Map `{ kind: 'all' }` to `{}` only in the page GET. Detail and mutation clients continue to require `ManagementTenantTarget`.

- [ ] **Step 4: Make `MemberList` safe for all-tenant reads**

Add `showTenant`; render an “所属代理商” column when true. For detail, tree, status, and password actions, resolve an all-scope row to `{ kind: 'platform', tenantId: row.tenantId }` before calling existing guarded APIs. Store the resolved target with the selected tree root so descendant calls never switch tenant.

- [ ] **Step 5: Build the dynamic user page**

Use `useTenantScope`, `TenantScopeBar`, `getTenantAgentPage({ keyword, pageNo: 1, pageSize: 100 })`, and `getTenantInvitation()`. Convert scopes as follows:

```ts
const memberTarget = computed<TenantApi.MemberManagementTarget>(() => {
  if (scopeModel.value.kind === 'all') return { kind: 'all' }
  if (scopeModel.value.kind === 'single') {
    return { kind: 'platform', tenantId: scopeModel.value.targetTenantId }
  }
  return { kind: 'own', tenantId: scopeModel.value.targetTenantId }
})
```

- [ ] **Step 6: Run user and tenant-scope tests**

Run: `pnpm vitest run test/unit/skit/user/management.spec.ts test/unit/skit/tenant-scope.spec.ts test/unit/skit/tenant/components.spec.ts`

Expected: all selected tests pass.

- [ ] **Step 7: Commit the App-user page**

```bash
git add src/api/skit/tenant/index.ts src/views/skit/tenant/MemberList.vue src/views/skit/user/index.vue test/unit/skit/user/management.spec.ts
git commit -m "feat(admin): add dynamic tenant-scoped user management"
```

### Task 3: Replace the sidebar user route

**Files:**
- Modify: `src/router/modules/remaining.ts`
- Modify: `src/views/skit/admin/pageConfig.ts`
- Create: `test/unit/skit/user/routes.spec.ts`

**Interfaces:**
- Produces routes: `SkitAgentManagement` and `SkitAppUserManagement` under `SkitUserCenter`.
- Preserves `/skit/user` as a hidden redirect.

- [ ] **Step 1: Write the failing route test**

```ts
expect(source).toContain("path: 'user-center'")
expect(source).toContain("title: '代理商管理'")
expect(source).toContain("title: '用户管理'")
expect(source).toContain("redirect: '/skit/user-center/agents'")
expect(source).toContain("path: 'user'")
```

- [ ] **Step 2: Run it and verify it fails**

Run: `pnpm vitest run test/unit/skit/user/routes.spec.ts`

Expected: FAIL on the missing parent and child routes.

- [ ] **Step 3: Add the route hierarchy and compatibility redirect**

```ts
{
  path: 'user-center',
  component: getParentLayout(),
  redirect: '/skit/user-center/agents',
  name: 'SkitUserCenter',
  meta: { title: '用户管理', icon: 'ep:user', alwaysShow: true, roles: ['super_admin', 'tenant_admin'] },
  children: [
    { path: 'agents', component: () => import('@/views/skit/tenant/index.vue'), name: 'SkitAgentManagement', meta: { title: '代理商管理', roles: ['super_admin', 'tenant_admin'] } },
    { path: 'users', component: () => import('@/views/skit/user/index.vue'), name: 'SkitAppUserManagement', meta: { title: '用户管理', roles: ['super_admin', 'tenant_admin'] } }
  ]
},
{ path: 'user', redirect: '/skit/user-center/agents', name: 'SkitUserLegacyRedirect', meta: { hidden: true, noTagsView: true } }
```

Set the `/skit` route to `redirect: '/skit/user-center/agents'`. Replace the dashboard item with:

```ts
{ key: 'user', title: '代理商管理', routeName: 'SkitAgentManagement' }
```

- [ ] **Step 4: Run routes, full unit tests, and type checking**

Run: `pnpm vitest run test/unit/skit/user/routes.spec.ts && pnpm test:unit && pnpm ts:check`

Expected: all unit tests pass and vue-tsc exits with code 0.

- [ ] **Step 5: Commit sidebar routes**

```bash
git add src/router/modules/remaining.ts src/views/skit/admin/pageConfig.ts test/unit/skit/user/routes.spec.ts
git commit -m "feat(admin): split agent and app user navigation"
```
