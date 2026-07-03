---
plan_id: PLAN-L7-329-module-l6-design-backfill
title: "PLAN-L7-329 (impl): L6 機能設計 doc 不在 6 モジュールの add-design back-fill (context/guardrail/graph/github/memory/secret)"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 + guardrail/github の安全境界設計レビュー (エスカレーション必須)"
  - role: tl
    slot_label: "TL - 各 doc の L6 粒度 (IF contract / 失敗モード / V-pair) 充足確認"
  - role: se
    slot_label: "SE - L6 設計 doc 6 本の執筆 (並列可)"
generates:
  - artifact_path: docs/plans/PLAN-L7-329-module-l6-design-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/plans/PLAN-L7-302-context-tiering.md
---

# PLAN-L7-329 (impl): L6 機能設計 doc 不在 6 モジュールの back-fill

## Status

**version-up parked (v2)**。A-182 所見 DQ-2/DQ-7 (QU-2)。PO 指示 2026-07-03「アップデートでプラン化」。**guardrail / github の 2 本は安全境界 (escalation 範囲・PR fail-close guard) の定義そのものになるため、執筆前に PO エスカレーションが必須** (仕様を発明しない)。

## 背景 (実測 2026-07-03、A-182 §2)

- `context` / `guardrail` / `graph` / `github` / `memory` / `secret` の 6 モジュールは architecture.md §3.1 の登録行 (1-2 行) のみが設計根拠で、`docs/design/harness/L6-function-design/` に対応 doc が無い (`find docs/design/harness/L6-function-design -name "*<module>*"` = 0 件)。
- 特に context は a13a83d (2026-07-03) で architecture 登録直後の最新実装 (doc-router、L7-302 部分 landed) — 設計意図 (fail-open 方針、候補抽出ロジック) が doc から読めない。
- 影響: 設計粒度 = テスト設計粒度ルールの実態逸脱。後続エージェントが 2 行の説明で安全境界実装 (guardrail の human signoff 判断 / github の fail-close guard) を拡張する事故リスク (DQ-2)。

## スコープ (1 要件: 6 モジュールの L6 機能設計 doc を新規作成する — 宣言された束、per-doc 並列)

各 doc は L6 標準構成 (frontmatter V-pair / IF contract / 失敗モード / doctor surface / carry) で `docs/design/harness/L6-function-design/` へ新規作成:

| doc | 主内容 | ゲート |
|---|---|---|
| context.md | doc-router (buildDocIndex/suggestSections/contextSuggest)、fail-open 設計 | 通常 (L7-302 の設計 back-fill) |
| memory.md | memory_entries projection、secret fail-close、SessionStart surface | 通常 |
| graph.md | RelationGraphSourceSet loader、lint/relation-graph との分業 | 通常 |
| secret.md | SECRET_PATTERN/isSecretLike、依存なし安定核の設計理由 | 通常 |
| guardrail.md | guardrail_decisions ledger、human-required 格下げ禁止 | **PO 先行レビュー** |
| github.md | GithubOpsGuard fail-close (poc/main merge、hotfix postmortem、Conventional Commit) | **PO 先行レビュー** |

新規ファイル作成のみで既存ファイルへの編集は architecture.md の pair 参照行が必要な場合に限る (Codex hot zone 外)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | guardrail/github の設計範囲を PO へエスカレーションし決定を本文へ書き戻す | 直列 (先行) |
| 2 | context/memory/graph/secret の 4 doc 執筆 | **並列可** |
| 3 | guardrail/github の 2 doc 執筆 (Step 1 の決定後) | 並列可 |
| 4 | V-pair (L7 unit-test-design との対応) 記載 + readability green | 直列 |

## DoD

- [ ] 6 doc が L6 標準構成で存在し、`find docs/design/harness/L6-function-design` で確認できる
- [ ] guardrail/github の 2 本に PO レビュー記録 (review_evidence) が付く
- [ ] 各 doc の記述する export 関数名が src 現物と Grep 一致 (stale で生まれない)
- [ ] doctor readability / doc 系 check green

## 実装ノート (後続モデル向け)

- 6 doc は独立執筆可能 — 1 doc = 1 subagent の並列 fan-out が効率的 (docs 系は Sonnet 既定)。
- 活性化時 kind 昇格は add-design が正 (§6 手順)。
- 記述の正本は src 現物 (architecture §3.1 は要約) — 必ず実装を読んでから書く。
