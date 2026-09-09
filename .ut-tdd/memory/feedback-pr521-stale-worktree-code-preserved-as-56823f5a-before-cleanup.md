---
memory_id: memory:feedback:pr521-stale-worktree-code-preserved-as-56823f5a-before-cleanup
kind: feedback
title: "PR521 stale worktree code preserved as 56823f5a before cleanup"
tags: ["cleanup", "issue426", "issue487", "worktree"]
updated_at: 2026-09-08T09:51:29.146Z
---

Codex/rootはC:/dev/ut-issue487-bun-final-retirement-contract-v2の既存未コミットコード26pathをarchive/pr521-local-retirement-wip-20260908へ通常commit56823f5aとして保全した。作業ファイル内容の新変更やrollbackなし、hooks迂回なし。実装先d28d1775との照合で15pathが異なるため重複として削除しなかった。これはWIP保全でありadmission・PR・Green・Bun撤去完了の証跡ではない。local runtime DB/Memory/review request/rechain scriptは未削除でこのツリーに残る。review custody等の移設可否とセッション解放が未確認なのでworktree removeは未実施。旧契約branchを実装成果の正本にせず、現行#487実装先は変えない。
