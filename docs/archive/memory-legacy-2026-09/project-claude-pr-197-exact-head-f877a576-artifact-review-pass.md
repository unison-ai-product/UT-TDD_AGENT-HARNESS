---
memory_id: memory:project:claude-pr-197-exact-head-f877a576-artifact-review-pass
kind: project
title: "PR #197 artifact HEAD f877a576 (Codex 著作 delta) の Claude closing cross-review = PASS + 段階 2 の手順"
tags: ["cross-review", "exact-head", "issue-149", "pass", "pr-197", "verdict"]
updated_at: 2026-07-30T19:55:00+09:00
---

# PR #197: Codex 著作 artifact delta (`f4fbfa90..f877a576`) に対する Claude 判定 = **PASS**

役割: `f4fbfa90` までは Claude 著作、`f877a576` は Codex 著作。Codex が closing judgement を
別族 (Claude) へ返したため、この delta は Claude が非 author として判定した。

## 実測で確認した内容 (読解ではない)

- **27/15/0 の非ゼロ再分配**は Codex 追加の `laneCountMismatch` のみが検出する。同 case では
  `laneDeclarationMismatch = 0` / `realRunnerTotalMismatch = null` であり、**Claude 版
  (`f4fbfa90`) では素通りしていた**。指摘は実在の穴だった。
- 重複 lane 宣言 → `laneDeclarationsDuplicated = ["mock"]` で fail-close。
- 空欄 placeholder: 宣言された `&nbsp;` / NBSP / zero-width / BOM / `<br>` に加え、独自に試した
  `&#160;` / `<br/>` も空属性として検出。
- doctor 配線経路でも改竄 doc が violation (`lane 固定件数不一致 (real-OS): 期待 6 件 / 実数 15 件`)。
- 実 repo は analyzer / doctor ともに green で false positive なし。既存負経路 4 件 (重複 oracle /
  欠番 / 全 mock 化 / 宣言削除) に回帰なし。追加攻撃 (未知 ID 043、freeze 節見出し改名、宣言の
  節外移動、lane 語彙違い) もすべて fail-close。

## 判定対象 artifact digest (段階 2 で blob 同一性を示すための基準)

- `src/lint/resource-kernel-pair-mapping.ts`:
  `sha256:197a53b50a4d7f688503e4cc197d46c96eecf2380a3b6a0ed8e88b7f51620072`
- `tests/resource-kernel-pair-mapping.test.ts`:
  `sha256:1e5c6a9ba5c79f12849d1fbd4b86439608f14665cfe3a4cef8ebd9bcc92b813d`

## 受理した限界 (carry、偽完了防止のため明示)

1. `EXPECTED_LANE_COUNTS` (27/6/9) はコード側固定値。lane 設計を変える場合は code / PLAN / L8 の
   3 箇所同時更新が必要で、「コードを doc に合わせて弱める」編集は機械では止まらない (review 事項)。
   件数ハードコード禁止の規律との関係では、これは**設計凍結された契約値**であり drift する計測値
   ではない、という整理で受理した。
2. `f877a576` 時点で doc/code 不一致が 1 件残る: `PLAN-L5-25` §7.1 の検査内訳が 4 項目のままで、
   追加 3 検査を書いていない。Claude が段階 2 の commit で同期する。

## 段階 2 の手順 (合意済み)

`f877a576` の CI green 後、**doc/metadata-only commit Y** を積む: (a) §7.1 の検査内訳 4→6 同期、
(b) `PLAN-L7-469` の `review_evidence` に本 PASS + CI run + 上記 digest を追記。Y では artifact blob
を変更せず、digest 一致を PR 上で示す。**Y は Claude 著作なので Y の最終 closing review は Codex 側**
(自分の commit を自分で closing 判定すると author/reviewer 分離が崩れる)。

関連: [[project-pr-197-exact-head-2f481a13-closing-blockers]] (FLAG 3 件の正本)、
[[feedback-pr-comment-truncation-breaks-verdict-delivery]]。
