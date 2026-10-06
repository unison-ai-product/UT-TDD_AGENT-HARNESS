---
plan_id: PLAN-REVERSE-835-windows-sessionstart-contract-backfill
title: "PLAN-REVERSE-835: SessionStart 順序/timeout契約のL6/L7 backfill確認"
kind: reverse
layer: cross
drive: agent
route_signal: reverse
route_mode: reverse
created: 2026-10-06
updated: 2026-10-06
owner: Codex worker proposal / non-author review pending
confirmed_reverse_type: design
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: Reverseは新要求を先に追加せず、L6-03/L7-01の既存session-log契約とPLAN-L7-835のbounded
  incident deltaを突合し、必要な不足差分だけを上流へ戻す監査工程である。
parent_design: docs/plans/PLAN-L7-835-windows-sessionstart-contract.md
pair_artifact: docs/test-design/harness/L7-session-start-order-test-design.md
agent_slots:
  - role: tl
    slot_label: TL — Reverse R0-R4で既存session-log contractとのgap-only整合を検証する
  - role: qa
    slot_label: QA — CANDIDATE-U-835-001..007とCANDIDATE-AT-835-008の双方向traceを攻撃する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-835-windows-sessionstart-contract-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-835-windows-sessionstart-contract.md
  requires:
    - docs/plans/PLAN-L6-03-session-log.md
    - docs/plans/PLAN-L7-01-session-log.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/plans/PLAN-L7-422-feedback-saturation-visibility.md
    - docs/design/harness/L6-function-design/session-log.md
    - docs/test-design/harness/L7-session-start-order-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/835
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 835
admission_receipt:
  schema_version: v2
  receipt_id: certificate:06a129a688288588e950ad46f9d696bb
  command_id: plan-revise:issue835:reverse:flag3-r2:20261006083557858
  admitted_at: 2026-10-06T08:35:57.858Z
  source_digest: sha256:b1c158a8f5462919fda5694de2ec4a9cd473cdffd3bddee6adcc9ba96ff1a095
  decision_digest: sha256:2dd9ef5a022bae2f588d21766a22c5f8021c5205361b5e42574f603dcd57d3c0
  receipt_digest: sha256:202ac97a8691f4a19427feffef5c3fd9a708c3e54a1bd569040b310f1317076c
  binding:
    path: docs/plans/PLAN-REVERSE-835-windows-sessionstart-contract-backfill.md
    plan_id: PLAN-REVERSE-835-windows-sessionstart-contract-backfill
    asset_id: plan:22f47f3dd6d6ff5c42d4f9370eeed624
    revision: 2
    content_digest: sha256:b1c158a8f5462919fda5694de2ec4a9cd473cdffd3bddee6adcc9ba96ff1a095
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 835
    episode_id: issue-835
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-531-pack-internal-canary-smoke
    revision: 11
    digest: sha256:691775ce8aa44fc963f8546e9acaba04d40984c50ab0d6d001ff7e508366fb6a
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-531-pack-internal-canary-smoke
    target_revision: 11
    phase: forward_merge
  escape_reason: "Issue #835 / control #6012374220:
    root拒否境界、可逆なtimeout対応、claude-vscode実consumer受入だけをL6/L7契約へgap-only照合し、origin
    PLAN-L7-531 r11へ再合流する。"
---

# PLAN-REVERSE-835: SessionStart 順序/timeout契約のL6/L7 backfill確認

## R0: reverse境界

このignored候補は、新しい設計規則の自己承認や上流契約の即時変更を意味しない。対象はPLAN-L7-835のevent-first順序差分、`requireRuntimeRepoRoot`拒否時にeventを残さない境界、timeout未決判断、およびVS Code実consumerでのcold/warm受入である。`session start`は既存HEAD identity admissionを呼ばないため、新しいfail-close admissionは対象へ追加しない。Issue bindingはForwardと同じ明示的incident識別子 `issue-835` / `projection_state: unprojected` とし、既存Episode eventやprojection receiptの存在を主張しない。origin/reentryはcontrolで確定したPLAN-L7-531 r11 bindingへ固定する。

