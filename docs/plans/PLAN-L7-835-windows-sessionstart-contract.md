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
backprop_decision_reason: 実配布session start
  actionのrequireRuntimeRepoRoot後に既存fail-open
  appendを重いside-effectsより先に試みる順序契約、および実VS Code consumerのcold/warm
  timeout受入を新たに規定する。既存L6/L7契約の不足をReverse 835で照合し、上流契約への差分が必要なら限定backfillする。
agent_slots:
  - role: aim
    slot_label: AIM — incident境界、runtime root拒否前後、未決timeout方式を独立に整理する
  - role: qa
    slot_label: QA — CANDIDATE-U-835-001..007とCANDIDATE-AT-835-008の負系、実CLI順序、VS
      Code実配布cold/warm受入を検証する
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
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: 2026-10-06T11:37:59.647Z
    verdict: PASS
    scope: "PR #865 Issue #835 bounded SessionStart event-first implementation;
      exact implementation HEAD e3188bd6ae706b73ea62e2284c833fecd760efd9; CI 5/5
      success and formal Opus review. This confirms the contract revision only;
      real VS Code consumer AT-835-008 remains pending and Issue #835 remains
      open."
    tests_green_at: 2026-10-06T11:29:12Z
    green_commands:
      - kind: typecheck
        command: npm run typecheck (CI harness-check-linux)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T11:10:00Z
        evidence_path: src/cli.ts
        output_digest: sha256:0bb477a06df507d424803257d4efad0d140d827cf7964557894d63b5a4a8ebe0
        anchor_commit: e3188bd6ae706b73ea62e2284c833fecd760efd9
      - kind: typecheck
        command: npm run typecheck (CI harness-check-windows)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T11:10:13Z
        evidence_path: src/cli.ts
        output_digest: sha256:0bb477a06df507d424803257d4efad0d140d827cf7964557894d63b5a4a8ebe0
        anchor_commit: e3188bd6ae706b73ea62e2284c833fecd760efd9
      - kind: doctor
        command: node src/cli.ts doctor --strict-green-command-digest --result-file
          $UT_TDD_DOCTOR_RESULT_FILE (CI harness-check-linux)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T11:12:48Z
        evidence_path: .github/workflows/harness-check.yml
        output_digest: sha256:f079c200785985cc0b7a4b42522f202c15d3356c5e1a5890aa8708a185bedab7
        anchor_commit: e3188bd6ae706b73ea62e2284c833fecd760efd9
      - kind: unit_test
        command: npm run test (CI harness-check-linux; full Vitest regression)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T11:24:35Z
        evidence_path: tests/runtime-hook-entrypoints.test.ts
        output_digest: sha256:767a3c500b2e79dc20424958f1e69a05bbe31bd54c4803abcc71da1fc90a44c0
        anchor_commit: e3188bd6ae706b73ea62e2284c833fecd760efd9
      - kind: lint
        command: npm run lint (CI harness-check-linux; Biome)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T11:24:38Z
        evidence_path: src/cli.ts
        output_digest: sha256:0bb477a06df507d424803257d4efad0d140d827cf7964557894d63b5a4a8ebe0
        anchor_commit: e3188bd6ae706b73ea62e2284c833fecd760efd9
      - kind: unit_test
        command: npm run test:windows (CI harness-check-windows; full Vitest regression)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T11:28:44Z
        evidence_path: tests/release-consumer-skills.test.ts
        output_digest: sha256:5b6581a665fd203b4c2f04dbd8913ff73342cd2ff5d35640b44ec83f761179f7
        anchor_commit: e3188bd6ae706b73ea62e2284c833fecd760efd9
      - kind: doctor
        command: node src/cli.ts doctor --scope toolchain (CI harness-check-windows)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T11:28:49Z
        evidence_path: .github/workflows/harness-check.yml
        output_digest: sha256:f079c200785985cc0b7a4b42522f202c15d3356c5e1a5890aa8708a185bedab7
        anchor_commit: e3188bd6ae706b73ea62e2284c833fecd760efd9
    worker_model: gpt-6-luna
    reviewer_model: claude-opus-5
    plan_revision: rev3
    subject_head: e3188bd6ae706b73ea62e2284c833fecd760efd9
    citations:
      - "PR #865 canonical review receipt request
        6c8d55c5034643f34e079956c32a719d1d5463db3078017201721aa8078d586a;
        receipt file SHA-256
        4eb0cac5be18e4034919b6472c63046d58d87e158e58323e73a56dcec5be61d7;
        verdict PASS, blocking findings 0, exact implementation HEAD
        e3188bd6ae706b73ea62e2284c833fecd760efd9."
      - "Canonical review-custody audit: request
        6c8d55c5034643f34e079956c32a719d1d5463db3078017201721aa8078d586a; exact
        HEAD e3188bd6ae706b73ea62e2284c833fecd760efd9; claude-opus-5; receipt
        digest 4eb0cac5be18e4034919b6472c63046d58d87e158e58323e73a56dcec5be61d7;
        verdict digest
        bc6e0aafaa89869811a48bd1dd0cd0310de9a3a8b006e1481d8f8357e6b815d4."
      - CI run 37454533428 (5/5 success, exact HEAD
        e3188bd6ae706b73ea62e2284c833fecd760efd9; aggregate
        2026-10-06T11:29:12Z); independent evidence file
        pr865-e3188-ci-terminal-evidence.md SHA-256
        eb4bf01e7674943337a2e30083b6de0b4a52b278867178eab8cb0fb7c62c5a37.
      - "Implementation PR #865 was reviewed on exact
        e3188bd6ae706b73ea62e2284c833fecd760efd9. The current admission source
        is separately rebased by main merge
        2d9728fcb5e2758fbc72bd67235f725c8305a2fa; CI/review are not claims about
        that merge commit."
