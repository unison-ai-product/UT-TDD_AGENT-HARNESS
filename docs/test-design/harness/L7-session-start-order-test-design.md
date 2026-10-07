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
このpairは新module/CLI/per-step budget/defer/restart機構を要求しない。SessionStart side-effectsは既存の同期処理を維持し、materialize/scanをdetached化しない。

## Seven unit/integration oracles and one acceptance oracle

設定回帰の補助テスト `SessionStart timeout is 30s in source and consumer settings without changing other hook timeouts` は `tests/runtime-hook-entrypoints.test.ts` に置く。新しい正式oracle IDは追加しない。

| 正式オラクルID | 既存テストラベル / trace対象 |
|---|---|
| U-835-001 | `U-835-001 / CANDIDATE-U-RCDEV-007: bundled setup/session materialization is digest checked and ignored` in `tests/release-consumer-skills.test.ts`; shared generation fixture only |
| U-835-002 | `U-835-002: blocks hook state writes when no repository root can be resolved` in `tests/runtime-hook-entrypoints.test.ts` |
| U-835-003 | `U-835-003: the real session-start action appends before its materialize side-effect boundary` in `tests/runtime-hook-entrypoints.test.ts` |
| U-835-004 | `U-835-004: the exact session event remains readable during a bounded side-effect barrier` in `tests/runtime-hook-entrypoints.test.ts` |
| U-835-005 | `U-835-005: a side-effect error does not roll back the already-appended session event` in `tests/runtime-hook-entrypoints.test.ts` |
| U-835-006 | `U-835-006: the real session-start action preserves its explicit session ID and current plan` in `tests/runtime-hook-entrypoints.test.ts` |
| U-835-007 | `U-835-007 / U-FSF-007: scanDanglingStops は dangling session のみ forced_stop 記録 / idempotent / current 除外 / fail-open` in `tests/forced-stop.test.ts`; `U-835-007: shared CLI session/hook commands record a PLAN digest in a temp repo` in `tests/runtime-hook-entrypoints.test.ts` |

### オラクル設計詳細

