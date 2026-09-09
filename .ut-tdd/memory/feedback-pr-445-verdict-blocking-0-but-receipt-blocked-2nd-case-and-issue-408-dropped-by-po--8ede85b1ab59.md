---
memory_id: memory:feedback:pr-445-verdict-blocking-0-but-receipt-blocked-2nd-case-and-issue-408-dropped-by-po--8ede85b1ab59
kind: feedback
title: "PR 445 verdict blocking 0 but receipt blocked (2nd case) and issue 408 dropped by PO"
tags: ["issue-408", "pr-438", "pr-445", "receipt-blocked", "reviewer-exit-nonzero"]
updated_at: 2026-08-27T08:24:35.473Z
---

Claude 側の実測報告 3 件。Codex は本メモリを現況把握に使ってよい。

## 1. Issue #408 は PO 判断で取りやめ・close 済み

PO 指示 (2026-08-27): 「#408 の Bun 永久 BAN Pack/consumer 実装 PR は起票しない」。
`not planned` で close 済み (issue comment 5436349606)。Pack/consumer 配布契約は
PLAN-L7-516 (#420, PR #440 merged) の consumer-local runtime 契約と PLAN-L7-515 (#414) の
remote canary 契約でカバーされる範囲を正本とする。
Codex が 17:18 に書いた `memory:project:issue-408-bun-retirement-claude-owned-dispatch` の
dispatch 計画は**実行不要**。

## 2. PR #445: Claude non-author verdict blocking 0、ただし receipt 生成不可

exact HEAD `345a3691`、request digest `087b2c2c…`。attempt-2 で有効な verdict を取得:

- **blocking findings: 0**
- weakness 4 件 (W1 が最重要): `consumerCompositionHarness` の `pointerWrite` / `publish` は
  production 側に対応 port が無いテスト内 fake で、成功系 positive control がファイル内に存在しない。
  そのため PLAN §2/§5 の「pointer/publish は全て 0 回」は**反証不能な形でしか裏付けられていない**。
  PF5 5 port 側は U-PACKISO-001 が positive control になっており vacuous ではない。
  W2: `validIdentity(input.receipt)` → `validReceipt()` の production 分岐が**無テストで出荷**されている
  (実挙動差は `samePath` 内 `resolve(undefined)` の TypeError を typed `identity_mismatch` に変える点)。
  W3: PLAN-REVERSE-496 §5 の記述が W2 の分だけ実 diff を過小申告。
  W4: この HEAD で PLAN-L7-496 に新規 `review_evidence` / `green_commands` が入っておらず
  frontmatter が 2026-08-21 / d919b581 のまま (closure 時発行なら想定内)。
- **`reviewer_execution_failed` により canonical receipt は生成されていない**。

なお #445 の `live-dispatch` は 07:46Z に `stale_claude_workspace` で fail-close していたため
inbox に v3 envelope が届いておらず、Claude 側は取りこぼしていた。canonical request を指す
transport envelope を再構成して `live-consume` した (identity は Codex の canonical request から
のみ導出、custody bypass なし)。

## 3. receipt 生成不可は #438 に続き 2 件目 — 構造欠陥として扱う

`reviewer_exit_nonzero` (`src/cli/delegation.ts:266` / `src/feedback/review-attestation.ts:222`) により、
**有効な verdict を書き終えた後に reviewer プロセスが非ゼロ終了すると receipt が破棄される**。
#438 は 3 attempt すべて、#445 は 2 attempt すべてで再現。リトライでは解決しない。

真因の実測が 1 つ取れた: reviewer サブプロセスは **node / npm / vitest の実行と review worktree への
進入がいずれも permission で拒否される**。verdict 本文に「green 主張は依頼側 / CI の証跡を引き継いだもので
exact HEAD で再実測していない」と明記されている。これが PASS-WEAK 自己降格の原因でもある。

Claude 側で Opus tier に方式調査を走らせている (custody を壊さない前提での方式案 2〜3 個)。
receipt の手書きは行わない。
