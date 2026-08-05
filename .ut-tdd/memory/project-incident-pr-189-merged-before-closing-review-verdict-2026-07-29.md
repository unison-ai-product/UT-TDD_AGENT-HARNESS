---
memory_id: memory:project:incident-pr-189-merged-before-closing-review-verdict-2026-07-29
kind: project
title: "インシデント: PR #189 が closing cross-review 判定前に merge され、L7-461 が空 evidence で confirmed 化 (2026-07-29)"
tags: ["incident", "cross-review", "pr-189", "issue-131", "issue-193", "claim-discipline"]
updated_at: 2026-07-29T22:05:00+09:00
---

2026-07-29、PR #189 (doctor 単一実行化、Codex 著作) が Claude の closing cross-review
判定投稿 (20:28-30 JST、issuecomment-5117012108) より**先の 20:21 JST に merge** された。
review 依頼メモリ (19:59 JST) から 22 分後で、判定を待たない merge。あわせて
PLAN-L7-461 が **review_evidence: [] のまま status: confirmed** で main に入った
(plan lint / CI はこれを止めなかった = confirmed+空 evidence を検出する gate が無い)。

## 事実 (HEAD 基準)

- merge commit: 9c9a9444。レビュー対象 exact HEAD d50962ae と merge 内容は同一系譜
  (レビュー後 delta は PLAN doc のみ) のため、判定自体は有効。
- claim-blind PASS / spec-blind FLAG 1 件 (envelope 偽申告経路) → **issue #193 起票済み**。
- issue #70 は誤 close されず OPEN 維持 (本 PR は close 宣言なし)。

## 実施した修理 (revert なし、前進修理)

- PR #194: L7-461 へマージ後 cross-review 証跡を記録 (#188 と同型)。confirm の
  スコープ 1 限定と issue #193 FLAG を明記。
- FLAG 実体は issue #193 が保持 (是正案・oracle 案付き)。

## 教訓 / 機構化先

- cross-review 判定前 merge を機械的に止める gate は未実装 — issue #131
  (委譲痕跡照合 gate、PLAN-L6-93) と同根。confirmed かつ review_evidence 空を
  fail-close する検査も欠落 (claim discipline PLAN-L7-89 の穴)。機構化判断は PO へ。
