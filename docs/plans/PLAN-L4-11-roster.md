---
plan_id: PLAN-L4-11-roster
title: "PLAN-L4-11: 内部資産 subagent roster + command の L4 基本設計増分"
kind: design
layer: L4
sub_doc: function
drive: fullstack
status: confirmed
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: cross_agent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "L4 roster/command add-design closure (A-104). Cross-agent: Codex authored, Claude verified substance + descent to PLAN-L5-05 / L8 IT-ASSET. 文字化け除去後 clean 再 freeze。"
    worker_model: codex
    reviewer_model: claude-opus-4-8
created: 2026-06-01
updated: 2026-06-01
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — roster registry / capability class / command CLI 化の設計レビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
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
    - docs/design/harness/L4-basic-design/function.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/migration/internal-asset-inventory.md
  references:
    - docs/migration/helix-porting-map.md
    - docs/governance/document-system-map.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L4-11: 内部資産 subagent roster + command の L4 基本設計増分

## §0 位置づけ

PLAN-L4-10 (Master) §2 triage の child。**FR-L1-46 (subagent roster の UT-TDD 化) + FR-L1-48 (内部資産 command の CLI 化)** を L4 基本設計 (function.md) に増分する。ADR-004 確定境界 (層1 markdown 正本 / 層2 TS 統制) を前提とする。**成果物 = 基本設計書 (function.md 増分) ⇔ L9 総合テスト設計ペア** (PLAN-L4-10 §0.1)。

## §1 doc 化スコープ (どこまで書くか = L4 = L9 総合テスト粒度)

L4 = システム粒度 (L9 総合テスト設計と対)。本 PLAN で **function.md に書く**範囲:

1. **C12 内部資産 roster カテゴリ新設** (§1 機能カテゴリ表に追加): subagent roster registry + command を機能 building block 化
2. **roster registry の機能**: `.claude/agents/*.md` (層1 markdown 正本) を TS (層2) が読み、capability class / model family / guard allowlist 整合を検証/注入/統制 (生成でない、ADR-004)
3. **command CLI の機能**: 内部資産 command (`ut-tdd asset` / `ut-tdd roster` 等) を §2 CLI コマンド表に追加
4. **guard 統合**: 既存 agent-guard (実装済) と roster registry の関係を明示 (roster が allowlist の SSoT、guard が enforcement)

> **粒度 (L4)**: 「内部資産 roster が system として動く」を L9 総合テスト粒度で 1 観点に束ねる。各 subcommand / 各 subagent の関数粒度は L5 (module 結合) → L6 (関数仕様=単体) で段階分解 (PLAN-L4-10 §2、L5 を挟む)。

## §2 設計計画 (Step)

1. Step 1: function §1 に **C12 内部資産 (roster/command)** カテゴリ追加 (含む FR = FR-L1-46/48、操作集約、主担当 module = runtime + 新規 skills/roster)
2. Step 2: roster registry の機能 building block 記述 (層1 .md 読込 → 層2 検証/注入/統制、capability class 解決)
3. Step 3: function §2 CLI コマンド表に内部資産 command 追加 (`ut-tdd roster` / `ut-tdd asset`)
4. Step 4: guard 統合の明示 (roster = allowlist SSoT / agent-guard = enforcement)
5. Step 5: L9 総合テスト設計に内部資産 system テスト観点を追加 (ペア③、書ける範囲)
6. Step 6: **未確定 placeholder + 依存明示**: L5/L6 で確定する関数粒度仕様 (各 subcommand signature 等) は L4 では書けない → placeholder + 「L5 module 結合 / L6 関数仕様で確定」を §carry に列挙 (PLAN-L4-10 §0.1、back-fill 対象)
7. Step 7: self-review (pmo-sonnet / code-reviewer)

## §3 carry (PLAN-L4-10 §4/§5 由来)

- **粒度段階分解 (DoD)**: C12 を L4 で束ねるのは可 → L5 で roster module / command module の結合粒度 → L6 で各 subcommand・各 capability resolver を単体テスト設計粒度に分解可能 (明記)
- **未確定 back-fill 対象**: 各 subcommand の signature・capability class の具体値・model family 解決アルゴリズムは L6 機能設計 (=仕様設計) で確定 → その時 L7 単体テスト設計を back-fill。L4 では placeholder + 依存 (`waiting_layer: L6`) を残す
- **DB 検知接続**: roster の「入るべき subagent が roster に登録されているか」「.md と guard allowlist の整合」未充足は doctor / FR-L1-49 drift lint (IMP-033 rule) が fail-close (PLAN-L4-10 §0.1)
- **HELIX 前提除去**: subagent 19 件の絶対パス・`helix codex` 直叩き除去は drift lint (PLAN-L4-13) の fail-close 対象 (inventory §1)
- porting-map W6/W7 (subagent harden) を後続実装 PLAN に接続

## §4 DoD

- [x] function §1 に C12 内部資産 (roster/command) カテゴリ追加 (FR-L1-46/48 マップ)
- [x] roster registry 機能 building block 記述 (ADR-004 層1/層2 境界準拠)
- [x] function §2 CLI コマンド表に内部資産 command 追加
- [x] guard 統合 (roster=SSoT / agent-guard=enforcement) 明示
- [x] L9 総合テスト設計にペア観点追加 (書ける範囲) + 未確定は placeholder + 依存明示
- [x] 粒度段階分解可能性 (L5→L6) を §carry に明記
- [x] self-review 通過
