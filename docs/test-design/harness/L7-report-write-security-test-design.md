---
title: "L7 report write security test design"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L6-816-report-security-class-contract.md
parent_doc: docs/design/harness/L6-function-design/secret.md
created: 2026-10-01
updated: 2026-10-01
---

# PLAN-L6-816 トラブル報告の書き込みセキュリティ — L7 test design

## 1. 位置付け

`PLAN-L6-816-report-security-class-contract` の pair artifact。S1 の受入条件 (PLAN §4) を検証する候補 oracle を宣言する。
この pair-freeze では候補のみを宣言し、production source と test code は追加しない。正規 ID への昇格は実装 PR で行う。
`PLAN-L7-260` の scanner 契約 (既存の `tests/secret-scan.test.ts`) は再定義せず、Green 維持のみを要求する。

## 2. fixture 規約

- token は runtime 連結で生成し、リポジトリに素書きしない。形式ごとに「免除語なし行」と「免除語あり行」を用意する。
- home / cwd / project root は temp fixture 内で生成した実値を使い、実ユーザーの値を使わない。
- 出力経路の観測: file 書き込み・stdout・stderr・log・temp・例外文言を spy または temp directory の差分で全て捕捉する。

## 3. 候補 oracle

| ID | 対象 AC | 内容 | Red の条件 |
|---|---|---|---|
| CANDIDATE-U-RPTSEC-001 | 1 | 各 credential 形式 (GitHub 系 / `sk-` / AWS / private key / Bearer / `secret=`) で fail-close し、全出力経路が 0 byte | 1 経路でも書き込みがある |
| CANDIDATE-U-RPTSEC-002 | 1 | 例外文言・診断に検出値と周辺文字列が出ない (marker と件数のみ) | 検出値が現れる |
| CANDIDATE-U-RPTSEC-003 | 2 | 免除語を含む行でも報告経路は credential を検出する | 免除語で素通りする |
| CANDIDATE-U-RPTSEC-004 | 2 | 既存の repo scan は免除語の挙動が不変 (`tests/secret-scan.test.ts` Green) | 既存挙動が変わる |
| CANDIDATE-U-RPTSEC-005 | 3 | 許可外 env key (`GH_*` / `GITHUB_*` / 未知 key) の値が出力に出ない | 値が現れる |
| CANDIDATE-U-RPTSEC-006 | 3 | 許可 key の値に secret があれば fail-close | 素通りする |
| CANDIDATE-U-RPTSEC-007 | 3 | name regex ではなく allowlist であること (credential 風でない名前の未知 key も除外) | 未知 key が通る |
| CANDIDATE-U-RPTSEC-008 | 4 | path matrix (`\` / `/` / 混在、drive letter 大小、UNC、`/home`、`/Users`、`~`、実 cwd) が出力に出ない | 1 変種でも残る |
| CANDIDATE-U-RPTSEC-009 | 5 | 内部 URL・IP・userinfo・query 内の秘密・project 名・remote URL が既定で出ない | 1 件でも残る |
| CANDIDATE-U-RPTSEC-010 | 6 | 表示した全文と出力が byte 一致する | 差がある |
| CANDIDATE-U-RPTSEC-011 | 6 | `yes` 以外の入力 (空・no・EOF) と非対話で出力 0。確認迂回 option が存在しない | 出力される、または迂回 option がある |
| CANDIDATE-U-RPTSEC-012 | 7 | 最終 leak 検査を単独で動かし、前段を無効化した入力を検出する | 検出されない |
| CANDIDATE-U-RPTSEC-013 | 7 | mutation: 入力検査・path・env・最終検査を 1 段ずつ外すと、対応する oracle が Red になる。除去した出現を記録する | 外しても Green のまま |
| CANDIDATE-U-RPTSEC-014 | 8 | PII 規則を共有モジュールへ移した後も `tests/secret-scan-diff.test.ts` (bare remote 経由 e2e) が Green | pre-push の挙動が変わる |
| CANDIDATE-U-RPTSEC-015 | 1 | 検査中に例外 (scanner が throw) が起きても出力 0 (fail-close、fail-open にしない) | 例外時に出力される |

## 4. 実測コマンド (昇格時)

`node src/cli.ts plan lint docs/plans/PLAN-L6-816-report-security-class-contract.md`。実装 PR では対象 test file を
`npx vitest run` で個別実行し、doctor は singleton のため CI の結果を参照する。

## 5. 継承 fence

`PLAN-L7-260` の secret-scan / distribution preflight / pre-push の既存テストは Green のまま。本 artifact はそれらを再定義しない。
