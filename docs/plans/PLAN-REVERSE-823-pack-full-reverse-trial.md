---
plan_id: PLAN-REVERSE-823-pack-full-reverse-trial
title: "PLAN-REVERSE-823: Pack 全量の blind Reverse 試行 (Reverse 性能測定と設計・実装ずれの洗い出し)"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: code
route_signal: reverse
route_mode: reverse
created: 2026-10-05
updated: 2026-10-05
owner: Claude control lane
agent_slots:
  - role: tl
    slot_label: Claude Opus (claude-opus-5) - R2 統合パス (import graph と CLI
      入口からの全体構造復元) と R4 routing 判定
  - role: qa
    slot_label: Codex Sol (gpt-6.1-sol) - 照合・採点役。docs/design を読める唯一の役。atomic claim
      抽出、hit / miss / misread / fabrication / undocumented 判定、drift 3 分類の候補付け
  - role: po
    slot_label: PO - R3 intent 仮説と採点サマリの検証 (reverse mode §5 で R3 必須)
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-823-pack-full-reverse-trial.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/process/modes/reverse.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/822
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/823
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/825
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/575
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/588
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 823
admission_receipt:
  schema_version: v2
  receipt_id: certificate:510ad564c781ca364359d949cb20d299
  command_id: plan-draft:issue-823:pack-full-reverse-trial:1
  admitted_at: 2026-10-05T03:27:53.018Z
  source_digest: sha256:6b369e292782023de8726a178ae304b229a9d97757603630fe2eb8d16246bfc7
  decision_digest: sha256:74b3261bc444e52e0e5cb78884aa6c0d55ff473f30b4aca3d9e100ea351cb483
  receipt_digest: sha256:087279d3ef8a742b970f50d4c46654c37eba12163c89e438517bd8df581837f9
  binding:
    path: docs/plans/PLAN-REVERSE-823-pack-full-reverse-trial.md
    plan_id: PLAN-REVERSE-823-pack-full-reverse-trial
    asset_id: plan:510ad564c781ca364359d949cb20d299
    revision: 1
    content_digest: sha256:6b369e292782023de8726a178ae304b229a9d97757603630fe2eb8d16246bfc7
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 823
    episode_id: E4-823-pack-full-reverse-trial
    projection_state: unprojected
  origin:
    plan_id: PLAN-REVERSE-01-process-docs
    revision: 1
    digest: sha256:cce1b2eaec13527eaf5d4286c757b1bbc195f20a6d13a75757ae6deee2e1dd0a
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-REVERSE-823-pack-full-reverse-trial
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue 823 (親 822): V 字右腕の最初の実測として、Pack 全量 (994 ファイル) を Pack
    だけを見る executor で R0-R4 フルに逆引きし、Reverse の性能 (読み落とし・誤認・作話) と設計・実装のずれを typed
    record で測る。Reverse mode の正本 (PLAN-REVERSE-01 で正本化した
    docs/process/modes/reverse.md) に従う。実装は変えず、ずれは別チケットへ回す"
---

# PLAN-REVERSE-823: Pack 全量の blind Reverse 試行

## §0 位置づけ

#822 (構想 v4 候補: V 字の右腕を Reverse とリファクタリングによる証拠固めの定常工程にする) の最初の実測。
`reverse_type: code` を R0→R1→R2→R3→R4 のフル工程で回す。狙いは次の 2 つ。

1. Reverse の性能を測る (読み落とし・誤認・作話)。
2. 設計と実装のずれを洗い出す。

PO 判断 (2026-10-05、拘束):

- Reverse の担当 (executor) が見るのは Pack だけ。`docs/design/` と PLAN は見せない。
- 対象は Pack 全量。サブシステム間の契約と全体の設計方針は、全量を読まないと現れないため。

