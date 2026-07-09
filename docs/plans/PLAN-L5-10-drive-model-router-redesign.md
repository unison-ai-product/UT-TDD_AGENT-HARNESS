---
plan_id: PLAN-L5-10-drive-model-router-redesign
title: "PLAN-L5-10 (add-design/internal-processing): 駆動モデルルーターの正規化 — positive routing + layer 強制 + escape governance + add-impl デッドロック解消"
kind: add-design
layer: L5
sub_doc: internal-processing
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
    scope: "駆動モデルルーター L5 内部処理設計 (Appendix C: Forward 正規 / 完備性 invariant / 両肺設計義務 3 点セット / 粒度一致 / BDD / stage-aware intake / cold・plain L7 不成立 / Reverse 出所必須 / ルール外部化・未作成永続エラー / two-phase intake / escape governance)。ut-tdd codex --role tl で 4 周 (fail: Critical 1 + Important 3 → 全修正 → 残 C.1 到達性 → 修正 → C.2b 列挙同期 → 修正 → approve 残所見なし)。tests_green_at は最終修正後の doctor full exit 0 + plan lint OK の実走時刻。"
    worker_model: claude-fable-5
    reviewer_model: codex
    green_commands:
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T14:04:46+09:00"
        evidence_path: docs/design/harness/L5-detailed-design/internal-processing.md
        output_digest: "sha256:e575406e2f06aa34a12ced7dc8d549aec3c7a4ab566dc2f3f8052b12e01df24f"
        anchor_commit: 427c8a49b117d5ed64299aa4a51e91f5ec928d95
      - kind: lint
        command: "bun run src/cli.ts plan lint docs/plans/PLAN-L5-10-drive-model-router-redesign.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T14:04:46+09:00"
        evidence_path: docs/test-design/harness/L8-integration-test-design.md
        output_digest: "sha256:0a761f2c8919fc06bfcd314dbad6942fcbab0f23aa19cef334bcd738f73d1095"
        anchor_commit: 427c8a49b117d5ed64299aa4a51e91f5ec928d95
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/internal-processing.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL — routing 内部処理 / layer 強制契約 / escape governance のレビュー"
  - role: se
    slot_label: "SE — routeFiling 決定表 + route_mode_kind_layer + デッドロック解消の内部処理設計"
generates:
  - artifact_path: docs/plans/PLAN-L5-10-drive-model-router-redesign.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-03-internal-processing.md
  requires: []
  references:
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/process/modes/add-feature.md
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/plans/PLAN-L4-05-workflow-orchestration.md
    - src/schema/route-map.ts
    - src/plan/lint-policy.ts
    - src/plan/lint.ts
---

# PLAN-L5-10 (add-design): 駆動モデルルーターの正規化

## Status

draft 起票 (2026-07-07 PO 指示「駆動モデルルーターを正しく設計しなさい」)。L4 §3 の外部設計 (signal→mode /
mode↔kind 非1:1) は confirmed で正しい。本 PLAN は **L5 詳細設計 (内部処理) の altitude で、ルーターが
その外部設計契約を機械的に守らせる機構を正規化**する。関数契約の facet は L6 function-spec 追補 (pair
PLAN) で、経路B 哲学の変更を伴う場合は L4 §3 改訂で扱う (本 PLAN scope 外、§非対象)。

## 背景 — ルーターが「機能していない」実体

L4 [function.md](../design/harness/L4-basic-design/function.md) §3.1/§3.2 は「`feature_addition` →
Add-feature mode = `add-design`(L3-L6) + `add-impl`(L7)、出口=既存 parent PLAN 接続 + Reverse back-fill」
を正しく外部設計している。しかし **L5 内部処理として、この契約を強制する routing 機構が未設計**であり、
実装 (route-map.ts / lint-policy.ts / lint.ts) に次の穴がある:

1. **kind 制約が add-feature の 1 mode のみ**。他 11 mode は `src/plan/lint.ts` の
   `if (!allowedKinds) return []` 分岐で **kind 無制約** → `code_smell→refactor→L7` や `drift→
   reverse` を選べば新機能でも L7 impl が素通り。
2. **どの signal/mode も layer を routing しない**。layer は kind→layer envelope 内で著者の自由選択。
   signal→layer の positive な決定表が存在しない。
3. **`route eval` の出力が mode 止まり**。§3.1 が定める (kind, layer, sub_doc, pairing) の filing target を
   emit しない → ルーターは「どこに起票すべきか」を教えず、著者が決め lint が事後照合するだけ。