status: confirmed
github_issue_id: 835
admission_receipt:
  schema_version: v2
  receipt_id: certificate:bf2cae5fee18b77a0ade95d9901b928f
  command_id: plan-revise:issue835:forward:pr865-post-pass-confirmation:20261006
  admitted_at: 2026-10-06T11:46:23.000Z
  source_digest: sha256:fb7fbd740c60a5585a83104b25fd95798fdd8353a8b8f3d9b3830616f9b68d90
  decision_digest: sha256:e2dfd822525c8daa39d8b6090917e677ffd9e88bd4a6b954099ee0f6744f9432
  receipt_digest: sha256:386446f3e69ff1715426e6b1400894fea1de076a105e308315e172d4d4f265dd
  binding:
    path: docs/plans/PLAN-L7-835-windows-sessionstart-contract.md
    plan_id: PLAN-L7-835-windows-sessionstart-contract
    asset_id: plan:e281d92c657b574bd0ea7a3ab6dfdb9e
    revision: 4
    content_digest: sha256:fb7fbd740c60a5585a83104b25fd95798fdd8353a8b8f3d9b3830616f9b68d90
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
  escape_reason: "Issue #835 / control comment 6010925970: event-firstを保持し、実測未完のVS
    Code ATは未完了のまま記録する。PR #865 exact e3188bd6のCI 5/5とOpus PASSに基づく同一PR内の通常確認。"
---

# PLAN-L7-835 (troubleshoot): Windows consumer SessionStart の順序契約と実配布完走受入

## 1. 位置づけと事実

本書は通常のplan revise writerでadmitされたIssue #835の正規Forward PLANである。rev4のconfirmedは、実装PR #865のexact HEAD e3188bd6ae706b73ea62e2284c833fecd760efd9に対するCI 5/5 successとOpus PASSを同一PRで記録した契約着地を示す。これは実配布受入やIssue完了を意味しない。実VS Code consumerによるcold/warm各5 run以上のAT-835-008は未実施であり、Issue #835はopenのままとする。

