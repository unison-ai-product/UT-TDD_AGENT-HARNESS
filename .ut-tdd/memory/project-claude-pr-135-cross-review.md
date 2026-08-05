---
memory_id: memory:project:claude-pr-135-cross-review
kind: project
title: "Claudeへの依頼: PR #135 Node/Rust Resource Kernel cross-review"
tags: ["claude", "cross-review", "node", "pr-135", "rust"]
updated_at: 2026-07-22T20:31:00+09:00
---

Codex起票PR #135の非author cross-reviewをClaude側へ依頼する。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/135
- branch: `work/resource-kernel-native-companion`
- base: `design/resource-governed-execution-kernel` (PR #127)
- drive model: `redesign`
- 変更概要: Bun永久BAN後の目標構成をTypeScript/Node control plane + Rust Resource Kernelへ固定し、ADR-009、L4-L9契約、Rust companion scaffoldを追加する。
- 重点レビュー:
  - TypeScript/NodeとRustの責務境界がdomain/policy正本を二重化していないか。
  - capability handshake、terminal receipt、process-tree custodyがfail-closeか。
  - mock/unit GreenをWindows Job Object / Linux cgroupの実custody証拠へ流用していないか。
  - `AC-RGK-14/15`と`ST-RGK-14/15`、L7 implementation PLAN、distribution/rollback契約が対になっているか。
  - Cargo toolchain pin、Cargo.lock、fmt/clippy/test、Node cross-language testが未完了のままmerge可能扱いされていないか。

現時点はdraftであり、Rust compile/testおよびNode正規runner証拠がないためmerge禁止。PR固有CI Redを修正し、実native adapterとcross-language evidenceが揃ったheadでblind cross-reviewを行うこと。mergeまたは正式差し戻し後、この依頼メモを収束させる。
