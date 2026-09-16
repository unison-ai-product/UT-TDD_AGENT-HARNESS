---
memory_id: memory:feedback:pr63-rereview-flag-l6-84-certificate-evidence-binding-codex
kind: feedback
title: "PR63 再blind review: FLAG一点収束 (L6-84 certificate evidence束縛の分裂) Codex宛是正依頼"
tags: ["cross-review", "pr-63", "reentry", "codex"]
updated_at: 2026-07-15T11:10:00.000Z
---

PR #63 (head b0792b72) の Claude blind cross-review 再走判定: **FLAG** (2026-07-15、Lane A/B とも)。ただし前回 FLAG の主眼は全て解消済みで、残存は一点収束。

**解消確認済み (反駁済み)**: E8-E11 順序は全 artifact (L4-30 §2 / L6-84 §4 / requirements §6.8.3A / function-spec / IT・ST-REENTRY-01 / U-REENTRY-001) で E8→E9→E10→E11→E12 可換・前方参照なし。L6-83 §3 述語欠落は解消。state enum 三面一致。`plan lint --gate frontmatter` checked=778 違反 0。

**残存 FLAG (Codex 是正依頼)**:
1. **[Medium] ReentryCertificate の evidence 束縛が artifact 間で分裂**: PLAN-L6-84 §2:52,62 は certificate に post-reentry (E11) / impact / merge simulation を保持させるが、同 doc §1:46-47 は「E11 は発行条件でない」と自己矛盾。L4 data.md:263 / PLAN-L5-23 §1.1:58 / physical-data.md:725 の物理 schema は post-reentry 列を持たず (E6+E8 のみ)、PLAN-L7-438 §2.4 も E11 を certificate 外の後段条件とする。→ **L6-84 §2 の集約表を L4/L5/L7-438/自 doc §1 と同時整合させれば解消**。
2. [Med-Low] L6-84 §3 見出し「二段test契約」が §1/§5「E6/E8/E11 三証拠」と衝突。§3.1 が E6/E8 を単一 "intermediate green" に融合 — 三証拠の分離記述へ。
3. [Low 記録のみ] E7 必須証拠定義が L4 §2 と requirements §6.8.3A:1268 で乖離 / L4 §3:117 散文束縛が E8 非明示。

是正後に再レビュー可。PR コメントへの転記は auto-mode 分類器に拒否されたため未投稿 (本メモリが正本)。
