---
plan_id: PLAN-L7-219-gate-phase-elicitation-guide
title: "PLAN-L7-219 (impl): gate 確認対象のフェーズ別エリシテーション・ガイド強化 — 将来 track"
kind: impl
layer: L7
drive: agent
status: draft
version_target: future
route_signal: version_deferral
route_mode: version-up
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: po
    slot_label: "PO - gates.md 確認対象列の粒度拡張要否と再開タイミングの採否"
  - role: tl
    slot_label: "TL - 既存 gate-design.md / gates.md / Safety Boundaries との二重管理・AskUserQuestion 再燃リスクの設計レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-219-gate-phase-elicitation-guide.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-REVERSE-01-process-docs.md
  references:
    - docs/process/gates.md
    - docs/governance/gate-design.md
    - docs/plans/PLAN-L7-124-route-approval-gate.md
    - docs/plans/PLAN-L7-128-route-escalation-boundary-gate.md
---

# PLAN-L7-219 (impl): gate 確認対象のフェーズ別エリシテーション・ガイド強化

## Status

本 PLAN は **future parked** である。「設計/実装の各フェーズでエージェントが PO に何を確認すべきか」を明文化するガイドの拡張を将来版へ保全するが、現時点では実装しない。

PO 決定 (2026-07-02): 現時点で `docs/process/gates.md` の確認対象列を厚くする改修は着手せず、`status: draft` + `version_target: future` として保全する。これは archived ではなく、将来必要になった時点で再開するための明示保全である。

## 背景

チャットで「ユーザーと AI が安全に設計/実装を進めるための、各フェーズでエージェントが聞くべきガイダンスガイド」の要否を PO から問われた。調査の結果、以下が既に機械的に存在することを確認した。

- `docs/process/gates.md` の G0.5-G7 表 (L 遷移ごとの確認対象・承認者・fail 時動作)。
- `CLAUDE.md` Safety Boundaries (認証/認可/決済/PII/ライセンス/破壊的操作/本番インフラ/外部 API 前提変更のエスカレーション必須カテゴリ)。
- 確認ゲート前の `review_evidence` 必須化。

一方で `gates.md` の確認対象列はフェーズ単位で粗く、「具体的に何を聞くべきか」までは踏み込んでいない。ここを厚くする改修が候補として浮上したが、以下のトレードオフから今回は見送りとした。

- 新規ガイド文書を別立てすると `gates.md` と二重管理になりズレるリスクがある。
- 自由記述の「対話で聞くべきことガイド」は [[feedback_no_askuserquestion_no_gap_numbers]] で PO が既に拒否した AskUserQuestion / 番号立て質問パターンを暗黙に呼び込みやすい。

## Descent

再開時の正規 descent は次の順序とする。

1. `docs/governance/gate-design.md` / `docs/process/gates.md` の現行確認対象列の再読と、実際に PO 確認漏れが発生したフェーズの具体事例の洗い出し。
2. 洗い出した事例を `gates.md` の該当 G-gate 行の確認対象列へ追記する形で反映する (新規ガイド文書は作らない)。
3. 追記が prose に留まらず機械強制まで必要な場合のみ、既存の `review_evidence` / confirmation gate 系 lint (`PLAN-L6-17-gate-confirm` 系統) の拡張を検討する。

## Future Scope

再開時に対象とするもの:

- `gates.md` 確認対象列の記述をフェーズ単位でより具体的にする加筆。
- Safety Boundaries カテゴリと `gates.md` 確認対象列の対応関係の明示 (重複していないか、抜けがないか)。

対象外にするもの:

- 新規の独立したガイド文書の新設。
- AskUserQuestion tool を使った対話フローや、番号付き gap 提示の再導入。
- gates.md の承認者・fail 時動作の構造自体の変更 (今回のスコープは確認対象列の粒度のみ)。

## Re-Open Acceptance Criteria

この future PLAN を再開する場合は、少なくとも次を示す。

- `gates.md` の確認対象列の粒度不足によって実際に PO 確認漏れ・手戻りが発生した具体事例があること。
- 追記内容が `CLAUDE.md` Safety Boundaries および既存 `review_evidence` 規律と重複・矛盾しないこと。
- AskUserQuestion / 番号立て質問パターンを再導入しない設計であること。

## Current Close Boundary

現在の close では、この PLAN は将来版へ保全されたフェーズ別確認ガイド強化 track の記録である。既存の `gates.md` / Safety Boundaries / review_evidence 規律で当面は足りるため、ここでは実装しない。

この PLAN の存在は full local close を妨げる active draft ではなく、version-up mode による deferred-but-committed-future である。
