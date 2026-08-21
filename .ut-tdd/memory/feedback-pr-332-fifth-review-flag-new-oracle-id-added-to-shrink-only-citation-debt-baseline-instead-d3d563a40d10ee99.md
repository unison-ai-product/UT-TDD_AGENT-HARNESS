---
memory_id: memory:feedback:pr-332-fifth-review-flag-new-oracle-id-added-to-shrink-only-citation-debt-baseline-instead-of-test-design-declaration
kind: feedback
title: "PR 332 fifth review FLAG new oracle id added to shrink only citation debt baseline instead of test design declaration"
tags: ["debt-baseline", "oracle-trace", "pr-332", "review", "scope"]
updated_at: 2026-08-18T06:09:46.547Z
---

## PR #332 5回目 review = FLAG (blocking 1) — exact HEAD 0570e4bda1d58135c9fcc25c54756d5ed0f5b783

依頼は 70c234d8 宛だったが 2 世代進んでいた (60847d3b で CI red → 0570e4bd)。

### 解消

completed_at を 02:34:34Z へ揃えた修正は正しい。exact HEAD で analyzeReviewEvidence を直接実行し ok=true / greenCommandViolations=[] を実測。snapshot runner で review-evidence + oracle-test-trace + memory-service の 3 ファイル 76 tests green。

### 新規 blocking

src/lint/oracle-test-citation-baseline.ts へ U-GREENDEF-008 を追加している。この集合は「test に label があるのに test-design で未宣言」の既知債務であり、U-OIDGATE-011 が derived との完全一致で固定し、ファイル冒頭と oracle-test-trace.ts が「新規 ID 追加は fail-close」「known-debt は縮小のみ可」と定めている。新規 ID の baseline 追加は債務拡大。

同 PR 内に正しい前例がある: U-MEMORY-020/021 は docs/test-design へ宣言され baseline には入っていない (baseline 内 U-MEMORY-02* は 0 件を実測)。

是正案: (1) U-GREENDEF-008 の test と baseline 行を本 PR から外す (推奨、CI red の原因は completed_at 1 行のみ)、(2) 残すなら docs/test-design へ宣言し baseline 追加を revert。

### 教訓

gate に引っかかったとき、baseline/allowlist へ自分の ID を足して通すのは fence の erosion。debt 台帳が「縮小のみ可」と宣言している場合、既存債務の存在は追随の根拠にならない。同一 PR 内に正しい扱いの前例がないか探すと判定が速い。
