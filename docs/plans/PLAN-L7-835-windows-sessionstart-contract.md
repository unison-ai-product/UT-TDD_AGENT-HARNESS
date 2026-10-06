---
plan_id: PLAN-L7-835-windows-sessionstart-contract
title: "PLAN-L7-835 (troubleshoot): Windows consumer SessionStart の順序契約と実配布完走受入"
kind: troubleshoot
layer: L7
drive: agent
route_signal: hotfix_required
route_mode: incident
created: 2026-10-06
updated: 2026-10-06
owner: Codex worker proposal / PO review pending
parent_design: docs/design/harness/L6-function-design/session-log.md
pair_artifact: docs/test-design/harness/L7-session-start-order-test-design.md
backprop_decision: required
backprop_decision_reason: SessionStartの既存fail-open記録を、正規identity
  admission後かつ重い非authority side-effects前に試みる順序契約、および実配布hookのcold/warm
  timeout受入を新たに規定する。既存L6/L7契約の不足をReverse 835で照合し、上流契約への差分が必要なら限定backfillする。
agent_slots:
  - role: aim
    slot_label: AIM — incident境界、authority前後、未決のtimeout方式選択を独立に整理する
  - role: qa
    slot_label: QA —
      CANDIDATE-U-835-001..007とCANDIDATE-AT-835-008の負系、実CLI順序、実配布cold/warm受入を検証する
  - role: tl
    slot_label: TL — identity/fence、session-log既存所有、Pack AT-DIST-003との接合を非著者レビューする
generates:
  - artifact_path: docs/plans/PLAN-L7-835-windows-sessionstart-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-03-session-log.md
  requires:
    - docs/plans/PLAN-L6-03-session-log.md
    - docs/plans/PLAN-L7-01-session-log.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/plans/PLAN-L7-422-feedback-saturation-visibility.md
    - docs/test-design/harness/L7-session-start-order-test-design.md
    - docs/plans/PLAN-REVERSE-835-windows-sessionstart-contract-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/835
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/835#issuecomment-5990541679
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418#issuecomment-6010925970
review_evidence: []
status: draft
github_issue_id: 835
admission_receipt:
  schema_version: v2
  receipt_id: certificate:e281d92c657b574bd0ea7a3ab6dfdb9e
  command_id: plan-draft:issue-835:windows-sessionstart-contract:20261006074708036
  admitted_at: 2026-10-06T07:47:08.036Z
  source_digest: sha256:ccd175ac8fdb1c141f0c7d361b3c948e1aa3282865ec7e143523310f6dc65063
  decision_digest: sha256:3433354f4ab65ab540a5f09d1b5de782b8e3a03ccef8bf049a75c9cd97869cfd
  receipt_digest: sha256:f0c3d50f619cdb25f805c0c9cc5cf32ac188824449b65f0b2da39dd2eb95e043
  binding:
    path: docs/plans/PLAN-L7-835-windows-sessionstart-contract.md
    plan_id: PLAN-L7-835-windows-sessionstart-contract
    asset_id: plan:e281d92c657b574bd0ea7a3ab6dfdb9e
    revision: 1
    content_digest: sha256:ccd175ac8fdb1c141f0c7d361b3c948e1aa3282865ec7e143523310f6dc65063
  route:
    signal: hotfix_required
    mode: incident
  issue:
    provider: github
    issue_id: 835
    episode_id: issue-835
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-531-pack-internal-canary-smoke
    revision: 11
    digest: sha256:691775ce8aa44fc963f8546e9acaba04d40984c50ab0d6d001ff7e508366fb6a
  reentry:
    target_plan_id: PLAN-L7-531-pack-internal-canary-smoke
    target_revision: 11
    phase: forward_merge
  escape_reason: "Issue #835: 配布Windows
    consumerのSessionStartがcold/warm双方でconfigured
    5秒timeoutを超え、正規eventが欠落した。identity
    admissionを維持したevent順序契約と実配布cold/warm完走受入をboundedに接続する。"
---

# PLAN-L7-835 (troubleshoot): Windows consumer SessionStart の順序契約と実配布完走受入

## 1. 位置づけと事実

本書は #835 のdraft提案であり、正規PLANの採番・admission receipt・reservation・pair-freeze・実装許可を主張しない。通常の `plan draft` writerで予約・起票する前に、rootがIssue bindingと契約を検収する。

Issue #835 はWindows consumerで配布されたClaude SessionStartが設定済み5秒timeoutを超えてcancelされ、対象sessionの正規 `session_start` が残らなかった不具合である。Issue本文はcold 7413ms / timeout 5000msを報告し、comment 5990541679は同一consumerでwarm 6252ms / timeout 5000ms / cancel、対象IDのevent欠落、`--help` 約1.6秒、Stop 約3771msを記録する。したがってcold-only仮説ではなく、現在の実測5秒失敗を契約の前提として保持する。最新control宛comment 6010925970はevent-firstを採択し、timeoutをphase実測から選択する。

incident originは `PLAN-L7-531-pack-internal-canary-smoke` revision 11、正規revision binding digest `sha256:691775ce8aa44fc963f8546e9acaba04d40984c50ab0d6d001ff7e508366fb6a`。reentryは同PLAN revision 11 / `forward_merge`。Issue bindingは明示的なincident識別子 `issue-835` / `projection_state: unprojected` とする。既存Execution Episode event、IssueProjected receipt、projection digestの発行済み状態は主張しない。

## 2. bounded contract delta

外部consumerの正規 `session start` CLI actionだけを対象とし、既存の共有session-log handler/schema/fail-open、forced-stop・escalation・skill・digest semanticsは維持する。

