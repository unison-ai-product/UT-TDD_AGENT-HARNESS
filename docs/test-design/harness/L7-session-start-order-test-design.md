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

> Implementation oracle declaration / 2026-10-06. This artifact is still draft
> pending same-PR PLAN confirmation, but the unit-oracle IDs below are now the
> formal identifiers used by the implementation and its evidence. Their naming
> does not claim they have passed.

## Scope and source contract

対象は外部consumerが実行する正規 `session start` actionの順序だけ。

```text
stdin/session identity → requireRuntimeRepoRoot (runtime repo-root解決)
  → dispatch/onSessionStart append attempt → current side-effects → CLI completion
```

実経路のroot boundaryは `requireRuntimeRepoRoot` のみであり、`session start` は
`requireProjectMemoryRoot` によるHEAD identity admissionを呼ばない。新しいfail-close admissionは
追加しない。「先行」はroot解決の成功後かつSessionStart side-effects前にappendを試みることを指す。
`requireRuntimeRepoRoot` がrootを拒否した場合はeventを含むruntime state writeを行わない。既存fail-openと
append試行は維持し、event durable性は実配布受入で別に検証する。
このpairは新module/CLI/per-step budget/defer/restart機構を要求しない。materialize/scan律速と実測されたときのみ、controlが採択した既存Stop detached patternの再利用候補を許す。

## Seven unit/integration oracles and one acceptance oracle

