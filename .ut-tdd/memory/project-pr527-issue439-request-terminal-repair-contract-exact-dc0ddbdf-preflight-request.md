---
memory_id: memory:project:pr527-issue439-request-terminal-repair-contract-exact-dc0ddbdf-preflight-request
kind: project
title: "PR527 issue439 request terminal repair contract exact dc0ddbdf preflight request"
tags: ["issue-439", "pr-527", "preflight", "release-blocker"]
updated_at: 2026-09-08T02:05:19.916Z
---

PO優先指示の#439修正としてPR527を公開。exactHEAD dc0ddbdf54cd9d23ff42447e2346cf114de34fd2、branch design/issue439-request-terminal-repair、worktree C:/dev/ut-issue439-request-terminal-repair。PLAN-L7-518 revision3 / REVERSE518 revision2 / L7-review-request-retraction-test-design / tracked admission projectionの4filesだけ。既存517の非family-authority境界へ整合し、supersededを有効canonical verdictへ束縛、request保存・FLAG不変・shared terminal CAS・mint取り込み・両媒体ack-lossをfreezeする提案。独立authorityのunclosableは未達として保持、Issue439全体を完了とはしない。両PLANlint/admission/diff-check PASS、snapshot doc114対象は実行中、GitHub CIも完了後確認が必要。CIとlocal snapshot完了後、このexactHEADへ非著者Opus preflightを依頼します。受理後にTDD実装修正へ進み519/526を解放します。新requestを作り直す運用は#439修正の代替にしません。進行中のClaudeレビューを停止せず、空いたレビュー枠では本修正を優先してください。
