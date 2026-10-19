# issue #959 confirmed PLAN の機械による一次判定 (dry-run、2026-10-19)

この資料は issue #959 のうち、`status: confirmed` の PLAN 679 本を frontmatter と tree の実測だけで一次判定する規則の案と、その dry-run 結果である。処分の正本ではない。既存の `06_PLAN_DISPOSITION_FIRST_PASS.*`、b / d / f の人手判定、PLAN 本文は変更していない。人手判定 (Luna) の再開と既存 JSON への統合は、この結果を入力にして別途行う。

- 入力: origin/main `7e8d67be71afa78bf1ed2c175fea4915314cec47` の作業ツリー (PLAN 1,008 本、うち confirmed 679 本)
- 出力: `issue959-confirmed-machine-pass-20261019.json` (PLAN ごとの区分・規則・理由・根拠)
- スクリプト: `issue959-confirmed-machine-pass-20261019.mjs` (node 標準ライブラリだけ。repo は読むだけで、書くのは `--write` 指定時の隣接 JSON 1 本)

## 結果の要約

| 区分 | 件数 | 内訳 |
|---|---|---|
| 生きている | 335 | L1 335 |
| supersede済み | 1 | S 1 (PLAN-L7-57、後継 PLAN-L6-789 は draft) |
| 廃止予定 | 3 | R1 3 (PLAN-L7-162 / L7-454 / L7-472) |
| 保留 | 340 | 下表 |
| 合計 | 679 | |

保留の内訳 (件数の多い順):

