---
plan_id: PLAN-L7-464-doctor-incremental-and-lock-granularity
title: "PLAN-L7-464 (refactor): doctor の check 並列化・入力キー結果キャッシュ・scope 単位ロック (issue #70)"
kind: refactor
layer: L7
drive: agent
route_signal: debt
route_mode: refactor
status: draft
created: 2026-07-28
updated: 2026-07-28
backprop_decision: not_required
backprop_decision_reason: "doctor 実行エンジンの内部最適化 (behavior-invariant refactor)。check の検出集合・fail-close 性・hard gate 構成は不変で、上流 requirement / design 契約に影響しない。"
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - 結果キャッシュの入力 digest 境界 (stale 配膳ゼロ) と check 独立性の分類レビュー"
  - role: se
    slot_label: "SE - check 並列 scheduler + 入力キー cache + scope ロック実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-464-doctor-incremental-and-lock-granularity.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-442-doctor-singleton-guard.md
    - src/doctor/index.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-464 (refactor): doctor の並列化・結果キャッシュ・ロック粒度

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/70

## 背景 (実測)

- full doctor はローカル ~10〜20 分 (issue #70)。CI (linux) では 50s だが、
  vitest 内 U-TESTHYGIENE-028 が別途 runDoctor full を回し 114s (2026-07-28
  実測、run 29816573228) — CI 側の二重実行解消は PLAN-L7-461 スコープ 1。
- 2026-07-27/28 の hybrid 運用で、doctor snapshot が 15 分級のタイムアウトを
  反復し Codex の検証ループを支配した。
- doctor は **プロセス全体で 1 singleton ロック** (PLAN-L7-442)。hybrid では
  片方が doctor を回すともう片方の検証レーンが丸ごと待つ (直列化)。

## スコープ (behavior-invariant)

1. **check レベル並列化**: 独立な check (大半はファイル走査) を並列実行する。
   依存のある check (DB 前提など) は依存グラフで直列に残す。
2. **入力キー結果キャッシュ**: check ごとに入力 digest (対象ファイル集合の
   content digest + check 実装 version) をキーに前回結果を再利用。digest が
   1 bit でも変われば必ず再計算 (stale 配膳ゼロが絶対条件)。
3. **scope 単位ロック**: singleton を scope 粒度 (toolchain / plan / db / ...)
   に分割し、異 scope の並行実行を許す。同 scope 二重起動は従来どおり
   fail-fast (PLAN-L7-442 の規律は scope 内で維持)。

## スコープ外

- check 自体の実装最適化 (個別 check のアルゴリズム改善は別途)。
- CI 側の doctor 二重実行解消 (PLAN-L7-461 スコープ 1)。

## Schedule

- step 1 (serial): check 独立性の分類表 + キャッシュ digest 境界のテスト設計
- step 2 (serial): 並列 scheduler + cache 実装 + full doctor before/after 実測
- step 3 (step 2 と並列): scope ロック分割 + 異 scope 並行の回帰
- step 4 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: full doctor のローカル wall time が実測短縮される (before/after を実測値で
  evidence 引用、prose 断定禁止)。
- AC-2: check の検出集合が並列化・キャッシュ導入の前後で不変 (check 名と
  verdict の集合比較 oracle が green、fail-close)。
- AC-3: 入力 digest 変化時に必ず再計算される負例テストが green (stale 配膳ゼロ)。
- AC-4: 異 scope の doctor 並行実行が成立し、同 scope 二重起動は fail-fast の
  まま (PLAN-L7-442 回帰維持) をテストで固定。
