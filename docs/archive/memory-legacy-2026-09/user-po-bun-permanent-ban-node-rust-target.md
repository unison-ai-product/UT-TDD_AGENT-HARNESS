---
memory_id: memory:user:po-bun-permanent-ban-node-rust-target
kind: user
title: "PO decision: Bun permanent ban and TS/Node + Rust target"
tags: ["bun", "node", "rust", "adr", "runtime", "po-rule"]
updated_at: 2026-07-22T11:22:00.000Z
---

PO決定（2026-07-22）: Bunは永久BANとし、新規依存・新規実行経路を追加しない。既存HARNESSのBun依存は即時削除を偽装せずmigration debtとしてinventory化し、production runtime、CLI orchestration、test runner、hook、配布から段階撤去する。目標構成はTypeScript/Node control plane + Rust Resource Kernel。TypeScriptのdomain/policy/journalを正本とし、Rustはprivileged OS custodyに限定する。既存Bun経路を検証のため再実行する場合も、新しいNode/Rust経路が未成立な移行証拠として扱い、完了状態へ読み替えない。

GitHub正本: Issue #134 `Redesign: retire Bun and migrate control plane to TypeScript/Node + Rust`。drive_model=`redesign`、Forward architecture/implementation chainへの再合流を必須とする。
