---
memory_id: memory:project:issue-473-node-generation-contract-gate-start
kind: project
title: "issue-473-node-generation-contract-gate-start"
tags: ["bun-ban", "dispatch", "issue-473", "node-generation", "release-blocker"]
updated_at: 2026-08-28T10:51:33.015Z
---

---
memory_id: memory:project:issue-473-start-node-generation-contract-gate-parallel
kind: project
title: "Issue #473 Node generation contract gateをrelease parallel laneで開始"
tags: ["issue-473", "bun-ban", "node-generation", "release-blocker", "dispatch"]
updated_at: 2026-08-28T19:42:00+09:00
---

Issue #473は#478 S1-bおよびIssue #474 version実装とpath/責務が分離したrelease blockerである。Claude lane（Opus contract gate）で直ちに開始する。

開始順序:

1. latest main `9e8a8a2530fa143cd4c143c57fe31021325cd7c1`をbaselineにする。
2. `PLAN-L6-93-node-bootstrap-contract.md` / `PLAN-L7-458-*` / paired L7 test-designの現状を監査する。
3. draft契約に未解消点がある場合、docs-only pair-freezeを1 Issue=1 PRで先に閉じる。
4. Opusは不変条件・tuple・blocking・閉鎖判定のみを担当し、bounded implementationは規定workerへ渡す。
5. `buildNodeGeneration` / `NodeBootstrapReceipt` / 4要素tuple / CAND-NODEBOOT-023,027,028を契約どおり実装する。
6. sealed receiptとNode parity receipt成立前に`package.json`の`bun build`を撤去しない。

分離境界:

- #478が所有するgenerated consumer Bun pathへ触れない。
- #471が所有するsetup readinessへ触れない。
- #463が所有するconsumer runtime配置を重複実装しない。
- #474が所有するversion identity/update check/publication version bindingへ触れない。

exact-head CIとnon-author canonical receiptを取得し、同一HEADのrequestは1本だけ発行する。レビュー待ちを理由に他release worker laneを停止しない。