| Formal oracle | 実行・mutation | RED / attack | Green観測 |
|---|---|---|---|
| U-835-001 — bundled production-order witness | 既存共有 `buildNodeGeneration` / `runBundledCli` のconsumer fixtureを再利用。`.ut-tdd/assets/skills/SKILL_MAP.md` をdirectoryへ置換し、実sealed Node bundleでsession startを実行 | bundle materializationのdirectory-read errorより前にdispatchされず、exact eventが残らない。または別のsetup/root errorをmaterialize faultと誤認 | 期待するdirectory-read errorを明示確認し、同じsession IDの `session_start` が先行して保存されたことを確認。generation buildは増やさない |
| U-835-002 — rejected-root negative | 既存 `tests/runtime-hook-entrypoints.test.ts` のroot markerを欠くisolated cwd/envによる実CLI起動 | rejection前のevent/JSONL/他session-state write、recovery diagnostic欠落、または実経路にないidentity admissionを要求 | `requireRuntimeRepoRoot` が既存recovery diagnosticで拒否し、session event appendは0件。identity/HEAD admissionの追加は主張しない |
| U-835-003 — production seam order | 実CLI actionをCommander module-load parse captureで取得した実Commandから実行。Vitest mockはside-effect入口の`materializeSkillAssets`だけをcallback化し、callback entryでreal JSONLを読む | callback entry時にeventが未作成/不完全、別ID/plan | `onSessionStart`の同期append完了後にside-effect入口へ到達したことをreal file観測で証明 |
| U-835-004 — delayed side-effect durability | U-835-003と同じ実Command/callbackでentryを観測し、bounded shared-memory barrierのreleaseまで同期的に待つ。worker側が待機中に同一JSONLを読む | callback待機中にeventが欠落/消失、barrier timeout/解放漏れ | Atomics.waitの`ok`またはworker先行release時の`not-equal`を許容し、workerの実ファイル読取flagが成功することを確認する。eventはentry/待機中/解放後に同じIDで残る。delay中の耐久性のみで、hook timeout内完了は主張しない |
| U-835-005 — error vs event persistence | runtime root解決成功後、U-835-003と同じcallbackでside-effect入口の実eventを捕捉後に同期throw。append failureとは別caseにする | error後のrollback/deletion、throwの成功扱い、root rejection前write | callback entryでのevent、CLI errorとしてのthrow、error後も残るeventを別々に確認する。既存 `onSessionStart` fail-openのappend-I/O faultは0を返す既存U-SLOG-005契約のまま |
| U-835-006 — exact identity/plan | U-835-003/004と同じ実CLI actionで`--session`へ固有IDを渡し、事前配置current-planを指定して保存JSONLをparse。fallback branchは使わない | default/fallback ID、別session path、異なるplan | event.session_idとcommand inputが完全一致し、plan_idがevent時点のcurrent-plan。payload/schemaは既存所有のまま |
| U-835-007 — current session / prior behavior | 既存 `tests/forced-stop.test.ts` U-FSF-007のcurrent-ID除外/idempotenceと、`tests/runtime-hook-entrypoints.test.ts` のsession start→Stop digestを対応oracleとして実行 | current session自身をforced_stop、他session検出消失、または`session_start` digestの重複/欠落 | current IDはforced-stop対象外でprior dangling sessionは維持。既存Stop digestはstartを1件だけ集約。`PLAN-L7-422`欠落可視化を再実装しない |
| CANDIDATE-AT-835-008 — 実配布計測/完走受入 | [control comment 6010925970](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418#issuecomment-6010925970)に従い、clean Windows consumerをVS CodeのClaude拡張から実起動し、`CLAUDE_CODE_ENTRYPOINT=claude-vscode` を確認してcold/warm各5 run以上行う。端末からhook commandを直叩きしたrunは受入対象外。全runでphase別msを計測: wrapper/CLI起動、runtime repo-root解決、materializeSkillAssets、scanDanglingStops+sweepStaleGuardSlots、attemptEscalationBlock、surfaceSessionStartDigestToStdout、event dispatch、whole-hook。performance.now()の同一process差分で測り、phase合計とwhole-hook残差も記録する。各runを実Pack/bundle/Node/Claude/VS Code/settings argv/configured timeout/session ID/phase record/event/digest/process exit/cancelへ束縛し、cold/warm条件を記す。instrumentしたbundleはdiagnostic artifactとして正規sealed bundleと区別し、sealed consumer bundleを手書換え/guard無効化しない。 | VS Code entrypoint/session/argv束縛・phase/whole時間の欠落、terminal直叩き、sealed bundle手編集/guard無効化、律速根拠と選択分岐不一致、event-firstだけで完了扱い、いずれかの受入runでtimeout超過/cancel/exit≠0/event欠落/digest欠落 | n>=5 cold+n>=5 warmのphase計測全件と方式選択を保存。materialize/scanが律速なら既存Stop detached patternを再利用してhook外へ出し5s維持するが、`spawnDetachedStopRefresh`は現行DB refresh専用で直接呼ぶだけでは責務移管にならない。entrypoint/ownership/競合/完了責務をレビューする。digestが律速ならnearest-rank p95×2をmsから秒へround-upしてPack timeoutへ反映し、15s固定をしない。いずれも正規Packのconfigured settings/argvでcold/warm各5件以上の**全run**がtimeout内exit0・cancelなし、同一IDのdurable `session_start`とdigest出力を満たす。ATが失敗した場合は1 commitでrollback可能な変更をrollbackし、同じcold/warm条件で再計測する。現在の5s失敗を歴史保持。mock/diagnostic bundle/terminal直叩き/別ID/手書きmarker不許可。PLAN-L7-531所有のAT-DIST-003へ結果接合。 |

## Existing ownership / pairing

- U-SLOG-005 is the existing append/fail-open oracle. U-835-002 and U-835-007 reuse the named existing runtime-hook/forced-stop tests. U-835-001 reuses the shared release-consumer bundle fixture/build; U-835-003..006 exercise the production command route through a captured real Commander instance. These mappings supplement rather than replace existing tests.
- `session start` actionの既存境界は `requireRuntimeRepoRoot` によるroot解決。`requireProjectMemoryRoot` → `resolveProjectMemoryRoot` → `loadProjectIdentityFromHead` はこの実経路に含まれないため、identity admissionとして契約へ持ち込まない。
- `PLAN-L7-531` owns actual Pack/AT-DIST-003 consumer path. `PLAN-L7-422` owns F2 digest-missing visibility and is only referenced.
- Existing SESSION start fail-open, current-plan resolution, forced-stop current-ID exclusion, skill work, digest behavior, and other delegation/team entrypoints stay unchanged.

## Rollback / remeasurement

detached化を採択した場合、実装者は1 commitで当該detached call 1箇所を同期呼び出しへ戻す。timeout引上げを採択した場合、実装者は1 commitで配布settingsのtimeout値1つを戻す。AT-835-008の1runでも失敗した場合、実装者は選んだ変更をrollbackしてから同じVS Code entrypoint・cold/warm条件で再計測する。

## Acceptance / non-claims

順序oracleはperformance oracleではない。Cold 7413msおよびwarm 6252ms / configured 5000ms / cancelled
のIssue evidenceは未解決のまま保持する。timeoutは6010925970のphase別実測選択とする。materialize/scan律速時は
既存Stop detached pattern (ただし現行spawnDetachedStopRefreshを呼ぶだけで責務移管しない) / 5s維持、
digest律速時はn>=5 nearest-rank p95×2をmsから設定秒へround-upする。
実Packの設定を使いcold/warm各5run以上、すべてでconfigured timeout内exit0・cancelなし・event全件・digest出力が必要。
新budget/defer/restart policyは追加しない。候補testは未実行でGREENを意味しない。
