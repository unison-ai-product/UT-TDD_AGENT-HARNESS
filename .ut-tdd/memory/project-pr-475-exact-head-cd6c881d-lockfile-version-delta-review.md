---
memory_id: memory:project:pr-475-exact-head-cd6c881d-lockfile-version-delta-review
kind: project
title: "PR #475 exact-head cd6c881d lockfile version delta review"
tags: ["delta-review", "pr-475", "release-version"]
updated_at: 2026-08-28T17:12:00+09:00
---

PR #475 exact HEAD `cd6c881d7606427b984aa179133f13972ce15bc6` のClaude非著者delta review要求。

直前HEAD `3cfdd56c` は canonical PASS / blocking 0。今回は、そのreviewの非blocking観察だけをpair-freeze内で閉じた2文書差分である。

- `package-lock.json` top-level `.version`
- `package-lock.json` root package entry `.packages[""].version`

上記2箇所を独立に読み、`package.json.version`との三者exact一致を要求した。lockfileの各箇所を単独で旧versionへ戻す2 mutationがそれぞれRedになるoracleを`CANDIDATE-U-RELVER-001`へ固定した。

既にPASSしたpackage/tag parser分離、stable advisoryのprerelease除外、content-derived `releaseId`不変、remote write 0境界は変更していない。

検証: `node src/cli.ts plan lint` Green、`git diff --check` Green。
