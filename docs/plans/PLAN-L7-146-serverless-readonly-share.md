---
plan_id: PLAN-L7-146-serverless-readonly-share
title: "PLAN-L7-146 (impl): 中央 UI を無料 serverless で read-only 共有する将来 track"
kind: impl
layer: L7
drive: fullstack
status: draft
version_target: future
route_signal: version_deferral
route_mode: version-up
created: 2026-06-24
updated: 2026-07-01
owner: PM / PO
parent_design: docs/design/harness/L2-screen/screen-list.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - Cloudflare Pages/Workers/D1 free deploy + GitHub webhook projection sync (read-only)"
  - role: tl
    slot_label: "TL - read-only / S5=b / free-tier guardrail / external hosting boundary review"
generates:
  - artifact_path: docs/plans/PLAN-L7-146-serverless-readonly-share.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L2-03-ui-element.md
  references:
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    - docs/plans/PLAN-L7-204-central-ui-vscode-webview-local.md
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
---

# PLAN-L7-146 (impl): 中央 UI の無料 serverless read-only 共有

## Status

本 PLAN は **future parked** である。中央 UI を複数人で見るための serverless 共有 channel を将来版へ保全するが、現在の L7 配布 close には含めない。

PO 決定 (2026-06-26): 現在の close では clean distribution channel と consumer setup の成立を優先し、中央 UI と hosted sharing は後回しにする。よって本 PLAN は `status: draft` と `version_target: future` を維持する。これは archived ではなく、将来版で再開するための明示保全である。

current close では、Pack に Cloudflare 設定、public URL、webhook、D1/KV state、hosted UI artifact を含めてはならない。

## 背景

中央 UI を team で共有する場合、read-only dashboard を無料 serverless channel で公開する案がある。想定は Cloudflare Pages / Workers / D1 / KV などの無料枠で、Git/GitHub を canonical source にした projection を read-only に表示する形である。

ただし、これは外部 account、hosting、webhook、access control、公開 URL を含むため、現在の local close / clean Pack close の範囲を超える。したがって、ここでは配布方針を記録し、実装は将来版へ保全する。

## Descent

再開時の正規 descent は次の順序とする。

1. L2 screen design と L4 UI standard。
2. PLAN-L7-141 による read-only `src/web` 実装。
3. 本 PLAN による hosted read-only sharing。
4. L10 UX verification と L12/UAT。
5. 必要な場合のみ release / post-deploy telemetry。

L7-141 の read-only UI が成立していない状態で、本 PLAN の hosted sharing を先に実装してはならない。

## Future Scope

再開時に対象とするもの:

- Cloudflare Pages による static SPA hosting。
- Cloudflare Workers Free による read-only API。
- GitHub push webhook と HMAC verification。
- D1/KV 無料枠への projection sync。
- 30秒 polling または定期 reconcile による鮮度管理。
- dashboard 閲覧の最小 access control。
- secret、PII、raw transcript を projection に載せない fail-close。

現在の close で対象外にするもの:

- Cloudflare account / DNS / webhook / public URL setup。
- hosted UI artifact。
- WebSocket / Durable Objects / paid plan 前提の realtime push。
- UI からの edit workflow。
- UI からの direct AI execution。
- Git/GitHub canonical source の置換。
- Pack への external hosting config 同梱。

## Re-Open Acceptance Criteria

この future PLAN を再開する場合は、少なくとも次を証明する。

- read-only UI が PLAN-L7-141 で成立済みである。
- hosted channel は read-only で、S5=b / S-01 / CC2 / ADR-005 D2 を破らない。
- GitHub webhook は HMAC verification を持つ。
- projection は secret、PII、raw transcript を含まない。
- 無料枠で運用できる範囲と、有料化が必要になる閾値が明示されている。
- UAT / release / post-deploy telemetry は current local close と混同せず、外部境界として扱う。

## Current Close Boundary

現在の L7 close では、この PLAN は将来版へ保全された hosted sharing track の記録である。配布 package の成立、consumer setup、clean Pack の境界を優先するため、ここでは実装しない。

この PLAN の存在は full local close を妨げる active draft ではなく、version-up mode による deferred-but-committed-future である。
