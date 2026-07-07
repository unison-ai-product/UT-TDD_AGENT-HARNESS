---
plan_id: PLAN-L7-204-central-ui-vscode-webview-local
title: "PLAN-L7-204: 中央 UI のローカル VS Code Webview 配布方針"
kind: impl
layer: L7
drive: fullstack
status: draft
version_target: future
route_signal: version_deferral
route_mode: version-up
created: 2026-06-30
updated: 2026-07-01
owner: PM / PO
parent_design: docs/design/harness/L2-screen/screen-list.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - VS Code extension scaffold と local Webview 配布方針"
  - role: tl
    slot_label: "TL - read-only / no-server / low-setup delivery review"
generates:
  - artifact_path: docs/plans/PLAN-L7-204-central-ui-vscode-webview-local.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L2-03-ui-element.md
  references:
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    - docs/plans/PLAN-L7-146-serverless-readonly-share.md
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
---

# PLAN-L7-204: 中央 UI のローカル VS Code Webview 配布方針

## Status

本 PLAN は **future parked** である。中央 UI の近い将来の配布方向を記録するが、現在の L7 配布 close には含めない。したがって、この close cycle で VS Code extension 実装を承認するものではない。

parked する方向性は、ローカル VS Code Webview extension である。

- hosted server を立てない。
- Cloudflare、DNS、webhook、外部 account、public URL setup を要求しない。
- VPS を要求しない。
- UI は read-only に限定する。
- 実装が明示的に再開された場合のみ、L2 screen inventory、L4 UI standard、PLAN-L7-141 の read-only SPA track を再利用する。

## Rationale

直近の配布 close では、clean package と consumer setup の境界を安定させることを優先する。中央 UI をここで実装すると、配布 package の粒度、外部公開環境、consumer setup の単純さを崩しやすい。

VS Code extension は、将来の UI entry point としては低 setup で扱える。一方で、現在の close を deployment / hosting track に変えてしまわないため、ここでは方向性だけを保全する。

PLAN-L7-146 は、複数人が同じ read-only UI を見る必要が具体化した場合の Cloudflare 無料枠共有 channel として別 future track に残す。VPS hosting は本 PLAN の範囲外である。

## Future Scope

再開時に対象とするもの:

- TypeScript による VS Code extension host scaffold。
- VS Code resource isolation を使う Webview panel または sidebar view。
- strict Content Security Policy。
- `ut-tdd ... --json` command または `.ut-tdd/harness.db` からの local read-only data feed。
- extension host から Webview への `postMessage`。
- HTTP server なしの動作。
- secret、PII、raw transcript を含まない payload。
- 既存 UT-TDD screen の read-only rendering。

別の承認済み要求変更がない限り対象外にするもの:

- UI からの edit workflow。
- UI からの direct AI execution。
- server、public URL、Cloudflare、DNS、webhook、auth、VPS deployment。
- Git/GitHub を canonical source として扱う方針の置換。
- L2/L4/L6/L10 の設計・検証経路の bypass。

## Re-Open Acceptance Criteria

この future PLAN を再開する場合は、少なくとも次を証明する。

- setup が VS Code extension の install または sideload に限定されている。
- hosted service なしで UI が動く。
- extension が read-only のまま維持される。
- data flow が local で、secret、PII、raw transcript を scrub している。
- 実装が ad hoc な画面再発明ではなく、L2 screen design と L4 UI standard から descent している。
- extension smoke evidence と通常の UT-TDD gate を含む検証がある。

## Current Close Boundary

現在の L7 close では、このファイルは future parked plan の記録に限る。実装済み UI として扱ってはならない。配布 package に UI runtime、Webview extension、hosted deployment artifact を含めてはならない。

`status --json` 上は `versionUpParked` として残るが、これは「将来版へ明示保全された未実装 UI track」であり、current local close の active draft ではない。
