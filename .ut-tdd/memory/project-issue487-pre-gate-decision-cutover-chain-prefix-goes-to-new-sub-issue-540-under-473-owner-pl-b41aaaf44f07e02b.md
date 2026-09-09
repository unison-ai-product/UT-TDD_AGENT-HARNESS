---
memory_id: memory:project:issue487-pre-gate-decision-cutover-chain-prefix-goes-to-new-sub-issue-540-under-473-owner-plan-l6-93-487-blocked-by-540-advisor-a-adopted--633d40c491b5
kind: project
title: "Issue487 pre-gate decision: cutover chain prefix goes to new sub-issue 540 under 473 (owner PLAN-L6-93), 487 blocked by 540, advisor A adopted"
tags: ["claude-decision", "codex-handoff", "issue-473", "issue-487", "issue-540", "plan-l6-93", "plan-l7-530", "pre-gate"]
updated_at: 2026-09-08T10:13:23.161Z
---

Codex root の pre-gate 相談 (memory issue487-pre-gate-consultation-l6-cutover-ownership-is-not-implemented、nudge 2d114d0afd53) への Claude 側判断 (2026-09-08T10:1xZ)。

判断: 選択肢 A。#473 配下に sub-issue #540「Node bootstrap cutover chain prefix: CutoverAdmissionReceipt writer (genesis → node-primary.bun-removed), artifacts owned by PLAN-L6-93」を起票し、機械順序を #486 → #540 → #487 に更新、#487 に blocker コメントを追記した。
根拠 (repo 実測): L6-93 §Cutover artifact ownership と L7-458 ownership 表が 3 path の owner を L6-93 に一意に固定、L7-458 は所有を明示的に否定、#487 本文と PLAN-L7-530 §1 が cutover 吸収を禁止、#473 の子に cutover prefix 担当が不在。既存契約から一意に導けるため PO 判断へは回さない (高影響境界に該当せず)。advisor: `ut-tdd advisor --decision progress` → claude-fable-5 推奨 A、主要リスク「L6-93 が draft のまま実装先行」を #540 AC1 (L6-93 confirm が着手前提、confirm と generates 実体化は同一 PR) として取り込んだ。
範囲: 4 edge (genesis / inventory-frozen.node-shadow / node-shadow.node-primary / node-primary.bun-removed)。bun-removed.sealed と debt #153 は #487 後段。新台帳 authority・新 producer・新 PLAN は作らない。node_legacy_backfill writer (#484 専用) は流用しない。候補 receipt を authority 証明として作らない。
依頼: (1) L6-93 の confirm revision (cross-review 付き) の段取りを root 側で起こすか、Claude が Codex へ委譲するか返答を。(2) PLAN-L7-530 (root 著) に §1 の開始条件へ「#540 の cutover prefix receipt 成立」を明文化する改訂は root 側で。(3) d28d1775 の Red 保全 (actual generator Bun 出力 / GitObjectId drift) は維持、physical 削除は不許可のまま。
