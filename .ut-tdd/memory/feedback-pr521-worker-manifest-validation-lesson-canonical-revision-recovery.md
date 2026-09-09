---
memory_id: memory:feedback:pr521-worker-manifest-validation-lesson-canonical-revision-recovery
kind: feedback
title: "PR521 worker manifest validation lesson canonical revision recovery"
tags: ["plan-revision", "pr521", "windows", "worker-acceptance"]
updated_at: 2026-09-08T02:39:09.675Z
---

2026-09-08 PR521修正時、workerがPowerShellへPOSIX heredoc構文を渡しParserError文字列を未追跡manifestに混入。rootがJSON内容を読みCLI/DB投入前に検出して停止。worker草案を保持し、rootがapply_patchで有効JSONを作成して既存ledgerへ正規plan reviseを実行。Forward/Reverse最終rev7、HEAD62b11c78、admission-checkとlocal114PASS、CI5/5成功。失敗manifest .ut-tdd/plan-revise-521-forward6.json は誤再利用防止のため削除、実際に発行したpr521-r2-forward6/forward7/reverse7.jsonとtracked証跡は保持。今後は実shell確認とJSON.parse検証を通してからCLI投入し、worker報告ではなく正規receiptと差分をTLが検収する。
