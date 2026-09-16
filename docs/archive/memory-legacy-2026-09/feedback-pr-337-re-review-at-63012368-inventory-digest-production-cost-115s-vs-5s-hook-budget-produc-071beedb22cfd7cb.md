---
memory_id: memory:feedback:pr-337-re-review-at-63012368-inventory-digest-production-cost-115s-vs-5s-hook-budget-producer-absent-on-incident-surface-single-event-match-only
kind: feedback
title: "PR 337 re-review at 63012368: inventory digest production cost 115s vs 5s hook budget, producer absent on incident surface, single-event match only"
tags: ["design-freeze", "plan-recovery-11", "pr-337", "review", "snapshot-fence"]
updated_at: 2026-08-19T01:04:27.820Z
---

PR #337 (PLAN-RECOVERY-11 snapshot fence foreign activity) exact HEAD 63012368d577f92e82bcfd3da1f746a648f0c90e に対する Claude non-author closing review: FLAG (blocking 3 / advisory 2)。

解消: 前回 B-1 の duplicate-artifact-ownership は analyzeDeliverableTraceGate 実行で ok=true / findings=[] を実測確認。前回 B-3 (HEAD 移動のみ indeterminate 降格) も残留候補 fail-close へ是正済み。

blocking B-1 = 契約が必須化した「変更後 inventory の digest」の生産コスト未測定。実装は captureWorkspaceInventory (tests/support/git-workspace-fingerprint.ts) しかなく全ファイル内容を hash する。実測: 実開発 tree 14,025 entries / 114,842 ms、clean checkout 2,397 entries / 13,755 ms。producer 面として指名された hook の予算は timeout 5 秒 (.claude/settings.json PostToolUse、.codex/hooks.json 同値) で 2.7〜23 倍超過。かつ「session coordinator」は src/ に実在しない (coordinator は src/state-db/stop-refresh-coordinator.ts の DB refresh 起動役のみ)。

blocking B-2 = 事象発生面に producer が無い。AGENTS.md の scope boundary が hosted API の apply_patch は Codex hook engine を通らないと明記しており、2026-07-16 の実測事象はその面。AC #1 は fixture と直接 CLI/IDE session でしか到達せず、issue #77 は実シナリオで open のまま凍結される。freeze に surface coverage 境界の明記が必要。

blocking B-3 = 単一 event 完全一致のみ定義。full suite は Windows CI 実測 269.31s 走行し、その間に foreign event が 2 件以上起きると和集合/chain 合成規則が無いため常に不一致 fail-close。AC #1 が「foreign event ちょうど 1 件」に暗黙縮退する。event 列の合成規則 (時刻順整列 / 先頭 before_head / 末尾 after inventory / changed_paths 和集合 / 不連続は unknown) は freeze 事項であり実装 PR の裁量にしない。

advisory: exact HEAD の CI は red (harness-check-windows の U-HOOKEXEC-001 が temp dir 削除 EPERM で失敗、run 32135409051)。差分は markdown 2 ファイルのみで Linux pass、直前 head では Windows success のため環境 flake と判断するが green は主張できず再実行要。もう 1 件は「test process が sidecar を書けない権限境界を実測する」の実測方法未定義 (同一ユーザ node プロセス間は OS 権限で分離できない)。

教訓: 契約で必須化するデータ形式は、その生産コストを既存 producer 面の実行予算 (hook timeout 等) と突き合わせて実測してから凍結する。形式の正しさだけを審査すると、実装 PR で方式を発明し直す原因になる。
