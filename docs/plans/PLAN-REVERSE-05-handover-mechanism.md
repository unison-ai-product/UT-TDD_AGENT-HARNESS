---
plan_id: PLAN-REVERSE-05-handover-mechanism
title: "PLAN-REVERSE-05 (reverse/fullback): handover 記録機構を上位整合へ back-fill — §6.8.5 follow-up done 化 + CURRENT.md→.json 表記同期 + §6.8.6 digest 活性化 + L0 §10 用語。新 FR 不要 (§6.8 progress governance)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
forward_routing: L1
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL — as-is 設計復元 / CURRENT.md→.json 同期の整合 / 用語 back-merge のレビュー (claude-only は code-reviewer 代替)"
  - role: po
    slot_label: "PO — R3 intent (CURRENT.json を機械ポインタ正本とし CURRENT.md を廃止 / handover=§6.8 governance で新 FR 不要 / digest 活性化=current-plan 経路) の検証 (§1.8 R3 必須)"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-04-handover-mechanism.md
  blocks: []
---

# PLAN-REVERSE-05 (reverse/fullback): handover 記録機構を上位整合へ back-fill

## §0 位置づけ

Add-feature 標準ライフサイクル 経路 B の **収束段**。`PLAN-L6-06` (add-design) + `PLAN-L7-04` (add-impl) で **bottom-up build** した handover 記録機構の**上位整合 (§6.8.5 follow-up done 化 / §6.8.6 digest 活性化 / 要件 CURRENT.md→.json 表記同期 / L0 §10 用語) が空いている**ため、Reverse fullback で実装事実から back-fill し V-model 左腕の孤児化を解消する。`forward_routing=L1` (§6.8 progress governance は要件 L1 層) / `promotion_strategy=reuse-as-is`。

> **L4 external-if は対象外** (setup の REVERSE-04 と異なる): handover は外部システム I/F を持たず、`CURRENT.json` (機械 state) + `docs/handover/*.md` (tracked doc) の **内部 state/doc 投影のみ**。外部境界契約の back-fill は不要。

## §1 R0-R4 (fullback)

| phase | 作業 | 結果 |
|-------|------|------|
| R0 evidence | 実装事実収集: `src/handover/index.ts` (9 関数) / `src/runtime/session-log.ts` amendment (setActivePlan/inferPlanFromCommit/commit 配線) / `src/cli.ts` (handover/plan use) / `tests/handover.test.ts` U-HOVER-001〜007 (108 pass) | evidence = 実装 + 108 pass + CLI スモーク |
| R1 (skip) | 外部 I/F なし。投影は CURRENT.json (機械 state) + docs/handover md (tracked) の内部のみ | observed = 内部投影のみ |
| R2 as-is | (a) §6.8.5 が「詳細設計 (schema + 自動生成機構) は follow-up PLAN」と保留したまま (本機構が follow-up を充足したのに要件に反映なし) / (b) 要件 L947/L1972/L2024/L2148 が `CURRENT.md` 表記だが実装は `CURRENT.json` (機械ポインタ正本) / (c) §6.8.6 の digest 結節点が solo/main 直で死んでいた Gap B を current-plan 活性化で解消したのに要件に注記なし / (d) handover 4 用語が L0 §10 に未 back-merge | as-is = 4 つの上位 gap |
| R3 intent (po 検証) | (a) **handover = §6.8 progress-management governance の具体化 → 新 FR を起こさない** (fr-registry-audit 46 件不変。§6.8.5/6.8.6 が既に要件として存在) / (b) **CURRENT.json を機械ポインタ正本とし CURRENT.md を廃止** (二層 = CURRENT.json 機械 + docs/handover md 人間。L6-06 §2.4 で確定) / (c) **digest 活性化 = current-plan を書く経路** (`ut-tdd plan use` 確実 + commit 推定 best-effort)、resolveActivePlan 本体不変 — の 3 点が intent | **R3 PASS (2026-06-04)**: PO が CURRENT.json 正本 / CURRENT.md 廃止を承認 ("OK")。(a) は §6.8.5/6.8.6 が f934eae で既に要件化済 + follow-up が本機構 / (b) handoverStale/pre-push 参照先を CURRENT.json に確定 (dead 化回避、code-reviewer Critical) / (c) solo/main 直で plan_id 恒常 null の実測に grounded。再エスカレーション不要でクローズ |
| R4 gap/routing | `forward_routing=L1`: ① §6.8.5 L1124 の「follow-up PLAN で確定」を「PLAN-L6-06/L7-04 で確定済 (CURRENT.json 正本)」へ更新 / ② 要件 L947/L1972/L2024/L2148 の `CURRENT.md`→`CURRENT.json` 同期 / ③ §6.8.6 に「digest 活性化 = current-plan (ut-tdd plan use)、PLAN-L7-04」を注記 / ④ L0 §10 用語に 4 用語 back-merge。`reuse-as-is` (実装変更なし) | back-fill 完了 |

