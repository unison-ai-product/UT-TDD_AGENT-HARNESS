---
title: "L7 project-scoped Memory root test design"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-512-project-scoped-memory-root
updated: 2026-09-08
---

# Project-scoped Memory root test design

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-PMEMROOT-001 | linked worktreeからroot解決 | primary corpusとproject busが一致 |
| CANDIDATE-U-PMEMROOT-002 | current/primary identity drift | typed deny、read/write 0 |
| CANDIDATE-U-PMEMROOT-003 | identity欠落・不正common-dir | typed deny |
| CANDIDATE-U-PMEMROOT-004 | 異project identity | namespace不一致 |
| CANDIDATE-U-PMEMROOT-005 | 同一ID・同一digest複製 | 一件canonical、残りdedupe |
| CANDIDATE-U-PMEMROOT-006 | 同一ID・異digest | 上書き0、全variant quarantine |
| U-PMEMROOT-007 | publisherがcreate-exclusiveに保存したbinding sidecarを権威としてproduction consumerへ接続し、envelopeが束縛する project / memory_id / operation_id / producer provider・session / target provider・session を、それぞれ独立に変異させる。さらにdigest・entry ID・filenameを一貫して再計算したcoherent spoofを試す | 各semantic変異とcoherent spoofでtyped deny、read/claim/write 0、inbox entryとbinding sidecarを保持。terminal claim後だけsidecarをcleanup |
| CANDIDATE-U-PMEMROOT-008 | symlink/junction/8.3 root escape | typed deny |
| CANDIDATE-U-PMEMROOT-009 | linked worktreeからDB rebuild／Memory projectionを実行し、current worktreeだけにlegacy corpusを置く | projection readerもprimary canonical corpusだけを読み、legacy fallback 0。current/primaryを入れ替えてもidentity集合とdigestが一致 |
| CANDIDATE-P-PMEMROOT-001 | mainとlinked worktree間のMemory/Claude通知 | 同一corpus/busを観測 |
| CANDIDATE-P-PMEMROOT-002 | Packだけでsetup後にCodex/Claudeを起動 | source/Pack checkout参照0でparity成立 |
| CANDIDATE-P-PMEMROOT-003 | 同名Memoryを持つ別projectを並行起動 | cross-project read/claim 0 |
| CANDIDATE-P-PMEMROOT-004 | 全linked worktreeに同一ID・異digestを配置してmigration | canonical write 0、全variant quarantine、completion replay一致 |
| CANDIDATE-P-PMEMROOT-005 | worker-only memoryのapply中断・source drift・完了後改ざん後に次回起動する | rollback/recovery、次回起動の未完了fence 0、現物digest不一致をtyped deny |

正式oracle IDへの昇格は、対象実装とRed実測を同一commitへ束縛し、Reverse R1で行う。

## Slice 3 exact implementation evidence (Issue #528)

- 実装anchor: `89de38593e0a5264480ed5b305c1718bdc3b89b6`
- worker: `gpt-5.6-luna`, effort: `high`
- 対象: `src/runtime/claude-provider-envelope.ts` のv4 schema/digest/consumer guard、
  `src/runtime/claude-memory-wake.ts` のpublisher-owned create-exclusive binding sidecar、
  Memory/reviewのproduction composition。
- Red→Green: 期待値をhook引数から注入しない旧compositionではv4を正当にconsumeできず、
  sidecar authorityも無かった。Greenではpublisherがentry-bound sidecarを作成し、consumerが
  独立に再検証するため、各semantic axis変異、coherent envelope/id/filename spoof、legacy
  entryをtyped fail-closeできる。実測は以下の検収記録へ束縛する。
- production composition: `tests/runtime-hook-entrypoints.test.ts` の
  `U-MEMWAKE-007: CLI hook delivers` は未知の期待値hook引数を渡さず、live sessionを起動後、
  `memory add --notify-claude` →実hook consumeを通し、delivery成立とterminal cleanupを確認する。
- legacy root migration/quarantine、Pack parity、R2以降は未完了であり、この証跡では主張しない。
  Opus non-author closing reviewは保留。

### 検収実測（2026-09-08）

- Green anchor: `175eff8b06a2817a733d0e9b9c5a06b46f5ef373`。
  `node scripts/run-vitest-snapshot.ts tests/claude-memory-wake.test.ts tests/claude-memory-terminal-gc.test.ts tests/runtime-hook-entrypoints.test.ts -t "PMEMROOT-007|U-RVATT-025|U-MEMTERM-001|U-MEMTERM-003|U-MEMWAKE-001補遺|U-MEMWAKE-007: CLI hook delivers" --pool=forks --reporter=dot`
  は3ファイル、9 passed / 37 skipped、workspace fenceを含む終了コード0。
  各identity軸は単なるmismatch包含ではなく、軸別typed reasonの完全一致を検査する。
- Red mutation: `0bd363b39c73f117a32788749c1b1bf3e080b36f`を基点とした隔離検証で、
  `waitForClaudeMemory`の`validateProviderBinding(...)`呼出を`{ ok: true }`へ置換。
  `U-PMEMROOT-007: provider envelope rejects each binding axis independently`は
  `project_id: expected "denied", received "delivered"`で1 failed / 30 skipped、終了コード1。
  mutation commitは`88c6929da2e17c7c5c6a3ad66027a2d4042818a6`（検証用、出荷しない）。
  検証ログSHA-256は`7be3b0eee161fda4aedc75b2388afbbbb248c098a4aa6d8a8bced1a83022d09e`。
  これはproduction binding guardの迂回を検出する証明であり、全個別guardを除去したmutation実測とは主張しない。
- 先行する`0bd363b3`の実行はtest本体1件が成功したがworkspace fenceが失敗したため、
  Green証跡から除外した。上記`175eff8b`で検証を取り直している。
- 型検査、変更対象Biome、`git diff --check`、PLAN admissionはroot検収で成功。
  Linux/Windows/aggregate CIと非著者closing reviewはPRで取得する。
