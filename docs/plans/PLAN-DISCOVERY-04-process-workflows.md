---
plan_id: PLAN-DISCOVERY-04-process-workflows
title: "PLAN-DISCOVERY-04 (kind=poc): docs/process ワークフロー整備の Discovery (Forward L0-L14 V-model 単位 + 各駆動モデル定義を 設計→仮実装→検証→確定)"
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
  - role: aim
    slot_label: "AIM — Discovery 主導 (定義の検証・実証)"
  - role: po
    slot_label: "PO — 整備スコープ確定 + S4 decision_outcome"
  - role: tl
    slot_label: "TL — ワークフロー定義レビュー (別 runtime、claude-only 時は code-reviewer/pmo-sonnet 代替)"
generates:
  - artifact_path: docs/process/forward/
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/
    artifact_type: markdown_doc
  - artifact_path: docs/process/gates.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/repository-structure.md
    - vendor/helix-source/docs/v2/process/
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-DISCOVERY-04 (kind=poc): docs/process ワークフロー整備の Discovery

## §0 位置づけ

`docs/process/` は構成だけ実体化済 (`.gitkeep`)、中身ゼロ。本 PLAN は **Forward の V-model L単位ワークフロー (L0-L14) + 各駆動モデル (Discovery/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Scrum/Research) のワークフロー定義** を `docs/process/` の正本として整備する。

これは **kind=design ではなく Discovery (kind=poc)** で進める (PO 確定 2026-06-01)。理由: ワークフロー定義は紙上で確証を持って確定できない『設計』であり、PLAN-DISCOVERY-01 §1.1 (設計→仮実装→検証→確定) を適用し、**回しながら確定する**。なぞり (vendor 丸写し) 禁止、L3 要件レベルで起こす。

> **§6 用語更新 (§G.9) について**: §G.9 必須対象は design/impl/add-* PLAN。本 PLAN は kind=poc (Discovery) のため §6 用語更新節は不要 (対象外)。

> **DISCOVERY-01 との scope 差**: DISCOVERY-01 = workflow **メタモデル** が回るかの検証 (S4 待ち)。本 PLAN = その metamodel に沿って **実ワークフロー定義 (中身)** を整備し、定義が clean/網羅/非冗長に書けるかを検証。重複でない (新規 Discovery、PO 確定)。

## §1 前提 — 材料は抽出済 (本 PLAN で正本化)

vendor/helix-source/docs/v2/process + helix-process (untracked) から構造抽出済 (explorer):
- **Forward L0-L14**: 各層 目的 / V-pair (左腕 L1-L6 設計⇔右腕 L8-L14 検証) / gate G_N。
- **駆動モデル**: Forward(本体) + Discovery/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Scrum/Research、各 trigger / phase / exit / Forward 合流。
- **配置案**: `docs/process/{forward/, modes/, gates.md}` (repository-structure §2 準拠)。

> 抽出は research であり正本でない。本 PLAN で **なぞらず L3 要件レベルに翻案** して確定する。

## §2 何を検証 (hypothesis)

> 「メタモデル (①必須スケルトン L0-L14 + ②駆動モデル) を、実ワークフロー定義として `docs/process/` に書き起こすと、**各層/各駆動が 重複なく・層越境なく・過剰 process にならず・V-pair 対応が成立して** 定義できる」。

## §3 どう検証 (method)

設計→仮実装→検証→確定 (DISCOVERY-01 §1.1):
1. **S1 暫定定義**: forward/ (L0-L14) + modes/ (駆動モデル) + gates.md を暫定起草 (placeholder 許容)。
2. **S2 dogfood**: 自 repo の実工程 (L1-L5 で既に回した実績) を暫定定義に当て、定義どおり回るか手で照合。
3. **S3 verify**: 詰まり/欠落/冗長/層越境/V-pair 不成立を観察・記録。
4. **S4 decide**: PO が `decision_outcome` (confirmed → Forward 正本化 / pivot → 定義修正 / rejected)。