採点結果は、将来のチケット record・証拠 record (#575 管理知能、#588 R03) の雛形となる typed JSON で残す。
本 PLAN はコードを変更しない (§D8)。`forward_routing` / `promotion_strategy` は R4 到達時に記入する
(R0 draft では schema 上任意。`src/schema/frontmatter.ts` の kind=reverse + R4 必須則)。

## §1 規模 (HEAD `6b5effbc` 実測)

| 対象 | ファイル数 | 行数 | 根拠コマンド |
|---|---|---|---|
| Pack 全体 | 994 | — | `node src/cli.ts distribution plan --json` の `export.artifactPaths` を計数 |
| うち `src/` (`src/web/` を除く) | 442 | 約 124.6k | `git ls-files src` (`src/web/` は `.gitkeep` 1 件で、deny prefix により除外) |
| うち `tests/` | 346 | 約 114.3k | `git ls-files tests` |
| うち docs/governance・process・reference・templates・skills・scripts・ルート設定 | 206 | — | 同 `artifactPaths` の内訳 |
| 照合先 `docs/design/harness/` (executor には非開示) | 61 md | 約 14.8k | `git ls-files docs/design` |

Pack の包含規則は `src/setup/distribution.ts` の `CLEAN_ALLOW_*` / `CLEAN_DENY_*` を正とする。
deny 側に `docs/plans/`、`docs/design/harness/`、`docs/test-design/`、`.ut-tdd/` が入っている。
allow 側に concept v3.1 と requirements v1.2 (`docs/governance/`)、`docs/process/` が入っている。

**既知の漏れ (blind の限界)**: Pack 内のコードとテストのコメントは design / PLAN を参照している。
PLAN ID の引用は 319 ファイル・2148 箇所、`docs/design/` への言及は 73 ファイル
(`git ls-files src tests | xargs grep -l "PLAN-L[0-9]"` / `grep -l "docs/design/"`)。
これは Pack 自体の性質なので消さない。代わりに §D5 で根拠の種別を記録し、指標を分けて出す。

## §2 設計判断

### D1 blind の担保 (隔離と証明)

| 案 | 内容 | trade-off |
|---|---|---|
| **A (採択)** | repo の外に作業場所 `C:/dev/ut-reverse-823-<run_id>/` を作る。その下の `pack/` に、固定した source commit から `ut-tdd distribution sync-pack --repo-dir` で clean Pack を出す。executor はここを cwd とし、正規 wrapper の**隔離実行 profile** (前提 PR、§D1 末尾) で起動する。各セッションの生 transcript にある全 tool_use と、対応する tool_result を機械で監査する | 隔離を起動時に強制し、証明も機械で取れる。前提 PR (wrapper の拡張) が 1 本要る |
| B | source repo の中で、指示だけで「docs/design を読むな」と縛る | 安いが、source の `CLAUDE.md` が自動で読み込まれ、誤読も防げない。証明にならない |
| C | 公開済み Pack repo (canary.3) の clone を使う | 配布物そのもので測れる。ただし照合先 (oracle) の commit が canary.3 の受入進行に引きずられる |

採択 A の詳細:

- **固定点**: R0 着手時の main の HEAD を source commit `S` とし、Pack を `S` から生成する。照合先は `S` 時点の `docs/design/` を使う
  (同じ snapshot の設計と実装を突き合わせる)。公開済み canary の source に合わせない理由は、照合先の設計書を最新にしたいためである。
- **inventory と digest**: Pack checkout から `.git/`・`.ut-tdd/`・`.ut-tdd-pack-sync-manifest.json` を除いた全ファイルを並べる。
  各行を `<posix path>\t<sha256(bytes)>\n` とし、path 昇順に連結した全体の sha256 を `inventory_digest` とする。
  `distribution plan --json` の `artifactPaths` と集合一致することを run 開始前に確かめる。
- **executor に許す tool**: `Read` / `Grep` / `Glob` と、`out/<shard_id>/` への `Write` だけ。
  `Bash` / `WebFetch` / `WebSearch` / MCP / `Agent` の使用は、その shard の run を無効とする。
  GitHub 上の source repo は web 経由で読めてしまうため、web 系 tool も漏れの経路として扱う。
- **監査規則**: Read / Grep / Glob の対象 path を正規化する。`pack/` の外を指す path、
  `docs/design`・`docs/plans`・`docs/test-design` を含む path、`C:/dev/UT-TDD-agent-harness` 配下の path が
  1 件でもあれば、その shard の run は無効。コメントや文字列に path が現れるのは違反ではない
  (判定対象は tool の入力 path だけ)。
- **起動経路と前提 PR**: 正規 wrapper (`ut-tdd claude`) は呼出元の cwd を子プロセスへ継承するので、`pack/` を cwd にした起動自体は
  今のままでできる (`src/cli/delegation.ts:184` / `:212`、`src/feedback/repository-root.ts:32`)。ただし wrapper には tool を閉じる
  汎用オプションが無く (`src/cli/delegation.ts:307`。既存の `--allowedTools` は review verdict 用の `Edit(path)` 追加に限る、`:491`)、
  Claude 自身の user 設定・memory・hooks・plugins が混ざらないことも証明できない。そこで、wrapper に**隔離実行 profile** を足す
  前提 PR を先に通す (Issue #825・別 PLAN、本 PLAN の外部依存)。profile が行うのは次の 4 点だけとする。
  1. Claude Code に `--tools Read,Grep,Glob,Write`、`--strict-mcp-config` (MCP なし)、`--safe-mode` 相当の customization 無効化、
     固有の `--session-id <uuid>`、`--output-format stream-json` を渡す (いずれも 2.1.284 の `--help` で実在を確認)。
     Claude Code の版は固定せず、run ごとに `--version` を `run-manifest.json` に記録する。
  2. path guard: Read / Grep / Glob の対象を実体 path (junction・symlink を解決した後) で凍結 Pack の中に、Write を `out/<shard_id>/` に限る。
     path を省略した Grep / Glob は cwd (= `pack/`) を対象とみなして許す。
  3. provider の session UUID・cwd・argv・設定の digest を、生 transcript の path と結び付けて記録する。transcript の欠損・未知の形式は fail-close。
  4. 上記を満たさない起動を拒否する (profile を指定したのに条件が揃わなければ実行しない)。
  生 transcript の既定の置き場は `~/.claude/projects/<cwd-slug>/<session-uuid>.jsonl` で (`src/cli.ts:2015`、`src/state-db/token-tracker.ts:358`)、
  `assistant.message.content[].tool_use.input` と対応する `tool_result` を持つ。harness の session log は path の要約だけで
  offset / limit を残さず fail-open なので (`src/runtime/session-log.ts:119` / `:429`)、監査には使わない。
- **起動時の生成物**: wrapper は SessionStart で skill assets を materialize する (`src/cli.ts:531`)。inventory は起動前に凍結し、
  起動後に増えたファイル (`.ut-tdd/` 配下と `out/`) は読取対象にも網羅の分母にも入れない。
### D2 全量網羅 (shard 分割と R0 網羅率)

| 案 | 内容 | trade-off |
|---|---|---|
| **A (採択)** | `src/<top>` 単位に分け、テストは import で src に対応づけ、行数の上限で分割・統合する | 凝集が高く、決定的に再現できる |
| B | 行数だけで機械的に等分する | 均等だが、サブシステムが分断されて R2 の復元が劣化する |
| C | サブシステムごとに 1 shard | 実行時の `src/lint` は約 27.3k 行と大きすぎ、コンテキストを超える |

shard 規則 (決定的。run 開始前に `shard_plan_digest` として凍結する):

1. 単位は `src/<top>/`。`src/` 直下のファイルは `src/_root` に入れる。
2. テストはそれぞれ、静的 import で最も多く参照している `src/<top>` の shard に入れる。同数なら path 昇順で先頭。
   src を import しないテストは `tests-misc` に入れる。
3. 上限は 1 shard あたり src+tests で 20,000 行。超える単位はまず 2 段目の subdir で割り、それでも超えれば
   path 昇順に連続した塊で割る。上限未満の単位は名前順に貪欲に統合する。
4. src/tests 以外の 206 ファイルは `pack-docs` shard に入れ、同じ上限で分割する。
5. 見込みは約 13〜15 shard (src+tests 約 239k 行 ÷ 2 万行 + docs)。

R0 網羅率の定義: ファイル f が「読まれた」とは、f に対する Read の tool_use のうち、対応する tool_result が成功し、
その tool_result が**実際に返した行範囲**の和集合が f の全行を覆うこと。tool_use の offset / limit は要求範囲にすぎないので数えない。
失敗・切り詰め (truncated 表示や省略記号) を含む tool_result は、その範囲を読了に数えない。Grep / Glob の hit も数えない。
空ファイルは、成功した Read が 1 回あれば読了とする。テキストでないファイル (画像など) は inventory に載せたうえで分母から外し、
件数を `run-manifest.json` に記録する。網羅率 = 読了ファイル数 ÷ 分母の件数で、100% が合格。監査ログと inventory を突き合わせて機械で算出する。
監査スクリプトは本番の前に、外部の絶対 path・junction 経由の読取・禁止 tool・読取失敗・切り詰め・transcript 欠損を仕込んだ合成 transcript で、
それぞれを検出できることを確かめる。

### D3 工程 (R0〜R4 と統合パス)

| phase | 担当 | 入力 | 出力 (`out/<shard_id>/`、統合は `out/_system/`) |
|---|---|---|---|
| R0 | executor (shard ごと) | shard のファイル一覧 | `r0-evidence.json`: ファイルごとの役割一文、`has_existing_tests`、対応するテストの一覧 |
| R1 | executor | 同上 | `claims.jsonl` (phase=R1): CLI コマンドとオプション、export された型、DB のテーブルと列、ファイル形式、環境変数、終了コードとエラーコード |
| R2 | executor | 同上 | `claims.jsonl` (phase=R2): 振る舞い・不変条件・shard 内の構造。`as-is.md` (as-is 設計) と `as-is-test.md` (as-is テスト設計、reverse mode §2.1) |
| R2 統合 | Opus (tl) | 全 shard の出力、Pack の import graph (作業場所のスクリプトが Pack だけから機械抽出)、CLI 入口 (`src/cli.ts`、`src/cli/`) | `system-claims.jsonl`: サブシステム間の契約、層と依存の方向、全体方針。`system-as-is.md` |
| R3a | Opus (tl) | R2 の出力 | `intent-hypotheses.jsonl`: なぜその構造なのかの仮説。blind のまま作る |
| R3b | Codex Sol (qa) | 照合先 docs/design、Pack、R1〜R3a の出力 | `findings.jsonl` (§D6)、`metrics.json` |
| R3 検証 | PO | `intent-hypotheses` と採点サマリ | 採否の記録 (本 PLAN の R3 節) |
| R4 | Opus (tl) | `findings.jsonl` | drift ごとの routing 先 (設計改訂 / 修正チケット / gap-only)。`missing_pair_artifacts` |

統合パスを工程の中心に置く。shard 単体では見えないサブシステム間の契約と全体方針の復元率を、system 階層の指標として別に出す (§D5)。
executor はテストを実行しない (静的な読み取りだけ)。Pack 内には docs/design を読むテストがあり、Pack では前提が欠けるため。

### D4 役割と族分離

- executor = Claude Sonnet (`claude-sonnet-5`、worker tier、shard ごとに独立したセッション)。
- 統合・R3a・R4 = Claude Opus (`claude-opus-5`、`ut-tdd claude --role tl`)。統合役も docs/design を読まず、§D1 の監査対象に入れる。
- 照合・採点 = Codex Sol (`gpt-6.1-sol`、`ut-tdd codex --role qa`)。docs/design と PLAN を読めるのはこの役だけ。PO 判断の「Pack だけ」は
  executor の制約であり、照合役は正解を知る側なので PLAN も読んでよい (drift の design_stale / impl_drift の判定に使う)。
- 復元側 (Claude) と採点側 (Codex) を別の族にする。利用上限で止まっても、別の族への代替はしない。止まったら待つ
  (代替すると族分離が崩れて採点が無効になる)。
- 裁定規則: 採点は Sol の 1 回目を一次判定とする。そのうち confidence=low のもの、および drift=design_stale / impl_drift の全件を、
  Sol の別セッションが盲検で再判定する (一次判定は伏せる)。両者が一致しなければ `unresolved` として R4 の tl 判定へ回す。

### D5 採点

**atomic claim の粒度**: 主語 1 つと述語 1 つからなり、真偽をコードで確かめられる命題を 1 claim とする。
例:「コマンド X はオプション Y を持つ」「テーブル T は列 C を持つ」「関数 F は条件 Z で E を返して拒否する」「モジュール A は B に依存しない」。
規範文 (MUST・禁止・fail-close) と構造の記述を対象にする。理由・経緯・例示・将来予定は対象外。
claim には `subject.kind` ∈ {cli, type, db, file_format, env, behavior, structure, policy} を付ける。
Sol は 61 本から claim を抽出し、`path:line` を付けて `oracle-claims.jsonl` に凍結する。
採点はこの凍結の後に始める (凍結後に照合先を足さない)。

照合先の範囲: `docs/design/harness/` の 61 本。ただし対応する実装が Pack に無い claim
(`src/web/` 前提の L2-screen / L10-ux など) は `out_of_pack_scope` とし、recall の分母から外す。
`L3-functional/roadmap.md` は検証計画の文書なので、claim 抽出の対象から外す。

**判定**:

| 状況 | score | drift |
|---|---|---|
| 復元 claim が照合先 claim と同義 | hit | なし。ただしコードと矛盾していれば design_stale / impl_drift |
| 照合先 claim がコードで成立し、復元されていない | miss | なし (Reverse の性能の問題) |
| 照合先 claim がコードと矛盾する、またはコードに無い | — (recall の分母外) | design_stale または impl_drift (候補)。どちらか判断できなければ unresolved |
| 復元 claim の主語は実在するが、内容がコードと矛盾 | misread | なし |
| 復元 claim の主語が Pack に実在しない | fabrication | なし |
| 復元 claim がコードで成立し、照合先に無い | undocumented_true | undocumented |

design_stale と impl_drift の判定目安: Pack のテストがコードの挙動を assert していれば design_stale の候補、
照合先 claim を裏づける PLAN の判断がコードより新しければ impl_drift の候補。最終判断は R4。

**指標** (shard ごと、system 階層、全体):

- recall = hit ÷ (コードで成立する照合先 claim)
- precision = (hit + undocumented_true) ÷ 復元 claim
- misread 率と fabrication 率 = それぞれ ÷ 復元 claim
- 上記すべてを、全体の値と、根拠が code/test だけの claim に絞った値の 2 本立てで出す (§1 の既知の漏れ対策)

shard への帰属は、claim の主語がコード上どこにあるかで決める。構造・方針の claim は system 階層に帰属させる。

### D6 出力 record (チケット・証拠 record の雛形)

1 行 1 件の `findings.jsonl`。schema 名は `reverse-finding/v0`。

| field | 型 | 内容 |
|---|---|---|
| `schema_version` | `"reverse-finding/v0"` | |
| `finding_id` | string | `sha256(run_id + oracle_claim_id + restored_claim_id)` の先頭 16 hex |
| `run_id` | string | `R823-<yyyymmdd>-<seq>` |
| `inventory_digest` | `sha256:...` | §D1 |
| `source_commit` | string | 固定点 S (Pack と照合先の共通の起点) |
| `shard_id` | string \| `"_system"` | |
| `phase` | `R1` \| `R2` \| `R2-integration` \| `R3` | |
| `subject` | `{kind, name}` | kind は §D5 の列挙 |
| `oracle_claim` | `{claim_id, path, line, text, text_digest}` \| null | |
| `restored_claim` | `{claim_id, text, evidence: [{path, line_start, line_end, evidence_kind}]}` \| null | evidence_kind ∈ {code, test, comment, pack_doc} |
| `score` | `hit` \| `miss` \| `misread` \| `fabrication` \| `undocumented_true` \| `out_of_pack_scope` | |
| `drift` | `none` \| `design_stale` \| `impl_drift` \| `undocumented` \| `unresolved` | |
| `confidence` | `high` \| `medium` \| `low` | |
| `executor` / `adjudicator` | `{family, model, session_ref}` | 族分離を機械で照合するため |
| `routing_candidate` | `{target: design_revision\|fix_ticket\|gap_only\|none, forward_routing: L1\|L3\|L4\|L5\|gap-only\|null, target_path}` | |
| `status` | `open` \| `routed` \| `closed` | チケットの雛形としての状態 |
| `created_at` | ISO8601 | |

run 単位の `run-manifest.json` には次を入れる: run_id、source_commit、inventory_digest、shard_plan_digest、
shard 一覧、監査結果 (shard ごとの valid / invalid と違反 tool_use)、R0 網羅率、token の使用実績、`metrics.json` の digest、
作業スクリプトの sha256、`findings.jsonl` の sha256。

**置き場**:

| 案 | 内容 | trade-off |
|---|---|---|
| **A (採択)** | 生データ (transcript・監査の生ログ・shard 出力) は repo 外の作業場所に置き、digest だけを記録する。typed record (`findings.jsonl`、`run-manifest.json`) は結果 PR で `.ut-tdd/reverse/<run_id>/` に commit し、そのとき `generates` に宣言する | 機械が読める証拠が git に残り、将来 Assurance Kernel が検証する対象になる。transcript は大きく、内容を含むので repo に入れない |
| B | すべて repo 外に置き、本 PLAN にはサマリだけ書く | 追跡対象が増えない。ただし typed record が失われ、#822 の雛形として使えない |
| C | すべてを `.ut-tdd/reverse/` に置く | 再現性は最大。ただし `.ut-tdd/reverse/` は gitignore 対象外 (`git check-ignore` で確認済み) なので、未追跡の雑音が大量に出る |

routing したずれは、チケット (Issue) の本文に該当 record の JSON を埋め込む。

### D7 予算と停止条件

- **見込み**: 読み取り約 3M token (約 239k 行) + 出力と往復の分で、executor 合計約 6M。統合と R3a で約 1M。照合で約 3M。
- **上限**: shard ごとに入力 1.2M token を超えたら、その shard を打ち切って再分割する。run 全体は 12M token で打ち切る。
- **blind 違反**: 違反した shard を無効にし、新しいセッションで 1 回だけやり直す。同じ shard で 2 回違反するか、
  統合役が違反したら、run 全体を中止する。
- **網羅不足**: R0 網羅率が 100% に届かなければ、未読ファイルだけを 1 回追加で読ませる。それでも届かなければ
  run を `incomplete` とし、全量の指標としては公表しない。
- **利用上限**: 停止して待つ。別の族への代替はしない (§D4)。

### D8 非目標

- 本 PLAN ではコードを変更しない。`src/`・`tests/`・gitignore・配布コードには触れない。wrapper の隔離実行 profile (§D1) は
  別 Issue・別 PLAN の前提 PR で入れ、本 PLAN はその merge を R0 着手の条件として参照する。
- 監査・網羅・schema 検証のスクリプトは作業場所に置く使い捨てとし、sha256 を manifest に記録する。
  試行が採用されたら、src への機械化は別チケットへ回す (#822 の採否に従う)。
- 見つかったずれは、別のチケット / PLAN (設計改訂または Forward の修正) へ回す。本 PLAN の中では直さない。
- harness.db へは直接書き込まない。Reverse mode のステージ記録は既存コマンドの経路だけを使う。

### D9 時期

canary.3 の受入 (Codex の本線) と並行して進める。作業場所に `distribution sync-pack` を出力させるだけで、
distribution / setup のコードには触れない。固定点 S を一度決めたら、run の途中で動かさない。

### D10 advisor 記録 (2026-10-05)

`ut-tdd advisor --decision implementation --execute` (Codex Sol `gpt-6.1-sol`) に、実行方式の 3 点 (Pack を cwd にした起動・生 transcript の所在・tool 制限) を相談した。

- 生き残った判断: wrapper は cwd を継承するので Pack を cwd にした起動はできる。生 transcript は tool_use と tool_result を持つ。
- 反証された判断: 「wrapper を変えずに盲検と 100% 網羅を証明できる」。tool を閉じる手段が wrapper に無く、user 設定などの混入も否定できない。tool_use の offset / limit は読了の証拠にならない。
- 採択: wrapper の隔離実行 profile を前提 PR とし (§D1)、網羅は成功した tool_result の実返却範囲で数える (§D2)。
- 実測で直した点: advisor は Claude Code 2.1.281 の固定を推奨したが、この環境の実測は 2.1.284 で版は動く。版は固定せず run ごとに記録する。各 option (`--tools` / `--safe-mode` / `--strict-mcp-config` / `--session-id` / `--setting-sources` / `--output-format stream-json`) の実在は 2.1.284 の `--help` で確認した。

## §3 受け入れ条件

| AC | 内容 | 検証 |
|---|---|---|
| AC1 | 本 PLAN が lint を通り、非著者 (Codex Sol) の review を受ける | `ut-tdd plan lint`、`review_evidence` の cross_agent 記録 |
| AC1b | 隔離実行 profile の前提 PR が merge 済みで、本番前の合成 transcript 試験で監査スクリプトが仕込んだ違反を全て検出する | 前提 PR の merge commit、合成 transcript 試験の出力 |
| AC2 | inventory が `distribution plan --json` の `artifactPaths` (固定点 S) と集合一致し、`inventory_digest` が manifest に記録される | 作業場所の inventory スクリプト + `node src/cli.ts distribution plan --json --tag <S>` |
| AC3 | 全 executor と統合のセッションで blind 違反が 0 件 | transcript 監査スクリプトの出力 (`run-manifest.json` の audit 欄) |
| AC4 | R0 網羅率が 100% (S 時点の inventory 件数。HEAD `6b5effbc` では 994 件) | 監査ログ × inventory の網羅スクリプト |
| AC5 | `findings.jsonl` の全行が `reverse-finding/v0` に適合し、executor と adjudicator の family が異なる | schema 検証スクリプト (作業場所、sha256 記録) |
| AC6 | `metrics.json` に recall / precision / misread 率 / fabrication 率を shard・system・全体の 3 階層 × (全体 / code・test 根拠のみ) で出す | `metrics.json` の目視 + digest 照合 |
| AC7 | R3 の intent 仮説と採点サマリを PO が検証し、本 PLAN の R3 節に記録する | PLAN 本文 |
| AC8 | drift (design_stale / impl_drift / undocumented / unresolved) の全件に routing 先があり、Issue または PLAN の参照が付く | `findings.jsonl` で `status != open` を集計 |
| AC9 | 結果 PR で `.ut-tdd/reverse/<run_id>/{findings.jsonl,run-manifest.json}` を `generates` に宣言し、`forward_routing` / `promotion_strategy` を記入して R4 で閉じる | `ut-tdd plan lint` / doctor |

## R0〜R4 記録 (実行後に記入)

- R0: (未着手)
- R1: (未着手)
- R2: (未着手)
- R3: (未着手、PO 検証必須)
- R4: (未着手)
