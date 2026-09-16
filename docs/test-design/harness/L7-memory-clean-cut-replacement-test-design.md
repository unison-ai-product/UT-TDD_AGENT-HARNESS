---
title: "L7 memory clean-cut replacement test design"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L6-104-memory-clean-cut-replacement.md
parent_doc: docs/design/harness/L6-function-design/memory.md
created: 2026-09-15
updated: 2026-09-15
---

# PLAN-L6-104 memory clean-cut replacement — L7 test design

## 1. 位置付け

本 artifact は `PLAN-L6-104-memory-clean-cut-replacement` (L6 add-design) の pair artifact である。project memory corpus を移行せず clean-cut で置換する契約について、次を検証する候補 oracle を定義する。

- runtime が project-scoped canonical root 以外を読まないこと。
- Slice 4 の migration 実装を撤去すること。
- legacy corpus を archive すること。
- curation ledger の束縛。
- curated corpus で DB rebuild が clean に完了すること。

継承して変更しない範囲: `PLAN-L7-512` の pair artifact (`L7-project-scoped-memory-root-test-design.md`) が所有する `CANDIDATE-U-PMEMROOT-*`、`CANDIDATE-P-PMEMROOT-*`、provider envelope の `U-PMEMROOT-*`。本 artifact はこれらを再定義しない。置換後も Green であることだけを §7 の継承 fence で要求する。

撤去対象: 同 pair artifact の Slice 4a / 4b 節が宣言する `U-PMEMINV-*` と `U-PMEMQUAR-*` は、PR-1 で宣言を撤回する。本 artifact は撤回後の trace 整合だけを検証する。`PLAN-L7-533` の pair artifact が持つ `CANDIDATE-U-PMEMFENCE-*` は、同 PLAN の未実装撤回に伴い採用しない (archive の実行制約は `PLAN-L6-104` §9)。

この pair-freeze (PR-0) では候補だけを宣言し、production source と test code は追加しない。正規 ID への昇格は §6 に従い、実装 PR で行う。

## 2. 用語と判定基準

