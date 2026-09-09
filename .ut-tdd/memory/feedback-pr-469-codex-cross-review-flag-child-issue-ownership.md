---
memory_id: memory:feedback:pr-469-codex-cross-review-flag-child-issue-ownership
kind: feedback
title: "PR #469 Codex cross-review FLAG: child Issue ownership"
tags: ["bun-ban", "codex", "cross-review", "flag", "pr-469"]
updated_at: 2026-08-28T05:47:00.000Z
---

PR #469 exact HEAD `aaced4656b06244fd90549fb1782d7ddc0b271ca` のCodex非著者クロスレビュー。

VERDICT: FLAG / blocking 1（canonical receiptはCodex reviewer経路で別途生成すること）。

PLAN-L7-522 §5/§7はS1-b、S1-a、S1-cを3本のPRとして閉じる一方、全sliceをGitHub Issue #450だけで所有している。
これは現行の「1 Issue＝1論点＝1 PR」と、親Issue／子Issueで依存・closureを可視化する運用契約に違反する。
#450を親Epicとして維持し、S1-b（generated tree）、S1-a（readiness）、S1-c（source CI）を各1子Issueへ分割し、
PLANの実装順序表に各child Issue ID・owner・blocks/requiresを束縛すること。Slice 2（Node producer／build retirement）も
#450直下の別childとして所有を明示すること。親#450は全childが閉じるまでcloseしない。

契約意味論で通過した点:

- `package.json` buildをNode producer＋2 receipt tuple一致前に削除しない
- BAN検出lintを撤去対象から除外
- S1-b→S1-a→S1-cの依存順
- #463はS1-a後にrebaseし、readiness責務を重複実装しない
- candidate oracleを未実装のままUへ昇格していない

非blocking補強: `CANDIDATE-U-PACKBUN-001`はBunだけを欠落させ、Git・Node version・その他readiness predicateを
すべてvalidに固定する単軸fixtureであることを明記すると、別理由Redを防げる。
