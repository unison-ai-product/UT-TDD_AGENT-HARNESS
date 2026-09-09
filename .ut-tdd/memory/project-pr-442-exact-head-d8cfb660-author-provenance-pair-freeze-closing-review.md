---
memory_id: memory:project:pr-442-exact-head-d8cfb660-author-provenance-pair-freeze-closing-review
kind: project
title: "PR 442 exact HEAD d8cfb660 author provenance pair-freeze closing review"
tags: ["closing-review", "codex-review", "issue-437", "pr-442"]
updated_at: 2026-08-27T09:22:58.858Z
---

PR #442 exact HEAD `d8cfb660cc312c19b38796fc38328812ed0cde3d`。Issue #437 / PLAN-L7-517 の
docs-only pair-freeze (author family 検証契約)。Claude authored、Codex non-author closing review を要請する。

## HEAD が動いた理由 (内容変更ではない)

`cbfb511a` から `d8cfb660` への変化は **`c12184c2` への rebase のみ**。commit 3 本
(`f5fc83b0` pair-freeze / `cb526c86` FLAG blocking 5 反映 / `d8cfb660` r2 FLAG blocking 2 解消) の
内容は同一で、base が #440 / #443 の merge 後 main へ移っただけ。
`cbfb511a` 向けの request `rv1-6d5cf0e4…` は stale_head として `entriesForHead` から脱落する。

## 解消済みの FLAG

`10e62a11` の Sol preflight FLAG blocking 5:

1. trusted provenance issuer / custody 未定義と worker self-backfill → §3.2 で trust root と
   issuer separation を定義し self-backfill を禁止。
2. worker_model / provider / session / family の対応関係欠落 → §3.2.1 に対応表を追加。
3. collision / replay / mutation / TOCTOU が request / attempt / merge に束縛されていない →
   §3.3.1 で 4 攻撃を request digest・attempt・merge gate に束縛。
4. legacy schema が #430 の fail-open を温存 → §3.4 で non-grandfather を明示し、
   typed `unknown` を既定値として fail-close 側へ倒す。
5. mixed contributor family 規則の先送りと pair-freeze 未完 → §3.5 / §3.5.1 で
   contributor family set と双方向性を凍結。

`ef92cd57` の Sol delta FLAG blocking 2:

1. `U-AUTHPROV-015` / `U-AUTHPROV-016` が旧規則での close を要求したまま残り §3.4 と衝突 → 解消。
2. `U-AUTHPROV-010` の unknown backfill 後の再 attempt 規則が snapshot 束縛契約と不整合 → 解消。

## 実測

required CI run `33055204157` Linux 8m13s / Windows 12m52s / aggregate — **3/3 pass**。
PR は non-draft。

この exact HEAD に対する canonical Codex non-author verdict を返すこと。実装・scope 拡大は行わない。
