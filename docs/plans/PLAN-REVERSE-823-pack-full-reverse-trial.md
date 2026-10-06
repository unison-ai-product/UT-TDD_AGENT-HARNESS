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
updated: 2026-10-06
owner: Claude control lane
agent_slots:
  - role: tl
    slot_label: Claude Opus (claude-opus-5、作業場所の標準サブエージェント reverse-integrator) - R2
      統合パス (import graph と CLI 入口からの全体構造復元) と R4 routing 判定
  - role: qa
    slot_label: Codex Sol (gpt-6.1-sol、Codex 側の標準サブエージェント) - 照合・採点役。docs/design
      を読める唯一の役。atomic claim 抽出、hit / miss / misread / fabrication / undocumented
      判定、drift 3 分類の候補付け
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
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/619
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/575
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/588
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 823
admission_receipt:
  schema_version: v2
  receipt_id: certificate:69f9fbef76ab2bb90d6fc97ab6d80789
  command_id: plan-revise:issue-823:exec-method:sol-r1-fix:r5:021de9d4e5d2
  admitted_at: 2026-10-06T03:43:44.121Z
  source_digest: sha256:9dd1d6dee1e532e812578ea02309019d8c0661a3b47d59207d57981c8262489c
  decision_digest: sha256:61979faf705a5ab403a343f042f502c04ec4fdf079e4749d8141d91d3183d39c
  receipt_digest: sha256:becc99530ad443bf33d2826bf9453ecc026dbe66fee89992e47cb3033ea21f92
  binding:
    path: docs/plans/PLAN-REVERSE-823-pack-full-reverse-trial.md
    plan_id: PLAN-REVERSE-823-pack-full-reverse-trial
    asset_id: plan:17005d81c24cbdca71cced133ed6d123
    revision: 5
    content_digest: sha256:9dd1d6dee1e532e812578ea02309019d8c0661a3b47d59207d57981c8262489c
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
    target_revision: 5
    phase: forward_merge
  escape_reason: "Issue 823: PR #850 Sol r1 FLAG の是正。§D1 の監査規則に Grep / Glob の
    pattern による探索範囲の逸脱 (.. segment・絶対 pattern・展開) と、tool_result が返した全 file path
    の allowlist 照合を追加し fail-close とする。run 開始時の link 不在確認、合成試験の逸脱ケース、未検証の探索範囲を
    unverifiable_residual に明記する。方式は変えない"
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

