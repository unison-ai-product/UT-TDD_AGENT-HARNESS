---
plan_id: PLAN-X-03-roster-design
title: "PLAN-X-03 (kind=poc): roster module 設計の Discovery 検証 (設計→仮実装→検証→設計確定、PLAN-X-01 §1.1 適用)"
kind: poc
layer: cross
workflow_phase: S1
drive: poc
status: draft
decision_outcome: null
created: 2026-06-01
updated: 2026-06-01
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: po
    slot_label: "PO — 成否最終判断 (S4 decision_outcome)"
  - role: se
    slot_label: "SE — src/roster spike 仮実装 (poc/roster-spike、使い捨て、別 runtime Codex)"
  - role: tl
    slot_label: "TL — spike が roster 設計を実証したかの検証レビュー (別 runtime)"
generates:
  - artifact_path: docs/plans/PLAN-X-03-roster-design.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-X-01-workflow-metamodel.md
    - docs/plans/PLAN-L5-05-roster.md
    - docs/plans/PLAN-L4-11-roster.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-X-03 (kind=poc): roster module 設計の Discovery 検証

## §0 位置づけ

これは **Forward 凍結 PLAN ではなく検証 (Discovery/PoC) 駆動プラン**。roster module の L5 設計 (PLAN-L5-05-roster) を**紙上で確定する前に、仮実装で実証して確定させる**。[[PLAN-X-01]] §1.1「Discovery は確証が持てない**設計**にも適用 — 設計→仮実装→検証→設計確定」の最初の実適用。

> **なぜ Forward でなく Discovery か (PM 自己訂正 2026-06-01)**: PM は当初 roster を「agent-guard.ts に scan 実装があるから確証あり = Forward」と自己判断し Discovery を飛ばそうとした。これは「確証ある/重いから省略」で工程を抜く逸脱 ([[feedback-process-for-record-not-weight]])。agent-guard が実証するのは **scan 機構だけ**で、roster module 全体 (capability class resolver / 内部資産 command CLI / `runtime → roster` 一方向結合 / 移行段階 placeholder) は**未実証**。確証ありと偽って Forward 凍結すると後で大手戻り。PO 指摘「ディスカバリーはやらないのか？」で訂正。

## §1 設計 (S1、provisional) — roster module 設計仮説

検証対象の設計 (PLAN-L5-05-roster §1/§3 の内容を仮説として保持。紙上で無理に確定しない):

| 設計要素 | 仮説 | 確証度 |
|---|---|---|
| **scan→registry** | `.claude/agents/*.md` を in-memory scan して roster registry を構築 (永続なし、fs 正本、ADR-004 / data.md A-90) | 高 (agent-guard §2.3 が同型 scan を実証済) |
| **capability class resolver** | 各 agent の capability class (PMO/PdM/review 等) と model family を frontmatter から解決、FR-L1-37 model 推挙へ入力 | **低 (未実証)** — frontmatter の何を class とみなすか、resolve ルールが紙上のみ |
| **内部資産 command CLI** | `ut-tdd roster list/check` / `ut-tdd asset` の D-API。`roster check` = .md↔guard allowlist 乖離 0 or fail-close | **低 (未実証)** — guard allowlist との突合方式・出力契約が紙上のみ |
| **`runtime → roster` 一方向結合** | guard が roster を参照 (循環なし)。roster 未実装期間は guard ハードコード維持 = 移行段階 (`placeholder_deps:{waiting_layer:L7}`) | 中 — 方向は明確だが移行段階の繋ぎが未実証 |

> S1 では上記を**確定でなく仮説**として置く。確証度「低」が Discovery で実証すべき核心。

## §2 仮実装計画 (S2、PoC spike)

- **ブランチ**: `poc/roster-spike` (使い捨て前提。`poc/*` → main 直 PR は物理ブロック、concept §4.x。confirmed 後に Reverse 経由で本実装)
- **spike 範囲** (`src/roster/` に最小):
  1. `scanAgents()`: `.claude/agents/*.md` を読み frontmatter (model/description) を抽出 → registry 配列 (agent-guard の scan ロジック流用)
  2. `resolveCapability()`: agent の capability class + model family を解決 (§1 の「低」確証要素を実証)
  3. `checkRosterGuardConsistency()`: roster registry ↔ agent-guard allowlist (15 種、.claude/CLAUDE.md) の乖離検出 (D-API `roster check` の核)
