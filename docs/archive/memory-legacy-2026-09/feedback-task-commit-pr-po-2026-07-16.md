---
memory_id: memory:feedback:task-commit-pr-po-2026-07-16
kind: feedback
title: "task境界ではcommit→PRまで自走する (PO 2026-07-16)"
tags: ["autonomy", "git", "po-rule", "pr"]
updated_at: 2026-07-16T08:06:33.648Z
---

PO ルール (2026-07-16)。全ランタイム (Claude / Codex) 共通。

**task 境界では commit → PR まで自走する**: 起票完了・検証 green のような明確な task 境界では、commit するか / PR にするかを PO へ聞き返さず、path 明示 stage → Conventional Commit → push → PR 作成まで進める。既存 Git Rules の「push は要求時」は「task 境界 = 標準要求済み」と読む。ブランチは作業種別ごとに分離する (実装 branch へ doc 起票を混ぜない)。同一 task の延長の追加変更は同じ PR へ積む。従来制約は維持: foreign 変更を含めない / `git add -A` 禁止 / PR author runtime が自 PR のレビューを自分で起動しない。

**PR 作成後は共有メモリへ PR 対応依頼を記録する**: PR 対応は author runtime が一人で自走するものではない。author runtime の担当は CI (harness-check) の結果確認と Red 修正まで。PR を作成したら、共有 HARNESS メモリへ非 author runtime 宛の PR 対応依頼 (PR 番号 / branch / 変更概要 / レビュー観点) を 1 件記録し、非 author runtime がそれを拾う。

**PR 対応 = レビュー + merge + 依頼メモリ削除で 1 セット**: 非 author runtime はレビュー・指摘対応したらセットで merge まで実行する。merge を PO 承認ゲートにしない (旧「main への merge は PO 承認必須」(2026-07-14) は本ルールが supersede)。依頼メモリの消し込みは依頼先 (PR 対応した側) の義務: merge 実行と同時に依頼メモリファイルを削除する。怠ると依頼が永遠に増殖し、共有メモリが stale 連絡で汚染される。

**問題がある PR は merge しない**: レビューで問題を検出した場合、merge を強行しない。軽微な問題 (typo / 参照ずれ / 小さな修正で閉じるもの) はレビュー側がその場で修正 commit を積んでから merge する。大規模な問題 (設計不備 / 検証不足 / スコープ逸脱) は merge せず author runtime へ差し戻す (PR コメント + 依頼メモリへの差し戻し記録、author が修正後に再依頼)。「レビューした事実」だけで merge を正当化しない。

**メモリ運用**: 共有メモリはランタイム中立の表現で書く (「自分」「相手」等の視点依存語でなく author runtime / 非 author runtime)。HARNESS メモリの作成・更新は直接 Edit でなく `ut-tdd memory add` 経由 (secret-scan fail-close / updated_at / harness.db projection 整合のため)。
