---
memory_id: memory:feedback:pr-543-r5-verdict-flag-at-b2957185-projection-record-check-must-bind-the-terminal-record-uniquely-4-recovery-16-records-coexist-and-the-triple-must-enter-the-preimage--999d416e7342
kind: feedback
title: "PR #543 r5 verdict FLAG at b2957185: projection record check must bind the terminal record uniquely (4 RECOVERY-16 records coexist) and the triple must enter the preimage"
tags: ["issue542", "pr543", "review", "seal-preimage", "verdict"]
updated_at: 2026-09-09T02:40:24.087Z
---

## 非著者 closing review r5 (Codex `gpt-5.6-sol`) — exact HEAD b29571851ad3a721045bd8849609cdd0e5ec382d

**VERDICT: FLAG** (blocking 1)

- canonical receipt: `.ut-tdd/review/receipts/690008023e3d1e76309536c5c91589f1d95c08f967e6972407aaff31e12b474d.json` (reviewerFamily codex, at 2026-09-09T02:38:19Z)
- request memory: `review-request-pr543-b2957185`
- exact-head CI: run 34302468401 5/5 success

r4 の blocking (E.4 decision 要素) は解消と判定。新たに E.3 の projection 照合に 1 件。

### blocking finding

1. **`internal-processing.md:1167` (E.3)**: projection record 照合が「宣言された三値
   (`historicalAssetId` / `historicalTerminalRevision` / `historicalTailDigest`) に一致する record が blob 内に
   **存在する**」ことしか要求しておらず、その record が `planId` の tracked **terminal** binding であることを
   検証しない。さらに三値はいずれも `sourceAuthorityDigest` の preimage に含まれないため、record を
   差し替えても digest が変わらない。

**実測で裏付け済み**: main `ea7658ca` の tracked projection (180 record) には
`PLAN-RECOVERY-16-plan-revision-authoring` の record が 4 件共存する — sequence 1〜3 が legacy asset
`plan:890b18d7…` revision 1〜3、sequence 73 が rebase asset `plan:rebase:74ca026f…` revision 2。
つまり旧 record の三値を自己整合的に選べば全照合を通せ、terminal lineage を偽装できる。指摘は妥当。

### r6 での是正 (実施済み)

- 照合を存在照合から **terminal 一意束縛**へ変更: 当該 blob 内で `binding.plan_id = planId` を持つ record 群の
  うち `sequence` 最大の 1 件が宣言 `historicalAssetId` / `historicalTerminalRevision` と一致し、その
  `record_digest` が `historicalTailDigest` と一致すること。typed reason は
  `seal-projection-terminal-mismatch` (旧 `seal-projection-binding-mismatch` を置換)。
- `sourceAuthorityDigest` の preimage 列末尾に
  `historicalAssetId, historicalTerminalRevision, historicalTailDigest` を追加し、record 差し替えが digest を
  変えるようにした。`historicalTerminalRevision` は前置ゼロ禁止の 10 進 ASCII。
- 緩めてはならない理由として上記 4 record の実測を doc に明記 (数え上げの根拠を prose 主張にしない)。
- E.6 に負系 2 件追加: 非 terminal record の三値を宣言した自己整合入力が拒否されること (複数 record が
  共存する PLAN を fixture にする)、terminal binding 三値の 1 要素改変が `sourceAuthorityDigest` を変えること。

r5 receipt は head b2957185 のみに束縛され、修正後の head へは流用しない。
