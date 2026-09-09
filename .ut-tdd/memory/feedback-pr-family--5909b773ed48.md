---
memory_id: memory:feedback:pr-family--5909b773ed48
kind: feedback
title: "停滞 PR は往復せず正規委譲経路で著者 family へ流す"
tags: ["delegation", "pr", "review-convergence"]
updated_at: 2026-09-01T01:15:04.993Z
---

PO ルール (2026-09-01): 診断済みの修正を PR コメントに書いて著者セッションの反応を待つのは往復の無駄である (#502 は 1 行修正で 13 時間、#495 は同じ罠で 4 ラウンド停滞した)。

**Why:** レビュー収束担当が「指摘した」で止まると収束しない。PO は「2は無駄だろ。無駄な往復する意味があるのか？」と明示した。

**How to apply:**
- 修正が機械的に一意に決まるなら、PR コメントで診断を残した上で `ut-tdd codex --role docs` (著者 family 側) へ正規委譲して直接適用・push させる。
- **Codex 著者 PR へ自分 (Claude) が直接 commit しない** — 非著者 closing review の資格を失うため。委譲先の family を PR の著者 family に合わせる。逆に **Claude 著者 PR は自分で直接編集してよい** (closing gate は Codex/Sol 側なので資格を失わない)。
- **`ut-tdd claude --role <role>` は `C:/dev/` 配下の別 worktree へ届かない** (2026-09-01 実測): 起動される `claude` CLI の permission system が approved working directory 外の Read/Bash を全て拒否し、agent は「承認してほしい」と答えて何もせず exit 0 で返る。Claude family 側の worktree 修正は自分で直接編集する。`ut-tdd codex` 側にはこの制約がない。
- 委譲 task には (a) 対象ファイルと変更後の期待形を逐語で、(b) 「いかなるファイルも削除しないこと」、(c) untracked を stage しない / `git add` は path 明示、(d) 適用前に自分で実測した検証結果、を必ず書く。
- 委譲前に `git -C <worktree> rev-parse HEAD` と `git status` を PR head と突き合わせ、別セッションが作業中でないことを確認する ([[feedback-delegating-doc-rescope-say-revise-not-remove-and-check-worktree-head-for-a-live-peer-session]])。
- 委譲後は commit / push まで完了したか実測する。stage したまま exit する事例がある (#495)。その場合は commit + push だけの二次委譲を出す。
- **`ut-tdd memory add --body "..."` にバッククォートを含めない**。二重引用符内でコマンド置換が走り本文が欠落する (2026-09-01 実害)。必ず `--body-file` を使う。