Issue #835 はWindows consumerで配布されたClaude SessionStartが設定済み5秒timeoutを超えてcancelされ、対象sessionの正規 `session_start` が残らなかった不具合である。Issue本文はcold 7413ms / timeout 5000msを報告し、comment 5990541679は同一consumerでwarm 6252ms / timeout 5000ms / cancel、対象IDのevent欠落、`--help` 約1.6秒、Stop 約3771msを記録する。したがってcold-only仮説ではなく、現在の実測5秒失敗を契約の前提として保持する。最新control宛comment 6010925970はevent-firstを採択し、timeoutをphase実測から選択する。

incident originは `PLAN-L7-531-pack-internal-canary-smoke` revision 11、正規revision binding digest `sha256:691775ce8aa44fc963f8546e9acaba04d40984c50ab0d6d001ff7e508366fb6a`。reentryは同PLAN revision 11 / `forward_merge`。Issue bindingは明示的なincident識別子 `issue-835` / `projection_state: unprojected` とする。既存Execution Episode event、IssueProjected receipt、projection digestの発行済み状態は主張しない。

## 2. bounded contract delta

外部consumerの正規 `session start` CLI actionだけを対象とし、既存の共有session-log handler/schema/fail-open、forced-stop・escalation・skill・digest semanticsは維持する。

```text
stdin/session ID → requireRuntimeRepoRootによるruntime repo-root解決 →
dispatch(SessionStart)による既存session_start appendの試行 → 現行SessionStart side-effects → 完了
```

実経路のroot boundaryは `requireRuntimeRepoRoot` (`src/runtime/repo-root.ts`) であり、`session start` は `requireProjectMemoryRoot` によるHEAD identity admissionを呼ばない。fail-close admissionは今回追加せず、event-firstの安全境界は `requireRuntimeRepoRoot` が拒否するrootではeventを含むruntime stateを書かないことに限定する。event-firstはroot resolution後、重いSessionStart side-effectsより前に既存appendを試みる順序を意味し、eventのdurabilityやhook完走を保証しない。

この順序差分は event の到達を早めるだけであり、総実行時間を短縮するとは限らず、5秒以内のhook完走も保証しない。既存 `onSessionStart` はI/O失敗をfail-openで握るため、append試行とdurable eventは区別する。Issue acceptanceでは実consumer上の耐久eventを別途観測する。

## 3. Scope / non-scope

- 対象は外部Claude SessionStartの既存CLI callsite。必要なfault/order injectionは既存CLI/runtime module内に限定し、public CLI/new runtime moduleを追加しない。
- delegation/team入口は今回のIssue証跡から変更しない。
- PLAN-L7-422のF2 digest欠落可視化・doctor検出を再所有しない。422はdraftなのでdependencyではなくreferenceのみ。
- PLAN-L6-03 / PLAN-L7-01のsession-log schema、fail-open、current-plan解決を変更しない。追加するのはCLI call orderingと、その順序を検証するbounded pair。
- 新しいper-step budget / defer / restart機構やoptional maintenance分類は導入しない。phase計測でmaterialize/scan律速と判定された場合に限り、control comment 6010925970で採択された既存Stop detached patternの再利用を検討する。
- 採択した対応は1 commitでrollback可能にする。detached化を採択した場合は当該detached call 1箇所を同期呼び出しへ戻し、timeout引上げを採択した場合は配布settingsのtimeout値1つを戻す。AT-835-008が失敗した場合は採択対応をrollbackして同じ計測条件で再計測する。

## 4. 採択済み方針と実測によるtimeout選択

