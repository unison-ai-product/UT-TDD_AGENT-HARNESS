---
plan_id: PLAN-L6-00-master
title: "PLAN-L6-00 (Master hub): L6 機能設計 — 必須/選択 triage + child PLAN 合成"
kind: design
layer: L6
drive: fullstack
status: confirmed
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
master_hub: true
agent_slots:
  - role: tl
    slot_label: "TL — L6 機能設計 (関数 schema / DbC pre-post / pseudocode / edge) のレビュー (別 runtime)"
  - role: aim
    slot_label: "AIM — L6 単体テスト設計 (L7 pair) の観点レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L6-00-master.md
    artifact_type: markdown_doc
roadmap:
  layer: L6
  gates:
    - id: G-DESIGN.L6
      name: L6 機能設計 freeze
      exit_criteria: "L6 機能設計 sub-doc (function-spec/edge-case + governance/enforcement lint 群の機能設計) が child PLAN で confirmed、L6↔L8 V-pair (pair-freeze 孤児0) 整合、G6 PASS 台帳と一致 (draft span = 未 freeze の残り frontier)"
  spans:
    - plan_id: PLAN-L6-01-function-spec
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-02-edge-case
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-03-session-log
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-04-forced-stop-feedback
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-05-setup-solo-team
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-06-handover-mechanism
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-07-agent-slots
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-08-backfill-pairing
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-09-governance-enforcement
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-10-vmodel-pair-lint
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-11-verification-trigger
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-12-review-evidence
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-13-cross-review-enforcement
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-14-test-before-review
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-15-module-drift
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-16-handover-quality
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-17-gate-confirm
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-18-review-evidence-stale
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-19-plan-schedule-lint
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-20-runtime-adapter-session-lifecycle
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-21-fr-unit-coverage
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-22-l6-completion-readiness
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-23-coding-rules-workflow
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-24-structured-error-handling
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-25-module-boundary-rule
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-26-domain-boundary-lint
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-27-invariant-test-trace
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-28-red-first-tdd-evidence
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-29-test-oracle-strength
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-30-integration-gwt-lint
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-31-cross-artifact-relation-graph
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-32-mcp-profile-config-safety
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-33-tool-adapter-probes
      after_gate: entry
      before_gate: G-DESIGN.L6
    - plan_id: PLAN-L6-34-canonical-document-export
      after_gate: entry
      before_gate: G-DESIGN.L6
dependencies:
  parent: null
  requires:
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L5-detailed-design/if-detail.md
  references:
    - docs/governance/document-system-map.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/governance/gate-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: "2026-06-09T13:00:00+09:00"
    reviewed_at: "2026-06-09T13:10:23+09:00"
    verdict: approve
    scope: "G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR coverage and guardrail coverage reviewed"
---

## 2026-06-09 L6 completion scope addendum

This addendum is the readable current scope for L6 completion and supersedes the historical body below for G6 readiness. The older function-spec/edge-case-only body remains background for the original seed PLANs, but it is no longer normative for L6 completion.

### Scope rule

- L6 completion is not limited to the original `function-spec` and `edge-case` child PLANs.
- All L6 add-design PLANs that generate or amend files under `docs/design/harness/L6-function-design/` are part of the G6 readiness surface.
- `docs/test-design/harness/L7-unit-test-design.md` is the single L7 pair artifact for the whole L6 function-design set.
- `docs/design/harness/L6-function-design/fr-unit-coverage.md` is the FR coverage guard: every FR-L1 row must have one L6 spec path, one deterministic unit contract, and one U-* oracle before L6 can be closed.

### Current L6 design inventory

| L6 artifact | owning PLAN | current status | L7 oracle family |
|---|---|---|---|
| function-spec.md | PLAN-L6-01 + amendments PLAN-L6-20/21 | confirmed | U-FUNC / U-CORE / U-RULE / U-FR-L1-* |
| edge-case.md | PLAN-L6-02 | confirmed | U-EDGE |
| session-log.md | PLAN-L6-03 + PLAN-L6-20 | confirmed | U-SLOG |
| forced-stop-feedback.md | PLAN-L6-04 | confirmed | U-FSF |
| setup-solo-team.md | PLAN-L6-05 | confirmed | U-SETUP |
| handover-mechanism.md | PLAN-L6-06 + PLAN-L6-16 | confirmed | U-HOVER |
| agent-slots.md | PLAN-L6-07 | confirmed | U-SLOT / U-TEAM |
| backfill-pairing.md | PLAN-L6-08 | confirmed | U-BACKFILL |
| governance-enforcement.md | PLAN-L6-09 | confirmed | U-SCRUMREV / U-PROP |
| vmodel-pair-freeze.md | PLAN-L6-10 + PLAN-L6-11 | confirmed | U-VPAIR / U-VTRIG |
| review-evidence.md | PLAN-L6-12 | confirmed | U-REVIEW |
| cross-review-enforcement.md | PLAN-L6-13 | confirmed | U-XREVIEW |
| test-before-review.md | PLAN-L6-14 | confirmed | U-TORDER |
| module-drift.md | PLAN-L6-15 + PLAN-L6-26..30 addenda | confirmed + draft add-feature | U-MDRIFT / U-FR-L1-49 / U-DDDTDD / U-FR-L1-50 |
| gate-confirm.md | PLAN-L6-17 | confirmed | U-GCONF |
| review-evidence-stale.md | PLAN-L6-18 | confirmed | U-REVIEW-007..008 |
| plan-schedule-lint.md | PLAN-L6-19 | confirmed | U-PLANSCH |
| fr-unit-coverage.md | PLAN-L6-21 | confirmed | U-FR-L1-01..50 registry rows |

