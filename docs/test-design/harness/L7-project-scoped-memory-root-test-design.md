---
title: "L7 project-scoped Memory root test design"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-512-project-scoped-memory-root
updated: 2026-09-11
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

## 同一 checkout の identity 読取 (Issue #1938)

| 候補 ID | 刺激と観測 |
|---|---|
| CANDIDATE-U-PMEMROOT-010 | 同じ実パスを返す root 解決で identity loader の引数と回数を記録し、成功時に1回と同じ project namespace / corpus / bus を確認する。直後の解決で loader を欠落に変え、再度1回呼ばれて `project_identity_unavailable` になることを確認する。Red は最初の重複読取を検出する。 |
| CANDIDATE-U-PMEMROOT-011 | 実パスが異なる linked worktree と canonical root に検証済みの同一 ID、異なる ID、片側欠落を順に与える。各解決は両パスを1回ずつ読み、成功、`project_identity_drift`、`project_identity_unavailable` を返す。既存の実 Git、origin 不一致、パス逸脱の回帰も実行する。 |
| CANDIDATE-P-PMEMROOT-006 | identity を commit した通常 checkout から実 `session start` action を実行する。隔離 consumer と固定した PR 応答を用い、Git と gh の起動を分類し、各 Memory root 解決で Git topology と HEAD identity loader に由来する起動を別に数える。既存の解決境界ごとの topology と loader の初回読取を観測し、各境界で同じ実パスを二度読む起動が消えることを比較する。gh の呼び出し数、同じ session ID の event と digest、終了状態が比較前後で一致することを確認する。 |

診断では、同じ consumer と計測条件で従来版・修正版を比較する。対象の source / bundle /
設定と Node プロセス数を記録し、各 Memory root 解決の回数、Git と gh の起動数、hook 全体の
実行時間を報告する。Node 20 本以上の負荷時に約10秒を目標とし、30秒までの余裕を確認する。
診断は、公開した修正版を VS Code の Claude 拡張から実起動する
[AT-835-008](L7-session-start-order-test-design.md) の cold 1回・warm 2回とは別に記録する。
同じ consumer・負荷で canary.8 の一つ前の配布版も1回測り、従来からの遅延と canary.8 で増えた
遅延を切り分ける。AT-DIST-003 の016〜019については、各ケースが SessionStart の出力を受入
条件に使うか、個別の証拠を確認する。

## Slice 4 oracle の撤回 (Issue #424 PR-1)

Slice 4a inventory oracle (inventory 系 8 件、prefix `U-PMEMINV`、Issue #544) と Slice 4b quarantine / recovery oracle
(quarantine 系 5 件、prefix `U-PMEMQUAR`、Issue #545) は、`PLAN-L6-104-memory-clean-cut-replacement` §5 PR-1 により
宣言を撤回した。唯一の citation 元 `tests/project-memory-migration.test.ts` と対象実装
`src/runtime/project-memory-migration.ts` は同じ PR で削除済みであり、baseline へは退避しない。
migration を伴わない置換後の non-read 保証は `L7-memory-clean-cut-replacement-test-design.md` が所有する。

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
