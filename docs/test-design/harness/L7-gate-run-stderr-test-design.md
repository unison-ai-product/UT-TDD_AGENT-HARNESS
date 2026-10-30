---
title: "L7 gate-run 証跡保存失敗時の警告境界テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/gate-run-evidence-warning.md
updated: 2026-10-30
issue: 1359
---

# gate run evidence warning テスト設計 (Issue #1359)

対になる設計文書は `docs/design/harness/L6-function-design/gate-run-evidence-warning.md` である。
本書は証跡永続化失敗時の human-readable CLI 出力境界のみを扱う。gate 判定と証跡の保存・識別規則は `docs/design/harness/L6-function-design/function-spec.md` §2.2 を参照する。

| U-ID | 対象関数 | DbC oracle |
|---|---|---|
| U-GATE-011 | `ut-tdd gate G0.5` human-readable output / `writeGateRunEvidence` failure | **fixture 前提:** 一時 cwd を分離し、`.ut-tdd` を通常ファイル (directory ではない) にして gate 評価は実行可能なまま `.ut-tdd/gate_runs` の証跡永続化を確実に失敗させる。`--json` なしで `gate G0.5 --mode standalone --review-kind human --human-approved` を実行する。**意図する negative oracle:** 永続化 warning の stderr 出力と stdout 非混入を独立して確かめる。stdout には通常の `gate G0.5: passed` summary が残り、永続化失敗は gate verdict / exit code を変えない (passed / exit 0)。 |
