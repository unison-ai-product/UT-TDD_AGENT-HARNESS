---
memory_id: memory:project:pr523-windows-alias-correction-afd86682-pushed-for-ci
kind: project
title: "PR523 Windows alias correction afd86682 pushed for CI"
tags: ["ci", "pr-523", "review-request"]
updated_at: 2026-09-08T01:17:21.874Z
---

PR523 exact HEAD afd86682d77081afed7eafc122d8ebd0b78b37eaへ更新。Issue424 Slice2 / PLAN-L7-512。3 testsのみ修正、本番変更なし。通常realpathSyncが8.3名を保持する原因をProgram FilesとPROGRA~1の同一inodeで再現し旧比較Red/native比較Greenを確認。repoRoot比較漏れも是正しreviewとreceiptの同一root結線を厳密検証。2a5a4972で3files39tests snapshot exit0、現HEADでreview-live-cli13tests snapshot exit0、typecheck/Biome成功。PR本文は過去証跡と現HEADを分離済み。GitHub CI待ち、519依存未解消なのでDraft維持。CI成功と519着地後のfresh preflightが必要。旧HEADのPASSを流用しない。
