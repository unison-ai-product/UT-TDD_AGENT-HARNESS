---
plan_id: PLAN-L6-60-trace-impact-traversal-command
title: "PLAN-L6-60 (add-design): ID 起点 trace 影響範囲 traversal コマンド (ZIP impact.py 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - ID 起点 traversal コマンドの契約設計、change-impact.ts との役割境界"
generates:
  - artifact_path: docs/plans/PLAN-L6-60-trace-impact-traversal-command.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
  requires: []
  references:
    - docs/design/harness/L6-function-design/graph.md
    - src/lint/change-impact.ts
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-60: ID 起点 trace 影響範囲 traversal コマンド

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `impact.py` は ID を起点に上流/下流/横 (テスト)/本文参照/台帳を辿る変更影響コマンドを提供する。
UT-TDD 側 `src/lint/change-impact.ts` は変更ファイル集合を source/design/test に分類し「更新漏れ」を
検出するのみで、**特定 ID 起点の trace グラフ traversal** (「この ID を変えたら何が影響を受けるか」を
ID 単位で辿る機能) は無い (裏取り: `changeSetIntegrityMessages` 等の API を確認、traversal 関数不在)。

harness.db には `trace_edges` (設計間の artifact 粒度の依存投影、`.ut-tdd/audit/A-185` §B② で言及) と
`spec_defs`/`spec_relations` (`PLAN-L6-43` typed-spec-trace-closure が持つ ID 粒度の宣言的関係) の
2 種の投影がある。ID 起点 traversal は artifact 粒度ではなく ID 粒度を要するため、本 PLAN は
`spec_defs`/`spec_relations` を土台とし、`trace_edges` (artifact 粒度) は横断参照の補助情報として
併用する契約とする。

## 1. 設計スコープ

1. ID (oracle/entity/PLAN 等) を起点に `spec_relations`/`spec_defs` を辿り、上流 (この ID が依存する
   定義) / 下流 (この ID に依存する箇所) / 横 (対応するテスト) を列挙する契約を設計する。`trace_edges`
   は artifact 粒度の補助参照として併用する。
2. 既存 `change-impact.ts` (ファイル集合の分類) との役割境界を明記する (ファイル粒度 vs ID 粒度)。
3. 出力は CLI コマンド (`ut-tdd trace impact --id <id>` 相当) として設計する。

## 2. 受け入れ条件 (design freeze 時)

- ID 起点 traversal の入出力契約が L6 function-spec として固定される。
- `change-impact.ts` と重複しない役割分担が明記される。
