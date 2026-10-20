---
title: "L7 memory episode retirement test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-19
---


# 共有メモリのエピソード回収 テスト設計 (issue #963 / PLAN-L6-97)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/memory.md` の §4.2 (エピソードの回収) である。
本書は §4.2 の分類・読み取り時の既存分の扱い・回収の三値判定・退避の冪等性・配送側の抑止を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引だけを置き、
本書が詳細の正本である。この pair-freeze では候補 ID (`CANDIDATE-U-MEMEPI-*`) だけを宣言し、実装 PR で Red を
追加してから `U-MEMEPI-*` へ昇格する。001〜011 は PLAN-L6-97 (2026-08-05) の候補を引き継ぎ、012〜019 に加えて、
退避 recovery / destination collision / archive manifest / resolver / selector 分離の境界を閉じる 020〜029 を足す。

既存 `CANDIDATE-U-MEMEPI-001..019` の acceptance responsibility は記録から削除せず、020..029 を追加する。ただし #963 の archive slice で実装・
受入するのは既存 entry の分類 / 回収 / recovery (002〜005、007〜008、014〜017、019〜029) に限る。新規 write 規則
(001、006、011〜013) と即時 delivery / review-anchor 規則 (009〜010、018) は #1062 が置き換えた旧契約として別ownerの
未完責務に留め、対応する実装・受入で移管先が明示されるまで完了扱いにしない。候補行はその責務を追跡する証跡として残す。

## 2. 計測値 (2026-10-13、main 96da70d6)

| 項目 | 値 | 取り方 |
| --- | --- | --- |
| `.ut-tdd/memory` の全ファイル | 1865 | `ls .ut-tdd/memory \| wc -l` |
| git 追跡 | 46 | `git ls-files .ut-tdd/memory \| wc -l` |
| 名前に `pr-N` を含む | 1435 | advisor 実測 (`ls \| grep -ciE 'pr-?[0-9]+'` 相当) |
| 1 日あたりの増加 | 約 100 | `ls -lt` の日付別件数 (2026-09-24〜10-09) |

実装 PR は、同じコマンドで実 repo を測り直して dry-run の件数と照合する (CANDIDATE-U-MEMEPI-016)。

## 3. 前提と fixture

- 一時 git repo に `ut-tdd.project.json` (repository_identity = `example/repo`) を置き、default branch に
  `Merge pull request #10 from ...` の merge commit を 1 本作る。PR 11 は merge commit なし。
- GitHub への問い合わせは注入可能な port とし、テストは fake を渡す (open / closed / 到達不能を切り替える)。
- `.ut-tdd/memory` に tracked / untracked、kind 別のファイルを置く。分母は直下の全 entry 数とし、拡張子外 regular
  file と direct directory を少なくとも1件ずつ fixture に置き、`not_memory_entry` として保持・計数されることを確認する。
- `retireMemoryEpisodes` は実 service operation と実 file / isolated projection DB で呼ぶ。共有 harness DB は開かない。
  DB 操作は fixture が isolated sqlite の test adapter を `ports.db` (`inspectEntry` / `deleteEntryRow`、設計 §4.2 DB port) に注入して通す。
  `ports.db` を省略した呼び出しは production adapter へ fallback せず fail-close する (CANDIDATE-U-MEMEPI-029)。
- fault は実 operation の同期 checkpoint port だけに注入し、status resolver fake は GitHub 外部状態だけに使う。
  PR の first-parent merge 証拠、分類、manifest append、rename、DB delete と recovery は実処理を観測する。
- checkpoint 例外直後の on-disk / DB 状態を recovery 再実行の**前に**直接 assert する。unimplemented export import、CLI
  unknown-command のみを Red とみなす test、test-only env switch、偽 archive implementation は使わない。

