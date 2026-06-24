---
plan_id: PLAN-L7-95-lint-wiring-meta-gate
title: "PLAN-L7-95 (troubleshoot): lint-wiring meta-gate — 死蔵ルール (reachable/tested だが audit 未実行) を fail-close + 4 inert lint audit を doctor へ配線 (IMP-006、IMP-033 配線部分の discharge)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-22
updated: 2026-06-22
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: code-reviewer subagent (sonnet) — intra_runtime_subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "PO『/goal 全数監査 → 実装もれ/ルール整備不備を直せ』を受け、死蔵ルール (src/lint module が tested-green だが runtime 実行経路から audit 未呼出) の absence-blindness を fail-close 化。新規 src/lint/lint-wiring.ts: loadLintWiringInput (src 全 *.ts の相対 import グラフ構築 + src/cli.ts から BFS 到達解析、コメント除去後に抽出) + analyzeLintWiring (純関数: wired/deferred/unwired/staleDeferred 分類、DEFERRED_LINTS 理由必須 + stale fail-close) + doctor checkLintWiring。あわせて inert だった 4 audit (doc-consistency 完全 inert / entity-coverage 完全 inert / fr-registry-audit helper 再利用で audit inert / improvement-backlog 同) を doctor へ実配線 (live で 4 本とも violation 0、blast radius 0)。回帰二重化 = meta-gate (module 到達性) + doctor invocation fence (tests/doctor.test.ts、配線済 audit が実行され続けることを assert)。code-reviewer (sonnet) が『コメントアウト/文字列内の from \"...\" を IMPORT_SPEC が誤マッチし死蔵 module を偽 wired 化し得る』correctness 懸念を指摘 → stripComments + extractImportSpecs を純関数化し comment 除去で remediate + 専用テスト追加。修正後も live 分類は不変 (wired=52, deferred=1 [tool-adapter], 死蔵 0 = 偽 wired は元々無し、robustness 改善)。docs back-fill = 要件 §G.10/§G.11/§G.12 に doctor 配線明示 + gate-design §7 を IMP-033 配線部分の partial discharge と注記 + improvement-backlog IMP-006 を implemented (= lint-wiring meta-gate)。typecheck / Biome / Vitest / doctor / db rebuild green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
agent_slots:
  - role: tl
    slot_label: "TL - lint-wiring meta-gate + 4 inert-lint audit wiring (absence-blindness on rule reachability)"
generates:
  - artifact_path: docs/plans/PLAN-L7-95-lint-wiring-meta-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/lint-wiring.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/lint-wiring.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-95 (troubleshoot): lint-wiring meta-gate + inert-lint audit 配線

## 0. Objective

「ルールモジュール (`src/lint/*.ts`) が定義済み・テスト green なのに、どの runtime 実行経路からも
audit が呼ばれず inert (死蔵)」という absence-blindness を fail-close で塞ぐ。あわせて、その状態に
あった 4 つの lint audit を doctor へ実配線し、実際に enforce されるようにする。

## 1. Problem (PO `/goal` 監査で発見)

PO の全数監査 (実装もれ / DB / ルール整備不備) で、以下が判明:

- `doc-consistency` / `entity-coverage` = **完全 inert**: `analyzeX` がどの src からも import されず、
  module 自体が runtime グラフから到達不能 (test だけ green)。
- `fr-registry-audit` / `improvement-backlog` = **audit inert (helper 再利用)**: module は到達可能だが、
  到達理由は **helper** の再利用のみ (`feedback-log` が `parseBacklogEntries`、`l6-fr-coverage` が
  `loadFrDocs/parseFrRows` を import)。本体 audit (`analyzeFrRegistry` / `analyzeImprovementBacklog`)
  は呼ばれていない。
- governance docs (要件 §G.11 / §1.10.G.12 / §1.10.G.10) は present 形で「自動検証する」と記すのに実体は inert
  = doc↔impl drift。
- これを検出するはずだった **IMP-006 (lint-coverage-map = 未検査 gap 可視化)** は `observed` のまま未実装。
- 既存ゲート群は「ルールが配線されているか」という一段メタな不変条件を**構造的に見ていなかった**
  (どの gate も「不在」を違反にできない absence-blindness、[[project_descent_absence_blindness]] /
  [[feedback_coverage_not_substance]])。

> 補正記録: 初期報告では「4 本とも tests からのみ参照」としたが、meta-gate の推移的到達解析が
> sibling `./` import (path に `lint/` を含まない) を捕捉し、`fr-registry-audit` / `improvement-backlog`
> は helper 経由で module 到達可能と判明。手動 grep が `lint/` 接頭辞前提で sibling import を取り逃した
> ([[feedback_verify_carry_status_against_code]])。実態は「2 完全 inert + 2 audit inert」。