## §2 back-fill 内容 (新規 FR を起こさない = fr-registry-audit 46 件不変)

- **要件 §6.8.5** (`docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`): L1124 を「詳細設計は **PLAN-L6-06 (設計) / PLAN-L7-04 (実装) で確定済**。機械ポインタ正本 = `CURRENT.json` (CURRENT.md は廃止)、生成は `ut-tdd handover` (機械部 prefill + ③-⑥ human placeholder)」へ更新。
- **要件 CURRENT.md→.json 同期**: L947 (pre-push stale)、L1972 (§8 失敗変換)、L2024 (§8 構成ツリー)、L2148 (受入) の `.ut-tdd/handover/CURRENT.md` を `CURRENT.json` に統一 (機械ポインタ正本)。
- **要件 §6.8.6**: 「session-log の PLAN ダイジェストは ... 結節点」に「(digest の活性化 = `.ut-tdd/state/current-plan` を `ut-tdd plan use` で設定、solo/main 直で plan_id が null になる Gap を解消、PLAN-L7-04)」を注記。
- **L0 §10 用語** (`docs/governance/ut-tdd-agent-harness-concept_v3.1.md`): handover 機械ポインタ (CURRENT.json) / handover scaffold / plan_id 活性化 (current-plan) / handover stale を back-merge (§G.9 機構用語、導入層 L6)。

> **なぜ新 FR でないか**: handover は §6.8.5 (PLAN 完了時 handover 必須) / §6.8.6 (進捗 3 層) という **既存 §6.8 progress-management governance** の詳細設計・実装であり、新たな機能要件 (FR) ではない。要件は §6.8 側に既存、fr-registry-audit (46 件) を崩さない (setup=Phase 0 governance と同型の判断)。

## §工程表

### Step R4-1: 要件 §6.8.5 を follow-up done + CURRENT.json 正本へ更新
### Step R4-2: 要件 L947/L1972/L2024/L2148 の CURRENT.md→.json 同期
### Step R4-3: 要件 §6.8.6 に digest 活性化 (current-plan / ut-tdd plan use) を注記
### Step R4-4: L0 §10 用語に handover 4 用語を back-merge
### Step R-review: review 前置 (MUST)
`code-reviewer` で back-fill の妥当性 (新 FR 不要 / CURRENT.md→.json 同期の網羅 / 用語定義) をレビュー。po (R3) intent (CURRENT.md 廃止) 検証は escalation。
### Step R4-5: fr-registry-audit + doc-consistency + 全回帰
`npx vitest run` (46 件不変 + 108 pass 維持)。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| as-is 実装事実 | `src/handover/index.ts` / `src/runtime/session-log.ts` / `tests/handover.test.ts` (R0 evidence) |
| handover=§6.8 governance の判断 | 要件 §6.8.5/§6.8.6 (f934eae で既存) + scout (handover の FR-L1-NN 不在) |
| CURRENT.json 正本 / CURRENT.md 廃止 | handover-mechanism.md §2.4 (code-reviewer Critical 反映の正本決定) |
| digest 活性化 | session-log.ts setActivePlan/resolveActivePlan + handover-mechanism.md §1.5 (Gap B) |
| 用語 back-merge | PLAN-L6-06 §6 (4 用語、導入層 L6) |

## §3 成否

- 要件 §6.8.5/§6.8.6 + CURRENT.md→.json 同期 + L0 §10 が追記され、handover 実装が上位 (§6.8 governance / 用語) に trace 可能 (左腕孤児解消)
- **fr-registry-audit 46 件不変** + doc-consistency + 全回帰 108 pass
- code-reviewer review APPROVE (L6/L7/Reverse 各段。Critical/Important 全解消)
- **R3 PASS (2026-06-04)**: (a) handover=§6.8 governance で新 FR 不要 / (c) digest 活性化=current-plan は grounded / (b) CURRENT.md 廃止は PO 承認済 ("OK")。クローズ
- Add-feature 経路 B (L6→L7→Reverse→上位整合) の 1 サイクルが handover で完結 (session-log / forced-stop / setup に続く dogfood 4 例目)

## §4 carry

- **plan-lint / pre-push の handoverStale 配線** (§6.8.5 「PLAN completed なのに handover 追記なし → warn」/ §5.3 「CURRENT.json 24h stale warn」) は `handoverStale` を基盤に lint engine 実装時 (`src/plan/lint.ts` stub) に配線。現状 human-binding。
- **state DB 登録トリガ (FR-L1-07 hook)** は §6.8.6 結節点の別経路で別 FR。本機構は digest→handover 橋まで。
