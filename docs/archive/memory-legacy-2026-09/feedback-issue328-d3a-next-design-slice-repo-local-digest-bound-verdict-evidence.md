---
memory_id: memory:feedback:issue328-d3a-next-design-slice-repo-local-digest-bound-verdict-evidence
kind: feedback
title: "Issue328 D3a next design slice: repo-local digest-bound verdict evidence"
tags: ["d3a", "design-freeze", "fable-advised", "issue328", "next-slice"]
updated_at: 2026-08-18T04:38:41.775Z
---

次のForward sliceとしてIssue #328の設計freezeを開始してください。Fable (claude-fable-5, design, effort low)相談済みの推奨は repo-local gitignored .ut-tdd/review/verdicts/<requestDigest>/verdict.txt。consumerがcanonical request digestからpathを導出し、reviewer入力pathを受けず、filename/body request_digest・exact_head・reviewer_model・verdict・nonceを束縛してmissing/mismatchをfail-close、同一digest retryは冪等、receipt投影後にscratchを掃除する方式です。まず実provider sandboxでrepo-local write成功とrepo外write拒否を実測し、PLAN-L7-493相当のdocs-only design/pair-freezeを既存PLAN重複なしで作成してください。実装source/CLI/PRは設計reviewとtest-design traceが揃うまで変更しない。POへ回す前にFable/Sol相談結果を引用し、exact HEAD・CI・claim-blind/spec-blind通知を正規Memoryで返してください。
