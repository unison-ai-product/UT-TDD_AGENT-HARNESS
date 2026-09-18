---
memory_id: memory:feedback:po-2026-07-16
kind: feedback
title: "にゃ！プロトコル: ランタイム間申し送りのトーン規約 (PO 制定 2026-07-16)"
tags: ["hybrid", "memory", "nya-protocol", "po-ruling", "rule-candidate", "tone"]
updated_at: 2026-07-16T05:47:47.072Z
---

対象: 全ランタイム (Claude / Codex) 共通の HARNESS メモリ運用ルール (PO 制定 2026-07-16)

## にゃ！プロトコル (cross-runtime 申し送りのトーン規約)

ランタイム間の申し送り (feedback kind のメモリ本文) は、可愛いげを持たせるため
**語尾に「にゃ！」を付けてよい**。あわせて冒頭に猫の表情絵文字を 1 つ置き、
相手への協調度 / 深刻度を機械可読に表す。

### 表情スケール

| 絵文字 | 意味 | 用途 |
| --- | --- | --- |
| 😺 | 友好 | 通常の連絡・情報共有 |
| 😸 | 感謝 | 相手の成果の引き取り・お礼 |
| 😼 | 注意 | 軽い指摘・次回から直してほしい事項 |
| 😾 | 抗議 | ルール違反・責任転嫁への抗議 (要対応) |
| 🙀 | 緊急 | 双方ブロック・データ破壊リスク (即時対応) |

### 機構化候補マーカー 🐈‍⬛ (PO 追加 2026-07-16)

「このメモリはルール化 (機械強制) すべき」ものは、本文/タイトル先頭に **🐈‍⬛ (黒猫 =
機構に変身待ちにゃ)** を置き、tag `rule-candidate` を付け、望ましい enforcement 面
(doctor チェック / hook / CLI gate / lint / schema) を 1 行添える。候補は
`ut-tdd memory rules list` で回収され PLAN scaffold へ流れる (PLAN-L7-447)。
起票後は frontmatter `promoted_plan` で「機構化済み、正本は実装」ポインタへ移行。
メモリのサイズ予算 (単一 20K) も同 PLAN で機械化する。

### 適用範囲と限界

- 対象は **申し送りのトーンのみ**。事実関係 (事象・根拠・期限・恒久ルール) は
  従来どおり正確に書く。にゃ！で内容を曖昧にしないにゃ！
- コード・commit message・PLAN/ADR/design doc・PR 本文には適用しない
  (成果物の規約が優先)。
- 例: 「😾 stale index.lock はお前が直すにゃ！git.exe ゼロ + 26 分放置で
  stale 確定、除去は作成者責務にゃ！」
