---
memory_id: memory:feedback:pr-324-delta-review-blocking-4-exact-head-61221afe-ci-3-3-success
kind: feedback
title: "PR #324 delta review 依頼: blocking 4 全件是正、exact HEAD 61221afe、CI 3/3 SUCCESS"
tags: ["delta-review", "exact-head", "issue-322", "pr-324", "review-request"]
updated_at: 2026-08-14T12:53:36.075Z
---

PR #324 の FLAG (blocking 4) をすべて是正しました。新 exact HEAD 61221afe5cd36066ea1673e53828a4ca8dd03e15、CI run 31801493207 は linux / windows / aggregate の 3 job とも SUCCESS です。delta review をお願いします (私が著者のため判定はしません)。

## blocking 4 の是正

1. **hook 記載と settings.json の機械照合 (旧 B1)**: analyzeHookParity を追加し、.claude/CLAUDE.md §Hooks 行と .claude/settings.json の command+args を (event, command) 集合として照合します。doc 側の表記を実体と厳密一致させ (引数に空白が無い場合は引用符なし)、doc に未記載だった claude-memory-wake hook も追加しました。U-RDRIFT-007 が実 repo 照合に加えて 4 変異 (引数欠落 / event 取り違え / doc 行削除 / 壊れた JSON) の fail-close を固定します。壊れた JSON は parseError 付きで ok=false とし、判定不能を green へ丸めません。
2. **engines.bun (旧 B2)**: 削除しました。runtime-portability は engines.node のみ必須で engines.bun は #134 の残存宣言として任意扱いのため、削除しても検査は成立します。runtime-portability + toolchain-pin 28 tests green。
3. **PLAN trace / 設計判断 (旧 B3)**: PLAN-L7-488 を起票し、設計判断 (検査の置き場所 = 既存 rule-drift 拡張 / 検査範囲 = 実行指示のみで過去記録は対象外 / engines.bun = 削除) を §2 に記録しました。加えて PLAN-L7-462 側にも後続 PLAN へのポインタを追記しています。462 は status: completed で完了記録 (2026-08-07) が AC-1..AC-5 の evidence を閉じているため、AC の追加・改訂はせず trace 行のみの追記としました。
4. **正規表現の取りこぼし (旧 B4)**: bun.cmd / bun.exe / 単独 bun / bunx / pipe 後の bun を検出するよう是正し、6 形の検出を U-RDRIFT-008 で固定しました。過去 incident の散文を拾わない境界は U-RDRIFT-006 が維持します。

## 途中で自分で潰した CI red 2 件 (参考)

- doctor test-repository-isolation の callsite-drift (expected=2:actual=3)。U-RDRIFT-007 が実 repo の 2 ファイルを読むため isolated_fixture callsite が増えており、台帳を rule-drift:3 へ更新しました。
- biome フォーマット適用分の commit 漏れ。これは Codex 側が 61221afe で先に commit・push しており、内容が同一意図だったため上書きせずそのまま採用しています。

## 実測

rule-drift 10 tests green / oracle-test-trace 34 green (orphans 0、undeclared 0) / runtime-portability + toolchain-pin 28 green / plan-lint + rule-drift 88 green / plan lint OK (877) / tsc 0 / biome clean (651 files) / checkTestRepositoryIsolation 直呼びで ok (contracts=94, live_runtime=0)。

## 重点確認をお願いしたい点

1. analyzeHookParity の正規化方針 (settings.json 側の args で空白を含むものだけ引用符付きにして結合する形) が、将来 args に空白付き値が入ったときに doc 側と食い違わないか。
2. forbidden 正規表現の過検出。特に日本語文中の bun や、コード例として bun を引用する正当なケースを誤検出しないか。
3. 既存 U-RDRIFT-001..004 を箇条書き宣言のまま残した非対称 (citation baseline で grandfather されている) を許容するか、既存も表へ移すべきか。
