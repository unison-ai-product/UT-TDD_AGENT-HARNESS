---
plan_id: PLAN-REVERSE-02-session-log
title: "PLAN-REVERSE-02 (reverse/fullback): session-log を L3 要件へ back-fill — 実装事実から FR-07 拡張 + AC 復元"
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
    slot_label: "TL — as-is 設計復元 / routing 確定のレビュー"
  - role: po
    slot_label: "PO — R3 intent (要件 back-fill の妥当性) 検証 (§1.8 R3 必須)"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-01-session-log.md
  blocks: []
---

# PLAN-REVERSE-02 (reverse/fullback): session-log を L3 要件へ back-fill

## §0 位置づけ

Add-feature 標準ライフサイクル 経路 B (add-feature.md §1.1) の **収束段**。`PLAN-L6-03` (add-design L6) + `PLAN-L7-01` (add-impl L7) で **bottom-up build** した session-log の **L3 要件 (FR+AC) が空いている**ため、Reverse fullback で実装事実から L3 を back-fill し V-model 左腕の孤児化を解消する。`forward_routing=L3` / `promotion_strategy=reuse-as-is` (実装済を as-is で要件化)。

## §1 R0-R4 (fullback)

| phase | 作業 | 結果 |
|-------|------|------|
| R0 evidence | 実装事実を収集: `src/runtime/session-log.ts` (8 関数 + fail-open) / `.claude/hooks/session-log.ts` / settings.json 3 hook / `tests/session-log.test.ts` U-SLOG-001〜005 | evidence = 実装 + 78 pass |
| R1 (skip) | fullback は R1 観測契約を skip しない規定だが、本件は内部観測 hook で外部 API/DB 契約なし → 観測対象は hook I/F のみ (session-log.md §3) | observed = hook I/F |
| R2 as-is | 既存 FR-L1-07 (state 自動登録 5 hook, **fail-close**) に対し、session-log は **fail-open の観測 hook + PLAN 単位ダイジェスト**で別系統。as-is = FR-07 の未カバー facet | as-is 確定 |
| R3 intent (po 検証) | session-log は新規 top-level 要件でなく **FR-L1-07 (hook 自動登録) の観測 facet + FR-L1-19 (audit/learning) への入力**。よって新 FR は起こさず FR-07 を拡張 + AC 追加が intent | **R3 PASS (2026-06-04、PO 委譲「全リバースの検証・実行で完全クローズ」+ intra_runtime_subagent + 客観 evidence)**: (a) 新 FR 不要 = `tests/fr-registry-audit.test.ts` 9 pass で FR drift なしを確認 (REVERSE-03/04/05 と同方針) / (b) back-fill 実在 = L1 functional-requirements.md に session-log ※extended / L3 に AC-FR-07-04 が存在 / (c) requires に L7-01-session-log を追加し pairing 完全性 (doctor backfill 孤児 0) を充足。R3 intent 充足、クローズ |
| R4 gap/routing | `forward_routing=L3`: L1 FR-L1-07 に `※ extended` 追記 + L3 FR-07 振る舞い拡張 + **AC-FR-07-04 (fail-open + digest)** 追加。`reuse-as-is` (実装変更なし) | back-fill 完了 |

## §2 back-fill 内容 (新規 FR を起こさない = fr-registry-audit 46 件不変)

- **L1 FR-L1-07** (`docs/design/harness/L1-requirements/functional-requirements.md`): 機能要求セルに「session-log hook (SessionStart/PostToolUse/Stop) が session イベントを fail-open で記録し PLAN 単位ダイジェストへ圧縮 → handover/audit/FR-L1-19 接続。state 自動登録 (fail-close) と別系統」を `※ extended` 追記。
- **L3 FR-07** (`docs/design/harness/L3-functional/functional-requirements.md`): 振る舞いに session-log (fail-open 観測 + per-PLAN digest) を追記 + **AC-FR-07-04 (fail-open: ログ失敗で作業を止めない / digest idempotent)** を追加 (L3↔L12 pair の AC)。

> **なぜ新 FR でないか**: session-log は「hook によるイベント自動捕捉」= FR-L1-07 の領域。fail-open 観測 + digest は FR-07 の新 facet + FR-L1-19 への入力であり、独立 top-level 要件ではない。新 FR を起こすと件数確定 (46) と fr-registry-audit を崩すため、living FR registry の back-merge 原則 (§1.10.G.10) に従い拡張で吸収。

## §工程表

### Step R4-1: L1 FR-L1-07 拡張追記
### Step R4-2: L3 FR-07 振る舞い + AC-FR-07-04 追加
### Step R-review: self-review 前置 (MUST)
`code-reviewer` で back-fill の妥当性 (FR-07 拡張で十分か / AC が impl と一致か) をレビュー。po (R3) intent 検証は escalation。
### Step R4-3: fr-registry-audit + 全回帰
`npx vitest run` (46 件不変 + 78 pass 維持)。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| as-is 実装事実 | `src/runtime/session-log.ts` / `tests/session-log.test.ts` (R0 evidence) |
| FR-07 拡張 vs 新 FR の判断 | FR-L1-07 (hook 自動登録) / FR-L1-19 (audit/learning) の scope + fr-registry-audit 46 件制約 |
| AC-FR-07-04 oracle | session-log.md §6 fail-open + §4 idempotent (U-SLOG-002/003) |

## §3 成否

- L1 FR-L1-07 拡張 + L3 FR-07 + AC-FR-07-04 が追記され、session-log 実装が L3 要件に trace 可能 (左腕孤児解消)
- **fr-registry-audit 46 件不変** + 全回帰 78 pass
- code-reviewer self-review APPROVE
- po (R3) が要件 back-fill 妥当性を確認 (escalation)。**R3 議題**: (a) FR-07 拡張 vs 新 FR の判断、(b) L1 FR-L1-07 拡張が L1↔L14 pair freeze 再要否、(c) AC-FR-07-04 ↔ L12 受入テスト設計の接続 (孤児 AC なきこと) — self-review (code-reviewer GO-with-fixes) で I-1/I-2/m-1 は AC 文言に反映済
- これで Add-feature 経路 B (L6→L7→Reverse→L3) の 1 サイクルが session-log で完結 (dogfood 実証)
