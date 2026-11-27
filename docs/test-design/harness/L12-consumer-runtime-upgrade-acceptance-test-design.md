---
title: "consumer runtime 版上げ 受入テスト設計"
layer: L12
executed_at_layer: L12
artifact_type: test_design
status: draft
issue: 2023
---

# consumer runtime 版上げ 受入テスト設計 (Issue #2023)

## 1. 位置付けと境界

本書は公開済み `v0.2.0-canary.7` を使う consumer を、clone を作り直さずに
`v0.2.0-canary.10` 候補へ上げるリハーサルと受入条件を定義する。#2023 の公開前チェックと、
control が指定した canary.10 公開の事前条件 (Issue #2023 comments 7211001422,
7211033742) を一つずつ判定できる証跡に結ぶ。

これは新規導入用の `AT-DIST-002` / `AT-DIST-003` を置き換えない。版上げの実装契約は
`docs/design/harness/L6-function-design/consumer-runtime-update.md`、単体・統合 oracle は
`docs/test-design/harness/L7-consumer-runtime-update-test-design.md` が所有する。本書は
公開前に実 consumer 形状で確認する運用受入だけを所有し、AT-DIST-003 や
`docs/test-design/harness/L12-pack-internal-canary-test-design.md` を改訂しない。

公開済み canary.7 の配布物を使う隔離 fixture は
`scripts/rehearse-upgrade-canary-fixture.mjs` が作る。fixture 作成は main consumer に
canary.7 を導入し、linked worktree を複数作り、1 本に canary.7 runtime を導入し、別の 1 本は
runtime 無しにし、tracked file を dirty にする。canary.10 候補での版切替と手動 pointer rollback は
この fixture を使い、§3 の受入手順に沿って確認する。

## 2. リハーサルの前提と開始条件

- 対象は `C:\dev` 配下に新規作成する disposable な repository とする。
- canary.7 の 5 asset (`.tar.gz`、`.tar.gz.sha256`、`.ut-tdd.mjs`、
  `.consumer-runtime.json`、`.consumer.sha256`) を同じ公開 tag のものとして受け取り、
  §4.1 / §6 の blob と SHA-256 検証が PASS であること。fixture script は公開 Release API の
  5 asset SHA-256 を照合する。CLI の外部 anchor は `.consumer.sha256` asset 自体の digest
  (`sha256:bb00b13e38d5ac978f8e65e8091fa578aa1de4a3e981f67032c79bd54e8cd019`) であり、runtime JSON の内部 attestation digest
  (`sha256:ae63ec343665166a672609f43cf6e0c659afa862082b90bfae7e4052f954cf93`) と混同しない。
  外部 anchor は公開記録から別途固定し、asset 内の値だけを信頼根にしない。
- main root は canary.7 runtime で `status` と `doctor` が成功すること。fixture は実際の
  `git worktree add` で linked worktree を作る。runtime 有り worktree は `--worktree` を持たない
  canary.7 の公開 launcher を使い、fixture 初期化に限って linked cwd から旧
  `setup --solo --consumer-runtime-release` 経路を通す。canary.10 での #2018 拒否は別途試験する。
  runtime 無し worktree には `.ut-tdd/`、launcher、active pointer を作らない。
- main runtime の launcher、`active.json`、active bundle は byte 単位で別の evidence directory
  に保存され、その SHA-256 と pointer が指す bundle の内容一覧を記録すること。
- runtime 有り worktree の tracked sentinel は実際に変更され、`git status --short` に変更として
  表示されること。sentinel はリハーサル中に checkout/reset で破棄しない。
- canary.10 候補の公開前承認条件: 公開対象 source commit の `harness-check` が green、#930
  と #2018 の Green が非著者 closing review PASS 後に merge 済み、AT-CANARY-UPGRADE-001〜006 が
  全て PASS、runbook §4.1 blob 照合と §6 SHA-256 が一致していること。ひとつでも欠ける場合は公開しない。

## 3. 受入テスト

