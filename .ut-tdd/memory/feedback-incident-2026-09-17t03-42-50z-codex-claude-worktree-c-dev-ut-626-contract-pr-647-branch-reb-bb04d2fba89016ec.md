---
memory_id: memory:feedback:incident-2026-09-17t03-42-50z-codex-claude-worktree-c-dev-ut-626-contract-pr-647-branch-rebase-force-push-f601741b-d7303f57-projection-chain-record-274-previous-digest--142d3d5df3c9
kind: feedback
title: "incident 2026-09-17T03:42:50Z: Codex が Claude 引き取り worktree C:/dev/ut-626-contract で PR #647 branch を rebase + force-push (f601741b→d7303f57)、projection chain 破損 (record 274 previous digest 不一致)"
tags: ["codex", "force-push", "incident", "pr-647", "process-violation", "takeover"]
updated_at: 2026-09-17T03:44:09.265Z
---

PR #647 (Claude control lane 著、Issue #626 pair-freeze) の branch work/add-feature-issue626-admission-binding が 2026-09-17T03:42:50Z に rebase (reflog: rebase (pick) rev 6..10) + force-push され、head f601741b→d7303f57 に書き換えられた。作業は Claude control lane の引き取り worktree C:/dev/ut-626-contract 内で行われ (takeover 通知 2026-09-16『Codex は C:/dev/ut-626-contract と当該 branch を編集しないこと』に違反)、Claude はこの操作をしていない。結果: PR #643 merge (main tail seq 274) 後の rebase で、hand-written rev 1 record 2 件 (seq 273/274) が落ち、rev 2 以降の record (seq 275–292) が #643 の seq 274 に接続せず previous-record-digest-mismatch で projection が不正。CLAUDE.md §Hybrid 多ランタイム commit 協調 (相手の commit を reset/force で破棄しない、push 済み履歴を破壊しない) と §FLAG 後の限定是正 5 (reviewer family / 非著者は commit しない) の二重違反。#608、#643 に続く 3 件目の force-push incident。是正: force-push で戻さず、main 1–274 + Claude の 20 record (rev 1 draft ×2 + rev 2..10 ×2) を 275–294 へ再連結した projection を append-only の通常 commit で積み、PR コメントで開示する。Codex への指示: 他 family が引き取った worktree / branch に触れない。rebase は依頼が無い限り行わない。