- **canonical root**: `requireProjectMemoryRoot` が返す `canonicalProjectRoot` 配下の `.ut-tdd/memory/`。
- **tracked archive**: `docs/archive/memory-legacy-2026-09/` (PR-2 で `git mv` する)。
- **local archive**: `.ut-tdd/archive/memory-legacy-2026-09/` (gitignore 対象で、commit しない)。
- **linked legacy**: linked worktree の `.ut-tdd/memory/`。本 chain では移動・削除・編集しない (#578 の責務)。
- **canonical-only**: 返却・投影された entry について、次の全てが成り立つこと。
  - `memory_id` の集合が canonical fixture の集合と一致する。
  - `content_hash` が canonical file の digest と一致する。
  - `source_path` が全件 `.ut-tdd/memory/` 配下にある。
  - archive / local archive / linked legacy に埋めた一意 token が一度も出現しない。
  - archive 側の破損 entry を原因とする finding・例外が 0 件である (破損 entry に反応した時点で、読んだ証拠とみなす)。
- **許可された走査 (runtime read ではない)**: secret-scan (`docs/` 全体)、readability (`docs/` 全体)、clean Pack の denylist 判定、git 操作。これらが archive を走査しても non-read 違反としない。これらの gate 自体の成否は `CANDIDATE-P-MEMCUT-030` で扱う。

## 3. fixture

- fixture repository は temp directory 内に作る。実 repository・開発 worktree・ユーザーデータは対象にしない。tracked identity (`ut-tdd.project.json`) を HEAD に commit した primary と、`git worktree add` で作る linked worktree 1 本を用意する。
- canonical root: kind の異なる valid entry を 2 件置き、各 entry に canonical 専用の token を入れる。
- tracked archive:
  - archive にしか無い valid entry (一意の `memory_id` と archive 専用の token を持つ)。
  - adversarial (a): canonical entry と同じ `memory_id` で、body が異なる (digest が異なる) entry。
  - adversarial (b): frontmatter が破損した entry (`memory_id` 欠落と、閉じ `---` 欠落の 2 種)。
  - adversarial (c): symlink。primary 外の file を指す archive 内の `.md` symlink と、canonical root を指す archive 内の directory link の 2 種。symlink を作れない OS では junction で代替する。どちらも作れない場合は skip 理由を証跡に残し、Green と数えない。
- local archive: valid entry 1 件 (local archive 専用の token を持つ)。
- linked legacy: 一意の valid entry 1 件と、canonical entry と同じ `memory_id` で digest が異なる entry 1 件。
- 各 stimulus の前後で、canonical / tracked archive / local archive / linked legacy の全 file digest を比較し、write が 0 件であることを確認する。
- harness.db を使う行は fixture 専用の DB path を使い、実 repository の `.ut-tdd/harness.db` に触れない。
- 実 repository を読む test (§4.2 / §4.3 の git 実測) は、同じ PR で `src/doctor/test-repository-isolation.ts` に契約行を追加する (未登録だと `unclassified` で fail-close する)。

## 4. Candidate oracle matrix

### 4.1 canonical-only non-read composition

| Candidate | 所有 PR | Stimulus / mutation | 独立 oracle |
| --- | --- | --- | --- |
| `CANDIDATE-U-MEMCUT-001` | PR-2 | §3 の fixture で `loadMemoryEntries(canonicalProjectRoot)` を呼ぶ | canonical-only。archive に破損 entry があっても throw しない。全 root の digest が不変 |
| `CANDIDATE-U-MEMCUT-002` | PR-2 | 同じ fixture で `loadMemoryCorpus` と `readMemory` (index 無し / fixture DB 有り) を呼ぶ | canonical-only。`findings` に archive / linked legacy の path を含む要素が 0 件 |
| `CANDIDATE-U-MEMCUT-003` | PR-2 | archive と linked legacy に置いた、同一 `memory_id`・異 digest の entry を観測対象にする | 返る body と `content_hash` は canonical file のもの。conflict / quarantine / dedupe 系の finding が 0 件 (比較した時点で読んだ証拠になる) |
| `CANDIDATE-U-MEMCUT-004` | PR-2 | archive 内に file symlink と directory link を置いた状態で、001〜002 を再実行する | 返却 entry の realpath が全件 canonical root 配下にある。link 先 token の出現が 0。link を作れない OS は skip 理由を記録し、Green にしない |
| `CANDIDATE-U-MEMCUT-005` | PR-2 | fixture DB の `memory_entries` に archive 由来の row (canonical に無い `memory_id`) を注入してから `readMemory` を呼ぶ | 本文は canonical file からだけ返る。archive 由来の row は freshness の劣化 (`index-only`) として可視化される。archive body の出現が 0 |
| `CANDIDATE-P-MEMCUT-006` | PR-2 | `ut-tdd db rebuild` を primary と linked worktree の両方の cwd から実行する | 両方で `memory_entries` が canonical-only。relation graph の memory design node に archive / linked legacy の path が 0。linked cwd からの実行は Red 起点の見込み (静的読解では cwd 直下を投影する)。`CANDIDATE-U-PMEMROOT-009` と同じ stimulus (§5 参照) |
| `CANDIDATE-P-MEMCUT-007` | PR-2 | `ut-tdd memory list`、`memory list --query <archive 専用 token>`、`memory recall --query <linked legacy token>` を、primary と linked worktree の両方の cwd から subprocess で実行する | stdout が canonical-only。archive / linked token の query 結果は 0 件。両 cwd の出力が一致する |
| `CANDIDATE-P-MEMCUT-008` | PR-2 | Claude と Codex の SessionStart hook が呼ぶ `src/cli.ts session start` を、primary と linked worktree から実行する | digest の memory 段が canonical の title だけを列挙する。Claude 経路と Codex 経路で memory の集合が一致する |
| `CANDIDATE-P-MEMCUT-009` | PR-2 | (a) linked worktree から `memory add --notify-claude` で archive entry と同じ title の entry を書き、hook の consume まで通す。(b) review-live の memory path 引数に、tracked archive 内の path と `..` を含む path を渡す | (a) envelope が束縛する `memory_id` / digest は、canonical に新規作成された file と一致する。archive entry は claim されない。(b) canonical authored root 外の path は typed deny となり、read が 0。静的読解では path 制限が無いため、(b) は Red 起点の見込み |
| `CANDIDATE-P-MEMCUT-010` | PR-2 | 同じ fixture で、doctor の memory 関連 check (`memory-sync`、DB projection check) と `ut-tdd status` / `status --json` を実行する | memory-sync の対象 path は `.ut-tdd/memory` だけで、archive path を未同期 memory と数えない。DB projection の memory 行は canonical-only。status は memory を読まないという不変条件を保つ (memory 由来 token の出現が 0) |
| `CANDIDATE-U-MEMCUT-011` | PR-2 | production reader に mutation を入れる: (i) memory 読み出しを再帰 walk にする、(ii) archive root を読み出し候補に加える、(iii) db rebuild の root を canonical 解決から cwd へ戻す | 各 mutation で、001〜010 のうち少なくとも 1 行が Red になる。Red にならない mutation があれば、検出力不足として Red。mutation commit は出荷しない |

### 4.2 migration 撤去 (PR-1)

| Candidate | 所有 PR | Stimulus / mutation | 独立 oracle |
| --- | --- | --- | --- |
| `CANDIDATE-U-MEMCUT-012` | PR-1 | `src/`・`scripts/`・`.claude/hooks/` の import graph を、TypeScript の module 解決で走査する。mutation として、任意の production module に migration module の import を 1 行戻す | `project-memory-migration` への edge が 0、module file が不在、`ProjectMemoryMigration` symbol の出現が 0。mutation で Red |
| `CANDIDATE-U-MEMCUT-013` | PR-1 | `src/doctor/test-repository-isolation.ts` の `CONTRACT_ROWS` を test file の集合と照合する。負例として、test file だけを削除して行を残す | 行が 0 件で `test-repository-isolation` が OK。負例は `stale-contract:tests/project-memory-migration.test.ts` で Red |
| `CANDIDATE-U-MEMCUT-014` | PR-1 | migration test の削除後に、oracle-test-trace を実 repository に対して実行する。負例として、test だけを削除して宣言を残す | `U-PMEMINV-*` (8 件) と `U-PMEMQUAR-*` (5 件) の宣言 site が 0、orphan が 0、baseline への退避が 0 (baseline は縮小のみ)。負例は該当 13 件の orphan で Red |
| `CANDIDATE-U-MEMCUT-015` | PR-1 | migration file の削除後に plan-artifact-existence を実行する (`PLAN-L7-512` は confirmed で、`generates` に削除対象の 2 path を持つ) | phantom-artifact が 0。`generates` の整合は canonical な `plan revise --manifest` 経路で行い、receipt を手で編集しない。負例 (generates を据え置く) は 2 path の phantom-artifact で Red |
| `CANDIDATE-U-MEMCUT-016` | PR-1 | PR-1 の diff と継承 test を検査する | `src/runtime/project-memory-root.ts` と `src/runtime/claude-provider-envelope.ts` の diff が 0。`tests/project-memory-root.test.ts`・`tests/project-memory-pack-parity.test.ts`・`tests/claude-memory-wake.test.ts` の label 集合が不変で、かつ Green。`src/`・`tests/`・`scripts/` での `project-memory-migration` の出現が 0 (docs に残るのは correction note / 非適用注記 / archive だけ) |

### 4.3 corpus 置換: rename digest manifest と untracked の非 commit (PR-2)

| Candidate | 所有 PR | Stimulus / mutation | 独立 oracle |
| --- | --- | --- | --- |
| `CANDIDATE-U-MEMCUT-017` | PR-2 | PR-2 base HEAD の `git ls-files .ut-tdd/memory`、machine manifest の source 集合、PR HEAD の `docs/archive/memory-legacy-2026-09/` 集合を照合する | 3 つの集合が basename 単位で全単射になる。件数は実測値とだけ比較し、固定値を持たない。負例 (1 件欠落 / manifest 外に 1 件追加) で Red |
| `CANDIDATE-U-MEMCUT-018` | PR-2 | manifest の各行について、source blob (base HEAD) と destination blob (PR HEAD) を比較する。mutation として archive file 1 件を 1 byte 改変する | 全行で blob oid と sha256 が一致し、base..HEAD の rename 検出が類似度 100%。mutation で Red |
| `CANDIDATE-U-MEMCUT-019` | PR-2 | PR-2 の実行時に、local で `git ls-files --others --exclude-standard .ut-tdd/memory` を採取し、その内容 digest の集合を PR 範囲の全 commit の blob digest と照合する | 交差が 0 (path だけでなく内容 digest で判定する)。`git ls-files .ut-tdd/archive` が 0 件。`git check-ignore` が local archive 配下の file を ignore と判定する |
| `CANDIDATE-U-MEMCUT-020` | PR-2 | commit される manifest と generated summary の内容を検査する | untracked 由来の path・title・本文の出現が 0。untracked については件数と集合 digest だけを記録する |
| `CANDIDATE-U-MEMCUT-021` | PR-2 | manifest から generated summary を再生成する | commit 済みの summary と byte 単位で一致し、件数が manifest と一致する。手編集による差分があれば Red |
| `CANDIDATE-U-MEMCUT-022` | PR-2 | local archive と linked legacy の、移動前後の digest を local で採取する (CI 対象外の local 証跡) | local archive の file digest 集合が、移動前の untracked digest 集合と等しい。linked legacy の digest 集合は不変。legacy corpus の完全保存を主張する文言を証跡に含めない |
| `CANDIDATE-P-MEMCUT-023` | PR-2 | PR HEAD の tree に対して `buildCleanDistributionPlan` と clean Pack E2E を実行する。mutation として deny prefix から `docs/archive/` を外す | `artifactPaths` に `docs/archive/memory-legacy-2026-09/` と `.ut-tdd/archive/` 配下が 0 件。`CANDIDATE-P-PMEMROOT-002` / `CANDIDATE-P-PMEMROOT-003` の test が Green のまま。mutation で Red |

### 4.4 curation ledger binding (PR-2)

| Candidate | 所有 PR | Stimulus / mutation | 独立 oracle |
| --- | --- | --- | --- |
| `CANDIDATE-U-MEMCUT-024` | PR-2 | ledger の各行を manifest と照合する。負例: digest を 1 文字改変、manifest 外の tracked source path、untracked row への path 混入、registration receipt の欠落、理由の欠落 | 全行が tracked source の archive path、または untracked source の内容 digest と opaque な local-archive custody id (path なし)、source digest、adopt / reject、6 基準の判定と根拠参照、理由、採用行では registration receipt digest を持ち、digest が manifest と一致する。負例はそれぞれ Red |
| `CANDIDATE-U-MEMCUT-025` | PR-2 | adopt 行を canonical root の entry 集合と照合する。負例: ledger に無い canonical entry、entry の無い adopt 行 | adopt 行の `memory_id` 集合が canonical entry 集合と等しい。同義語の統合は `merged_from` で多対一を明示し、統合元の行も残す。負例は Red |
| `CANDIDATE-U-MEMCUT-026` | PR-2 | ledger に記録した kind / title / body / tags で、`ut-tdd memory add` を scratch の canonical root に対して実行し、command の registration receipt (operation id、memory id、出力 source path、content digest、exit code) を取得する。負例: receipt の欠落 / 改変、receipt を伴わない同値な手書き file、canonical root 外への出力 | receipt の digest が adopt 行の ledger と一致し、exit code が 0、出力 source path が canonical root 配下で、生成 file の file 名・`memory_id`・`updated_at` 以外の frontmatter 値と本文が canonical root の file と一致する。receipt のない手書き file は内容が同値でも Red。frontmatter の `memory_id` / `kind` / `title` / `tags` / `updated_at` の欠落が 0 |
| `CANDIDATE-U-MEMCUT-027` | PR-2 | adopt entry の本文を除外 screen にかける。負例 fixture: PR 番号、commit hash、review request / verdict / receipt / handoff への参照、secret に見える値、個人環境の絶対 path | 負例はそれぞれ Red。screen は必要条件であって十分条件ではない (最終判断は 028 の reviewer が行う)。採用件数の固定値 assertion を持たない |
| `CANDIDATE-U-MEMCUT-028` | PR-2 | ledger の reviewer 記録を検査する | reviewer の model family が author と異なり、frontier tier であり、判定対象の exact head に束縛されている。同一 family / head 欠落は Red |

### 4.5 curated corpus での DB rebuild (PR-2)

| Candidate | 所有 PR | Stimulus / mutation | 独立 oracle |
| --- | --- | --- | --- |
| `CANDIDATE-P-MEMCUT-029` | PR-2 | PR HEAD の隔離 snapshot で `ut-tdd db rebuild` を実行し、続けて fixture DB 付きで `readMemory` を呼ぶ。負例として、canonical root に frontmatter の破損した file を 1 件足す | rebuild が ok。`memory_entries` の (`memory_id`, `content_hash`) 集合が、canonical file の parse 結果と等しい。`source_path` は全件 `.ut-tdd/memory/` 配下で、freshness は fresh。`loadMemoryEntries` は 1 件も throw しない。負例は Red |
| `CANDIDATE-P-MEMCUT-030` | PR-2 | PR HEAD で doctor の secret-scan と readability を実行する (archive corpus が `docs/` 配下に入る)。負例として、fixture archive に文字化けした file を置く | 両 check が、scanner の scope を変えずに ok。archive を scope から外す変更は本 artifact の oracle ではなく、別契約とする。負例は Red |

## 5. 所有と Red 起点

- 012〜016 は PR-1 が所有する。001〜011 と 017〜030 は PR-2 が所有する。
- 実装前の HEAD で Red が見込まれる行: 006 (linked cwd)、009 (b)、012〜022、024〜028。
- HEAD でも Green になり得る行 (001〜005、007、008、010、023、029、030) は、011 の mutation または各行の負例で Red を実測してから昇格する。Green のままの行は昇格しない。
- 006 の linked worktree 起点の rebuild は、`PLAN-L7-512` pair の `CANDIDATE-U-PMEMROOT-009` と同じ stimulus である。実装 PR は両者を同一の Red→Green 実測で扱い、同じ契約を 2 つの ID で別々に説明しない。

## 6. 昇格規律

- 実装 PR で Red→Green を観測した行だけを、同じ番号の `U-MEMCUT-*` / `P-MEMCUT-*` へ 1:1 で昇格する。`it.todo` や skip だけでは昇格しない。
- 昇格した ID は、test の静的 label (`describe` / `it` / `test` の第 1 引数) に書く。本文や fixture 文字列に書いた ID は citation に数えない。
- 昇格した行は本 artifact 内に置く。共有の `L7-unit-test-design.md` へ別の説明で再掲しない (同一 ID・別説明は重複宣言として fail-close する)。
- 本文中で昇格後の ID を参照するときは `U-MEMCUT-*` の形で書く。番号付きの素の ID や範囲表記は書かない (宣言として収集され、citation が無ければ orphan になる)。
- 新規 test file は、実装 PLAN の `generates` に `test_code` として所有させる。実 repository を読む test は、repository isolation の契約行を同じ PR で追加する。

## 7. Gate and scope fence

- 継承: project-scoped canonical root、provider envelope、Pack parity の既存候補と正規 oracle は変更しない。置換後も Green であることを要求するだけである。
- 非対象: linked worktree legacy の cleanup / 保全 (#578)、legacy corpus の完全保存、Issue 本文の編集。
- curation の採用件数を受入条件にしない。候補表があることや自動分類の結果を、採用の根拠にしない。
- candidate が存在するだけでは、Green の証跡、Issue #424 の完了、Pack parity の根拠にしない。
- PR-0 では `.ut-tdd/memory` の corpus file を移動・削除・編集しない。

## 8. Required evidence

実装 PR は次の証跡を残す。

- base HEAD と exact HEAD。
- 実行時点で採取した tracked / untracked の件数 (PR-0 時点の値を流用しない)。
- fixture の構成と、各 stimulus の前後で write が 0 件だった計測結果。
- Red 起点 (実装前 HEAD、または出荷しない mutation commit) と、検証ログの SHA-256。
- targeted command の終了コードと、typecheck / Biome の結果。
- Linux / Windows / aggregate の CI run ID。
- 非著者の closing receipt の digest。