- **委譲**: SE (Codex、別 runtime)。spike は throwaway なので品質ゲートは課さない (本実装でない)。Windows sandbox 対策は [[project_codex_windows_sandbox]] に従う
- **非対象**: 本実装の error handling / 全 command / テストコード (④) は L7 本実装。spike は「設計が成立するか手で当てる」だけ

## §3 検証計画 (S3)

spike を走らせ、§1 の設計仮説が成立するか観察:

| 検証点 | 期待 | 設計への含意 |
|---|---|---|
| scan が全 agent を拾うか | `.claude/agents/*.md` 全件が registry に入る | scan→registry 設計の成立 |
| capability class が一意に解決できるか | 各 agent が class + model family に決定的に分類される | resolver 設計の成立 (詰まれば frontmatter スキーマ追加が必要 = 設計修正) |
| roster↔guard 整合検出が動くか | allowlist 15 種と registry の乖離が検出される (乖離 0 を確認 or 乖離を正しく報告) | `roster check` D-API 設計の成立 |
| `runtime → roster` 一方向が物理的に保てるか | roster が runtime/guard を import しない (循環 0) | 依存方向設計の成立 |

**詰まり/欠落/不整合を観察記録** (§5 へ)。

## §4 設計確定 (S4、decision_outcome = PO)

- **confirmed**: 設計成立 → PLAN-L5-05-roster へ設計を **Forward 確定**で反映 (module-decomposition + internal-processing 増分を accepted 水準へ)。出口 = `promotion_strategy`: spike は throwaway なので通常 **redesign** (再設計で本実装) / spike が gate 通過品質なら reuse-with-hardening
- **pivot**: 設計の一部 (resolver / command 契約等) が詰まった → 該当を修正して再検証 (S2 へ戻る or 設計仮説差し替え)
- **rejected**: roster module 設計自体が成立しない → fullback で要件/方式に戻す (考えにくいが構造上の選択肢)

## §5 検証記録 (S3 実施時に追記)

> S2/S3 実施後にここへ「回った / 詰まった / 設計修正」を記録 (PLAN-X-01 §7.1 と同形式)。現時点は未実施 (S1)。

## §6 carry / 関係

- **Forward 着地先**: confirmed → PLAN-L5-05-roster (kind=design、L5↔L8 ペア) が設計を確定保持。本 Discovery は検証 vehicle で設計書ではない (設計書は per-requirement の L5-05、[[feedback-plan-per-requirement]])
- **兄弟 Discovery (後続判定)**: skill (FR-L1-47 recommender = 最も不確実、Discovery 濃厚) / drift (FR-L1-49 = rule 定義済だが「確証あり」と自己判断せず roster Discovery 後に要否判定)
- **メタモデル dogfood**: 本 PLAN の所見は [[PLAN-X-01]] §7.1 (S3 verify) へ Discovery-for-design の実適用例として back-merge
- **L6 carry**: 関数 signature / capability resolver アルゴリズムは confirmed 後の L6 機能設計 (waiting_layer:L6)

## §7 DoD (S1→S4)

- [x] **S1**: roster 設計仮説を §1 に provisional 記述 (確証度ラベル付き)
- [ ] **S2**: `poc/roster-spike` で `src/roster/` spike を SE 委譲・実装 (scan/resolve/consistency)
- [ ] **S3**: spike を走らせ §3 検証点を観察、§5 に記録 (回った/詰まった/設計修正)
- [ ] TL (別 runtime) が「spike が設計を実証したか」をレビュー
- [ ] **S4**: PO が `decision_outcome` 記録 (confirmed/pivot/rejected) + `promotion_strategy` 選択
- [ ] confirmed 時: PLAN-L5-05-roster へ Forward 確定反映 + 本 PLAN 所見を PLAN-X-01 §7.1 へ back-merge + spike ブランチ破棄/隔離
