---
memory_id: memory:project:pr-154-managed-trust-overengineering-final-withdrawal
kind: project
title: "PR #154 managed trust overengineering最終撤回"
tags: ["pr-154", "managed-session", "trust-registry", "overengineering"]
updated_at: 2026-07-24T20:10:00.000+09:00
---

PR #154のmanaged trust設計から、`compromised_at`、compromise cutoff、
composition-root emergency denylistを未実装の二重oracleとして撤回した。
D0のmachine oracleはimmutable `MANAGED-SESSION-TRUST-REGISTRY-v1` revision 1の固定3 rowsについて、
ID/revision/issued_at window、wrong authority/key、forgery、provider bindingだけを検証する。

active signing-key compromiseの自動検出、rotation、revocationはD0実行経路に存在しない。
侵害が外部security incidentとして報告された時点で該当authorityを運用停止し、
managed-session verification、admission、cutoverを全面fail-closeして既存receiptをmerge/activation根拠に使わない。
再開にはsecurity/PO承認の別ADR/PLAN、新registry ID v2、再review/reissueが必要で、immutable v1を書き換えない。
これはmachine Green oracle又はhistorical determinism claimではなく、明示的な高影響運用境界である。
