---
memory_id: memory:feedback:pr-324-plan-l7-462-completed-draft-plan-l7-488-flag-blocking-4-exact-head-007f9db1
kind: feedback
title: "PR #324 応答: PLAN-L7-462 は completed (draft ではない) ため後続 PLAN-L7-488 を維持。FLAG blocking 4 是正済み、新 exact HEAD 007f9db1"
tags: ["correction", "exact-head", "issue-322", "plan-l7-462", "plan-l7-488", "pr-324"]
updated_at: 2026-08-14T12:13:44.985Z
---

PLAN の置き場所について、前提に事実誤りがあるので実測を差し戻します。

## 実測: PLAN-L7-462 は draft ではなく completed

`git show origin/main:docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md` の frontmatter は `status: completed` (updated: 2026-08-13)。本文には `## 完了記録 (2026-08-07)` があり、AC-1 (hook の Node 起動実発火、PR #278/#279)、AC-2 (CI setup-node 構成 green、run 31100893368 / 31140910029)、AC-3 (bun 再流入 fail-close、PR #284 squash 4d500690) の evidence が run / PR 引用付きで閉じられています。

したがって「main に既存 draft がある」という前提は成立しません。completed PLAN へ新規スコープを後付けすると、閉じた完了記録に未完項目が混ざり、AC と evidence の対応が壊れます。

## 私の判断: 後続 PLAN (PLAN-L7-488) を維持

PLAN-L7-462 の完了後に発見された残件 (instruction surface に残った Bun 実行形) であり、重複ではなく後続です。PLAN-L7-488 は route certificate (route_signal/route_mode = incident、kind = troubleshoot、aim slot あり) を持ち、`parent` と `requires` の双方で PLAN-L7-462 を指しているため trace は繋がっています (requires は completed のみ可という規律も満たす)。generates は本 PLAN doc のみで、既存成果物は宣言していません (draft generates 規則の遵守)。

plan lint は OK (checked=877)。merged-plan-status / duplicate-artifact-ownership の fail-close もありません。

ご指摘のうち trace 対象の中身 (#324 成果物、U-RDRIFT-005/006、settings↔adapter の機械一致、engines.bun の扱い) は PLAN-L7-488 の §2 設計判断と §4 DoD に記録済みです。engines.bun は「削除」を採択し、根拠 (runtime-portability.ts は engines.node のみ必須、engines.bun は #134 の残存宣言として任意) と併せて記録しました。migration debt として残す案は、同一 package.json 内で bunAuthority: legacy_migration_debt と正面から矛盾する宣言を残すことになるため採りませんでした。

PLAN-L7-462 側へ後続 PLAN への 1 行ポインタを追記する形が望ましければ対応します (completed PLAN への追記になるため、指示があれば行います。私の判断では successor 側の parent/requires で足りると考えています)。

## PR #324 の新 exact HEAD

cross-review FLAG blocking 4 をすべて是正し push しました。新 exact HEAD は 007f9db1 です (通知にあった aaf5fc7d / ad2f3d3f / 62a722c8 はいずれも古い)。CI 完走後に delta review を依頼します。

- B1: analyzeHookParity を追加し .claude/CLAUDE.md §Hooks と settings.json の command+args を (event, command) 集合で照合。doc 表記を実体と厳密一致させ、引数欠落 / event 取り違え / doc 行削除 / 壊れた JSON の 4 変異が fail-close することを U-RDRIFT-007 で固定。
- B2: engines.bun を削除。runtime-portability + toolchain-pin 28 tests green。
- B3: PLAN-L7-488 を起票し設計判断を記録 (上記)。
- B4: 正規表現が bun.cmd / bun.exe / 単独 bun / bunx / pipe 後の bun を取りこぼしていた点を是正し、6 形の検出を U-RDRIFT-008 で固定。
- 併せて U-RDRIFT-005/006 は markdown 宣言表へ登録済み (箇条書きは declaration site として収集されないため)。

実測: rule-drift 10 green、oracle-test-trace 34 green (orphans 0 / undeclared 0)、runtime-portability + toolchain-pin 28 green、plan lint OK (877)、tsc 0、biome clean。
