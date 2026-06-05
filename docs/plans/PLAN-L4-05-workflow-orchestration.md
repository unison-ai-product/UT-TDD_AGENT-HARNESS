---
plan_id: PLAN-L4-05-workflow-orchestration
title: "PLAN-L4-05 (add-design): L4 基本設計 — workflow オーケストレーション外部設計の補追 (9 駆動モデル + Forward spine + 2 工程専門の状態遷移 what / 入口出口 / 担当 building block / signal→mode routing、IMP-069 reconcile)"
kind: add-design
layer: L4
sub_doc: function
drive: fullstack
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 9 駆動モデルの外部設計粒度 (altitude: L5/L6 へ踏み込まない) / signal→mode routing 優先度 / mode↔kind 非1:1 整合 / L9 pair 対称性のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L9
dependencies:
  parent: docs/plans/PLAN-L4-03-function.md
  requires: []
  references:
    - docs/process/modes/README.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_adr: docs/adr/ADR-004-internal-asset-ts-control-boundary.md
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve_after_fixes
    scope: "PLAN-L4-05 本体 (REQUEST_CHANGES → I-1/I-2 修正後 approve、A-102)"
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve
    scope: "§3.6 execution mode 追補 (事後 review、A-102 追補)"
---

# PLAN-L4-05 (add-design): L4 workflow オーケストレーション外部設計の補追

## §0 位置づけ

PO /goal「**改善して L4 完遂**」+ 「この harness は別プロダクト開発を回す**基盤**であり、その中核 = オーケストレーション設計が薄い (under-design) のは『doc 前提 × 機械処理厳格化』の融合思想に反する」を受ける。要件→基本設計の粒度監査 (本 session、pmo-project-explorer/pmo-sonnet 2 軸) で確定した **L4 の under-design 2 件** を解消する add-design:

- **Important-1**: workflow mode 群 (FR-14/15/16/23/26/29/30 = Reverse/Discovery/Incident/Scrum/Retrofit/screen/frontend) が function.md §3 で「将来 workflow module (L7 carry)」の 1 行に一括 defer され、各 mode の外部設計判断 (状態遷移 what / 入口出口形状 / 担当 building block) が未確定。
- **Important-2**: FR-12 (skill 文脈注入) が §2 で「未」のみ。

設計の実体は `docs/process/modes/*.md` (9 mode spike、2026-06-02 起草) に既存。これを **L4 外部設計粒度に昇格・蒸留**して function.md §3 を深める (新規発明でなく既存 spike の canonical design 化)。あわせて **IMP-069 (mode taxonomy reconcile)** を確定: function.md §3 の「10 mode」表記を、concept §2.5 / gate-design §1.1 が既に採る canonical な **「Forward spine + 9 駆動モデル + 2 工程専門」** へ整合する (新規決定でなく outlier 解消)。

本体 = `function.md` §3 deepening、③ ペア = `L9-system-test-design.md` ST-FUNC を同時に厚くし V-model 対称性を維持する。**altitude 厳守**: L4 は外部設計 (what/形状)。per-mode CLI signature・状態遷移 pseudocode・orchestration_mode の drive×layer cell・30-cell matrix は L5/L6/requirements へ明示 defer (under-design でなく正規 carry)。

## §工程表

### Step 1: [直列] IMP-069 reconcile (function.md §3 mode taxonomy 整合)
- 直列理由 = **file_conflict** (function.md を書く)。§3 冒頭の「10 mode」→「Forward spine (主線) + 9 駆動モデル (entry mode) + 2 工程専門 (screen/frontend)」へ。drift 注記 (m-2) を「reconciled (IMP-069、正本=concept §2.5)」へ更新。concept §2.5 / gate-design §1.1 と数表記一致を確認。

### Step 2: [直列] function.md §3 deepening (9 駆動モデル外部設計)
- 直列理由 = **file_conflict** (Step 1 と同一ファイル)。§3 を per-mode 外部設計へ拡張: ①入口 signal ②状態遷移 phase 列 + 各 phase what ③出口 contract (exit 条件 + Forward 合流先 L) ④担当 building block ⑤gate / 人間サインオフ要否。+ §3.x に **signal→mode routing 優先度モデル** (Incident>Recovery>Reverse>Refactor、concept §2.6) + **mode↔kind 非1:1** (Discovery/Scrum=poc / Incident=troubleshoot+recovery / Add-feature=add-design+add-impl)。FR-12 skill は §2/§3 で外部形状 (`ut-tdd skill suggest` の入力=PLAN context、出力=推挙 skill + 注入規約) を確定。

### Step 3: [直列] L9 ST-FUNC ペア deepening (③ 同時更新)
- 直列理由 = **downstream_dependency** (Step 2 の §3 設計要素に対応する ST-* を起こす)。ST-FUNC-01 を 9 駆動モデル + spine + 工程専門の end-to-end 遷移へ具体化、signal→mode routing (ST-FUNC-04) を優先度込みに、§2 量閉じを §3 新設計要素に対し孤児0 で再閉じ。

