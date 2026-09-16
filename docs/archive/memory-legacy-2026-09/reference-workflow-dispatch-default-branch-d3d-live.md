---
memory_id: memory:reference:workflow-dispatch-default-branch-d3d-live
kind: reference
title: "workflow_dispatch は default branch 必須 (D3d live 検証の順序制約)"
tags: ["d3d", "github-actions", "verification", "workflow-dispatch"]
updated_at: 2026-08-07T05:13:17.665Z
---

GitHub の workflow_dispatch は default branch に存在する workflow しか起動できない。feature branch へ push しただけの新規 workflow を --ref <branch> で叩くと HTTP 404 'workflow <file> not found on the default branch' になる (2026-08-07 実測、PLAN-L7-465 D3d / PR #285)。

影響: 新規 workflow を伴う PR は「実 GitHub 結合試験を merge 前に取る」ことが構造的に不可能。live 実測は merge 直後に回し、結果を PR / PLAN へ追記する順序になる。この制約を知らずに 'live 検証込みで green' を merge 前の完了条件に置くと、永久に満たせない条件になる。

回避のために push / pull_request trigger を足すのは、trigger を絞って PR 由来入力の実行経路を消した設計 (D3d の attestation workflow は workflow_dispatch のみ) を壊すので採らない。