## R1: 既存契約との照合

- `PLAN-L6-03-session-log` / `PLAN-L7-01-session-log` のevent schema、append/fail-open、active-plan resolution、digest semanticsは変更せず、CLI call orderingだけが既存設計の範囲に収まるか確認する。
- `PLAN-L7-531` の受入fixture/AT-DIST-003所有は維持し、本Issueからfixture producer/consumer acceptance実装をコピーしない。
- `PLAN-L7-422` F2のSessionStart digest欠落検出は別所有である。422はdraftであり、requiresに昇格せず referencesとして境界照合のみ行う。
- 実CLIの `requireRuntimeRepoRoot` がroot解決を拒否した場合にevent appendが0件であることを、負系CANDIDATE-U-835-002で確認する。`requireProjectMemoryRoot`/HEAD identity admissionを実経路として主張しない。

## R2: candidate trace

Forward §5のCANDIDATE-U-835-001..007とCANDIDATE-AT-835-008を、(a) L6-03の既存保証、(b) L7-01の実装者責務、(c) L7-531 AT-DIST-003受入条件へ双方向traceする。既存oracleの再所有が見つかった場合は重複するtest/docを追加せず、参照先を明示してgap-onlyに限定する。

## R3: gap disposition

- 既存L6/L7契約が既に要求している場合は reuse-as-is とし、文言変更やsource-module追加をしない。
- 新しい正規session event orderingの不足が確認された場合に限り、Forwardのbounded pairで観測した差分をL6/L7へbackfill候補として記録し、ownerレビュー後に正規改訂する。
- event-firstだけではtimeout内完走を解かない。comment 6010925970とmeasurement protocol candidateに従うcold/warm各5件以上のphase実測をForward pairへtraceし、律速phaseに対応するdetached-pattern/5s維持またはdigest p95×2/timeout更新を実装・配布受入へtraceする。
- materialize/scan分岐で `spawnDetachedStopRefresh` のDB refresh責務を無検証に再利用しない。5秒維持とhook外移動が成立するentrypoint/責務/競合を実測・レビューする。
- digest分岐はnearest-rank p95、n>=5、sample全件とmsから設定秒へのround-upを証跡化する。15s固定ではなく、phase実測から値を導く。
- 選んだ変更は1 commitでrollback可能にする。detached化なら当該call 1箇所を同期呼び出しへ戻し、timeout引上げなら配布settingsのtimeout値1つを戻す。AT失敗時はrollbackして同じ条件で再計測する。
- cold/warm各5件以上のすべてで、`CLAUDE_CODE_ENTRYPOINT=claude-vscode` の実VS Code consumer起動、設定timeout内exit0・cancelなし・event全件・digest出力が確認できない限りIssue close不可。端末直叩きを受入証拠にしない。
- PLAN-L7-422のdigest欠落可視化は除外し、findingを本Reverseへ移管/再宣言しない。

## R4: Forward reentry

Forward再合流はPLAN-L7-531 r11の所有面へ戻す。必要なAT-DIST-003差分は、正規Pack配布settingsを使い、同一session ID・実timeout・cold/warm・正常exit・durable startを一つの受入記録へ束縛する。5秒失敗の既存結果はhistoryとして残し、成功証跡で上書きしない。別consumer設定、mock、手書きmarker、イベント順序unit testのみではForward close不可。

## R4 exit / status

Reverse候補自身はdraft/R0から開始する。R0-R4のレビュー結果を揃えるまではconfirmedにしない。上流要件改訂が不要ならgap-only/no-backfillの根拠を記録し、必要な場合も既存L6/L7 ownerの承認後に別の正規revisionとして処理する。Forwardの契約/pair非著者PASS・通常admission/confirmは実装前gate、全runのcold/warm実配布acceptanceは実装後のIssue close gateとして区別する。
