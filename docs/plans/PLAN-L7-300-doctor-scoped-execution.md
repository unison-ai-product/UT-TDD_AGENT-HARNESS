---
plan_id: PLAN-L7-300-doctor-scoped-execution
title: "PLAN-L7-300 (impl): doctor 実行性能 v2 — 一括 load 注入 + per-check 計時 + --scope 増分実行"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/internal-processing.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期の判断 (Codex doctor 分割完了が前提)"
  - role: tl
    slot_label: "TL - check 間 I/O 共有の設計レビュー (結果不変の保証)"
  - role: se
    slot_label: "SE - 一括 load 注入 / 計時 / --scope 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-300-doctor-scoped-execution.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-276-doctor-check-collection.md
    - docs/plans/PLAN-L7-283-doctor-process-quality-extraction.md
---

# PLAN-L7-300 (impl): doctor 実行性能 v2

## Status

**version-up parked (v2)**。A-181 CE-2/CE-5/CE-6。活性化前提 = Codex の doctor 構造分割 (PLAN-L7-276/283 系) 完了後 (分割中に手を入れると conflict する)。

## 背景 (実測 2026-07-03)

- doctor 全走 63〜87 秒 (`[Diagnostics.Stopwatch]` + `bun src/cli.ts doctor` 実測)。開発ループ 1 回に約 1 分課金。
- 原因 1 (CE-6): `src/doctor/index.ts` の check 群 (`checkPlanGovernance` / `checkImplPlanTrace` / `checkOracleTestTrace` / `checkForwardConvergence` / `checkGreenCommandDigests` ほか) が `loadReviewPlans` / `loadConvergenceDocs` を各自呼び、docs/plans/ 483 本を 6〜8 回再 parse している。
- 原因 2 (CE-5): `src/lint/green-command-digest.ts` が毎回全 PLAN × 全 evidence_path の sha256 を再計算 (キャッシュなし)。
- 原因 3: per-check の実行時間が計測されておらず、どの check が重いか実測で語れない (性能主張の claim discipline 違反状態)。

## スコープ (1 要件: doctor の実行時間を結果不変のまま削減し、以後の劣化を計測で検出可能にする)

1. **per-check 計時**: `src/doctor/result.ts` の check 結果型に `duration_ms` を追加し、`runDoctor` が各 check を計時。`ut-tdd doctor --timing` で上位 N を表示。**最初に実装する** (以降の高速化が実測で主張できるようになる)。
2. **一括 load 注入**: `runDoctor` 冒頭で plans (`loadReviewPlans` 相当) を 1 回だけ load し、check 関数へ引数注入する。I/O 注入パターンは既存 `DoctorDeps` を拡張。**check の判定結果は一切変えない** (behavior-invariant、regression fence = 既存 doctor テスト全 green + 変更前後の doctor 出力 diff ゼロ)。
3. **digest 増分化**: green-command-digest に evidence_path の (size, mtime) → sha256 キャッシュ (`.ut-tdd/cache/digest-cache.json`) を導入。cache miss 時のみ再計算。cache は破棄可能な高速化専用 (整合性の正本は再計算)。
4. **--scope changed**: `ut-tdd doctor --scope changed` で、`git diff --name-only HEAD` の変更ファイルに関係する check のみ実行 (関係表は check 側が宣言する `watches: string[]` glob)。既定 (`--scope full`) は従来どおり全走。CI は full のまま。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | per-check 計時 + `--timing` 実装、現状プロファイルを A-18x へ記録 | 直列 |
| 2 | 一括 load 注入 (behavior-invariant、出力 diff ゼロを test 固定) | 直列 |
| 3 | digest 増分キャッシュ | Step 2 と並列 |
| 4 | `--scope changed` + check の watches 宣言 | 直列 |
| 5 | regression test + 実測再計測 (目標: full ≤30s、scoped ≤10s) | 直列 |

## DoD

- [ ] `ut-tdd doctor --timing` が per-check duration_ms を出力する (test 固定)
- [ ] 一括 load 化の前後で doctor の全 check 出力が一致する (fixture repo での snapshot test)
- [ ] digest キャッシュ有効時と無効時で mismatch 判定が一致する (test 固定)
- [ ] `--scope changed` が無関係 check をスキップし、`--scope full` が従来全走する (test 固定)
- [ ] 実測: full 実行が基線 63-87s から短縮されている (計測コマンドと数値を review_evidence に記録。目標 ≤30s は努力値であり DoD は「短縮の実測」)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/doctor/index.ts` (runDoctor / collectDoctorChecks)、`src/doctor/result.ts`、`src/lint/green-command-digest.ts`、`src/cli.ts` (doctor オプション)。Codex 分割後はファイル配置が変わっている可能性が高い — 着手時に `Grep "runDoctor"` で現物を再特定すること。
- 並列化 (Promise.all) はスコープ外。check 間の暗黙の実行順依存が未調査のため、まず計時→共有 load→scoped の順で安全に削る。並列化は本 PLAN の実測結果を見て別起票。
- doctor は未コミット tree を読む仕様 (意図的)。--scope の基準は HEAD diff とし、仕様変更しない。
