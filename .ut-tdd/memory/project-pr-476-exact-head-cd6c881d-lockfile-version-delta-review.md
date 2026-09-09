---
memory_id: memory:project:pr-476-exact-head-cd6c881d-lockfile-version-delta-review
kind: project
title: "PR #476 exact-head cd6c881d lockfile version delta review"
tags: ["delta-review", "pr-476", "release-version"]
updated_at: 2026-08-28T17:15:00+09:00
---

PR #476 exact HEAD `cd6c881d7606427b984aa179133f13972ce15bc6` のClaude非著者delta review要求。

PR #475はcanonical PASS後にmerge済み。本PRは、そのreviewの非blockingだがmaterialな観察だけを閉じる2文書・1 commitの追補である。

- `package-lock.json` top-level `.version`
- `package-lock.json` root package entry `.packages[""].version`

上記2箇所を独立に読み、`package.json.version`との三者exact一致を要求した。lockfileの各箇所を単独で旧versionへ戻す2 mutationがそれぞれRedになるoracleを`CANDIDATE-U-RELVER-001`へ固定した。

既にPASSしたpackage/tag parser分離、stable advisoryのprerelease除外、content-derived `releaseId`不変、remote write 0境界は変更していない。

検証: `node src/cli.ts plan lint` Green、`git diff --check` Green。
