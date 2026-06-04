---
plan_id: PLAN-REVERSE-08-discovery-metamodel
title: "PLAN-REVERSE-08 (reverse/normalization): DISCOVERY-01 (workflow メタモデル PoC) confirmed を上位整合へ — concept §2.5 Discovery 定義 promote の Forward 合流 vehicle"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: normalization
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
forward_routing: L1
promotion_strategy: reuse-with-hardening
agent_slots:
  - role: tl
    slot_label: "TL — concept §2.5 Discovery promote (確証なき設計 / 合流点 L1・L3-L6) の上位正本整合 / discovery.md との一致 / schema 非競合のレビュー (claude-only は code-reviewer 代替)"
  - role: po
    slot_label: "PO — R3 intent (workflow メタモデルを reuse-with-hardening で採用してよいか / promote 文面が PoC §1.1 と整合か) の検証。S4 decision_outcome=confirmed は PO「3件の問題を解消して」2026-06-04 で授権済"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
  blocks: []
  references:
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
---

# PLAN-REVERSE-08 (reverse/normalization): DISCOVERY-01 confirmed の Forward 合流

## §0 位置づけ

`PLAN-DISCOVERY-01-workflow-metamodel` (kind=poc) が S4 confirmed (decision_outcome=confirmed、2026-06-04) になったことを受け、requirements §1.2 (line 156「confirmed → Reverse R0 接続、reverse kind PLAN を新規起票」) / §3.3 / scrum_reverse_lint (line 809) に従い、**確定した workflow メタモデルを上位正本 (concept §2.5) へ正規化 (normalization) する Reverse vehicle** を起票する。

> **なぜ Reverse が要るか**: PoC confirmed の findings を inline で concept 編集するだけでは「confirmed poc に対応する reverse PLAN が無い」状態となり scrum_reverse_lint / §1.2 に違反する (本 PLAN を起こさず concept §2.5 を直接 promote していたのを review 前置 code-reviewer が検出、IMP-064)。Reverse PLAN を vehicle にすることで PoC→Forward 合流が process-legible になる。`requires` に confirmed poc (DISCOVERY-01) を載せて pairing を宣言。

## §1 R0-R4

| phase | 内容 | 状態 |
|-------|------|------|
| **R0** | 起点 = DISCOVERY-01 (decision_outcome=confirmed、promotion_strategy=reuse-with-hardening)。S3 §7.1 で「詰まりは全件 検証が捕捉・是正、メタモデル本体の欠陥でなく言語化不足/適用ミス」と結論済 | done |
| **R1** | Observed Contracts: `confirmed_reverse_type=normalization` のため **skip** (設計 drift 修正型、R2 で normalize。requirements line 820) | skip |
| **R2** | normalize: concept §2.5 Discovery 定義 (現「要件未確定/実現性不透明」のみ) を、dogfood で確証した「**確証なき設計**にも適用 (設計→仮実装→検証→設計確定)」へ正規化。合流点を `確定後 → L1` から `L1 (要求) / L3-L6 (設計確証時)` へ拡張 | done |
| **R3** | Intent 検証 (PO)。intent = ①workflow メタモデルを reuse-with-hardening で採用してよいか ②promote 文面が PoC §1.1 と整合か。**PO「3件の問題を解消して」2026-06-04 で授権**、claude-only のため intra_runtime_subagent (pmo-sonnet 整合 A-4 OK + code-reviewer) で代替検証し evidence 記録 | confirmed |
| **R4** | fullback: concept §2.5 へ promote 適用済 (Discovery 行 + 補足 bullet) + **requirements §1.3 signal→mode マップに `design_uncertain` を反映** (concept のみ promote して requirements を放置すると L0⇔L3 ドリフト、IMP-065)。discovery.md §3/§4 の合流点 (L1/L3-L6) と一致確認済。DISCOVERY-01 DoD の「concept §2.5 へ promote」box を check | done |

## §2 工程表

### Step 1: [直列] R2 normalize 適用 (concept §2.5 promote)
- 直列理由 = **file_conflict** (concept_v3.1.md §2.5 を直接編集、他 Step と同一ファイル)。
- concept §2.5 Discovery 行 + 補足 bullet に「確証なき設計」適用 + 合流点 L1/L3-L6 を追記。情報源 = DISCOVERY-01 §1.1 文言。

### Step 2: [直列] R4 整合確認
- 直列理由 = **downstream_dependency** (Step 1 の promote 結果に依存)。
- discovery.md §3/§4 と concept §2.5 の合流点一致を確認 (pmo-sonnet 3巡目 A-4)。DISCOVERY-01 frontmatter (S4/confirmed) と schema 非競合を確認 (A-3)。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency** (Step 1-2 の成果をレビュー)。
- code-reviewer で promote 正確性 / 上位正本整合 / recovery 等との非競合をレビュー。cross-agent 不在を evidence 記録 (requirements §7.8.7.1)。

## §3 実装計画

- **concept §2.5 promote** (情報源: DISCOVERY-01 §1.1 L55-68 の「確証なき設計」定義): Discovery 入口条件に追記、合流点拡張。→ 適用済 (本 session)。
- **DISCOVERY-01 frontmatter** (情報源: requirements §1.2.2 VALID_DECISION_OUTCOMES): workflow_phase S4 / decision_outcome confirmed / status confirmed / promotion_strategy reuse-with-hardening。→ 適用済。
- **本 PLAN の requires=DISCOVERY-01** (情報源: scrum_reverse_lint line 809): reverse PLAN が confirmed poc を指す制約を満たす。
- **forward_routing=L1 の射程**: R4 の合流先は要求確定 (L1) として登録。設計確証分 (L3-L6) の合流は concept §2.5 / DISCOVERY-01 §1.1 が個別 Forward PLAN で扱う (本 Reverse は metamodel 採用の governance 正規化が主目的、forward_routing enum は L1/L3/L4/L5/gap-only の単一値)。
- **R3 evidence の所在**: PO 直接授権 (2026-06-04「3件の問題を解消して」) + intra_runtime_subagent 代替 (pmo-sonnet 3巡目 A-4 整合 OK / code-reviewer 本 cycle review 前置 APPROVE)。記録 = 本 PLAN §1 R3 行 + DISCOVERY-01 §9 DoD。

## §6 用語更新

- **確証なき設計 (Discovery 適用拡張)**: 紙上で実現性・妥当性が確定できない設計。確証を装って Forward 凍結せず Discovery (kind=poc) として起票し「設計→仮実装→検証→設計確定」サイクルで確定する。→ concept §10.2 用語集へ back-merge 済 (living glossary、doctor checkBackfill green)。
- (既存語の適用) `promotion_strategy` (reuse-with-hardening) は concept §10.2 に既登録のため新規 back-merge 不要 — 本 PLAN は既存語を適用するのみ。

## §7 DoD

- [x] R2 normalize = concept §2.5 promote 適用
- [x] R3 Intent = PO 授権 (「解消して」) + intra_runtime_subagent 代替検証 evidence
- [x] R4 = discovery.md / schema との整合確認、DISCOVERY-01 DoD box check
- [x] requires に confirmed poc (DISCOVERY-01) を宣言 (scrum_reverse_lint 充足)
- [x] §6 用語を concept §10 へ back-merge (確証なき設計 / reuse-with-hardening)
- [x] 命名テスト + 全回帰 green / code-reviewer 前置
