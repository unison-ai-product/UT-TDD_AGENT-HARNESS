---
title: "L7 gate-run coverage stat retirement test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/gate-run-coverage-stat-retirement.md
status: confirmed
updated: 2026-11-24
issue: 1490
---

# Gate-run coverage の未使用集計値の退役テスト設計 (Issue #1490)

上位契約は `docs/design/harness/L6-function-design/gate-run-coverage-stat-retirement.md`。実際の `loadGateRunCoverageStats` と `checkGateRunCoverage` を、合成証跡と隔離した SQLite DB に対して実行する。

| ID | 入力と期待 | 検出する反例 |
| --- | --- | --- |
| `U-GRCOV-001` | 成功、初期化済み DB の分類済み不一致、未初期化 DB の分類済み不一致で、内部集計のキーが L6 の5項目と一致する。初期化済みのケースでは gate と workflow の全件集計が行われ、空 PLAN 専用の filtered `COUNT` は0回。未初期化からの rollback 後は0件と元の不一致理由を返す。 | 型だけから項目を削り、実際の返り値または SQL 集計が残る。全件集計や初回 rollback 後の不一致理由が消える。 |
| `U-GRCOV-002` | `U-DOCTOR-GATE-01` の合成入力を基に、PLAN `NULL` と空文字を受理し、対応欠落と不正証跡を従来の `ok` と messages で検出することを確認する。不一致後の DB は実行前の投影と一致する。 | 集計の退役が、受理範囲、失敗理由、または rollback 後の投影を変える。 |
| `U-GRCOV-003` | TypeScript の構文木から `src/lint/gate-run-coverage.ts` の `GateRunCoverageViolation.reason` を特定し、union の文字列リテラルに `blank_plan_gate_run` が含まれないことを検証する。宣言と `reason` を取得できることを通常テストで確かめる。 | 実行時の結果が同じまま、型宣言に退役対象の member が残る。 |

SQL の観測には、テスト側から実際の接続に処理を委譲する観測器を使う。`U-DOCTOR-GATE-01` の受理・拒否・再投影の fixture を候補の対照に使う。表の3件は Red で登録した oracle を正式 ID に昇格したもの。
