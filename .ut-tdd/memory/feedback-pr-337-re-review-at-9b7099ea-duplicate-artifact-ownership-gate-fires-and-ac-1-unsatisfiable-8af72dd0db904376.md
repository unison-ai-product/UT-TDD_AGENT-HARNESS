---
memory_id: memory:feedback:pr-337-re-review-at-9b7099ea-duplicate-artifact-ownership-gate-fires-and-ac-1-unsatisfiable-in-real-runs-plus-head-move-downgrades-residue-detection
kind: feedback
title: "PR 337 re-review at 9b7099ea duplicate artifact ownership gate fires and AC 1 unsatisfiable in real runs plus head move downgrades residue detection"
tags: ["gate-violation", "issue-77", "pr-337", "review", "snapshot-fence"]
updated_at: 2026-08-18T12:00:12.206Z
---

## PR #337 re-review = FLAG (blocking 3 / advisory 2) — exact HEAD 9b7099ea9c0a7bc3f4ad78dc72e5bd6e1cd2e13b

依頼 SHA は今回実在を確認 (前回の d8c718d07e9a は不実在で superseded)。CI pending、draft、merge せず。

### 解消

前回 B-2 (同時発生時の期待): 残留優先 fail-close、indeterminate へ降格しないと明記。前回 B-3: backprop_decision required + PLAN-REVERSE-77 対を追加。updated も 2026-08-18 へ。前回 B-1 の方向性 (testOwnedPaths 明示入力・既定空、分類不能は残留候補へ倒す) も安全側で正しい。

### blocking

B-1 (実測 gate 違反): PLAN-RECOVERY-11 の generates に Reverse doc を足したため duplicate-artifact-ownership が発火。exact HEAD で analyzeDeliverableTraceGate を直接実行し ok=false / artifactPath=docs/plans/PLAN-REVERSE-77-...md / planIds=[RECOVERY-11, REVERSE-77] を実測。是正は RECOVERY-11 の generates から 1 entry 削除 (各 PLAN は自分自身のみ所有、L7-492↔REVERSE-473 と同形)。

B-2: AC #1 が実運用で満たせない。foreign 認定条件が「HEAD 移動 or 管理された fixture が発行した foreignActivityEvidence」に限定されたため、実 hybrid 走行には evidence 源が無く、相手の編集/untracked は unknown → 残留候補 → fail-close。Issue #77 の実害が残る。AC を HEAD 移動に限定するか、実運用の evidence 源 (走行中の status 採取、foreign commit の diff path 集合等) を契約へ定義する必要。

B-3: HEAD 移動のみで indeterminate へ落とすと、テストが起動元 worktree で commit して残留を隠す経路が red → indeterminate へ格下げされる (従来 fingerprint は HEAD もハッシュ対象で red だった)。AC #2 と矛盾。corroboration (commit author/committer が runner でない、移動 commit の diff が testOwnedPaths に触れていない) を条件に足す。

### advisory

A-1: PLAN-REVERSE-77 の numeric core 77 は PLAN-L6-77 / PLAN-L7-77 と衝突 (PLAN-REVERSE-11 は既存のため 77 を選んだ事情は理解)。issue #128 の rekey 債務対象なので未使用番号か衝突承知の記録を。
A-2: CI pending、B-1 は CI でも赤くなる見込み。

### 手法メモ

PLAN の generates を触る変更では、doctor を待たずに analyzeDeliverableTraceGate を直接実行すると duplicate ownership を即座に確認できる。安全側へ倒す修正 (fail-close 化) は、同時に「元の運用目的が達成できなくなっていないか」を AC と突き合わせて確認する。
