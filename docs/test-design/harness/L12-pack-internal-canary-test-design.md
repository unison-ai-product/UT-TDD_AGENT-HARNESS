---
artifact_type: test_design
layer: L12
executed_at_layer: L12
status: draft
plan_id: PLAN-L7-531-pack-internal-canary-smoke
github_issue_id: 418
---

# Pack-only internal canary 境界テスト設計

## 1. 位置付けと責務境界

本書は `PLAN-L7-531-pack-internal-canary-smoke` と
`PLAN-REVERSE-531-pack-internal-canary-smoke-backfill` 専用の pair artifact である。
Issue #418 のうち、Bun の到達面、Memory/notification 実装、Pack の remote
publication、`PLAN-L7-628` の producer / installer semantics を所有しない、clean Pack
fixture の境界検証を定義する。consumer隔離と source非依存の契約は `PLAN-L6-101` を正本として
再利用し、canary の release asset 集合・schema・installer 契約は confirmed `PLAN-L7-628`
§3/§4/§6 を正本として再利用する。既存の `CANDIDATE-PACKISO-*` / `U-PACKISO-*` /
`CANDIDATE-U-PACKRT-*` (`PLAN-L7-628` 所有) を再採番・再所有しない。

§3 の Candidate 001..004 は Codex worker の先行作業を採用し、005..010 は `PLAN-L7-531` §3 の
受入契約 (2026-09-28 改訂、`PLAN-L7-628` 接合) に合わせて追補・改訂した。旧版の 005..007 は
`v0.2.0-canary.1` の exact 2 asset 契約を前提にしていたが、`PLAN-L7-628` により
`v0.2.0-canary.2` 以降の exact 5 asset + anchor 契約へ置換されたため、005・006 の Red 入力/Green
oracle を差し替え、008..010 を新設した。009 の publish 記録照合 (`PLAN-L7-531` §3.4) と 010 の
guard hook 観測 (同 §3.5) は、`PLAN-L7-628` §5.7 / §6.2 手順 7 が本 PLAN に明示的に割り当てた。
producer (`src/cli/distribution.ts`) と installer (`src/setup/consumer-runtime-release.ts`、
`setup --consumer-runtime-release`、external anchor check) は PR-1 / PR-2 (#726) として main に着地済み。
第2層 runner は確定済み installer 契約を呼ぶだけで、その semantics を再実装しない。

既存の `tests/distribution-acceptance.test.ts` は clean artifact の materialize、Node/npm
install、setup、doctor、typecheck を検証している。本書の専用テストはその実装を置き換えず、
次の未接続の受入証跡だけを追加する。

- clean artifact の明示 inventory(skills と authoring template を含む)
- source repository、source worktree、local Pack checkout の path 非混入
- source 外の temporary consumer root だけを実行入力とすること
- source/worktree/local Pack checkoutを参照しない再起動相当の wrapper smoke
- `PLAN-L7-628` の 5 asset Release からの Release-assets-only install (anchor 照合込み) の
  clean fixture E2E

## 2. 非スコープ

- Bun executable/install/download/invocation のゼロ証明 (`PLAN-L7-522` / `PLAN-L7-527` の trace oracle)
- Bun-free sealed consumer runtime の実行接続 (`PLAN-L7-516` の正規 setup 経路を利用)
- Memory root、provider wake、通知 custody(#424/#528)
- Pack repositoryへのcommit、tag、Release、channel pointer、GitHub API mutation(#414/#466)。
  canary 公開そのものの実施は PO 承認済みの外向き操作であり本書のテストは代替しない
- `PLAN-L7-628` の producer / installer 内部 semantics (asset schema、自己 digest 照合、
  identity 導出、冪等性、anchor digest の生成規則と信頼根の置き場所) の再定義・再実装
  (`CANDIDATE-U-PACKRT-*` が所有)。例外は
  `PLAN-L7-628` が明示的に割り当てた publish 記録の様式 (`PLAN-L7-531` §3.4) と guard / setup smoke
  の E2E 観測 (同 §3.5) だけである
- `PLAN-L7-628` PR-2 (installer、#726) の実装そのもの。本書は installer の実装を代替しない
- Product A/B の異version、upgrade、rollback、stable昇格(#364後続)

上記は入力契約としてのみ参照し、今回のテストがGreenであることをそれらの完了証跡へ
読み替えない。第2層の実受入 run は canary.2 公開の PO 承認後だけに行う。

## 3. Candidate oracle

| Candidate | 層 | Red入力 | Green oracle |
| --- | --- | --- | --- |
| `CANDIDATE-ST-PACKCANARY-001` | 第 1 層 | clean distribution planへ source-only path、absolute path、source/worktree/local Pack checkout pathを混入 | artifact pathが相対かつ明示inventory内だけで、source-only入力は出荷集合へ到達しない |
| `CANDIDATE-ST-PACKCANARY-002` | 第 1 層 | PLAN/design/state/prompt/teamまたは skills の一つをmaterialized entryから欠落・重複させる | authoring inventoryが欠落・重複をfail-closeし、skills baselineと6つのauthoring artifactを各1回検査する |
| `CANDIDATE-ST-PACKCANARY-003` | 第 1 層 | Pack rootをmaterializeして別Product rootへ正式setupし、Pack root/source/worktreeを撤去して別cwdから起動 | 正式setup経路が生成したsealed consumer runtimeだけで起動し、外部参照時はtyped deny。現行setupがfallbackを残す場合はRed |
| `CANDIDATE-ST-PACKCANARY-004` | 第 1 層 | 実Packを別Product rootへsetupし、setup元Pack rootを生成wrapper/configから利用不能にする | generated wrapper/config、command output、runtime stateにsetup元の絶対path参照が0 |
| `CANDIDATE-ST-PACKCANARY-005` | 第 2 層 (runner 照合は PR-2 CI で offline 固定) | 取得した 5 asset のいずれか 1 件を 1 byte 変異 / size 変更。(a) `<tag>.tar.gz` / `<tag>.tar.gz.sha256`、(b) `<tag>.ut-tdd.mjs` / `<tag>.consumer-runtime.json`、(c) `<tag>.consumer.sha256`。(d) release-dir は真正のまま、publish 記録 (`PLAN-L7-531` §3.4) の 6 値 (5 asset の sha256 と anchor) のいずれか 1 値について producer 値か独立再計算値を欠落させる、または 2 値を不一致にする | (a) installer は tar.gz を照合しないため、runner が publish 記録 (`PLAN-L7-531` §3.4) の sha256 との不一致で installer 起動前に deny。(b) runner 照合で deny。runner 照合を外した対照では `PLAN-L7-628` §6.2 手順 1 が deny。(c) 手順 0 の `consumer_runtime_anchor_mismatch`。(d) runner が installer 起動前に deny。いずれも consumer root write 0。runner が照合を installer に丸投げする mutation は (a) で、producer 値だけを読み独立再計算値の有無・一致を検査しない mutation は (d) で Red |
| `CANDIDATE-ST-PACKCANARY-006` | 第 1 層 (runner の選択ロジック) / 第 2 層 (実 Release 再観測) | legacy 3 asset 形式の `v0.1.4`、3 asset (`.manifest.json` 付き) の `v0.2.0-canary.1`、`latest` / prefix / semver range による tag 解決、`PLAN-L7-628` §3 の 5 asset のいずれかの欠落・余剰・別名 | runner が exact 5 asset かつ tag exact match 以外を installer 起動前に typed deny する。tag 解決を prefix / latest にする mutation、集合検査を部分集合一致にする mutation が Red。installer 側の集合検査 (`CANDIDATE-U-PACKRT-008`) は再所有しない |
| `CANDIDATE-ST-PACKCANARY-007` | 第 1 層 | 実 producer 出力 (fixture tag) を実 installer で install し、source・Pack checkout・producer 一時 root・`<release-dir>` を削除、別 process・別 cwd・環境変数 clear で wrapper を再起動し、`bun` を PATH 上に置く | `doctor --setup-smoke`、PLAN authoring/lint、db rebuild、doctor、review smoke が同一 sealed generation で再現し、Bun invocation trace 0。compiled ESM が `--help` 以外の subcommand で source path・未 bundle module を実行時解決する退行は Red (`CANDIDATE-U-PACKRT-005` は `--help` までしか起動しない) |
| `CANDIDATE-ST-PACKCANARY-008` | 第 2 層 | 実際にダウンロードした `v0.2.0-canary.2` の 5 asset に対し `--expected-consumer-digest` を未指定・形式違反 (`sha256:` 桁数不足等)・publish 記録と異なる値にして installer コマンドを実行する | 公開 bundle の `PLAN-L7-628` §6.2 手順 0 が `consumer_runtime_anchor_mismatch` として deny し、consumer root へ 1 byte も書かれない。殺す mutation は「公開 bundle が anchor 照合を欠く / 未指定で install を通す」であり、`CANDIDATE-U-PACKRT-007(d)` (source build 対象) を代替しない |
| `CANDIDATE-ST-PACKCANARY-009` | PR-2 CI (offline) | (a) runner の installer 呼び出しを `--consumer-runtime-input` (source-CLI helper `tests/support/pack-consumer-runtime.ts` と同じ経路) に差し替える、(b) runner が anchor を publish 記録ではなく `<release-dir>` の `.consumer.sha256` から再計算する、(c) 受入記録の tag が fixture tag など exact `v0.2.0-canary.2` 以外 | runner を offline で呼ぶ。(b) の対照入力は、`.ut-tdd.mjs` を実行意味を変えない形 (末尾へのコメント 1 行追記等) で改変し `.consumer.sha256` を整合的に書き換えた偽造 release-dir と、5 asset の sha256 entry (producer 値・独立再計算値とも) を偽造 release-dir に合わせ `consumer_anchor_digest` (2 値とも) だけを真正 fixture の anchor に固定した記録である。asset 照合・exact 5 件・tag exact・2 値一致の guard はすべて通り、結果を分けるのは anchor の出所だけになる。正しい runner は spawn 引数の `--expected-consumer-digest` に記録の anchor を渡し、手順 0 の `consumer_runtime_anchor_mismatch` で deny・consumer root write 0。anchor を偽造 release-dir から再計算する mutant は手順 0〜2 を通過して deny されず、観測点 (spawn 引数の anchor 値と deny 有無) の結果が反転する ((b) が Red)。runner が anchor と `.consumer.sha256` entry の相互照合を持つ場合は、005(b) と同じく相互照合を外した対照で実行する。spawn 引数に `--consumer-runtime-release` があり `--consumer-runtime-input` が無いことを assert ((a) が Red)。tag が exact でなければ受入記録を生成しない ((c) が Red) |
| `CANDIDATE-ST-PACKCANARY-010` | 第 1 層 / 第 2 層 | 撤去・別 shell 後の fixture で、生成 `.claude/settings.json` / `.codex/hooks.json` の PreToolUse work-guard command を登録文字列のまま合成 payload で実行する。変異: (a) 正常系も block する (canary.1 実測の全編集 block と同型)、(b) command が撤去済み path・存在しない launcher を指し hook 失敗が非 block で素通りする、(c) 禁止系を通す | 正常系 payload は通過、禁止系 payload は各 runtime の block 規約どおり block。(a)(b)(c) はいずれも Red。hook の schema・内容 (`PLAN-L7-668` 等) は再所有しない |
| `CANDIDATE-ST-PACKCANARY-015` | 第 2 層 (agent 確認経路 E2E、`PLAN-L7-531` §3.6) | exact `v0.2.0-canary.5` 以外の tag (`v0.2.0-canary.2`〜`.4`、`latest`、prefix)、5 asset の 1 byte 変異・欠落・余剰、publish 記録 2 値の不一致 | runner が canary.5 の exact 5 asset と publish 記録 (2 値一致) の照合を installer 起動前に行い、canary.2〜canary.4 の bytes を受け付けず deny する。consumer root write 0 |
| `CANDIDATE-ST-PACKCANARY-016` | 第 2 層 | subject を closed stub・手書き文書・source helper 出力で作る、または baseline と subject を同一 commit にする | subject は `ut-tdd vmodel template` 配送のテンプレートから実エージェント (Claude または Codex) が書き、baseline (functional / screen 等) は subject より前の別 commit。provider・model・実 invocation の記録を欠く場合は証跡として受け付けない |
| `CANDIDATE-ST-PACKCANARY-017` | 第 2 層 | 正しく書いた L1 business-requirements subject の commit に対して `G1` を実行する (Red 対照: subject を空にする) | `G1` が `applicable:true` かつ `passed:true` で、`could not run` を含まない。空 subject は `passed:false` |
| `CANDIDATE-ST-PACKCANARY-018` | 第 2 層 | positive の子 commit として必須の business-requirements 文書を除いた別 revision を作り `G1` を実行する | `G1` が `applicable:true` / `passed:false` で、メッセージが欠落 slot (`business-requirements.md`) を名指す。positive subject は変異させない。slot 名のラベル形式は実測して記録する |
| `CANDIDATE-ST-PACKCANARY-019` | 第 2 層 | 実 subject (path + content digest + revision) への非著者 canonical review。Red: 同族 verdict、closed-stub receipt、別 revision / 別 digest を指す receipt、手書き confirmed 証跡、Remote-WSL 接続、sshd の非 loopback listen、受入専用鍵対以外の鍵・host credential の持込、host 側 VS Code Server / Claude 拡張、または対象プロセス外からの entrypoint 値申告 | receipt が request の exact revision (commit / blob oid) と content digest に一致し、author と reviewer の provider が異なる。同族 verdict は `same_family_reviewer` で拒否される。review の custody・authority・隔離条件は `PLAN-L7-531` §3.6.9 で凍結済み: author=codex / reviewer=claude、PO 作成済みの専用 consumer repository `unison-ai-product/ut-tdd-consumer-canary` の既存 PR (head = positive の subject commit、実行中の repository 新規作成・stub・source repository の PR 代用なし、PR 番号は実行前に記録)、custody 正本は consumer の canonical project root `.ut-tdd/review/{requests,receipts,verdicts}`、経路は `review live-dispatch` → `review live-consume` → `claude --role blind-reviewer`、subject は blob oid と SHA-256 の再計算で request と join (receipt の文書 digest 欄を仮定しない)、PR コメントは専用 repository のみで merge しない、Windows / Linux の両 evidence。Linux evidence では専用 distro の sshd 有効設定と socket が `127.0.0.1` のみであること、Remote-SSH 接続、受入専用に新規作成した鍵対の公開鍵のみの配置、distro 内 VS Code Server と Claude 拡張の稼働、該当拡張プロセスの環境から実測した `CLAUDE_CODE_ENTRYPOINT=claude-vscode` を確認する。Red に「source repository / Pack repository の PR を対象にする」「実行中に repository を作る」「verdict / receipt が consumer root 以外にある」を加える。network / 認証の例外は AT-DIST-003 の実 provider 段階に限り (PO 承認: PR #812 comment 5929420300)、AT-DIST-002 には適用しない。Remote-SSH 接続への変更は PO 決定 #418 comment 6036338735 (2026-10-07)、初回隔離条件は #418 comment 6032687564 (2026-10-07) を維持 |

| 受入行 | 入力 | 判定・証跡 |
| --- | --- | --- |
| `AT-DIST-002` | 公開済み exact `v0.2.0-canary.2` の5 asset、#418 publish記録、外部anchor、sourceを含まないWindows/Linuxのclean consumer | runnerがasset bytesとanchorを照合し、別process/cwd/envでPLAN・DB・doctor・review・hookを再現。Bun invocationとsource path参照は0。Linux/Windows実runとpublish記録への束縛が揃うまで未達とする |
| `AT-DIST-003` | 公開後の exact `v0.2.0-canary.5` の5 asset、publish記録、外部anchor、sourceを含まないclean consumer、実エージェントが書いたL1 subject | 015〜019 を全件通す: G1 positive/negative と、実subjectの非著者 review receipt が exact revision に束縛される。AT-DIST-002 と別行で互いに代替しない。実run・非著者receiptが揃うまで未達。Linux は §3.6.9 の専用 WSL2 条件を用い、実 provider review の段階だけ provider / 専用 consumer repository 通信と明示済み distro setup 通信を許す。Remote-SSH は distro 内 sshd の `127.0.0.1` のみへ接続し、受入専用鍵対の公開鍵のみを distro に配置する。VS Code Server と Claude 拡張は distro 側で動き、該当 Claude 拡張プロセスの実環境から `CLAUDE_CODE_ENTRYPOINT=claude-vscode` を測定する。AT-DIST-002 へは波及しない |

canary.5 の受入で AT-DIST-003 (015〜019) は全件再検査する。AT-835-008 (canary.4 Windows VS Code hook 3 run)
と AT-DIST-002 (canary.3) の既存証拠は、Pack producer/operator の canonical C1 を使った
`git diff --name-status --no-renames <C4-C1> <C5-C1> -- src/runtime/ src/cli.ts docs/templates/adapter/.claude/settings.json src/setup/templates.ts`
が両 commit の存在・到達性確認後に exit 0 / 空出力の場合だけ再利用できる。差分があれば自動再利用を拒否し、
影響する AT のみを再検査する。C5 C1 が公開記録に現れる前に再利用可否や受入 PASS を主張しない。

Candidate は pair-freeze 時点の設計候補である。PR-1 の第 1 層では、同番号の
`U-ST-PACKCANARY-001..004`、`U-ST-PACKCANARY-006` (unit)、
`U-ST-PACKCANARY-007`、`U-ST-PACKCANARY-010` へ 1:1 に昇格する。
所有テストは `tests/pack-internal-canary-boundary.test.ts` であり、001 / 002 / 006 は
独立した負系、003 / 004 / 007 / 010 は source と setup 元の削除後に実 Pack 導入から
review receipt / merge gate / 登録済み hook まで通す一つの破壊的 E2E で観測する。
005・006 (実 Release 受入)・008・009・010 (第 2 層) は PR-2 まで Candidate のまま保持し、
第 1 層 Green を公開 asset の受入証拠へ読み替えない。

### PR-1 第 1 層へ昇格した oracle

| Oracle ID | Red 入力と独立観測点 | 所有テスト |
| --- | --- | --- |
| `U-ST-PACKCANARY-001` | source-only / absolute path の混入でも出荷inventoryに到達しない | `tests/pack-internal-canary-boundary.test.ts` |
| `U-ST-PACKCANARY-002` | skills / authoring template の欠落と重複を別々に拒否する | `tests/pack-internal-canary-boundary.test.ts` |
| `U-ST-PACKCANARY-003` | sourceとsetup元撤去後、別cwdからsealed wrapperで起動する | `tests/pack-internal-canary-boundary.test.ts` |
| `U-ST-PACKCANARY-004` | wrapper / config / runtime stateにsetup元絶対path参照が0。`active.json` にJSONエスケープされたWindows絶対pathを混入する単独変異も検出 | `tests/pack-internal-canary-boundary.test.ts` |
| `U-ST-PACKCANARY-006` | unit境界とPR-2 runnerの双方でexact tag以外、5 assetの欠落・余剰・別名を拒否し、runner側は`setup` spawn 0を観測する | `tests/pack-internal-canary-boundary.test.ts`、`tests/pack-canary-acceptance.test.ts` |
| `U-ST-PACKCANARY-007` | 別process/cwd/envでPLAN・DB・doctor・reviewを再現しBun trace 0 | `tests/pack-internal-canary-boundary.test.ts` |
| `U-ST-PACKCANARY-010` | 登録済みhookの正常系 exit 0・禁止系 block exit 2・launcher欠落の非block失敗 exit 1 を区別する。生成登録を欠落pathへ変える変異は正常系の exact exit 0 でRed | `tests/pack-internal-canary-boundary.test.ts` |

### PR-2 公開 Release 接合 oracle

PR-2 は既存 `U-ST-PACKCANARY-003/007/010` の full offline closure を再実装しない。公開 Release 固有の
差分 (Issue #418 コメントの publish record 写し、Release の exact 5 byte、外部 anchor の渡し方) を
`tests/pack-canary-acceptance.test.ts` で検証し、実受入は `scripts/pack-canary-acceptance.mjs` を
使う。publish record の canonical source は source repo の #418 コメントであり、JSON 写しとコメントの
一致は runner が自己証明できない。実受入 evidence にはコメント URL と record JSON SHA-256 を残し、
Codex 著を受け取る Claude 族の non-author reviewer がコメント本文との一致と、公開 Release からの
digest 再計算を独立に確認する。

| Oracle | Red / 独立観測点 | Green |
| --- | --- | --- |
| `U-ST-PACKCANARY-005` | 実 producer fixture の 5 asset を1 byte変異、またはpublish記録のproducer値・独立値を欠落/不一致にして `setup` spawn 0とconsumer root write 0を観測 | runnerが全assetのsha256と記録の2値一致をinstallerより先に検証する |
| `U-ST-PACKCANARY-008` | 改変bundle側の5 asset digestを整合させ、publish記録のanchorだけ真正値に固定してinstallerのtyped denyとwrite 0を観測 | `--expected-consumer-digest`に記録のanchorを渡し、`consumer_runtime_anchor_mismatch`で拒否する |
| `U-ST-PACKCANARY-009` | source helper経路への差替え、release-dirからのanchor再計算、fixture tagの受入記録混入をそれぞれ観測する | `--consumer-runtime-release`のみ、記録anchorのみ、公開受入tagはcanary.2のみを許す |
| `U-ST-PACKCANARY-011` | PR-2 runnerの登録済みhookを正常系・禁止系payloadで単独実行 | Codex/Claudeのallowとblockを区別する。PR-1の`U-ST-PACKCANARY-010`のE2E所有は変更しない |
| `U-ST-PACKCANARY-012` | consumer stateへ撤去済みsource pathを混入 | runnerのpath監査が拒否する |
| `U-ST-PACKCANARY-013` | closed review stubから外向きGitHub操作を試みる | 実review/mergeと混同せず外向き操作0を観測する |
| `U-ST-PACKCANARY-014` | 再起動証跡のconsumer rootまたは撤去済みrelease rootを変異 | 証跡のroot束縛不一致を拒否する |

### AT-DIST-003 collector の offline implementation oracles (Candidate 未昇格)

2026-10-07 の入力契約改訂は、未完の AT-DIST-003 を canary.5 へ再束縛した。下記の既存 offline oracle と所有 test 名は canary.4 時点の実装証跡を示す履歴であり、canary.5 への実装接合は後続作業で未実施である。次の bounded implementation で exact-tag owner test を canary.5 に更新すること。これは offline binding の検証であり、実 provider / 公開 Release による AT-DIST-003 の受入証明ではない。AT-DIST-002 の canary.2 束縛と過去の受入証跡は変更しない。

次の `U-ST-PACKCANARY-015..019` は、第 2 層 collector の validator / wiring を offline fixture で検査する実装 oracle である。
同番号の `CANDIDATE-ST-PACKCANARY-015..019` が要求する実 provider、公開 Release からの実 bytes、canonical custody、
専用 consumer PR に対する受入を昇格・代替しない。mock adapter と structural join は AT-DIST-003 実 run の証跡ではない。

| Oracle ID | 所有 test (`tests/pack-canary-acceptance.test.ts`) | この oracle が保証する範囲 (実 provider / AT-DIST-003 acceptance は対象外) |
| --- | --- | --- |
| `U-ST-PACKCANARY-015` | `U-ST-PACKCANARY-015: accepts exact canary.4 for the agent lane and canary.2 for the standard lane`; `U-ST-PACKCANARY-015: the AT-DIST-003 lane accepts only exact canary.4 bytes and its record anchor` | 現行 test は canary.4 時点の offline binding 実装証跡であり、canary.5 契約への接合は未実施。後続の bounded implementation で test 名・fixture・oracle を canary.5 に更新する。標準 AT-DIST-002 の canary.2 lane は不変。公開 Release の独立再取得や install 実行は証明しない |
| `U-ST-PACKCANARY-016` | `U-ST-PACKCANARY-016: rejects missing or non-agent authoring provenance`; `U-ST-PACKCANARY-016: rejects prefixed github.com repository identity`; `U-ST-PACKCANARY-016: routes authoring through registered se role and rejects worker`; `U-ST-PACKCANARY-016..018: mock adapter exercises consumer CLI wiring (not provider evidence)` | provenance / canonical repository identity validator の fail-close、production delegation routing の se 正系・worker 否定系、mock での normal consumer CLI 呼出し順。Codex provider 実 invocation は証明しない |
| `U-ST-PACKCANARY-017` | `U-ST-PACKCANARY-017: rejects a non-applicable, failed, or could-not-run G1 positive`; `U-ST-PACKCANARY-016..018: mock adapter exercises consumer CLI wiring (not provider evidence)` | positive G1 evidence shape の拒否条件と mock の CLI wiring。実 subject の G1 pass は証明しない |
| `U-ST-PACKCANARY-018` | `U-ST-PACKCANARY-018: rejects same-revision or unnamed-slot G1 negative`; `U-ST-PACKCANARY-016..018: mock adapter exercises consumer CLI wiring (not provider evidence)` | negative G1 evidence shape の拒否条件と mock の CLI wiring。実 subject の別 child revision に対する G1 fail は証明しない |
| `U-ST-PACKCANARY-019` | `U-ST-PACKCANARY-019: rejects same-family, wrong-head, or noncanonical review receipts`; `U-ST-PACKCANARY-015..019: offline structural join accepts a complete fixture (not an AT-DIST-003 run)` | canonical join validator の offline positive / negative shape。live review、実 provider、既存専用 consumer PR、canonical custody の受入を証明しない |

`U-ST-PACKCANARY-010` を含む full closure (別process/cwd/env、PLAN/DB/doctor/review、hook、Bun/source path trace) は
既存 `tests/pack-internal-canary-boundary.test.ts` の real-producer offline fixture が所有し、公開 asset 接合の
ために重複実装しない。実際の canary.2 run は public Releaseから取得したbytesでこの閉包を1回実行し、結果を
`#418` へ記録する。公開と実受入は PO 承認後のみである。

## 4. 実行手順

1. 第 1 層では一時 clean root に tagged release commit を作り、実 producer
   (`distribution package --tag <fixture tag>`、AT-DIST-001 と同じ機構) が出力した exact 5 asset の
   release-dir を用意する (実 GitHub 取得はしない。名前だけ模した手書き asset は使わない)。
   第 2 層では公開済み `v0.2.0-canary.2` の exact 5 asset を取得し、tag は exact match で解決し、
   `PLAN-L7-531` §3.4 の publish 記録と asset 集合・sha256 を照合する。いずれも source
   repositoryをfixtureの入力に残さない。
2. `PLAN-L7-628` §6.2 の installer コマンド (`node <release-dir>/<tag>.ut-tdd.mjs setup --solo
   --consumer-runtime-release <release-dir> --expected-consumer-digest sha256:<anchor>`) を空の
   consumer root で実行する。anchor は第 1 層が fixture 自身から計算した値 (受入の信頼根ではない)、
   第 2 層が publish 記録の値である。
3. Pack rootをsetup元として別Product rootへ実行し、テスト専用のsetup元Pack checkoutと
   `<release-dir>`を削除する。最終受入では隔離環境からsource repository/worktreeを参照不能にする。
   開発用repository、実利用worktreeやユーザーデータを削除して試験してはならない。正式setupが生成した
   sealed bundle/pointerだけを入力として、別cwdからproject-local wrapperを再実行する。
   テストはbundle/pointerを手書き注入しないため、現行setupが生成できなければRedになる。
4. consumer root外のread/open/stat/write/processを観測し、失敗時もpartial successへ丸めない。
5. 別cwdの wrapper から `doctor --setup-smoke`・PLAN authoring/lint・db rebuild・doctor・review
   smoke と guard hook の正常系/禁止系 (`CANDIDATE-ST-PACKCANARY-010`) を実行する。第 2 層では
   公開 bundle の手順 0 (anchor 照合) が機能することを確認し、`tests/support/pack-consumer-
   runtime.ts` の実行結果と第 1 層の結果を acceptance evidence に混ぜない (`CANDIDATE-ST-
   PACKCANARY-009`)。
6. Linux、Windows、aggregateで同じ Candidate/Oracle を実行し、exact release identity、
   PLAN revision、Reverse、CI、non-author closing receiptへ束縛する。

## 5. 完了条件

- #418の非Bun境界 Candidate が、同じテスト設計・実装 revisionでRed→Greenになる。
- `PLAN-L6-101` の consumer隔離責務、`PLAN-L7-628` の producer 出力 (asset 集合・schema・
  anchor 発行)、`PLAN-L7-516` のconsumer-local runtime境界と1:1 traceする。
- source/worktree/local Pack checkoutへのruntime fallbackがないことを、単なる文字列検査
  ではなく実materialize・setup・setup元撤去・別cwd起動で確認する。
- 第 2 層の受入 run が publish 記録の anchor で `PLAN-L7-628` §6.2 の installer コマンドをそのまま
  実行し、asset 集合・sha256 の記録照合と anchor 照合の deny 経路を実 Release で観測する。
- source-CLI helper (`--consumer-runtime-input`) と第 1 層の Green が acceptance evidence として
  引用されないことを `CANDIDATE-ST-PACKCANARY-009` の offline test で機械検査する。
- Linux/Windows/aggregate CI、PLAN lint、L12受入証跡、成果物を書いていない族 (cross-family) の canonical non-author closing receipt、
  Reverse R1〜R4が同一exact revisionへ束縛される。

## 6. 現在の実測範囲(未完了の受入を区別する)

Codex 先行 branch の `8e4dc229` で `npm`/setupを起動しないmaterialized-authoring subcaseを追加した。
`node scripts/run-vitest-snapshot.ts tests/pack-internal-canary-boundary.test.ts -t "materialized authoring bytes" --reporter=dot`
は1 passed / 4 skipped、Vitest開始2026-09-08 18:38:08 JST、34.47秒。rootがrunnerのfence/cleanupを
含むexit 0を確認した。6 authoring artifactを既存smokeで読み、skillsの2ファイルが非空であること、
state templateのJSON破損を既存parserが拒否することを観測した。smoke実装の所有はPLAN-L7-528へ維持する。

このfixtureはHEADのpath一覧と作業treeのbytesからmaterializeする。公開済みrelease artifact、
manifest/asset digestや正規publication receiptの検証ではない。skillsについてinventory validatorが
missing/duplicateを検出するとは主張せず、物理存在・非空だけの実測とする。
既存C003/C004のsetup元削除後起動・絶対path残存のRedは未修正。
C004の現実装は生成3ファイルだけを検査し、command output/runtime state全体の保証ではない。
本節の追加で§4の全手順、L12受入、Issue #418完了へ昇格しない。

pair-freeze PR (`PLAN-L7-531` PR-0) は本書と PLAN のみを含み、
`tests/pack-internal-canary-boundary.test.ts` は PR-1 で Red→Green とともに取り込む。
005..010 は 2026-09-28 時点で実装・実測ともに 0 である (005..007 は 2026-09-10 版からの
Candidate 差し替え、008..010 は新設)。