### Added requirement coverage

The additional user requirements for SQLite reference-feedback, search-cost reduction, drive/model logs, skill firing metrics, mechanical checks, and feedback loops are in scope for L6 via the following references:

| Requirement bundle | Requirement source | L5 design source | L6 unit contract source |
|---|---|---|---|
| SQLite projection as feedback mechanism | requirements §6.8.6 / §6.8.7 | physical-data.md §2.7 / §9, internal-processing.md Appendix B | fr-unit-coverage.md FR-L1-06 / 19 / 20 / 40 / 41 |
| Drive/model/log projection | requirements §6.8.7 rows `drive_runs`, `model_runs`, `hook_events` | physical-data.md §9 | fr-unit-coverage.md FR-L1-07 / 20 / 37 / 39 / 40 / 41 / 42 |
| Skill firing and recommendation metrics | requirements §6.8.7 skill rows, §7.7 | physical-data.md §9, internal-processing.md Appendix B | fr-unit-coverage.md FR-L1-12 / 46 / 47 |
| Search cost reduction | requirements §6.8.7 `search_index` / `ut-tdd find` intent | physical-data.md §9, internal-processing.md `findReference` | fr-unit-coverage.md FR-L1-33 / 34 / 48 / 49 |
| Mechanical quality checks and dependency feedback | requirements §6.8.7 findings / quality_signals / feedback_events | physical-data.md §2.7 / §9 | fr-unit-coverage.md FR-L1-05 / 17 / 18 / 19 / 45 / 49 |

### G6 audit input rule

G6 audit may start only when all of the following inputs are true:

- every artifact in the inventory above has an owning `plan:` reference, a L7 `pair_artifact`, and unit-test-granularity contract substance;
- every owning design/add-design PLAN is known and has no unresolved structural lint violation;
- L7 unit-test design names the matching U-* oracle family for every L6 artifact and the FR coverage addendum;
- `l6-fr-coverage`, `pair-freeze`, `plan-schedule`, `review-evidence`, typecheck, vitest, and doctor are green.

### L6 final completion rule

L6 is complete only after the G6 audit passes and the following final state is true:

- every artifact in the inventory above is `status: confirmed` or explicitly superseded by a confirmed PLAN;
- every owning design/add-design PLAN is confirmed and has valid review evidence;
- `docs/test-design/harness/L7-unit-test-design.md` is confirmed for the L6 pair scope;
- `docs/governance/gate-design.md` records G6 as PASS and references the matching audit record.

# PLAN-L6-00 (Master hub): L6 機能設計 — 必須/選択 triage + child 合成

## §0 位置づけ

L6 (機能設計 = 詳細設計末端、関数 level) を **メタモデル ①必須 + ②プロダクト選択** で起票する Master hub (要件 §1.10.G.13 導線)。G5 = CONDITIONAL PASS (A-67/A-69) を前提に、L5 詳細設計 (internal-processing の D-API / module-decomposition の関数 export) を**関数 schema・pre/post・pseudocode・エッジケース**まで確定する設計層の最終工程。L6 sub-doc enum (§1.10.G.1) = `function-spec / class-design / edge-case` (3 種)。V-pair = **L7 単体テスト設計** (L6↔L7、G6 = L6 ① ⇔ L6 ③ 単体テスト設計)。grounding = document-system-map §1 (IEEE 1016 §5.7 Pseudocode) / §3 (DbC test oracle 導出)。

## §1 triage (UT-TDD harness のプロダクト特性)

