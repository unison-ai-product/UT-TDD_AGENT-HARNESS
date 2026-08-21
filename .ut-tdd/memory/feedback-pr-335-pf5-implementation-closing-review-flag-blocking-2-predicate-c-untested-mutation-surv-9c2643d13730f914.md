---
memory_id: memory:feedback:pr-335-pf5-implementation-closing-review-flag-blocking-2-predicate-c-untested-mutation-survivor-and-rollback-failure-reported-as-applied-zero
kind: feedback
title: "PR 335 PF5 implementation closing review FLAG blocking 2 predicate C untested mutation survivor and rollback failure reported as applied zero"
tags: ["mutation-testing", "pf5", "pr-335", "release-manifest", "review"]
updated_at: 2026-08-18T09:51:54.106Z
---

## PR #335 (PF-5 implementation) non-author closing review = FLAG (blocking 2 / advisory 3) — exact HEAD b99b0cc159f5e07e0f5fa5e61578d33231ed0b2e

依頼は 982a4294 宛だったが b99b0cc1 へ superseded。CI は review 時点 pending、PR は draft。テストは 5/5 green (snapshot runner、exact HEAD)。

### blocking

B-1: predicate (C) の中身に oracle が無い。selectedMapping の 7 条件 (releaseId / sourceRevision 一致、revision 正規表現、path 妥当性 2 件、sourcePaths 収容、allowlist 収容) を全削除しても 5/5 green (変異を commit して snapshot runner で実測)。U-RELMAN-014 の (C) ケースは channelMappings: [] の 1 件だけで、契約 §1 の「destination が allowlist で許可される」が完全に未検証。PF-4 の identity 3 値と同型の指摘。

B-2: rollback 失敗時に applied: 0 と報告しながら destination が published のまま残る。無変異の実測:
- apply-after fault + restore throws → {ok:false, applied:0} だが destination=published (誤報)
- apply ok + discard throws + restore throws → 同上
U-RELMAN-017 は「1..N fault 総当たり」と宣言しているが、テストは単発 4 件のみで rollback port の fault が 0 件。是正は結果型に rollback_failed / indeterminate を足し、契約 §1 へ報告義務を 1 行追加 (実装 PR 内の方式発明にしない)。

### advisory

A-1: apply 成功後に discardStaging が落ちると成功 publish を rollback して失敗を返す (契約が後片付け失敗の扱いを定めていない)。
A-2: sealed plan の sourceRevision / destinationPath binding が assert 不足。
A-3: review_evidence は PR #333 (pair-freeze) の PASS が根拠で scope に実装対象外と明記。L7-489 → #330 と同型で妥当だが、実装に対応する evidence entry が未記録。closing PASS 後にこの PR の exact HEAD を subject_head とする entry が要る。

### 手法

実装 PR のレビューでは、契約の中心 predicate を丸ごと無効化する変異を 1 本流すと oracle 不足が一撃で出る。変異は必ず commit してから snapshot runner にかける (runner は HEAD を clone するため working tree の変異は載らない)。
