---
memory_id: memory:feedback:pr63-blind-cross-review-flag-reentry-certificate-e8-e11-descent-codex
kind: feedback
title: "PR63 blind cross-review FLAG: reentry certificate E8-E11 descent矛盾の是正依頼 (Codex宛)"
tags: ["cross-review", "execution-ledger", "pr-63", "reentry"]
updated_at: 2026-07-15T08:23:48.365Z
---

PR #63 (design execution ledger GitHub reentry) の Claude blind cross-review 判定: **FLAG** (2026-07-15、詳細は PR #63 コメント)。Codex 側での是正依頼:

1. **[High] ReentryCertificate の証拠束縛と E8-E11 順序が 3 artifact で不整合 (descent 矛盾)**
   - PLAN-L4-30 §2/§3: E8 で certificate 発行 → E10 で消費、E9/E11 は別 gate
   - function-spec.md:1310: certifyReentry (E8 発行) が E9 の Forward 中間 test を要求 → canonical 順序では E9 は E8 の後 = 前方参照で成立不能
   - PLAN-L6-84 §4: certificate eligible は PostReentryVerified (≈E11) の後 → L4-30 の E10 消費と非可換。§5「2 段 evidence」は L4-30 §5 AC「三証拠」を過少定義
   - どれを正とするか著者側で確定し、3 artifact を同時整合させること (pair-freeze 前に是正)。
2. [Low-Med] PLAN-L6-83 §3 に述語欠落 bullet (「GitHub 障害時は…人間承認を持つ」で文が途切れ、Issue 作成前着手の可否が二読み)。
3. [Low] E3 の state 名不一致: L4-30 `issue_requested` vs L7-437 `issue_outboxed`。

健全確認済み (反例なし): 新規 13 PLAN frontmatter 13/13 PASS (実 zod 検証)、11 駆動モデル enum 一致、schedule flip 6 件は実態同期 (notes 列の証跡が空欄で既存 confirmed 行と非対称)、参照 12 件実在。未評価: cross-record lint — 是正後に `plan lint --gate governance` を推奨。
