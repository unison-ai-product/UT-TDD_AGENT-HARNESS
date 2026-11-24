---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_gate_run_bootstrap_retry
pair_artifact: docs/test-design/harness/L7-gate-run-bootstrap-retry-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1490
---

> **L6 contract marker**: `loadGateRunCoverageStats(repoRoot) => GateRunCoverageStats` の初回投影と再試行を定める。正式 oracle `U-GRBOOT-001`〜`004` は対応する L7 が固定する。

# Gate run の初回投影と再試行 (Issue #1490)

## 1. 観測した欠落

main `5f7fab54` の合成 fixture では、初回の無効な gate 証跡が拒否された後に version 31 の schema-only DB が残った。同じ DB で証跡を修正して再試行すると `gate-run-coverage` は成功し、gate と workflow が各 1 行入った。正常な初回実行の対照に比べて、`artifact_registry` (0 対 81)、`coverage` (0 対 8) を含む 24 表の投影が欠けた。再実行の判定が DB ファイルの存在だけに依存し、初回の全投影が省略されたためである。

## 2. 判定とトランザクション

| 条件 | 契約 |
| --- | --- |
| Pre | 対象リポジトリの DB を通常の状態 DB 境界から開き、既存の `BEGIN IMMEDIATE` を取得する。 |
| Post | 初回投影の対象では、schema 適用・全投影・実在証跡との照合を同じトランザクションで完了する。失敗時は DB を呼び出し前の論理状態へ戻し、失敗の理由を返す。 |
| Invariant | 投影と照合の成功前に完了状態を commit しない。DB ファイルを削除しない。既存データを持つ DB に対して、再試行を理由に全投影の再構築を起動しない。 |

初回投影は、DB ファイルが新規の場合を含む未初期化の DB、または旧挙動が残した schema-only DB を対象とする。未初期化は `user_version` が 0 で application table が無い状態とする。schema-only は現行の既知の schema が揃い、registry が定義する全表に行が無い状態とする。状態判定は書き込みトランザクションの中で行う。schema-only の判定には各表の行の有無だけを使い、既存の行を1件確認した時点で通常の照合へ進む。

初回投影では `rebuildHarnessDb` の既存の migration と全投影を、照合の外側のトランザクションに含める。初回の失敗後にファイルだけが残っても、空の schema 状態から再試行できる。rollback 後に集計表が無い場合は件数を 0 として元の失敗理由を報告する。空でない DB に対する追加・削除・不一致の扱いは `function-spec.md` の gate-run-coverage 契約に従う。旧版の非空 DB のアップグレードは #1490 の別項目で扱う。
