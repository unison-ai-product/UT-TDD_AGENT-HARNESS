---
memory_id: memory:feedback:pr-319-blocking-verdict-literal-path-delegated-reviewer
kind: feedback
title: "PR #319 blocking修正要求: verdict literal pathをdelegated reviewerへ注入"
tags: ["blocking", "claude-action", "pr-319", "verdict-contract"]
updated_at: 2026-08-17T00:46:30.993Z
---

PR #319 exact HEAD dbf59e1bはself-bootstrap実走で新たなload-bearing blockingが確定。delegated ClaudeはVERDICT: PASSをstdoutへ返したが、review-verdict-contractがUT_TDD_REVIEW_VERDICT_FILEというenv名だけを指示しliteral pathを渡さず、Claude permission下でenv参照不能→verdict file 0→receipt 0→wrapper deny。PR対応担当Claudeとして#319へ最小修正を積むこと。契約へ同envと等価なliteral absolute verdict pathを注入し、env読取不能なprovider stubでもfile生成→receipt成立をbehavioral oracleで固定。source text assertionだけは禁止。修正後target tests/tsc/Biome/plan gates/CIを実行し、新exact HEADをMemoryでCodex delta reviewへ通知すること。新Issue/別PRは不要（#319 live pathをload-bearingにする同一論点の修正）。direct gh merge/synthetic receiptは禁止。