| AT ID | 対象 | 手順 | 合格条件と必須証跡 |
|---|---|---|---|
| `AT-CANARY-UPGRADE-001` | canary.7 launcher の canary.10 bundle 互換 | canary.10 候補を main root で正式な版上げ経路から導入する。canary.7 から保存した launcher をそのまま使い、`status`、`doctor`、Claude / Codex の guard hook 2 本を確認する。 | 全 command が期待する success / hook 判定で終了し、launcher の bytes は切替前と同一。実行 command、exit code、runtime identity、launcher SHA-256、hook の正常系・拒否系結果を保存。launcher の置換や source checkout への fallback があれば FAIL。 |
| `AT-CANARY-UPGRADE-002` | 旧版保持と手動 pointer rollback | 切替前後で旧 active bundle の全 file bytes / digest を比較する。切替後の disposable consumer で、保存した canary.7 `active.json` の完全な bytes を用いて手で旧 pointer に戻し、canary.7 launcher から `status` と `doctor` を起動する。確認後、必要なら候補側 pointer に戻す。 | 旧 bundle が欠落・変更なく残り、手動復元した pointer が canary.7 bundle を指し、旧版 `status` / `doctor` が成功する。復元前後の pointer bytes、bundle file inventory + SHA-256、command 出力を保存。pointer の部分書換え・旧 bundle の再生成は FAIL。 |
| `AT-CANARY-UPGRADE-003` | すでに canary.7 runtime がある linked worktree と tracked dirty sentinel | main の版上げ前後で runtime 有り worktree の runtime tree / pointer と `fixture/dirty-sentinel.txt` の bytes / SHA-256 / `git status --short` を採取し、その worktree から launcher を起動する。 | worktree runtime tree / pointer と dirty sentinel の bytes が切替前後で byte 同一で、sentinel は切替後も tracked modification として残り、canary.7 `status` が起動する。main と worktree は root-bound manifest / history が異なり得るため bundle tree 全体の一致は要求せず、`release_id`・`artifact_set_digest`・`compiled_esm_digest` と compiled `ut-tdd.mjs` bytes で同じ版と判定する。各 root の pointer / launcher / bundle の独立した前後 SHA-256 snapshot を保存する。 |
| `AT-CANARY-UPGRADE-004` | runtime 無し worktree と runtime 再導入経路 | runtime 無しの linked worktree で launcher / active pointer が存在しないことを確認し、切替後に main launcher から `setup --worktree <path>` を行う。次に AT-003 の切替前後 evidence を保存してから、同じ fixture の runtime-old worktree の `.ut-tdd/` を別途退避し、そこにも main launcher から `setup --worktree <path>` を行う。旧 pointer / bundle を新 root へコピーしない。 | 両経路で main の pin に一致する canary.10 runtime が入り、`status` と guard hook が成功する。削除・再導入の対象は専用 disposable worktree のみ。worktree の release identity、launcher / pointer SHA-256、status / hook 結果を保存。異版を残したままの更新・main 以外からの Release 取得は FAIL。 |
| `AT-CANARY-UPGRADE-005` | Claude session 継続中の切替 | 対象 disposable consumer 上で Claude session が開始済みの状態を記録し、session を終了せず main runtime を切り替える。切替の前後で両 guard hook を実行する。 | session が維持され、前後で hook が正しい runtime から起動し正常系を許可、禁止系を拒否する。session の同一性を確認できる記録、各 hook の実 command / exit code / stderr を保存。session の再起動や hook 配線欠落は FAIL。 |
| `AT-CANARY-UPGRADE-006` | consumer 独自 script と #2018 入口拒否 | disposable consumer に tracked custom script を置き、linked worktree から `setup --solo --consumer-runtime-release ...` を実行する。 | `worktree_entry_options_invalid` で拒否され、main / worktree runtime tree は不変。script が旧入口に依存する場合は release note に置換 command を記載する。実行結果、前後の tree digest、release note の該当箇所を保存。拒否が通過する、または必要な移行案内が無い場合は FAIL。 |
| `AT-CANARY-UPGRADE-007` | 公開対象と事前承認条件 | 公開対象 source SHA の `harness-check`、#930 / #2018 の merge SHA と非著者 closing review、AT-CANARY-UPGRADE-001〜006 の結果、runbook §4.1 の C1 blob 照合、§6 の 5 asset SHA-256 を照合する。 | 全項目が対象 canary.10 候補の exact SHA / asset に結びついて PASS。check run URL、merge / review evidence、AT evidence、blob SHA、5 asset SHA と外部 anchor を公開判断 packet に記録。欠落・別 SHA・再利用した古い canary の証跡は FAIL。 |

## 4. 判定と証跡

AT-CANARY-UPGRADE-001〜006 は公開前に全件 PASS 必須であり、007 はそれらと公開前承認条件の集約判定である。特に 001 と 002 は、canary.7
launcher が新 bundle を起動すること、および `active.json` の手動復元で旧版が起動することを
別々に証明する。unit / integration tests の PASS や AT-DIST-003 の新規 install 証跡を、これらの
実 consumer 受入の代わりにしない。

証跡には consumer root、worktree path、candidate source SHA、canary tag、anchor、5 asset SHA、
実行した command と exit code、pointer / launcher / bundle inventory digest、dirty sentinel の
path と git status、Claude session の状態、判定者を含める。secret、provider credentials、個人
情報は記録しない。全行 PASS と事前条件の充足を確認してから control が runbook の公開操作を行う。
