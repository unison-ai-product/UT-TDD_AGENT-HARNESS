---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: draft
plan_id: PLAN-L7-835-windows-sessionstart-contract
github_issue_id: 835
parent_doc: docs/plans/PLAN-L7-835-windows-sessionstart-contract.md
---

# L7 SessionStart order test design — Issue #835 candidate

> Proposal only / 2026-10-06. This file is a draft candidate for
> `docs/test-design/harness/L7-session-start-order-test-design.md`; it is not a
> frozen pair or evidence that any oracle passed. Keep all IDs `CANDIDATE-` until
> pair review/freeze.

## Scope and source contract

対象は外部consumerが実行する正規 `session start` actionの順序だけ。

```text
stdin/session identity → requireRuntimeRepoRoot → requireProjectMemoryRoot
  (既存HEAD identity/admission) → dispatch/onSessionStart append attempt
  → current side-effects → CLI completion
```

「先行」はauthority/admission後かつ非authority/heavy side-effects前である。未commit/未検証
identityへwriteしてはならない。既存fail-openとappend試行は維持し、event durable性は実配布受入で
別に検証する。正規admissionはGit/object/worktreeを検査するためcheapと仮定しない。
このpairは新module/CLI/per-step budget/defer/restart機構を要求しない。materialize/scan律速と実測されたときのみ、controlが採択した既存Stop detached patternの再利用候補を許す。

## Seven unit/integration oracles and one acceptance oracle

