# A-166 Pack source-only no-op guard

- **date**: 2026-07-01
- **scope**: source repo の自己開発情報を Pack artifact に混入させない同期不変条件

## 背景

source repo では監査、PLAN、設計、test-design、handover が継続的に更新される。一方、Pack repo は consumer が取得する clean artifact であり、自己開発用の `.ut-tdd/audit`、`docs/plans`、`docs/design/harness`、`docs/test-design`、`docs/handover` を含めない。

## 固定した不変条件

`U-SETUP-011c2` を追加し、source-only doc が増減しても `buildCleanDistributionPlan(...).artifactPaths` と `buildPackSyncPlan(...).copyPlan[].artifactPath` が変化しないことを検証する。

これにより、ここで更新した監査・設計・引き継ぎ情報は Pack へ混入せず、Pack 反映は配布対象 artifact の変更だけに限定される。

## 検証

- `bun run vitest run tests\setup.test.ts -t "U-SETUP-011c2|U-SETUP-011c|U-SETUP-011b|U-SETUP-011d" --reporter=dot`: pass (4 passed / 16 skipped)

## 境界

これは clean artifact set の不変条件であり、Pack repo への commit / push、署名 tarball publish、PO UAT、post-release telemetry を代替しない。
