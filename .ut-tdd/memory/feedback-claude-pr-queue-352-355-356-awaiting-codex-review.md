---
memory_id: memory:feedback:claude-pr-queue-352-355-356-awaiting-codex-review
kind: feedback
title: "Claude PR queue 352 355 356 awaiting Codex review"
tags: ["issue-187", "issue-353", "pr-352", "pr-355", "pr-356", "review-request"]
updated_at: 2026-08-20T09:12:24.749Z
---

Claude authored の PR 3 本が全て required CI green かつ mergeStateStatus CLEAN で、Codex family (gpt-5.6-sol) の非著者 closing review 待ちである。Claude は自 PR の verdict を出さないため、この 3 本は Codex 側の review 待ちで止まっている。

PR #352 exact HEAD 04528528d3cee13312f149ca3c85d7a57e986b52。stale index.lock による 13 日間の配送停止で滞留した共有メモリ 367 件の回収。Linux の唯一の violation は継承した main の red ではなく本 PR 由来の secret-scan 誤検出であり、tests/forward/fsm.test.ts:39 の secret: Buffer.alloc (not-a-secret: テストコードの引用) を引用した散文行へ ALLOW_LINE_MARKERS 準拠の注記を 1 行足して解消した。レビュー観点は真因の時系列の成立、schema 検証の網羅性、既存 1 件の上書きが後続版採用として妥当か、秘匿情報の不在の 4 点。

PR #355 exact HEAD fcb3b935。issue #353 の是正で、memory filename に basename 120 文字の上限を入れて Windows checkout の MAX_PATH 超過を止める。memory_id は全長維持、上限内の filename は現行形式維持、超過時だけ可読 prefix 切り詰め + 完全 memory_id の sha256 先頭 16 桁、衝突は既存ファイルの memory_id 照合で fail-close。実装前に ut-tdd advisor --decision implementation で gpt-5.6-sol と合議して契約を freeze した。tests/memory-service.test.ts に 7 件追加。

PR #356 exact HEAD e5c1da70。issue #187 の是正で、memory-sync の「共有済み」判定をパス存在から HEAD と origin の blob oid 一致へ変える。既存 memory を編集して commit したが push していない場合に shared と誤判定する更新経路の穴を塞ぐ。issue が結論した案 B に従っており方式を PR 内で発明していない。tests/memory-sync.test.ts に U-MEMSYNC-006 を追加し、旧実装へ戻すと expected 1 to be +0 で赤くなることを実測して回帰フェンスの実効性を確認した。

3 本とも対象 artifact は confirmed の PLAN-L7-189 が generates で所有しており、新規 artifact も新規契約層も作らない bounded repair のため新規 PLAN は起票していない。PLAN doc が必要という判断なら FLAG してほしい。
