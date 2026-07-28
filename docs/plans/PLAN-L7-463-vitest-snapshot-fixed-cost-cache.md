---
plan_id: PLAN-L7-463-vitest-snapshot-fixed-cost-cache
title: "PLAN-L7-463 (refactor): snapshot runner 固定費の HEAD キャッシュ化 — clone/install/db rebuild の再利用 (issue #98)"
kind: refactor
layer: L7
drive: agent
route_signal: debt
route_mode: refactor
status: draft
created: 2026-07-28
updated: 2026-07-28
backprop_decision: not_required
backprop_decision_reason: "検証 runner の内部固定費削減 (behavior-invariant refactor)。テストの意味論・検証範囲・fail-close 性は不変で、上流 requirement / design 契約に影響しない。"
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - キャッシュキー設計 (決定性境界) と fail-open 化しない無効化条件のレビュー"
  - role: se
    slot_label: "SE - HEAD キー snapshot 再利用 + install/db rebuild スキップ実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-463-vitest-snapshot-fixed-cost-cache.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - scripts/run-vitest-snapshot.ts
    - tests/vitest-snapshot-runner.test.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-463 (refactor): snapshot runner 固定費の HEAD キャッシュ化

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/98

## 背景 (2026-07-28 実測)

vitest は必ず snapshot runner (`bun scripts/run-vitest-snapshot.ts`) 経由で、
毎回「committed HEAD の隔離 clone 作成 (6,629 ファイル処理) + install + db
rebuild (ローカル実測 36s)」を払う。**2 ファイルの targeted test でも 17〜25s**
(テスト本体 <1s)。TDD の red→green 反復と hybrid 両ランタイムの全検証がこの
固定費を払っており、開発ループ最大の税金 (2026-07-27 の Codex 検証ループが
push まで 50 分要した主因の一つ)。

## スコープ (behavior-invariant)

1. **HEAD sha キーの snapshot 再利用**: 同一 HEAD sha に対する 2 回目以降の
   実行は clone / install / db rebuild をスキップし、検証済み snapshot を再利用
   する。キーは HEAD sha + lockfile digest (install 境界) + projection 入力
   digest (db rebuild 境界)。
2. **無効化の fail-close**: キー不一致・snapshot 破損 (fingerprint 照合失敗)・
   キー算出不能の場合は必ず full 再構築へフォールバックする。「キャッシュが
   壊れていても再利用し続ける」fail-open 経路を作らない。
3. **並行実行の安全**: 両ランタイムが同時に同一 HEAD を検証するケースで
   snapshot を共有しても git-workspace-fingerprint (global-setup) の不変検査が
   成立すること。

## スコープ外

- テスト自体の高速化 (shard は PLAN-L7-461、テスト設計改善は別 PLAN)。
- doctor の incremental 化 (PLAN-L7-464)。

## 設計急所 (TL レビュー必須)

キャッシュ再利用は「キーが同じなら snapshot も同じ」という決定性が前提。
キーの取り違え = 古い code でテストする fail-open であり、検証基盤の信頼を
毀損する。よって AC-2 の負例 oracle (キー成分を 1 つずつ変えて必ず再構築に
落ちること) を green にするまで再利用経路を有効化しない。

## Schedule

- step 1 (serial): キャッシュキー成分の確定 + 負例 oracle のテスト設計
- step 2 (serial): 実装 + before/after 実測 (targeted 2 ファイル実行の wall time)
- step 3 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: 同一 HEAD での 2 回目 targeted 実行の wall time が実測短縮される
  (before = 17〜25s、2026-07-28 実測。after は実測値を evidence 引用、prose 断定禁止)。
- AC-2: キー成分 (HEAD sha / lockfile digest / projection 入力 digest) のいずれかが
  変わると必ず full 再構築に落ちる負例テストが green。
- AC-3: snapshot 破損 (ファイル改変) を fingerprint 照合が検出し full 再構築に
  落ちるテストが green。
- AC-4: 既存の snapshot runner 回帰 (tests/vitest-snapshot-runner.test.ts) が
  無改変で green (behavior-invariant の regression fence)。