## 4. oracle

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| CANDIDATE-U-MEMEPI-001 | `memory add --lifecycle episode` で `--bound-to` なし、title に番号なし | exit 1、ファイルを書かない | episode の bound_to 必須検査を外す |
| CANDIDATE-U-MEMEPI-002 | git 追跡済み、`lifecycle` 未宣言、title に `PR 10` | `durable`、retire の dry-run / `--archive` とも対象外 | tracked 判定を外して推定を掛ける |
| CANDIDATE-U-MEMEPI-003 | untracked `kind=project`、`bound_to` = PR 10 (merge commit あり)、fake は到達不能 | `retirable` (offline で確定) | merge commit 検査を GitHub 依存に置き換える |
| CANDIDATE-U-MEMEPI-004 | `bound_to` = PR 10 と issue 20 (fake で open) | `ok` | 全件 closed の条件を「どれか closed」に緩める |
| CANDIDATE-U-MEMEPI-005 | `bound_to` = PR 11 (merge commit なし)、fake は到達不能 | `unknown`、doctor の row は advisory で exit に影響しない | unknown を retirable / ok に倒す |
| CANDIDATE-U-MEMEPI-006 | `--bound-to` に PLAN ID、path、別 repo の URL | それぞれ exit 1 | URL の repo 照合を外す |
| CANDIDATE-U-MEMEPI-007 | `retireMemoryEpisodes` dry-run を実 operation で呼び、success report の `dryRun:true` と全 bucket/count を観測 | `total` と10 bucket合計が `.ut-tdd/memory` 直下の全 entry 数に一致し、`moved` は予定一覧。file bytes / path、isolated `memory_entries`、manifest bytes は不変。CLI handler は exit 0 | dry-run で file / DB / manifest を変更する、または report の全数が不完全 |
| CANDIDATE-U-MEMEPI-008 | `lifecycle: durable` + `bound_to` あり (教訓の根拠引用) | `retirable` にしない | lifecycle を見ずに bound_to だけで判定する |
| CANDIDATE-U-MEMEPI-009 | `episode`、`declared`、判定 `retirable` の entry を即時配送に渡す | 配送しない | 配送 filter を外す |
| CANDIDATE-U-MEMEPI-010 | `episode`、判定 `unknown` の entry を即時配送に渡す | 配送する | unknown を抑止側へ倒す |
| CANDIDATE-U-MEMEPI-011 | `memory add --kind project`、明示なし、title / tags に番号なし | exit 1、`--lifecycle` の指定を案内する文言 | 既定値 durable へ黙って倒す |
| CANDIDATE-U-MEMEPI-012 | `memory add --kind project`、明示なし、title `PR962 Issue898 ...` | `lifecycle: episode`、`lifecycle_source: inferred`、`bound_to` = pull/962 と issues/898 の 2 件 | 最初の 1 件だけ拾う / PR と issue を取り違える / `declared` と書く |
| CANDIDATE-U-MEMEPI-013 | `memory add --kind feedback`、明示なし、title に `PR 551` | `lifecycle: durable` (推定しない) | kind を見ずに推定する |
| CANDIDATE-U-MEMEPI-014 | `retireMemoryEpisodes(..., dryRun:false)` の同一 production processor に isolated sqlite test adapter を `ports.db` へ注入し、4 checkpointを順に注入。(a) `beforeIntentAppend`: manifest行なし、元file。(b) `afterIntentAppendBeforeRename`: intent行あり、元file。(c) `afterRenameBeforeDbDelete`: intent行あり、移し先hash一致、DB row残存。(d) `afterDbDeleteBeforeDoneAppend`: intent行あり、DB row不在 | checkpoint throw直後・再実行前に各状態を manifest/file/hash/isolated DB から観測。再実行後は各点で `done` 1件、移し先hash一致、DB row不在、二重移動なし。新規処理前の全entry preflightと append→rename→DB delete→done順を実経路で通す | intentをrename後に書く / DB・filesystem stepを迂回 / 重複done / checkpointを実処理の代替にする |
| CANDIDATE-U-MEMEPI-015 | isolated repo / projection DB に isolated sqlite test adapter を `ports.db` へ注入して実 archive operation 後に既存 `readMemory` と DB status を呼ぶ | `freshness: fresh`、index-only 行 0、対象外 entry の検索は維持 | DB row 削除を省く / harness DB を test fixture として使う |
| CANDIDATE-U-MEMEPI-016 | 固定 fixture (tracked direct entries 2、untracked durable feedback 1、declared episode 3区分、inferred episode 1、parse failure 1、non-`.md` regular file 1、directory 1) で実 dry-run。実 repo は report と read-only direct-entry enumeration を照合 | fixture: exact 10 bucket値、合計10、`not_memory_entry` = 2。実 repo: report total = `.ut-tdd/memory` 直下の全 entry 数、bucket合計 = total、`tracked_durable` = `git ls-files` 結果のうち同じ direct-entry 集合に属する行数。nested tracked path は direct entry count に含めず、tracked symlink / submodule entry は follow / recurse せず `tracked_durable` に含める。reportは件数とretirable rowsを照合可能 | bucket省略 / double count / trackedを候補扱い / 拡張子外・非regular entryの黙殺 / nested pathとの誤照合 / 不完全な集計を成功報告 |
| CANDIDATE-U-MEMEPI-017 | 既存 untracked inferred episode「PR 949 で学んだ恒久の設計制約」、PR 949 merge 済み。dry-run と archive を各々実呼び出し | `episode_retirable_inferred`。通常 archive では `moved` に入らず source / DB / manifest 不変。`includeInferred:true` の archive のみ対象にする | inferred を既定 archive 対象に含める |
| CANDIDATE-U-MEMEPI-018 | 新規 `memory add --kind project`、明示なし、title `Permanent project invariant learned from PR 949` (および `pr-949` / `Issue 898` の変種)、PR 949 は merge 済み、即時配送に渡す | `lifecycle_source: inferred` で保存され、配送される | 配送抑止で `lifecycle_source` を見ない |
| CANDIDATE-U-MEMEPI-019 | 実 operation を checkpoint `afterRenameBeforeDbDelete` で止め、再実行前に (1) destination bytes を1 byte改変 (2) source / destination両方を欠落させる | 両方とも全entry recovery preflight が `memory_archive_recovery_conflict` / CLI exit 1。`done` 無し、対象 DB row 残存、他 entry の新規 append / rename / DB delete なし | hash検証を外す / missingを成功扱い / conflict後に他entryを処理 |
| CANDIDATE-U-MEMEPI-020 | 既存 `done` row を持つ各 recovery fixture で source absent + destination present + destination SHA=row SHA の正当形、および source present / destination absent / both present / both absent / hash mismatch の各不正形を実 operation に渡す | 正当形だけを処理済みとして受理し二重移動・重複 `done` を行わない。不正形は全 entry preflight で `memory_archive_recovery_conflict`、対象 DB rowを保持し他 entryの新規処理をしない | `done` を無条件 skip / 不正な source-destination 状態を成功扱い |
| CANDIDATE-U-MEMEPI-021 | 新規選択 entry の destination を事前作成する、または回復可能な既存 `intent` には結び付かない同一 `memory_id` の archive row と新規 source を共存させる | rename / manifest append / DB delete 前に `memory_archive_recovery_conflict`。既存 destination bytes と source bytes を保持し、黙示上書き・黙示 skip をしない。回復可能な既存 `intent` はCANDIDATE-U-MEMEPI-014どおり再開する | POSIX rename 上書き / 同じ `memory_id` の新規登録を既存 `done` として無条件 skip / valid intent recovery の誤拒否 |
| CANDIDATE-U-MEMEPI-022 | `retireMemoryEpisodes` に不正な UTC ISO `nowISO` を渡し filesystem / DB I/O を観測する | `TypeError` が同期的に送出され、filesystem と DB の I/O は 0 | invalid clock の検査を I/O 後に行う / typed failure に丸める |
| CANDIDATE-U-MEMEPI-023 | first-parent merge がある PR を archive し、実 manifest event と resolver 呼出しを観測する | event / `selection_basis` / `closed_evidence` が各 exact keys。Git evidence は `{url, via:"git_first_parent_merge", commit_sha}`、commit_sha は Git root の実 merge commit SHA。resolver は呼ばれず、intent/done は同一 payload (state以外) と `recorded_at` を持つ | SHAを合成・短縮する / resolverでmerge根拠を置換 / extra keys / done payload を再 mint |
| CANDIDATE-U-MEMEPI-024 | merge commit がない PR と closed issue を fake resolver が closed と返す状態で各々 archive し、manifest を直接読む | GitHub evidence は exact keys `{url, via:"github_closed", observed_state}`、`observed_state:"closed"`。`bound_to` URL 昇順で全 evidence が入り、intent/done payload と `recorded_at` は一致 | GitHub evidence を異なる schema で記録 / bound_to の一部省略 / event に余剰 key |
| CANDIDATE-U-MEMEPI-025 | 独立した2 fixture: (a) manifest に unknown schema row、(b) #963 または #1062 の既知 schema を名乗る malformed row (foreign state-channel schema の不正形を含む)。各々他に処理可能な entry を用意する | 各fixtureが独立に `memory_archive_recovery_conflict` で全体停止。追加 intent / rename / DB delete / done なし。他 entry の source・DB row も維持 | unknown / malformed row を黙って無視 / conflict 後に部分処理 |
| CANDIDATE-U-MEMEPI-026 | merge commit のない PR / issue の status resolver が throw または `{state:...}` の不正値を返す | `unknown` bucket に入り、archive 対象外。成功 report は exit 0、対象の manifest intent / file / DB 変更なし | resolver failure を `closed` / `open` に推定、typed archive failure として全 operation を誤停止 |
| CANDIDATE-U-MEMEPI-027 | 同一 manifest に有効な `ut-tdd.state-channel-memory-archive/v1` event があり、#963 selector に処理可能な自身の entry を用意する | foreign event は #1062 §7.1 の closed schema で検証され、#963 の selection/recovery input に使われない。#963 は自身の entry だけを処理し、foreign row bytes / 関連 file / DB row は不変 | foreign eventを#963のselection/recoveryへ混入、または有効foreign rowの存在だけで誤conflict |
| CANDIDATE-U-MEMEPI-028 | composition root (`ut-tdd memory retire` handler) が構築する production adapter の DB 対象を、resolver の `canonicalProjectRoot` と (a) 一致、(b) 不一致 (別 worktree / 別 root の harness.db) にして handler を実呼び出し。(b) は filesystem / manifest / DB の I/O 前後を観測 | (a) は adapter が注入され通常どおり成功。(b) は `retireMemoryEpisodes` 呼び出し前に fail-close し (`memory_archive_io_failed`、CLI exit 1)、source / manifest / 両 DB の bytes と row は不変、adapter は作られない | 一致検証を外す / 検証を呼び出し後に行う / 不一致を warning で続行し別 DB の row を削除する |
| CANDIDATE-U-MEMEPI-029 | `retireMemoryEpisodes` を `ports` 省略、および `ports.db` 省略 (他 port のみ) で、`dryRun:true` / `false` の双方で呼び、filesystem / manifest / DB の I/O を観測。不正 `nowISO` との併用も確認 | 有効 `nowISO` では `{ ok:false, reason:"memory_archive_io_failed" }`、I/O は 0 で file / manifest / DB 不変。不正 `nowISO` は従来どおり `TypeError` が先 (CANDIDATE-U-MEMEPI-022)。production adapter / service 内 SQL への fallback で行を削除しない | `db` 省略時に production adapter を既定で使う / service 内で SQL を直接実行する / 省略を成功・空 report に丸める |

## 5. 範囲外

- エピソードを別の置き場へ書く (#424 の bus) こと。v4 で扱う。
- ファイルを削除すること。経路自体を持たない (設計 §4.2)。
- review dispatch が錨を memory に書くこと自体の変更。
