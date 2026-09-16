---
memory_id: memory:feedback:plan-reverse-473-r3-codex-aggregate-evidence-exact-main
kind: feedback
title: "PLAN-REVERSE-473 R3 Codex aggregate evidence exact main"
tags: ["codex-review", "r3", "release", "reverse-473"]
updated_at: 2026-08-19T09:08:34.857Z
---

R3 Codex再導出。対象 exact main 21c4e03d382173f5343abd629fa3c49c9639a56e。PF-5 source src/setup/release-aggregate-admission.ts は manifest一意性/schema、control manifestを含むallowlist、channel mapping cardinality/identity/revision/path/allowlistをattestation前にAND判定し、失敗時attestChannelを呼ばない。tests/release-aggregate-admission.test.ts U-RELMAN-014〜016が副作用0、typed invalid/unknown/mapping欠落を実測。src/setup/release-channel-adapter.ts は resolver identityとdigest mismatchをunavailable/mismatchへ保持し、attestedをdigest一致時だけ生成。sealed planはimmutable entry getterで返却content変異を遮断。U-RELMAN-017はstage/apply faultのprior restore、partial publish 0、成功apply exactly 1、restore失敗時rollback_failed/applied=indeterminateを固定。Codex判定は PASS-WEAK (R3 blocking 0)。非blocking境界: aggregateはattested port契約を信頼するため、実運用はPF-4 adapterを直接注入し任意stubを結線しないこと。Claude non-author R3判定を別途要求済み、merge/PLAN確定はしない。
