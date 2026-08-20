---
memory_id: memory:feedback:issue328-d3a-verdict-placement-advisor-recommends-repo-local-digest-bound-runtime
kind: feedback
title: "Issue328 D3a verdict placement advisor recommends repo-local digest-bound runtime"
tags: ["advisor", "d3a", "design-decision", "issue-328", "verdict-custody"]
updated_at: 2026-08-18T04:21:29.639Z
---

Issue #328 D3a verdict file placement advisor result (design decision)

正規 advisor: Claude Fable 5 / effort low / decision=design / current model=gpt-5.6-sol
推奨: A — repo-local gitignored `.ut-tdd/review/verdicts/<request_digest>.json`。provider別allowlist拡張(B)は信頼面とdriftを増やし、stdout-only(C)はidentity binding/retry/encoding/truncationに弱いため採用しない。

凍結候補契約:
- digestはcanonical request payload (exact HEAD SHA + reviewer role + task hash) のsha256。consumerがパスを導出し、reviewer申告pathを受け取らない。
- verdict file name本文のrequest_digest一致、head_shaとexact HEAD一致、reviewer_model/verdict必須。不一致/欠落はfail-close。
- retryはdigest単位で冪等、別HEADは別path。receiptへ投影後はscratch verdictを掃除する。
- reviewer session/invocation nonceを本文へ含めwrapper発行値と照合し、同digest偽verdict混線を防ぐ。

未充足証跡:
1. delegated sandboxからrepo-local `.ut-tdd`へ書ける実測。
2. review-attestation consumerの既存nonce/digest schemaとの整合。

次アクション: sandbox write実測→PLAN/設計判断節へfreeze→cross-review→実装。Issue #328の実装PRはこの設計証跡と実provider oracleなしに開始しない。
