---
plan_id: PLAN-REVERSE-01-process-docs
title: "PLAN-REVERSE-01 (kind=reverse): docs/process 正本化 — DISCOVERY-04 dogfood 実績 (V1-V7) から forward/modes/gates を as-is 復元し gap を Forward へ routing"
kind: reverse
layer: cross
workflow_phase: R0
drive: reverse
status: draft
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — as-is 復元 (R0-R2) + gap routing 確定 (R4)。別 runtime、claude-only 時は code-reviewer/pmo-sonnet 代替"
  - role: po
    slot_label: "PO — R3 Intent 検証 + V7 drive 概念 (§1.6 再設計) の判断"
generates:
  - artifact_path: docs/process/forward/
    artifact_type: doc_update
  - artifact_path: docs/process/modes/
    artifact_type: doc_update
  - artifact_path: docs/process/gates.md
    artifact_type: doc_update
dependencies:
  parent: null
  requires:
    - PLAN-DISCOVERY-04-process-workflows
  references:
    - docs/plans/PLAN-DISCOVERY-04-process-workflows.md
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/repository-structure.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-REVERSE-01 (kind=reverse): docs/process 正本化

## §0 位置づけ

PLAN-DISCOVERY-04 (Discovery、S4 confirmed 2026-06-02) の **終点 Reverse** (§3.1)。Discovery で回した docs/process spike (forward L0-L14 + 駆動モデル9種 + gates) を、**dogfood 実績 (V1-V7) を evidence に as-is 復元し、gap を Forward 各層へ routing して正本化**する。

> **Discovery → Reverse 配線 (PO 確定、メタモデル標準)**: docs/process の正本は forward で机上起草せず、Discovery で回した実績から Reverse で再整備する。本 PLAN がその「再整備本体」。requirements §1.2 / DISCOVERY-01 §6 と同配線。

**reverse_type = design/fullback** (既存 spike + dogfood 実績からの設計復元 + 完了 Discovery の文書整合)。design/normalization 型は **R1 (Observed Contracts) skip** 可 (§3.3)。

## §1 evidence (R0-R2 の入力)

| evidence | 内容 |
|----------|------|
| ① DISCOVERY-04 spike | `docs/process/{README, forward/*, modes/*, gates.md}` (PROVISIONAL、本 PLAN で正本化) |
| ② dogfood 実績 | DISCOVERY-04 §S2-S3: L1-L6 sub-doc ⇔ 実 PLAN 整合 / 実使用 mode frontmatter 整合 / V-pair 成立 |
| ③ gap register | DISCOVERY-04 V1-V7 (下記 §2) |
| ④ 移植元 | `vendor/helix-source/docs/v2/process/` + `helix-process/` (なぞり禁止、翻案元) |

## §2 gap register (R3-R4 で Forward へ routing)

| # | gap | forward_routing 候補 | promotion_strategy 候補 |
|---|-----|---------------------|------------------------|
| **V7** (最重要) | **`drive` 概念の歪み**: drive=専門職 (be/fe/fullstack/db/agent) だが §1.6 enum に mode 値 (scrum/reverse/poc/troubleshoot) が混在 + 「駆動モデル」と命名衝突 | **L3** (requirements §1.6 VALID_DRIVES 再設計 + concept §2.5/§2.6.4 用語分離 + DISCOVERY-01 metamodel) | redesign (drive 軸を専門職のみに再定義) |
| V3 | recovery drive: §1.6 `recovery→troubleshoot 固定` vs 実 PLAN-RECOVERY-01=fullstack。**V7 に包含** (recovery は work 専門職を継承) | L3 (V7 と同時) | (V7 従属) |
| V1 | `forward_routing` enum (L1/L3/L4/L5/gap-only) に helix の L7/L8-L11(fullback) routing が無い | L3 (requirements §3.4 / schema enum 拡張要否) | reuse-with-hardening or redesign |
| V2 | `docs/research/` が canonical tree 未登録だが research.md が参照 | L4→repository-structure (tree 追加 or docs/adr 寄せ) | reuse-with-hardening |
| V4 | L4/L5 の内部資産拡張 sub-doc (roster/skill/drift) が forward spike の sub-doc enum に未記載 | L3/L4 (sub-doc enum 拡張点注記) | reuse-with-hardening |

> V5/V6 (mode≠kind 非1:1 / phase 命名) は DISCOVERY-04 で翻案解決済 = gap でない。

## §3 工程表 (R0-R4)

### Step R0: Evidence Acquisition

- §1 evidence を収集・整理 (spike 群 + dogfood 実績 + gap register + 移植元)。`.ut-tdd/reverse/R0-evidence-map` 相当に整理。
- 状態: ⬜ **次**

### Step R1: Observed Contracts (design/fullback 型は skip)

- reverse_type=design/fullback のため **skip** (§3.3、RG1 を持たない)。skip 理由を記録。
- 状態: ⬜ (skip)

### Step R2: As-Is Design

- spike (forward/modes/gates) を「現状あるべき定義」として整理。dogfood で「回った」部分 (V-pair / sub-doc 整合 / mode frontmatter) を as-is 正本候補に昇格。
- 状態: ⬜

### Step R3: Intent Hypotheses (po 検証必須)

- gap register (V1/V2/V4/V7) の「あるべき姿」仮説を作成。**特に V7 (drive 再設計) は PO 検証必須** (§1.8 R3→po)。drive=専門職のみ / mode 値分離 / recovery は work 専門職継承 の方向を PO 確認。
- 状態: ⬜

### Step R4: Gap & Routing (forward_routing + promotion_strategy 必須)

- 各 gap の `forward_routing` (大半 L3=requirements) + `promotion_strategy` を確定。docs/process/{forward,modes,gates} の正本昇格 + recovery-workflow.md 移管判断 (repository-structure §2)。
- 状態: ⬜

### Step R-review: self-review 前置 (MUST)

- PO へ R4 routing 確定を求める前に code-reviewer / pmo-sonnet で as-is 復元の正確性・gap routing の妥当性を self-review (claude-only の tl 代替)。
- 状態: ⬜

## §4 Forward 合流

R4 routing 確定後、docs/process/{forward,modes,gates} を **L3 要件正本**として確定 + V7 を requirements §1.6 へ接続 (drive 軸再設計)。recovery-workflow.md の docs/process 移管も判断。

## §5 成否

- 正本化完了: forward/modes/gates が PROVISIONAL を外れ正本化、V1-V7 が Forward 各層 (主に L3 requirements §1.6) へ routing され閉塞。
- open 残: V7 (drive 再設計) が requirements §1.6 改訂を要する場合は L3 design PLAN へ blocks。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| as-is 復元 (R0-R2) | DISCOVERY-04 spike (docs/process/*) + §S2-S3 dogfood 実績 |
| gap 仮説 (R3) | DISCOVERY-04 V1-V7 + requirements §1.6 (drive) / §3.4 (forward_routing) / repository-structure (tree) |
| routing 確定 (R4) | concept §2.5/§2.6 (mode↔drive) / requirements §1.5/§1.6 / DISCOVERY-01 metamodel |
| drive 再設計 (V7) | PO framing (drive=専門職) + concept §2.6.4 layer-context injection (owner_role/mandatory_agents) |
