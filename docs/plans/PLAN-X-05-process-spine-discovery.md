---
plan_id: PLAN-X-05-process-spine-discovery
title: "PLAN-X-05 (kind=poc): L7-L14 工程定義 Discovery (工程仮説→spike→検証→確定、exit=L3 要件定義へ FR 起票)"
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
    slot_label: "PO — 工程定義を L3 要件へ戻す方向の確定 + S4 成否最終判断"
  - role: tl
    slot_label: "TL — 工程仮説 (entry/手順/exit/成果物/fullback + FR-13 gate 承認者) の検証レビュー (別 runtime / claude-only 時は code-reviewer 代替)"
  - role: aim
    slot_label: "AIM — S2 spike (L7 実態突合 / L8-L14 机上適用 / FR-13 matrix) の観点レビュー (kind=poc 必須 role、§1.8)"
generates:
  - artifact_path: docs/plans/PLAN-X-05-process-spine-discovery.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-X-01-workflow-metamodel.md
    - docs/governance/gate-design.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/recovery-workflow.md
    - vendor/helix-source/docs/v2/process/L07-implementation-sprint.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-X-05 (kind=poc): L7-L14 工程定義 Discovery

## §0 位置づけ

handover 2026-06-01 §2 ピース2 (L7-L14 工程定義) を、**正しい altitude = 要件定義 (L3) レベル**で起こす Discovery。roster (PLAN-X-03) / skill (PLAN-X-04) に続く Discovery-for-design ([[PLAN-X-01]] §1.1) の 3 件目だが、**着地点が一段上 (L5 でなく L3 要件)**。

> **なぜ Discovery (kind=design でない)**: L7-L14 工程の entry/手順/exit/成果物/fullback と **FR-13 (gate 承認者)** は紙上で確証が持てない。vendor doc からの kind=design トップダウン authoring は「なぞり/捏造」(handover §3 禁止)。Discovery で実証してから確定する。

> **なぜ要件 (L3) レベル**: harness 自身は **L4 (基本設計) = G4 COND PASS (未クローズ)**。まだ上流にいる。L7-L14 工程が無いのは「下流工程の未着手」でなく **「その工程が何かという要件 (L3) が未確定」**。よって工程定義 = L3 要件 (FR) の穴。confirmed 所見は **L3 要件定義へ FR として戻す** (exit=L3)。

> **Forward = L のワークフロー / 駆動モデル = 補助導線** (PO 確定 2026-06-01): 本 Discovery は Forward spine の L7-L14 を扱う。駆動モデル (Scrum/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Research) は L への補助導線であり、各 L 工程に「合流先」として関与するのみ (本 PLAN では合流点の有無だけ確認、内部 phase 詳細は別途)。

## §1 設計 (S1, provisional) — 工程仮説 + 核心的不確実性

確定度監査 2026-06-01 の判定: L0-L1/L3-L6 = 5 要素完備、L2 = G2 承認者 FR-13 未定義 (DEFER)、**L7 = 定義有・PLAN 0 件**、**L8-L14 = 手順 placeholder・gate 承認者 FR-13 未定義・成果物が概念記述のみ**。曖昧の起点 = L8。FR-13 (gate 承認者) の穴は **L2・L8-L14 を横断**。

検証対象 (工程仮説、紙上で無理に確定しない):

| 工程 | 仮説 (移植元 vendor v2 + UT-TDD relabel) | 確証度 | 実態の有無 |
|---|---|---|---|
| **L7 実装スプリント** | 7step (PLAN起票→TDD Red→Green→3点レビュー→テスト追加→実施→G7) / 成果物 = src+tests / fullback = L4/L5/L6 差し戻し | 中 — vendor L07 (137行) あり。**harness src/ に実装+検証の実態あり** | **あり** (roster/agent-guard/schema 等) |
| **L8 結合テスト 〜 L14 運用検証** | 各 entry/手順/exit(gate)/成果物/fullback (vendor v2 L08-L14、93-101行) | 低 — **harness 未通過** (未デプロイ・未運用)、実態なし | **なし** |
| **FR-13 (gate 承認者)** | claude-only = code-reviewer self-review 前置 + PO 承認 / hybrid = + frontier-reviewer。G2/G7-G14 横断 | 中 — 横断ルールが各 gate で sensible か未実証 | 部分 (G1-G6 は運用実績あり) |

### §1.1 S1 で surface した詰まり (Discovery で解く核心)

- **詰まり① L7 は実態あり (Reverse 余地)**: harness は既に src/ に実装+検証を持つ。L7 工程仮説は **実態から検証可能** (実際に回った工程と vendor 7step の突合)。confirmed なら FR-L7 として L3 へ。⚠ ただし本 Discovery の主目的は要件起こしであり、本格 Reverse(fullback) は別途判断 (実態が L7 工程仮説を支持するかの確認に留める)。
- **詰まり② L8-L14 は実態なし (純 Discovery)**: harness 未通過のため実装/検証で実証できない。**工程仮説の spike = 「vendor 工程を UT-TDD の 1 機能に適用したら成立するか」の机上 + 最小 dry-run** に留め、確証できない部分は **placeholder + 依存** ([[feedback_vmodel_state_db_completeness]]) として L3 FR に「未確定マーカー付き要件」で戻す。
- **詰まり③ FR-13 (gate 承認者) 横断**: L2・L8-L14 共通。各 L 個別でなく **FR-13 を 1 つの横断要件**として L3 に起こす (claude-only/hybrid 別の承認主体 matrix)。同じ判断の 8 回重複を回避。

