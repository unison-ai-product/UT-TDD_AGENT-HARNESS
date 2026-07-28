---
memory_id: memory:feedback:pr-106-flag-ci-contract-and-l7-test-design-gap
kind: feedback
title: "PR #106 FLAG: repository-read契約とL7検証設計の未同期"
tags: ["codex", "cross-review", "pr", "test-hygiene", "v-model"]
updated_at: 2026-07-21T04:10:00.000Z
---

PR #106 HEAD `4b303b6a2ff2a3f1a2a9f4c9557e3043e4d1f2e8` を
claim-blind / spec-blind でクロスレビューし **FLAG** とした。

- PR comment: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/106#issuecomment-5030515421
- High: `U-TESTHYGIENE-050` が `process.cwd()` のrepository-readを増やしたが、
  `src/doctor/test-repository-isolation.ts` の `vitest-snapshot-runner:1` が未更新。
  Actions run `29798671201` はLinux/Windows双方で
  `U-TESTHYGIENE-015` Red、aggregateもRed。
- Medium: `U-TESTHYGIENE-048〜051` が
  `docs/test-design/harness/L7-unit-test-design.md` に未反映で、設計invariantと
  oracleの正規Vペア資産が欠落。
- Low: PLAN 116/128行にtrailing whitespace。
- root fail-fastの副作用前配置、uid非0 / getuid不在の通過、Windows通常ユーザーの
  ACL seal試験Greenは確認。Windows Administrator耐性は未証明で、本PRの証拠には数えない。

解除条件: repository-read契約修復、L7 test-design同期、diff hygiene修復、更新HEADで
targeted 17/17 + Linux + Windows + aggregateの全Green。request memoryはmerge時まで残す。

## 2026-07-21 最終再レビュー

PR HEAD `f9c7f56db8e246920ed38f8c62a65b8239177b35` で初回FLAGのartifact条件は解消し、
独立read-only再レビューはPASS (未反駁High/Mediumなし)。

- repository-read exact contract=2、U-TESTHYGIENE-048〜052をL7 test-designへbackprop。
- Windows commandは`path.win32.join`でhost非依存。通常権限の実ACL拒否、pure command、
  bypass後fingerprint oracle、Administrator未証明境界を分離。
- shared artifact ownershipは既存PLAN-L7-421を維持し、新PLANはreferencesで接続。
- direct 56/56、typecheck、Biome、plan lint、diff-check Green。
- Actions run `29805269078`: Windows Green。LinuxはPR差分の違反0で、main既存の
  `PLAN-RECOVERY-16-plan-revision-authoring status=draft`だけがRed。aggregateはLinux継承でRed。

したがってPR #106のartifact判定はPASSだが、required aggregateがRedのためmerge不可。
mainのRECOVERY-16修復後に更新baseでCIを再実行し、両OS+aggregate Greenならmerge可能。
