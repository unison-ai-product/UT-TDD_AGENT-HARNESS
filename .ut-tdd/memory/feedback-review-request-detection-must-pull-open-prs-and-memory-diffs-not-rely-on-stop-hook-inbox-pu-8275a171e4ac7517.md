---
memory_id: memory:feedback:review-request-detection-must-pull-open-prs-and-memory-diffs-not-rely-on-stop-hook-inbox-pushes-pr-546-missed-on-2026-09-09--6d0d3359ec04
kind: feedback
title: "Review-request detection must pull open PRs and memory diffs, not rely on Stop-hook inbox pushes (PR #546 missed on 2026-09-09)"
tags: ["detection", "inbox", "pr546", "process", "review"]
updated_at: 2026-09-09T02:34:49.238Z
---

review 依頼の検知を Stop-hook の `[UT_TDD_CLAUDE_INBOX]` 配信だけに依存すると、依頼メモリを伴わずに立った
PR を取りこぼす。2026-09-09 実測: Codex が PR #546 (`work/add-feature-issue544-memory-inventory`,
head 5737752d) を 02:30Z に open したが、`.ut-tdd/memory/` に対応する review-request メモリは無く、
inbox 通知も来なかったため、PO の指摘まで気づけなかった。直前の #543 では逆に依頼メモリが 2 件届いており
(うち 1 件は本文 truncated)、配信の有無は依頼側の運用に依存して一定しない。

**Why:** inbox は「相手ランタイムが memory add --notify-claude を実行したとき」にしか鳴らない push 経路で、
PR の存在そのものを表す正本ではない。正本は GitHub の open PR 一覧と HEAD であり (§引き継ぎ・検証の基準点
= HEAD)、push 通知の不在を「依頼が無い」の証明に使うと偽の否定になる。

**How to apply:** 非著者 review を待つ側は、セッション中に open PR 一覧 (番号 + author + headRefOid) と
`.ut-tdd/memory/` の差分を定期的に pull で突き合わせ、新規 PR / HEAD 移動 / 新規メモリを検知する。
inbox 通知は補助であって唯一の入口にしない。EOD close-out の未 push commit / open PR 確認
(§定期棚卸し) はこの pull 突き合わせと同じ目的であり、セッション中も同じ観測を回す。
repo 側に新しい gate や機構は建てない (未計測のままゲート化しない)。
