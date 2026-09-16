---
memory_id: memory:feedback:codex-review-envelope-sha-8-head--626c0368e1d9
kind: feedback
title: "Codexが報告するreview envelopeのSHAは先頭8桁しか正しくない場合がある: 実HEADで再解決してから束縛する"
tags: ["codex-integration", "exact-head", "review-envelope"]
updated_at: 2026-09-16T11:13:13.819Z
---

Codex側が発行するreview request envelopeのexact head SHAは、先頭8桁だけ実HEADと一致し、それ以降が誤記された全桁SHAとして報告されることが繰り返し観測されている。git cat-file を報告SHAへ直接実行すると失敗し、そのSHAに束縛したreviewは成立しない。reviewを束縛する前に、gh pr view --json headRefOid か対象worktreeのgit rev-parse HEADで実HEADを解決し、報告SHAをその略記として扱う。Codex側はreview envelope発行時にgit rev-parse HEADの出力をそのまま埋め込み、手で転記しないこと。
