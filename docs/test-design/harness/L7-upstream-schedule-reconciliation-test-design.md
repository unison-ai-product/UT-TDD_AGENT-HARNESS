---
title: "上流スケジュール調整 — L7 テスト設計"
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/upstream-schedule-reader.md
parent_doc: docs/design/harness/L6-function-design/upstream-schedule-reader.md
next_pair_freeze: L7
created: 2026-10-14
updated: 2026-10-15
---

# 上流スケジュール調整 — L7 テスト設計

## §1 位置付け

本書は Issue #959 T4 F lane が所有する、L6 `upstream-schedule-reader.md` の双方向 pair である。`layer: L6` は作成層 / pair key、`executed_at_layer: L7` は実施層を表す。L3 topic は reader が読む設計入力であり、この L7 oracle の直接の pair ではない。

ここに記載するのは未実装の候補 oracle であり、本番ソース／テストコードの変更、実測 Red、Green、または正式 oracle ID の昇格を意味しない。共有 `L7-unit-test-design.md` と共有 function-spec は本 scope で変更しない。

## §2 候補 oracle 宣言

| Candidate ID | 対象 | Fixture / 観測 | 期待結果 |
| --- | --- | --- | --- |
| `CANDIDATE-U-UPSTREAM-SCHEDULE-001` | 両 loader | 有効な L3 topic、PLAN-L3-04 不在、repo-relative read trace | 両 loader は L3 topic を返し、PLAN の存在確認・読取は 0 回。 |
| `CANDIDATE-U-UPSTREAM-SCHEDULE-002` | 両 loader と analyzer | L3 topic 固定のまま PLAN を不在／旧版／改変／不正に差し替える | 選択 path と analyzer 結果が同一で、L3 topic に束縛される。 |
| `CANDIDATE-U-UPSTREAM-SCHEDULE-003` | 両 loader と analyzer | L3 topic を欠落、または必要節・表を破損し、PLAN には有効な旧表を残す | violation / fail-close。PLAN を fallback に使わない。 |
| `CANDIDATE-U-UPSTREAM-SCHEDULE-004` | `analyzeDriveModelPassage` / `analyzeRuleAutomationClosure` | L3 §2.1 / §2.3 の移設表を各 loader 経由で読み、analyzer result と行を比較 | 11 mode の Forward target / residual status と、閉鎖表5行の移設意味が保たれ、既存 fail-close が維持される。§2.2 DB table は L3 の移設内容として保つが、この2 analyzer の検証結果とは扱わない。 |

### CANDIDATE-U-UPSTREAM-SCHEDULE-001 — PLAN 読取件数 0

`loadDriveModelPassageDocs(repoRoot)` と `loadRuleAutomationClosureDocs(repoRoot)` は設計正本 `docs/design/harness/L3-functional/upstream-schedule-reconciliation.md` だけを入力として読み、返す各 document の `file` は同パスである。fixture に有効な設計正本を置き、PLAN-L3-04 path を不在にした場合も両 loader は設計正本を返す。fixture の読み取り記録上、PLAN-L3-04 の存在確認・読取は 0 回である。

### CANDIDATE-U-UPSTREAM-SCHEDULE-002 — PLAN 本文で設計正本を上書きできない

設計正本を保持した fixture で、PLAN-L3-04 を欠落させた場合と、旧表・改変表・不正な本文を置いた場合の analyzer 結果は同一である。選択された document path と解析値は設計正本だけに束縛される。

### CANDIDATE-U-UPSTREAM-SCHEDULE-003 — 設計正本の不備時に PLAN へ fallback しない

設計正本の欠落または必須 section/table の破損は violation / fail-close となる。PLAN-L3-04 に旧い有効表が残っていても代替入力にせず、成功扱いしない。

### CANDIDATE-U-UPSTREAM-SCHEDULE-004 — 移設した passage / closure 本文が既存 oracle を保つ

L3 topic の複写本文を実際の loader 経由で解析する。日本語の表見出し「駆動モデル／入口モード」「必須の通過証明書列」「DB テーブル」「必須の意味」「規則」「必須の自動化責務」「現在の状態」を、それぞれ移設元 PLAN-L3-04 の `Drive model / entry mode`、`Required certificate columns`、`DB table`、`Required meaning`、`Rule`、`Required automation owner`、`Current status` と同じ列意味として読む。11 モードすべてが Forward の対象と残余状態を備えること、DB 登録ゲートの記述が L3 §2.2 に保たれること、規則自動化の閉鎖表の5行すべてが読み取られることを確認する。§2.2 の DB 内容保持は文書契約であり、現在の二つの analyzer が DB 登録を検証するという意味ではない。表外のデータから欠落行を補わず、L6 §3 の各 analyzer に記載した既存 fail-close 条件を緩和しない。

正例の実読取結果を基準 fixture とし、analyzer に渡す各負例はそこから対象フィールド一つだけを変えた独立 fixture とする（mode欠落 variant は既定 row 一行だけを削除する）。各変異では section・table・header・残る行の形、他の mode / certificate signal / closure rule / owner / status を有効なまま保つ。空欄や列ずれなど `malformed_row` / `missing_table` に先行分類される setup failure を使わず、期待 reason が当該変異だけで観測できることを確認する。

| 独立 fixture の単一変異 | 保持する有効条件 | 期待 reason |
| --- | --- | --- |
| 既定 mode 1行の `Discovery` を非空の未知名へ改名、または同じ1行だけ削除（各々独立に実施） | 他の10既定 mode と全 certificate cell は有効なまま | `missing_expected_mode` |
| 1 mode の certificate cell から Forward target の有限 signal（L6 §3.1 の英語・日本語同義語を含む）だけをすべて除去 | mode と residual-status signal は保持し、cell は非空 | `missing_forward_target` |
| 1 mode の certificate cell から residual-status の有限 signal（L6 §3.1 の英語・日本語同義語を含む）だけをすべて除去 | mode と Forward-target signal は保持し、cell は非空 | `missing_residual_status` |
| closure の1行の owner を非空の同義語集合外文字列（例: `未登録担当Z`）へ置換 | rule と status は有効なまま | `unknown_owner` |
| closure の1行の status を非空の許可集合外文字列（例: `未定義状態`）へ置換 | rule と owner は有効なまま | `unknown_status` |

## §3 受入境界

この設計 PR では候補を正式 ID へ昇格せず、ソース／テスト実装も行わない。後続実装で候補を検証する際は、fixture が PLAN を読まないことを記録可能な読取計測箇所または同等の計測手段で証明し、PLAN 本文を無視しただけの結果を「読取0」とみなさない。L3 設計正本以外のゲート、テスト件数、既存モード／所有者／閉鎖状態は本 scope で変更しない。
