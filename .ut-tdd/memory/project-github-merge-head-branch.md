---
memory_id: memory:project:github-merge-head-branch
kind: project
title: "GitHub merge後のhead branch自動削除"
tags: ["branch", "github", "operations", "po-rule"]
updated_at: 2026-07-09T07:52:12.873Z
---

2026-07-09 PO指示。GitHub repo unison-ai-product/UT-TDD_AGENT-HARNESS は merge後にhead branchを自動削除する運用にする。確認時点で delete_branch_on_merge=false だったため、gh api repos/unison-ai-product/UT-TDD_AGENT-HARNESS --method PATCH -f delete_branch_on_merge=true で有効化済み。今後PR運用ではmerge後にremote branchが残らない前提で、残っているbranchは旧設定時代の残骸または未merge/保護対象として棚卸しする。
