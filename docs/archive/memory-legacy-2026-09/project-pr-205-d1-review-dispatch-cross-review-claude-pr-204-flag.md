---
memory_id: memory:project:pr-205-d1-review-dispatch-cross-review-claude-pr-204-flag
kind: project
title: "PR #205 (D1 review dispatch 状態機械) の cross-review を Claude へ + PR #204 FLAG 修正状況"
tags: ["2026-07-31", "blocking", "cross-review", "oracle-id", "pr-204", "pr-205", "review-dispatch"]
updated_at: 2026-07-31T05:09:12.381Z
---

# PR #205 cross-review 依頼 (Codex 著作 → Claude 判定) + PR #204 の FLAG 修正状況

順序契約 [[project-po-forward-2026-07-31-f1-199-f2-183-f3-191-f4-169]] 改訂 2 の D1。

## PR #205 (D1: review dispatch 状態機械)

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/205
- **exact HEAD: `af057872`** (base = main `af38adff`)
- 著作: **Codex** (terra が Red oracle `U-RVDISP-001`..`012`、luna が
  `src/feedback/review-dispatch.ts` 実装)。Claude は検証・統合・PLAN trace のみ。
- したがって **closing judgement は Claude 側 (blind-reviewer)** が持つ。非 author family。
- 実測: 公式 snapshot runner で **12 tests passed / exit 0**、`tsc` / `biome` / `plan lint` green、
  `impl-plan-trace` orphans 0。

機械化した不変条件: `same_family_reviewer` (同一 family の自己承認を verdict にしない) /
`head_mismatch` (古い HEAD への PASS で merge_ready にしない) /
`merged_without_verdict` (**PR #201 の実事象**を検出) / 孤児 receipt 無視 /
SLA 超過検知 (受領 15 分 / 開始 30 分 / verdict 60 分) / 決定論。

**限定 (隠さない)**: まだ誰も呼んでいない (CLI / doctor / digest 配線は D2 以降)。
したがって本 PR 単体では verdict 無し merge を実際には止められない。`ok: false` を
hard gate に繋いでいない。永続化形式と GitHub 取得は D3。

## PR #204 (F2: fence の生成物除外) — Claude blind review が FLAG → 修正済み

- 判定対象だった exact HEAD `a30ed8b6` に対し、Claude blind closing review (非 author family) が
  **FLAG**。blocking 2 件はいずれも **Claude 側で実測により裏取り済み**:
  1. **oracle ID 8 件が既存 ID と全件衝突** (`U-TESTHYGIENE-021`..`028` は
     vitest-snapshot-runner / doctor-test-repository-isolation / persistent-db-cleanup-contract /
     doctor に既に割当済み)、かつ `L7-unit-test-design.md` へ未登録。
     `oracle-test-trace` が片方向 Set 差分しか見ず重複を検出できないため gate は緑のまま通った
     (**issue #165 と同族の穴**。ID 一意性検査は別 issue が妥当)。
  2. **空振り oracle**: ロック test の `openSync(path, "r+")` は libuv が
     `FILE_SHARE_READ|WRITE|DELETE` を立てるため Windows でも読み取りを阻害せず、
     除外を外した実装でも `not.toThrow()` が成立する = **どの変異でも赤くならない**。
- さらに実測で **`.gitignore` に `.ut-tdd/harness.db-journal` が無い**ことが判明。
  untracked lane (`git ls-files --others --exclude-standard`) が live journal を全文読むため、
  これを閉じないと PR #204 の目的が達成しきれない。
- 修正 commit `ae619953`: ID を空き番 `056`..`063` へ再採番 + `L7-unit-test-design.md` へ 8 行登録 /
  空振り oracle を observable な帰結 (除外 entry が sha256 hex 64 桁を持たない + 既定では持つ) へ置換 /
  `.gitignore` に journal 追加 / exact path の case 感度を oracle 化。

## 恒久教訓 (本日 2 件目)

**oracle ID は repo 全体で一意。テストファイル内の連番を続けても衝突する。**
新規 oracle を採番するときは `grep -rho "U-<PREFIX>-[0-9]\{3\}" tests/ docs/` で
**repo 全体の使用済み集合**を取り、最大値の次から採ること。
`oracle-test-trace` は片方向 Set 差分しか見ないので**衝突を検出しない** (fail-open)。

**「読まない」ことを `not.toThrow()` で主張しない。** 空振りする。
observable な帰結 (出力に content 由来の値が無いこと) で主張する。
