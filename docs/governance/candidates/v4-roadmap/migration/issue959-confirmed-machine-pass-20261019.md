# issue #959 confirmed PLAN の機械による一次判定 (dry-run、2026-10-19)

この資料は issue #959 のうち、`status: confirmed` の PLAN 679 本を frontmatter と tree の実測だけで一次判定する規則の案と、その dry-run 結果である。処分の正本ではない。既存の `06_PLAN_DISPOSITION_FIRST_PASS.*`、b / d / f の人手判定、PLAN 本文は変更していない。人手判定 (Luna) の再開と既存 JSON への統合は、この結果を入力にして別途行う。

- 入力: origin/main `7e8d67be71afa78bf1ed2c175fea4915314cec47` の作業ツリー (PLAN 1,008 本、うち confirmed 679 本)
- 出力: `issue959-confirmed-machine-pass-20261019.json` (PLAN ごとの区分・規則・理由・根拠)
- スクリプト: `issue959-confirmed-machine-pass-20261019.mjs` (node 標準ライブラリだけ。repo は読むだけで、書くのは `--write` 指定時の隣接 JSON 1 本)

## 結果の要約

PR #1132 r1 の FLAG (部分退役・部分 supersede を PLAN 全体の退役へ広げている) を受けて是正した後の結果である。是正前は 生きている 335 / supersede済み 1 / 廃止予定 3 / 保留 340 だった。

| 区分 | 件数 | 内訳 |
|---|---|---|
| 生きている | 337 | L1 337 |
| supersede済み | 0 | 規則 S に当たる PLAN なし |
| 廃止予定 | 0 | 規則 R1 / R2 に当たる PLAN なし |
| 保留 | 342 | 下表 |
| 合計 | 679 | |

保留の内訳 (件数の多い順):

