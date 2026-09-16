---
memory_id: memory:project:engine-swap
kind: project
title: "engine-swap右肩と大型残課題の実装順序"
tags: ["document-ledger", "engine-swap", "g8", "semantic-assessment"]
updated_at: 2026-07-16T03:10:10.554Z
---

再監査でengine-swap L8-L14専用evidenceは未作成、163 semantic itemは全件pending_review、921 repository docs disposition ledgerは未実装と確定。優先順: (1) G8専用EngineSwapEvidenceManifest/verifierを実装し旧G8 manifestの偽Greenをengine-swap判定から隔離、(2) PLAN-L7-424のsemantic-assessment bounded contextで163件を全件入力として133 core_review自動証跡照合と30 human_requiredを区別、(3) PLAN-L7-422のdocument-dispositionでGit object baseline snapshot/strict manifest/pure validatorから開始、(4) L8-L14実証とmemory圧縮。