4. **draft-debt escape の governance 未設計**。`ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS`
   ([lint-policy.ts](../../src/plan/lint-policy.ts)) が add-feature + kind=impl を draft の間通すが、
   免除の期限・監査・再発防止が **audit doc 1 枚 ([route-mode-kind-debt-audit-2026-07-02.md]
   (../governance/route-mode-kind-debt-audit-2026-07-02.md)) にしか無く design 層に不在**。
5. **根本原因 = add-impl デッドロック**。[PLAN-L7-263:106-113](PLAN-L7-263-route-mode-kind-certificate.md)
   が自認: draft `add-impl` は `requires_not_ready` × `KIND_BACKFILL[add-impl]=required` のデッドロックで
   正規形を組めず、**38 本の PLAN が `kind:impl` (back-fill 免除) へ流れた**。「L7 直行を塞ぐ制御はどの層にも
   設計されていない」。
6. **L5 DSL drift**。[if-detail.md](../design/harness/L5-detailed-design/if-detail.md) §5 は routing 実体を
   `mode-routing.yaml` DSL と規定するが、実装は TS モジュール群であり乖離。

## 設計 — 正規化ルーター (L5 内部処理)

**最上位原則 (PO 2026-07-07 確定): Forward 正規**。ルーティングの既定は Forward (V-model spine を設計
先行で降りる正道)。非 Forward 駆動モデルは「Forward では解決できない」入口条件 (L4 §3.1 固有 signal)
が立つときに限り選択され、トリガ条件を justification として機械記録する。concept 行383/389 (Forward =
要件・設計・契約が明確なときの本体、他 mode は入口条件 + 必ず Forward 合流) の明示化であり、
[add-feature.md](../process/modes/add-feature.md) §1.1「経路 B = 最頻・default」の**既定の向きのみ**を
supersede する (経路 B 自体は「要件後追いで足りる」条件が立つときの条件付き経路として存続。経路 B でも
add-design(L6)→add-impl(L7) の親子連鎖は従来どおり必須 = cold L7 は経路 B でも元々禁止)。

internal-processing.md に次の内部処理設計を追補する:

0. **default-Forward 評価フロー**: (i) 失敗系 signal を L4 §3.2 全順序で評価 → (ii) 能動 mode の固有
   signal を評価 → (iii) いずれも立たなければ **Forward** を返す。非 Forward 決定には
   `forward_insufficient_reason` を必須で付与し、audit (route-approval.jsonl 同型) へ記録する。
1. **`routeFiling(signal, context) → FilingTarget`**: positive routing 関数。出力 =
   `{ mode, allowed_kinds, layer_band, sub_doc_hint, pairing_obligation, forward_insufficient_reason }`。
   `route eval` はこの完全な filing target を emit する (mode 止まりを廃止)。決定表は L4 §3.1 表を
   単一 source とする。
2. **layer 強制 (route_mode_kind → route_mode_kind_layer) + L7 cold intake 禁止**: mode → (kind →
   layer band) を L4 §3.1 から機械化 (add-design→L3-L6 / add-impl→L7 / refactor→L7 / …)。新機能の
   **設計層が必ず産出される**ことを保証する — すなわち design-first、または add-impl + Reverse
   back-fill のいずれかを強制し、**`kind=impl` 単独 (設計層 skip) を feature signal に対して禁止**する。
   さらに **L7 cold intake 禁止 (PO 2026-07-07)**: `layer=L7` の impl 系 PLAN は parent 連鎖が設計層
   PLAN (L4/L5/L6 の design/add-design) に到達することを必須とし、設計祖先ゼロの cold L7 起票を
   fail-close する (`l7-cold-intake` doctor check)。現行 schema は add-* のみ parent 必須で plain
   `kind=impl` は parent 不要という穴があり、これが「いきなり L7」を許してきた。L7 は実装工程の PLAN で
   あり設計判断の home ではない — add-feature.md Step 3/4 の暗黙ルールの機械化であり、bottom-up の
   順序自由 (要件 L1/L3 後追い) は変えない。
3. **add-impl デッドロック解消**: draft `add-impl` の `requires_not_ready` × `KIND_BACKFILL=required` を、
   add-impl と対の Reverse PLAN を **同時 draft 起票可能にする two-phase intake** で解く (Reverse 参照は
   required だが、参照先が draft でも intake を許容し、confirmed 昇格時に双方 ready を要求)。escape の
   根本原因を除去し、bottom-up 経路が `kind=impl` でなく `kind=add-impl` で正規に組めるようにする。
