---
plan_id: PLAN-L4-12-skill-pack
title: "PLAN-L4-12: 内部資産 skill pack curate の L4 基本設計増分"
kind: design
layer: L4
sub_doc: architecture
drive: fullstack
status: confirmed
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: cross_agent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "L4 skill-pack add-design closure (A-104). Cross-agent: Codex authored, Claude verified substance + descent to PLAN-L5-06 / L8 IT-ASSET. 文字化け除去後 clean 再 freeze。"
    worker_model: codex
    reviewer_model: claude-opus-4-8
created: 2026-06-01
updated: 2026-06-01
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — skills building block / catalog / injector の設計レビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
dependencies:
  parent: docs/plans/PLAN-L4-10-internal-asset-master.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/migration/internal-asset-inventory.md
  references:
    - docs/migration/helix-porting-map.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L4-12: 内部資産 skill pack curate の L4 基本設計増分

## §0 位置づけ

PLAN-L4-10 (Master) §2 triage の child。**FR-L1-47 (skill pack の UT-TDD curate)** を L4 基本設計 (architecture.md) に増分する。ADR-004 境界 (層1 skill 本文 markdown 正本 / 層2 catalog-injector TS) を前提。成果物 = architecture 増分 (skills building block) ⇔ L9 総合テスト設計ペア。

## §1 doc 化スコープ (L4 = L9 総合テスト粒度)

1. **architecture §3 に skills building block 新設**: Level 1 building block 表に `skills` 追加 (catalog / recommender / injector)。依存方向 = schema へ一方向 (安定核維持、循環禁止)
2. **層1/層2 分離**: skill 本文 = `docs/skills/**/*.md` (markdown 正本、curate 先) / catalog-injector = TS (層2)
3. **curate 方針**: vendor 107 skill → UT-TDD 版 SKILL_MAP (core-optional-drop 区分) + ut-tdd CLI trigger + helix 用語除去 (inventory §2)
4. **依存方向の保証**: skills が schema 安定核に一方向依存、fs は loadX 端点に隔離 (architecture §3 原則踏襲)

## §2 設計計画 (Step)

1. Step 1: architecture §3.1 Level 1 building block 表に `skills` 追加 (責務 / 公開 IF / 依存先 = schema)
2. Step 2: skills 内部 (catalog 構築 / recommender / injector) を §3.2 Level 2 に記述、層1 .md ↔ 層2 TS 境界明示 (ADR-004)
3. Step 3: 依存方向 (skills → schema 一方向、循環禁止) が §3 原則を壊さないことを確認・明記
4. Step 4: curate 方針 (core-optional-drop / SKILL_MAP / helix 用語除去) を §設計根拠に記述
5. Step 5: L9 総合テスト設計に skills system 観点追加 (書ける範囲) + 未確定 placeholder + 依存
6. Step 6: self-review

## §3 carry (PLAN-L4-10 §4/§5 由来)

- **粒度段階分解**: skills building block を L4 で束ね → L5 で catalog/recommender/injector module 結合粒度 → L6 で各関数 (catalog 構築 / skill 推挙 / 注入) を単体テスト設計粒度に分解 (L5 を挟む)
- **未確定 back-fill**: skill recommender のスコアリングアルゴリズム / injector の L 別注入セット定義は L6 機能設計で確定 → L7 単体テスト back-fill。L4 では placeholder + 依存 (`waiting_layer: L6`)
- **DB 検知**: `docs/skills/` 空 (curate 未着手) / skill ↔ SKILL_MAP 不整合は doctor / FR-L1-49 drift lint (IMP-033 rule) が fail-close
- porting-map W10 (skill curate) を後続実装 PLAN に接続
- FR-L1-12 (L 単位 skill 注入) / FR-L1-37 (model 推挙) と skills building block の連携を明示
- **L4 記述範囲 (m-3 是正)**: architecture §3.2 Level 2 skills 内部に core-optional-drop の区分*方針*を 1 文で記述するに留める。区分アルゴリズム / SKILL_MAP 生成手順 / recommender スコアリングは L6 機能設計で確定 (L4 = 方針宣言のみ、curate 作業実体は porting-map W10)。これで「方針 (L4) ↔ 関数仕様 (L6) ↔ 作業 (W10)」の責務分界を明示

## §4 DoD

- [x] architecture §3 に skills building block 追加 (依存方向 schema 一方向、循環禁止維持)
- [x] 層1 (.md 正本) / 層2 (catalog-injector TS) 境界を ADR-004 準拠で記述
- [x] curate 方針 (core-optional-drop / SKILL_MAP / helix 用語除去) 記述
- [x] L9 総合テスト設計にペア観点追加 + 未確定 placeholder + 依存明示
- [x] 粒度段階分解 (L5→L6) を §carry に明記
- [x] self-review 通過