| 規則 | 件数 | 理由 |
|---|---|---|
| H:docs-only | 182 | 生成物が文書だけで tree に実在する。契約が設計文書側へ移っているかの三者照合 (#648) が要る。REVERSE backfill 75 本、add-design 73 本、design 28 本が中心 |
| H:self-only | 76 | 生成物が PLAN 自身だけ (または空) で、tree に実在を確かめる対象がない |
| H:retire-overlap-partial | 47 | 生成物の一部が退役対象と重なる。実在しても生きている確証が弱い |
| H:retire-overlap-majority | 23 | 生成物の半数以上が退役対象と重なる。契約凍結後の廃止予定の候補 |
| H:supersede-partial | 10 | `supersedes` の双方向 link はあるが、部分 supersede (errata 型) の疑い。PLAN-L7-57 を含む |
| H:retire-candidate | 3 | 生成物がすべて退役候補だが、契約が未凍結または部分退役 (PLAN-L7-162 / L7-472 / REVERSE-238) |
| H:partial-retire-named | 1 | PLAN-L7-454。#789 が名指しするが、表示経路の継承を契約が明記する部分退役 |

### #947 指標 1「撤去できる数」の初期値

- **確定できる数: 0 本**。是正前の 4 本は、すべて「契約が存続させる責務」を無視して PLAN 全体の退役へ広げた誤判定だったため、取り下げた。
- 契約が凍結され、存続する責務の切り分けが済めば廃止予定へ上がり得る候補は **37 本** (H:retire-overlap-majority 23 + H:retire-candidate 3 + H:supersede-partial 10 + H:partial-retire-named 1)。候補であって、各本が全面撤去できるとは限らない (PLAN-L7-57 / L7-454 / L7-472 は実際に存続する責務を持つ)。H:retire-overlap-partial の 47 本は含めない。
- 2026-10-16 の control 調査 (draft を含む見込み 34〜121 本) との差: control が挙げた 33 本のうち confirmed は PLAN-L7-325 と PLAN-L7-417 の 2 本だけで、残りは draft である。この 2 本は生成物が退役対象の path に当たらず、L1 (生きている) になった。draft 300 本は本判定の対象外である。

## 判定ルール (案)

PLAN 自身 (`docs/plans/<plan_id>.md`) と共通ハブ (`src/cli.ts`、`src/setup/templates.ts`、`src/lint/rule-drift.ts`、`CLAUDE.md`、`AGENTS.md`、`.claude/CLAUDE.md`、`.claude/settings.json`、`docs/governance/README.md`) を除いた `generates` の各 path を「成果物」と呼ぶ。以下を上から順に当て、最初に当たった区分にする。

| 順 | 規則 | 区分 | 判定式 (根拠のコマンド / 式) |
|---|---|---|---|
| 1 | S | supersede済み | 後継 PLAN の `supersedes` が本 PLAN を指す (自己参照は除外)、かつ本 PLAN の本文 (frontmatter を除く) が後継の core ID を含む (`src/lint/plan-supersession.ts` と同じ判定)、かつ訂正注記の行が「一部 / だけ / のみ / only / partial」を含まず、かつ本 PLAN の成果物をすべて後継の `generates` が引き取っている。どれか欠ければ H:supersede-partial。**名指しの退役 issue があっても、この検査を迂回しない** |
| 2 | H:partial-retire-named | 保留 | 退役 issue が名指しするが、契約が存続させる責務を明記している PLAN (現在は PLAN-L7-454 のみ) |
| 3 | R1 (path) | 廃止予定 | 成果物が 1 本以上あり、すべてが **tierA** の退役対象 path に当たるか git 履歴で削除済み、かつ 1 本以上は退役対象 path に当たる。tierA は「退役契約が設計文書へ凍結済みで、存続させる責務が PLAN 全体の撤去と矛盾しない」集合に限る。現在 tierA は空 |
| 4 | R2 | 廃止予定 | 成果物が 1 本以上あり、すべてが tree に無く、`git log --diff-filter=DR -M` で削除 (rename でない) が確認できる。今回は 0 件 |
| 5 | H:retire-candidate | 保留 | 規則 3 と同じ形だが、退役対象が tierB (契約未凍結または部分退役) |
| 6 | H:self-only / H:hub-only | 保留 | 成果物が 0 本 (PLAN 自身のみ、空、ハブのみ) |
| 7 | 実在の判定 | 下記 | 成果物ごとに `git ls-files` で tracked-file / tracked-directory / glob 一致を調べる。無いものは履歴で deleted / renamed / never-tracked / ignored-runtime に分ける |
| 7a | L1 / L2 | 生きている | 成果物がすべて tree に実在 (L2 は残りが未追跡の実行時ファイルだけ)、実行物を 1 本以上含み、退役対象 path との重なりが 0 |
| 7b | H:retire-overlap-majority / partial | 保留 | 成果物のうち退役対象 path に当たる割合が 50% 以上 (majority)、または 1 本以上 (partial) |
| 7c | H:docs-only | 保留 | 実在するが、成果物が文書だけ。契約が設計文書側へ移った可能性があり、#648 の三者照合が要る |
| 7d | H:runtime-only / H:absent-no-deletion-proof / H:partial | 保留 | 今回は 0 件 |

退役対象の定義 (`RETIRE_SETS`、スクリプト冒頭) は、現在すべて **tierB** (保留にとどめる)。

- #1002 の `.claude/agents/` と adapter template (例外として残す定義があり、全面撤去ではない)。
- #762 の `src/team/run.ts` / `run-policy.ts` / `src/schema/team.ts` / `docs/templates/team/` / `.ut-tdd/teams/` とそのテスト (issue の AC が削除 PLAN の起票を求めており、契約が未凍結)。
- #1062 と #1084 群1 の `claude-memory-wake` / `claude-wake-generation-upgrade` / `provider-handover` / `memory-sync` lint とそのテスト。`state-channel-consolidation.md` §A3 が wake 基盤 (inbox・CAS・project 束縛・envelope digest・Stop hook) の存続を採択しているため部分退役。
- #789: 取得層・schema・表示経路 (`loadRepoScopedRuntimeSessionUsage`) が存続する (PLAN-L6-789 §3)。ファイル単位では判定できないので path を持たない。
- #575 / #1084 群3・11、#1083 / #1084 群5、#1084 群10、#1084 群4: 契約が未凍結。

tierA への昇格は、退役契約が設計文書へ凍結され、かつ「何を残すか」が PLAN 全体の撤去と矛盾しないことを人が確認してから、`RETIRE_SETS` を更新して再実行する。

## 再現手順

リポジトリルートで次を実行する (node 24 で確認、約 5 秒)。

```bash
node docs/governance/candidates/v4-roadmap/migration/issue959-confirmed-machine-pass-20261019.mjs --write
```

- `--write` を省くと JSON を書かず、件数の要約だけを標準出力へ出す。
- 作業ツリーが JSON の `sourceHead` と異なると PLAN の増減で件数が動く。
- 履歴は `git log --name-status -M --diff-filter=DR` を全期間で読む。shallow clone では R2 の削除確認が欠ける。

## 目視照合 (区分ごとに無作為 5 本、是正後にやり直し)

### 照合で見つかった誤判定と対処

1. **supersede の偽陽性 (初版)**。双方向 link だけでは 10 本が supersede済みになった。PLAN-L7-139 / L7-143 / L7-492 / L7-465 / L7-512 の本文を読むと、後継が一部の claim や Slice だけを訂正する注記で、旧 PLAN の成果物は生きていた。部分 supersede を保留へ倒した。
2. **設計文書だけの PLAN (初版)**。PLAN-REVERSE-111 のように、tree に実在していても契約の所在が分からない。H:docs-only へ倒した。
3. **退役対象と重なる PLAN (初版)**。PLAN-L7-126 / L7-384 は `src/workflow/` (#1083 の対象) を含む。H:retire-overlap-* へ倒した。
4. **r1 FLAG の 3 件 (是正済み)**。同じ系統の誤り、すなわち部分的な退役・supersede を PLAN 全体の退役へ広げていた。
   - PLAN-L7-57: 名指しの退役が部分 supersede の検査を迂回し、`ownedBySuccessor: true` を固定で書いていた。PLAN-L6-789 §3 は取得層・schema・generates 2 件の継承と非撤去を明記し、後継の generates は自身の PLAN だけである。迂回を除き、H:supersede-partial で保留にした。
   - PLAN-L7-454 (R-789): token-tracker.ts 全体を退役 path にしていたが、PLAN-L7-454 と PLAN-L6-789 は表示経路の継承を明記する。path 定義を空にし、名指しの PLAN は H:partial-retire-named で保留にした。
   - PLAN-L7-472 (R-1062): `state-channel-consolidation.md` §A3 が wake 基盤の存続を採択している。tierB へ下げ、H:retire-candidate で保留にした。
   - あわせて、reviewer が指摘していない #762 と #1002 も、契約が未凍結または例外を残すため tierB へ下げた (迷うものは保留)。

### supersede済み / 廃止予定

是正後は 0 本。是正前の 4 本 (PLAN-L7-57、L7-162、L7-454、L7-472) は、すべて上記のとおり保留へ移した。抽出する対象が無いので、移した 4 本を再読して保留が妥当であることを確認した。

| PLAN | 現在の区分 | 照合 |
|---|---|---|
| PLAN-L7-57-token-telemetry-tracker | H:supersede-partial | PLAN-L6-789 §3 が取得層・schema・generates の継承を明記。後継は draft。保留が妥当 |
| PLAN-L7-454-runtime-token-telemetry-ingestion | H:partial-retire-named | 表示経路の継承が本文にある。保留が妥当 |
| PLAN-L7-472-claude-memory-async-wake | H:retire-candidate | A3 が基盤の存続を採択。保留が妥当 |
| PLAN-L7-162-team-run-policy-extraction | H:retire-candidate | #762 の削除対象と一致するが契約が未凍結。保留が妥当 |

### 生きている (5 本中 5 本が妥当、誤判定 0)

| PLAN | 照合 |
|---|---|
| PLAN-L7-181-g9-system-coverage-expansion | `src/lint/g9-system-workflow.ts` が実在。#1084 群8 (g8/g9/g10 の統合候補) だが、統合は退役ではなく契約もない |
| PLAN-L7-136-harness-db-journal-status-filter | `src/lint/change-impact.ts` が実在。退役対象との重なりなし |
| PLAN-L7-127-orchestration-degradation-record | `src/vmodel/injection.ts` が実在 (`cli.ts` はハブ)。退役対象との重なりなし |
| PLAN-L7-417-source-disposition-profile-projection | `src/disposition/` 配下が実在。control は「汎用 skill」として退役見込みに挙げたが、契約が凍結されておらず path も退役対象に当たらない。弱い「生きている」 |
| PLAN-L7-327-doctor-json-cli-contract | 生成物が実在。退役対象との重なりなし |

これは「成果物が tree に実在し、退役の根拠が見つからない」までの確認で、三者照合 (#648) は照合していない。全件に `evidence.tripartiteCheck: "pending"` を付けた。

### 保留 (規則ごとに 1 本、計 7 本が妥当、誤判定 0)

| PLAN | 規則 | 照合 |
|---|---|---|
| PLAN-L4-33-node-control-plane-redesign | H:docs-only | 成果物は `architecture.md` だけ。保留が妥当 |
| PLAN-L7-514-claude-hook-schema-rolling-upgrade | H:retire-overlap-majority | 3 本中 2 本が #1062 の対象。残りは fixture。保留が妥当 |
| PLAN-L7-195-model-override-injection-hardening | H:retire-overlap-partial | 6 本中 2 本が #762 の対象、4 本は存続。保留が妥当 |
| PLAN-L7-490-memory-write-collision-safety | H:self-only | `generates` が PLAN 自身だけ。保留が妥当 |
| PLAN-L7-143-harness-db-warn-remediation | H:supersede-partial | PLAN-L7-144 が訂正したのは一部で、成果物 19 本は生きている。保留が妥当 |
| PLAN-REVERSE-238-cited-command-backfill | H:retire-candidate | 生成物が `docs/process/modes/README.md` だけで #1083 の対象。契約未凍結。保留が妥当 |
| PLAN-L7-454-runtime-token-telemetry-ingestion | H:partial-retire-named | 上記のとおり |

保留 342 本の全件を目で読んだわけではない。

## 既知の限界

- **部分的な退役・supersede を PLAN 全体の退役へ広げない (PR #1132 r1 の教訓)**。名指しの退役 issue があっても、退役契約が「何を残すか」を書いている PLAN (取得層・表示経路・wake 基盤など) は、撤去可能に入れてはならない。名指しは廃止予定の十分条件ではない。判断に迷うもの、path で判定できない部分退役、契約が未凍結のものは保留に倒す。tierA に入れてよいのは、契約が設計文書へ凍結済みで、存続させる責務が PLAN 全体の撤去と矛盾しない集合だけである。現在 tierA は空である。
- **「生きている」は弱い主張である**。成果物が tree に実在し、退役対象に当たらないことしか見ていない。契約が設計文書へ移っているか、機能が使われているかは見ていない。337 本の全件で三者照合 (#648) が残る。統合候補 (#1084 群6〜9) や control が挙げた退役見込み (L7-417 など) も、path が退役対象に当たらなければ L1 になる。
- **R2 (成果物がすべて削除済み) は 0 件**。全 confirmed PLAN の成果物 2,811 件が tree に実在した。`plan-artifact-existence` の doctor ゲートが実在を要求している影響と考えられる。
- **`supersedes` が errata に使われている**。frontmatter に `supersedes` を持つ PLAN は 17 本で、全面 supersede と読めるものは今回 0 本だった。#959 本文の「supersede済み」は、errata を含まない狭い意味で運用する必要がある。
- **tierB の退役契約は未凍結**。#575 / #762 / #1083 / #1084 は open で、範囲は issue 本文だけでは確定しない。
- **退役対象は path で判定する**。モジュールの一部だけが退役する場合 (`projection-writer.ts` の token 行、`cli.ts` の `team` command など) は path では判定できない。共通ハブは判定から外している。
- **部分 supersede の検出は文字列で行う**。訂正注記の行に「一部 / だけ / のみ / only / partial」を含むかを見るだけで、`only` は単語境界を見ない部分一致である (保留側に倒れる方向の誤差)。
- **`generates` の宣言が正しい前提**。宣言が実際の成果物と違う PLAN は検出できない。
- **対象は confirmed だけ**。draft 300、completed 26、archived 3 は判定していない。
- **REVERSE の backfill PLAN (133 本)** は 12 本だけが生きている、残りは保留。器の扱い (MIG-14) は別途決まる。
