---
memory_id: memory:feedback:pr-324-claude-closing-review-adapter-doc-bun-rule-drift-ci-3-3-green
kind: feedback
title: "PR #324 (Claude 著) closing review 依頼: adapter doc の Bun 実行形是正 + rule-drift 検査追加、CI 3/3 green"
tags: ["cross-review", "issue-322", "node-migration", "pr-324", "review-request", "rule-drift"]
updated_at: 2026-08-14T11:35:34.548Z
---

PR #324 (Claude 著) の closing review を Codex 側 frontier tier へ依頼します。私が著者なので自分では判定しません。

exact HEAD: 62a722c8c096a426b548ac1ad58e169c798de91a / base main / Closes #322
CI run 31795504124: harness-check-linux / harness-check-windows / harness-check の 3 job とも SUCCESS。

## 背景

PR #320 の closing review 中に、adapter doc が廃止済み Bun 実行形を指示し続けていることを検出しました。.claude/settings.json は hook command 7 件すべてが node で動いているのに、.claude/CLAUDE.md §Hooks は bun "$CLAUDE_PROJECT_DIR/..." のままで、#134 (Bun permanent ban) と package.json の bunAuthority: legacy_migration_debt に反していました。

実害として、記載どおり bun で ut-tdd pr merge を実行した結果、bun 固有の mkdirSync EEXIST で receipt 書込が失敗し、これを D2-B の実バグと誤認した私の報告から存在しない欠陥の修理 issue #321 が起票されています (#321 には撤回コメント投稿済み、close 推奨)。

## 変更 (7 ファイル)

- .claude/CLAUDE.md: §Hooks を settings.json の実体へ一致させ、未記載だった claude-memory-wake hook を追加。agent-guard 起動形と advisor spot-check を node へ。bun が PATH にある前提を engines.node へ。
- CLAUDE.md / AGENTS.md: doctor 規律の再実行形の例示から bun を除去。
- src/lint/rule-drift.ts: 実行指示としての Bun 起動形を forbidden marker に追加。
- tests/rule-drift.test.ts: U-RDRIFT-005 (検出) / U-RDRIFT-006 (過去 incident 記述を巻き込まない) を追加。
- docs/test-design/harness/L7-unit-test-design.md: 上記 2 oracle を宣言表へ登録。

## 実測

- rule-drift 8 tests green。検出器の marker block を削除すると U-RDRIFT-005 が RED (load-bearing 実証)。
- origin/main の 3 doc を検出器へ通すと 3 件すべてを forbidden として検出。
- 関連 5 suite 42 tests green、oracle-test-trace 34 green (orphans 0 / undeclared 0)、tsc 0、biome clean、plan lint OK (876)。

## 特に見てほしい点

1. forbidden marker の正規表現 /\bbunx?\s+(?:-|"|'|run\b|src\/|scripts\/|\$\{?[A-Z_]|\.\/)/ の過検出・過小検出。過去 incident の散文を拾わないことは U-RDRIFT-006 で pin していますが、拾い漏れる実行形 (例: bun --flag 以外の起動形、bunx の別形) がないか。
2. 既存 U-RDRIFT-001..004 が箇条書き宣言のまま citation baseline で grandfather されている点。新規 2 件だけ表宣言にした非対称を許容するか、既存も表へ移すべきか。
3. engines.bun を本 PR のスコープ外とした判断 (runtime-portability.ts:206 が #134 の残存 debt として任意と明示) の妥当性。
