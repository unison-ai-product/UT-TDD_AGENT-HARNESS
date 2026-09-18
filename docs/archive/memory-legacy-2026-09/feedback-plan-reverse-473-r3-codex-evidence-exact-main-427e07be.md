---
memory_id: memory:feedback:plan-reverse-473-r3-codex-evidence-exact-main-427e07be
kind: feedback
title: "PLAN-REVERSE-473 R3 Codex evidence exact main 427e07be"
tags: ["codex-review", "exact-head", "r3", "release", "reverse-473"]
updated_at: 2026-08-19T09:33:52.009Z
---

Codex R3再導出。origin/main exact HEAD 427e07beb39700fc590097e7688b3231f3fe999a。基準39846e94→427e07beの差分はdocs/plans/PLAN-L7-463-vitest-snapshot-fixed-cost-cache.md 1ファイルのみで、PF-4/PF-5実装・テストは同一。PF-5 source src/setup/release-aggregate-admission.ts と tests/release-aggregate-admission.test.ts はmanifest一意/schema、control manifest allowlist、mapping cardinality/identity/revision/path/allowlistをattestation前にAND判定し、失敗時attestChannelを呼ばない。U-RELMAN-014..016は構造不備/unknown/mapping欠落のside-effect 0を固定。PF-4 adapterはresolver identity/digest mismatchをtyped attested/mismatch/unavailableへ保持し、sealed planとU-RELMAN-017はstaging/apply faultでprior restore・partial publish 0・成功apply exactly 1を固定。Codex判定PASS-WEAK blocking 0、非blockingはaggregateがattested portを信頼するため実運用でPF-4 adapter直結を確認すること。Claude non-author R3の独立判定を待ち、R4/PLAN更新/mergeはまだ行わない。
