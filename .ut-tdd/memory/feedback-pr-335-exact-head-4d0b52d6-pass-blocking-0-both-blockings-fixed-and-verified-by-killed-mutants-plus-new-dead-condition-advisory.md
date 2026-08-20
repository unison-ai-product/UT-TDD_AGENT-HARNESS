---
memory_id: memory:feedback:pr-335-exact-head-4d0b52d6-pass-blocking-0-both-blockings-fixed-and-verified-by-killed-mutants-plus-new-dead-condition-advisory
kind: feedback
title: "PR 335 exact head 4d0b52d6 PASS blocking 0 both blockings fixed and verified by killed mutants plus new dead condition advisory"
tags: ["mutation-testing", "pass", "pf5", "pr-335", "review"]
updated_at: 2026-08-18T11:30:53.207Z
---

## PR #335 exact HEAD 4d0b52d69e2b52cce183f10159af13101c495352 = PASS (blocking 0 / advisory 4)

CI run 32127251249 は review 時点 pending、PR は draft のため merge していない (依頼も merge 禁止)。

### 検証 (変異は commit してから snapshot runner にかけた)

- 無変異: 5 passed。
- 変異 A (selectedMapping の 7 条件を丸ごと無効化): 1 failed。前 HEAD acfff279 では survivor だったので B-1 是正を確認。
- 変異 B (allowlist 収容条件だけ削除): 1 failed。
- 変異 C (aggregate identity 再照合を削除): 1 failed。A-2 も測られている。

### 是正内容

B-1: U-RELMAN-014 を cardinality / releaseId / sourceRevision / revision format / sourcePath 収容 / source・destination path format / destination allowlist の 8 ケースへ分解。台帳文言も条件名を列挙。
B-2: ReleaseAggregateApplyResult に rollback_failed / applied=indeterminate を追加し、restore 失敗時だけ返す。stagingCreated フラグで stage===undefined を返す port でも discard される。テストは apply-after+restore 失敗、apply 成功+discard 失敗+restore 失敗の 2 複合ケースで destination=published を assert。契約も PLAN §1 / U-RELMAN-017 / REVERSE-473 R2 行を同時改訂。
A-2: attestation と manifest 由来 identity の再照合 + sealed plan binding assert。

### 残 advisory

A-1: apply 成功後の discardStaging 失敗で成功 publish を rollback して applied:0 を返す (契約が後片付け失敗を未定義)。
A-4 (新規): !REVISION.test(mapping.sourceRevision) は到達不能条件。この行だけ削除する変異が survivor で、理由は直前の equality 比較と release-manifest schema が同じ 40-hex 正規表現で artifactSourceCommit を検証していること。dead path を残さない規約に照らして削除かコメント付与。
A-5 (process): 契約改訂が実装 PR に同梱された (レビュー起因)。PR スコープ規律 2 の厳格読みでは close→契約改訂→再実装だが 2 行の明確化なので分割は過剰と判断。PLAN に逸脱を 1 行記録するよう依頼。
A-3: 実装 scope の review_evidence entry は未記録。PLAN-L7-489 も main 上では pair-freeze entry のみで慣行として許容されているため merge 前提にはせず推奨に留めた。

### 手法メモ

前 HEAD で survivor だった変異が新 HEAD で killed になることを同一手順で確認すると、是正の実効性を証明できる。ただし残った survivor が「テスト不足」ではなく「到達不能な重複条件」である場合もあるので、上流 schema の検証範囲まで確認してから advisory の種類を決める。
