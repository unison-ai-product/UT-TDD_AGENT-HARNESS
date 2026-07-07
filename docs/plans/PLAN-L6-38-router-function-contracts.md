---
plan_id: PLAN-L6-38-router-function-contracts
title: "PLAN-L6-38 (add-design/function-spec): 駆動モデルルーターの関数契約 — routeFiling / routeModeKindLayer / FilingTarget (L5-10 の機能粒度 descent)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-07
review_evidence:
  - reviewer: codex-tl
    review_kind: cross_agent
    reviewed_at: "2026-07-07T14:09:36+09:00"
    tests_green_at: "2026-07-07T14:04:46+09:00"
    verdict: approve
    scope: "駆動モデルルーター L6 関数契約 (FilingTarget 型 = origin / requires_human_approval 含む完全形 / routeFiling invariant 群 / routeModeKindLayer / assertL7HasDesignAncestor)。PLAN-L5-10 と同一の codex-tl 4 周レビューで検証 (Critical: 型と invariant の乖離 → FilingTarget へ origin / requires_human_approval 追加 + U-ROUTE-R10 oracle 追加で解消、最終 approve 残所見なし)。tests_green_at は最終修正後の doctor full exit 0 + plan lint OK の実走時刻。"
    worker_model: claude-fable-5
    reviewer_model: codex
    green_commands:
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T14:04:46+09:00"
        evidence_path: docs/design/harness/L6-function-design/function-spec.md
        output_digest: "sha256:ab4440b424461e4a279d939d7da4a3da0fec60f8eb2b60b7ecd7e43b1f217c12"
      - kind: lint
        command: "bun run src/cli.ts plan lint docs/plans/PLAN-L6-38-router-function-contracts.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T14:04:46+09:00"
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: "sha256:fd3d2183fa2b9ac07bee33318913d56bf2b33c6316170b875a6958230c3306e0"
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL — routeFiling / routeModeKindLayer の pre/post/invariant 契約とエッジケースのレビュー"
  - role: se
    slot_label: "SE — 関数 signature + DbC docstring + edge-case 表の機能設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-38-router-function-contracts.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
dependencies:
  parent: docs/plans/PLAN-L6-01-function-spec.md
  requires: []
  references:
    - docs/plans/PLAN-L5-10-drive-model-router-redesign.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - src/schema/route-map.ts
    - src/plan/lint.ts
---

# PLAN-L6-38 (add-design): 駆動モデルルーターの関数契約

## Status

draft 起票 (2026-07-07)。PLAN-L5-10 (L5 詳細設計 = routing 機構の内部処理) の **機能粒度 descent**。
L5 が「機構がどう構造化され処理するか (モジュール責務・決定表・処理フロー、↔L8 結合)」を設計するのに対し、
本 L6 は「各 routing 関数の契約 = signature + pre/post/invariant + エッジケース (↔L7 単体)」を設計する。
これが V-model の L5→L6 正しい粒度降下 (詳細設計 → 機能設計)。

## 背景 — descent 元と接続点

- 上位: [PLAN-L5-10](PLAN-L5-10-drive-model-router-redesign.md) が positive routing / layer 強制 /
  escape governance / add-impl デッドロック解消の **内部処理機構**を設計する。
- 本 PLAN: その機構を実現する **関数契約**を [function-spec.md](../design/harness/L6-function-design/function-spec.md)
  へ追補する。既存の `routeSignalToMode` / `routeModeKind` / `routeCertificate`
  ([PLAN-L7-263](PLAN-L7-263-route-mode-kind-certificate.md) 由来) と同ファイル同粒度で接続し重複しない。

## 設計 — 関数契約 (function-spec 追補)

**最上位不変条件 (PO 2026-07-07 確定): Forward 正規**。ルーターの既定出力は Forward であり、非 Forward
駆動モデルは「Forward では解決できない」入口条件 (L4 §3.1 の固有 signal) が立つときに限り選択され、
トリガ条件を justification として機械記録する。条件が立たない入力は Forward へ落ちる (fall-through)。

1. **`FilingTarget` 型契約**: `{ mode, allowed_kinds[], layer_band[], sub_doc_hint, pairing_obligation,
   forward_insufficient_reason }`。L4 §3.1 表を single source とする不変条件を持つ。
   `mode != Forward` の場合 `forward_insufficient_reason` (トリガ signal + 条件) が必須。