| 設計参照行 | 実行・mutation | RED / attack | Green観測 |
|---|---|---|---|
| U-835-001 — bundled production-order witness | 既存共有 `buildNodeGeneration` / `runBundledCli` のconsumer fixtureを再利用。`.ut-tdd/assets/skills/SKILL_MAP.md` をdirectoryへ置換し、実sealed Node bundleでsession startを実行 | bundle materializationのdirectory-read errorより前にdispatchされず、exact eventが残らない。または別のsetup/root errorをmaterialize faultと誤認 | 期待するdirectory-read errorを明示確認し、同じsession IDの `session_start` が先行して保存されたことを確認。generation buildは増やさない |
| U-835-002 — rejected-root negative | 既存 `tests/runtime-hook-entrypoints.test.ts` のroot markerを欠くisolated cwd/envによる実CLI起動 | rejection前のevent/JSONL/他session-state write、recovery diagnostic欠落、または実経路にないidentity admissionを要求 | `requireRuntimeRepoRoot` が既存recovery diagnosticで拒否し、session event appendは0件。identity/HEAD admissionの追加は主張しない |
| U-835-003 — production seam order | 実CLI actionをCommander module-load parse captureで取得した実Commandから実行。Vitest mockはside-effect入口の`materializeSkillAssets`だけをcallback化し、callback entryでreal JSONLを読む | callback entry時にeventが未作成/不完全、別ID/plan | `onSessionStart`の同期append完了後にside-effect入口へ到達したことをreal file観測で証明 |
| U-835-004 — delayed side-effect durability | U-835-003と同じ実Command/callbackでentryを観測し、bounded shared-memory barrierのreleaseまで同期的に待つ。worker側が待機中に同一JSONLを読む | callback待機中にeventが欠落/消失、barrier timeout/解放漏れ | Atomics.waitの`ok`またはworker先行release時の`not-equal`を許容し、workerの実ファイル読取flagが成功することを確認する。eventはentry/待機中/解放後に同じIDで残る。delay中の耐久性のみで、hook timeout内完了は主張しない |
| U-835-005 — error vs event persistence | runtime root解決成功後、U-835-003と同じcallbackでside-effect入口の実eventを捕捉後に同期throw。append failureとは別caseにする | error後のrollback/deletion、throwの成功扱い、root rejection前write | callback entryでのevent、CLI errorとしてのthrow、error後も残るeventを別々に確認する。既存 `onSessionStart` fail-openのappend-I/O faultは0を返す既存U-SLOG-005契約のまま |
| U-835-006 — exact identity/plan | U-835-003/004と同じ実CLI actionで`--session`へ固有IDを渡し、事前配置current-planを指定して保存JSONLをparse。fallback branchは使わない | default/fallback ID、別session path、異なるplan | event.session_idとcommand inputが完全一致し、plan_idがevent時点のcurrent-plan。payload/schemaは既存所有のまま |
| U-835-007 — current session / prior behavior | 既存 `tests/forced-stop.test.ts` U-FSF-007のcurrent-ID除外/idempotenceと、`tests/runtime-hook-entrypoints.test.ts` のsession start→Stop digestを対応oracleとして実行 | current session自身をforced_stop、他session検出消失、または`session_start` digestの重複/欠落 | current IDはforced-stop対象外でprior dangling sessionは維持。既存Stop digestはstartを1件だけ集約。`PLAN-L7-422`欠落可視化を再実装しない |
| CANDIDATE-AT-835-008 — 正規sealed C4の実配布完走受入 | [PO control comments 6029336405](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418#issuecomment-6029336405) / [6029427046](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418#issuecomment-6029427046)に従い、未改変の正規sealed canary.4 bundleを使うclean Windows consumerをVS CodeのClaude拡張から実起動し、`CLAUDE_CODE_ENTRYPOINT=claude-vscode` を確認してcold 1回 + warm 2回の計3 runを行う。端末からhook commandを直叩きしたrunは受入対象外。各runを同じconsumer/bundle/version/settings argv/configured 30s timeout/正確なsession ID・event・digest/process exit/cancel記録へ束縛し、cold/warm条件とwhole-hook msを記録する。phase診断は受入の必須条件ではなく、3 runのいずれかが失敗した場合に限り原因調査として任意実施できる。実施する場合は既存 `scripts/build-node.mjs` を直接呼び、exact source + 計測patchからdiagnostic ESMを作成し、patch/metafile/SHA-256を保存する。diagnostic ESMはsealed receiptを発行せず、正式AT証拠として扱わない。dirty guard例外や診断用commitは作らない。 | sealed C4/consumer/settingsの差替え・変更、VS Code entrypoint/session/argv/timeout束縛またはwhole-hook msの欠落、terminal直叩き、いずれかのrunでwhole-hookが30000msを超える/cancel/exit≠0/同一session IDのdurable `session_start` event欠落/digest欠落。diagnostic bundleを正式AT証拠とすることも不可 | cold 1回とwarm 2回の**全3 run**がconfigured 30000ms以内に完走し、cancelなし・exit 0・各runの正確なsession IDに一致するdurable `session_start` eventとdigest出力を満たす。whole-hook msを全runで記録する。既存cold 7413ms / warm 6252ms / configured 5000msでの失敗証拠は履歴として保持し、上書きしない。新ATは未実施であり、診断bundle・mock・terminal直叩き・別ID・手書きmarkerは受入の代替にならない。PLAN-L7-531所有のAT-DIST-003へ結果接合する。 |

## Existing ownership / pairing

- U-SLOG-005は既存のappend/fail-open oracle。正式IDとtest labelの対応は上の宣言表に記す。U-835-001は既存release-consumer共有fixture/buildを再利用し、U-835-003..006はcaptured real Commander instanceを通じて実CLI command routeを実行する。既存testを置換せず、対応関係を補足する。
- `session start` actionの既存境界は `requireRuntimeRepoRoot` によるroot解決。`requireProjectMemoryRoot` → `resolveProjectMemoryRoot` → `loadProjectIdentityFromHead` はこの実経路に含まれないため、identity admissionとして契約へ持ち込まない。
- `PLAN-L7-531` owns actual Pack/AT-DIST-003 consumer path. `PLAN-L7-422` owns F2 digest-missing visibility and is only referenced.
- Existing SESSION start fail-open, current-plan resolution, forced-stop current-ID exclusion, skill work, digest behavior, and other delegation/team entrypoints stay unchanged.

## Rollback / remeasurement

side-effectsは同期処理のまま維持し、detached化しない。AT-835-008で1runでも失敗した場合はPASSとせず原因を調査する。rollbackする場合は1 commitで開発用 `.claude/settings.json` と配布用 `docs/templates/adapter/.claude/settings.json` のSessionStart timeout値だけを30秒から5秒へ戻し、他のコード/settings値は対象にしない。

## Acceptance / non-claims

順序oracleはperformance oracleではない。PO判断によりSessionStart configured timeoutは30秒とし、side-effectsは既存の同期処理を維持する。Cold 7413msおよびwarm 6252ms / configured 5000ms / cancelledのIssue evidenceは履歴として保持し、上書きしない。CANDIDATE-AT-835-008のcold 1回 + warm 2回の計3受入runは未実施であり、成功を主張しない。受入runが1回でも失敗した場合はPASSとせず原因調査する。rollbackする場合は開発用/配布用settings双方のSessionStart timeout値だけを1 commitで戻す。新budget/defer/restart policyは追加しない。候補testは未実行でGREENを意味しない。
