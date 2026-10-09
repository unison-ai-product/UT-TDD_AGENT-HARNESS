---
title: "L7 design plan thin body lint test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-09
---


# 設計系 PLAN 本文 4 項目 lint テスト設計 (issue #955)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/design-plan-thin-body.md` である。
本書はその §2 適用範囲、§4 検査 C1〜C5、§5 出力、§6 配線、§8 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§設計系 PLAN 本文 4 項目) だけを置き、本書が詳細の正本である。
この pair-freeze では候補 ID (`CANDIDATE-U-THINPLAN-*`) だけを宣言する。

## 2. 計測値 (閾値 80 の根拠)

残余 = 行頭 `- ` を除き、backtick span を全て除き、trim した文字列の Unicode code point 数 (`[...s].length`)。
2026-10-09 に node で計測した (rev4 = PR #944 `087a1b18`、L6-833 = main `da16d7aa`)。

| 行 | 残余 | 80 で |
| --- | --- | --- |
| CLAUDE.md 例 `- 設計 ↔ テスト設計: 上記 2 文書の対 (gate / テストレベル / 検証手法はテスト設計側に書く)` | 54 | pass |
| CLAUDE.md 例 `` - `docs/design/harness/<layer-dir>/<topic>.md` (本 PLAN で凍結する設計文書) `` | 18 | pass |
| PLAN-L6-935 rev5 引き渡し物 / 検証の対 の各 item | 0 / 30 / 26 / 0 / 0 / 0 | pass |
| PLAN-L6-935 rev4 検証の対 段落 1 (main 版と同文) | 84 | fail (`item_form` が先に当たる。list でも 84 > 80) |
| PLAN-L6-935 rev4 検証の対 段落 2 (FLAG1 訂正) | 511 | fail |
| PLAN-L6-935 rev4 検証の対 段落 3 (CANDIDATE-025) | 278 | fail |
| PLAN-L6-833 Deliverables 4 行目 (46 テンプレート) | 290 | fail |
| PLAN-L6-833 Verification pair 段落 | 438 | fail |

計測の再現: 上記の定義を `node -e` で各行に適用する (実装 PR のテストが同じ関数で値を固定する)。

## 3. fixture

- 純関数の行は、本文文字列と fake `pathExists` (path → boolean) で作る。実 repo を読まない。
- 実例 fixture: PLAN-L6-935 の rev4 本文 (PR #944 `087a1b18`) と rev5 本文 (`18db7e51`) を `tests/fixtures/design-plan-thin-body/` に frontmatter を除いて literal で置く。CI の clone に PR ref は無いので git から読まない。
  - 実例の path 存在は fake `pathExists` で全て true にする (実例は形の oracle に使う)。path 存在の oracle は 016 で別に固定する。
- governance 配線の行は、frontmatter 付きの合成 PLAN を `PlanGovernanceDoc` として `analyzePlanGovernance` に渡す。
- real-repo の行は `process.cwd()` の repo に対して `lintPlanWithGate(undefined, cwd)` を呼ぶ (既存 `tests/plan-lint.test.ts` の G1 / G3 real-repo 行と同じ様式)。
- 各行は §4 の規則を 1 本だけ殺すように作る。

## 4. Candidate oracle matrix

| Candidate | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-THINPLAN-001` | PLAN-L6-935 rev4 本文 (fixture) | finding ≥ 1。`item_form@検証の対` と `heading_literal@検証の対` (「## FLAG1…」の行) を含む | 検証の対の段落を許す / 見出し literal を許す |
| `CANDIDATE-U-THINPLAN-002` | PLAN-L6-935 rev5 本文 (fixture) | finding 0 件 | path だけの list を fail にする / 残余に backtick 内を数える |
| `CANDIDATE-U-THINPLAN-003` | CLAUDE.md §設計系 PLAN の本文 4 項目 の例 (digest の `<...>` を実値の形に置換、path は存在扱い) | finding 0 件 | 例の最長行 (残余 54) を `item_too_long` にする閾値 |
| `CANDIDATE-U-THINPLAN-004` | 見出しが `## 1. Upstream design revision digest` 等 (PLAN-L6-833 の形) | `heading_set` のみ。C2〜C5 の finding は出ない | 番号・英語見出しを許す / C1 fail 後も後続検査を走らせる |
| `CANDIDATE-U-THINPLAN-005` | 4 見出しの順序を `引き渡し物` → `上流の設計 revision digest` に入れ替え | `heading_set` | 集合だけ見て順序を見ない |
| `CANDIDATE-U-THINPLAN-006` | 4 見出し + 5 個目 `## 設計判断` | `heading_set` | 余分な h2 を許す |
| `CANDIDATE-U-THINPLAN-007` | `## 検証の対` の下に `### 補足` | `heading_depth` | h3 を許す |
| `CANDIDATE-U-THINPLAN-008` | h1 の後、最初の h2 の前に段落 1 行 | `preamble_text` | preamble の本文を許す (複製の逃げ場になる) |
| `CANDIDATE-U-THINPLAN-009` | digest 行が (a) `` `path`: SHA-256 `<hex>` `` 形 (PLAN-L6-833 の形)、(b) commit が 39 hex、(c) sha が大文字 hex、(d) path に `..`、(e) sha が `<TBD>` | 各 `digest_line` | 文法を緩める (各 1 本) |
| `CANDIDATE-U-THINPLAN-010` | digest 節が空 | `empty_section@上流の設計 revision digest` | 0 行を許す |
| `CANDIDATE-U-THINPLAN-011` | 引き渡し物に表 (`\| a \| b \|`) | `table_forbidden` | 表を許す |
| `CANDIDATE-U-THINPLAN-012` | 引き渡し物に (a) 残余 80 code point ちょうど、(b) 81 code point の item (CJK で構成) | (a) finding 0、(b) `item_too_long(81>80)` | 閾値の off-by-one / byte 数で数える / UTF-16 長で数える (サロゲートペア文字を 1 個含めて区別する) |
| `CANDIDATE-U-THINPLAN-013` | 引き渡し物に残余 10 code point + 長さ 150 の backtick path 1 本 | finding 0 | backtick 内を残余に数える |
| `CANDIDATE-U-THINPLAN-014` | 引き渡し物にネスト list (`  - x`) | `item_form` | ネストを許す |
| `CANDIDATE-U-THINPLAN-015` | 完了条件に (a) `- 項目` (checkbox なし)、(b) 段落、(c) `- [X] ` 大文字 | 各 `checklist_form` | checklist 以外を許す |
| `CANDIDATE-U-THINPLAN-016` | 引き渡し物の (a) `` `docs/design/harness/L6-function-design/missing.md` `` (fake false)、(b) `` `docs/design/x.md#no-such` `` (x.md は fake true) | (a) `path_missing`、(b) finding 0 (fragment は解決しない) | path 存在を見ない / fragment を path に含めて存在判定する / fragment を解決しようとする |
| `CANDIDATE-U-THINPLAN-017` | 検証の対に `` - `docs/design/x.md` の「## 3. 入力」 `` (残余 80 以下) | `heading_literal` | 短い行の見出し literal を許す (長さ規則だけに頼る) |
| `CANDIDATE-U-THINPLAN-018` | digest 節の path が fake false | finding 0 | digest path にも存在検査を掛ける (過去 revision を誤って fail) |
| `CANDIDATE-U-THINPLAN-019` | HTML コメント行 (`<!-- ... -->`) を各節に 1 行 | finding 0 | コメントを本文行として扱う |
| `CANDIDATE-U-THINPLAN-020` | 合成 PLAN `kind: add-design`、`created: 2026-10-05`、本文は 001 と同じ違反 | `analyzePlanGovernance` の violation に `design_plan_thin_body` が無い | 施行日判定を外す (021 と対で `>` / `>=` の取り違えも殺す) |
| `CANDIDATE-U-THINPLAN-021` | 同じ本文で `created: 2026-10-06` | violation `design_plan_thin_body`、detail が `item_form@検証の対:L<n>` で始まる | 施行日を 10-07 にずらす / detail 書式の変更 |
| `CANDIDATE-U-THINPLAN-022` | 同じ本文で `kind: impl`、`created: 2026-10-09` | `design_plan_thin_body` 無し | kind 判定を外す |
| `CANDIDATE-U-THINPLAN-023` | 同じ本文で `kind: design`、`status: archived`、`created: 2026-10-09` | `design_plan_thin_body` 無し | archived を対象にする |
| `CANDIDATE-U-THINPLAN-024` | 021 の PLAN を `lintPlanDefault` / `lintPlanGate("governance")` に通す | 両方 `ok=false`、message に `design_plan_thin_body=1` | 既定 lint か governance gate のどちらかへの配線漏れ |
| `CANDIDATE-U-THINPLAN-025` (real-repo) | `lintPlanWithGate(undefined, process.cwd())` | `ok=true` (exit 0 相当) | 施行前 PLAN を対象に含める / 施行後 PLAN の未是正 |
| `CANDIDATE-U-THINPLAN-026` (real-repo) | `docs/plans/` の設計系 PLAN 全件に §2 の適用判定だけを掛ける | `created < 2026-10-06` の全件が false。true の集合は PLAN-L6-833 / PLAN-L6-834 / PLAN-L6-935 / PLAN-L6-955 (と以後の新規分) を含む | 適用判定の条件を変える |
| `CANDIDATE-U-THINPLAN-027` | 同一入力を 2 回 | 同じ finding 列 (順序含む) | 非決定的な走査順 |

## 5. Gate and scope fence

- 本 lint は `plan-governance` の 1 reason であり、新しい doctor row を作らない。doctor の既存 `plan-governance` row が 024 と同じ結果を返すことを、`checkPlanGovernance` の既存テストの様式で 1 行確かめる。
- 見出しアンカー / `§token` の解決は範囲外 (設計文書 §9)。その oracle は置かない。016 (b) が「解決しない」ことを固定する。
- 025 は main で exit 0 を要求する。設計文書 §10 の順序 (PLAN-L6-935 → PLAN-L6-833 の是正 merge → 本 lint の実装 merge) を満たす前に実装 PR を merge しない。
- 001 / 002 の literal fixture は rev4 / rev5 の本文を変えずに写す (frontmatter は除く)。

## 6. Required evidence

- 001〜027 の Vitest green (実装 PR の CI `harness-check`)。
- `node src/cli.ts plan lint` の exit 0 (main HEAD、実装 PR の exact head)。
- 非著者 family (Codex Sol) の review PASS。
