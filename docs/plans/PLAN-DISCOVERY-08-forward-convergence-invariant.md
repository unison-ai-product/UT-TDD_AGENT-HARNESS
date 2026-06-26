---
plan_id: PLAN-DISCOVERY-08-forward-convergence-invariant
title: "PLAN-DISCOVERY-08 (kind=poc): forward-convergence 不変条件 — 別フローの最終実態が Forward に集約されるまで freeze 不成立を機械強制する metamodel 検証 (集約義務の網羅化 + freeze gate 完全性)"
kind: poc
layer: cross
workflow_phase: S4
scrum_type: design-spike
drive: be
status: confirmed
decision_outcome: confirmed
promotion_strategy: reuse-with-hardening
created: 2026-06-26
updated: 2026-06-26
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: aim
    slot_label: "AIM — forward-convergence 判定語彙の設計 (spine内外 / addition / landed / deferred / local_impl_only)"
  - role: tl
    slot_label: "TL (別 runtime=Codex) — engine 設計クロスレビュー + descent-obligation/impl-plan-trace 非重複判定"
  - role: po
    slot_label: "PO — 不変条件の正本化採否 + freeze gate fail-close 接続 (規範変更 = S4 gate)"
generates:
  - artifact_path: docs/plans/PLAN-DISCOVERY-08-forward-convergence-invariant.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/forward-convergence.ts
    artifact_type: source_module
  - artifact_path: tests/forward-convergence.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - PLAN-DISCOVERY-01-workflow-metamodel
  references:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    - docs/plans/PLAN-L7-146-serverless-readonly-share.md
review_evidence:
  - reviewer: codex
    review_kind: cross_agent
    reviewed_at: "2026-06-26T14:52:00+09:00"
    tests_green_at: "2026-06-26T14:49:00+09:00"
    verdict: approve
    worker_model: claude-opus-4-8
    reviewer_model: gpt-5.5
    scope: "別 runtime (Codex gpt-5.5, role=tl) が PM=opus の forward-convergence analyzer 実装 (src/lint/forward-convergence.ts + test + doctor report-only 配線) を desk review。verdict=APPROVE-WITH-CHANGES (Critical 0)。判定語彙 (spine内外/landed/local_impl_only)・SSoT 非重複 (poc=scrum-reverse / add-impl 等=backfill / impl=本 analyzer) を支持。baseline 2 件 (PLAN-L7-147 / PLAN-L7-62) は真陽性と確認。Important (docs/process・docs/adr parent_design を spine-外とする回帰テスト追加) を反映済 (15 tests)。Minor (not_required 理由長を S4 で schema 明記) は Step5 follow-up。前段の診断/方向性 desk review (.ut-tdd/review/cross-review-forward-convergence-invariant.md、総合 AGREE) も同 runtime。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/forward-convergence.test.ts (15 tests: spine接続×5 / landed-disposition×2 / 分類×6 / parse+messages×2)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T14:49:00+09:00"
        evidence_path: tests/forward-convergence.test.ts
        output_digest: "sha256:f069920038d511eb8f00e6aaa1fa6fa223062f237b21e88085e7ba8f13e8e9d5"
      - kind: unit_test
        command: "bunx vitest run tests/forward-convergence.test.ts (analyzer 本体 analyzeForwardConvergence/isSpineConnected/hasLocalImplOnlyDisposition 実挙動)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T14:49:00+09:00"
        evidence_path: src/lint/forward-convergence.ts
        output_digest: "sha256:51d23f4db4ee7890a4d75606a7cd4567ca64a0b58f44587d57f215297124cb28"
---

# PLAN-DISCOVERY-08 (kind=poc): forward-convergence 不変条件

## 0. Objective (PO 指示 2026-06-26)

PO 発話:
> 「別フローはフォワード外を安全に隔離するためのもので、最終実態はフォワードに集約されないといけない。
> フォワードが最終正本として成立しなくなる。フォワードはきれいな状態を保った製本であるべき。」