## §2 仮実装計画 (S2, PoC spike)

- **ブランチ**: `poc/process-spine-spike` (使い捨て、`poc/*` → main 直 PR は policy で禁止。物理ブロック実装は L7 carry)
- **実装**: PM-authored TS / 机上検証 (Codex は 8009001d で broken、[[feedback_ts_native_over_helix_cli]])
- **spike 範囲** (実態の有無で 2 系統):
  1. **L7 (実態あり)**: src/ の実開発履歴 (roster=PLAN-X-03 の S2/S3、agent-guard 実装) を vendor 7step と突合 → 実際に回った工程が 7step 仮説を支持するか観察。コード不要、既存成果物の trace。
  2. **L8-L14 (実態なし)**: 各工程仮説を UT-TDD の 1 機能 (例: roster module) に**机上適用** → entry/exit/成果物が定義可能か、placeholder で残すべき部分はどこかを切り分け。
  3. **FR-13**: gate 承認者 matrix (G2/G7-G14 × claude-only/hybrid) を draft → 既存 G1-G6 運用実績と矛盾しないか検証。

## §3 検証計画 (S3)

| 検証点 | 期待 | 設計への含意 (L3 FR) |
|---|---|---|
| L7 7step が実態を説明するか | roster/agent-guard 開発が 7step に mapping できる | FR-L7 を実態ベースで確定可 (なぞりでなく evidence) |
| L8-L14 工程仮説が机上で定義可能か | entry/exit/成果物が書けるもの / placeholder にすべきものを切り分け | FR-L8..L14 を「確定 + placeholder 依存」混在で起票 |
| FR-13 横断 matrix が sensible か | claude-only/hybrid の承認主体が G1-G6 実績と矛盾しない | FR-13 を 1 横断要件として確定 |

## §4 設計確定 (S4, decision_outcome = PO)

- **confirmed**: 工程仮説が (実態 + 机上) で成立 → **L3 要件定義へ FR 起票** (FR-L7..L14 + FR-13)。確証不足は placeholder + 依存で明示。出口 `promotion_strategy` 相当 = L3 へ routing (roster/skill の L5 着地に対し L3 着地)。
  - **L7 分岐**: 実態 (src/ 開発履歴) が vendor 7step を**支持** → FR-L7 を実態ベースで確定 (本 Discovery 内で完結、Reverse 不要)。実態が 7step と**乖離** → その gap は **Reverse(fullback) の対象** = 別 PLAN (PLAN-X-06 想定) を起票し、本 Discovery では「乖離あり」の記録に留める。
- **pivot**: 工程仮説の枠組み (5 要素 / FR-13 matrix) を見直して再検証。
- **rejected**: 考えにくい (工程定義の必要性自体は確定済)。

## §5 検証記録 (S2/S3 実施時に追記)

> S2/S3 実施後にここへ記録 (PLAN-X-03 §5 と同形式)。現時点 S1 (未実施)。

## §6 carry / 関係

- **Forward 着地先**: confirmed → **L3 要件定義** (FR-L7..L14 + FR-13 の起票/補完)。そこから Forward 再降下で L4 クローズ→L5/L6 設計→工程正規定義。
- **L4 未クローズ前提**: harness は G4 COND PASS。本 Discovery は上流 (要件) の穴埋めであり、下流成果物 (governance process doc) は L3→Forward 後に生まれる。先に governance doc を書かない。
- **駆動モデル正本化 (別軸)**: handover §2 ピース1。Forward spine (本 PLAN) と相互作業だが別 PLAN。
- **メタモデル dogfood**: 所見は [[PLAN-X-01]] §7.1 へ back-merge。本 PLAN は roster/skill の **Discovery-for-design (L5 着地)** とは別型 = **Discovery-for-requirements (L3 着地)**。S4 confirmed 時に PLAN-X-01 へ「Discovery-for-requirements 型」を新設提案する。
- **兄弟**: roster (X-03, confirmed)・skill (X-04, S1)。本件は着地点が L3 で一段上。

## §7 DoD (S1→S4)

- [x] **S1**: 工程仮説 (L7 実態あり / L8-L14 実態なし / FR-13 横断) + 核心的不確実性 (詰まり①②③) を §1 に provisional 記述
- [ ] **S2**: `poc/process-spine-spike` で L7=実態突合 / L8-L14=机上適用 / FR-13=matrix draft (PM、env-forced)
- [ ] **S3**: 工程仮説の成立/placeholder 切り分けを §5 に記録
- [ ] self-review (code-reviewer / pmo-sonnet) が検証の信頼性を確認 (前置 MUST)
- [ ] **S4**: PO が `decision_outcome` (confirmed=L3 FR 起票 / pivot / rejected)
- [ ] confirmed 時: L3 要件定義へ FR-L7..L14 + FR-13 を起票 (placeholder + 依存込み) + PLAN-X-01 §7.1 back-merge
