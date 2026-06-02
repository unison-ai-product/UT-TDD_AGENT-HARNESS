---
plan_id: PLAN-REVERSE-03-forced-stop-feedback
title: "PLAN-REVERSE-03 (reverse/fullback): forced-stop フィードバックを上位整合へ back-fill — concept §2.6.1 forced_stop signal + L3 FR-07 facet + recovery 出口契約 (再発防止 doc MUST)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: fullstack
status: confirmed
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
forward_routing: L3
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL — as-is 設計復元 / signal 追加 / 出口契約のレビュー (claude-only は code-reviewer 代替)"
  - role: po
    slot_label: "PO — R3 intent (forced_stop=Recovery 級 + 再発防止 doc 必須化の妥当性) 検証 (§1.8 R3 必須)"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-02-forced-stop-feedback.md
  blocks: []
---

# PLAN-REVERSE-03 (reverse/fullback): forced-stop フィードバックを上位整合へ back-fill

## §0 位置づけ

Add-feature 標準ライフサイクル 経路 B (add-feature.md §1.1) の **収束段**。`PLAN-L6-04` (add-design) + `PLAN-L7-02` (add-impl) で **bottom-up build** した forced-stop フィードバック機能の **上位整合 (L0 concept signal / L3 要件 / recovery 正本) が空いている**ため、Reverse fullback で実装事実から back-fill し V-model 左腕の孤児化を解消する。`forward_routing=L3` / `promotion_strategy=reuse-as-is`。

## §1 R0-R4 (fullback)

| phase | 作業 | 結果 |
|-------|------|------|
| R0 evidence | 実装事実収集: `src/runtime/forced-stop.ts` (7 関数 + fail-open) / `.claude/hooks/session-log.ts` の SessionStart scan 配線 / `src/cli.ts` feedback classify/pending / `tests/forced-stop.test.ts` U-FSF-001〜007 (85 pass) | evidence = 実装 + 85 pass |
| R1 (skip) | 内部観測 hook + CLI で外部 API/DB 契約なし → 観測対象は hook I/F + CLI I/F のみ (forced-stop-feedback.md §2) | observed = hook/CLI I/F |
| R2 as-is | 強制停止検出は `agent_runaway` 級シグナルだが concept §2.6.1 signal 表に未登録。フィードバックログ + Recovery 提示は FR-07 観測 facet の延長。recovery.md は forced_stop trigger も再発防止 doc 出口契約も持たない | as-is = 3 つの上位 gap |
| R3 intent (po 検証) | (a) forced_stop を `agent_runaway` 級 Recovery trigger に昇格 / (b) Recovery 出口契約に **再発防止ドキュメント MUST** / (c) 新 FR を起こさず FR-07 拡張で吸収 (fr-registry 46 件不変) — の 3 点が intent | **R3 PASS (2026-06-02)**: (a)(b) は PO が本 session で確定済 ([[feedback_forced_stop_high_severity_recovery]]、強制停止=最高 severity・Recovery 必須・再発防止 doc を出口契約に MUST) / (c) は code-reviewer self-review GO (新 top-level 要件にすべき過小評価なし、session-log REVERSE-02 と同方針)。よって R3 intent 充足、PO への再エスカレーション不要 |
| R4 gap/routing | `forward_routing=L3`: ① concept §2.6.1 に `forced_stop` 追加 / ② L1 FR-L1-07 `※ extended` + L3 FR-07 振る舞い + **AC-FR-07-05** / ③ recovery.md に forced_stop trigger + 出口契約 (再発防止 doc) + interrupt との区別。`reuse-as-is` (実装変更なし) | back-fill 完了 |

## §2 back-fill 内容 (新規 FR を起こさない = fr-registry-audit 46 件不変)