| Candidate oracle | 実行・mutation | RED / attack | Green観測 |
|---|---|---|---|
| CANDIDATE-U-835-001 — production順序 | 実 `node src/cli.ts session start` actionを有効なorigin-bound committed identityのfixtureで呼ぶ。既存CLI module内のfault injectionでside-effect入口を停止/失敗させ、session JSONLをcallback入口から読む | side-effectsがdispatchより先でevent不在、テストhelperだけが順序を通す、またはfaultを成功扱い | 正規admission後、side-effect callback到達時点にexact sessionの `session_start` 行が既にdurable。CLIの実command routeで観測しgrep-onlyを使わない |
| CANDIDATE-U-835-002 — authority negative | `U-RCDEV-005`と同型のHEAD-uncommitted identity fixtureでCLIを呼ぶ | identity拒否前のevent/JSONL/他session-state write、または `requireRuntimeRepoRoot`だけをauthorityにする | 既存 `requireProjectMemoryRoot` がeventより前に拒否し、既存recovery diagnosticを保ち、session eventなし。未検証identityをORDER Greenに使わない |
| CANDIDATE-U-835-003 — production seam order | 実CLI actionが使用する同一内部dispatch/side-effect call seamを注入し、callback entryで `nodeDeps` 対象JSONLを読む。public CLI/new moduleは増やさない | callback entry時にeventが未作成/不完全、別ID/plan | `onSessionStart`の同期append完了後にside-effect入口へ到達したことをファイル観測で証明 |
| CANDIDATE-U-835-004 — delayed side-effect durability | CANDIDATE-U-835-003 callbackでentry観測後、明示test barrier中に待ち、解放後も同一JSONLを再読 | callback待機中にeventが欠落/消失 | eventはentry/待機中/解放後に同じIDで残る。delay中の耐久性のみで、hook timeout内完了は主張しない |
| CANDIDATE-U-835-005 — error vs event persistence | valid identityでcallback内からevent確認後にthrow。append failureとは別caseにする | error後のrollback/deletion、throwの成功扱い、authority前write | callback throwはerrorとして区別され、先行したdurable eventは残る。既存 `onSessionStart` fail-openのappend-I/O faultは0を返す既存契約のまま |
| CANDIDATE-U-835-006 — exact identity/plan | 実hook inputの `session_id` と事前配置current-planを指定し、保存JSONLをparse。fallback branchは使わないfixtureも含める | default/fallback ID、別session path、異なるplan | event.session_idとinputが完全一致し、plan_idがevent時点のcurrent-plan。payload/schemaは既存所有のまま |
| CANDIDATE-U-835-007 — current session / prior behavior | current log無し＋別session dangling eventをfixtureへ準備し、実CLI起動後にforced-stop結果、digestを既存handlerで確認 | current session自身をforced_stop、他session検出消失、または`session_start` digestの重複/欠落 | current IDはforced-stop対象外でprior dangling sessionは維持。既存Stop digestはstartを1件だけ集約。`PLAN-L7-422`欠落可視化を再実装しない |
| CANDIDATE-AT-835-008 — 実配布計測/完走受入 | [control comment 6010925970](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418#issuecomment-6010925970)に従い、clean Windows consumerでcold/warm各5 run以上行う。全runでphase別msを計測: wrapper/CLI起動、identity admission、materializeSkillAssets、scanDanglingStops+sweepStaleGuardSlots、attemptEscalationBlock、surfaceSessionStartDigestToStdout、event dispatch、whole-hook。performance.now()の同一process差分で測り、phase合計とwhole-hook残差も記録する。各runを実Pack/bundle/Node/Claude/VS Code/settings argv/configured timeout/session ID/phase record/event/digest/process exit/cancelへ束縛し、cold/warm条件を記す。instrumentしたbundleはdiagnostic artifactとして正規sealed bundleと区別し、sealed consumer bundleを手書換え/guard無効化しない。 | phase/whole時間欠落、別ID/argv、sealed bundle手編集/guard無効化、律速根拠と選択分岐不一致、event-firstだけで完了扱い、いずれかの受入runでtimeout超過/cancel/exit≠0/event欠落/digest欠落 | n>=5 cold+n>=5 warmのphase計測全件と方式選択を保存。materialize/scanが律速なら既存Stop detached patternを再利用してhook外へ出し5s維持するが、`spawnDetachedStopRefresh`は現行DB refresh専用で直接呼ぶだけでは責務移管にならない。entrypoint/ownership/競合/完了責務をレビューする。digestが律速ならnearest-rank p95×2をmsから秒へround-upしてPack timeoutへ反映し、15s固定をしない。いずれも正規Packのconfigured settings/argvでcold/warm各5件以上の**全run**がtimeout内exit0・cancelなし、同一IDのdurable `session_start`とdigest出力を満たす。現在の5s失敗を歴史保持。mock/diagnostic bundle/別ID/手書きmarker不許可。PLAN-L7-531所有のAT-DIST-003へ結果接合。 |

## Existing ownership / pairing

- U-SLOG-005はappendとfail-open、`tests/runtime-hook-entrypoints.test.ts`は既存CLI lifecycleとdigestを担う。今回の差分はproduction actionのside-effect境界より前後を観測する追加pairであり、既存testを置換しない。
- Identity authorityは `requireProjectMemoryRoot` → `resolveProjectMemoryRoot` → `loadProjectIdentityFromHead`。`requireRuntimeRepoRoot`はroot resolutionであってHEAD identity receiptの代替でない。
- `PLAN-L7-531` owns actual Pack/AT-DIST-003 consumer path. `PLAN-L7-422` owns F2 digest-missing visibility and is only referenced.
- Existing SESSION start fail-open, current-plan resolution, forced-stop current-ID exclusion, skill work, digest behavior, and other delegation/team entrypoints stay unchanged.

## Acceptance / non-claims

順序oracleはperformance oracleではない。Cold 7413msおよびwarm 6252ms / configured 5000ms / cancelled
のIssue evidenceは未解決のまま保持する。timeoutは6010925970のphase別実測選択とする。materialize/scan律速時は
既存Stop detached pattern (ただし現行spawnDetachedStopRefreshを呼ぶだけで責務移管しない) / 5s維持、
digest律速時はn>=5 nearest-rank p95×2をmsから設定秒へround-upする。
実Packの設定を使いcold/warm各5run以上、すべてでconfigured timeout内exit0・cancelなし・event全件・digest出力が必要。
新budget/defer/restart policyは追加しない。候補testは未実行でGREENを意味しない。
