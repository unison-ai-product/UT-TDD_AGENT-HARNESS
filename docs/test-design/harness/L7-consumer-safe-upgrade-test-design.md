---
title: "L7 consumer safe upgrade test design"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L6-105-consumer-safe-upgrade-contract.md
parent_doc: docs/design/harness/L6-function-design/setup-solo-team.md
created: 2026-10-01
updated: 2026-10-01
---

# PLAN-L6-105 consumer safe upgrade: L7 test design

## 1. 位置付け

`PLAN-L6-105-consumer-safe-upgrade-contract` の pair artifact。upgrade が consumer の既存 bytes を壊さず、失敗時に upgrade 前の tree へ戻ることを検証する候補 oracle を宣言する。この pair-freeze (PR-0) では候補のみを置き、production source と test code は追加しない。正規 ID (`U-SAFEUP-*`) への昇格は実装 PR で行う。

既存の `U-SETUP-*` (非破壊導入) は再定義しない。ただし `U-SETUP-016b` (対話 `y` での上書き) は PLAN §3 D5 により PR-6 で改訂対象とする。

## 2. 共通の oracle 規則

- 比較は bytes (Buffer 等値)。文字列正規化・改行変換をしない。
- tree 一致は「path 集合・bytes・存在有無」で比べ、mode は POSIX のみ追加で比べる (Windows は mode の代わりに bytes と存在有無。代替であることを test に明記)。
- fixture は一時 directory に作る。`C:\dev\UT-TDD-agent-harness\.ut-tdd\harness.db` と実 repo の `.ut-tdd/` を触らない。
- 期待値は独立に導出する: 期待 bytes は fixture 作成時に固定し、実装が出す値から期待値を作らない。各 candidate は mutation を入れて落ちることを実装 PR で示す。
- 全 candidate は Windows と Linux の CI で実行する (CANDIDATE-U-SAFEUP-002 / 003 は両 OS 必須)。

## 3. CANDIDATE 一覧

| ID | AC | 検証内容 (falsify 方法) | OS |
| --- | --- | --- | --- |
| CANDIDATE-U-SAFEUP-001 | AC1 | `COMMON_FILES` と `setupTargetPaths` の全 path が所有権表に有る。表から 1 path を削る mutation で fail する | 両 |
| CANDIDATE-U-SAFEUP-002 | AC2 | marker-mixed の目印外、consumer-owned、conflict 停止時の全 path が upgrade 後も同一 bytes。CRLF/LF 混在・BOM・末尾改行なしの fixture を含む。目印外を 1 byte 変える mutation で fail する | 両 |
| CANDIDATE-U-SAFEUP-003 | AC3 | 書込 N 件目 (N = 1..全件) で例外・rename 失敗を注入し、失敗後の tree が upgrade 前と一致する。backup 書込中・manifest `prepared` 後・書込中・`committed` 直前の全点を網羅する | 両 |
| CANDIDATE-U-SAFEUP-004 | AC4 | manifest が `prepared` のまま残る fixture から再開すると、先に rollback して upgrade 前の tree に戻る。`committed` の backup は rollback しない | 両 |
| CANDIDATE-U-SAFEUP-005 | AC5 | 版なし (v0)・中間版・現行の各入力が現行へ連鎖変換される。登録外の版・現行より新しい版・parse 不能は書込 0 で fail-close | 両 |
| CANDIDATE-U-SAFEUP-006 | AC6 | conflict 1 件で書込 0・非 0 終了・path と理由の出力。非対話環境でも silent skip しない。壊れた marker (開始のみ / 順序逆転) も conflict | 両 |
| CANDIDATE-U-SAFEUP-007 | AC7 | 対話 `y` で consumer 編集済みファイルが置換されない。`--replace <path>` は diff 出力と backup 生成を伴う。`--replace` なしの旧経路が存在しない | 両 |
| CANDIDATE-U-SAFEUP-008 | AC8 | consumer A / B の 2 fixture で A のみ upgrade・rollback し、B の tree と backup が不変 | 両 |
| CANDIDATE-U-SAFEUP-009 | AC9 | `.gitignore` に利用者の行・コメント・空行・CRLF を置き、setup / upgrade 後も目印外が同一 (M1 の実測) | 両 |
| CANDIDATE-U-SAFEUP-010 | AC9 | 既存の小さな `harness.db` fixture に rebuildable でない行を入れ、upgrade の file transaction がそれを変えない (M2 の実測)。変えるなら PLAN §3 D4 を改訂する | 両 |

## 4. 測定のみ (PR-2)

M1 / M2 / M4 は read-only の観測 test として実装前に結果を得る。結果が PLAN の前提 (F6 / F7 / F8) と異なる場合は、実装 PR ではなく PLAN の改訂へ戻る。

## 5. 継承 fence

`U-SETUP-*` のうち `016b` 以外は Green のまま維持する。`016b` は PR-6 で新契約の oracle へ置き換え、置き換えの根拠を PR 本文に記録する。
