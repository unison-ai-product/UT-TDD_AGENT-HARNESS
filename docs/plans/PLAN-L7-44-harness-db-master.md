---
plan_id: PLAN-L7-44-harness-db-master
title: "PLAN-L7-44 (Master hub / 工程表): harness.db L7 実装セグメント — gate+span 分解"
kind: impl
layer: L7
drive: db
status: confirmed
created: 2026-06-11
updated: 2026-06-11
accepted_by: PO
accepted_at: "2026-06-11"
accept_evidence: .ut-tdd/audit/A-130-harness-db-segment-accept.md
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.3-codex
    tests_green_at: "2026-06-11"
    reviewed_at: "2026-06-11"
    verdict: pass-with-fixes
    scope: "PLAN-L7-44 harness.db L7 DB segment: child spans 45-49 implemented with red-first tests, typecheck/lint/test/doctor evidence, and no secret/PII/raw transcript persistence."
owner: PM (Opus) / PO (人間)
master_hub: true
agent_slots:
  - role: tl
    slot_label: "TL — harness.db L7 実装 (state-db adapter / projection / DbC) のレビュー (別 runtime)"
  - role: qa
    slot_label: "QA — L8 IT-DB/SEARCH/FEEDBACK/AUTOMATION/GUARDRAIL/ASSET-DB pair の観点レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-44-harness-db-master.md
    artifact_type: markdown_doc
roadmap:
  layer: L7
  gates:
    - id: G-L7DB.A
      name: state-db foundation
      exit_criteria: "src/state-db/ adapter (bun:sqlite first / Node fallback) + migration + 全 projection table schema 実装、ut-tdd db status/rebuild runnable、IT-DB-01 基盤 green"
    - id: G-L7DB.B
      name: projection-writer
      exit_criteria: "recordProjectionEvent / rebuildHarnessDb が PLAN/artifact/gate/finding/trace/coverage/model/drive/hook + 既存 relation-graph/doc-export/MCP 出力を idempotent projection、IT-DB-01/02 green、source doc 非改変 invariant"
    - id: G-L7DB.C
      name: feedback / search / readiness / guardrail / asset surfaces
      exit_criteria: "search-index(find) / skill metrics / feedback-engine / automation-readiness / guardrail-ledger / asset-catalog 実装、IT-SEARCH-01 / DB-03 / FEEDBACK-01 / AUTOMATION-01 / GUARDRAIL-01 / ASSET-DB-01 green、不変条件 (証跡なし ready 不可 / human-required 非降格 / feedback auto-approve 不可 / secret・PII 非保存) 維持"
    - id: G-L7DB.D
      name: DB segment exit
      exit_criteria: "全 IT-DB 系 green + pair-freeze 孤児0 + review 前置 + doctor 新 DB チェックの runDoctor.ok hard-fail 配線、L7-DB セグメント layer exit"
  spans:
    - plan_id: PLAN-L7-45-harness-db-foundation
      after_gate: entry
      before_gate: G-L7DB.A
    - plan_id: PLAN-L7-46-projection-writer
      after_gate: G-L7DB.A
      before_gate: G-L7DB.B
    - plan_id: PLAN-L7-47-search-metrics-feedback
      after_gate: G-L7DB.B
      before_gate: G-L7DB.C
    - plan_id: PLAN-L7-48-readiness-guardrail
      after_gate: G-L7DB.B
      before_gate: G-L7DB.C
    - plan_id: PLAN-L7-49-asset-catalog
      after_gate: G-L7DB.B
      before_gate: G-L7DB.C
    - plan_id: PLAN-L7-44-harness-db-master
      after_gate: G-L7DB.C
      before_gate: G-L7DB.D
dependencies:
  parent: null
  requires:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L5-detailed-design/if-detail.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/plans/PLAN-L5-08-harness-db-feedback.md
  references:
    - docs/plans/PLAN-DISCOVERY-05-roadmap-registration.md
    - docs/design/harness/L3-functional/roadmap.md
    - docs/governance/gate-design.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-44 (Master hub / 工程表): harness.db L7 実装セグメント

## §0 PLAN

PO 指示 (2026-06-11): 残り L7 実装 (`.ut-tdd/harness.db` のコア projection 層) を Codex 量産へ
回す前に、**工程表 driver を通して** gate+span に分解する。free-hand で PLAN を採番せず、
本 master-hub の `roadmap:` block で層内ゲートと区間 (span=PLAN) を**先に宣言**し、各 span を
child PLAN が埋める (4 段階層 = 工程表 → 層内ゲート → 区間=PLAN → §工程表 Step、PLAN-DISCOVERY-05)。

## §1 位置づけ (既存 L7 工程表との関係)

- 既存 L7 工程表 (`PLAN-DISCOVERY-05` の roadmap block、G-L7.A〜E) の scope は
  **キャリー lint 群 + 外部ツーリング family (relation-graph / MCP / tool-adapter / doc-export)**
  であり、**harness.db を含まない**。G-L7.E はその第1セグメントの layer exit。
- 本書は **L7 第2セグメント (harness.db コア projection 層)** の工程表を独立登録する
  (`loadRoadmaps` は層一意制約を持たず、PLAN 単位で複数 roadmap を load する)。
