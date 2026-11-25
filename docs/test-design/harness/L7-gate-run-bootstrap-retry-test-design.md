---
title: "L7 gate run bootstrap retry test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/gate-run-bootstrap-retry.md
status: confirmed
updated: 2026-11-20
issue: 1490
---

# Gate run の初回投影と再試行のテスト設計 (Issue #1490)

上位契約は `docs/design/harness/L6-function-design/gate-run-bootstrap-retry.md`。独立した一時リポジトリの合成証跡と SQLite を使い、`checkGateRunCoverage` で利用時と同じ入口を通す。正常初回の対照は、再試行側と同じ最終入力を持つ別の一時リポジトリで作る。比較には、時刻や一時 path に依存しない gate/workflow の識別と、合成した設計文書に由来する投影の識別を使う。

| ID | 入力と期待 | 検出する反例 |
| --- | --- | --- |
| `U-GRBOOT-001` | DB が無い状態で無効な初回証跡を検査する。失敗理由が残り、schema と投影が未初期化の論理状態へ戻る。DB ファイルが残る場合も状態を検査する。 | schema だけを先に commit する。rollback 後の集計失敗で診断を失う。 |
| `U-GRBOOT-002` | 001 の失敗後に証跡を正し、同じ DB で再試行。正常初回の対照と、対象 gate/workflow 行と設計文書の投影が一致する。 | DB ファイルの存在で再構築を飛ばし、gate/workflow 行だけを足して成功する。 |
| `U-GRBOOT-003` | 現行 schema のみで全表が空の、旧挙動相当の DB に正常入力を与える。002 と同じ対照に一致する。 | version が最新の schema-only DB を初期化済みとみなす。 |
| `U-GRBOOT-004` | gate 行が 0 で他の既存行がある DB に対し、不一致を起こす入力と正しい入力をそれぞれ試す。不一致で既存行は保持され、正しい入力では通常の照合が進む。 | gate 行だけの空判定で非空 DB を全再構築する。 |

001〜003 の Red と 004 の通常テストは、正式 ID へ昇格した。Green は後続の段で行う。

## 準備 hook の実行上限 (#1956)

準備 hook は独立した一時リポジトリ5個を作り、`checkGateRunCoverage` を7回実行する。#1949 の Windows 3/3 は10秒の既定上限で止まり、既存の5テストは未実行でファイル全体は12.536秒だった。同じ head の再実行は5件すべて成功し、ファイル全体は7.896秒だった。main の `4100b69d` と #1958 の Windows 3/3 でも、同じ準備 hook が10秒上限に達した。

この準備 hook は既存の `heavyBeforeAll("db", ...)` を使う。上限は SQLite の準備に使う共有値180,000ミリ秒で、既存の `[hook-timing]` 形式で所要時間を出す。対象は `gate-run-bootstrap-retry.test.ts` の準備 hook 1個とする。

| ID | 刺激 | 期待結果 |
| --- | --- | --- |
| `U-GRBOOT-005` | TypeScript AST で `gate-run bootstrap retry oracles` の準備 hook の登録を読む | 登録は `heavyBeforeAll`、種別は `db`、共有の上限は180,000ミリ秒 |

Red は現行の `beforeAll` 登録で比較が失敗する。構文と対象の一意性はテストの比較より前に確かめる。Green では同じ比較、既存の5テスト、準備 hook の `[hook-timing]` 行を確かめる。

- [同じ head で10秒上限を超えた試行](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/45533194323/attempts/4)
- [同じ head で5件が成功した試行](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/45533194323/attempts/5)
- [main で10秒上限を超えた Windows 3/3](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/45542894160/job/138965427474)
- [#1958 の Windows 3/3 での再現](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/45546111457/job/138986758356)
