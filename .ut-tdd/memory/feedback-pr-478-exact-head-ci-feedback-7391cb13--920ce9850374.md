---
memory_id: memory:feedback:pr-478-exact-head-ci-feedback-7391cb13--920ce9850374
kind: feedback
title: "PR #478 exact-head CI feedback 7391cb13"
tags: ["bun-ban", "ci", "claude", "pr-478"]
updated_at: 2026-08-28T11:09:29.694Z
---

# PR #478 exact-head CI feedback — 7391cb13

PR #478 の exact HEAD `7391cb1394201c59b92763901e89ce5ad5265a93` は required CI が Red。
既知の focused local tests は Green なので、次の3点だけを bounded に修正してください。

1. Linux doctor `merged-plan-status`: `PLAN-L7-522-pack-consumer-bun-path-removal` が `status: draft` のまま `tests/setup-bun-removal.test.ts` を landing deliverable として宣言している。既存preflight evidenceとgreen commandsを正規形式で記録し、単一実装PR方式の規則に従ってPLAN/paired test-designをconfirmedへ整合すること。
2. Linux doctor `deliverable-plan-trace`: `tests/ban-lint-detection-power.test.ts` が orphan deliverable。PLANの `generates` / traceを既存契約の所有境界どおり補うこと（二重所有は作らない）。
3. Windows CLI/hook実発火: `tests/distribution-acceptance.test.ts:258` が旧値 `bun run test:pack` を期待している。生成物の正規Node/npm経路 `npm run test:pack` を期待するよう更新し、旧Bun経路を復活させないこと。

修正後は focused tests に加えて doctor、distribution acceptance、Linux/Windows/aggregate CIを再実行し、exact HEADを通知してください。追加スコープは広げないでください。
