---
plan_id: PLAN-L7-141-web-dashboard-component-derived
title: "PLAN-L7-141 (impl): src/web 中央 UI 再実装 — ui-element §2 設計部品から降ろす component-derived 15画面"
kind: impl
layer: L7
drive: fe
status: draft
version_target: future
route_signal: version_deferral
route_mode: version-up
created: 2026-06-24
updated: 2026-07-01
owner: PM / PO
parent_design: docs/design/harness/L2-screen/screen-list.md
supersedes:
  - PLAN-L7-102-web-dashboard-phase-b
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - ui-element §2 の設計部品から src/web 中央 UI を component-derived に再実装する"
  - role: tl
    slot_label: "TL - read-only / screen-impl-pair-freeze / L2-L4-L6-L10 descent review"
generates:
  - artifact_path: docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L2-03-ui-element.md
  references:
    - docs/plans/PLAN-L7-102-web-dashboard-phase-b.md
    - docs/plans/PLAN-L7-146-serverless-readonly-share.md
    - docs/plans/PLAN-L7-204-central-ui-vscode-webview-local.md
---

# PLAN-L7-141 (impl): src/web 中央 UI 再実装 (component-derived)

## Status

本 PLAN は **future parked** である。中央 UI の実装 track を将来版へ保全するが、現在の L7 配布 close には含めない。

PO 決定 (2026-06-26): 現在の close では clean distribution channel と consumer setup の成立を優先し、中央 UI 実装は後回しにする。よって本 PLAN は `status: draft` と `version_target: future` を維持する。これは archived ではなく、将来版で再開するための明示保全である。

current close では、Pack に `src/web` UI runtime、画面実装、Webview extension、hosted deployment artifact を含めてはならない。`status --json` では `versionUpParked` として残るが、active draft ではない。

## 背景

`PLAN-L7-102-web-dashboard-phase-b` が作った `src/web` prototype は、L2 `ui-element` §2 の設計部品から降りた UI ではなく、`harness.db` を直接 `SELECT` して表を描く table-dumper だった。中央 UI の目的は工程管理表や設計状態を製品として見せることであり、DB table の露出ではない。

そのため L7-102 は archived とし、本 PLAN が後継として component-derived な 15 画面実装を保全する。

## Descent

再開時の正規 descent は次の順序とする。

1. L2 screen design: `screen-list.md`、`screen-flow.md`、`wireframe.md`、`ui-element.md`。
2. L4 FE standard: `ui-standard.md` と `tokens.yaml`。
3. L6 screen/function design: per-screen 仕様と component 使用条件。
4. L7 implementation: `src/web` の read-only UI。
5. L10 UX verification: 実装後の a11y / visual / WCAG 検証。

L4 FE standard 到達前に `implemented_screens` を立ててはならない。premature implementation claim は `screen-impl-pair-freeze` が fail-close する。

## Future Scope

再開時に対象とするもの:

- 15 画面を L2 `ui-element` §2 の部品から構成する。
- table-dumper prototype ではなく、screen ID と component contract に基づく rendering を行う。
- UI は read-only を維持する。
- CLI copy / next-action 表示など、S5=b の範囲に収まる操作だけを扱う。
- `src/web`、`cli web`、`tests/web.test.ts` を必要に応じて再設計する。
- 実装済み宣言は L4/L6 設計と trace が揃った後に限る。

現在の close で対象外にするもの:

- UI runtime の Pack 同梱。
- screen implementation claim。
- hosted UI / Webview extension / Cloudflare 配布。
- UI からの edit workflow。
- UI からの direct AI execution。
- L2/L4/L6/L10 を bypass した画面再発明。

## Re-Open Acceptance Criteria

この future PLAN を再開する場合は、少なくとも次を証明する。

- 15 画面が L2 screen design と L4 UI standard から降りている。
- table-dumper rendering が存在しない。
- `screen-impl-pair-freeze` が green である。
- `implemented_screens` の宣言が設計・実装・検証証跡と一致している。
- UI は read-only で、S5=b / S-01 / CC2 を破らない。
- L10 UX verification は実装後に実レンダリングで行う。

## Current Close Boundary

現在の L7 close では、この PLAN は将来版へ保全された UI implementation track の記録である。配布 package の成立、consumer setup、clean Pack の境界を優先するため、ここでは実装を進めない。

この PLAN の存在は full local close を妨げる active draft ではなく、version-up mode による deferred-but-committed-future である。
