---
memory_id: memory:project:pr-208-issue-183-cross-review-pr-205-flag-receipt-po
kind: project
title: "PR #208 (issue #183) cross-review 依頼 + PR #205 FLAG と receipt 順序強制の PO 裁定待ち"
tags: ["2026-07-31", "blocking", "codex", "cross-review", "design-decision", "issue-183", "pr-205", "pr-208"]
updated_at: 2026-07-31T06:11:04.152Z
---

# PR #208 cross-review 依頼 (Claude 著作 → Codex 判定) + PR #205 の FLAG と設計判断依頼

## PR #208 (F3: issue #183 自己 supersede)

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/208
- **exact HEAD: `0b212c37`** (base = main `f6932e7e`)
- 著作: Claude (検出器実装・統合) + Codex luna (Red oracle・7 PLAN のデータ修正)。
  **統合と方式判断は Claude なので closing judgement は Codex** へ返す。

内容: `supersedes` に自分自身を書くと `plan-supersession` の 2 条件が無検査で真になり
errata ゲートを自明通過する fail-open を閉じた。`planCoreId` 判定なので slug 違いも検出。
実 repo の 7 PLAN から top-level 自己参照エントリのみ除去 (各 2 行削除、本文/status/
review_evidence/admission_receipt は無変更)。

方式 A の根拠 (実読): top-level `supersedes` を読むのは本 lint と plan-draft/plan-revise の
入力 schema **だけ**で revision lineage の consumer はいない。lineage の正本は
`admission_receipt.origin.{plan_id, revision}`。`evidence-record.ts` が
`supersedesEvidenceId === evidenceId` を無効入力として reject する先例に揃えた。

実測: 公式 snapshot runner **14 tests passed**、`tsc` / `biome` exit 0、
実 repo `selfSupersedes` 7 件 ok=false → 0 件 ok=true。

**carry**: 書き込み側 (plan-draft / plan-revise の入力 schema) は塞いでいない。
CLI から再投入できるが本 lint が fail-close するので silent には入らない。

## PR #205 (D1) の現況 = FLAG + PO 設計判断待ち

exact HEAD `8e58ef4f` (Codex hardening 統合後) への Claude blind closing review は **FLAG**。

### B3′ (blocking、設計判断が要る)

hardening で入った `RECEIPT_SEQUENCE` の順序強制により、**旧 HEAD の `acknowledged` +
現行 HEAD の非 author family `verdict PASS`** の組み合わせで:

1. `candidates` が `receipt.head === request.exactHead` で絞るので旧 HEAD の ack は落ちる。
2. 受理ループの `expectedKind` が `"acknowledged"` なのに `"verdict"` が来る →
   `out_of_order_receipt` + `missing_acknowledged` / `missing_in_review` で `continue`。
3. `acceptedReceipts` が空 → `state="requested"`, `hasVerdict=false` → `merge_ready` 不到達。

**副作用のほうが重い**: `ack`/`start`/`verdict` の **SLA breach が恒久的に出続ける**。
有効な PASS があり PR が OPEN・green でも「誰も反応していない」と報告し続ける =
**目的 (無反応の検知) に対する恒久的な偽陽性**。PR #202 で実際に起きた
「review → 修正 push → 再 review」の通常フローで発生する。

**PO 裁定に上げた選択肢**: A = verdict 単独で十分とし順序欠落は診断に留める (Claude 推奨) /
B = 順序強制を維持し「HEAD が動いたら受領からやり直す」を PLAN に明文化 /
C = current HEAD 内でのみ順序強制し旧 HEAD receipt を ack 相当に数える。

### B2′ (blocking、裁定不要)

不正日付では `elapsedMinutes` が `0` を返すため **`breaches` が必ず空**になる。
信号は `reasons: ["invalid_timestamp"]` と `ok:false` のみ。`U-RVDISP-017` は
`reasons` と `ok` しか見ておらず **`ageMinutes` も `breaches` も assert していない**ので、
`NaN` へ退行しても suite は赤くならない。oracle 追加で閉じる。

### 実測できた PASS

- `Date.now()` / `new Date()` は実装内に **0 件** (時刻は全て `now` 注入)。
- `analyzeReviewDispatch` の呼び出し元は `src/` に **0 件** (dead code)。PLAN 追記が
  それを正確に自己申告しており over-claim なし。

### PLAN-L7-470 を積むのは FLAG 決着後

`deliverable-plan-trace` の orphan (`tests/review-dispatch.test.ts`) を閉じる
`PLAN-L7-470` (kind=troubleshoot / confirmed) は起草済みだが、
**未解決の FLAG がある状態で confirmed PLAN を作らない**ため保留している。
