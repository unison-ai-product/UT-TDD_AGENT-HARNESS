---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_gate_run_projection_row_validation
pair_artifact: docs/test-design/harness/L7-gate-run-projection-row-validation-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1490
---

> **L6 contract marker**: `loadGateRunCoverageStats` が `reconcile` で得た計画を `applyReconciliation` へ適用するとき、`gate_runs` / `workflow_runs` に追加する行の保存前検査を定める。oracle `CANDIDATE-U-GPRV-001`〜`002` は対になる L7 に置く。

# Gate-run 投影行の保存前検査 (Issue #1490)

## 1. 位置付け

本書は `loadGateRunCoverageStats` の `reconcile` が照合計画を作り、`applyReconciliation` がその計画を SQLite に適用するときの、追加行に対する secret-like 値検査を定める。計画、既存行との突合、削除、transaction rollback は既存の `function-spec.md` の gate-run coverage 契約に従う。対になる検証正本は `docs/test-design/harness/L7-gate-run-projection-row-validation-test-design.md` である。

## 2. 契約

照合 transaction 内で `insertGateRun` または `insertRoutineGate` が行を追加する前に、INSERT に渡す全列名と値を `SqliteProjectionStore` の行検査と同一の検査へ通す。raw `INSERT` は維持する。検査は投影 writer の `recordProjectionEvent` 経由へ書き換えず、照合専用の別判定も作らない。

| 書き込み先 | 検査する全列 | 入力の由来 |
| --- | --- | --- |
| `gate_runs` | `gate_run_id`, `gate_id`, `plan_id`, `status`, `checked_at`, `evidence_path` | 合成された期待行の値。通常の証跡では JSON 証跡から投影された値と証跡パスを含む。 |
| `workflow_runs` | `workflow_run_id`, `plan_id`, `drive_run_id`, `workflow`, `phase`, `ready_status`, `blocked_reason`, `human_required`, `checked_at` | 対応する routine-gate 期待行の値。gate の ID・状態・時刻、照合対象の PLAN から合成される。 |

JSON 証跡から上記の列へ取り込んだ文字列は検査対象である。テーブル列へ保存しない証跡 payload はこの行検査の対象外であり、既存の証跡入力検証の責務を変えない。正常なリポジトリ相対 `evidence_path` などの通常値は誤拒否しない。

行検査が拒否した場合、その INSERT は行わず、既存の投影再構築・照合と同じ transaction 境界へ失敗を伝える。同一 transaction 中に先行して行った追加・削除・再構築はすべて rollback され、開始時の DB 状態を保つ。行検査の診断は拒否した値や秘密値を含めない。

通常値は従来どおり保存でき、主キー重複は通常の `INSERT` 制約違反として拒否する。transaction 外での部分保存、upsert による重複の上書き、検査失敗後の継続は認めない。