## §4 検証基盤

harness 自走前のため手動 + 既存 schema/frontmatter lint で回す。定義文書自体が成果物 (使い捨てでない、confirmed で正本化)。

## §5 成否基準

- **confirmed**: L0-L14 + 全駆動モデルが重複/層越境なく定義でき、V-pair 対応が成立、過剰 process 感なし (NFR-07)、既存 PLAN-DISCOVERY-01 メタモデルと整合。
- **rejected/pivot**: 定義に重複/欠落/層越境/V-pair 不成立があり metamodel 修正が要る → DISCOVERY-01 へ feedback。

## §工程表

### Step 1: S1 暫定定義 — Forward L0-L14 (forward/)

- `docs/process/forward/` に L0-L14 の V-model L単位ワークフローを暫定起草。各層: 目的 / 入口出口 / ① 設計成果物 / ③ ペアになるテスト設計層 / gate。左腕 (L0-L6) / 谷 (L7) / 右腕 (L8-L14) で分割 (explorer 配置案準拠、確証なき箇所は placeholder)。
- 状態: ⬜

### Step 2: S1 暫定定義 — 駆動モデル (modes/) + gates.md

- `docs/process/modes/` に各駆動モデル (Discovery/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Scrum/Research) を 1 ファイル 1 モードで暫定起草。各: trigger / phase 構成 / exit / Forward 合流点。`gates.md` に G0.5-G14 を集約。
- 状態: ⬜

### Step 3: S2 dogfood — 自 repo 実工程に当てて照合

- 自 repo が L1-L5 で実際に回した工程を暫定定義に照合し、定義どおり辿れるか・詰まる箇所を手で確認。
- 状態: ⬜

### Step 4: S3 verify — 詰まり/欠落/冗長/層越境/V-pair を記録

- §5 基準で観察結果を本 PLAN に記録 (回った / 詰まった / refinement)。metamodel 欠陥か適用エラーかを分類。
- 状態: ⬜

### Step 5: review (self-review 前置 MUST)

- PO へ S4 を求める前に **code-reviewer / pmo-sonnet** で定義の整合・重複・層越境・V-pair 成立を self-review (claude-only の tl 代替)。別 runtime 可なら tl-advisor。
- 状態: ⬜

### Step 6: S4 decide (PO)

- PO が `decision_outcome` 記録。confirmed → forward/modes/gates を正本確定 (status 遷移) + recovery-workflow.md 移管判断 (repository-structure §2)。
- 状態: ⬜

## §実装計画

| 項目 | 情報源 |
|---|---|
| Forward L0-L14 各層定義 | vendor/helix-source/docs/v2/process/L00-L14 + helix-process (なぞらず翻案) / concept v3.1 §2.3 V-model / requirements §1.4 VALID_LAYERS (L0-L14 + V-pair remap 表) |
| 駆動モデル定義 (9 種) | helix-process/*-workflow.md (Discovery/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Scrum/Research) / requirements §1.3 VALID_KINDS / §1.5 workflow_phase / concept §2.5 9-mode |
| gates.md (G0.5-G14) | explorer 抽出 gate 表 / docs/governance/gate-design.md / 各層 gate |
| 配置・分割 | docs/governance/repository-structure.md §2 (docs/process 置き場) + explorer 配置案 (forward/ modes/ gates.md) |
| 境界 (process vs design/harness) | self-review (pmo-sonnet) 画定済: docs/process=方法論定義、docs/design/harness=harness 自身の機能要件。混在禁止 |

## §DoD (S1→S3 進行、S4 は PO)

- [ ] Step 1-2: forward/ + modes/ + gates.md を S1 暫定起草
- [ ] Step 3: S2 dogfood (自 repo 実工程に照合)
- [ ] Step 4: S3 verify 所見を記録
- [ ] Step 5: self-review (code-reviewer / pmo-sonnet) 通過
- [ ] Step 6: S4 = PO が decision_outcome 記録。confirmed なら正本化 + recovery-workflow.md 移管判断