= **Forward (L0-L14 spine) = きれいな最終正本 (製本)**。別フロー (Reverse/Add-feature/Discovery/Scrum/
Recovery/Incident/Refactor/Retrofit/spine 外 impl) は Forward 外の作業を安全に隔離する装置であり、その
**最終実態は必ず Forward へ集約 (backprop_decision 経由の合流 / Reverse back-fill) される**。未集約の別フローが
宙に浮いたまま「Forward freeze = 最終正本成立」を主張してはならない。

本不変条件は設計正本 `docs/process/modes/README.md` に既に明文化されている (§1 出口=Forward 合流 /
§5 共通原則 / §LOWER-L-REVERSE-BACKPROP=§6.8.8「L4-L14 の addition は backprop_decision 必須、requires_*
open のまま accept/close 不可」)。**原則は欠けていない。欠けているのは機械強制**。本 spike はその enforcement
gap を Discovery dogfood で確定する。

## 1. Gap (機械強制の 2 つの穴) — cross-review 済 (Codex tl = AGREE)

診断と方向性は別 runtime クロスレビュー済 (証跡 = `.ut-tdd/review/cross-review-forward-convergence-invariant.md`
+ Codex gpt-5.5 応答、role=tl、総合判定 AGREE、2026-06-26)。

### 穴① back-fill 強制が kind を選り好みする
`src/lint/backfill-pairing.ts` `KIND_BACKFILL` は `impl` / `poc` / `reverse` / `recovery` / `design` /
`add-design` / `charter` を `none` 扱いにし、`req === "none"` で集約検査を完全スキップする。§6.8.8 の
「L4-L14 の addition は backprop_decision 必須」とズレ、**spine 外 impl/poc が新規 addition を作っても
集約義務から抜ける**。

### 穴② freeze gate が未集約の別フローを見ない
`src/vmodel/lint.ts` の L0-L7 freeze (`analyzeVerificationGroups` / `frozen`) は L1-L6 pair freeze と
固定 9 PLAN (`L0_L7_AUTOMATION_PLAN_IDS`) の evidence のみを見る。「spine 外に Forward 未集約の impl/poc が
landing していないか」を検査しない。実証: doctor は non-terminal L7 が 3 件ある状態でも
`実装検証サイクルゲート [L0-L7]: ✅ freeze 完了` を出す (absence-blindness: 不在≠違反、
[[project_descent_absence_blindness]] / [[feedback_coverage_not_substance]])。

### 既存統制は部分的 (Codex 指摘)
`parent_design` / `descent-obligation` / `impl-plan-trace` / `program-coverage` / `screen-impl-pair-freeze` /
`scrum-reverse` はいずれも防波堤だが、「spine 外 impl/poc が Forward 未集約なら freeze 不成立」を**一般条件として
fail-close する SSoT ではない**。

## 2. 判定語彙 (本 spike が確定する metamodel 用語、Codex 補正反映)

| 用語 | 定義 (判定ルール) |
|---|---|
| spine 内 | Forward に降下済 = `parent_design` が L6 / `requires` で上流設計に接続 / roadmap span に登録、のいずれか |
| spine 外 | 上記いずれにも接続しない PLAN |
| addition | 新規 capability を作る (既存実装への差分でない) |
| landed | status=confirmed/completed かつ実装が実在 (= 最終実態) |
| draft/deferred | 未 landing の将来作業 (status=draft / deferred 注記) |
| local_impl_only | 明示理由付きで Forward 集約不要と判定された spine 外作業 (§6.8.8 の disposition) |

**不変条件 (本 spike が機械強制を設計する対象)**:
- **landed かつ spine 外かつ addition かつ (backprop_decision / Reverse 合流 が未) → freeze 不成立 (fail-close)**。
- **draft/deferred は「未集約実装」と同一視しない** (将来作業)。ただし freeze 表示で outstanding として surface する。
- **spine 内 impl は合法** (既に L6→L3 descent 済)。kind=impl を一律 add-impl に直すのは過剰 = やらない。
  parent_design 不在等で宙に浮く impl は mis-routed / missing descent と判定し、add-design/add-impl へ切るか
  impl のまま backprop_decision + Reverse 合流を要求する。

