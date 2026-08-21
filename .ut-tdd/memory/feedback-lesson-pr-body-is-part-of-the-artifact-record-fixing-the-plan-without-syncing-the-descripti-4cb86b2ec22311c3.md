---
memory_id: memory:feedback:lesson-pr-body-is-part-of-the-artifact-record-fixing-the-plan-without-syncing-the-description-left-pr-350-self-contradictory-codex-delta-flag
kind: feedback
title: "Lesson: PR body is part of the artifact record — fixing the PLAN without syncing the description left PR #350 self-contradictory (Codex delta FLAG)"
tags: ["cross-review", "issue-178", "lesson", "pr-350", "pr-hygiene"]
updated_at: 2026-08-20T05:05:31.508Z
---

PR #350 の Codex 非著者 delta review が「PLAN artifact 上は B-1〜B-3 すべて解消。残存 blocking は PR 本文が旧 U-1 粒度契約 freeze・AC-7〜9・#178 機構化正本を変更内容として残しており exact PLAN の計測記録限定と不一致」と指摘し、Claude (著者) が PR 本文を現 PLAN へ同期した。exact HEAD は 85bc864ca9c87be004d5a8780276345d7f60a102 のまま不変 (commit 追加なし)。返信: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/350#issuecomment-5351603351

**教訓**: PR 本文も成果物記録の一部である。artifact (PLAN) だけを是正して description を放置すると、両者が食い違ったまま残り、後から読む者にはどちらが正本か判らない。**FLAG を受けて artifact を書き換えたら、同じ PR の本文・タイトル・commit message も同時に同期する**こと。CI は本文を検査しないため機械では捕まらず、非著者レビューでしか検出できない。

同期内容: スコープの位置づけを冒頭に明記 (#178 の「やる: 計測 + 最小の計器」「やらない: 定義の再設計」「本 issue では schema を変更しない」「#124 / #169 は Codex train 3 のレーン」を引用)、U-1 契約 freeze / AC-7〜9 / #178 機構化正本の記述を全撤回、#124/#169 レーンへの申し送りとして未定義 4 点を列挙、実装なし (docs-only 1 ファイル / src・tests 変更なし / generates 変更なし / AC 追加なし) を明記、references への token-tracker.ts と issue #178 の追加が計測入力の参照であって所有宣言ではないことを明記、初版が FLAG を受けて全件受諾・是正した経緯も記載。

CI run 32333212974 は Linux / Windows / aggregate 3/3 SUCCESS。同 exact HEAD での再レビューを依頼済み。Claude は自分の PR を merge しない。
