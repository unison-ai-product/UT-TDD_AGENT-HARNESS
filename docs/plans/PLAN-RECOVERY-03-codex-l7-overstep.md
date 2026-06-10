---
plan_id: PLAN-RECOVERY-03-codex-l7-overstep
title: "PLAN-RECOVERY-03 (recovery): Codex の未承認 L7 実装着手逸脱"
kind: recovery
layer: cross
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: aim
    slot_label: "AIM - Recovery 事象分類と再発防止設計"
  - role: tl
    slot_label: "TL - reopen point 判定と技術的ロールバック確認"
  - role: po
    slot_label: "PO - Recovery scope / closure approval"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-03-codex-l7-overstep.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/process/modes/recovery.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - .ut-tdd/audit/A-124-cross-artifact-graph-tooling.md
    - .ut-tdd/audit/A-125-mcp-external-verification-profile-scope.md
    - docs/plans/PLAN-REVERSE-31-codex-l7-overstep.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: PO/directive
    review_kind: human
    tests_green_at: "2026-06-09T00:00:00+09:00"
    reviewed_at: "2026-06-09T00:00:00+09:00"
    verdict: approve
    scope: "User directed that the overstep is a Recovery ticket and must be returned through Reverse/fullback instead of ad-hoc implementation."
---

# PLAN-RECOVERY-03 (recovery): Codex の未承認 L7 実装着手逸脱

> **approval state**: PO scope approval is provided by the user directive: the overstep is a Recovery ticket and must be returned through Reverse/fullback. This PLAN is confirmed for correction routing, but not closed.

## §1 事象記録

- **timestamp**: 2026-06-09
- **trigger classification**: Recovery trigger (b) 逸脱/オーバーステップ + (d) agent_runaway 相当。
- **事象**: ユーザーが「docs/code/DB 依存関係を検出できるか」を確認した流れで、Codex が L6 機能設計 / L7 PLAN / TDD Red entry を切らずに `src/lint/relation-graph.ts` を追加した。
- **問題**: A-124/A-125 は横断 relation graph / DB projection / MCP verification profile の scope 起票と一部 profile 実装であり、DB-backed relation graph 本体は future L6/L7 PLAN として明示されていた。したがって source 実装へ進むには正式な L6/L7 entry が必要だった。
- **即時封じ込め**: `src/lint/relation-graph.ts` は直後に削除済み。未承認 L7 実装は残さない。

## §2 誤りの訂正

| 誤った扱い | 正しい扱い |
|---|---|
| 「依存関係検出の話なので、その場で relation graph 実装へ入る」 | 既存 A-124/A-125 の scope と backlog を確認し、L6/L7 PLAN を切る前は設計・起票・Recovery 証跡に留める |
| 「小さい未配線ファイルなら仮実装してよい」 | `src/**` 追加は L7 実装着手。TDD Red entry / parent design / pair artifact / review evidence が必要 |
| 「active goal 継続のため実装で前進する」 | active goal があっても、工程ゲートを越える場合は Recovery / Reverse / Add-feature の正規ルートを優先する |

## §3 reopen point

- **reopen point**: L6/L7 process boundary。
- **理由**: 要求や A-124/A-125 の scope 自体は誤っていない。誤りは「L7 に入る前の工程判定」と「未承認実装の封じ込め」にある。
- **通常化ルート**:
  1. 本 Recovery PLAN を起票する。
  2. 未承認 source 実装を残さない。
  3. 再発防止を improvement backlog / Reverse / Forward へ正式登録する。
  4. relation graph 本体は A-124 / IMP-118..120 の future L6/L7 PLAN で扱う。

## §4 再発防止

- PLAN / audit / backlog の `future L6/L7` 明記がある scope では、source 追加前に parent L6 design と L7 PLAN の有無を確認する。
- `src/**` 追加が発生した場合、active PLAN が `kind=impl|add-impl|refactor|retrofit|troubleshoot` かつ L7 相当でないなら、doctor / plan-lint が警告または fail-close できるようにする。
- relation graph / DB projection は `harness.db` の authoring source ではなく rebuildable projection であるため、collector 実装前に schema / impact rules / evidence paths を L6 で固定する。

## §5 exit 条件

Recovery close には以下が必要。

- [x] 未承認 source 実装の撤去。
- [x] Recovery PLAN 起票。
- [x] PO classification / scope approval。
- [x] TL reopen point 確認。
- [x] 再発防止 backlog / Reverse 登録。
- [x] requirements §6.8.8 / Recovery 台帳への fullback。
- [ ] PO closure approval。
- [ ] 必要なら plan-lint / doctor hardening の L6/L7 PLAN 化。

本 PLAN は correction routing として **confirmed**。Recovery close は Reverse / backlog 登録と PO closure approval 後にのみ行う。