**改訂 (rev 4、2026-10-06)**: rev 3 までは、正規 wrapper `ut-tdd claude` に隔離実行 profile を足す前提 PR (#825) を
起動時の強制と証明の手段にしていた。PO 方針 (#619 の方針メモ、2026-10-05) により #825 は着手しない
(ハーネス独自の headless サブエージェント経路は延命しない)。本 rev では、実行方式を**各プロバイダーの標準サブエージェントの
起動制約**と **GUI 側の作業場所の隔離**に置き換え、強制できない部分は**事後の transcript 監査で判定し、残余リスクとして記録する**。
監査結果の承認は #619 の attestation 経路 (canonical request・exact HEAD・verdict・receipt) で行う (§D1 末尾)。
盲検は起動時に**完全には強制できない**。本 PLAN はこれを隠さず、強制できる層・事後に検出する層・検出もできない層を分けて記録する。

| 案 | 内容 | trade-off |
|---|---|---|
| **A' (採択、rev 4)** | repo の外に作業場所 `C:/dev/ut-reverse-823-<run_id>/` を作り、その下の `pack/` に固定 commit から clean Pack を出す。作業場所の root を cwd にした GUI の Claude Code セッション (operator セッション) から、作業場所に置いた標準サブエージェント定義で executor・統合役を起動する。tool の集合はサブエージェント定義で閉じ、path と混入は全 transcript の機械監査で判定する | wrapper の改修が要らない。path の制限は起動時に強制できず、違反は事後検出 + その shard の無効化で扱う (盲検は部分的な強制) |
| A (rev 3、撤回) | 作業場所は同じ。正規 wrapper の隔離実行 profile (#825) で tool・path・設定混入を起動時に強制する | 起動時の強制が最も強い。#825 を作らない方針と矛盾するため撤回 |
| B | source repo の中で、指示だけで「docs/design を読むな」と縛る | 安いが、source の `CLAUDE.md` が自動で読み込まれ、誤読も防げない。証明にならない |
| C | 公開済み Pack repo (canary.3) の clone を使う | 配布物そのもので測れる。ただし照合先 (oracle) の commit が canary.3 の受入進行に引きずられる |

採択 A' の詳細:

- **固定点**: R0 着手時の main の HEAD を source commit `S` とし、Pack を `S` から生成する。照合先は `S` 時点の `docs/design/` を使う
  (同じ snapshot の設計と実装を突き合わせる)。公開済み canary の source に合わせない理由は、照合先の設計書を最新にしたいためである。
- **inventory と digest**: Pack checkout から `.git/`・`.ut-tdd/`・`.ut-tdd-pack-sync-manifest.json` を除いた全ファイルを並べる。
  各行を `<posix path>\t<sha256(bytes)>\n` とし、path 昇順に連結した全体の sha256 を `inventory_digest` とする。
  `distribution plan --json` の `artifactPaths` と集合一致することを run 開始前に確かめる。
- **作業場所の構成**: `pack/` (凍結 Pack)、`frozen/` (§D3 の凍結入力)、`out/` (各セッションの出力)、`.claude/` (作業場所の
  Claude Code 設定)。Pack には `.claude/` と `CLAUDE.md` が含まれない (`src/setup/distribution.ts:148-185` の `CLEAN_ALLOW_*` に
  無い) ので、作業場所の `.claude/` は作業スクリプトが置くものだけになる。source repo の `.claude/settings.json` の hook
  (agent-guard・work-guard・SessionStart など) は作業場所では動かない。
- **起動経路 (標準サブエージェント)**: operator セッションは作業場所の root を cwd とする GUI の Claude Code セッションとする。
  executor と統合役は、作業場所の `.claude/agents/` に置く 2 つの定義で起動する。
  | 定義 | frontmatter | 用途 |
  |---|---|---|
  | `reverse-executor` | `tools: Read, Grep, Glob, Write`、`model: claude-sonnet-5`、`maxTurns` を run 前に固定 | R0〜R2 の shard ごとの executor |
  | `reverse-integrator` | `tools: Read, Grep, Glob, Write`、`model: claude-opus-5`、`maxTurns` を run 前に固定 | R2 統合・R3a・R4 |
  どちらも `Bash` / `WebFetch` / `WebSearch` / MCP / `Agent` を tool に含めない。各サブエージェントへの指示文は、作業スクリプトが
  shard 一覧と固定の雛形から生成し、その sha256 を `run-manifest.json` に記録する (operator セッションが手で書き足さない)。
  2 つの定義ファイルと作業場所の `.claude/settings.json` の sha256 も `run-manifest.json` に記録する。
- **executor に許す tool**: `Read` / `Grep` / `Glob` と、`out/<shard_id>/` への `Write` だけ。
  `Bash` / `WebFetch` / `WebSearch` / MCP / `Agent` の使用は、その shard の run を無効とする。
  GitHub 上の source repo は web 経由で読めてしまうため、web 系 tool も漏れの経路として扱う。
- **監査規則**: Read / Grep / Glob の対象 path を実体 path に正規化し、そのセッションの役の**読取 allowlist** と照合する。
  allowlist の外を指す path が 1 件でもあれば、そのセッションの run は無効。役ごとの読取 allowlist は次の閉じた集合とする
  (path は作業場所 root からの相対)。
  | 役 | 読取 allowlist |
  |---|---|
  | executor (R0〜R2) | `pack/` |
  | 統合役 (R2 統合) | `pack/`、`frozen/shards/`、`frozen/import-graph.json` |
  | R3a | 統合役の allowlist + `frozen/system/` |
  | R4 | R3a の allowlist + `frozen/scoring/` |
  どの役でも、`docs/design`・`docs/plans`・`docs/test-design` を含む path と `C:/dev/UT-TDD-agent-harness` 配下の path は
  allowlist に入らない。cwd は作業場所の root なので、path を省略した Grep / Glob は `out/`・`.claude/` を含んでしまう。
  よって **path を省略した Grep / Glob は違反**とする (rev 3 の「cwd = `pack/` とみなして許す」は撤回)。
  **Grep / Glob の探索範囲 (rev 5)**: 入力の path だけでなく、pattern (Glob の `pattern`、Grep の `glob`) が指す範囲も監査する。
  実効の探索範囲は `resolve(path, pattern の固定部分)` とし、これが読取 allowlist の外に出れば違反とする。具体的には、(1) pattern に
  `..` の segment を含む、(2) pattern が絶対 path (ドライブ文字・`/`・`\` で始まる) で allowlist の外を指す、(3) `~` や環境変数の展開を含む、
  のいずれかを違反とする。さらに pattern の形に依らず、**tool_result が返した全ての file path** (Glob の一覧、Grep の
  `files_with_matches` / `content` / `count` の各行の path) を実体 path に正規化し、読取 allowlist の外のものが 1 件でもあれば違反とする
  (pattern の解釈が監査スクリプトとずれても、返却側で逸脱を捕まえる)。返却の path を解析できない tool_result は違反とみなす (fail-close)。
  run 開始時に、作業場所の配下 (`pack/`・`frozen/`) に symlink・junction が 1 件も無いことを確かめて manifest に記録する。
  許可する tool (Read / Grep / Glob / Write) では link を作れないので、run 中に増えることはない。
  Write は、そのセッションの出力先 (`out/<shard_id>/`、統合役は `out/_system/`) の外を指せば違反とする。
  さらに、サブエージェント transcript の user message のうち、最初の指示文 (sha256 が manifest の記録と一致すること) と
  tool_result 以外のもの (operator セッションからの追加の指示) があれば違反とする。
  コメントや文字列に path が現れるのは違反ではない (判定対象は tool の入力 path と、サブエージェントへの入力だけ)。
  照合役 (R3b、Codex Sol) は正解を読む側なので、この blind 監査の対象外とする (§D4)。
- **強制の層 (実測、HEAD `781647c5`、Claude Code 2.1.290)**:
  | 層 | 内容 | 根拠 |
  |---|---|---|
  | 起動時に強制される | サブエージェントが使える tool の集合 (定義の `tools:`)、turn 数の上限 (`maxTurns`)、model | Claude Code の標準サブエージェント機能 (harness のコードではない)。run 前の probe (§D1 の合成試験) で、定義外の tool が呼べないことを実測してから本番に入る |
  | 起動時に強制されない (事後に検出し、その run を無効にする) | Read / Grep / Glob / Write の対象 path、operator からの追加指示、web 系 tool の混入 | harness の agent-guard は `subagent_type` の allowlist と model の下限しか見ず、tool も path も検査しない (`src/runtime/agent-guard.ts:93-160`)。そもそも作業場所では source repo の hook が動かない。作業場所の `.claude/settings.json` に置く `permissions.deny` (source repo と `docs/design` 等への Read) は多層防御として置くが、Grep / Glob への効き方を証明できないので、判定には使わない |
  | 検出もできない (残余リスクとして記録する) | user 階層の設定と指示の混入 (`~/.claude/settings.json` の hooks・env・permissions、`~/.claude/CLAUDE.md`)、サブエージェントが CLAUDE.md 類をどこまで受け取るか。Grep / Glob が内部で探索したが結果に現れなかったファイル (hit しなかった探索の範囲は transcript に残らない。結果に現れないので内容も名前も context に入らないが、探索したこと自体は証明も否定もできない) | GUI 起動では `--setting-sources` などの CLI option を渡せず、user 階層を外せない。代わりに、run 開始時の `~/.claude/settings.json` と `~/.claude/CLAUDE.md` の sha256、有効な plugin と MCP server の一覧 (0 件であること) を `run-manifest.json` に記録する。これらに `docs/design` の内容が無いことは run 前に operator が確かめ、確認結果を manifest に残す |
- **生 transcript の所在 (実測)**: 標準サブエージェントの transcript は
  `~/.claude/projects/<cwd-slug>/<operator-session-uuid>/subagents/agent-<agentId>.jsonl` に、定義名・model を持つ
  `agent-<agentId>.meta.json` と対で残る (`agentType` / `model` / `toolUseId`)。各行は `isSidechain`・`agentId`・`cwd`・`sessionId`・
  `version` (Claude Code の版) を持ち、assistant 行の `message.content[].tool_use.input` と、user 行の `tool_result` を持つ。
  assistant 行は `message.usage` を持つ (§D7 の集計元)。harness の session log は path の要約だけで offset / limit を残さず
  fail-open なので (`src/runtime/session-log.ts:119` / `:429`)、監査には使わない。transcript の欠損・未知の形式・meta.json の欠落は、
  そのセッションの run を無効にする (fail-close)。
- **監査結果の attestation**: 監査・網羅・採点の結果は、結果 PR (§D6 の置き場 A) で `.ut-tdd/reverse/<run_id>/` に commit する。
  `run-manifest.json` には、operator セッションの UUID、各サブエージェントの `agentId`、transcript と meta.json の sha256、
  Claude Code の版、上の「強制の層」の 3 段それぞれの判定 (`enforced_at_launch` / `audited_post_hoc` / `unverifiable_residual`)
  を記録する。結果の承認は、結果 PR の exact HEAD に対する非著者 review を canonical な review custody
  (canonical request → exact HEAD → verdict → receipt) で受けることで行う。#619 の attestation 経路 (標準サブエージェントの verdict
  を canonical request と exact HEAD に結び付けて receipt にする) が実装されていればそれを使い、未実装の間は #619 の方針メモ 4 に従って
  現行の正規委譲経路の review custody (`src/cli/delegation.ts:223-226` の `projectReviewVerdict`、型は `src/feedback/review-attestation.ts:37-59`) を使う。どちらでも、`unverifiable_residual` の項目を reviewer が確認できるように
  verdict の対象へ含める。盲検を「証明済み」とは書かず、「起動時の tool 制限 + 事後監査で違反 0 件、残余リスクは manifest 記載のとおり」と書く。
- **起動時の生成物**: inventory は起動前に凍結し、起動後に増えたファイル (`out/`) は読取対象にも網羅の分母にも入れない。統合役が読む
  shard の出力は、`out/` を直接読ませず、§D3 の凍結入力 `frozen/` として digest 付きで渡す (生成ファイル全般への読取許可は広げない)。
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
返した行範囲は、tool_result 本文の各行の先頭にある行番号から取る (標準サブエージェントの transcript では構造化された返却範囲がほとんど残らない、§D11 の実測)。構造化された結果が残っている場合は、行番号から取った範囲と一致しなければ読了に数えない。
行番号の連続が途切れる・行番号の無い行が混じる tool_result は、途切れより後ろを読了に数えない。
失敗・切り詰め (truncated 表示や省略記号) を含む tool_result は、その範囲を読了に数えない。Grep / Glob の hit も数えない。
空ファイルは、成功した Read が 1 回あれば読了とする。テキストでないファイル (画像など) は inventory に載せたうえで分母から外し、
件数を `run-manifest.json` に記録する。網羅率 = 読了ファイル数 ÷ 分母の件数で、100% が合格。監査ログと inventory を突き合わせて機械で算出する。
監査スクリプトは本番の前に、外部の絶対 path・junction 経由の読取・path を省略した Grep / Glob・
Glob の pattern による逸脱 (path=`pack/` で pattern=`../out/**`、source repo を指す絶対 pattern)・Grep の `glob` による同じ逸脱・
pattern は allowlist 内に見えるが返却 path が外にある結果・返却 path を解析できない結果・出力先外への Write・operator からの追加指示・禁止 tool・読取失敗・切り詰め・transcript 欠損・meta.json 欠落を仕込んだ合成 transcript で、
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
| R4 | Opus (tl) | `frozen/scoring/` の `findings.jsonl` と `metrics.json` | drift ごとの routing 先 (設計改訂 / 修正チケット / gap-only)。`missing_pair_artifacts` |

**統合役の凍結入力**: 全 shard の R2 が終わり、各 shard の監査が valid になった時点で、作業場所のスクリプトが
`out/<shard_id>/` の `r0-evidence.json` / `claims.jsonl` / `as-is.md` / `as-is-test.md` を `frozen/shards/<shard_id>/` へ複写する。
同じスクリプトが Pack だけから import graph を抽出して `frozen/import-graph.json` に書く。`frozen/` の全ファイルの sha256 を
`frozen_inputs_digest` (inventory_digest と同じ形) として `run-manifest.json` に記録し、以後は書き換えない。統合役の読取 allowlist は
凍結 Pack と `frozen/` だけで、監査は `frozen/` 外の生成物 (`out/`・`.ut-tdd/`) の読取を違反とする。R3a と R4 は、統合役自身の出力
(`out/_system/`) を同じ手順で `frozen/system/` に凍結してから読む。R4 は、R3b の出力 (`findings.jsonl`・`metrics.json`) を
同じ手順で `frozen/scoring/` に凍結し、その digest を `scoring_digest` として `run-manifest.json` に記録してから起動する。
R4 の起動入力は `frozen_inputs_digest` と `scoring_digest` で特定し、凍結後に採点結果を書き換えない。

統合パスを工程の中心に置く。shard 単体では見えないサブシステム間の契約と全体方針の復元率を、system 階層の指標として別に出す (§D5)。
executor はテストを実行しない (静的な読み取りだけ)。Pack 内には docs/design を読むテストがあり、Pack では前提が欠けるため。

### D4 役割と族分離

- executor = Claude Sonnet (`claude-sonnet-5`、worker tier)。作業場所の標準サブエージェント `reverse-executor` で、shard ごとに独立して起動する (§D1)。
- 統合・R3a・R4 = Claude Opus (`claude-opus-5`)。作業場所の標準サブエージェント `reverse-integrator` で起動する。統合役も docs/design を読まず、§D1 の監査対象に入れる。
- 照合・採点 = Codex Sol (`gpt-6.1-sol`)。Codex 側の標準サブエージェント (GUI 側のセッション) で起動し、`ut-tdd codex --role qa` の headless 経路は使わない
  (#619 の方針メモ)。docs/design と PLAN を読めるのはこの役だけ。PO 判断の「Pack だけ」は executor の制約であり、照合役は正解を知る側なので
  PLAN も読んでよい (drift の design_stale / impl_drift の判定に使う)。照合役のセッション記録 (Codex の session log) の path と sha256 を
  `run-manifest.json` に記録する。
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

**判定**: 次の順で決める (前の段で決まったものは後の段で上書きしない)。

1. **重複の統合**: 同じ shard 階層で同義の復元 claim は 1 つに統合し、統合した claim_id を `merged_claim_ids` に残す。照合先 claim も同様に統合する。
2. **復元 claim の真偽**: 各復元 claim をコードと突き合わせる。主語が Pack に実在しなければ `fabrication`、主語は実在するが内容がコードと
   矛盾すれば `misread`。この 2 つは、照合先との対応にかかわらずここで確定する (誤った復元が hit になる経路を作らない)。
3. **照合先 claim の真偽**: 各照合先 claim をコードと突き合わせ、`oracle_true` (成立) / `oracle_false` (矛盾または不在) /
   `out_of_pack_scope` に分ける。
4. **対応づけ**: 真である復元 claim と `oracle_true` の照合先 claim を、同義のもの同士で 1 対 1 に対応づける。

| 状況 | score | drift |
|---|---|---|
| 真である復元 claim が `oracle_true` の照合先 claim と対応した | `hit` | `none` |
| `oracle_true` の照合先 claim に対応する復元が無い | `miss` | `none` (Reverse の性能の問題) |
| 照合先 claim が `oracle_false` | `oracle_only` | `design_stale` / `impl_drift` の候補。判断できなければ `unresolved` |
| 復元 claim が段 2 で `misread` | `misread` | `none` |
| 復元 claim が段 2 で `fabrication` | `fabrication` | `none` |
| 真である復元 claim に対応する照合先が無い | `undocumented_true` | `undocumented` |
| 照合先 claim が `out_of_pack_scope` | `out_of_pack_scope` | `none` |

`oracle_false` の照合先 claim と同じ主語について真である復元 claim がある場合は、`oracle_only` の record と
`undocumented_true` の record を両方作り、互いの `finding_id` を `related_finding_ids` に入れる (ずれの証拠として対で残す)。
design_stale と impl_drift の判定目安: Pack のテストがコードの挙動を assert していれば design_stale の候補、
照合先 claim を裏づける PLAN の判断がコードより新しければ impl_drift の候補。最終判断は R4。

**指標** (shard ごと、system 階層、全体):

- recall = `hit` の数 ÷ `oracle_true` の照合先 claim の数 (分子は分母の部分集合なので 1 を超えない)
- precision = (`hit` + `undocumented_true`) ÷ 統合後の復元 claim の数
- misread 率・fabrication 率 = それぞれの数 ÷ 統合後の復元 claim の数
- 分母が 0 の指標は `null` とし、0 や 1 で埋めない。
- 上記すべてを、全体の値と「根拠が code/test だけ」の値の 2 本立てで出す (§1 の既知の漏れ対策)。code/test の値では、
  evidence が全て `code` か `test` の復元 claim だけを分子・分母に入れる。recall の分母は全体と同じ `oracle_true` の数とし、
  対応した復元 claim の evidence に `comment` / `pack_doc` が含まれる `hit` は、code/test の値では `miss` として数える。

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
| `score` | `hit` \| `miss` \| `misread` \| `fabrication` \| `undocumented_true` \| `oracle_only` \| `out_of_pack_scope` | §D5 の判定順で決める |
| `merged_claim_ids` / `related_finding_ids` | string[] | 重複統合した claim と、対で残した record (§D5) |
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
- **上限**: shard ごとに 1.2M token、run 全体で 12M token。
- **集計範囲**: input (cache の作成と読取を含む) と output の合計。再試行・再分割・やり直しのセッションは元の shard に合算し、
  統合・R3a・R4・採点のセッションは run 全体に合算する。
- **改訂 (rev 4)**: rev 3 の「supervisor が provider process tree を止めて、累計が上限を超えないことを保証する」は、#825 の stream-json 出力と
  子プロセス起動を前提にしていた。標準サブエージェントは operator セッションの内部で動くので、作業スクリプトから個別に停止できない。
  よって**上限を超えないことの保証は撤回**し、次の 3 つに置き換える (強制できるのは turn 数の上限だけである)。
  1. **起動時の上限**: サブエージェント定義の `maxTurns` を run 前に固定し、`run-manifest.json` に記録する (Claude Code が強制する)。
  2. **実行中の監視**: 作業スクリプトが各サブエージェント transcript の assistant 行の `message.usage` を読んで shard と run の累計を出し、
     「上限 − margin」に達したら operator に停止を知らせる。operator は GUI でそのサブエージェントを止める。margin は 1 message の
     最大 usage (入力 context の上限 + 出力の上限) 以上とし、run 前に値を記録する。停止は人手を挟むので即時ではない。
  3. **結果の扱い (fail-close)**: 停止の成否にかかわらず、transcript から集計した累計が上限を超えた shard は `aborted_budget` とし、
     その出力を採点にも網羅にも使わない。run 全体の累計が上限を超えたら、以後のセッションを起動しない。
- **Codex の採点**: Codex のセッション記録から turn ごとの usage を読めることを起動の条件とする。run 前の試験で、Codex の session log に
  usage が現れ、作業スクリプトがそれを読めることを確かめる。確かめられなければ採点を起動しない (fail-close)。起動した場合は、
  Claude 側と同じ監視・margin・結果の扱いを使う。
- **計測不能時の fail-close**: usage が読めない (transcript が途切れる・形式が未知・usage の欠落) セッションは `aborted_unmetered` とし、
  その出力を使わない。usage を推定で埋めない。
- **上限到達試験**: 本番の前に、次の合成 transcript で監視と集計を動かし、それぞれ通知と記録が起きることを確かめる
  (AC1b の合成 transcript 試験と同じ場で行う)。(1) 上限を超える usage → `aborted_budget`、(2) usage を欠く行 → `aborted_unmetered`、
  (3) 境界: 累計が「上限 − margin」の直前にあるところへ margin 以下の message が来る場合に、通知が出ること。
  (1)〜(3) を Claude のサブエージェント transcript と Codex の session log の両方の形式で行う。
- **blind 違反**: 違反した shard を無効にし、新しいセッションで 1 回だけやり直す。同じ shard で 2 回違反するか、
  統合役が違反したら、run 全体を中止する。
- **網羅不足**: R0 網羅率が 100% に届かなければ、未読ファイルだけを 1 回追加で読ませる。それでも届かなければ
  run を `incomplete` とし、全量の指標としては公表しない。
- **利用上限**: 停止して待つ。別の族への代替はしない (§D4)。

### D8 非目標

- 本 PLAN ではコードを変更しない。`src/`・`tests/`・gitignore・配布コードには触れない。rev 3 の前提 PR (#825、wrapper の隔離実行 profile) は
  作らない (#619 の方針メモ)。作業場所に置くサブエージェント定義と `.claude/settings.json` は、作業場所の使い捨て設定であり、source repo には入れない。
- 監査・網羅・schema 検証・usage 監視のスクリプトは作業場所に置く使い捨てとし、sha256 を manifest に記録する。
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
- 採択: wrapper の隔離実行 profile を前提 PR とし (§D1)、網羅は成功した tool_result の実返却範囲で数える (§D2)。 (前提 PR の部分は rev 4 で撤回、§D11)
- 実測で直した点: advisor は Claude Code 2.1.281 の固定を推奨したが、この環境の実測は 2.1.284 で版は動く。版は固定せず run ごとに記録する。各 option (`--tools` / `--safe-mode` / `--strict-mcp-config` / `--session-id` / `--setting-sources` / `--output-format stream-json`) の実在は 2.1.284 の `--help` で確認した。

### D11 実行方式の改訂記録 (rev 4、2026-10-06)

外部監査の指摘 (#823 のコメント、2026-10-05) を受けた改訂。変えたのは実行方式だけで、shard 規則 (§D2 の分割)・工程 (§D3)・採点 (§D5)・
record (§D6) の契約は変えない。

- 撤回: wrapper の隔離実行 profile (#825) を前提とする起動・path guard・stream-json・supervisor による process 停止 (rev 3 の §D1 / §D7)。
- 採択: 標準サブエージェントの起動制約 (tool 集合・`maxTurns`・model) + GUI 側の作業場所の隔離 + 全 transcript の事後監査 (§D1)。
- 盲検の扱い: 起動時に強制できるのは tool の集合までで、path と user 階層の混入は強制できない。前者は事後監査で違反を検出して run を無効にし、
  後者は `unverifiable_residual` として manifest に記録する。承認は結果 PR の exact HEAD に対する canonical な review custody で行う (§D1 末尾)。
- 予算: 上限を超えないことの保証を撤回し、`maxTurns` + 監視 + 超過時の結果無効化に置き換えた (§D7)。
- 方式に伴う oracle の調整: path を省略した Grep / Glob を違反に変更 (cwd が作業場所の root になるため)。Grep / Glob の pattern による探索範囲の逸脱と、
  返却 path の allowlist 外を違反に追加し、合成試験に入れた (rev 5、#850 の Sol r1 FLAG の是正)。R0 網羅の行範囲の取り方を、
  サブエージェント transcript の実形式に合わせた (§D2)。
- 実測 (2026-10-06、当 repo の operator 環境の既存サブエージェント transcript 154 本、meta.json の欠落 0): Read の tool_use 843 件の全てに対応する
  `tool_result` があり、構造化された結果 (`toolUseResult`) を持つのは 15 件だけ、本文の先頭が行番号の形 (行番号 + タブ) のものは 783 件だった。
  よって返却範囲は本文の行番号を一次の根拠とし、構造化された結果がある場合は両者の一致を確かめる。
- advisor: 方式の選択肢は PO 方針 (#619 の方針メモ、#823 のコメント) で決まっており、未解決の trade-off は「盲検の保証の強さ」だけである。
  これは本 PLAN の非著者 review (Codex Sol) の判定対象とする。

## §3 受け入れ条件

| AC | 内容 | 検証 |
|---|---|---|
| AC1 | 本 PLAN が lint を通り、非著者 (Codex Sol) の review を受ける | `ut-tdd plan lint`、`review_evidence` の cross_agent 記録 |
| AC1b | 本番前の probe で、作業場所のサブエージェント定義に無い tool が呼べないことを実測し、合成 transcript 試験で監査スクリプトが仕込んだ違反を全て検出し、usage 監視が上限超過と計測不能を `aborted_budget` / `aborted_unmetered` に記録する | probe と合成 transcript 試験の出力 (sha256 を `run-manifest.json` に記録) |
| AC2 | inventory が `distribution plan --json` の `artifactPaths` (固定点 S) と集合一致し、`inventory_digest` が manifest に記録される | 作業場所の inventory スクリプト + `node src/cli.ts distribution plan --json --tag <S>` |
| AC3 | 全 executor と統合のセッションで blind 違反が 0 件で、`run-manifest.json` に強制の層 3 段 (`enforced_at_launch` / `audited_post_hoc` / `unverifiable_residual`) の判定と残余リスクが記録され、結果 PR の exact HEAD に対する非著者 review の receipt がある | transcript 監査スクリプトの出力 (`run-manifest.json` の audit 欄)、結果 PR の review receipt |
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
