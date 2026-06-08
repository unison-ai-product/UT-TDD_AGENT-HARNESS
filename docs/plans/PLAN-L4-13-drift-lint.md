---
plan_id: PLAN-L4-13-drift-lint
title: "PLAN-L4-13: 内部資産 drift lint の L4 基本設計増分"
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
    scope: "L4 drift-lint add-design closure (A-104). Cross-agent: Codex authored, Claude verified substance + descent to PLAN-L5-07 / L8 IT-ASSET. 文字化け除去後 clean 再 freeze。"
    worker_model: codex
    reviewer_model: claude-opus-4-8
created: 2026-06-01
updated: 2026-06-01
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — drift lint (IMP-033 rule 型) の設計レビュー (別 runtime)"
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
    - docs/governance/gate-design.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/migration/internal-asset-inventory.md
  references:
    - docs/adr/ADR-002-dependency-direction-and-auto-map.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L4-13: 内部資産 drift lint の L4 基本設計増分

## §0 位置づけ

PLAN-L4-10 (Master) §2 triage の child。**FR-L1-49 (内部資産 drift lint)** を L4 基本設計 (architecture.md) に増分する。**新規 lint を手書きせず、IMP-033 cross-check rule engine (gate-design §4/§5) の rule 型インスタンスとして実現** (Master §5)。ADR-004 の境界番人 = 「正本 .md に HELIX 前提が残らないか fail-close」。成果物 = architecture 増分 ⇔ L9 ペア。

## §1 doc 化スコープ (L4 = L9 総合テスト粒度)

drift lint の検査項目 (system 粒度で確定するもの) を architecture lint building block + ADR-004 Consequences に記述:

1. **検査項目** (inventory §1 / ADR-004 由来):
   - HELIX 絶対パス残存 (`~/ai-dev-kit-vscode/` / `C:\Users\micro`) を `.claude/agents/*.md` が含まない
   - `helix codex` 直叩きが subagent 本文に残らない
   - `docs/skills/` が空でない (curate 着手済)
   - roster ↔ guard allowlist の model family 整合 (二重定義の乖離 0)
2. **IMP-033 rule 型として登録**: gate-design §5 の rule registry に内部資産 drift rule を追加 (`asset-drift` 型)。doc registry が `.claude/agents/*.md` / `docs/skills/` を scan し auto-enroll
3. **fail-close 接続**: drift 検出 → exit≠0 (doctor / gate)。FR-L1-49 の「drift 検出レポート (fail-close)」を実現
4. **DB 未充足検知との統合**: PLAN-L4-10 §0.1 の「入るべきところが入ってなければ DB 側から検知」を内部資産にも適用 (placeholder_deps と同じ doctor 経路)

## §2 設計計画 (Step)

1. Step 1: architecture §lint building block に内部資産 drift lint を rule engine インスタンスとして記述 (新規 lint module を起こさない、gate-design §5 整合)
2. Step 2: 検査項目 4 種を ADR-004 Consequences / inventory §1 と trace して列挙
3. Step 3: auto-enroll (doc registry が `.claude/agents/*.md` と `docs/skills/` を scan) を gate-design §4 機構に接続
4. Step 4: fail-close 経路 (doctor / gate exit) + DB 未充足検知統合を記述
5. Step 5: L9 総合テスト設計に drift lint system 観点追加 + 未確定 placeholder + 依存
6. Step 6: self-review

## §3 carry (PLAN-L4-10 §4/§5 由来)

- **粒度段階分解**: drift lint を L4 で束ね → L5 で rule registry への登録方式 (module 結合) → L6 で各検査項目の判定関数 (HELIX パス検出 / allowlist 照合等) を単体テスト設計粒度に分解 (L5 を挟む)
- **未確定 back-fill**: 各検査項目の判定関数 signature / regex パターンは L6 機能設計で確定 → L7 単体テスト back-fill。L4 では placeholder + 依存
- **IMP-033 依存**: cross-check rule engine 本体 (gate-design §4/§5) が L6-L7 で実装される前提。drift lint はその rule 型の 1 インスタンス (engine 未実装の間は手動 audit = inventory §1)
- **既存 dependency-drift (ADR-002) との並置**: gate-design §5 rule registry に `dependency-drift` (ADR-002) が既存。内部資産 `asset-drift` を同列に追加 (両方 IMP-033 rule)

## §4 DoD

- [x] architecture lint building block に内部資産 drift lint を IMP-033 rule 型として記述 (新規 lint 手書きせず)
- [x] 検査項目 4 種 (HELIX パス / helix codex 直叩き / docs-skills 空 / roster↔guard 整合) を inventory §1 / ADR-004 と trace
- [x] auto-enroll + fail-close 経路を gate-design §4 機構に接続
- [x] DB 未充足検知統合 (PLAN-L4-10 §0.1) を記述
- [x] L9 総合テスト設計にペア観点追加 + 未確定 placeholder + 依存
- [x] self-review 通過