- **L0 concept §2.6.1** (`docs/governance/ut-tdd-agent-harness-concept_v3.1.md`): signal→mode 表の Recovery 行に `forced_stop` を追加 (`agent_runaway` 級、承認必須)。「ユーザー強制停止 = 高 severity 負シグナル、専用 hook 不在のため dangling-turn 推定」を備考。
- **L1 FR-L1-07** (`docs/design/harness/L1-requirements/functional-requirements.md`): session-log 拡張行に forced-stop 観測 (強制停止推定 + フィードバックログ + Recovery 提示) を `※ extended` 追記。
- **L3 FR-07** (`docs/design/harness/L3-functional/functional-requirements.md`): 振る舞い (extended) に forced-stop facet 追記 + **AC-FR-07-05 (forced-stop: dangling-turn 推定 / 是正のみ記録 / mistake 非記録 / Recovery 提示候補 / fail-open + 取りこぼし倒し)** 追加。
- **recovery.md spike** (`docs/process/modes/recovery.md`): ガード/収束に forced_stop trigger を追加 + **§3 exit 条件に「再発防止ドキュメント作成済 (MUST)」** + §6 に「forced_stop (強制停止 = AI やらかし) は §6 既存『interrupt (設計ギャップ割込み)』とは別概念」を明記。

> **なぜ新 FR でないか**: forced-stop 検出は hook 観測 = FR-L1-07 領域。フィードバックログ + Recovery 提示は FR-07 facet + Recovery (concept §2.5) への入力であり、独立 top-level 要件ではない。新 FR は件数確定 (46) と fr-registry-audit を崩すため拡張で吸収 (§1.10.G.10)。

> **再発防止 doc = 仕組み化志向**: prose 止まりでなく guard/test/rule への機械強制を目指す (§8.6 失敗→仕組みループ、[[feedback_process_for_record_not_weight]])。recovery-workflow.md 正本側への同期は carry (§4)。

## §工程表

### Step R4-1: concept §2.6.1 に forced_stop signal 追加
### Step R4-2: L1 FR-L1-07 拡張 + L3 FR-07 振る舞い + AC-FR-07-05 追加
### Step R4-3: recovery.md に forced_stop trigger + 再発防止 doc 出口契約 + interrupt 区別
### Step R-review: self-review 前置 (MUST)
`code-reviewer` で back-fill の妥当性 (FR-07 拡張で十分か / AC が impl と一致か / signal 追加の整合 / 再発防止 doc 契約) をレビュー。po (R3) intent 検証は escalation。
### Step R4-4: fr-registry-audit + 全回帰
`npx vitest run` (46 件不変 + 85 pass 維持)。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| as-is 実装事実 | `src/runtime/forced-stop.ts` / `tests/forced-stop.test.ts` (R0 evidence) |
| forced_stop の Recovery 級判断 | PO 確定 [[feedback_forced_stop_high_severity_recovery]] / concept §2.6.1 agent_runaway 行 |
| FR-07 拡張 vs 新 FR | FR-L1-07 (hook 観測) scope + fr-registry-audit 46 件制約 (session-log REVERSE-02 と同方針) |
| AC-FR-07-05 oracle | forced-stop-feedback.md §2 + U-FSF-001〜007 |
| 再発防止 doc 出口契約 | PO 確定 (Recovery 内で再発防止 doc MUST) + §8.6 失敗→仕組みループ |

## §3 成否

- concept §2.6.1 forced_stop signal + L1 FR-L1-07 拡張 + L3 FR-07 + AC-FR-07-05 + recovery.md (trigger/出口契約/区別) が追記され、forced-stop 実装が上位 (signal/要件/recovery) に trace 可能 (左腕孤児解消)
- **fr-registry-audit 46 件不変** + 全回帰 85 pass
- code-reviewer self-review APPROVE (L6/L7/Reverse 各段。Critical/Important 全解消)
- **R3 PASS (PO 確定済 + self-review GO、上表 R3 行)**: (a) forced_stop=Recovery 級 / (b) 再発防止 doc 必須化 は PO が本 session で確定 / (c) 新 FR 不要 は self-review GO。**再エスカレーション不要**でクローズ
- Add-feature 経路 B (L6→L7→Reverse→上位整合) の 1 サイクルが forced-stop で完結 (dogfood)。`status: confirmed` (G7 trace-freeze は別ゲート)

## §4 carry

- **recovery-workflow.md 正本 (当面の正本、recovery.md §6) への同期**: forced_stop trigger + 再発防止 doc 出口契約を正本側にも反映 (本 PLAN は spike + concept/L3 を更新、正本 workflow doc は follow-up)。
- **再発防止 doc artifact schema** (構造・テンプレート・機械強制への落とし) は handover Next Action 7 (§6.8.5/§6.8.6 実装) と統合した follow-up。
