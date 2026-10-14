---
artifact_type: design_doc
layer: L6
status: draft
sub_doc: function-spec
plan: docs/plans/PLAN-L6-105-consumer-safe-upgrade-contract.md
pair_artifact: docs/test-design/harness/L7-consumer-safe-upgrade-test-design.md
parent_doc: docs/design/harness/L6-function-design/setup-solo-team.md
---

# consumer の安全な upgrade 契約 (#364 系、PO 判断 2026-10-01)

状態: 未実装の目標契約。`src/` に upgrade の実装は無い (所有権表・migration registry・on-disk backup・upgrade plan のいずれも未着手)。本文書は実装 PR が方式をその場で発明しないための契約である。実装は v0.2.0-canary.3 の公開と受入 (#676 / #418) の後に着手する。

目的は、consumer がハーネスの新しい版を取り込むとき、consumer 自身が加えた設定・state を壊さずに新しい版の形へ変換することである。親 #364 の A/B 共存・片系 upgrade / rollback を consumer 内ファイルの粒度で支える。Pack release 単位の publication・rollback (PLAN-L6-63 / L6-102 / L6-101)、`ut-tdd update-check` の advisory (PLAN-L7-362) は範囲外で、本契約は再定義しない。

## 1. 現行実装の baseline (main 6b5effbc、2026-10-01 実測)

行番号は `git show 6b5effbc:<path>` の行。契約が既存の挙動と食い違う点を明示するための表である。

| # | 事実 | 根拠 |
|---|---|---|
| F1 | managed block で混ぜられるのは `AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` の 3 つだけ。block の外は文字としては保たれるが byte 単位では保たれない (目印が既存にあり結合結果が改行で終わらないと末尾へ `\n` を足す。block 部分は rendered 側の bytes (LF) で差し替わる) | `MERGEABLE_ADAPTER_DOCS` (`src/setup/index.ts` 647, 812)、`mergeManagedBlock` 786-801 |
| F2 | それ以外の既存ファイルは非対話なら skip、対話で `y` なら差分表示も backup もなく丸ごと上書き | `src/setup/index.ts:821-829`、`tests/setup.test.ts` U-SETUP-016b (361) が固定 |
| F3 | `COMMON_FILES` の `category` は全件 `"A"` で所有権を表す属性は無い | `src/setup/templates.ts` 645-774 |
| F4 | rollback の snapshot は process 内の Buffer で disk に残らず、process 死亡で復旧できない | `captureSetupFiles` 1051-1077、`restoreSetupFiles` 1079-1100 |
| F5 | snapshot を取るのは `runSetupAsync` かつ `consumerRuntime` 指定かつ非 dry-run の時だけ。素の `runSetup` に rollback は無い | `src/setup/index.ts:950-983` |
| F6 | `harness.db` は snapshot 対象外。`runSetup` は既存 DB に `initializeHarnessDb` (migrate + `rebuildHarnessDb`、1 transaction で truncate / 再 projection) を呼ぶ。rebuildable でない表の有無は未測 | `src/setup/index.ts:931-939`、`src/state-db/projection-writer.ts:2624-2650` |
| F7 | `.gitignore` は `ensureSkillAssetsIgnored` で目印範囲を差し替えるが、目印が無い (初回) ときは末尾の空白・改行 (CRLF 含む) を削ってから `\n\n<managed>\n` を足す。空白のみの既存は丸ごと置換。利用者の行の保存を名指しで固定する test は無い | `src/shared/embedded-skills.ts:397-409`、呼び出し `src/setup/index.ts:906-913` |
| F8 | setup の state / identity に `schema_version` を持つ記述は無い (`.ut-tdd/state/setup.json`) | `src/setup/index.ts`、`src/setup/templates.ts` |
| F9 | #364 系の rollback 契約 (PLAN-L6-63 / L6-102) は Pack release 単位の revert / channel pointer で、consumer 内ファイルの backup 形式は定めていない | PLAN-L6-63 に consumer file backup の定義が無い |
| F10 | `runSetup` の書込経路は (a) `emitSetup` の rendered artifacts、(b) `.ut-tdd/state/setup.json`、(c) `.gitignore`、(d) skill assets (`embeddedSkillAssets()`)、(e) project identity bootstrap の 5 つで全て。`package.json` / `commitlint.config.js` / 設計文書は書込先ではない (commitlint は読んで notice を出すだけ) | `src/setup/index.ts:804-831,838-851,873,906-913,926-930` |
| F11 | `setupTargetPaths` (rollback の snapshot 対象) は `ut-tdd.project.json`・`setup.json`・`.gitignore` と `planSetup` の files だけで skill assets を含まない。(d) は既存を直接上書きする。現行 rollback は skill assets を復元できず、書込先と snapshot 対象が一致しない | `src/setup/index.ts:1044-1048`、`src/shared/embedded-skills.ts:324-331` |

## 2. 設計判断

advisor 相談 (`--decision design`、provider=claude model=claude-fable-5、2026-10-01) の回答は repo 実測で検証し、食い違いは各判断の「実測照合」に残す。

### D1 所有権分類

所有権 SSoT 表を 1 か所に置く。値は 3 種。

- `harness-owned`: 全体を置換してよい。条件は「存在しない」か「既存 bytes が過去にハーネスが配布したいずれかの版の digest と一致する (consumer 未編集)」。
- `consumer-owned`: 一切触らない (`package.json`、`commitlint.config.js`、設計文書)。setup の書込先ではない (F10) ので表の母集合ではなく、「触れない path の宣言」として付記する。
- `marker-mixed`: 管理範囲の目印の外は既存 bytes を byte 単位で保つ (`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` / `.gitignore`)。F1・F7 の通り現行の `mergeManagedBlock` / `ensureSkillAssetsIgnored` はこの契約を満たさない (外側の末尾改行補完、目印不在時の末尾空白・CRLF の削除)。upgrade の書込 (marker-merge) は外側の byte 列を一切変えず、補完する改行は block の内側だけで行う。現行との差分は破壊的変更で、AC2 / CANDIDATE-U-SAFEUP-002・009 が現行実装を RED にする。

`harness-owned` で既存 bytes がどの配布版 digest とも一致しない (consumer 編集済み) ときは自動 merge せず conflict として停止する。対象は `.claude/settings.json`、`.codex/config.toml`、`.codex/hooks.json`、`.github/workflows/*`、`commitlint.config.cjs`、`.ut-tdd/assets/skills/**` など (skill assets は現行が無条件上書き = F11 のため、編集済みは conflict に変わる破壊的変更)。`.ut-tdd/state/setup.json` は digest 照合でなく D2 の registry で変換する。

母集合は setup が書く全 path で、`COMMON_FILES`・`setupTargetPaths`・F10 の (a)-(e) の全書込先 (skill assets の全 path を含む)。D3 の plan / conflict、D4 の backup / rollback も同じ母集合を対象にする (F11 の不一致は解消対象)。母集合に属さない path が書かれた場合、母集合の path が未分類の場合は test で fail-close する。

棄却: 汎用 3-way merge (base を consumer 側に永続保持する新しい信頼根が要り、JSON / TOML / YAML / markdown で conflict の意味が揃わない。未編集か否かは配布版 digest 集合で足りる)。JSON / TOML の key 単位 merge (再 serialize で整形・コメントが変わり AC2 を破る。必要になれば別契約 = O4)。

実測照合: advisor は「mixed は 3 ファイル程度」と推定した。F1・F3 で marker-mixed が 3 つ (+ `.gitignore`) と確認した。consumer の実編集率は未測 (M3) だが、編集済みは conflict 停止に倒れるので結論は変わらない。

### D2 版付き migration registry

settings / state schema に版を持たせ、`vN -> vN+1` の step を registry に登録する。step は「入力 bytes -> 出力 bytes」の純関数で source / target の版を宣言し、連鎖で現行版まで進める。版の記録が無い既存 consumer は registry が明示登録した `v0` として扱う (暗黙推定ではなく v0 -> v1 を最初の step として登録)。登録外の版、現行より新しい版、parse 不能な版は fail-close (書込 0)。

棄却: 版が無ければ fail-close (F8 の通り現行 consumer の state に版が無く、初回 upgrade で全員が停止する)。`.ut-tdd/state/setup.json` の実内容は未確認で、実装前の測定 PR で実測する (M4)。

### D3 dry-run 必須と conflict 停止

書込の前に必ず plan を作る。plan は D1 の母集合の path ごとに `{owner, action: create | replace | marker-merge | keep | conflict, diff}` を持つ。conflict が 1 件でもあれば何も書かず非 0 で終了する。apply は同一 process 内で作った plan だけを消費する (別 invocation の古い plan を適用しない)。非対話での silent skip は廃止し、停止した path と理由を出力する。marker-mixed で目印が壊れている (開始だけ・順序逆転など) 場合も conflict に合流させる。現行 `mergeManagedBlock` は目印が無いとき末尾追記する (`src/setup/index.ts:799-800`) ので、壊れた目印の扱いはこの点で挙動が変わる。即書込 (dry-run 任意) は棄却。

### D4 backup の置き場と rollback

on-disk の `.ut-tdd/upgrade-backup/<upgrade_id>/` に、母集合の対象 path ごとの元 bytes・mode・存在有無と manifest (path / sha256 / mode / existed) を書く。manifest は `prepared` -> `committed` の 2 段階で、`prepared` は backup の完成 (全対象 path の元 bytes と manifest が書き終わったこと)、`committed` は全 consumer 書込が成功した後にだけ公開する。consumer 書込は必ず `prepared` の後、`committed` の前に行い、個々の書込は一時ファイル + rename とする。

| 状態 | 期待 |
|---|---|
| 1. backup 書込中 (manifest 未完成) | consumer 対象 tree は未変更。manifest が無い・不完全な `<upgrade_id>` は「未開始」として次回起動時に無視・掃除する |
| 2. `prepared` 後、書込中・直後に in-process で失敗 | 同 process が復元し、consumer 対象 tree は upgrade 前と一致。manifest は `rolled-back` に更新して残す (診断用 recovery metadata) |
| 3. process 死亡で `prepared` のまま残る | 次回起動時に先に rollback して upgrade 前へ戻し、`rolled-back` にする |
| 4. `committed` | rollback しない |

比較範囲は 2 つに分ける。consumer 対象 tree (母集合 + それを含む directory、`.ut-tdd/upgrade-backup/` を除く) は失敗後に path 集合・bytes・存在有無 (POSIX は mode) が upgrade 前と一致する。recovery metadata (`.ut-tdd/upgrade-backup/` 配下) は上表の期待 (1: 無し、2-3: `rolled-back` の manifest と元 bytes が残る) を別 assert とし、tree 一致の比較に混ぜない。

復元の意味論 (bytes + mode の復元、新規作成物の削除、directory は深い順) は既存 `restoreSetupFiles` と同じにして実装を共有する。#364 と共有するのは復元意味論と per-runtime-root 隔離で、F9 の通り consumer ファイル backup の置き場・形式の既存仕様は #364 側に無いため、本契約が置き場を定める。backup は各 consumer 自身の `.ut-tdd/` 配下にあるので、A/B の片系 upgrade は互いの backup を見ない。backup 配下は projection / doctor / git の走査対象から除外する。

世代の上限と古い世代の削除は自動実行しない。recovery data を消す破壊的 data 操作に当たるため、方式 (O2) と PO 承認 (P3) が閉じるまで世代は蓄積する。

`harness.db` は backup しない (rebuildable な projection は `ut-tdd db rebuild` で復元できる)。rebuildable でない表の有無が未測 (M2) のため、upgrade の file transaction の中で `rebuildHarnessDb` / `initializeHarnessDb` を呼ばない。DB の版変換は D2 の registry の別 step として、実測後の別 PR で扱う。

棄却: in-memory snapshot の継続 (F4・F5・F6・F11 の通り巻き戻せない窓が実在する)。実測照合: advisor は「#364 と同じ置き場・復元経路を再利用」と述べたが、F9 で該当仕様が無いと確認し上記へ修正した。

### D5 対話時の丸ごと上書きの禁止と `--replace`

既定で禁止する。`y` で consumer 編集済みファイルを丸ごと置換する経路を廃止する (harness-owned の未編集置換は D1 で行え、編集済みは conflict 停止となるので不要)。唯一の例外が `--replace <path>`。

- 対象は D1 で `harness-owned` かつ plan が `conflict` と判定された path のみ。`consumer-owned` と `marker-mixed` (壊れた目印を含む) は許可しない (解消は利用者の手編集)。
- `<path>` は consumer root からの正規化済み相対 path で、D1 の表に載る正確な 1 path。glob・ディレクトリ・複数指定・絶対 path・`..`・symlink 経由で root の外へ出る path は fail-close。
- D3 の diff 表示と D4 の backup を必須通過し、backup が `prepared` として完成する前に置換しない。置換を含む全書込が成功した後にだけ `committed` を公開する。途中で死亡した場合は `prepared` のまま残り、次回起動時の rollback で置換前へ戻る。置換前の bytes は backup に残る。
- 優先順位は (1) D1 の所有権分類 -> (2) D3 の conflict 判定 -> (3) `--replace` の受理判定。受理された path だけ plan の action を `conflict` から `replace` に変える。他の conflict が 1 件でも残れば D3 どおり何も書かず停止し、受理済みの `--replace` も実行しない。範囲外の `--replace` 指定はそれ自体が fail-close (書込 0、非 0 終了) で、conflict 停止より先に判定してよい。AC2 の byte 不変の例外は、受理されて実行まで到達した 1 path に限る。
- データ破壊を伴うため、仕様の確定は PO 承認が要る (P1)。

棄却: diff + backup 付きで `y` 上書きを許す (所有権分類と二重経路になり drift 源になる)。破壊的変更: U-SETUP-016b (`y` で既存ファイルを上書きする test) は新契約と衝突するので、実装 PR で test-design の凍結 oracle ごと改訂する。これは契約改訂であり軽作業の是正ではない。

## 3. 受入条件 (反証可能)

各条件は `docs/test-design/harness/L7-consumer-safe-upgrade-test-design.md` の `CANDIDATE-U-SAFEUP-*` に対応づける。実装 PR で正規 ID へ昇格する。

| AC | 内容 | candidate |
|---|---|---|
| AC1 所有権 | setup が書く全 path (F10 の全書込先、skill assets を含む) が SSoT 表で分類済み。未分類が 1 つでもあれば fail。書込先の列挙は実装の出力ではなく F10 の経路ごとに独立に導出する | 001 |
| AC2 consumer 書込不変 | consumer が書いた行・設定は 1 byte も変わらない (marker-mixed は目印外、consumer-owned は全体、conflict 停止時は全 path)。唯一の例外は D5 の `--replace` が受理された 1 path (置換前 bytes は backup に残る)。CRLF / LF 混在、BOM、末尾改行なしで block が末尾にあるケース、目印不在 (初回) の末尾空白・CRLF を含み、F1・F7 の反例が RED になる (Windows / Linux) | 002 / 009 |
| AC3 失敗後の tree 一致 | 途中のどの段階で失敗させても consumer 対象 tree は upgrade 前と bytes・存在有無まで一致 (POSIX は mode も)。失敗注入は書込 N 件目ごとに全点。recovery metadata は D4 の状態遷移で別 assert (Windows / Linux) | 003 |
| AC4 crash 回復 | `prepared` の backup が残る状態から再開すると先に rollback して tree が upgrade 前に戻り、manifest は `rolled-back` になる | 004 |
| AC5 migration | `v0 -> 現行` の連鎖が登録順に進む。登録外・新しすぎる・parse 不能な版は書込 0 で fail-close | 005 |
| AC6 dry-run / conflict | conflict が 1 件でもあれば書込 0 で非 0 終了し path と理由を出力。非対話でも silent skip しない | 006 |
| AC7 丸ごと上書き禁止 | 対話 `y` で編集済みファイルが置換されない。`--replace` は D5 の範囲のみ受理し範囲外は fail-close。受理時は diff と backup を必ず作り、対象が新 bytes と一致・backup が置換前と一致・他 path は不変。拒否時は全 path 不変・書込 0・非 0 終了。両者を別 assert で区別する | 007 |
| AC8 A/B 隔離 | consumer A の upgrade・rollback が consumer B の tree と backup を変えない | 008 |
| AC9 未確認事項の実測 | `.gitignore` の利用者行の保存 (M1) と既存 `harness.db` の扱い (M2) を実測し、必要なら oracle を追加 | 009 / 010 |

## 4. Windows / Linux の差

oracle は両 OS で実行する。改行・BOM は bytes 比較で正規化しない (`.gitattributes` の eol=lf は consumer 側の設定で upgrade は書き換えない)。mode 一致の assert は POSIX のみで、Windows は存在有無と bytes で代替する (代替であることを test に明記)。rename は Windows の `EBUSY` / `EPERM` に対し有限回 retry の後に失敗し、失敗時は rollback する。SSoT 表の key は正規化済み相対 path とし、Windows の case-insensitive な衝突は conflict として停止する。

## 5. 実装の順序と PR 分割 (1 PR = 1 論点)

実装 PR は canary.3 の受入 (#676 / #418) の後に着手し、本線の canary 作業に混ぜない。順序は PR-1 -> PR-3 -> PR-4 -> PR-5 -> PR-6 で、PR-2 は PR-1 と並行してよい。P1-P3 の PO 承認が閉じるまで PR-5 の世代削除と PR-6 の `--replace` は着工しない。

| PR | 論点 | 新規 source_module |
|---|---|---|
| PR-1 | 所有権 SSoT 表と AC1 (配線なし) | 1 (`src/setup/ownership.ts` 想定) |
| PR-2 | 測定のみ: M1 / M2 / M4 の test (read-only)。結果次第で本契約を改訂 | 0 |
| PR-3 | migration registry と v0 規則 (AC5、配線なし) | 1 |
| PR-4 | upgrade plan (dry-run diff / conflict) の純関数 (AC6、書込なし) | 1 |
| PR-5 | on-disk backup / rollback / crash 回復 (AC3・AC4・AC8)。復元意味論は `restoreSetupFiles` と共有、世代削除は含めない | 1 |
| PR-6 | setup への配線、対話上書きの廃止、`--replace`、U-SETUP-016b の改訂 (AC2・AC7)、CLI surface | 0 (配線のみ) |

## 6. 責務どうしの依存

- 所有権 SSoT (D1) は plan (D3) と backup (D4) の母集合を与える。D3・D4・D5 は D1 に依存する。
- backup (D4) は `--replace` (D5) の前提 (`prepared` の完成後にだけ置換する)。
- migration registry (D2) は `.ut-tdd/state/setup.json` の変換を担い、D1 の digest 照合の対象外。
- `harness.db` の版変換は本契約の範囲外 (M2 の実測後に別契約)。

## 7. 非対象

Pack release 単位の publication・rollback、`update-check` の advisory、JSON / TOML の key 単位 merge と汎用 3-way merge、`harness.db` の schema 変換と backup、consumer の `package.json` / 設計文書の自動変更、認証・認可・課金・PII・secret・外部 API 前提の変更。

## 8. 未確認事項 (実測予定、PR-2)

- M1: `.gitignore` の利用者の行が upgrade 後も保たれるか。F7 で末尾空白・改行の削除はコード上で確認済みだが、名指しの test が無く、行順・コメントの差分は未測。
- M2: 既存 `harness.db` に対する `rebuildHarnessDb` が rebuildable でない表を消さないか (`clearRebuildableProjectionTables` の対象外の表を列挙する)。
- M3: 全 `COMMON_FILES` について consumer が実際に編集している率。
- M4: `.ut-tdd/state/setup.json` と `ut-tdd.project.json` の実内容と版の有無 (v0 規則の入力)。

## 9. open questions

- O1: upgrade の入口を新 verb (`ut-tdd upgrade`) とするか、`ut-tdd setup` の既存 consumer 検出時の挙動とするか。PR-6 の前に契約を改訂して freeze する。
- O2: backup の世代上限 (3 は暫定) と、世代を超えた backup の掃除方式。P3 の PO 承認が前提で、承認まで自動削除しない。
- O3: 配布版 digest 集合の保管場所 (Pack manifest 由来か `src/` 内の表か)。Pack の独立性 (source repo を実行時入力にしない) と矛盾しない側を選ぶ。
- O4: JSON / TOML の key 単位 merge を将来導入するか。導入する場合は AC2 との両立方式から契約化する。

## 10. 高影響境界と PO 承認待ち項目

本契約は destructive data operation に触れる。次の操作は consumer の既存 data を置換・削除し得るため、advisor 回答にかかわらず実装前に PO 承認が要る (承認前は契約として freeze しても実装 PR は着工しない)。

| ID | 操作 | 内容 | 現時点の緩和 (承認の代替ではない) |
|---|---|---|---|
| P1 | `--replace <path>` による編集済みファイルの置換 | harness-owned かつ conflict の 1 path に限り、diff + backup `prepared` 完成後に置換し、全書込成功後に `committed` (D5) | 範囲限定、diff 必須、backup で復元可能 |
| P2 | rollback による復元と、upgrade が新規作成した path の削除 | `restoreSetupFiles` と同じ意味論で復元し、元々存在しなかった path を削除する (D4)。削除は manifest の `existed: false` に限る | manifest に基づく。consumer 既存 path は削除しない |
| P3 | backup 世代の削除 | 上限を超えた古い `<upgrade_id>` の削除 (O2)。recovery data の消去 | 承認まで自動削除しない (蓄積) |

承認の取得経路は `docs/governance/design-decision-elicitation.md` の形式とし、advisor 結果と実測 (F1-F11) を添える。これ以外の高影響境界 (production infrastructure・認証認可・課金・PII・secret・licensing・外部 API 前提) には触れない。
