---
memory_id: memory:feedback:correction-switch-sol-to-gpt-6-1-sol-immediately-not-after-canary-2-po-2026-09-30--1acaf805aa15
kind: feedback
title: "Correction: switch Sol to gpt-6.1-sol immediately, not after canary.2 (PO 2026-09-30)"
tags: ["correction", "issue-735", "model-routing", "sol"]
updated_at: 2026-09-30T02:46:24.633Z
---

訂正: 先の記録「canary.2 まで gpt-5.6-sol を維持する」は誤り。PO は 2026-09-30 に「精度とコストのほうが重要」とし、review 証跡に世代が混ざることは問題ではないと明言した (receipt は review ごとに reviewer_model を記録し、機械は族分離を見て世代は見ない)。gpt-6.1-sol は即日切替: control lane の Sol review は --model gpt-6.1-sol を明示し、既定値は PR #776 (MODEL_IDS.codex.frontier) で切り替える。教訓: コスト・精度が上がるモデル更新を、根拠のない理屈で先送りしない。
