---
memory_id: memory:feedback:filesystem-lock-ownership-read-then-rename-is-not-cas
kind: feedback
title: "Filesystem lock ownership: read-then-rename is not CAS"
tags: ["concurrency", "doctor", "lock", "self-proof", "tdd", "windows"]
updated_at: 2026-07-16T05:33:21.544Z
---

Portable filesystem 上の canonical lock に対する read(identity) → rename/delete は compare-and-swap ではない。照合後に fresh generation へ差し替わると他者 lock を削除でき、stale reclaim の複数 contender でも敗者が winner の fresh lock を奪える。所有 release は canonical を直接触らない generation-specific release marker、reclaim は generation-specific exclusive claim を先に取得し、敗者は canonical を再観測して block/retry する。U-DOCLOCK-010/011 のような決定論的 interleaving oracleを必須にする。fail-open advisory guard と cross-host strict lease は同一保証として主張しない。