- 設計は **L5 で凍結済** (`PLAN-L5-08-harness-db-feedback` = confirmed、physical-data §2.7/§9.1
  projection table + module-decomposition + internal-processing DbC + if-detail CLI 契約、
  L8 IT-DB/SEARCH/FEEDBACK/AUTOMATION/GUARDRAIL/ASSET-DB pair 済)。よって本セグメントは
  **凍結設計の forward 実装** = kind=impl、Reverse 不要 (KIND_BACKFILL: impl)。

## §2 背景 (なぜ harness.db = 残り L7 か)

- `docs/design/harness/L3-functional/roadmap.md` §3「Phase 4 (L7 DB) 未 / state DB 本体・
  登録トリガ (FR-L1-07 hook) は未」。
- `PLAN-L5-08` §3.1「L7 では bun:sqlite first / Node fallback adapter、projection writer、
  search、feedback metrics、automation readiness、guardrail ledger、asset catalog、tests を実装する」。
- harness.db は設計の柱3 (フィードバック機構) の実体化 (ADR-007 が ADR-001 deferral を supersede)。
- HELIX→UT-TDD cutover: 本セグメント完了が `ut-tdd` CLI 独り立ち (Mode 2→3) の主要トリガ。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] L5-08 / L8 契約から span triage + roadmap block 登録
直列理由: downstream_dependency (本 master の roadmap 宣言が child PLAN 起票の前提)
凍結済 L5/L8 契約を module 凝集 × L8 IT 群で 5 span に triage し、本 frontmatter の
`roadmap:` block (G-L7DB.A〜D + 5 span) として登録する。

### Step 2: [直列] 5 child span PLAN 起票
直列理由: downstream_dependency (Step 1 で宣言した span を埋める) + file_conflict (docs/plans 共有)
PLAN-L7-45〜49 を kind=impl / layer=L7 / 各 L8 IT pair で起票する。span の依存:
45 (foundation) → 46 (projection-writer) → {47, 48, 49} は 46 後に [並列] (file_conflict なし、
各々別 module / 別 CLI / 別 IT、shared_state は harness.db schema のみで migration は 45 で確定済)。

### Step 3: [直列] review 前置
直列理由: downstream_dependency
hybrid のため別 runtime `frontier-reviewer`、不能時は `intra_runtime_subagent` (pmo-sonnet /
code-reviewer) で、roadmap 構造 (gate 順序 / span 実在予定 / IT pairing) と scope 境界
(設計を越権しない / secret 非保存) を review し evidence に残す。

## §3.1 実装計画

- 情報源: `physical-data.md` (§2.7 基本 7 + §9.1 拡張 10 projection table)、`module-decomposition.md`
  (state-db / projection-writer / search-index / feedback-engine / automation-readiness /
  guardrail-ledger / asset-catalog の責務・依存方向)、`internal-processing.md` (recordProjectionEvent /
  rebuildHarnessDb / computeSkillMetrics / findReference / emitFeedbackEvents /
  evaluateAutomationReadiness / recordGuardrailDecision / catalogAutomationAssets の DbC)、
  `if-detail.md` (`ut-tdd db/find/metrics/feedback/automation/guardrail/asset` CLI 契約)、
  `L8-integration-test-design.md` (IT-DB-01..03 / IT-SEARCH-01 / IT-FEEDBACK-01 / IT-AUTOMATION-01 /
  IT-GUARDRAIL-01 / IT-ASSET-DB-01)。
- 本 master は工程表 (gate+span) の宣言と triage のみ。実装本体は各 child span PLAN が持つ。
- §9.5 relation-graph / §9.6 MCP / §9.7 doc-export の projection table は Phase 3 で**ロジック実装済**。
  本セグメントは**その出力を harness.db へ projection する配線**を span 46 (projection-writer) に含める
  (作り直しではない)。
- adapter span (GitHub / 観測系の認証) は **PO + security 審査 gate が前提**のため本セグメントから
  分離・後置 (DB コアの blocker にしない)。

## §4 DoD

- [x] `roadmap:` block が roadmapSchema validate を通り、`validateRoadmapStructure` issue 0。
- [x] doctor `roadmap` が本工程表を G-L7DB.A〜D / 5 span で surface (span 実在 = child 起票後)。
- [x] 5 child span PLAN (L7-45〜49) が起票され、各 L8 IT に pair 接続。
- [x] 命名テスト (`tests/plan-id-naming.test.ts`) + 全回帰 green。
- [x] review 前置 evidence を frontmatter `review_evidence` に記録。

## §5 Related PLAN / docs

- 設計正本: PLAN-L5-08-harness-db-feedback (L5 add-design、confirmed)
- 工程表メカニズム: PLAN-DISCOVERY-05-roadmap-registration
- Pair: docs/test-design/harness/L8-integration-test-design.md (IT-DB 系)
- Children: PLAN-L7-45〜49 (本工程表 span)

## §6 用語更新

| term | type | definition / delta | L0 back-merge |
|---|---|---|---|
| L7 実装セグメント | new | 1 大層 (L7) を複数の独立工程表 (roadmap block) に分割した単位。第1=tooling/lints (DISCOVERY-05 G-L7.A〜E)、第2=harness.db (本書 G-L7DB.A〜D)。 | not required; L7 scoped |
| harness.db コア projection 層 | clarified | state-db / projection-writer / search / feedback / readiness / guardrail / asset-catalog。relation-graph/doc-export/MCP の projection 配線を含むが、それらのロジックは Phase 3 実装済。 | not required |