4. **escape governance**: draft-debt allowlist に `promote_by` 期限 + audit 追記 + doctor gate
   (期限超過、または新規 `kind=impl`+`add-feature` を justification なしで追加したら fail-close)。
   silent な設計 skip を機械で塞ぐ。
5. **intake-time routing check**: `route eval` / PLAN write 時に filing target を検証し、逸脱を
   その場で surface する (post-hoc doctor 依存を減らす)。
6. **DSL drift 是正**: if-detail.md の `mode-routing.yaml` 記述を実装実体 (TS contracts) に整合させる。

## 設計判断

- **(a) Forward 正規化 — PO 確定済 (2026-07-07)**: Forward を正規とし、他駆動モデルは「Forward では
  解決できない」入口条件が立つときに限定する。add-feature.md §1.1「経路 B = 最頻・default」の既定の
  向きを supersede (経路 B は条件付き経路として存続、`kind=impl` 単独 skip は禁止、cold L7 起票は
  fail-close)。confirmed 済 doc (add-feature.md、PO 2026-06-02 確定) の哲学変更にあたるため、
  add-feature.md / L4 §3 への back-fill を本 PLAN の add-impl 側 back-fill 義務に含める。
- **(b) kind 制約の他 mode 横展開 (PO エスカレーション、未確定)**:
  [PLAN-L7-263:127-128](PLAN-L7-263-route-mode-kind-certificate.md) は add-feature scope に凍結。
  reverse/recovery/refactor/retrofit へ同種 kind→layer 制約を広げるか。
  **推奨 = yes**(`if (!allowedKinds) return []` の穴を塞ぐ。Forward 正規化 (a) の帰結として、非 Forward
  mode ほど条件と制約を明示すべき)。

## 非対象

- ルーティング**関数契約**の facet (`routeSignalToMode` を FilingTarget emit へ拡張、`routeModeKind` の
  layer 化) は **L6 function-spec 追補 (pair PLAN)** の scope。
- 経路B 哲学そのものの変更を伴う場合の**外部設計**改訂は **L4 §3 add-design** の scope。
- 実装 (route-map.ts / lint-policy.ts / lint.ts の改修) は後続 **add-impl (L7)** の scope。

## §3 工程表

### Step 1: routeFiling 決定表 + FilingTarget schema の内部処理設計 (TL) [直列]

L4 §3.1 表を single source とした signal→(kind, layer_band, sub_doc, pairing) 決定表を internal-processing
へ設計。後続節がこの決定表に依存 (downstream_dependency)。

### Step 2: layer 強制 + add-impl デッドロック解消の内部処理設計 [直列]

route_mode_kind_layer の判定フローと two-phase intake の処理フローを設計。Step 1 の決定表を共有
(shared_state)。

### Step 3: escape governance + intake-time check の内部処理設計 [並列]

promote_by 期限・audit・fail-close 条件・intake 検証点を設計。別節のため並列可。

### Step 4: DSL drift 是正 + L8 結合テスト設計ペア [並列]

if-detail の DSL 記述を実装実体へ整合、L8-integration-test-design に routing 契約のペア節を追加。別 doc の
ため並列可。

### Step 5: cross-runtime 設計レビュー (pmo-sonnet / codex) [直列]

決定表の L4 §3.1 整合、layer 強制の網羅、escape governance の fail-close 妥当性、経路B 哲学判断を別
ランタイムでレビュー (downstream_dependency)。

## §3.1 実装計画

本 PLAN は設計 (internal-processing.md 追補) が成果物。Step 1-4 で internal-processing.md へ routing 機構
節を追記し、pair_artifact の L8-integration-test-design.md に結合テスト設計ペアを追加 → G5 pair-freeze →
後続 L6 function-spec 追補 (関数契約) と L7 add-impl (実装) を子 PLAN として連鎖する。設計判断 (a)(b) は
review evidence に PO サインオフを記録してから confirmed 化する。

## DoD / 受入基準

- [ ] internal-processing.md に routeFiling 決定表 + layer 強制 + デッドロック解消 + escape governance の
      内部処理設計が追補され、L4 §3.1 表と整合する (`ut-tdd doctor` design 系 green)。
- [ ] pair_artifact (L8-integration-test-design.md) に routing 契約のペア節があり pair-freeze 孤児 0
      (`ut-tdd doctor` の pair-freeze / verification-groups)。
- [ ] 「feature signal に対し kind=impl 単独を禁止する」設計判断 (a) が PO サインオフ付きで記録される。
- [ ] kind 制約横展開 (b) の scope が確定し、後続 add-impl の対象範囲が明記される。
- [ ] `ut-tdd plan lint` / `ut-tdd doctor` が green。
