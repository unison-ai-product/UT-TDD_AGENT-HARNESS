---
plan_id: PLAN-REVERSE-468-shared-memory-service-backfill
title: "PLAN-REVERSE-468: 共有 memory の service 単一路契約の上流合流 (L6 機能設計 + L5 物理データ + L4 module 境界)"
kind: reverse
layer: cross
drive: be
route_signal: drift
route_mode: reverse
confirmed_reverse_type: design
created: 2026-07-28
updated: 2026-07-28
owner: PM / PO
parent_design: docs/plans/PLAN-L7-468-shared-memory-sync-lifecycle-contract.md
pair_artifact: docs/design/harness/L6-function-design/memory.md
agent_slots:
  - role: tl
    slot_label: "TL - L7-468 実装から L4/L5/L6 への gap-only backfill と body 列廃止の整合判定"
  - role: qa
    slot_label: "QA - 上流 doc の記述 (正本/派生 index/service 単一路) と実装挙動の照合"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-468-shared-memory-service-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-468-shared-memory-sync-lifecycle-contract.md
  requires: []
  references:
    - docs/design/harness/L6-function-design/memory.md
    - docs/design/harness/L6-function-design/handover-mechanism.md
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L4-basic-design/architecture.md
  blocks: []
workflow_phase: R0
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
status: draft
review_evidence: []
---

# PLAN-REVERSE-468: 共有 memory の service 単一路契約の上流合流

## 対起票の根拠 (設計判断、2026-07-28)

PLAN-L7-468 は既存挙動の修理ではなく **新しい契約の追加**である: ファイル正本 /
DB は本文を持たない派生 metadata index / アクセスは service 単一路 / staleness は可視 /
`scope` と retire の状態機械 / 「共有済み = origin 到達」。したがって実装後に
「実装だけが知る契約」が残り、後続の memory 改修や projection 設計が旧前提
(body 複製 + DB 経由読み) で進む。これは backfill-pairing ゲートが防いでいる drift そのもの
なので `backprop_decision: not_required` ではなく Reverse 対起票を選ぶ (起票基準:
既存 spec への回帰 = 純修理なら not_required、新契約を足すなら Reverse 対)。

## gap の実測 (2026-07-28、scope 確定のため)

上流 doc は現在「body を DB に複製し、読み手は DB を読む」と明記しており、L7-468 の
方式変更と**正面から矛盾する**。放置すると doc が誤った正本になる。

- `docs/design/harness/L5-detailed-design/physical-data.md:240` — `memory_entries` の列に
  **`body` を明記**し、「SessionStart surface はこの table を read-only で読む」と規定。
  → body 列廃止と「読みはファイル正本」に更新が必要。
- `docs/design/harness/L6-function-design/memory.md:30` — `selectMemoryEntries` を
  「`memory_entries` table を持つ DB handle」を引数に取る contract として規定。
  → service 単一路と純粋 filter/ranker の contract に置き換えが必要。
- `docs/design/harness/L6-function-design/handover-mechanism.md:244` — 「authored markdown が
  正本、DB は rebuildable read model」とあり**方向性は既に正しい**が、本文複製と
  full rebuild 依存のラグは記述されていない。
- `docs/design/harness/L4-basic-design/architecture.md:92` — memory module の公開 API を
  `writeMemoryEntry / loadMemoryEntries / selectMemoryEntries / renderMemorySurface` と列挙し、
  「SessionStart で read-only/fail-open に surface する」と規定。→ **fail-open が
  「DB 障害時は無音」を正当化する根拠になっている**ため、劣化可視化の契約へ更新が必要。

## スコープ (gap-only backfill)

1. **L5 physical-data**: `memory_entries` を metadata index として再定義し、`body` 列廃止と
   `content_hash` による staleness 検出を明記する。
2. **L6 memory.md**: `MemoryService` を contract の入口とし、filter / 順位 / tie-break を
   純粋関数の contract として規定する。DB handle を直接取る API を supersede する。
3. **L6 handover-mechanism**: SessionStart surface の劣化契約 (DB 障害時も正本ファイルから
   memory を出す / 劣化は可視マーカー) を追記し、「fail-open = 無音」を否定する。
4. **L4 architecture**: memory module の公開 API と依存方向 (service 経由のみ、
   低レベル adapter は非公開) を更新する。
5. **`scope` / `status: retired` の状態機械**を L5/L6 のどちらに置くかを判定して記載する。
6. 「ファイル正本 / DB は任意の派生 index / service 単一路 / staleness 可視」の原則を
   **projection 全体へ適用するかは本 PLAN では決めない** — DB 再設計 PLAN の入力として
   ADR に原則だけ記録する (PO 合意: DB 再設計はコア安定後)。

## スコープ外

- L7-468 の実装そのもの (Forward 側の責務)。
- SQLite pragma の設計 (PLAN-L7-460 / PLAN-REVERSE-460 の責務)。
- projection 全体の service 入口化の実装。

## Schedule

- R0 (直列): L7-468 実装の観測 — 確定した index 列・service 境界・劣化契約を採取
- R1 (直列): gap 判定 (L4/L5/L6 のどこに何が矛盾/欠落しているか、影響なし面の明記)
- R2 (直列): 上流 doc への gap-only 追記と矛盾記述の supersede
- R3 (直列): pair_artifact (L6 memory.md) と実装の照合 (QA slot)
- R4 (直列): Forward 再合流判定 → confirm

## AC

- AC-1: L5 physical-data の `memory_entries` 定義に `body` 列が存在せず、metadata index +
  `content_hash` staleness 検出として記述されている (before = L5:240 の body 明記を引用)。
- AC-2: L6 memory.md の contract が service 入口に更新され、DB handle を直接取る旧 contract が
  supersede されたことが doc 上で追跡できる。
- AC-3: L6 handover-mechanism に「DB 障害時も memory は正本ファイルから出す / 劣化は可視」が
  記載され、L4 の `fail-open` 記述と矛盾しない (before = L4:92 の fail-open 記述を引用)。
- AC-4: L4 architecture の memory module 記述が公開 API と依存方向を反映している。
- AC-5: projection 全体への適用可否が「本 PLAN では決めない」と明示され、原則の記録先
  (ADR) が特定されている (未判定の面を残さない)。
