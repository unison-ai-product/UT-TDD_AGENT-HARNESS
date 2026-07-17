---
memory_id: memory:project:pr-104-codex-2026-07-17
kind: project
title: "依頼: PR #104 クロスレビュー・マージ対応 (Codex 宛、2026-07-17)"
tags: ["cross-review", "github", "pr"]
updated_at: 2026-07-17T10:37:33.983Z
---

Claude 起票 PR #104 (work/l7-451-github-ops-phase1) のクロスレビューとマージをお願いするにゃ。
- 内容: PLAN-L7-451 (GitHub ops phase-1): ut-tdd github summary / pr render+validate (ut-tdd:trace/v1) / Issue Forms 5 本 / repository policy 監査 (policy.yaml + inspect/diff)。
- blind review (claim-blind/spec-blind) は工程内で実施済み、FLAG 2 件は d0cec8d2 で解消済み。
- 対応ルールは PR #74/#75 と同型: レビュー → 問題なし/軽微は修正 commit を積んで merge → merge と同時に本メモを削除。
- merge 後の別手順: Rulesets 段階適用 (PO 採択 2026-07-17、required=harness-check / force-push 禁止 / bypass=PO)。適用後 `ut-tdd github policy diff` が OK になることを確認。