### Step 4: [直列] altitude / 二重定義 self-check + carry 明示
- 直列理由 = **downstream_dependency**。L5/L6/requirements への defer を §carry に明示列挙し under-design でないことを担保 (新原則: 正規 defer は under-design でない)。external-if §7 (what/how 境界) との二重定義が無いか確認。

### Step 5: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で ①外部設計粒度 (L5/L6 へ踏み込まない) ②L9 pair 対称性・孤児0 ③mode↔kind 整合 ④既存 §3 frozen 決定との非矛盾をレビュー。claude-only のため cross-agent 不在を evidence 記録。

## §実装計画

- **function.md §3** (情報源: `docs/process/modes/*.md` 9 spike + `modes/README.md` §2 台帳/§4 routing + concept §2.5/§2.6 + gate-design §1.1 + 本 session explorer 収集表): 9 駆動モデル + spine + 工程専門の外部設計表 + routing 優先度 + mode↔kind。
- **L9-system-test-design.md §1.3/§2** (情報源: Step 2 の §3 設計要素): ST-FUNC の workflow end-to-end をペア具体化。
- 設計粒度 = L9 総合テスト設計粒度 (各 mode の end-to-end 遷移が ST-* で被覆、孤児0)。altitude = 外部設計 (what)。

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| 駆動モデル (drive model / entry mode) | 確定 | 入口 9 種 (Discovery/Scrum/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Research)。状況で発動し、出口は必ず Forward spine へ合流。kind と非1:1 | back-merge (既存語の数=9 確定) |
| Forward spine (主線) | 確定 | L0-L14 V-model 本線。9 駆動モデルが合流する終着であり、駆動モデルと並ぶ「mode の 1 つ」ではない (IMP-069 reconcile、正本=concept §2.5) | back-merge |
| signal→mode routing | 参照 | concept §2.6 既定義。検出 signal → 優先度付き mode 自動 routing (Incident>Recovery>Reverse>Refactor)。L4 §3 で外部設計として明文化 | back-merge 不要 (concept §2.6 既存) |

## §7 機能要求更新 (FR registry delta)

> **機能要求更新なし**。本 add-design は既存 FR (FR-12〜16/23〜30) の外部設計を深めるもので、新規 FR-L1 を生まない。mode taxonomy の数 (9+spine+2) は既存 FR の整理であり registry 行追加なし。

## §8 DoD

- [x] IMP-069 reconcile: function.md §3 が「Forward spine + 9 駆動モデル + 2 工程専門」へ統一 + concept §2.5 legacy framing と橋渡し (modes/README §3、§10.2 glossary)
- [x] function.md §3 に 9 駆動モデルの外部設計 (入口/状態遷移/出口/担当 block/gate) + signal→mode routing 全順序 + mode↔kind 非1:1
- [x] FR-12 skill の外部形状 (入出力 + 注入規約、全 skill 常時ロードしない) を §3.4 に確定
- [x] L9 ST-FUNC ペア deepening (ST-FUNC-01/01b/04/05/06/07) + §2 量閉じ孤児0
- [x] altitude: L5/L6/requirements への defer を §3.6 に明示 (under-design でない正規 carry)
- [x] §6 用語 (駆動モデル/Forward spine) を concept §10.2 へ back-merge
- [x] review 前置 (code-reviewer、claude-only intra_runtime_subagent。cross-agent 不在=代替。指摘 I-1/I-2 修正済)
- [x] vitest 全回帰 189 pass + typecheck 0 + doctor exit 0 (pair-freeze 30 孤児0)

> **完了 (A-102、G4 add-design freeze、2026-06-05)**: 4 軸 PASS、`status: confirmed`。記録 = gate-design §2.1 A-102 注記 + `.ut-tdd/audit/A-102-g4-workflow-orchestration.md`。**review 前置 = code-reviewer (sonnet) で REQUEST_CHANGES → I-1 (Research/9-mode 帰属の二重 framing 橋渡し) + I-2 (routing 優先度を全順序へ) を修正後 freeze。M-1/M-2/M-4 は minor carry。cross-agent 不在のため intra_runtime_subagent (code-reviewer) で代替**。
> **追補 (§3.6 execution mode 次元、PO 問い「claude/codex/mix の 3 パターン考えられてる?」を受け freeze 後追加、2026-06-05)**: 駆動モデル orchestration が runtime 非依存で書かれ execution mode (claude-only/codex-only/hybrid/standalone) 次元を欠いていた連結 gap を解消。function §3.6「実行モード×オーケストレーション」= 判断/実装割当・review tier 縮退 (§2.1.2.1)・委譲分散・orchestration_mode 注入縮退 (§2.6.4)・mode-invariant 人間サインオフ を外部設計。L9 ST-FUNC-06 + ST-EXT-02 に接続。既存 concept §2.1.1/§2.1.2.1/§2.6.4 の忠実な wiring (新規発明でなく既設計の L4 反映)、cell 具体値は引き続き requirements defer。検証 = vitest 189 / doctor exit 0。
