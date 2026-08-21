---
memory_id: memory:feedback:pr-337-recovery-11-snapshot-fence-pair-freeze-flag-blocking-3-and-review-request-exact-head-sha-did-not-exist-in-repo
kind: feedback
title: "PR 337 recovery 11 snapshot fence pair freeze FLAG blocking 3 and review request exact head sha did not exist in repo"
tags: ["exact-head", "issue-77", "pr-337", "review", "snapshot-fence"]
updated_at: 2026-08-18T11:45:48.482Z
---

## PR #337 (PLAN-RECOVERY-11 snapshot fence pair-freeze, docs-only) = FLAG (blocking 3 / advisory 4)

### identity 訂正 (重要)

依頼の exact HEAD d8c718d07e9a557f234723119728d075b10cfe17 は repository に存在しない (git cat-file -t = could not get object info)。実 HEAD は d8c718d02bf70a50783d5d483cbf643830a7aa8f で先頭 8 桁だけ一致。依頼テンプレの SHA は gh pr view --json headRefOid の実測値を貼ること。exact-HEAD プロトコルは identity が要であり、これは #328 D3a が閉じようとしている自己申告 identity 汚染と同型。

### blocking

B-1: 分類 (b)「テスト非対象 path」が未定義。既存 fence の許容概念は volatileRuntimeFiles (harness.db 系 4 件、tests/support/git-workspace-fingerprint.ts:27-30) だけで、対象 path の正本が存在しない。(b) を広く取るとテスト残留が foreign と誤分類され fail-open する。対象 path の定義と「分類不能は残留扱い = fail-close」の向きを freeze すること。

B-2: CANDIDATE-R11-004 (foreign 活動と残留の同時発生) の期待結果が未確定。「残留が 1 件でもあれば foreign の有無に関わらず fail-close」と書かないと、実装がどちらでも契約通りと主張できる。

B-3: 新 exit reason fence_indeterminate_foreign_activity は新契約であり backprop_decision: not_required (純修理) と整合しない。PLAN Filing Rules に従い Reverse 対を起票するか、既存 failure カテゴリ内の message 差分に留めるかを選ぶ。

### advisory

A-1: HEAD 移動を無条件 indeterminate にすると、相手が活動中はローカル full-suite が indeterminate を返し続け、Issue #77 の運用目的 (検証の CI 依存を脱する) に届かない。「HEAD 移動は残留の証拠でない」案 (測定対象をテスト所有 path に限定) を設計判断として比較すべき。
A-2: created/updated がともに 2026-07-16 で今回の改訂を反映していない。
A-3: 依頼 SHA 不実在 (上記)。
A-4: CI は review 時点 pending。

### PASS した点

recovery×route_mode recovery 整合、aim slot 宣言、draft generates は自身のみ、L7-421 を置換しない境界、許可リストで隠さない宣言、AC が real-repo regression test を要求。
