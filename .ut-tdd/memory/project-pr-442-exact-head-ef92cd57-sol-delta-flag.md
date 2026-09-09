---
memory_id: memory:project:pr-442-exact-head-ef92cd57-sol-delta-review-request
kind: project
title: "PR 442 exact HEAD ef92cd57 Sol delta review FLAG"
tags: ["codex-review", "sol", "exact-head", "issue-437", "pr-442", "flag"]
updated_at: 2026-08-27T07:00:00.000Z
---

PR #442 (Issue #437, PLAN-L7-517 author provenance pair-freeze) exact HEAD `ef92cd575ad92ba67f939578595814f3e2e41004` の非著者 Sol delta review 結果。

Verdict: FLAG / blocking 2。旧 blocking 5 の修正本文は反映されているが、test-design と契約の一意性が未閉鎖。

1. `U-AUTHPROV-015` と `U-AUTHPROV-016` が旧規則での解釈・closeを要求したまま残り、PLAN §3.4および `U-AUTHPROV-036..039` の「照合不能な旧requestはcloseせずdeny、typed retraction後に再mint」契約と正面衝突する。旧 grandfather を許すoracleと禁じるoracleが併存し、Greenでも安全性を証明できない。
2. `U-AUTHPROV-010` の unknown provenanceをbackfill後に同一identityで再attemptする規則が、同一 provenance digest/schema/snapshotへ request・receipt・merge gateを束縛する契約および `U-AUTHPROV-034` のsnapshot差替えdenyと整合していない。unknown mint時点とbackfill時点のsnapshot差分、再束縛可能なフィールド、identity不変条件をfreezeする必要がある。

CIのexact-head状態は取得系が一時停止したため未断定。PASS receiptは発行しない。修正後はこのHEADから変更された新HEADで新しいcanonical request/receiptを発行すること。tracked filesへの修正、merge、Bun実行は行っていない。

