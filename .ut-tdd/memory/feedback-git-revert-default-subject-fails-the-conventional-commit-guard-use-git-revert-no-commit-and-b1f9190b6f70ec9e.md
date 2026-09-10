---
memory_id: memory:feedback:git-revert-default-subject-fails-the-conventional-commit-guard-use-git-revert-no-commit-and-write-a-lowercase-revert-subject--95c890a544be
kind: feedback
title: "git revert default subject fails the conventional-commit guard: use git revert --no-commit and write a lowercase revert: subject"
tags: ["ci", "commitlint", "git", "ops-guard", "revert"]
updated_at: 2026-09-10T05:03:27.527Z
---

`git revert <sha>` が自動生成する件名 `Revert "<元の件名>"` は、この repo の branch-type guard
(`src/github/ops-guard.ts` の `CONVENTIONAL_COMMIT_RE`) に**通らない**。正規表現は小文字の type
(`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`) で始まる件名だけを受理し、大文字 `Revert` と
引用符付きの形式は `commitlint-invalid` になる。guard は `harness-check` の全 lane で走る required check なので、
その commit を含む head は 5/5 green に到達できず、rerun しても直らない。

**Why:** 2026-09-08 の実例: PR #529 の head に既定件名の revert commit が含まれ、`harness-check-linux` が
branch-type guard で決定的に赤になった。ローカルでは下記の guard 呼び出し (件名ファイルに `Revert "..."` を 1 行入れる) で同じ判定
(`commitlint-invalid`、exit 1) が再現する。
review 側は CI green を前提にするため、closing review の dispatch 自体が止まった。

**How to apply:**

1. revert は `git revert --no-commit <sha>` で staging に取り込み、`git commit -m "revert: <type>(<scope>): <元の件名>"`
   のように conventional な件名を自分で付ける。
2. 既に既定件名で commit してしまった場合は、push 前なら `git commit --amend` で件名を直す。push 後の共有 branch なら
   履歴を書き換えず、`ut-tdd` の規律 (push 済み履歴は破壊しない) に従って修正 commit を積むか、PO と相談する。
3. push 前に guard を流し、直近の件名が全て通ることを確認する (`--head-ref` と `--commit-file` は必須):

```bash
git log --format=%s -20 > subjects.txt
node src/cli.ts github guard --head-ref "$(git branch --show-current)" --base-ref main --commit-file subjects.txt
rm subjects.txt
```

`Revert "..."` を含む件名ファイルでは `commitlint-invalid` で exit 1、同じ件名を `revert: ...` に直すと exit 0 になる。
