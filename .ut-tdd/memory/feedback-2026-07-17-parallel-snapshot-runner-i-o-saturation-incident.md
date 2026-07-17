---
memory_id: memory:feedback:2026-07-17-parallel-snapshot-runner-i-o-saturation-incident
kind: feedback
title: "2026-07-17 parallel snapshot runner I/O saturation incident"
tags: ["hybrid", "incident", "io-saturation", "snapshot-runner", "subagent", "vitest"]
updated_at: 2026-07-17T05:11:59.892Z
---

2026-07-17、Execution LedgerのPR前クロスレビュー是正を3サブエージェントへ並列委譲した際、各レーンへtargeted snapshot test実行を許可したためCodex側で3本のrun-vitest-snapshot.tsが同時起動し、Claude側の1本と重なって最大4本が並列になった。各runnerがHEAD clone、db rebuild、約9,000ファイルのfingerprintを行い、PowerShell/git/tscの応答が数十秒から数分遅延した。データ消失、履歴破壊、作業tree破損は確認されていない。さらにdomain/sqliteレーンは変更commit前にrunnerを起動したため、HEAD clone方式上そのGreen結果は変更を含まず無効だった。恒久対策: サブエージェントは実装と軽量typecheckまで、snapshot runnerの起動権はroot 1レーンへ集約する。起動前にrun-vitest-snapshot.tsプロセスを確認し、他runtimeを含め1本でも動作中なら追加起動しない。全レーンの明示path commit完了後、rootが統合HEADに対して必要testを1本に束ねて実行する。commit前snapshot結果を証拠として採用しない。