## 3. PoC 計画 (S2 build。report-only 先行、規範変更は S4 後)

- `src/lint/forward-convergence.ts` (新規、純関数) — 全 PLAN + roadmap 登録から各 spine 外 impl/poc を
  {converged / unconverged-landed / draft-deferred / local_impl_only} に分類。grounding は実体
  (parent_design/requires/roadmap span/backprop_decision) で行い prose で判定しない。
- `tests/forward-convergence.test.ts` (新規) — 分類ルール + false-positive 非発火 (spine 内 impl 不検出 /
  draft-deferred を violation にしない) を Red 先行で検証。
- **現リポへ適用して `unconverged-landed` の実数を正直に測定** (baseline。0 と仮定せず実測、
  [[feedback_coverage_not_substance]])。
- doctor へ **advisory (report-only) で先行 surface**。fail-close 昇格と KIND_BACKFILL / freeze gate への
  接続、modes/requirements/L6/L7 oracle への back-merge は **S4 ADOPT 後** (規範変更 = concept/requirements
  先行ルール、modes README)。
- SSoT 一元化: `descent-obligation` / `impl-plan-trace` の分類を再利用し同じ判定を二重実装しない (Codex 指摘)。

## 4. Acceptance Criteria (falsifiable / コマンド引用、prose 禁止)

- **AC-1 engine green**: `bunx vitest run tests/forward-convergence.test.ts` exit 0。
- **AC-2 判定語彙**: analyzer が spine 外 impl を 4 区分に分類し、各 unconverged-landed が grounding
  (接続不在) を伴う (test の分類ケース)。
- **AC-3 baseline 実測**: analyzer を現リポへ適用し `unconverged-landed` の件数を出力 (実測値を下記に記録、0 を仮定しない)。
- **AC-4 false-positive 非発火**: parent_design/requires/roadmap span 接続済 impl を flag しない、かつ
  draft/deferred を violation にしない (test の負系ケース)。
- **AC-5 SSoT 非重複**: descent-obligation/impl-plan-trace と別々に同じ判定を再実装していない (クロスレビューで支持)。
- **AC-6 無回帰**: `ut-tdd doctor` exit 0 / `bun run test` (vitest 全量) green / `ut-tdd plan lint` / `bun run lint` /
  `bun run typecheck` 通過。

### AC 充足状況 (confirmed scope = Step 1-4 = analyzer engine + report-only surface + baseline + cross-review、2026-06-26)

- **AC-1 ✓**: `tests/forward-convergence.test.ts` 15 tests green。
- **AC-2 ✓ / AC-4 ✓**: 分類ケース + 負系 (spine 接続済 flag せず / draft-deferred を violation にせず /
  local-impl-only 許可 / scope 外 kind 無視) + Codex Important 反映の境界回帰 (docs/process・docs/adr parent_design=spine-外)。
- **AC-3 ✓ baseline 実測値**: 現リポの `unconverged-landed` = **2 件** ——
  `PLAN-L7-147-refactor-candidate-detector` (parent_design=docs/process/modes/refactor.md) /
  `PLAN-L7-62-runtime-portability-guard` (parent_design=docs/adr/ADR-001)。いずれも L6 設計 / L1-L6 Forward PLAN
  へ降下せず backprop_decision も無い landed impl = 真陽性 (Codex 確認)。その他 spine-internal 33 / converged 0 /
  local-impl-only 0 / draft-deferred 0。これらの disposition (Forward 集約 or local_impl_only) は **Step 5 = S4 PO 判断**。
- **AC-5 ✓**: scope=kind:impl のみ。poc=scrum-reverse / add-impl 等=backfill に委譲し二重計上なし (Codex 支持)。
  requires=backfill-pairing.parseRequires / reverse links=scrum-reverse.parseLinks / roadmap span=roadmap-registry を再利用。
