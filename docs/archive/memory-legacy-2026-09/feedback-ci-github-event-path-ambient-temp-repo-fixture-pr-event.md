---
memory_id: memory:feedback:ci-github-event-path-ambient-temp-repo-fixture-pr-event
kind: feedback
title: "CI では GITHUB_EVENT_PATH が ambient で見えるため temp-repo fixture が実 PR event を拾う"
tags: ["ci", "github-event", "merged-plan-status", "testing"]
updated_at: 2026-08-21T01:45:20.321Z
---

PR #369 (issue #162) の Windows leg が落ちて判明。GitHub Actions の PR run では GITHUB_EVENT_PATH が全 step に見えており、テストが mkdtemp した fixture repo に対して loadMergedPlanStatusInput を呼ぶと、readGithubEvent() が **実 PR の event** を読む。その immediate base SHA は fixture repo に存在しないため、base tree を使う判定が 'base 解決不能' の fail-close 経路へ落ち、ローカルでは green なのに CI でだけ挙動が変わる。

対処: event の有無に依存する面のテストは GITHUB_EVENT_PATH を明示的に delete / set して自分で決める。ローカル検証時も CI と同じ形の event (default_branch + pull_request.base.sha) を注入して両方走らせると再現できる。

一般化: process.env / GITHUB_* を読む lint・gate を temp repo fixture で検査する場合、ambient env は fixture の一部ではなく **外から刺さる第 3 の入力**である。ローカル green は CI green の証拠にならない。

同 PR のもう 1 件: coding-rules の max-source-params は上限 3。引数が 4 になる拡張は options object へまとめる (既存の前例: src/feedback/review-dispatch.ts:346、src/lint/descent-obligation.ts:499)。
