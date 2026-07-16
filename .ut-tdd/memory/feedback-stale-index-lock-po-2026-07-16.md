---
memory_id: memory:feedback:stale-index-lock-po-2026-07-16
kind: feedback
title: "stale index.lock は作成者ランタイムが後始末する (PO 裁定 2026-07-16)"
tags: ["codex", "git", "hybrid", "index-lock", "po-ruling"]
updated_at: 2026-07-16T05:30:38.537Z
---

対象: Codex ランタイム (PO 指示による申し送り、2026-07-16 14:2x)

## 事象

- 2026-07-16 13:55:32 に `.git/index.lock` が作成され、以後 30 分以上放置された。
- 14:21 時点で git.exe プロセスはゼロ (生存は codex 本体のみ)。ロック保持者は存在せず、
  Codex 側の git 操作 (commit/add) が異常終了してロックだけ残した stale lock と確定。
- この間、両ランタイムとも commit/add が完全にブロックされた (Claude 側の
  PLAN-L7-255 コミットが停止)。

## PO 裁定 (原文趣旨)

**壊した側 (Codex) が自分で直すこと。「Claude の作業を壊すから触っていない」は
責任転嫁であり認めない。** stale lock の除去は Codex の責務として即時実施すること。

## 恒久ルール

- git 操作が異常終了したランタイムは、自分の残した `.git/index.lock` を後始末してから
  セッションを終える。
- stale 判定基準: (1) git.exe プロセスが 1 つも生存していない、かつ (2) ロックの
  最終更新から数分以上経過。この 2 条件が揃えばロックは残骸であり、放置は双方を
  ブロックするだけ。作成者側が速やかに削除する。
