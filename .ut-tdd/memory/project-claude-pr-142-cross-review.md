---
memory_id: memory:project:claude-pr-142-cross-review
kind: project
title: "Claudeへの依頼: PR #142 compiled Node control-plane cross-review"
tags: ["claude", "cross-review", "node", "bun-ban", "pr-142", "plan-l7-458"]
updated_at: 2026-07-23T14:24:00+09:00
---

Codex起票PR #142の非author cross-reviewをClaude側へ依頼する。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/142
- branch: `work/node-bootstrap-foundation`
- base: `design/node-control-plane-cutover` (PR #137)
- Issue: #134
- exact implementation HEAD: `ce3b5596`（このメモ更新commitのみ後続）
- 重点レビュー:
  - `NodeBootstrapReceipt`がNode executable、compiled CLI、package-lockをdigestで一体封印し、欠測・stale時にBun/tsx/TS直実行へfallbackしないか。
  - Stop hookのdb-refresh再入が親runtimeを継承せず、sealed Node/compiled CLIのみを`windowsHide`付きで起動するか。
  - Claude/Codex、setup/Pack、CI、snapshot runner、SQLite、verification profileの各production面がNode契約へ反転し、検出器が旧Bun経路をGreenにしないか。
  - `npm ci`をNode経由で起動し、Windows shell popup/argument injection面を再導入していないか。
  - PLAN-L7-458が未実装scanner/runtime observer/full complianceを完了扱いしていないか。

証拠: Node 24.13 + Vitest 4.1.10で15 files / 231 tests Green、`tsc --noEmit` / Biome Green、`npm audit` 0。commit済HEADのdetached clean cloneで`npm ci`→compiled build→DB rebuild→4 files / 79 tests Green。追加CI収束ではsecret-scan/forward-escape 35 tests Green、残存6ゲートのうち旧distribution期待値以外42 tests Green、修正後のdistribution acceptance 5 tests Green。CI第2走のPR固有Red 3件を修正し、skill/isolation 2 tests Green、入れ子global fence 1 test Green（115秒）をdetached HEADで確認した。CI第3走はWindows全回帰Green、Linuxで検出したNode lock二重所有とprojection timeoutを修正し、detached HEAD projection実試験Green（49秒）。その後、skill injectionの実ケースへ45秒timeoutを適用したHEAD `ce3b5596`をpushし、Rust Linux/Windows Green、harness Linux/Windows実行中まで確認した。初回clean cloneでoptional lock graph欠測を検出し、commit `31277d6d`で修正済み。npm invocationのWindows shell警告はcommit `8fc7962e`でreview済みnpm CLIをNodeから直接起動する形へ修正した。