| 軸 | UT-TDD の特性 | L6 sub-doc への影響 |
|---|---|---|
| 関数構造 | TS pure functions + zod schema (module-decomposition で export verbatim: loadDocs/analyzeG3Trace/evaluateAgentGuard/detectMode/lintPlan/lintVmodel/runDoctor 等) | function-spec 必須 (signature + DbC pre/post + pseudocode) |
| OOP 有無 | **非 OOP** — クラス階層を持たず関数 + zod 値オブジェクト中心 (module-decomposition で class 不在を確認) | **class-design 縮退** (G.13 line 547「非 OOP drive で縮退」)。値オブジェクト/型設計は function-spec に吸収 |
| エッジケース | CLI/lint/gate の境界条件 (空入力/不正 frontmatter/path 不在/循環依存 等)。IMP-014 の `@edge-*` docstring | edge-case 必須 (internal-processing §7 G5 凍結分を per-function 確定) |
| WBS | L7 実装スプリントへの作業分解 (G6 = WBS 不在 → fail、§1.10 line 657) | function-spec §WBS に統合 (関数群 × Sprint 割当) |

> L6 sub-doc に screen 系はない (画面は L1/L2/L10)。class-design は非 OOP のため縮退 (skip ではなく function-spec へ統合、reason 記録)。

## §2 L6 sub-doc 合成結果 (必須/選択 区分 = G.13)

| sub-doc | 区分 | 判定 | L5 由来 (詳細化元) | child PLAN |
|---|---|---|---|---|
| **function-spec** | ① 必須 | 起票 (関数 schema/signature + DbC pre/post/invariant + IEEE 1016 §5.7 pseudocode + WBS、internal-processing §6 D-API を関数 level 詳細化) | internal-processing.md / module-decomposition.md | **PLAN-L6-01-function-spec** |
| **edge-case** | ① 必須 | 起票 (per-function エッジケース一覧 + `@edge-*` docstring 確定、internal-processing §7 G5 凍結を関数別に展開、IMP-014) | internal-processing.md §7 | **PLAN-L6-02-edge-case** |
| **class-design** | ② 選択 | **縮退 (skip + reason)**: UT-TDD core は非 OOP (TS pure functions + zod 値オブジェクト、module-decomposition で class 階層不在を確認)。値オブジェクト/型設計は function-spec §型 に統合。G.13 line 547「非 OOP drive で縮退」に該当 | (function-spec へ統合) | **skip (PLAN 不要)** |

## §3 実行順 (child 依存)

```
PLAN-L6-01-function-spec (foundational: D-API → 関数 signature + pre/post + pseudocode + WBS)
        │
        └─→ PLAN-L6-02-edge-case (function-spec の関数別に edge を展開、@edge-* docstring 確定)
```

1. **PLAN-L6-01-function-spec** (起点、関数 schema + pseudocode + WBS)
2. **PLAN-L6-02-edge-case** (function-spec 確定後、関数別 edge)

各 child は V-pair = **L7 単体テスト設計** (`docs/test-design/harness/L7-unit-test-design.md`、L6↔L7)。DbC 契約から test oracle を導出 (document-system-map §3)。artifact path = `docs/design/harness/L6-function-design/<sub-doc>.md` (§1.10 line 418 規約)。

## §4 L6 carry 反映 (G5 escalation / backlog 由来)

child PLAN 起票時に以下を織り込む:
- **IMP-014 (G3→G5 carry)**: ②実装↔④テスト docstring (`@edge-*` format) を edge-case で per-function 確定し L7 TDD Red 入口前に凍結 (G5 で internal-processing §7 に枠を凍結済、L6 で関数別に展開)
- **IMP-019 (Z3)**: L6 に IEEE 1016 §5.7 Pseudocode を grounding として function-spec に明記 (関数本体の処理手順を pseudocode 化、L7 実装の正本)
- **IMP-033 (A-73)**: 自動追加型クロスチェックエンジン (gate-design §4/§5) の **ルール型 10 種の関数 signature + pseudocode** を function-spec で設計 (doc レジストリ scan / rule registry / auto-enroll / coverage map の関数化)
- **IMP-004 (A-68 決定 (a))**: PlanId regex の階層 ID 対応を function-spec の frontmatter 検証関数 signature に反映
- **G5 escalation**: 認証・秘密管理は if-detail (L5) で契約プラン CLI/hook 前提に確定済 (A-71)。L6 では adapter 起動関数の signature にのみ反映 (秘密値を扱わない = pre-condition「provider CLI ログイン済」)

## §5 DoD (Master hub 完了条件)

- [ ] §2 の必須 2 = child PLAN 2 件を起票 (function-spec / edge-case)
- [ ] class-design 縮退 (skip + reason = 非 OOP、function-spec へ統合) を記録
- [ ] 各 child が L7 単体テスト設計と pair_artifact 接続 (DbC → test oracle 導出)
- [x] WBS を function-spec に統合 (G6 = WBS 存在要件、§1.10 line 657)
- [ ] G5 escalation / IMP-014/019/033/004 を child PLAN の §4 carry に織り込み
- [x] 全 child 完了で G6 (機能設計凍結 = L6 ① ⇔ L6 ③ 単体テスト設計) readiness へ
