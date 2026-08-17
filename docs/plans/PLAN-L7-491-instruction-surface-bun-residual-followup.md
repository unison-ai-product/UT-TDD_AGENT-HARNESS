---
plan_id: PLAN-L7-491-instruction-surface-bun-residual-followup
title: "PLAN-L7-491 (troubleshoot): 残存 instruction surface の Bun 実行形撤去"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
status: confirmed
created: 2026-08-17
updated: 2026-08-17
backprop_decision: not_required
backprop_decision_reason: "既存の Node 一本化方針を未対応の instruction surface へ適用する純修理であり、新規外部契約は追加しない。"
owner: PM
agent_slots:
  - role: aim
    slot_label: "AIM - instruction surface と既存 rule-drift の検査境界を確定する"
  - role: tl
    slot_label: "TL - 実行形判別と real-repo fail-close oracle をレビューする"
  - role: se
    slot_label: "SE - command 定義・PR template・rule-drift を同一論点で修正する"
generates:
  - artifact_path: docs/plans/PLAN-L7-491-instruction-surface-bun-residual-followup.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/build.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/code-simplify.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/test.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/ut-tdd-test.md
    artifact_type: markdown_doc
  - artifact_path: .github/PULL_REQUEST_TEMPLATE.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/lint/rule-drift.ts
    artifact_type: source_module
  - artifact_path: tests/rule-drift.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md
  requires:
    - PLAN-L7-462-bun-runtime-withdrawal
  blocks: []
  references:
    - docs/plans/PLAN-L7-488-instruction-surface-bun-residual.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/326
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/134
github_issue_id: 326
review_evidence: []
---

# PLAN-L7-491: 残存 instruction surface の Bun 実行形撤去

## §0 位置づけ

`PLAN-L7-462` が Node 一本化の実行系を閉じ、`PLAN-L7-488` / Issue #322 が adapter
文書3枚を是正した後も、AI ランタイムと開発者が読む `.claude/commands/` および
`.github/PULL_REQUEST_TEMPLATE.md` に Bun 実行形が残っている。本 PLAN は Issue #326
だけを所有し、#134 の production runtime / test / hook / Pack 全面撤去は引き取らない。

## §1 設計契約

- 実行指示は `npm run <script>` または `node src/cli.ts ...` に統一する。
- 対象は `.claude/commands/*.md` と `.github/PULL_REQUEST_TEMPLATE.md` の実在ファイルだけ。
  archive・incident 記録・Bun を説明する散文は変更も検出対象化もしない。
- 新しい checker は作らず、既存 `src/lint/rule-drift.ts` の instruction-surface 読み込みを拡張する。
- `bun` 実行形を対象 surface へ追加する mutation は `ok=false` へ収束し、実 repo の全対象
  surface が clean であることを regression test で固定する。

## §2 工程

1. **pair-freeze**: 本 PLAN と対象ファイル集合、U-RDRIFT-009/010 の oracle を固定する。
2. **implement + trace-freeze**: 指示形を Node/npm へ置換し、rule-drift の loader と production
   doctor 配線を維持したまま real-repo test を追加する。
3. **review**: exact HEAD、CI、PLAN revision を別 runtime の closing review へ渡す。

## §3 DoD

- [ ] 対象 `.claude/commands/*.md` と PR template に Bun 実行形が 0 件。
- [ ] 対象ファイル集合を loader が実際に読み、削除・除外の mutation は fail-close する。
- [ ] 実行形 (`bun run`, `bun test`, `bunx`, `bun.cmd`, `bun.exe`, path/flag 付き) は検出し、
      散文・過去記録は検出しない。
- [ ] Node/npm 置換後の対象テスト、typecheck、Biome、plan lint、doctor が Green。
- [ ] exact HEAD の Claude non-author closing review PASS と HARNESS Memory 通知がある。

## §4 スコープ境界

`package.json` の Bun engine、`src/`・`tests/`・`scripts/` の Bun 実行経路、Pack/CI の
consumer fixture は Issue #134 / PLAN-L7-462 の後続責務であり、本 PRへ混ぜない。
