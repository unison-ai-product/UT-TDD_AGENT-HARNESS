---
memory_id: memory:feedback:pr-339-delta-at-1cf0b4cc-oracle-orphans-fixed-but-generates-still-declares-11-pre-owned-paths-doctor-will-fail-again
kind: feedback
title: "PR 339 delta at 1cf0b4cc: oracle orphans fixed but generates still declares 11 pre-owned paths, doctor will fail again"
tags: ["duplicate-artifact-ownership", "issue-328", "plan-l7-493", "pr-339", "review"]
updated_at: 2026-08-19T08:55:01.452Z
---

PR #339 exact HEAD 1cf0b4cc809fd888845f431ad63f95e50b97fec4 に対する Claude non-author delta review: FLAG (blocking 1)。B-2 解消、**B-1 未着手**。今回は依頼の exact HEAD が実 HEAD と一致していた (前回の SHA 不一致は解消)。

B-2 解消の実測: U-RVATT-033 → tests/review-verdict-custody.test.ts に 1 件、U-RVATT-036 → tests/review-live-cli.test.ts に 1 件 (宣言文が名指ししていたファイルと一致)。デルタは review-verdict-custody.test.ts +35-1 と review-live-cli.test.ts +1-1 のみで最小。oracle orphan と baseline 再導出の件数不一致 (327 vs 325) は同時に解消される見込み。

B-1 未是正 = generates は 1 件も変更されていない (git diff db0b36bb 1cf0b4cc -- docs/plans/PLAN-L7-493-*.md の artifact_path 差分ゼロ)。新 HEAD でも .gitignore=L7-213+L7-493、live-review-projection.ts=L7-465+L7-493、review-guard.ts=L7-85+L7-493、git-workspace-fingerprint.ts=L7-421+L7-493 の重複所有が残る。ゲート規則 (src/lint/artifact-ownership.ts:16-17) は「同一 path の宣言 PLAN が 2 件以上かつ baseline 免除外」なので doctor は同じ 11 件で再び violation を出す。走行中 run 32234318526 の Linux leg は同じ理由で落ちる見込み。

最小是正 (再掲): generates を残す 3 件 (src/feedback/review-verdict-custody.ts、tests/review-verdict-custody.test.ts、PLAN doc 自身) に絞り、既存ファイル 11 件の宣言を外す。外した 11 件は既存編集であり各 owner PLAN と baseline に被覆済み (前 run で impl-plan-trace — OK、NEW orphan 0) なので宣言を外しても未被覆にならない。

次の判定: B-1 是正後の exact HEAD で 3 job green を確認し、そこで初めて実装本体を #336 で freeze した契約との 1:1 照合で判定する。

観測: 是正 push が blocking 2 件のうち 1 件だけを直す形が続いている (#338 の 7850143b→2028ab73 でも duplicate-artifact-ownership だけ直して callsite-drift を残した)。CI 赤の原因が複数あるときは、赤の一覧を全部拾ってから push するほうが 1 サイクル短い。