- **AC-6 ✓**: `bun run typecheck` exit 0 / `bunx biome check` (新 3 file) クリーン / `ut-tdd plan lint` exit 0 /
  `bun run test` (vitest 全量) exit 0 / `ut-tdd doctor` exit 0。
- review: Codex (gpt-5.5, role=tl) cross_agent = APPROVE-WITH-CHANGES (Critical 0)。Important 反映済、Minor は Step5 follow-up
  (frontmatter `review_evidence` 参照)。

> **本 PLAN の confirmed scope = Step 1-4 (analyzer engine + report-only doctor surface + baseline + cross-review)**。
> Step 5 (S4 decision = 不変条件の正本化 + KIND_BACKFILL/freeze gate への fail-close 接続 + modes/requirements/L6/L7
> back-merge + 157/141/146 再分類 + baseline 2 件の disposition) は **decision_outcome 未設定 = PO-gated の後続スコープ**。
> 本 confirm は engine + report-only surface の着地のみを意味する (DISCOVERY-07 と同パターン)。

## 5. §工程表 schedule (並列/直列 明示、review step 必須)

| Step | 内容 | 並列/直列 | 直列理由 |
|------|------|-----------|----------|
| 1 | analyzer engine 設計 + Red test 先行 + impl (`forward-convergence.ts` + test、report-only) | [直列] | downstream_dependency (判定語彙が後続の surface/接続に必須) |
| 2 | 現リポへ適用し `unconverged-landed` baseline を実測 + doctor へ advisory surface | [直列] | downstream_dependency (Step1 engine 着地後にのみ測定可能) |
| 3 | 検証 (typecheck / biome / vitest 全量 / doctor / plan lint) | [直列] | shared_state (HEAD 基準の全量検証は Step1-2 着地後に意味を持つ) |
| 4 | クロスレビュー (別 runtime=Codex / intra_runtime_subagent) — 判定語彙妥当性 + 非重複 | [直列] | downstream_dependency (定量 green 後にレビュー、IMP-077 定量→定性順) |
| 5 | S4 decision → 正本 back-merge (modes README §6.8.8 / requirements §1.3·§6.8.8 / L6 設計 / L7 oracle) + KIND_BACKFILL/freeze gate へ fail-close 接続 + 157/141/146 を新ルールで再分類 | [直列] | downstream_dependency + PO gate (規範変更は concept/requirements 先行・PO サインオフ必須) |

## 6. S4 exit 条件 (本 spike の決着点)

- AC-1〜AC-6 充足 (定量) + baseline 実測値の確定。
- クロスレビューで「判定語彙が妥当」「descent-obligation/impl-plan-trace と非重複」が支持される (定性)。
- 上記を踏まえ **S4 で不変条件の正本化 + fail-close 接続の採否を PO 判断**:
  - ADOPT なら requirements §6.8.8 / modes README / L6 設計 / L7 oracle へ back-merge し、KIND_BACKFILL と
    freeze gate を fail-close 化、`PLAN-REVERSE-*` で Reverse 合流 (confirmed poc の IMP-064 義務)。続けて
    157/141/146 を新ルールで再分類 (141/146=deferred 表現、157=配布 capability の L6 descent 有無を重点確認)。
  - 規範変更 (concept/requirements/process 本文) は PO サインオフ前に書かない。本 spike では engine + test +
    report-only surface に留める。

## 7. 壊さない / 再発させない

- **false-positive を作らない** (Codex 最重要補正): spine 内接続済 impl をブロックしない / draft・deferred を
  「未集約実装」扱いしない (outstanding surface に留める) / local_impl_only は明示理由付きで許可する。
- **個別是正を先行しない**: 157/141/146 を先に直すと同じ穴が別 PLAN で再発する。metamodel (判定語彙 + gate) を
  先に確定してから再分類する。
- **SSoT 一元化**: forward-convergence を単一正本にし、descent-obligation/impl-plan-trace と同判定を二重実装しない。
- **規範変更は PO gate**: requirements/modes/concept の本文編集は S4 ADOPT 後に限る。
- **base = push 済 HEAD**。他ランタイム commit を破壊しない。