## 2. Fix

### (A) lint-wiring meta-gate (`src/lint/lint-wiring.ts`、IMP-006)

- `loadLintWiringInput(repoRoot)`: `src/**/*.ts` を走査し相対 import グラフを構築、唯一の実行ルート
  `src/cli.ts` (RUNTIME_ENTRYPOINTS) から BFS で到達集合を求める。`.test.ts` は実行経路でないので根拠にしない。
- `analyzeLintWiring(input)` (純関数): 各 lint module を `wired` (到達可能) / `deferred`
  (`DEFERRED_LINTS` 理由付き allowlist) / `unwired` (死蔵=violation) / `staleDeferred`
  (DEFERRED 申告だが実は到達可能=violation) に分類。`ok = unwired 0 かつ staleDeferred 0`。
- `DEFERRED_LINTS` = `{ tool-adapter: adapter-probe 純関数ライブラリ、`ut-tdd adapter` 統合は IMP-033 / L7-50 R8 で deferred }`。
  「inert だが意図的」を honest に明示し、stale 化を fail-close で防ぐ (errata 双方向性、plan-supersession と同型)。
- doctor hard gate `checkLintWiring` として配線。

### (B) 4 inert lint audit を doctor へ配線

`doctor/index.ts` に `checkDocConsistency` / `checkEntityCoverage` / `checkFrRegistryAudit` /
`checkImprovementBacklog` を追加し、各 `analyzeX` を実行・fail-close。実リポで 4 本とも live で violation 0 を
確認済 = 配線は安全 (doctor red 化しない、blast radius 0)。これにより docs の「自動検証する」が真になる。

これは gate-design §7 が IMP-033 (cross-check rule engine) へ委ねた L7 carry のうち **「配線」部分の partial
discharge**。汎用エンジン本体と 5 lint の rule-type 吸収は IMP-033 に残す (本 PLAN は standalone 配線で
互換、エンジン到来時は rule instance へ移行)。

### (C) 死蔵検出の二重化 (回帰防止)

- meta-gate (module reachability) = 完全 inert module の再発を fail-close。
- doctor-output invocation fence (`tests/doctor.test.ts`) = 配線済 audit が runtime から実行され続けることを
  assert (helper-only 再利用で audit だけ inert 化する回帰を捕捉、symbol 単位の脆い heuristic を避ける選択)。

## 3. Acceptance Criteria

- [x] `lint-wiring` meta-gate が「全 `src/lint/*` は reachable か DEFERRED 登録済み」を fail-close (IMP-006)。
- [x] `doc-consistency` / `entity-coverage` / `fr-registry-audit` / `improvement-backlog` の audit が
  doctor から実行され violation 0 (実リポ live)。
- [x] DEFERRED_LINTS は理由必須 + stale (到達可能) を violation 化。
- [x] test: lint-wiring unit (reachable/unwired/deferred/stale) + 実リポ regression fence + doctor invocation fence。
- [x] typecheck / Biome / Vitest / doctor / db rebuild green。
- [x] docs back-fill: IMP-006 status 更新 + gate-design §7 partial-discharge 注記 + 要件 §G.11/§G.10/§G.12 に doctor 配線済を明示。

## 4. Out of scope

- IMP-033 汎用 cross-check rule engine 本体 + 5 lint の rule-type 吸収 = 本 PLAN は standalone 配線まで。
- `tool-adapter` / `recordGuardrailDecision` の本番統合 = それぞれ closed-as-library / auth-gated owner=PO で deferred
  (DEFERRED_LINTS / L7-48 carry で honest に追跡、死蔵ではない)。
- symbol 単位の「analyze 関数が呼ばれているか」検査 = helper-analyze (例 relation-graph) で false positive を
  生む脆さがあるため不採用。invocation fence (doctor test) で代替担保。

## 5. 壊さない / 再発させない

- **meta-gate の RUNTIME_ENTRYPOINTS / DEFERRED_LINTS を緩めるな**: 実行ルートを増やすと死蔵を見逃す。
  DEFERRED は理由必須 + stale fail-close を維持 (allowlist の片肺放置を防ぐ)。
- **4 audit の doctor 配線を外すな**: 外すと docs の「自動検証する」が再び嘘になる。invocation fence
  (doctor test) が外しを検出する。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`** (plan-registry-fingerprint stale 回避、
  [[project_codex_branch_ci_verification]])。