```text
stdin/session ID → runtime repo-root解決 → requireProjectMemoryRootによる既存identity/admission →
dispatch(SessionStart)による既存session_start appendの試行 → 現行SessionStart side-effects → 完了
```

event-firstは「正規project identity/admissionを通過した後、非authorityの重いside-effectsより前にappendを試みる」を意味する。未検証・未commit・driftしたidentityでevent writeを許さない。正規関数は `requireProjectMemoryRoot` (`src/runtime/project-memory-root.ts`) と、その下流 `resolveProjectMemoryRoot` / `loadProjectIdentityFromHead` であり、`requireRuntimeRepoRoot`だけをidentity authorityとみなさない。Git/object/worktree検証を含むのでcheapと推測せず、timeout評価へ含める。

この順序差分は event の到達を早めるだけであり、総実行時間を短縮するとは限らず、5秒以内のhook完走も保証しない。既存 `onSessionStart` はI/O失敗をfail-openで握るため、append試行とdurable eventは区別する。Issue acceptanceでは実consumer上の耐久eventを別途観測する。

## 3. Scope / non-scope

- 対象は外部Claude SessionStartの既存CLI callsite。必要なfault/order injectionは既存CLI/runtime module内に限定し、public CLI/new runtime moduleを追加しない。
- delegation/team入口は今回のIssue証跡から変更しない。
- PLAN-L7-422のF2 digest欠落可視化・doctor検出を再所有しない。422はdraftなのでdependencyではなくreferenceのみ。
- PLAN-L6-03 / PLAN-L7-01のsession-log schema、fail-open、current-plan解決を変更しない。追加するのはCLI call orderingと、その順序を検証するbounded pair。
- 新しいper-step budget / defer / restart機構やoptional maintenance分類は導入しない。phase計測でmaterialize/scan律速と判定された場合に限り、control comment 6010925970で採択された既存Stop detached patternの再利用を検討する。

## 4. 採択済み方針と実測によるtimeout選択

Control comment [6010925970](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418#issuecomment-6010925970)によりevent-firstが採択済みである。timeoutを固定値で先取りせず、専用pair §CANDIDATE-AT-835-008に定めるclean Windows consumerのcold/warm各5 run以上のphase別msから機械的に方式を選ぶ。各runに実Pack/bundle/version/settings argv・timeout・session ID・event・digest・exit/cancel状態を束縛し、cold/warm条件を区別する。現在のcold 7413ms / warm 6252ms / 5000ms cancelは削除・上書きしない。

- **materializeSkillAssets / scanDanglingStops+sweepStaleGuardSlotsが律速**: 既存Stop detached起動patternを使ってhook外へ出し、timeoutは5s維持。`spawnDetachedStopRefresh`は現行DB refresh専用であるため直接呼ぶだけでskill/scan責務を移管できるとは扱わない。既存所有、entrypoint、競合、完了責務を実装pairで検証し、sealed consumer bundleを手編集/guard無効化しない。
- **surfaceSessionStartDigestToStdoutが律速**: stdoutの同期出力を保つためPack timeoutを実測p95×2へ設定する。n=5以上のnearest-rank p95、全sample、ms→設定秒のround-upを記録する。n=5ではnearest-rank p95は最大値となる。計算値と異なる固定採択は禁止。
- phase外のwrapper/CLI/identity/event等も別計測し、phase合計との差分を残す。どのphaseも支配的でなければ、測定根拠なしに上記分岐を選ばずレビューへ戻す。

event-firstは性能改善/timeout内完走の証拠ではない。計測済みの該当分岐を非著者reviewと通常のPack設定変更/implementationで束縛する。

## 5. Acceptance candidates

専用pair `docs/test-design/harness/L7-session-start-order-test-design.md` のCANDIDATE-U-835-001..007とCANDIDATE-AT-835-008を正本候補とする。targeted unit/order oracleだけではIssue完了にならない。

実配布ATは専用clean Windows consumerへ実際のPackを導入し、その `.claude/settings.json` のSessionStart command/args/configured timeoutをそのまま実行する。phase計測後に選んだ上記方式を反映し、cold/warm各5 run以上の**全run**で同一実session IDをhook input・phase record・`.ut-tdd/logs/session/<id>.jsonl`に照合する。各runが設定timeout内に正常exit (0、cancelなし) し、同ID `session_start` がdurableに存在し、要求されたdigest出力が全runで存在すること。current timeout 5秒で失敗した既存証跡は消さず、別ID・mock・diagnostic bundle・source-only CLI・help・手書きmarkerで代替しない。AT-DIST-003への接合はPLAN-L7-531所有を尊重し、実配布smokeの必要差分だけ参照経由で統合する。

## 6. 所有境界とReentry

L6-03/L7-01が所有するsession event schema/handler/fail-openを変更せず、L7-531のconsumer fixture/AT-DIST-003を再実装しない。Reverse 835はexisting upstream session-log/designとこのbounded order/timeout acceptanceの整合をgap-onlyで検査し、不足が確認された箇所のみbackfill候補とする。L7-422のdigest欠落detect/可視化は対象外。Forward merge再合流点はoriginと同じPLAN-L7-531 r11であり、その所有者/契約を置換しない。

## 7. Status discipline

起票時はdraft。pair proposalやsource traceはreview evidenceではない。非著者の契約/pair review PASS後、通常writerのadmissionと正規確認workflowにより**実装前にconfirmed**へ進めてよい。実装後のIssue closeは上記実配布cold/warm全run acceptanceがPASSするまで行わない。契約confirmとIssue完了は別gateであり、完了条件をconfirmへ混ぜない。
