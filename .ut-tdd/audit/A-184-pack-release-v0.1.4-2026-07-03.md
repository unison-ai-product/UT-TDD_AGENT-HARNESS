# A-184 - Pack Release v0.1.4 (version-up release 運用の初回実施)

- **date**: 2026-07-03
- **scope**: consumer-flow recovery (A-172 C-1/C-2、PLAN-RECOVERY-06 / L7-359 / L7-361) 後の初 Pack release。
  version 乖離解消 (package.json 0.1.0 → 0.1.4) + CHANGELOG 導入を含む (A-172 minor D 隣接 / E 項目の一部クローズ)。
- **approval**: PO 承認 2026-07-03 (「それで対応して」= version-up release 運用初回実施、および先行の Pack sync push 承認)。

## Release

- **release**: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack/releases/tag/v0.1.4
- **assets**: `v0.1.4.tar.gz` (1,039,107 bytes) / `v0.1.4.tar.gz.sha256` / `v0.1.4.manifest.json`
- **sha256**: `c4f4422534f1df262f1f61e71e51de7daeb1524bbc30ab2e6531160f96703be0  v0.1.4.tar.gz`
- **manifest**: ok=true / artifactCount=472 / missingRequired=0 / denylistViolations=0 / signatureCreated=false (署名 = 外部境界、従来どおり明示)
- **Pack commits**: `57c8fcb chore: sync clean pack fffb132` → `a13eb78 chore: sync clean pack 60a3272` (release 対象)。Pack CI harness-check 両方 success。
- **source commits**: `9eed81b` (consumer profile, Codex commit) / `ec07259` (setup 非対話ハング + tar 可搬性, PLAN-L7-361) / `fffb132` (PACK_SAFE_TEST_SCRIPT 同期) / `bc68465` (version 0.1.4 + CHANGELOG) / `d50ae5c` (canon 登録) / `57f1e36`+`60a3272` (RECOVERY-06 confirmed + evidence 整合)。

## Verification (実物・実走)

- 実 tarball → fresh consumer 実走 (extract → `bun install` → `setup --solo` → 生成 CI コマンド列):
  guard / typecheck / `bun run test` 60 tests / audit quality / `doctor --setup-smoke` checked=22 failed=0 すべて green。
  CI runner 模擬 (dir 移動で setup 機絶対パス無効化) で wrapper repo-local 解決 green。
- Pack checkout `bun run test:pack` = 7 files / 67 tests green (toolchain-pin gate 含む)。
- tarball 内容確認: `CHANGELOG.md` 同梱 / `package.json` version=0.1.4 / v1.1 旧構想 doc 非同梱。
- source 側 doctor full green (`60a3272`)。

## Notes / 残 open

- version-up **駆動モデル** (capability の将来版保全) とは別物であることを確認済み — 本件は distribution release 運用。
- A-171 External Close Checklist の PO/user UAT + real consumer tag-pin update は未実施 (v0.1.4 が tag-pin 更新シナリオの対象に使える)。
- 残 minor: README badge `internal (private)` vs MIT 公開の矛盾 (A-172 D) / CI ubuntu 単独 (L7-235 draft) / git hooks 配布 (L7-347 draft) / 配布 gate の本文レベル検査 (A-172 A)。
