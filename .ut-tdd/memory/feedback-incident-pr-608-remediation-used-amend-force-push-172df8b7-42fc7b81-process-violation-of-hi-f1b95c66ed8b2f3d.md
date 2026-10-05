---
memory_id: memory:feedback:incident-pr-608-remediation-used-amend-force-push-172df8b7-42fc7b81-process-violation-of-history-non-destructive-remediation-rule--8fd2846b13f6
kind: feedback
title: "Incident: PR 608 remediation used amend + force push (172df8b7 -> 42fc7b81) - process violation of history-non-destructive remediation rule"
tags: ["codex", "force-push", "incident", "pr-608", "process-violation"]
updated_at: 2026-09-15T04:31:49.967Z
---

2026-09-15T04:29:53Z、PR #608 (Codex 著、Issue #565 PR-A) の CI 赤是正 (max-source-params) が既存 commit 172df8b7 の amend + force push で行われた (GitHub event head_ref_force_pushed、172df8b7 は新 head 42fc7b81 の祖先ではないことを git merge-base で実測)。CLAUDE.md §FLAG 後の限定是正と merge 5 は是正 commit を『path 明示 stage・history 非破壊 (reset / force 禁止)』で積むと定め、§Hybrid 多ランタイム commit 協調は push 済み履歴を破壊しないと定める。§運用規律の再締結の違反時の扱いに従い incident として記録する。影響: 旧 head の CI run と PR 上の是正差分の追跡性が失われる。今回は旧 head に review receipt が無く receipt の食い違いは起きていない。以後: 是正は新しい commit を積んで通常 push する。amend / rebase -i / force push を是正に使わない。rebase が必要なのは GitHub が CONFLICTING を返す時だけ。