2. **`routeFiling(signal, context): FilingTarget`**:
   - pre: `signal` は route-map の既知 token (最長一致解決済)、または token 不一致。
   - post: 既知 token → `mode` は既存 `routeSignalToMode` と一致し、`layer_band` は当該 mode の
     L4 §3.1 layer と一致、`allowed_kinds` は当該 mode の許可 kind。**token 不一致 / 例外条件が
     立たない → `mode=Forward` を返す (default)**。
   - invariant (Forward 正規): 非 Forward の FilingTarget は `forward_insufficient_reason` 無しに
     生成されない。
   - invariant (cold L7 禁止): いかなる signal に対しても `(kind=impl 単独, layer=L7)` を filing 入口
     として emit しない。L7 は設計層 PLAN の descent child (add-impl parent 連鎖) としてのみ到達可能。
3. **`routeModeKindLayer(plan): Violation[]`** (`routeModeKind` の layer 拡張):
   - post: `(mode, kind)` が L4 §3.1 の layer band 外なら `route_mode_kind_layer_mismatch` を返す。
   - fail-close: `feature_addition` + `kind=impl` は escape governance (promote_by 有効期限内 + justification)
     を満たさない限り violation。
4. **`assertL7HasDesignAncestor(plan, registry): Violation[]`** (cold L7 intake 禁止、`l7-cold-intake`
   doctor check の関数契約):
   - post: `layer=L7` の impl 系 PLAN (`impl`/`add-impl`) は parent 連鎖が設計層 PLAN (L4/L5/L6 の
     `design`/`add-design`) に到達しなければ `l7_cold_intake` violation。
   - 補足: add-feature.md Step 3/4 (経路 B でも add-design(L6)→add-impl(L7) 親子必須) の暗黙ルールの
     機械化であり、bottom-up の順序自由 (要件 L1/L3 の後追い back-fill) は変えない。
5. **エッジケース (function-design 粒度)**:
   - escalation 境界 signal → `requires_human_approval=true` 昇格 (mode に依らず)。
   - 複数 token 同時一致 → 最長一致 (`regression_prod` が `regression` に吸われない)。
   - 失敗系 signal 競合 → L4 §3.2 全順序 (Incident > Recovery > Reverse > Refactor)。
   - token 不一致 (未知 signal) → Forward (default) + 未知 token を warn 記録。
   - draft-debt `promote_by` 期限超過 → fail-close。
   - add-impl two-phase intake: 対の Reverse PLAN が draft でも intake 許容、confirmed 昇格時に双方 ready 要求。

## 非対象

- 内部処理機構・決定表・escape governance の**処理フロー**設計は PLAN-L5-10 (L5) の scope。
- lint/route-map の**実装**は後続 add-impl (L7) の scope。
- 経路B 哲学の外部設計変更は L4 §3 の scope。

## §3 工程表

### Step 1: FilingTarget 型 + routeFiling 契約の機能設計 (TL) [直列]

signature + pre/post/invariant docstring を function-spec へ設計。後続の lint 契約がこの型に依存
(downstream_dependency)。

### Step 2: routeModeKindLayer 契約 + fail-close 条件の機能設計 [直列]

Step 1 の FilingTarget を参照する lint 関数契約 (downstream_dependency)。

### Step 3: エッジケース表 + 単体テスト設計ペア [並列]

escalation / 最長一致 / promote_by / two-phase intake のエッジケースを列挙し L7-unit-test-design へペア節を
追加。別 doc のため並列可。

### Step 4: cross-runtime 設計レビュー (pmo-sonnet / codex) [直列]

契約の L5-10 機構整合、feature→impl 単独禁止 invariant、エッジ網羅を別ランタイムでレビュー
(downstream_dependency)。

## §3.1 実装計画

function-spec.md に routeFiling / routeModeKindLayer / FilingTarget の関数契約節を追補し、pair_artifact の
L7-unit-test-design.md に単体テスト設計ペアを追加 → G6 機能設計凍結 → 後続 add-impl (L7) が本契約を
実装する。PLAN-L5-10 と同時 review で L5⇔L6 の粒度整合を確認する。

## DoD / 受入基準

- [ ] function-spec.md に routeFiling / routeModeKindLayer / FilingTarget の pre/post/invariant 契約が
      追補され、既存 route 関数群と同粒度で接続する (`ut-tdd doctor` design 系 green)。
- [ ] `feature_addition` + `kind=impl` 単独を禁止する invariant がエッジケースとして明記される。
- [ ] pair_artifact (L7-unit-test-design.md) に単体テスト設計ペアがあり pair-freeze 孤児 0。
- [ ] PLAN-L5-10 を requires で参照し L5→L6 の descent 連鎖が成立する。
- [ ] `ut-tdd plan lint` / `ut-tdd doctor` が green。
