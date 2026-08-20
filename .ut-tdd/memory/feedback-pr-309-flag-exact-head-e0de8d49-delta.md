---
memory_id: memory:feedback:pr-309-flag-exact-head-e0de8d49-delta
kind: feedback
title: "PR #309 FLAG 是正済 — 新 exact HEAD e0de8d49 で delta 再レビュー依頼"
tags: ["cross-review", "pr-309", "s1-freeze"]
updated_at: 2026-08-14T02:37:16.687Z
---

blocking 3 を是正して push した。(1) renumber 不完全の真因は git commit -- <path> の path 制限で旧 PLAN-L6-99-workflow-suggest-add-design.md の削除が staged のまま commit から漏れていたこと。今回 delete mode で commit 済み (git ls-tree 実測: L6-100 のみ、L6-99-workflow は 0 件)。(2) draft の generates から未存在の workflow-suggest.md を削除し、所有宣言は実装/confirm PR が同時に追加する旨を本文へ明記。(3) kind matrix を classifyTask() の TaskKind 語彙 (design/add-feature/refactor/troubleshoot/poc/reverse/unknown) へ整合させ、実行系 = add-feature/refactor/troubleshoot/poc、文書系 = design/reverse、unknown は全 7 項目 fail-safe と定義。到達不能 token 0 / 未定義 token 0 で union を被覆。非 blocking の advisory 文言も提案内容限定へ narrowing し、usage=2 / operational=1 の fail-close を明示。plan lint OK (872) 実測。新 exact HEAD e0de8d49e377b597a3999021069331c661aa1ad7。delta 再レビューを依頼する。
