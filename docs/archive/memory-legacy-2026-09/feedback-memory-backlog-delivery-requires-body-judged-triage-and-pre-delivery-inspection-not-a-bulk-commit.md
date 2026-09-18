---
memory_id: memory:feedback:memory-backlog-delivery-requires-body-judged-triage-and-pre-delivery-inspection-not-a-bulk-commit
kind: feedback
title: "Memory backlog delivery requires body-judged triage and pre-delivery inspection not a bulk commit"
tags: ["cleanup", "delivery", "lesson", "memory", "process", "triage"]
updated_at: 2026-09-14T01:46:19.348Z
---

untracked memory backlog を配送するときは、一括 commit ではなく選別と配送前検査を経る。

**Why:** `.ut-tdd/memory` は tracked の共有正本であり、untracked のままでは相手ランタイム・他クローン・他 worktree に伝播しない。一方で frontmatter 完備でもエピソード状態 (review request / merge handoff / EOD / nudge) が混入し、CI は memory 本文を検査しない。

**How to apply:**

- **選別は本文で判定する**: frontmatter を剥がした本文を読み、durable な知見 (root cause / ルール / 落とし穴) だけを配送する。title・ファイル名の語 (receipt / pass / exact-head / correction など) は候補抽出のフィルタに留め、判定に使わない (title 由来の判定は pure merge handoff を配送側へ引き込む。正本: memory-triage-must-judge-body-content-and-title-based-rescue-reintroduces-episodic-state)。既存 tracked memory と同じルールを述べるだけの新 ID は配送しない (重複)。
- **配送前検査**: `readability` の走査対象は `docs/` + `.ut-tdd/audit` + `.ut-tdd/handover` で **memory は対象外** (`src/lint/readability.ts`)。CI が見ない分を直接検査する。個人 home パスは伏字化する。CRLF は `.gitattributes` の `text=auto eol=lf` が commit 時に正規化する。**mojibake は一律是正しない** — 欠陥の証拠として引用されている場合があり、書き換えると証跡が壊れる。
- **TOCTOU**: 共有 tree なので計測中も増える。stage 直前に再列挙し、`--pathspec-from-file` で明示 path のみ stage、commit 前に staged 集合が期待リストと完全一致することを検証する。
- **frontmatter 欠落分**: commit すると db rebuild が fail-close する (PR #167 前例)。memory 走査範囲外 (`C:/dev/_archive/`) へ退避し、原パス・sha256・bytes・復元手順・保持条件を MANIFEST.json に記録する。**削除前に正本 (PR コメント / receipt / PLAN) の存在を確認**し、live と退避コピーの sha256 を双方向照合してから削除する。
- **advisor 回答は実測で検証してから採用する**: 一括配送の可否を advisor 3 者に諮った際、中心的反証 (ID 衝突) が実測で否定された例がある。

本 memory は「title + ファイル名で判定する」と記していた旧版 (delivering-the-untracked-memory-backlog-…-dbe32b02d878、未配送) を置き換える。
