---
plan_id: PLAN-L6-105-consumer-safe-upgrade-contract
title: "PLAN-L6-105 (add-design): consumer の upgrade で既存の設定・state
  を壊さず新しい版へ変換する契約 freeze"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-01
updated: 2026-10-01
owner: Claude control lane (契約起草、Opus 週次上限のため Sonnet 代替) / Codex (実装 PR) / 非著者
  frontier reviewer (Codex Sol)
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
pair_artifact: docs/test-design/harness/L7-consumer-safe-upgrade-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 既存の setup 非破壊導入契約 (PLAN-L7-361) と managed block 方式を
  upgrade へ拡張する L6 契約であり、L0-L3 要件の意味は変えない。実装 PR で新契約が生じた場合のみ Reverse を起票する。
agent_slots:
  - role: tl
    slot_label: TL - 所有権分類 SSoT と、conflict 時 fail-close の境界を freeze する
  - role: se
    slot_label: SE - migration registry、on-disk backup、crash 回復の手順を定義する
  - role: qa
    slot_label: QA - consumer 書込 bytes 不変と失敗後 tree 一致の oracle を Windows / Linux で定義する
generates:
  - artifact_path: docs/plans/PLAN-L6-105-consumer-safe-upgrade-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/setup-solo-team.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-361-setup-noninteractive-package-tar-portability.md
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
    - docs/plans/PLAN-L7-362-pack-update-check-advisory.md
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/test-design/harness/L7-consumer-safe-upgrade-test-design.md
    - src/setup/index.ts
    - src/setup/templates.ts
    - src/shared/embedded-skills.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/814
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/364
review_evidence: []
status: draft
github_issue_id: 814
admission_receipt:
  schema_version: v2
  receipt_id: certificate:cbd62d51e78442407cf65a9c5e796c1e
  command_id: plan-revise:issue-814:safe-upgrade:sol-r2-fix:r3:7a419f2b0712
  admitted_at: 2026-10-05T01:43:13.723Z
  source_digest: sha256:cbf4a130044faa7201151435796b6047b9a3aed26c2b01d5c4ef59c03fc6dc47
  decision_digest: sha256:319a93f5f1de1944a54b873206e089a35f2366ab0666ec8253aa9a97f2ca1a54
  receipt_digest: sha256:d668c3c63db3ddabfa5e748b808213e78c7573990ad95ec9cedc24abebcc8098
  binding:
    path: docs/plans/PLAN-L6-105-consumer-safe-upgrade-contract.md
    plan_id: PLAN-L6-105-consumer-safe-upgrade-contract
    asset_id: plan:d19459038adff829fcb3c25921395d6c
    revision: 3
    content_digest: sha256:cbf4a130044faa7201151435796b6047b9a3aed26c2b01d5c4ef59c03fc6dc47
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 814
    episode_id: E4-814-consumer-safe-upgrade
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
    revision: 11
    digest: sha256:604fcda0ef7e101ecd8df79e682704d0475dc9be62f6afb077916114f192df52
  reentry:
    target_plan_id: PLAN-L6-105-consumer-safe-upgrade-contract
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue 814 (親 364): PR #818 Sol r2 FLAG 2 件の是正 (backup の
    committed は全 consumer 書込の成功後にだけ公開する順序の統一と crash fixture、006 の skill assets
    conflict fixture)。契約の方式 D1-D5 は変えない"
---

# PLAN-L6-105: consumer の安全な upgrade 契約

## 1. 目的

consumer がハーネスの新しい版を取り込むとき、consumer 自身が加えた設定・state を壊さずに新しい版の形へ変換する。PO 判断 (2026-10-01): 「安全にアップデートできることは大事」。親 #364 の A/B 共存・片系 upgrade / rollback を、consumer 内ファイルの粒度で支える契約である。

