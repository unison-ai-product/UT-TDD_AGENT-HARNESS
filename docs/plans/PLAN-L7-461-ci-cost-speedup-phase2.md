---
plan_id: PLAN-L7-461-ci-cost-speedup-phase2
title: "PLAN-L7-461 (troubleshoot): GitHub CI 高速化 Phase 2 — doctor 二重実行の解消 + 実測駆動 static shard (issue #109 残 AC)"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
status: draft
created: 2026-07-28
updated: 2026-07-28
backprop_decision: not_required
backprop_decision_reason: "Internal harness CI cost re-allocation; does not change the product's external requirement / design / test-design contract. Gate coverage itself is preserved fail-close (required contexts は増える方向のみ)。"
owner: PM / PO
agent_slots:
  - role: aim
    slot_label: "AIM - shard 境界と doctor 単一実行化方式の設計判断"
  - role: tl
    slot_label: "TL - shard 分割の fail-close 性 (required context 欠落なし) と doctor 単一実行化の等価性レビュー"
  - role: se
    slot_label: "SE - workflow 分割 + doctor artifact 共有 + github-ci-policy detector 追随の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-461-ci-cost-speedup-phase2.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-455-ci-cost-speedup-phase1.md
    - docs/plans/PLAN-L7-221-github-ci-policy-gate.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-461 (troubleshoot): GitHub CI 高速化 Phase 2

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/109 (残 AC)

注: 実装 deliverable (.github/workflows/harness-check.yml / src/lint/github-ci-policy.ts /
tests/github-ci-policy.test.ts) は既存ファイルのため draft 段階の generates には載せない
(merged-plan-status / duplicate-artifact-ownership 対策)。実装 PR で generates を更新し
confirm と同時に宣言する。前提 PLAN-L7-455 (Phase 1) は PR #112 が merge されるまで
references 扱い (requires の ready 条件を満たさないため)。

## 背景 (2026-07-28 実測、run 30261670421 = 直近 main green run)

Phase 1 (PLAN-L7-455、PR #112) は doc-only lane を絞る。code PR の full lane は
未着手で、実測の内訳は以下:

- harness-check-linux 全体 ~5 分。支配項は vitest 全回帰 **261s** (wall 242.92s /
  tests CPU 594.01s、237 files)。次点 doctor step **50s**、db rebuild 14s。
- harness-check-windows 全体 ~5 分。支配項は test:fast **255s**。
- **テスト時間の 78% が上位 5 ファイルに集中** (594s 中 462s):
  doctor.test.ts 133s / projection-writer.test.ts 130s / cli-surface.test.ts 100s /
  db-projection-ingestion.test.ts 65s / distribution-acceptance.test.ts 34s。
- **doctor が linux leg 内で二重実行されている**: CI step `doctor (governance hard
  gates)` (50s) と、vitest 内 U-TESTHYGIENE-028 (doctor.test.ts 内で runDoctor
  full 実行、CI 実測 114s = PR #113 run 29816573228 ログ) が同一の governance
  検査を 2 回走らせている。

この実測は issue #109 骨子の「変更影響範囲ベースの vitest shard」より単純な設計を
支持する: 変更影響推定 (fail-open リスクと実装コストが大きい) を導入しなくても、
**静的なファイル単位 2-shard** で上位集中を分散でき、安全性は「両 shard を required
context にする」だけで fail-close に保てる。

## スコープ

1. **doctor 単一実行化 (最大単発効果、低リスク)**: linux leg で runDoctor を 1 回に
   する。方式は step 1 の設計メモで確定するが、候補は (a) CI doctor step が `--json`
   結果を artifact/file に出し、doctor.test.ts の aggregate-baseline 系 assertion が
   CI 上ではその実測 artifact を検証する (ローカル vitest 単体では従来どおり自走)、
   (b) U-TESTHYGIENE-028 相当の baseline 検査を doctor 本体の check に昇格し、vitest
   側は薄い契約テストに縮小する。**検査の等価性 (検出できる違反集合が縮まないこと) を
   TL レビューで確認するまで実装しない。**
2. **linux vitest static 2-shard**: 実測 duration に基づくファイル単位の静的分割
   (shard A ≈ doctor + projection-writer 系、shard B ≈ 残り)。両 shard job を
   aggregate `harness-check` の needs に加え、github-ci-policy detector を追随させる
   (shard 片肺・shard 欠落は fail-close)。
3. **windows leg 特化の設計判断書き出しのみ** (実装しない): OS 依存面 (path separator /
   SQLite handle / spawn 系) に test:fast を絞る案の被覆トレードオフを設計メモ化し、
   QA/PO 判断に回す。Phase 2 では判断材料の作成まで。

## スコープ外

- 変更影響範囲ベースのテスト選択 (fail-open リスクのため、一致率計測基盤が先)。
- ローカル snapshot runner の clone/install 固定費 (issue #98 の責務)。
- 内部 gate ↔ GitHub CI 一致率計測 (issue #109 の別 AC、後続 PLAN)。

## Schedule

- step 1 (serial): doctor 単一実行化の方式設計メモ + 等価性の oracle 宣言 (テスト設計)
- step 2 (step 1 と並列): shard 分割表の作成 (実測 duration 引用) + detector 追随のテスト設計
- step 3 (serial): 実装 + before/after 実測 (run URL を evidence として引用)
- step 4 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: code PR の harness-check-linux leg 実測が短縮される。before = 直近 main green
  run の実測 (~5 分、vitest 261s) を引用し、after は同条件 run URL で裏取る (prose
  断定禁止、PLAN-L7-89 claim discipline)。
- AC-2: doctor の governance 検査集合が単一実行化の前後で縮まないことをテストで固定
  (check 名の集合比較、fail-close)。
- AC-3: shard 片肺 (どちらかの shard job が required から外れる / 欠落する) を
  github-ci-policy detector が fail-close で検出する回帰テストが green。
- AC-4: 両 shard + aggregate の required context 構成で PR CI が green になる実 run を
  evidence として引用。