Control comment [6010925970](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418#issuecomment-6010925970)によりevent-firstが採択済みである。timeoutを固定値で先取りせず、専用pair §CANDIDATE-AT-835-008に定めるclean Windows consumerのcold/warm各5 run以上のphase別msから機械的に方式を選ぶ。各runに実Pack/bundle/version/settings argv・timeout・session ID・event・digest・exit/cancel状態を束縛し、cold/warm条件を区別する。root解決時間を記録し、存在しないidentity-admission phaseを計測項目にしない。現在のcold 7413ms / warm 6252ms / 5000ms cancelは削除・上書きしない。

- **materializeSkillAssets / scanDanglingStops+sweepStaleGuardSlotsが律速**: 既存Stop detached起動patternを使ってhook外へ出し、timeoutは5s維持。`spawnDetachedStopRefresh`は現行DB refresh専用であるため直接呼ぶだけでskill/scan責務を移管できるとは扱わない。既存所有、entrypoint、競合、完了責務を実装pairで検証し、sealed consumer bundleを手編集/guard無効化しない。
- **surfaceSessionStartDigestToStdoutが律速**: stdoutの同期出力を保つためPack timeoutを実測p95×2へ設定する。n=5以上のnearest-rank p95、全sample、ms→設定秒のround-upを記録する。n=5ではnearest-rank p95は最大値となる。計算値と異なる固定採択は禁止。
- phase外のwrapper/CLI/identity/event等も別計測し、phase合計との差分を残す。どのphaseも支配的でなければ、測定根拠なしに上記分岐を選ばずレビューへ戻す。

event-firstは性能改善/timeout内完走の証拠ではない。計測済みの該当分岐を非著者reviewと通常のPack設定変更/implementationで束縛し、1 commit rollback手順を実装契約とpairに含める。

## 5. Acceptance candidates

専用pair `docs/test-design/harness/L7-session-start-order-test-design.md` のCANDIDATE-U-835-001..007とCANDIDATE-AT-835-008を正本候補とする。targeted unit/order oracleだけではIssue完了にならない。

実配布ATは専用clean Windows consumerをVS CodeのClaude拡張から実際に起動し、`CLAUDE_CODE_ENTRYPOINT=claude-vscode` を束縛する。consumerの `.claude/settings.json` にあるSessionStart command/args/configured timeoutをそのまま使い、端末からhook commandを直叩きしたrunは受入証拠にしない。phase計測後に選んだ上記方式を反映し、cold/warm各5 run以上の**全run**で同一実session IDをhook input・phase record・`.ut-tdd/logs/session/<id>.jsonl`に照合する。各runが設定timeout内に正常exit (0、cancelなし) し、同ID `session_start` がdurableに存在し、要求されたdigest出力が全runで存在すること。current timeout 5秒で失敗した既存証跡は消さず、別ID・mock・diagnostic bundle・source-only CLI・help・手書きmarkerで代替しない。AT-DIST-003への接合はPLAN-L7-531所有を尊重し、実配布smokeの必要差分だけ参照経由で統合する。受入runが1件でも失敗した場合は対応を1 commitでrollbackし、rollback後にcold/warm条件を保って再計測する。

## 6. 所有境界とReentry

L6-03/L7-01が所有するsession event schema/handler/fail-openを変更せず、L7-531のconsumer fixture/AT-DIST-003を再実装しない。Reverse 835はexisting upstream session-log/designとこのbounded order/timeout acceptanceの整合をgap-onlyで検査し、不足が確認された箇所のみbackfill候補とする。L7-422のdigest欠落detect/可視化は対象外。Forward merge再合流点はoriginと同じPLAN-L7-531 r11であり、その所有者/契約を置換しない。

## 7. Status discipline

ForwardはPR #865のtest-first実装PRで最初draftとして維持し、正式oracleのRed/Greenを経て実装HEAD e3188bd6ae706b73ea62e2284c833fecd760efd9のCI 5/5 successを確認した。2026-10-06T11:37:59.647ZにOpusが同HEADをPASS（blocking findings 0）とし、その後、同一PRで通常plan revise writerにより本Forwardをrev4/confirmedへ記録する。確認対象は契約と実装PRの着地であり、実配布ATのPASSやIssue完了ではない。confirm後の簿記限定レビューはcontrol指示に従い、ReverseはR0/draftを維持し、confirm前の追加待ち条件にしない。実VS Code consumerでのAT-835-008（cold/warm各5 run以上）は未実施であり、Issue #835はopenのままとする。
