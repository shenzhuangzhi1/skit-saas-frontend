import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const read = (path) => readFileSync(resolve(repoRoot, path), "utf8");
const readJson = (path) => JSON.parse(read(path));

const readme = read("README.md");
const packageJson = readJson("package.json");
const inventory = readJson("config/product-source-inventory.json");
const routeSource = read(inventory.productRouteContract.source);
const verifyLocal = read("scripts/verify-local.sh");

const markdownLinks = [...readme.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)].map(
  ([, label, target]) => `${label} ${target}`,
);
const headings = [...readme.matchAll(/^#{1,6}\s+(.+)$/gm)].map(
  ([, heading]) => heading,
);

test("legacy README image assets are absent from the tracked product", () => {
  const trackedLegacyImages = execFileSync(
    "git",
    ["ls-files", "-z", "--", ".image"],
    { cwd: repoRoot, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);

  const trackedPreview = trackedLegacyImages.slice(0, 10).join("\n");
  assert.equal(
    trackedLegacyImages.length,
    0,
    `the retired README screenshot tree still has ${trackedLegacyImages.length} tracked files (first 10):\n${trackedPreview}`,
  );

  // Build the search token at runtime so this contract does not match itself.
  const legacyImageReference = [".image", "/"].join("");
  const referenceSearch = spawnSync(
    "git",
    ["grep", "-n", "-I", "-F", legacyImageReference, "--", "."],
    { cwd: repoRoot, encoding: "utf8" },
  );

  assert.equal(
    referenceSearch.status,
    1,
    referenceSearch.status === 0
      ? `tracked files still reference retired README assets:\n${referenceSearch.stdout}`
      : `git grep failed: ${referenceSearch.stderr}`,
  );
});

test("README identifies this repository and its static product boundary", () => {
  assert.ok(
    /^# Skit SaaS 管理前端$/m.test(readme),
    "README must use the Skit product title",
  );
  assert.ok(readme.includes(`\`${packageJson.name}\``));
  assert.ok(readme.includes(packageJson.homepage));

  const declaredRouteCount = inventory.productRouteContract.recordCount;
  assert.equal(declaredRouteCount, 32);
  assert.ok(readme.includes(`**${declaredRouteCount} 条静态路由记录**`));

  for (const path of [
    inventory.productRouteContract.source,
    "build/product-boundary.json",
    "config/product-source-inventory.json",
  ]) {
    assert.ok(readme.includes(`](${path})`), `README must link to ${path}`);
  }

  const declaredRouteNames = routeSource.match(
    /^\s*name:\s*(?:'[^']*'|PRODUCT_[A-Z0-9_]+),?\s*$/gm,
  );
  assert.equal(
    declaredRouteNames?.length,
    declaredRouteCount,
    "README route count must remain backed by productRoutes.ts",
  );
});

test("README toolchain and verification commands follow package.json", () => {
  assert.ok(readme.includes(packageJson.engines.node));
  const pinnedPnpm = packageJson.packageManager.split("+")[0];
  assert.ok(readme.includes(pinnedPnpm));
  assert.ok(
    verifyLocal.includes("Node.js >=20.19.0 (Node.js 22 LTS recommended)"),
  );
  assert.ok(
    verifyLocal.includes(`Corepack and use the pinned ${pinnedPnpm}`),
  );
  assert.doesNotMatch(verifyLocal, /pnpm\s*10\+/i);

  for (const command of [
    "pnpm install --frozen-lockfile",
    "pnpm dev",
    "pnpm test:unit",
    "node --test test/*.test.mjs",
    "pnpm ts:check",
    "pnpm lint",
    "pnpm build:prod",
    "pnpm verify:product-build",
  ]) {
    assert.ok(readme.includes(`\`${command}\``) || readme.includes(command));
  }
});

test("README does not advertise retired domains as headings or links", () => {
  const retiredProductClaim =
    /(?:^|[^A-Za-z])(?:BPM|OA|ERP|WMS|CRM|MES|IoT|IM)(?:[^A-Za-z]|$)|商城|工作流程|支付系统|会员中心|数据报表|大屏设计|大模型|物联网|即时通讯/i;

  for (const heading of headings) {
    assert.doesNotMatch(
      heading,
      retiredProductClaim,
      `retired domain must not be a README heading: ${heading}`,
    );
  }

  for (const link of markdownLinks) {
    assert.doesNotMatch(
      link,
      retiredProductClaim,
      `retired domain must not be advertised by a README link: ${link}`,
    );
  }
});

test("README keeps security, live-chain, license, and upstream boundaries explicit", () => {
  assert.ok(
    /管理前端[\s\S]{0,180}不等于[\s\S]{0,180}广告闭环 E2E/.test(readme),
    "README must distinguish management checks from live advertising E2E",
  );
  assert.match(readme, /所有 `VITE_` 变量都可能进入浏览器产物/);
  assert.doesNotMatch(readme, /VITE_APP_DEFAULT_LOGIN_(?:USERNAME|PASSWORD)/);
  assert.match(readme, /MIT License/);
  assert.ok(readme.includes("](THIRD_PARTY_NOTICES.md)"));
  assert.match(readme, /Yudao UI Admin Vue3/);
  assert.match(readme, /vue-element-plus-admin/);
});