**本 PLAN は契約 freeze のみ**。production source と test code は追加しない。実装は §7 の PR 列で、v0.2.0-canary.3 の公開と受入 (#676 / #418) の後に着手する。方式は実装 PR の中で発明せず、本 PLAN の改訂へ戻す (PR スコープ規律 2)。

> 本 PLAN の起草者は Claude Sonnet である (Opus が週次上限で 2026-10-04 16:00 JST まで停止)。族分離は変えず、非著者 reviewer は Codex Sol とする。

## 2. 実測 baseline (main 6b5effbc、read-only)

行番号は全て `git show 6b5effbc:<path>` の行である (再実行可能)。

| # | 事実 | 根拠 (再実行可能) |
| --- | --- | --- |
| F1 | managed block で混ぜられるのは `AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` の 3 つだけ。**block の外は文字としては保たれるが、byte 単位では保たれない**。目印が既存にあるとき、結合結果が改行で終わらなければ末尾に `\n` を足す (block が末尾で、外側の後ろ側が空または改行なしの場合に、既存 bytes が変わる)。また block 部分は rendered 側の bytes (LF) で差し替わる | `grep -n "MERGEABLE_ADAPTER_DOCS" src/setup/index.ts` (647, 812)、`mergeManagedBlock` 786-801 (改行補完は 797 と 799-800) |
| F2 | それ以外の既存ファイルは非対話なら skip、対話で `y` なら**差分表示も backup もなく丸ごと上書き** | `src/setup/index.ts:821-829`、`grep -n "U-SETUP-016b" tests/setup.test.ts` (361) が `y` での上書きを固定している |
| F3 | `COMMON_FILES` の `category` は全件 `"A"` で、所有権を表す属性は無い | `grep -c 'category: "A"' src/setup/templates.ts`、`COMMON_FILES` 645-774 |
| F4 | rollback の snapshot は process 内の Buffer (in-memory)。disk に残らず、process 死亡で復旧できない | `captureSetupFiles` (`src/setup/index.ts:1051-1077`)、`restoreSetupFiles` 1079-1100 |
| F5 | snapshot を取るのは `runSetupAsync` かつ `consumerRuntime` 指定かつ非 dry-run の時だけ (条件は 951、snapshot 捕捉は 953-954)。失敗時の復元は 966-975。素の `runSetup` (871-947) に rollback は無い | `src/setup/index.ts:950-983` |
| F6 | `harness.db` は snapshot 対象外。`runSetup` は snapshot の外で既存 DB に `initializeHarnessDb` を呼ぶ (setup の依存注入。実体は migrate + `rebuildHarnessDb` による 1 transaction での truncate / 再 projection) | `src/setup/index.ts:931-939` (実体の束縛は 1232-1234)、`src/state-db/projection-writer.ts:2624-2650`。truncate は `clearRebuildableProjectionTables` のみで、rebuildable でない表の有無は**未測** (§9 M2) |
| F7 | `.gitignore` は `ensureSkillAssetsIgnored` で目印範囲を差し替えるが、**目印が無い (初回) ときは `existing.replace(/\s*$/, "")` で末尾の空白・改行 (CRLF を含む) を削ってから `\n\n<managed>\n` を足す**。空白のみの既存は丸ごと `managed` に置換する。目印がある場合も結合結果が改行で終わらなければ `\n` を足す。利用者の行が保たれることを名指しで固定する test は `tests/` に無い | `ensureSkillAssetsIgnored` (`src/shared/embedded-skills.ts:397-409`、削除は 408、空白のみ置換は 401、末尾補完は 406)、呼び出し `src/setup/index.ts:906-913`、`grep -rn "ensureSkillAssetsIgnored" tests` が 0 件 |
| F8 | setup の state / identity に `schema_version` を持つ記述は `src/setup/index.ts` と `src/setup/templates.ts` に無い (`.ut-tdd/state/setup.json` は `STATE_PATH`、642) | `grep -n "schema_version" src/setup/index.ts src/setup/templates.ts` が 0 件 |
| F9 | #364 系の rollback 契約 (PLAN-L6-63 / L6-102) は Pack release 単位の revert / channel pointer であり、consumer 内ファイルの backup 形式は定めていない | `grep -n "backup" docs/plans/PLAN-L6-63-pack-staged-release-rollback.md` に consumer file backup の定義が無い |
| F10 | `runSetup` の書込経路は次の 5 つで全て: (a) `emitSetup` の rendered artifacts (`src/setup/index.ts:804-831`、対象は `planSetup` が返す files)、(b) `recordSetupState` の `.ut-tdd/state/setup.json` (838-851)、(c) `.gitignore` (906-913)、(d) skill assets (908 -> `src/shared/embedded-skills.ts:319-335`)、(e) project identity bootstrap (873)。`COMMON_FILES` (`src/setup/templates.ts:645-774`) と `setupTargetPaths` (`src/setup/index.ts:1044-1048`) に `package.json` / `commitlint.config.js` / 設計文書の path は無く、`commitlint.config.js` は読んで notice を出すだけ (926-930)。`loadTemplates` (1201-1216) は `docs/templates/**` を**読む**入力処理で書込ではない | `grep -n 'path:' src/setup/templates.ts` に該当 path が無いこと、`grep -n "package.json\|commitlint.config.js" src/setup/templates.ts src/setup/index.ts` が script 文字列 (templates 574, 579) と notice (index 926-928) のみであること |
| F11 | `setupTargetPaths` (rollback の snapshot 対象と同一の集合) は `ut-tdd.project.json`・`setup.json`・`.gitignore` と `planSetup` の files だけで、**skill assets (`.ut-tdd/assets/skills/**`) を含まない**。(d) は `writeFileSync` で既存を直接上書きする (symlink は拒否、同内容なら skip)。つまり現行 rollback は skill assets を復元できず、現行の「setup の書込先」と「snapshot の対象」は一致していない | `src/setup/index.ts:1044-1048`、`src/shared/embedded-skills.ts:324-331` |

## 3. 設計判断

advisor 相談: `ut-tdd advisor --decision design --current-model claude-sonnet-5 --execute` (provider=claude model=claude-fable-5 exit=0、2026-10-01)。advisor の前提を repo 実測で検証し、食い違いは各判断の「実測照合」に記す。回答は鵜呑みにしていない。

### D1 所有権分類

- **採用**: 所有権 SSoT 表を 1 か所に置く。値は 3 種。
  - `harness-owned`: 全体を置換してよい。ただし置換の条件は「存在しない」または「既存 bytes が、過去にハーネスが配布したいずれかの版の digest と一致する (consumer 未編集)」。
  - `consumer-owned`: 一切触らない (`package.json`、`commitlint.config.js`、設計文書)。**これらは setup の書込先ではない (F10) ため表の母集合ではなく、「触れない path の宣言」として表に付記する**。
  - `marker-mixed`: 管理範囲の目印の外は、**既存 bytes を byte 単位で保つ** (`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` / `.gitignore`)。ただし F1・F7 の通り baseline の `mergeManagedBlock` / `ensureSkillAssetsIgnored` はこの契約を満たさない (外側の末尾改行補完、目印不在時の末尾空白・CRLF の削除)。本契約では upgrade の書込 (marker-merge) が**外側の byte 列を一切変えない**ことを要求し、補完する改行は block の内側だけで行う。baseline との差分は破壊的変更として §7 PR-6 で扱い、AC2 / CANDIDATE-U-SAFEUP-002・009 が現行実装を RED にする (fixture は test-design §3)。
- `harness-owned` で既存 bytes がどの配布版 digest とも一致しない (consumer が編集済み) ときは、**自動 merge せず conflict として停止する**。対象は `.claude/settings.json`、`.codex/config.toml`、`.codex/hooks.json`、`.github/workflows/*`、`commitlint.config.cjs`、**`.ut-tdd/assets/skills/**` (skill assets。現行は無条件上書き = F11 のため、編集済みは conflict に変わる破壊的変更)** など。`.ut-tdd/state/setup.json` は digest 照合でなく D2 の registry で変換する。
- **母集合 = setup が書く全 path**。表は `COMMON_FILES` と `setupTargetPaths` に加え、F10 の (a)-(e) の全書込先、すなわち **skill assets (`.ut-tdd/assets/skills/**`、`embeddedSkillAssets()` の全 path) を含む**。D3 の plan / conflict、D4 の backup / rollback の対象も同じ母集合とする (現行 snapshot が skill assets を含まない F11 の不一致は解消対象)。母集合に属さない path が書かれた場合、または母集合の path が未分類の場合は test で fail-close する。
- **棄却**: 汎用 3-way merge。base (配布時点の原本) を consumer 側に永続保持する新しい信頼根が要り、JSON / TOML / YAML / markdown で conflict の意味が揃わない。「未編集か」の判定だけなら配布版 digest 集合で足りる。
- **棄却**: JSON / TOML の key 単位 merge。再 serialize で consumer の整形・コメントが変わり、受入条件「consumer 書込 bytes は 1 byte も変わらない」を破る。必要になれば別契約 (§10 O4)。
- **実測照合**: advisor は「mixed は 3 ファイル程度」と推定した。F1・F3 で marker-mixed が 3 つ (+ `.gitignore`) であることは確認できたが、consumer が実際に編集している率は**未測** (§9 M3)。結論には影響しない (編集済みなら conflict 停止に倒れる)。

### D2 版付き migration registry

- **採用**: settings / state schema に版を持たせ、`vN -> vN+1` の step を registry に登録する。step は「入力 bytes -> 出力 bytes」の純関数で、source / target の版を宣言する。連鎖で現行版まで進める。
- **版の記録が無い既存 consumer は、registry が明示登録した `v0` として扱う** (暗黙推定ではなく v0 -> v1 を最初の step として登録する)。登録外の版、現行より新しい版、parse 不能な版は **fail-close** (書込 0)。
- **棄却**: 版が無ければ fail-close。F8 の通り現行 consumer の state に版が無く、初回 upgrade で全員が停止する。
- **実測照合**: advisor の指摘 (版マーカーの有無が v0 規則を決める) を F8 で確認した。`.ut-tdd/state/setup.json` の実内容は未確認で、実装前の測定 PR で実測する (§9 M4)。

### D3 dry-run 必須と conflict 停止

- **採用**: 書込の前に必ず plan を作る。plan は D1 の母集合の path ごとに `{owner, action: create | replace | marker-merge | keep | conflict, diff}` を持つ。conflict が 1 件でもあれば **何も書かず非 0 で終了**する。apply は同一 process 内で作った plan だけを消費する (別 invocation の古い plan を適用しない)。
- 非対話での silent skip は廃止し、「conflict のため停止した」と path と理由を出力する。「upgrade したつもりで古いまま」を作らない。
- marker-mixed で目印が壊れている (開始だけ・順序逆転など) 場合も conflict として停止に合流させる。現行 `mergeManagedBlock` は目印が無いときに末尾追記する (`src/setup/index.ts:799-800`) ため、壊れた目印の扱いはこの点で挙動が変わる。
- **棄却**: 即書込 (dry-run 任意)。trade-off は無い。

### D4 backup の置き場と rollback

- **採用**: on-disk の `.ut-tdd/upgrade-backup/<upgrade_id>/` に、D1 の母集合の対象 path ごとの元 bytes・mode・存在有無と manifest (path / sha256 / mode / existed) を書く。manifest は `prepared` -> `committed` の 2 段階で、**`prepared` は backup の完成 (全対象 path の元 bytes と manifest が書き終わったこと) を表し、`committed` は全 consumer 書込が成功した後にだけ公開する** (consumer 書込は必ず `prepared` の後、`committed` の前に行う)。個々の書込は一時ファイル + rename。
- **状態遷移と失敗後の期待状態** (AC3 / AC4 の比較範囲の定義):
  1. backup 書込中 (manifest 未完成): consumer 対象 tree は未変更。manifest が無い・不完全な `<upgrade_id>` directory は「未開始」とみなして次回起動時に無視・掃除する。
  2. `prepared` 書込後、consumer file の書込中・直後に in-process で失敗: 同 process が復元し、consumer 対象 tree は upgrade 前と一致する。manifest は `rolled-back` へ更新して**残す** (診断用の recovery metadata)。
  3. process 死亡で `prepared` のまま残った場合: 次回起動時に先に rollback し、consumer 対象 tree を upgrade 前へ戻してから `rolled-back` にする。
  4. `committed`: rollback しない。
  - 比較範囲は 2 つに分ける。**consumer 対象 tree** (D1 の母集合 + それを含む directory、`.ut-tdd/upgrade-backup/` を除く) は失敗後に path 集合・bytes・存在有無 (POSIX は mode) が upgrade 前と一致する。**recovery metadata** (`.ut-tdd/upgrade-backup/` 配下) は上記状態に対応する期待 (1: 無し、2-3: `rolled-back` の manifest と元 bytes が残る) を別 assert とし、tree 一致の比較には混ぜない。
- 復元の意味論 (bytes + mode の復元、新規作成物の削除、directory は深い順) は既存 `restoreSetupFiles` (`src/setup/index.ts:1079-1100`) と同じにし、実装は共有する。**#364 と共有するのは復元意味論と per-runtime-root 隔離**である。F9 の通り #364 系に consumer ファイル backup の置き場・形式の既存仕様は無いため、「同じ置き場を再利用」ではなく本契約が置き場を定める。backup は各 consumer 自身の `.ut-tdd/` 配下にあるので、A/B の片系 upgrade は互いの backup を見ない。
- backup 配下は projection / doctor / git の走査対象から除外する。**世代の上限と古い世代の削除は、本 PLAN の時点では自動実行しない**。backup 世代の削除は recovery data を消す破壊的 data 操作に当たるため、方式と PO 承認を §10 O2 / §10.1 P3 で閉じるまで、世代は削除せず蓄積する。
- `harness.db` は backup しない。F6 の通り rebuildable な projection は `ut-tdd db rebuild` で復元できる。**rebuildable でない表の有無が未測のため (M2)、upgrade の file transaction の中では `rebuildHarnessDb` / `initializeHarnessDb` を呼ばない**。DB の版変換は D2 の registry の別 step として、実測後の別 PR で扱う。
- **棄却**: in-memory snapshot の継続。F4・F5・F6・F11 の通り、process 死亡・素の `runSetup`・DB の rebuild・skill assets で巻き戻せない窓が実在する。
- **実測照合**: advisor は「#364 と同じ置き場・同じ復元経路を再利用」と述べたが、F9 で #364 側に該当仕様が無いと確認したため、上記のように修正した。

### D5 対話時の丸ごと上書き

- **採用**: **既定で禁止**する。`y` で consumer 編集済みファイルを丸ごと置換する経路を廃止する。`harness-owned` の未編集置換は D1 で安全に行え、編集済みは conflict 停止となるため、丸ごと上書きという操作自体が不要になる。
- **`--replace <path>` の許可範囲** (どうしても置換したい利用者向けの唯一の例外):
  - 対象は D1 で **`harness-owned` かつ plan が `conflict` (consumer 編集済み) と判定された path** のみ。`consumer-owned` と `marker-mixed` (壊れた目印を含む) は許可しない (前者は「一切触らない」、後者は目印外の consumer 内容を失うため。解消は利用者の手編集)。
  - `<path>` は consumer root からの正規化済み相対 path で、D1 の表に載る正確な 1 path。glob・ディレクトリ・複数指定・絶対 path・`..` を含む path・symlink 経由で root の外へ出る path は fail-close。
  - 実行は D3 の diff 表示と D4 の backup を必須通過し、**backup が `prepared` として完成する前に置換しない。置換を含む全 consumer 書込が成功した後にだけ `committed` を公開する** (D4 の順序と同じ。置換の途中・直後に process が死亡した場合は `prepared` のまま残るので、次回起動時の rollback で置換前へ戻る)。置換前の bytes は backup に残るので、`--replace` で失われる consumer 編集は backup 経由で復元できる。
  - これは consumer-owned の「一切触らない」の例外ではない (対象に含めない)。D3 の「編集済み conflict は停止」に対する唯一の明示例外であり、利用者が path を名指しした場合に限る。
  - **優先順位**: plan の判定は (1) D1 の所有権分類 → (2) D3 の conflict 判定 → (3) `--replace` の受理判定 の順に行う。`--replace` が受理された path だけ、plan の action を `conflict` から `replace` に変える。他の conflict が 1 件でも残れば D3 どおり何も書かずに停止し、受理済みの `--replace` も実行しない。範囲外の `--replace` 指定はそれ自体が fail-close (書込 0、非 0 終了) で、conflict 停止より先に判定してよい。AC2 の byte 不変の例外は、受理されて実行まで到達した 1 path に限る。
  - **データ破壊を伴う操作なので、仕様の確定は PO 承認が要る** (§10.1 P1)。
- **棄却**: 「diff + backup 付きで `y` 上書きを許す」。所有権分類と二重経路になり drift 源になる。
- **破壊的変更フラグ**: U-SETUP-016b (`y` で既存ファイルを上書きする test) は新契約と衝突するため、実装 PR で test-design の凍結 oracle ごと改訂する。これは契約改訂であり、軽作業の是正ではない。

## 4. 受入条件 (反証可能)

各条件は pair test-design (`docs/test-design/harness/L7-consumer-safe-upgrade-test-design.md`) の `CANDIDATE-U-SAFEUP-*` へ対応づける。実装 PR で正規 ID へ昇格する。

- [ ] AC1 (所有権): **setup が書く全 path** (`COMMON_FILES`・`setupTargetPaths`・skill assets を含む F10 の全書込先) が SSoT 表で分類済み。未分類 path が 1 つでもあれば test が fail する。書込先の列挙は実装の出力ではなく、F10 の書込経路ごとに独立に導出する (CANDIDATE-U-SAFEUP-001)。
- [ ] AC2 (consumer 書込不変): consumer が書いた行・設定は upgrade の後も 1 byte も変わらない。marker-mixed は目印外、consumer-owned は全体、conflict 停止時は全 path。**唯一の例外は D5 の `--replace <path>` が受理された 1 path** で、その path だけは harness の新 bytes に置き換わり、置換前の bytes は backup に残る。受理されなかった `--replace` (D5 の範囲外) では全 path が 1 byte も変わらない。CRLF / LF 混在、BOM、**末尾改行なしで block が末尾にあるケース、目印不在 (初回) の末尾空白・CRLF** を含む。現行の `mergeManagedBlock` (F1) と `ensureSkillAssetsIgnored` (F7) の反例が RED になる fixture を持つ (CANDIDATE-U-SAFEUP-002 / 009、Windows / Linux)。
- [ ] AC3 (失敗後の tree 一致): upgrade の途中のどの段階で失敗させても、**consumer 対象 tree** (D4 の定義、`.ut-tdd/upgrade-backup/` を除く) は upgrade 前と bytes・存在有無まで一致する (POSIX は mode も)。recovery metadata は D4 の状態遷移に沿って別途 assert する。失敗注入は書込 N 件目ごとに全点で行う (CANDIDATE-U-SAFEUP-003、Windows / Linux)。
- [ ] AC4 (crash 回復): `prepared` の backup が残る状態から再開すると、先に rollback して consumer 対象 tree が upgrade 前に戻り、manifest は `rolled-back` になる (CANDIDATE-U-SAFEUP-004)。
- [ ] AC5 (migration): `v0 -> 現行` の連鎖が登録順に進む。登録外の版・新しすぎる版・parse 不能は書込 0 で fail-close (CANDIDATE-U-SAFEUP-005)。
- [ ] AC6 (dry-run / conflict): conflict が 1 件でもあれば書込 0 で非 0 終了し、path と理由を出力する。非対話でも silent skip しない (CANDIDATE-U-SAFEUP-006)。
- [ ] AC7 (丸ごと上書き禁止): 対話 `y` で consumer 編集済みファイルが置換されない。`--replace <path>` は D5 の許可範囲 (harness-owned かつ conflict の正確な 1 path、consumer root 内) のみ受理し、範囲外は fail-close。受理時は diff と backup を必ず作る。受理・実行の場合は対象 path が harness の新 bytes と一致し、backup の元 bytes が置換前と一致し、他の path は 1 byte も変わらない。拒否の場合は全 path が不変で書込 0・非 0 終了になる。両者を別 assert で区別する (CANDIDATE-U-SAFEUP-007)。
- [ ] AC8 (A/B 隔離): consumer A の upgrade・rollback が consumer B の tree と backup を変えない (CANDIDATE-U-SAFEUP-008)。
- [ ] AC9 (未確認事項の実測): `.gitignore` の利用者行の保存 (M1) と既存 `harness.db` の扱い (M2) を実測し、必要なら oracle を追加する (CANDIDATE-U-SAFEUP-009 / 010)。

## 5. Windows / Linux の差

oracle は両 OS で実行する。差が出る点を契約として固定する。

- 改行・BOM: bytes 比較で確認し、正規化しない (`.gitattributes` の eol=lf は consumer 側の設定であり upgrade が書き換えない)。
- mode: Windows の `chmod` は実質 no-op。mode 一致の assert は POSIX のみとし、Windows は存在有無と bytes で代替する (代替であることを test に明記する)。
- rename: Windows は open handle・ウイルス対策による `EBUSY` / `EPERM` があり得る。有限回の retry の後に失敗し、失敗時は rollback する。
- 大文字小文字・path 区切り: SSoT 表の key は正規化済み相対 path とし、Windows の case-insensitive な衝突は conflict として停止する。

## 6. 順序

1. 本 PLAN (PR-0、docs のみ) は canary.3 の受入を待たず起票してよい。
2. **実装 PR は v0.2.0-canary.3 の公開と受入 (#676 / #418) の後に着手する**。本線の canary 作業には混ぜない。
3. 実装 PR の前に、本 PLAN と pair test-design を非著者 frontier reviewer が review して freeze する。
4. §10.1 の PO 承認待ち項目が閉じるまで、該当する PR (PR-5 の世代削除、PR-6 の `--replace`) は着工しない。

## 7. PR 分割 (1 PR = 1 論点)

| PR | 論点 | 新規 source_module | 備考 |
| --- | --- | --- | --- |
| PR-0 | 本契約 + pair test-design (docs のみ) | 0 | 本 PR |
| PR-1 | 所有権 SSoT 表と AC1 | 1 (`src/setup/ownership.ts` 想定) | 配線なし |
| PR-2 | 測定のみ: M1 (`.gitignore` 行の保存)、M2 / M4 (DB・setup.json) の test | 0 | read-only の test 追加。結果次第で本 PLAN を改訂 |
| PR-3 | migration registry と v0 規則 (AC5) | 1 | 配線なし |
| PR-4 | upgrade plan (dry-run diff / conflict) の純関数 (AC6) | 1 | 書込なし |
| PR-5 | on-disk backup / rollback / crash 回復 (AC3, AC4, AC8) | 1 | 復元意味論は `restoreSetupFiles` と共有。世代削除は含めない (§10.1 P3) |
| PR-6 | setup への配線、対話上書きの廃止、`--replace`、U-SETUP-016b の改訂 (AC2, AC7)、CLI surface | 0 (配線のみ) | 破壊的変更。CLI の最終形は §10 O1。`--replace` は §10.1 P1 の承認後 |

PR-2 は PR-1 と並行してよい。順序は PR-1 -> PR-3 -> PR-4 -> PR-5 -> PR-6。依存する正本が閉じる前に下流を着工しない。

## 8. 非対象

- Pack release 単位の publication・rollback (PLAN-L6-63 / L6-102 / L6-101 が所有)。
- `ut-tdd update-check` の advisory (PLAN-L7-362 が所有)。version 比較・通知は本 PLAN で再定義しない。
- JSON / TOML の key 単位 merge、汎用 3-way merge (§3 D1 で棄却、将来別契約)。
- `harness.db` の schema 変換と backup (M2 の実測後に別 PLAN)。
- consumer の `package.json` / 設計文書の自動変更 (consumer-owned として触らない)。
- 認証・認可・課金・PII・secret・外部 API 前提の変更 (本契約は触れない)。

## 9. 未確認事項 (実測予定、PR-2)

- M1: `.gitignore` の利用者の行が upgrade 後も保たれるか。F7 で末尾空白・改行の削除は**コード上で確認済み**だが、名指しの test が無く、他の差分 (行順・コメント) の有無は未測。
- M2: 既存 `harness.db` に対する `rebuildHarnessDb` が、rebuildable でない表を消さないか。`clearRebuildableProjectionTables` の対象外の表を列挙する。
- M3: 全 `COMMON_FILES` について、consumer が実際に編集している率 (mixed の想定が妥当か)。
- M4: `.ut-tdd/state/setup.json` と `ut-tdd.project.json` の実内容と版の有無 (v0 規則の入力)。

## 10. open questions (実装前に advisor / 契約改訂で閉じる)

- O1: upgrade の入口を新 verb (`ut-tdd upgrade`) とするか、`ut-tdd setup` の既存 consumer 検出時の挙動とするか。PR-6 の前に PLAN を改訂して freeze する。
- O2: backup の世代上限 (3 は暫定) と、世代を超えた backup の掃除方式。**世代削除は §10.1 P3 の PO 承認が前提**で、承認まで自動削除しない (D4)。
- O3: 配布版 digest 集合の保管場所 (Pack manifest 由来か `src/` 内の表か)。Pack の独立性 (source repo を実行時入力にしない) と矛盾しない側を選ぶ。
- O4: JSON / TOML の key 単位 merge を将来導入するか。導入する場合は byte 不変条件 (AC2) との両立方式から契約化する。

### 10.1 高影響境界と PO 承認待ち項目

本契約は **destructive data operation に触れる**。次の操作は consumer の既存 data を置換・削除し得るため、`CLAUDE.md` の高影響境界 (destructive data operation) に該当し、advisor 回答にかかわらず**実装前に PO 承認が要る**。承認前は契約として freeze しても実装 PR は着工しない。

| ID | 操作 | 内容 | 現時点の緩和 (承認の代替ではない) |
| --- | --- | --- | --- |
| P1 | `--replace <path>` による consumer 編集済みファイルの置換 | harness-owned かつ conflict の 1 path に限り、diff 表示 + backup `prepared` 完成後に置換し、全書込成功後に `committed` (D5) | 範囲限定、diff 必須、backup で復元可能 |
| P2 | rollback による復元と、upgrade が新規作成した path の削除 | `restoreSetupFiles` と同じ意味論で bytes・mode を復元し、元々存在しなかった path を削除する (D4)。削除対象は upgrade が作成した path のみで、manifest の `existed: false` に限る | backup の manifest に基づく。consumer 既存 path は削除しない |
| P3 | backup 世代の削除 | 上限を超えた古い `<upgrade_id>` の削除 (O2)。recovery data の消去に当たる | 承認まで自動削除しない (蓄積)。方式は O2 で別途 freeze |

上記以外の高影響境界 (production infrastructure・認証認可・課金・PII・secret・licensing・外部 API 前提) には触れない。**本 PLAN の freeze (docs のみ) 自体は data を変更しないが、P1-P3 を含む実装は PO 承認後に限る**。承認の取得経路は `docs/governance/design-decision-elicitation.md` の形式とし、advisor 結果と実測 (F1-F11) を添える。

## 11. Schedule (serial)

PR-0 (本 PR) -> 非著者 review -> freeze -> **PO 承認 (§10.1 P1-P3、PR-5 の世代削除と PR-6 の `--replace` の前)** -> (canary.3 受入後) PR-1 と PR-2 (並行可) -> PR-3 -> PR-4 -> PR-5 -> PR-6。