| 規則 | 件数 | 理由 |
|---|---|---|
| H:docs-only | 182 | 生成物が文書だけで tree に実在する。契約が設計文書側へ移っているかの三者照合 (#648) が要る。REVERSE backfill 75 本、add-design 73 本、design 28 本が中心 |
| H:self-only | 76 | 生成物が PLAN 自身だけ (または空) で、tree に実在を確かめる対象がない (REVERSE 36、add-design 8、troubleshoot 8 など) |
| H:retire-overlap-partial | 48 | 生成物の一部が退役対象 (#762 / #1083 / #1002 / #789 / #1062 / #575) と重なる。実在しても生きている確証が弱い |
| H:retire-overlap-majority | 24 | 生成物の半数以上が退役対象と重なる (#1083 10、#575 10、#1002 2、#1084 群10 2)。契約凍結後の廃止予定の候補 |
| H:supersede-partial | 9 | `supersedes` の双方向 link はあるが、errata 型 (部分 supersede) の疑い |
| H:retire-candidate | 1 | 生成物がすべて退役候補 (#1083) だが契約が未凍結 (PLAN-REVERSE-238) |

### #947 指標 1「撤去できる数」の初期値

- **確定できる数: 4 本** (廃止予定 3 + supersede済み 1)。confirmed 679 本の 0.6%。
- 契約が凍結されれば廃止予定へ上がる候補は **+34 本** (H:retire-overlap-majority 24 + H:retire-candidate 1 + H:supersede-partial 9)。確定 4 本と合わせて上限 38 本 (5.6%)。H:retire-overlap-partial の 48 本は含めない (重なりが半数未満で、生きている部分が残る可能性が高い)。
- 2026-10-16 の control 調査 (draft を含む見込み 34〜121 本) との差: control が挙げた 33 本のうち confirmed は PLAN-L7-325 と PLAN-L7-417 の 2 本だけで、残りは draft である。この 2 本の生成物は退役対象の path に当たらず、L1 (生きている) になった。draft 300 本は本判定の対象外で、別に回す。

## 判定ルール (案)

PLAN 自身 (`docs/plans/<plan_id>.md`) と共通ハブ (`src/cli.ts`、`src/setup/templates.ts`、`src/lint/rule-drift.ts`、`CLAUDE.md`、`AGENTS.md`、`.claude/CLAUDE.md`、`.claude/settings.json`、`docs/governance/README.md`) を除いた `generates` の各 path を「成果物」と呼ぶ。以下を上から順に当て、最初に当たった区分にする。

| 順 | 規則 | 区分 | 判定式 (根拠のコマンド / 式) |
|---|---|---|---|
| 1 | S | supersede済み | 後継 PLAN の `supersedes` が本 PLAN を指す (自己参照は除外)、かつ本 PLAN の本文 (frontmatter を除く) が後継の core ID (`PLAN-<layer>-<n>`) を含む (訂正注記による双方向確認、`src/lint/plan-supersession.ts` と同じ判定)、かつ訂正注記の行が「一部 / だけ / のみ / only / partial」を含まず、かつ本 PLAN の成果物をすべて後継の `generates` が引き取っている。どれか欠ければ H:supersede-partial |
| 2 | R1 (名指し) | 廃止予定 | tierA の退役 issue が、退役する契約として本 PLAN を名指しする (現在は #789 の PLAN-L7-57 / PLAN-L7-454) |
| 3 | R1 (path) | 廃止予定 | 成果物が 1 本以上あり、すべてが tierA の退役対象 path に当たるか、git 履歴で削除済み、かつ 1 本以上は退役対象 path に当たる |
| 4 | R2 | 廃止予定 | 成果物が 1 本以上あり、すべてが tree に無く、`git log --diff-filter=DR -M` で削除 (rename でない) が確認できる。今回は 0 件 |
| 5 | H:retire-candidate | 保留 | 規則 3 と同じ形だが、退役対象が tierB (契約が未凍結) |
| 6 | H:self-only / H:hub-only | 保留 | 成果物が 0 本 (PLAN 自身のみ、空、ハブのみ) |
| 7 | 実在の判定 | 下記 | 成果物ごとに `git ls-files` で tracked-file / tracked-directory / glob 一致を調べる。無いものは履歴で deleted / renamed / never-tracked / ignored-runtime に分ける |
| 7a | L1 / L2 | 生きている | 成果物がすべて tree に実在 (L2 は残りが `.ut-tdd/` など未追跡の実行時ファイルだけ)、実行物 (`source_module` / `test_code` / `script` / `hook` / config 系 / `template` など) を 1 本以上含み、退役対象 path との重なりが 0 |
| 7b | H:retire-overlap-majority / partial | 保留 | 成果物のうち退役対象 path に当たる割合が 50% 以上 (majority)、または 1 本以上 (partial) |
| 7c | H:docs-only | 保留 | 実在するが、成果物が文書 (`design_doc` / `test_design` / `markdown_doc` など) だけ。契約が設計文書側へ移った可能性があり、#648 の三者照合が要る |
| 7d | H:runtime-only / H:absent-no-deletion-proof / H:partial | 保留 | 未追跡の実行時ファイルだけ、削除の履歴で裏が取れない、一部だけ欠落。今回は 0 件 |

退役対象の定義 (`RETIRE_SETS`、スクリプト冒頭):

- tierA (issue 本文または契約で退役が裏付く): `#1002` の `.claude/agents/` と adapter template、`#762` の `src/team/run.ts` / `run-policy.ts` / `src/schema/team.ts` / `docs/templates/team/` / `.ut-tdd/teams/`、`#789` の `src/state-db/token-tracker.ts` (退役する契約 PLAN-L7-57 / PLAN-L7-454)、`#1062` と `#1084` 群1 の `claude-memory-wake` / `claude-wake-generation-upgrade` / `provider-handover` / `memory-sync` lint とそのテスト。
- tierB (退役候補だが契約が未凍結。保留に残す): `#575` と `#1084` 群3・11 の plan-admission / plan-asset / `kernel/plan-*` / PLAN 系 lint、`#1083` と `#1084` 群5 の `src/workflow/` / `mode-catalog` / `route-filing` / `docs/process/forward|modes/`、`#1084` 群10 の `src/execution/` と `src/document-disposition/`、`#1084` 群4 の roster。

tierB を保留にとどめるのは、#575 / #1083 / #1084 の退役契約が設計文書へまだ凍結されておらず (各 issue は open)、issue 本文だけでは範囲が確定しないためである (推測で埋めない)。契約が凍結された時点で、該当する tierB を tierA へ移せば、保留から廃止予定へ機械的に上がる。

## 再現手順

リポジトリルートで次を実行する (node 24 で確認、約 5 秒)。

```bash
node docs/governance/candidates/v4-roadmap/migration/issue959-confirmed-machine-pass-20261019.mjs --write
```

- `--write` を省くと JSON を書かず、件数の要約だけを標準出力へ出す。
- 作業ツリーが `7e8d67be7` と異なると PLAN の増減で件数が動く。JSON の `sourceHead` を見る。
- 履歴は `git log --name-status -M --diff-filter=DR` を全期間で読む。shallow clone では R2 の削除確認が欠ける。

## 目視照合 (区分ごとに無作為 5 本、誤判定の修正を含む)

規則を作る途中の照合で誤判定を 3 種類見つけ、ルールを直すか保留へ倒した。以下は直した後の結果である。

### 照合で見つかった誤判定と対処

1. **supersede が errata 型だった (S の偽陽性)**。最初の規則 (双方向 link だけ) では 10 本が supersede済みになった。無作為抽出した PLAN-L7-139 / L7-143 / L7-492 / L7-465 / L7-512 の本文を読むと、いずれも後継が一部の claim や Slice だけを訂正する注記で、旧 PLAN の成果物 (例: `src/lint/merged-plan-status.ts`) は今も生きていた。そこで「訂正注記が部分を示す」「後継が旧 PLAN の成果物を引き取っていない」を保留 (H:supersede-partial) へ倒し、S は 10 本から 1 本 (PLAN-L7-57) になった。
2. **設計文書だけの PLAN を生きていると判定していた**。PLAN-REVERSE-111 は他の PLAN と要求仕様書を生成するだけで、tree に実在していても契約の所在は分からない。実行物を持たない PLAN を H:docs-only へ倒した (L1 が 589 から減った一因)。
3. **退役対象と重なる PLAN を生きていると判定していた**。PLAN-L7-126 / L7-384 は `src/workflow/` (#1083 の対象) を含む。重なりがあるものを H:retire-overlap-* へ倒した。

### supersede済み (1 本中 1 本)

| PLAN | 結果 |
|---|---|
| PLAN-L7-57-token-telemetry-tracker | 正。PLAN-L6-789 が supersedes で指し、本文の訂正注記で双方向。成果物 2 本 (`token-tracker.ts` とそのテスト) を後継が引き取る。ただし後継は draft で、#789 の PR-2 は未実装 |

### 廃止予定 (3 本中 3 本)

| PLAN | 結果 |
|---|---|
| PLAN-L7-162-team-run-policy-extraction | 正。成果物 3 本 (`src/team/run.ts`、`run-policy.ts`、`tests/team-run.test.ts`) がすべて #762 の残置範囲に載っている。ただし #762 は open で、現時点では実在する |
| PLAN-L7-454-runtime-token-telemetry-ingestion | 正。#789 本文が「退役する契約 = PLAN-L7-57 / PLAN-L7-454」と名指しする |
| PLAN-L7-472-claude-memory-async-wake | 正。成果物 `claude-memory-wake.ts` とそのテストが #1062 / #1084 群1 の退役対象 |

### 生きている (5 本中 5 本が妥当、誤判定 0)

| PLAN | 照合 |
|---|---|
| PLAN-L7-519-pack-publication-adapter | `src/setup/pack-publication-adapter.ts` と test が実在。2026-09-18 にも修正されている |
| PLAN-L7-390-typed-spec-phase-layer-alignment-gate | `spec-ir-projections.ts` と `doctor/db-projection.ts` が実在。退役対象との重なりなし |
| PLAN-L7-160-runtime-adapter-policy-extraction | `runtime/adapter.ts` と `adapter-policy.ts` が実在。2026-10-06 にも更新 |
| PLAN-L7-277-skill-recommendation-discrimination | `skill-scoring/scoring.ts`、`skill-engine/recommend.ts` ほかが実在。訂正注記・退役語なし |
| PLAN-L7-84-status-next-action-field | `runtime/detect.ts` が実在 (`cli.ts` は共通ハブ)。訂正注記・退役語なし |

ただし、これは「成果物が tree に実在し、退役の根拠が見つからない」までの確認である。契約が設計文書へ移っていないか (#648 の三者照合) は照合していない。全件に `evidence.tripartiteCheck: "pending"` を付けた。

### 保留 (規則ごとに 1 本、計 5 本が妥当、誤判定 0)

| PLAN | 規則 | 照合 |
|---|---|---|
| PLAN-L4-33-node-control-plane-redesign | H:docs-only | 成果物は `architecture.md` だけ。実在するが契約が設計文書側かは三者照合が要る。保留が妥当 |
| PLAN-L7-514-claude-hook-schema-rolling-upgrade | H:retire-overlap-majority | 3 本中 2 本 (`claude-wake-generation-upgrade.ts` とそのテスト) が #1062 の対象。残り 1 本は fixture。保留が妥当 |
| PLAN-L7-195-model-override-injection-hardening | H:retire-overlap-partial | 6 本中 2 本 (`schema/team.ts`、`team-schema.test.ts`) が #762 の対象、4 本は存続。保留が妥当 |
| PLAN-L7-490-memory-write-collision-safety | H:self-only | `generates` が PLAN 自身だけ。実装の所在は本文を読まないと分からない。保留が妥当 |
| PLAN-L7-143-harness-db-warn-remediation | H:supersede-partial | PLAN-L7-144 が「full projection-gate parity に訂正」した。成果物 19 本は生きている。保留が妥当 |

保留 340 本のうち、上記以外の抽出でも、規則どおり (実在はするが決め手がない) であることを確認した。ただし 340 本の全件を目で読んだわけではない。

## 既知の限界

- **「生きている」は弱い主張である**。成果物が tree に実在し、退役対象に当たらないことしか見ていない。契約が設計文書へ移っているか、機能が使われているかは見ていない。335 本の全件で三者照合 (#648) が残る。
- **R2 (成果物がすべて削除済み) は 0 件**。全 confirmed PLAN の成果物 2,811 件が tree に実在した。`plan-artifact-existence` の doctor ゲートが実在を要求している影響と考えられる。「生成物が無い」を廃止の根拠にする経路は、confirmed では使えない。
- **`supersedes` が errata に使われている**。frontmatter に `supersedes` を持つ PLAN は 17 本で、双方向 link を持つ非自己の edge のうち全面 supersede と読めたのは 1 本だった。#959 本文の「supersede 済み」という区分は、errata を含まない狭い意味で運用する必要がある。
- **tierB の退役契約は未凍結**。#575 / #1083 / #1084 は open で、範囲は issue 本文だけでは確定しない。凍結後に `RETIRE_SETS` を更新して再実行する。
- **退役対象は path で判定する**。モジュールの一部だけが退役する場合 (例: `projection-writer.ts` の token 行、`cli.ts` の `team` command) は、ファイル単位では判定できない。共通ハブは判定から外している。
- **部分 supersede の検出は文字列で行う**。訂正注記の行に「一部 / だけ / のみ / only / partial」を含むかを見るだけで、`only` は単語境界を見ない部分一致である (保留側に倒れる方向の誤差)。
- **`generates` の宣言が正しい前提**。宣言が実際の成果物と違う PLAN は検出できない。
- **対象は confirmed だけ**。draft 300、completed 26、archived 3 は判定していない。
- **REVERSE の backfill PLAN (133 本) は 12 本だけが生きている、1 本が退役候補、残りは保留**。器の扱い (MIG-14) は別途決まる。
