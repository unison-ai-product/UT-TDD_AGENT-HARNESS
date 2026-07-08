---
plan_id: PLAN-L6-61-spec-rag-closure-ledger
title: "PLAN-L6-61 (add-design): 要求〜テスト RAG 閉包状態台帳 (ZIP spec_check.py 相当)"
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
    slot_label: "TL - RAG (赤黄緑) 閉包状態台帳の契約設計、L6-43 との役割境界"
generates:
  - artifact_path: docs/plans/PLAN-L6-61-spec-rag-closure-ledger.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
  requires:
    - docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
    - docs/plans/PLAN-L6-60-trace-impact-traversal-command.md
  references:
    - docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-61: 要求〜テスト RAG 閉包状態台帳

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `spec_check.py` は要求→要件→設計→テストの各段階を RAG (赤黄緑) で閉包検査し、`--impact` で
影響範囲付き表示を行う。UT-TDD 側の `PLAN-L6-43` (typed-spec-trace-closure、status: confirmed) は
`traces_from`/`traces_to`/`tests` の閉包不変条件 (宙吊り・逆流検出) を doctor hard gate として持つが、
これは**個別 ID の閉包違反検出**であり、**要求〜テストの全体を束ねた RAG 状態集計ビュー・台帳**とは
範囲が異なる (裏取り: `L6-43` は違反検出のみで状態台帳を generates していない)。

本 PLAN は `L6-43` の閉包判定結果を入力に、要求単位/要件単位で「どこまで緑 (テストまで到達済み) か」を
一覧できる状態台帳を設計する。

## 1. 設計スコープ

1. `PLAN-L6-43` の閉包判定 (宙吊り/逆流) を要求 ID 単位に集計し、RAG (赤=未着手、黄=一部到達、
   緑=テストまで閉包) の状態台帳データモデルを設計する。
2. `--impact` 相当 (ある要求が壊れた場合の影響範囲) は `PLAN-L6-60` (trace impact traversal) の
   出力を再利用する契約とし、重複実装しない (本 PLAN は `PLAN-L6-60` を `requires` とする)。
3. 本 PLAN の「閉包 RAG」(要求〜テストの spec 閉包状態) と、既存 `PLAN-L6-52` の「工程表 RAG」
   (`schedule_entries.rag`、実行割当の進捗ステータス) は対象が異なる別概念であることを明記する
   (前者=spec 閉包の到達度、後者=作業進捗)。同じ RAG 語彙を再利用する場合は投影先テーブルを分離する。
4. 台帳の投影先・更新タイミング (doctor 実行時 vs 常時投影) を設計する。

## 2. 受け入れ条件 (design freeze 時)

- RAG 状態台帳のデータモデルが `PLAN-L6-43` の閉包判定結果を非破壊で入力とすることが明記される。
- `PLAN-L6-60` との重複実装がないことが明記される。
- 「閉包 RAG」と `PLAN-L6-52` の「工程表 RAG」の非重複が明記される。
