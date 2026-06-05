---
plan_id: PLAN-L4-04-external-if
title: "PLAN-L4-04 (design/external-if): L4 基本設計 — 外部インターフェース設計 (GitHub/Claude/Codex/Sentry の DbC 境界契約、外部設計)"
kind: design
layer: L4
sub_doc: external-if
drive: fullstack
status: confirmed
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 外部境界契約 (DbC) / runtime adapter 境界のレビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/external-if.md
    artifact_type: design_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
dependencies:
  parent: docs/plans/PLAN-L4-00-master.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L4-basic-design/data.md
  references:
    - docs/governance/document-system-map.md
related_adr: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve
    scope: "A-101 G4 L4 audit 4 軸 PASS (pmo-sonnet TL 代替、claude-only)"
---

# PLAN-L4-04 (design/external-if): L4 外部インターフェース設計

## §0 PLAN

L4 Master (`PLAN-L4-00-master`) §2 の ② プロダクト選択 sub-doc「external-if」(外部連携ありのため起票) を詳細化する design PLAN。出力 = `docs/design/harness/L4-basic-design/external-if.md`。harness が依存する外部 service (GitHub / Claude / Codex / Sentry / Uptime Robot / Dependabot) との**境界契約**を Design by Contract (precondition/postcondition/invariant) で定義する。

## §1 目的

UT-TDD harness と外部 service の**境界 (what/形状)**を確定する。各境界に: ① どの service の何の操作を使うか、② harness 側の前提 (precondition) と保証 (postcondition)、③ 失敗時の振る舞い (fail-close / degradation)、④ 秘密情報の扱い (禁止事項: API key/credential を doc/example に書かない)。粒度は **what/形状まで** (how/contract 詳細は L5 D-API、IMP-018)。

## §2 背景

- 上流: Master §1 triage (外部連携 = GitHub/Claude/Codex/Sentry/Uptime Robot/Dependabot)
- 横置: architecture.md §6 (外部 service 起動は runtime adapter に隔離、core は正規化 intent のみ) + data.md (state は file-based、外部 DB 非依存)
- 業界標準: DbC (Meyer、境界 invariant) ← document-system-map §3 / 外部設計 = IPA 共通フレーム (システム境界)
- L4 carry: IMP-018 (external-if [what/形状] ↔ L5 D-API [how/contract] 粒度境界)

## §3 設計計画 (Step 1〜8)

### Step 1: 外部 service 棚卸し
GitHub / Claude (Code) / Codex / Sentry / Uptime Robot / Dependabot を「harness が呼ぶ / harness を呼ぶ / 観測する」で分類。

### Step 2: 境界カテゴリ定義
(a) AI runtime 境界 (Claude/Codex、adapter 隔離) / (b) VCS・CI 境界 (GitHub/Actions) / (c) 観測・監視境界 (Sentry/Uptime Robot) / (d) 依存管理境界 (Dependabot)。

### Step 3: 各境界の DbC 契約 (precondition/postcondition/invariant)
境界ごとに harness 側の前提・保証・不変条件を記述 (例: agent-guard 通過後のみ AI 起動 = precondition)。

### Step 4: 失敗時の振る舞い
外部 service 不在・エラー時の fail-close / graceful degradation 方針 (architecture.md fail-close 原則と整合、外部依存を通常導線の前提にしない = 禁止事項)。

### Step 5: 秘密情報・認証境界 (人間確認事項)
API key / token / credential の扱い (doc/example に書かない、env 経由、認証は人間確認なしに確定しない = 禁止事項)。**認証・認可・本番影響は人間確認必須**。

### Step 6: runtime adapter 境界 (architecture §6 連動)
core ↔ adapter ↔ 外部 service の 3 層境界。core は正規化 intent (reviewer/worker を呼べ) のみ発行、adapter が provider 固有を吸収。

### Step 7: what/形状 ↔ L5 D-API 粒度境界 (IMP-018)
本 doc が定義する「形状」(操作名・方向・pre/post の概要) と L5 D-API が定義する「詳細契約」(引数型・エラー型・リトライ) の責務分界を明示し二重定義を回避。

### Step 8: carry → L5/L7
境界契約 → L5 D-API (詳細) / L7 adapter 実装への carry。

## §4 受入条件 / DoD

- [ ] Step 1〜8 のすべてが `external-if.md` に存在
- [ ] 6 外部 service が境界カテゴリに分類 (漏れ 0)
- [ ] 各境界に DbC pre/post/invariant が最低 1 件
- [ ] 失敗時 fail-close / degradation 方針が存在
- [ ] 秘密情報・認証の扱いが禁止事項と整合 (key/credential を書かない、認証は人間確認)
- [ ] what/形状 ↔ L5 D-API 粒度境界明示 (IMP-018)
- [ ] runtime adapter 境界が architecture.md §6 と整合
- [ ] §6 用語更新 / §7 機能要求更新 が存在
- [ ] frontmatter `kind == design`、§0〜§7 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L4-00-master / 前 = PLAN-L4-02-architecture / 並行 = PLAN-L4-03-function
- 参照 docs: architecture.md §6 / data.md / document-system-map.md §3 (DbC)

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| runtime adapter | 既出 | 外部 service 起動を隔離する境界層 (ADR-001 / architecture §6)。本 doc で外部境界として再確認 | 既存参照 (新規 back-merge 不要) |
| 境界契約 (boundary contract) | 参照 | DbC pre/post/invariant の境界適用、標準語 | back-merge 不要 |

> 外部 IF は標準語 (DbC/adapter) 主体。UT-TDD 固有語の新規導入は想定しない。

## §7 機能要求更新 (FR registry delta)

> 現時点: **機能要求更新なし** (external-if は FR-L1-17 [CI 連携] / FR-L1-42 [provider 引継ぎ] / FR-L1-20 [観測] の外部境界を設計。新規 FR-L1 は生まない見込み。発見時は §1 registry へ back-merge)。
