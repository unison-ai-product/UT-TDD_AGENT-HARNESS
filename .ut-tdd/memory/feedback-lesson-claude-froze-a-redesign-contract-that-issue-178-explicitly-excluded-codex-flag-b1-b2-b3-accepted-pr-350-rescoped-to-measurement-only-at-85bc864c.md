---
memory_id: memory:feedback:lesson-claude-froze-a-redesign-contract-that-issue-178-explicitly-excluded-codex-flag-b1-b2-b3-accepted-pr-350-rescoped-to-measurement-only-at-85bc864c
kind: feedback
title: "Lesson: Claude froze a redesign contract that issue #178 explicitly excluded — Codex FLAG B1/B2/B3 accepted, PR #350 rescoped to measurement-only at 85bc864c"
tags: ["cross-review", "issue-178", "lesson", "p0", "pr-350", "scope-violation"]
updated_at: 2026-08-20T04:49:40.394Z
---

PR #350 に対する Codex 非著者 review の FLAG (blocking 3) を Claude (著者) が全件受諾し是正した。新 exact HEAD 85bc864ca9c87be004d5a8780276345d7f60a102 (旧 47ad591b は失効)。返信: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/350#issuecomment-5351498338

**重要な教訓 (Claude 側の起票誤り)**: issue #178 の本文には PO 合意と advisor 2 系統の一致結論として「やる: (a) 計測 + (b) 最小の計器 / やらない: 定義の再設計 (c)」「本 issue では schema を変更しない」「担当分界: #124 / #169 (DB 資源) は Codex train 3 のレーン。Claude 側が並行して DB 定義を触ると衝突する」が明記されていた。Claude はこれを読まずに U-1 粒度契約を PLAN-L7-460 へ freeze し、本 PLAN を #178 の機構化正本と宣言した。3 点すべてに反する起票であり、Codex の B1 指摘が正しい。**owning PLAN が無い issue を見つけたとき、issue 本文のスコープ宣言と担当分界を読む前に契約を freeze してはならない。**

是正内容: (B1) U-1 契約 freeze と機構化正本宣言を撤回し当該節を計測記録へ限定、再設計は #178 の指示どおり再設計キューへ積み #124/#169 レーン所有と明記。(B2) pair_artifact に candidate 宣言の無い AC-7..9 を削除。(B3) 未定義だった不変条件 4 点 (再投入 idempotency と既存 turn 粒度行の扱い、null cost_usd を含む合算の定義、model/session identity の正規化規則、runtime telemetry scan 経路と rebuild 経路の境界) を申し送りとして列挙し、詰めずに集約すると silent double count / 残置 / 誤 cost を許す旨を記録。

保持したのは実測部分のみ (freelist_count=0、model_runs 7,985,466 行のうち 99.99% が per-turn token-run 行、PLAN 紐付きは 927 行、VACUUM に回収余地なし)。これは #178 が明示的に許可する計測範囲であり、かつ #178 の 2026-07-28 計測 (clean rebuild 後 62.8MB / 74,267 行、model_runs は上位に不在) の後に発生した新しい観測である。

Codex の「PR CI 3/3 Green は docs lint のみで設計欠落を反証しない」という指摘にも同意。今回の是正は CI ではなく issue 本文との突合で行った。

plan lint は新 HEAD で green (plan-schedule / plan-governance checked=885)。同 exact HEAD での再レビューを依頼済み。Claude は自分の PR を merge しない。
