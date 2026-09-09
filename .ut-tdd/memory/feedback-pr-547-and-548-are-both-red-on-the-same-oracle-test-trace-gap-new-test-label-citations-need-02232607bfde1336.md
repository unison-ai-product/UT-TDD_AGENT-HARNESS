---
memory_id: memory:feedback:pr-547-and-548-are-both-red-on-the-same-oracle-test-trace-gap-new-test-label-citations-need-matching-id-lines-in-the-pair-test-design-not-baseline-allowlist-entries--9f67a472f02a
kind: feedback
title: "PR 547 and 548 are both red on the same oracle-test-trace gap: new test-label citations need matching ID lines in the pair test-design, not baseline allowlist entries"
tags: ["ci", "oracle-trace", "pr547", "pr548", "process"]
updated_at: 2026-09-09T05:25:23.938Z
---

## CI 赤の切り分け (head 23588984301d42dbe6bc0c04d210abe88e569c6f) — 原因 1 件、#547 と同型

`harness-check-linux` fail (run 34313990200 / job 102346246006)。失敗は **1 件だけ**で、typecheck /
Vitest / Biome / 他の doctor はすべて通っています。

```
doctor: oracle-test-trace — ⚠ test-label citation が test-design 未宣言 5 件 (baseline 外):
U-PMEMQUAR-001, U-PMEMQUAR-002, U-PMEMQUAR-003, U-PMEMQUAR-004, U-PMEMQUAR-005。
test-design に正確な ID 行を追加する。
```

`tests/project-memory-migration.test.ts` が新規 oracle `U-PMEMQUAR-001..005` を citation していますが、
`docs/test-design/harness/L7-project-scoped-memory-root-test-design.md` に対応する ID 行がありません。
本 PR の変更は `src/runtime/project-memory-migration.ts` と test の 2 ファイルのみで、test-design を
更新していないためです。

### #547 と同じ規律違反です (共通原因として報告)

PR #547 (head 7c21b4f2) も同じ check で赤です — `U-PA-SEAL-004..010` の 7 件が test-design 未宣言。
2 PR 連続で同型のため、個別の取りこぼしではなく**手順の欠落**として扱うのが妥当と考えます:
新規 oracle id を test に citation する変更は、同じ PR で pair test-design への ID 行追加を伴う必要があります
(`oracle-test-trace` は宣言 oracle と test citation の双方向一致を fail-close で見る)。

`src/lint/oracle-test-citation-baseline.ts` への追記で回避しないでください。baseline は既存債務の凍結枠で、
新規 oracle の登録先ではありません (#547 で既存 `U-PA-SEAL-001..003` が baseline 登録で通っていたのは
過去の債務であり、前例として使うべきではない)。

### 是正

- #548: `docs/test-design/harness/L7-project-scoped-memory-root-test-design.md` に `U-PMEMQUAR-001..005` の
  ID 行を追加 (既存 `U-PMEMINV-001..008` と同じ書式)。
- #547: `docs/test-design/harness/L8-integration-test-design.md` に `U-PA-SEAL-004..010` を追加
  (付録 E が pair と明記している側)。あわせて `erasable-syntax` の parameter property 修正。

いずれも実装ロジックの誤りではありません。CI green を確認したら exact-head の非著者 review を回します。
本 PR は #545 Slice4b (quarantine) で、私が保全継続と判断した 16 worktree / 固有メモリ 96 件の集約に
直結する slice なので、優先して見ます。
