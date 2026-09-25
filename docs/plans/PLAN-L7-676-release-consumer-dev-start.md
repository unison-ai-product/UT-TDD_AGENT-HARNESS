---
plan_id: PLAN-L7-676-release-consumer-dev-start
title: "PLAN-L7-676 (add-impl): Release consumer で開発を開始できる状態にする (identity / 同梱資産
  / 生成物 / テンプレート / consumer gate)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-24
updated: 2026-09-24
owner: Claude / Opus (pair-freeze) · Codex worker (implementation)
parent_design: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
pair_artifact: docs/test-design/harness/L7-release-consumer-dev-start-test-design.md
next_pair_freeze: L7
backprop_decision: required
backprop_decision_reason: consumer 側の identity 失敗表示、同梱資産の解決順、design root 規約は
  PLAN-L6-101 の「Release だけから開発開始」の受入に新しい観測可能な契約を足すため、 PLAN-REVERSE-676 で L6-101
  へ逆向きに戻す。
agent_slots:
  - role: se
    slot_label: Luna worker - PR-1 / PR-2a / PR-2b / PR-2c / PR-3 / PR-G0 / PR-G7 /
      PR-GR / PR-G9〜PR-G14 / PR-VL を別 PR で最小実装する (PR-T1〜T3 は Claude Sonnet が
      docs として移植する)
  - role: qa
    slot_label: Terra - CANDIDATE-U-RCDEV-001..038 の Red oracle を Linux/Windows で先に作る
  - role: tl
    slot_label: Claude Opus / Sol - 同梱資産の provenance、identity 契約との整合の非著者検収
generates:
  - artifact_path: docs/plans/PLAN-L7-676-release-consumer-dev-start.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
  requires:
    - docs/plans/PLAN-L7-529-project-identity-bootstrap.md
    - docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-676-release-consumer-dev-start-backfill.md
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
    - docs/test-design/harness/L7-release-consumer-dev-start-test-design.md
    - docs/governance/vmodel-document-catalog.md
    - docs/governance/vmodel-document-disposition-catalog.md
    - docs/governance/vmodel-document-scale-profiles.md
    - docs/governance/vmodel-semantic-item-catalog.md
    - docs/governance/gate-design.md
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
    - docs/plans/PLAN-L7-166-setup-template-catalog-split.md
    - docs/plans/PLAN-L7-135-dynamic-skill-injection-materialization.md
    - docs/plans/PLAN-L7-18-gate-confirm.md
    - docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/676
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/678
review_evidence: []
status: draft
github_issue_id: 676
admission_receipt:
  schema_version: v2
  receipt_id: certificate:8e2473e3dd9d11fbb553dc79382e5be6
  command_id: plan-revise:issue-676:plan-confirm:plan:r5:77731b7d7052
  admitted_at: 2026-09-25T06:47:33.822Z
  source_digest: sha256:5b50283947b06586cfafae2fe310f5099459829f1c59110481966d7c0517a174
  decision_digest: sha256:0259eaace02f1c0495b23072d3b6fce52b732b04a6568ab8be3281bcd28f68ea
  receipt_digest: sha256:5113402de732edb5e63c1618d335356a9dd31f2865784560938b7330aa7b3552
  binding:
    path: docs/plans/PLAN-L7-676-release-consumer-dev-start.md
    plan_id: PLAN-L7-676-release-consumer-dev-start
    asset_id: plan:aae8bf0e313f8688fbad4d4d8cf0a6a9
    revision: 5
    content_digest: sha256:5b50283947b06586cfafae2fe310f5099459829f1c59110481966d7c0517a174
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 676
    episode_id: E4-676-release-consumer-dev-start
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
    revision: 5
    digest: sha256:e29ead3ced26cd437a348ae5ba8199bf22712b787af002e52875fb9c9a2fa6ea
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-676-release-consumer-dev-start
    target_revision: 5
    phase: forward_merge
  escape_reason: "実装 PR の landing 前に本 PLAN の confirm が必要なため、CI green 後の非著者契約
    review で confirm する手順を §8-4 に記す (rev 5、draft のまま)。#690 (PLAN-L7-690)
    の実装後に、issue binding を projection_state: unprojected で再発行する (全ゼロ digest
    を持ち越さない)。"
---

# PLAN-L7-676: Release consumer で開発を開始できる状態にする

## 1. 目的と位置付け

#418 の release 定義は「clean な第三者プロジェクトが、その Release だけから setup して Claude / Codex で開発を開始できる」である。
2026-09-24 の consumer sweep (空 git repo 2 つ、`setup --solo` 後に初週の主要コマンドを実行) で、PLAN-L7-628 の producer /
installer が揃っても開発開始を止める穴が残ることを確認した (Issue #676 表 A2〜A7 / B1〜B4)。

本 PLAN はその穴のうち、canary.2 で閉じるものを所有する。rev 2 で、PO のスコープ改訂 (§3.5) により設計テンプレート一式・consumer で使える gate G1〜G14・エージェント確認経路の E2E を scope に加えた。PLAN-L7-628 (Release asset と runtime 有効化) とは責務が別であり、
628 の asset 集合・schema・installer 手順を変更しない。本 PLAN は pair-freeze であり、実装・Green・#676 の closure を主張しない。

実測の出典: Issue #676 本文 (consumer sweep の結果表) と、本 PLAN 起票前の read-only 実測 (harness HEAD `67b3c16d`。skills の本数・reader の有無・bundle サイズ・module の所有 PLAN。以下「facts」と呼び、要点は §2 と §3 に転記した)。

facts の主要値: `skills/` は md 79 + `review-checklist.yaml` 1 + `.gitkeep` 1 (subdir 0、計 720,677 bytes)。現行 bundle は 13,137,488 bytes で、skills・テンプレート・vmodel catalog の埋め込みは上限見積り約 +0.75 MB (+5.7%)。

## 2. 現状 (実測)

| # | 事象 | 原因箇所 | 実測 |
| --- | --- | --- | --- |
| A2 | origin 無しで `setup --solo` が identity を作らず exit 0 | `src/cli.ts:4283-4291` が `r.projectIdentity` を出力しない | sweep A2 |
| A3 | A2 の状態で guard / session hook が `repository root could not be resolved` で exit 1 | `src/runtime/repo-root.ts:38-44` | sweep A3。**A2 の状態でのみ発生** (marker が working tree に在れば解決する、L7-529 §2.6) |
| A4 | identity 未 commit で session start が `project_memory_root_project_identity_unavailable` | HEAD-strict read (PLAN-L7-529 §3.1) | sweep A4。setup は `commitRequired:true` を返すが表示しない |
| A5 | setup 後の harness.db が schema v0 | setup が db を初期化しない | sweep A5。`db rebuild` 後 v29 で解消 |
| A6 | 生成 `harness-check.yml` が lock / npm scripts / 有効化済み launcher を前提 | `src/setup/templates.ts:550-551` ほか | sweep A6 |
| A7 | 生成 `commitlint.config.js` が CJS 構文、依存未導入 | `src/setup/templates.ts:573` | sweep A7 |
| B1 | `skill suggest` が空で exit 0 | `src/state-db/projection-writer.ts:2267-2275` / `src/assets/catalog.ts:83-86` が `<repoRoot>/skills` のみ走査 | facts (b) |
| B2 | 設計テンプレートが consumer に届かない | runtime reader が無い (facts (b)) | facts (b) |
| B3 | V-model 文書の置き場所が `docs/design/harness/` 固定 | `src/lint/gate-confirm.ts:93-95` ほか | sweep B2/B4 |
| B4 | `plan lint` が `docs/plans` 不在で ENOENT | `src/plan/lint.ts:124-125` | sweep B1 |
| B5 | 設計テンプレートが L6 機能仕様 1 本だけ (catalog の consumer 向け required slot は 21) | `docs/templates/design/` | rev 2 実測 (§3.5.3) |
| B6 | consumer に `gate-design.md` が無く gate が ENOENT、G8〜G14 は static check 未登録で failed | `src/lint/gate-confirm.ts:93-95`、`src/gate/static.ts:262-268` | rev 2 実測 (§3.6) |

## 3. 設計判断

### 3.1 中身の配送方式 (B1 / B2)

advisor: `ut-tdd advisor --decision design --execute` (2026-09-24、provider=claude、model=`claude-fable-5`、orchestrator が諮問)。
推奨は hybrid (下表 C)。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| A | setup が adapter と同様に skills / テンプレート / catalog を全て consumer の tracked tree へ書く | host runtime が読める。反面、consumer の repo に harness 所有の 80 ファイルが混入し、harness 更新時に consumer 側の差分と区別できない (drift 源) | 棄却 |
| B | installer が Release の clean source tarball を展開して中身を得る | PLAN-L7-628 §1.1 (tarball に依存を詰めない) と §3 (installer は compiled ESM と runtime JSON だけを使う) の frozen 契約に反する | 棄却 |
| **C (採用)** | skills / V-model catalog / 設計・PLAN テンプレートを build 時に compiled ESM へ埋め込む。runtime は bundle を正本とし、consumer 側の同名ファイルがあればそれを優先 (存在確認 1 回)、consumer が追加したファイルは catalog へ merge する。adapter (CLAUDE.md / AGENTS.md / .claude / .codex) は従来どおり setup が書く | Release asset 集合 (628 §3) を変えずに届く。bundle は約 +0.75 MB (+5.7%、facts (c))。provenance は後述の条件で維持できる | 採用 |

#### 3.1.1 実測による採用案の補正 (advisor 回答との差分)

advisor の前提「runtime は bundle から読む」は、skills については **最終 reader が host runtime の filesystem** であるため
そのままでは成立しない。injection は skill の path だけを prompt に書き (`src/runtime/adapter.ts:436-446`)、Claude / Codex が
その path を開く (facts (b))。bundle 内 bytes に対応する実ファイルが無ければ、path は存在しない。

補正 (最小): **skills は bundle を正本とし、`.ut-tdd/assets/skills/` へ展開 (materialize) して path を実在させる**。

補正の再諮問: `ut-tdd advisor --decision design --execute` (2026-09-24、provider=claude、model=`claude-fable-5`、orchestrator が諮問)。
下記の形で採択された。

- 正本は bundle。展開元も bundle であり tarball ではない (628 §1.1 / §3 と衝突しない)。
- 展開は **setup と session start** の 2 か所で行う。展開先の各ファイルを埋め込み bytes の digest と照合し、欠落・不一致の
  ファイルだけを書き直す (一致していれば書き込み 0)。
- 解決順は固定: consumer `skills/<name>` があればそれが勝つ → 無ければ `.ut-tdd/assets/skills/<name>`。consumer `skills/`
  にだけある名前は追加として merge する。投影 (`projectAutomationAssets`) と `src/assets/catalog.ts` はこの単一の解決関数を使う。
- **adapter prompt に書く path は解決後の実在 path** とする (`formatAdapterPrompt` に渡る `required_paths` / `optional_paths` は
  解決関数の出力であり、bundle 内の名前や仮想 path を書かない)。
- 展開ディレクトリは **gitignore 対象の生成 state** である。setup は `.ut-tdd/assets/` を consumer の ignore 対象に入れる
  (`.gitignore` 全般の生成 = sweep B11 は非 scope。本 PLAN は自分が作る展開ディレクトリの ignore だけを所有する)。
- harness 自身 (source 実行 / `skills/` を持つ repo) は consumer 側優先規則により現行と同じ path を返す (挙動不変)。

棄却した補正: skill 本文を prompt へ inline する (PLAN-L7-135 の injection 契約 = path 受け渡しの変更になり、prompt 長が 80 件分膨らむ)。
棄却した補正: 展開先を consumer の tracked tree (例: `skills/`) にする (§3.1 案 A と同じ drift 源になり、consumer 同名優先の区別も消える)。

#### 3.1.2 埋め込みの provenance 条件 (必須)

`buildNodeGeneration` は esbuild metafile の全 input を `git ls-files --error-unmatch` で検査し、その sha256 を receipt の
`source_files` / `source_graph_sha256` へ封印する (`src/runtime/node-bootstrap.ts`、facts (c))。したがって:

- 埋め込み対象の各ファイルは **esbuild の実 input (text loader)** として bundle に入れる。virtual module や、plugin が文字列を
  生成して注入する方式は採らない (skill bytes が receipt に現れず、PLAN-L7-628 の信頼根から外れる)。
- builder の変更は `scripts/build-node.mjs` の loader 設定と、埋め込み index を解決する最小の配線に限る。builder policy
  `compiled-esm-only` と reviewed Node / external import の制約 (PLAN-L7-458) は変えない。builder sha の変化は receipt に正しく記録される。
- source 実行 (`node src/cli.ts`) は `.md` を import できないため、埋め込み index が空のとき reader は repoRoot の filesystem へ
  fallback する (harness 自身の現行挙動)。

#### 3.1.3 テンプレート (B2) の reader

設計 / PLAN / state / prompt テンプレートには現状 runtime reader が無い (facts (b))。埋め込みは **on-demand で
consumer へ雛形を書き出す 1 コマンド** を reader とする場合だけ行う。rev 2 で、書き出し対象は §3.5 で移植する slot テンプレートと optional テンプレートを含む
(書き出し先は §3.2 の resolver が返す `<designRoot>` / `<testDesignRoot>` 配下の catalog path)。コマンドは consumer に既存ファイルがあれば上書きせず、
書き出した path を表示する。コマンドは次のとおり freeze する (rev 3、CLI surface は PR-2c の 1 論点):

- 形: `ut-tdd vmodel template (--slot <doc_type_id>... | --required | --optional <ZIP-DOC-NNN>...) [--dry-run] [--json]`。
  既存の `vmodel` command group の subcommand とする (新しい top-level command は作らない)。`--slot` / `--required` / `--optional` は
  1 つ以上必須で併用可。`--required` は §3.5.3 の required 21 slot 全て。
- 出力先: slot テンプレートは catalog の `authoring_source_path` を §3.2 の resolver で写像した path
  (例: `docs/design/harness/L4-basic-design/data.md` → consumer では `docs/design/L4-basic-design/data.md`)。
  `docs/process/evidence/` など resolver の写像対象外の path はそのまま使う。optional テンプレートは `<designRoot>/optional/<port index の file 名>`。
- 上書き規則: 出力先にファイルが在れば **書かない** (bytes 不変)。上書き option は作らない。
- 表示と終了コード: 書いた path は `+ <path>`、既存で飛ばした path は `skip (exists) <path>` を 1 行ずつ出す。未知の `doc_type_id` /
  `ZIP-DOC-NNN` が 1 件でもあれば、何も書かずに `unknown template <id>` を出して exit 1。それ以外 (全件 skip を含む) は exit 0。
  `--dry-run` は書き込み 0 で同じ行を出す。`--json` は `{written:[], skipped:[]}` を出す。

### 3.2 V-model 文書の置き場所 (B3 / B4)

advisor の例示は「`ut-tdd.project.json` の field (既定 `docs/design`)」だったが、既存の痕跡を実測した。

- `design_root` という field / 設定は repo に存在しない (ローカル変数 2 件のみ、facts (b))。
- `ut-tdd.project.json` は PLAN-L7-529 §3.1 で canonical bytes を厳密に read する identity の正本であり、設定 field を足すと
  identity bytes と digest の意味が変わる。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| A | `ut-tdd.project.json` に `design_root` を追加 | L7-529 の identity 契約改訂が要る。identity と project 設定の責務が混ざる | 棄却 |
| B | 新しい設定ファイル (例: `ut-tdd.config.json`) を作る | 設定正本が 1 つ増える。上書きしたい consumer はまだいない (投機的) | 棄却 (必要になった時点で別 PLAN) |
| **C (採用)** | 規約で解決する単一 resolver: repo root に `docs/design/harness/` があればそれ (harness 自身)、無ければ `docs/design/`。test-design も同様に `docs/test-design/harness/` → `docs/test-design/`。優先順は固定で、`src/assets/catalog.ts:83-86` の `DEFAULT_SKILL_ROOTS` (候補を定数配列で持ち、最初に存在するものを採る) と同じ idiom で書く | 設定を増やさない。harness 自身は挙動不変。上書き手段は無い (必要時に B を別 PLAN で) | 採用 |

案 A の棄却理由 (advisor 判定): PLAN-L7-529 §3.1.3 の canonical bytes 比較と §3.2 の「入力は origin のみ」の create 決定性があるため、
field を足すと identity schema の migration と既存 identity の backfill が必要になる。

- catalog の `authoring_source_path` は `docs/design/harness/<rest>` → `<designRoot>/<rest>`、`docs/test-design/harness/<rest>` →
  `<testDesignRoot>/<rest>` へ写像する。gate / vmodel lint の path 入力は同じ resolver から取る (`gate-confirm.ts:93-95`、
  `screen-impl-pair-freeze.ts:104`、`g1-trace.ts`、`g3-trace.ts`、`l6-completion.ts`、`l7-completion.ts`)。
- 置き場所が存在しない場合は ENOENT で落ちず、typed な「未作成 (0 件)」を返す。`plan lint` も `docs/plans` 不在を 0 件として扱う (B4)。
- gate の判定内容 (G1〜G14 が consumer で意味を持つか) は変えない (非 scope)。本 PLAN は path 解決とクラッシュ除去だけ。
- 諮問: `ut-tdd advisor --decision design --execute` (2026-09-24、provider=claude、model=`claude-fable-5`、orchestrator が諮問)。
  案 C を採択、案 A を上記理由で棄却。

### 3.3 identity / repo-root (A2〜A4)

所有: create / read / commit policy は PLAN-L7-529 (confirmed) が frozen。本 PLAN はその契約を変えない。

- L7-529 §1: create は `origin` 由来の `owner/repo` だけから行い、origin 無しは typed deny。
- L7-529 §3.3 採択 B: setup は暗黙に commit しない。identity は HEAD 到達で authoritative。
- L7-529 §2.6: `isRepoRoot` は marker の存在だけを見る。

諮問: `ut-tdd advisor --decision design --execute` (2026-09-24、provider=claude、model=`claude-fable-5`、orchestrator が諮問)。
下記 1 の方式 (setup を中断しない部分成功) を採択した。草案 r0 の「identity 不可なら何も書かずに exit」は L7-529 §3.2.1
(identity の deny を理由に setup 全体を throw / 中断してはならない) に反するため撤回した。

決定:

1. **A2 (部分成功 + visible typed deny)**: setup は L7-529 §3.2.1 どおり中断しない。adapter / テンプレート / state 記録は通常どおり出力し、
   identity path は `written` に入れない。そのうえで CLI は `SetupResult.projectIdentity` の typed deny を **必ず表示** する
   (現状の `src/cli.ts:4283-4291` はこれを出さない)。表示には deny code と復旧手順を含める:
   `git remote add origin <url>` → `setup` を再実行。再実行は L7-529 §3.2 の再実行規則により既存出力を変えず安全である (no-op safe)。
   §3.2.1 の「identity denial を握り潰して成功扱いにしない」に従い、この場合の終了コードは成功と区別する。rev 3 で次を freeze する:
   - typed deny code: origin 無しは既存の `identity_repository_unbound` (`src/setup/project-identity-bootstrap.ts:84`、message
     `origin remote is missing or invalid`) をそのまま使う。新しい code は足さない。そのほかの deny (`identity_stale_worktree` /
     `identity_write_failed` など L7-529 の code) も同じ経路で表示する。
   - 表示: stderr に `identity: denied (<code>): <message>` の 1 行と、復旧手順 `git remote add origin <url>` および
     `ut-tdd setup --solo` (再実行、no-op safe) の 2 行を出す。
   - 終了コード: identity deny を伴う部分成功は **exit 2**。repo の CLI 規約 (0 = 成功、1 = 入力不正 / 実行失敗、2 = policy による deny / block、
     3 = 外部障害。`src/cli.ts` の既存 `process.exitCode` 用法の実測) の「deny」に当たるため。identity 以外の出力に失敗した場合は従来どおり 1。
2. **A3 (repo-root)**: `isRepoRoot` の fallback 条件は変更しない。identity が作成された setup の後は marker が working tree に存在し
   (L7-529 §2.6 は存在だけを見る)、5 hook 全てが root を解決する。これを oracle で固定する。identity deny のままの consumer では hook が
   引き続き fail-close するが、その error に 1 と同じ復旧手順を併記する。fallback を consumer 向けに緩める案 (`.git` + `.ut-tdd/bin/ut-tdd.mjs` 等) は、
   PLAN-L7-421 の live-tree fence (runtime state の書き込み先を誤認しない) を弱めるため採らない。
3. **A4 (commit 要件)**: 除去しない (L7-529 §3.3 採択 B の改訂になる)。setup は `commitRequired` のとき「commit が必要」と対象 path と
   コマンドを表示する。session start の `project_memory_root_project_identity_unavailable` にも同じ手順を併記する。

**受入条件との関係**: Issue #676 の受入条件「空の git repository (origin なし / あり …) で … guard が正常系を通す」は、origin なしについて
L7-529 §3.2 (create の入力は origin のみ) と両立しない。control lane が #676 の受入条件を Issue 上で改訂し、その旨をコメントする
(改訂コメント: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/676#issuecomment-5809206858 、2026-09-24、advisor `claude-fable-5` の design 判定による)。改訂後の受入条件は「origin の無い repository では setup を中断せず、残りの導入設定を生成し、identity の deny を typed かつ可視に表示し、復旧手順 (`git remote add origin <url>` → setup の再実行) を出す。origin がある repository では guard が正常系を通し禁止系を block する」である。本 PLAN は受入条件を独自に読み替えず、改訂後の Issue 記載を正とする。
origin 以外 (明示 `owner/repo` 入力など) からの create は L7-529 の改訂が要るため本 PLAN の非 scope とする (§7)。

**別 slice**: Issue #678 (launcher の 8.3 短縮名 alias と long path の同一視) は root / path の等価判定に関する troubleshoot であり、
本 PLAN に吸収しない。A3 の oracle は long path の fixture で組み、8.3 alias の等価性は #678 側が所有する。

### 3.4 生成物 (A5〜A7)

1. **A5**: setup の最後に既存の `rebuildHarnessDb` を `skipTokenTelemetry: true` で 1 回呼ぶ (provider 起動時 injection と同じ呼び方、
   `src/cli.ts:368-370`)。token telemetry の home 全走査 (sweep C2) を setup に持ち込まない。identity 未 commit の状態でも rebuild が
   落ちないことを oracle で確認する (落ちるなら A4 と同じ手順表示で degrade を明示する)。
2. **A6**: 諮問: `ut-tdd advisor --decision design --execute` (2026-09-24、provider=claude、model=`claude-fable-5`、orchestrator が諮問)。
   - launcher (`.ut-tdd/bin/ut-tdd.mjs`) 経由の ut-tdd step は、**activation pointer (`.ut-tdd/runtime/activation/active.json`) が存在する場合だけ
     実行** する。存在しない場合は、runtime が未有効化であるため skip したことを job log に **目に見える notice** として出し、step を skip する
     (黙って成功扱いにしない)。CI 上で runtime が有効化されないのは active.json が machine-local だからである (628 §6.2 手順 3、現状は常に exit 78)。
   - npm 部分も同じく consumer の実体に依存させる: `cache: npm` と `npm ci` は `package-lock.json` が在る場合だけ、`npm run <script>` は該当 script が
     在る場合だけ実行する。
   - **CI 上での installer 実行 (Release 取得 → runtime 有効化) は本 PLAN の非 scope** とし、別 PLAN で扱う (Release 取得は外部 API 前提を伴う)。
3. **A7**: `commitlint.config.cjs` を出力する (拡張子で CJS を明示し、`"type":"module"` の consumer でも読める)。既存の
   `commitlint.config.js` がある consumer では上書き・削除せず警告だけを出す。依存 (`@commitlint/cli`、`@commitlint/config-conventional`) は
   setup が install しない (consumer の依存決定であり、network を伴う)。setup の出力と生成文書に導入コマンドを明記する。

### 3.5 スコープ改訂 (rev 2): 設計テンプレート一式・consumer 検証・エージェント確認の E2E

出典:

- PO のスコープ改訂 (2026-09-24): https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/676#issuecomment-5809485588 。
  (a) catalog が required とする全 doc slot の設計テンプレート、(b) consumer で意味のある判定を返す gate G1〜G14 / `vmodel lint` / `plan lint`、
  (c) エージェントが書いた consumer 文書が gate と review を通ることの E2E 観測、を canary.2 のスコープへ移す。受入条件に同じ 3 点を加える。
- PO 判断 (2026-09-24): https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/676#issuecomment-5809861404 。
  テンプレートは新規に書き起こさず、`Vモデル設計ドキュメント_checked.zip` (repo root、gitignore 対象) から移植する。PUBLIC の Pack repo と
  canary.2 Release への同梱 (一般公開) は PO 承認済み。`tools/*.py` は ADR-001 により同梱せず、その検査の意味は TypeScript の gate で実装する。
- license: repo の license は Apache-2.0 へ切り替える (control lane の別 PR)。zip 由来のテンプレート・skill・ガイド・レビュー記録例は Apache-2.0 で配布する。
  本 PLAN は license 切り替え自体を所有せず、PR-T1〜T3 はその切り替えが main に入った後に merge する (配布物の license 表記を切り替え前の条件で出さない)。

rev 1 の §7 にあった「gate G1〜G14 の consumer 対応」と「設計テンプレートの中身の整備」は、本改訂で非 scope から外す。

#### 3.5.1 移植対象 (zip の実測)

zip の中身は read-only で列挙した (entry 名は cp932。`n.encode('cp437').decode('cp932')` で復号)。

| 区分 | zip entry | 件数 / bytes | 移植先 |
| --- | --- | --- | --- |
| 設計テンプレート | `templates/NN_*.yaml` (01〜53、96、102、108、109) | 57 本 / 161,317 B | `docs/templates/vmodel/` (§3.5.2〜3.5.3) |
| 管理 yaml | `templates/{catalog,profiles,traceability,diagrams,wbs}.yaml` | 5 本 / 37,337 B | 既存正本へ統合 (§3.5.4)。別ファイルとしては出荷しない |
| skill | `.claude/skills/vmodel-{authoring,code-minimalism,design-judgement,substance-review,test-thinking,visual-review,workflow}/SKILL.md` | 7 本 / 54,644 B | `skills/vmodel-<name>.md` (フラット、既存 skills root) |
| 役割別ガイド | `build/agent/{architecture,coding,design,marketing,test}.md` | 5 本 / 134,998 B | `skills/vmodel-role-<role>.md` |
| レビュー記録例 | `build/review/RV-00{1..5}_*.md` | 5 本 / 14,002 B | `docs/templates/vmodel/review-examples/` |
| 検査ツール | `tools/*.py` | 27 entry | **同梱しない** (ADR-001)。検査の意味は §3.6 の TS gate で再実装する |

移植合計は約 402 KB。rev 1 の見積り (skills・テンプレート・catalog で約 +0.75 MB) と合わせ、bundle 増分の上限見積りは約 +1.15 MB
(現行 13,137,488 B に対し約 +8.8%)。埋め込みは §3.1.2 の provenance 条件 (esbuild の実 input、git tracked) に従う。

skill の名前は既存 `skills/vmodel-stage-*` / `vmodel-drive-direction` と衝突しない。ただし意味が重なる skill は、PR-T3 で既存 skill と
照合し、同じ内容を 2 本持たない (重複は既存 skill への統合を優先し、PR 本文に対応表を残す)。

#### 3.5.2 テンプレートの形式: Markdown へ変換する

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| A | zip の YAML をそのまま出荷する | 移植は bytes の複製で済み、provenance が単純。反面、gate の文書 parser は Markdown だけを読む (`src/lint/gate-confirm.ts` の `walkMarkdown` は `.md` のみ)。consumer が YAML で書いた文書は gate から見えず、YAML reader を gate 側へ追加すると parser が 2 系統になる | 棄却 |
| **B (採用)** | 各テンプレートを `docs/templates/` 既存形式 (frontmatter + Markdown 見出し / 表) へ変換する。frontmatter に移植元 (`source_id: ZIP-DOC-NNN`、zip entry 名、zip entry の sha256) を記録する | gate と review が同じ Markdown を読み、harness 自身の設計書と同じ形式になる。変換作業が要り、zip との差分は bytes では比較できない (項目単位の対応で担保する) | 採用 |

変換規則 (PR-T で機械的に適用する):

- YAML の section / field 構造を見出しと表に写し、項目名・説明文は zip の日本語をそのまま使う (意味を書き換えない)。
- zip 固有の記法 (tools/*.py 向けの ID 規約、検査用 marker) は、対応する gate の入力形式 (§3.6) に合わせる。対応が無い記法は削らずに
  「未検査」と注記する。
- 変換後の各テンプレートは、テンプレートから作った文書を gate parser (`parseConfirmDoc`) が構造エラー無しで読めることを oracle で確認する。

#### 3.5.3 catalog slot への対応付け

対応の根拠は `docs/governance/vmodel-document-disposition-catalog.md` (109 件: merge 75 / reference 32 / adopt 2) の `target` 列である。
規則: disposition が `merge` / `adopt` で target が catalog slot の authoring path (またはその directory) を指すものを、その slot の
テンプレート source とする。target が harness 自身の process / governance 文書 (`docs/process/*`、`AGENTS.md` など) を指すもの、
および `reference` のものは、**optional テンプレート** (`docs/templates/vmodel/optional/`) として出荷し、slot には束ねない。

consumer 向けの required slot は catalog の `default_status=required` から、harness 自身の upgrade 用差分 (`category=upgrade-delta`:
`DOC-L1-VMODEL-ENGINE-SWAP-DELTA`、`DOC-L14-VMODEL-ENGINE-SWAP-OT`) を除いた 21 slot とする。

| slot | zip source (disposition 根拠) |
| --- | --- |
| `DOC-L0-CHARTER` | 01 企画書 (ZIP-DOC-001 merge → PLAN-L0-01) |
| `DOC-L1-REQUIREMENTS` | 02 要求定義書 (ZIP-DOC-002) |
| `DOC-L2-SCREEN` | 直接の source が無い。04 基本設計書の画面節と `diagrams.yaml` の画面遷移図 (`d_screen`、semantic item catalog) から構成する |
| `DOC-L3-FUNCTIONAL` | 03 要件定義書 (ZIP-DOC-003)、29 受入基準・BDD (ZIP-DOC-029)、43 要求・要件一覧 (ZIP-DOC-043) |
| `DOC-L4-DATA` | 27 ドメインモデル (ZIP-DOC-027) |
| `DOC-L4-ARCHITECTURE` | 18 方式仕様 (ZIP-DOC-018)、32 外部化・差し替え (ZIP-DOC-032)、40 AIエージェント (ZIP-DOC-040) |
| `DOC-L4-EXTERNAL-IF` | 23 入出力 (ZIP-DOC-023)、42 外部連携 (ZIP-DOC-042) |
| `DOC-L4-FUNCTION` | 04 基本設計書 (ZIP-DOC-004) |
| `DOC-L4-UI-STANDARD` | 37 国際化・a11y (ZIP-DOC-037)、41 表示名・翻訳 (ZIP-DOC-041) |
| `DOC-L4-SECURITY` | 10 セキュリティ設計書 (ZIP-DOC-010) |
| `DOC-L5-PHYSICAL-DATA` | 22 データベース (ZIP-DOC-022)、39 イベント・メッセージ (ZIP-DOC-039) |
| `DOC-L5-MODULE` | 05 詳細設計書 (ZIP-DOC-005)、31 共通部品・クラス (ZIP-DOC-031) |
| `DOC-L6-FUNCTION-SPEC` | 既存 `docs/templates/design/L6-function-spec-template.md` を正とし、24 ロジック設計書 (ZIP-DOC-024) の項目で不足分だけ補う |
| `DOC-L7-UNIT-TEST-DESIGN` | 06 単体テスト設計書 (ZIP-DOC-006) |
| `DOC-L8-INTEGRATION-TEST-DESIGN` | 07 結合テスト設計書 (ZIP-DOC-007) |
| `DOC-L9-SYSTEM-TEST-DESIGN` | 08 総合テスト設計書 (ZIP-DOC-008)、102 セキュリティテスト計画 (ZIP-DOC-102) |
| `DOC-L10-UX-VALIDATION` | 51 画面検証 (ZIP-DOC-051)。profile_controlled のため skip 理由欄を持つ |
| `DOC-L11-TRACE-UAT` | 28 検証設計書 (ZIP-DOC-028) と `traceability.yaml` のトレース俯瞰 |
| `DOC-L12-ACCEPTANCE` | 09 受入テスト設計書 (ZIP-DOC-009) |
| `DOC-L13-PRODUCTION-OBSERVATION` | 11 運用設計書 (ZIP-DOC-011) の監視・後検証の節、21 ログ・トレース (ZIP-DOC-021) |
| `DOC-L14-OPERATIONAL-TEST` | 11 運用設計書 (ZIP-DOC-011)、34 保守 (ZIP-DOC-034) |

残りの zip テンプレート (12、13、14、15、16、17、19、20、25、26、30、33、35、36、38、44〜50、52、53、96、108、109) は optional とする。
57 本の全てが「1 つ以上の slot の source」か「optional」のどちらか一方だけに分類され、どちらにも現れない本・両方に現れる本が無いことを port index (PR-T1 が作る `docs/templates/vmodel/README.md` の表) で固定する (11 運用設計書は L13 / L14 の 2 slot の source)。
L2 のように zip に直接の source が無い slot は、PR-T で構成元を PLAN に追記してから書く (新規の書き起こしは既存 source の組み合わせに限る)。

#### 3.5.4 管理 yaml と既存正本 (第 2 の SSoT を作らない)

| zip | 既存正本 | 扱い |
| --- | --- | --- |
| `profiles.yaml` | `docs/governance/vmodel-document-scale-profiles.md` (§0 で「`profiles.yaml` 相当を追跡する authoring source」と宣言済み) | 正本は md のまま。zip との差分は md へ merge する。consumer へは md を bundle 埋め込みで配送し、yaml は出荷しない |
| `catalog.yaml` | `docs/governance/vmodel-document-catalog.md` (ZIP-DOC-017 merge) | 同上 |
| `diagrams.yaml` / `traceability.yaml` / `wbs.yaml` | `docs/governance/vmodel-semantic-item-catalog.md` の item 行 (`d_*` / `trace` / `wbs`) | item 一覧の正本は semantic item catalog。図の雛形 (skeleton) は対応する slot テンプレートの節として取り込む (例: ER 図 → `DOC-L5-PHYSICAL-DATA`) |

consumer に catalog / profile を上書きさせる手段は作らない (§3.2 案 B と同じく、必要になった時点で別 PLAN)。

### 3.6 consumer で使える検証 (gate G1〜G14 / vmodel lint / plan lint)

目標: consumer の文書 (`<designRoot>` / `<testDesignRoot>`、§3.2) に対し、どの gate も ENOENT による「could not run」も
「no deterministic check registered」による failed も返さず、文書の有無・構造・trace に基づく判定を返す。

実測 (rev 2 起票時、HEAD `166bfc37`):

- `src/lint/gate-confirm.ts:93-95` は `docs/governance/gate-design.md` と `docs/design/harness` / `docs/test-design/harness` を固定 path で読む。
  consumer には `gate-design.md` が無く、`readFileSync` が ENOENT で落ちる。
- `src/gate/static.ts` で deterministic check を持つのは G1 / G3 (layer pair と G1/G3-trace lint)、G2 / G4 / G5 / G6 (`evaluateLayerPairGate`)、
  G7 (pair-freeze・L0-L7 group・impl/oracle trace・coverage 80%) である。例外は L245-250 で「deterministic check could not run」の failed になる。
- G8〜G14 は check が未登録で、L262-268 で `applicable:false, passed:false` (「no deterministic check registered」) になる。
  `REVIEW_ONLY_STATIC_GATES` は G0.5 と R4 だけである (L26)。
- G7 の coverage は `coverage/coverage-summary.json` (istanbul json-summary) を既定 path として読む (L193-195)。

決定:

1. **gate 定義の不在**: gate の定義 (`docs/governance/gate-design.md`、`docs/process/gates.md`、`docs/process/vmodel-contract.yaml`) は harness 所有の資産であり、§3.1 案 C と同じく bundle に埋め込む。consumer に同名ファイルがあればそれを優先する。
   gate 判定に使う文書集合は §3.2 の resolver から取る。
2. **G1〜G6**: resolver を注入し、判定内容は変えない。consumer の文書が §3.5 のテンプレートから作られていれば、harness と同じ規則で判定できる。
3. **G7 coverage**: 既定 path (`coverage/coverage-summary.json`) を consumer にもそのまま使う (設定は足さない)。不在は crash ではなく
   typed な「coverage evidence missing」の failed とする。coverage 以外の構成要素 (pair-freeze、trace) は resolver 経由で判定する。
4. **G8〜G14 の判定規則 (freeze)**: 各 gate は、判定内容のうち **repo に tracked された成果物から決定的に判定できる部分** を static check として必ず持つ。
   人の承認・実行時観測の妥当性・UX 判断のように成果物から決まらない部分は review tier (canonical review receipt) で判定し、static check の message に
   `未判定 (review): <approval_role>` を必ず含める (pass に見せない)。G8〜G14 のどれも review-only (n/a passed) へは再分類しない。
   `REVIEW_ONLY_STATIC_GATES` は G0.5 / R4 のまま変えない。

   **判定の入力 (契約表)**: gate ごとの `pair_layers` / `required_artifacts` / `evidence_families` / `case_id_prefix` / `governance_artifact` /
   evidence manifest の置き場所は `docs/process/vmodel-contract.yaml` の `layers[]` 行を唯一の入力とする (VMC-003「detector registry は contract から導出」、
   VMC-005「contract に無いデータは推測せず fail-close」)。consumer では 1 と同じく contract を bundle から読み、consumer に同名ファイルがあればそれを優先する。
   `governance_artifact` と slot path は §3.2 の resolver で consumer の path へ写像する。evidence manifest の置き場所は contract の
   `evidence_manifest` の directory 部分 (例: `.ut-tdd/evidence/g8-integration/`) とし、consumer でも同じ相対 path を使う (tracked であること。
   §3.1.1 の ignore 対象は `.ut-tdd/assets/` だけ)。

   **共通述語** (全 gate に適用。括弧内は対応する zip `tools/*.py` の検査):

   | 記号 | 述語 | 違反時 |
   | --- | --- | --- |
   | S (構造) | `governance_artifact` (resolver 後) が存在し、§3.5 の slot テンプレートが定める必須見出しと case 表の必須列を全て持つ (`schema_check.py`) | `missing slot <doc_type_id>` / `missing section <見出し>` |
   | I (ID) | case 表の各行 ID が `case_id_prefix` で始まり、文書内で一意。本文・表で参照する ID は全て定義済み (`validate.py`) | `duplicate case id` / `dangling reference <id>` |
   | T (V-pair trace) | 各 case 行が `pair_layers` の文書で定義された ID を 1 件以上 cite し、cite 先が全て実在する (`spec_trace.py` の閉包) | `untraced case <id>` / `trace target missing <id>` |
   | E (evidence 型) | `<dir>/*.json` の manifest が 1 件以上あり、全てが次を満たす: `schema_version = "<dir>-evidence-v1"`、`gate = <gate>`、`profile` と `plan_id` が非空、`commands[]` が非空で各要素が `command_id` / `command` / `runner` / `scope` 非空・`exit_code = 0`・`output_digest` が `sha256:<64hex>`・`evidence_path` が repo 内に実在し許可 prefix (`.ut-tdd/evidence/` / `docs/` / `src/` / `tests/`) 配下。`mandatory_<id>s` の各 ID に `coverage[]` があり `status = passed`・`evidence_paths` と `command_ids` が非空で実在・既知。`exit_criteria` が `all_mandatory_passed = true`・`failed_mandatory_count = 0`・`stale_defer_count = 0`・`doctor_check = "<dir>-workflow"` | `<manifest>: <field> ...` (既存 `src/lint/g8-integration-workflow.ts` の message 形式) |
   | F (全行) | S の case 表で定義された全 ID が、manifest の `mandatory_<id>s` (coverage passed) か `deferred_<id>s` のどちらかにある。deferred の各 ID は `defer[]` に `reason` 非空と、`docs/plans/` に実在する `plan_id` を持つ (実在しない PLAN への defer は stale) | `missing row evidence <id>` / `stale defer <id>` |
   | A (必須成果物) | manifest の `artifacts` object が contract の `required_artifacts` の全 key を持ち、各値が repo 内に実在する path | `missing artifact <key>` |

   harness 自身 (resolver が `docs/design/harness/` を返す repo) の G8 / G9 / G10 は、既存の workflow lint (`src/lint/g8-integration-workflow.ts` /
   `g9-system-workflow.ts` / `g10-ux-workflow.ts`) の判定をそのまま使う (family prefix 要件と workflow marker 要件を含め、結果を変えない)。
   共通述語は consumer の G8〜G14 と、harness の G11〜G14 に適用する。consumer では family prefix (例: `IT-MODULE-`) は harness 固有の分類であるため
   要求せず、F (全行) で代える。

   **gate 別の述語** (contract 行の値を具体化したもの):

   | gate | S の対象 slot | I の prefix | T (pair) | E の `<dir>` | A (`required_artifacts`) | gate 固有の追加述語 | review tier (`approval_role`) | PR |
   | --- | --- | --- | --- | --- | --- | --- | --- | --- |
   | G8 | `DOC-L8-INTEGRATION-TEST-DESIGN` | `IT-` | L5 (`DOC-L5-MODULE` / `DOC-L5-PHYSICAL-DATA` の ID) | `g8-integration` | `integration_manifest`, `integration_results` | なし | QA/TL | PR-GR |
   | G9 | `DOC-L9-SYSTEM-TEST-DESIGN` | `ST-` | L4 (`DOC-L4-*` の ID) | `g9-system` | `system_manifest`, `system_results` | case 表の各行が `evidence_families` (`ST` / `performance` / `security`) のいずれかを `family` 列に持ち、3 family の全てに 1 行以上ある | QA/TL | PR-G9 |
   | G10 | `DOC-L10-UX-VALIDATION` | `UXV-` | L2 (`DOC-L2-SCREEN` の画面 ID) | `g10-ux` | `ux_manifest`, `browser_visual_a11y_results` | slot 文書の frontmatter が `status: skipped` の場合は、`skip_reason` 非空かつ scale profile (`vmodel-document-scale-profiles.md`) で当該 slot が有効でないときだけ n/a passed。それ以外の skip は failed | PO/QA | PR-G10 |
   | G11 | `DOC-L11-TRACE-UAT` (evidence 文書) | `UAT-` | L1 / L3 / L4 / L5 / L6 / L7 (pair reciprocity 例外。contract `pair_reciprocity_exceptions`) | `g11-uat` | `end_to_end_trace_review`, `po_uat_decision` | `end_to_end_trace_review` が `DOC-L3-FUNCTIONAL` で定義された全要件 ID を `traced` / `blocked` で列挙し、`blocked` が 0。`po_uat_decision` は `decision` (`accept` / `reject`)・`decided_by_role`・`revision` を持つ (承認の中身は review tier) | PO/TL | PR-G11 |
   | G12 | `DOC-L12-ACCEPTANCE` | `AT-` | L3 (`DOC-L3-FUNCTIONAL` の要件 / AC ID) | `g12-acceptance` | `deploy_receipt`, `acceptance_results`, `rollback_readiness` | `deploy_receipt` が `revision` (40 桁 hex) と `environment` を持ち、`rollback_readiness` が `rollback_command` と `verified_at` を持つ | PO/TL | PR-G12 |
   | G13 | `DOC-L13-PRODUCTION-OBSERVATION` (evidence 文書) | `SMOKE-` | L12 (pair reciprocity 例外。各行が `AT-` ID を cite) | `g13-post-deploy` | `production_smoke`, `sli_slo_observation`, `rollback_decision` | `sli_slo_observation` が `window_start` / `window_end` (ISO 8601、start < end) と SLO ごとの `target` / `observed` を持つ。`rollback_decision` が `decision` (`keep` / `rollback`) を持つ | PO/TL | PR-G13 |
   | G14 | `DOC-L14-OPERATIONAL-TEST` | `OT-` | L1 (`DOC-L1-REQUIREMENTS` の ID) と L0 (`DOC-L0-CHARTER` の目的 ID) | `g14-operational` | `operational_results`, `value_results`, `improvement_feedback` | `VALUE` family の行が L0 の目的 ID を 1 件以上 cite し、`improvement_feedback` の各項目が `routed_to` (PLAN ID または Issue URL) を持つ | PO | PR-G14 |

   G11 / G13 の slot は test design ではなく process evidence (catalog `category=process-evidence`、authoring path `docs/process/evidence/`) であり、
   resolver の写像対象外 (catalog path をそのまま使う)。

   zip `tools/*.py` のうち上の述語に対応しないもの (`review.py` の実体サンプリング、`consistency.py` の表記ゆれ、`impact.py` の影響範囲など) は
   gate には入れず、各 PR-G の PR 本文に「未移植」として列挙する。gate に追加する場合は本 PLAN の改訂へ戻る。

5. **vmodel lint / plan lint**: `vmodel lint` は resolver から文書集合を取り、文書が在れば件数と trace 結果を、無ければ typed な「未作成」を返す。
   `plan lint` は rev 1 の §3.2 (`docs/plans` 不在を 0 件) のとおり。
6. **tools/*.py の検査意味**: zip の Python 検査のうち、上の static check に対応するものは各 PR-G で TypeScript として実装する。
   対応が無い検査は PR-G の PR 本文に「未移植」として列挙し、黙って落とさない。
7. **harness 自身の回帰**: harness repo での G1〜G10 の判定結果は本改訂の前後で変わらない (oracle で固定。G8〜G10 は既存 workflow lint を使うため)。
   G11〜G14 は harness でも共通述語が動くようになるため結果が変わりうる。その差分は PR-G11〜PR-G14 ごとに PR 本文へ記録する。

### 3.7 エージェント確認経路の E2E (PLAN-L7-531 所有)

PLAN-L7-531 の入力契約改訂 (別 PR) で、次を E2E 観測項目に加える。本 PLAN は観測の前提 (テンプレート配送、resolver、consumer gate) を所有し、
E2E 自体と ID は 531 が所有する。

- clean consumer fixture で、エージェント (Claude または Codex) が §3.5 のテンプレートから L1〜L7 のいずれかの文書を書く。
- その文書に対し該当 gate が applicable:true の判定を返し、文書を正しく書いた場合は pass、必須 slot を欠いた場合は該当 slot 名付きで fail する。
- 同じ文書が非著者 review (canonical な review 経路) を通り、receipt が exact revision に束縛される。

## 4. PR 分割と順序

| PR | 論点 | 触る主な module | 前提 |
| --- | --- | --- | --- |
| PR-0 | 本 PLAN + PLAN-REVERSE-676 + pair test-design の pair-freeze (docs のみ) | docs | #676 受入条件の改訂コメント (§3.3、記録済み) |
| PR-1 | identity / repo-root: A2 部分成功 + typed deny 表示 + 復旧手順、A4 の commit 手順表示、hook error の復旧手順、A3 の setup 後 root 解決 oracle | `src/cli.ts` setup 表示、hook / session start の error 文言 | PR-0 PASS |
| PR-2a | skills の bundle 埋め込み + setup / session start での digest 照合付き展開 + 解決関数 + `.ut-tdd/assets/` の ignore (B1) | `scripts/build-node.mjs`、埋め込み index 1 module、`src/state-db/projection-writer.ts`、`src/assets/catalog.ts` | PR-0 PASS、PLAN-L7-628 PR-1 merge |
| PR-2b | design root resolver + catalog 写像 + gate / vmodel lint の path 入力 + `plan lint` 不在耐性 (B3 / B4) | resolver 1 module、`src/lint/gate-confirm.ts` ほか、`src/plan/lint.ts` | PR-0 PASS |
| PR-2c | テンプレートの埋め込み + on-demand 書き出しコマンド `ut-tdd vmodel template` (B2、§3.1.3) | 埋め込み index への追加、CLI 1 コマンド | PR-2a merge (埋め込み機構を再利用)、PR-T1 merge と PR-T2 merge (`--required` と `--optional` の書き出し対象) |
| PR-3 | 生成物: A5 db 初期化、A6 harness-check (activation pointer 条件 + notice)、A7 commitlint | `src/setup/index.ts`、`src/setup/templates.ts` | PR-1 merge |
| PR-T1 | required 21 slot のテンプレート移植 (Markdown 変換、provenance frontmatter) + port index (§3.5.3) | `docs/templates/vmodel/` (docs、Claude) | PR-0 PASS、Apache-2.0 切り替え PR の merge |
| PR-T2 | optional テンプレート 27 本の移植 + 管理 yaml の既存正本への merge (§3.5.4) | `docs/templates/vmodel/optional/`、`docs/governance/vmodel-document-*.md` (docs、Claude) | PR-T1 merge |
| PR-T3 | skill 7 本・役割別ガイド 5 本・レビュー記録例 5 本の移植と SKILL_MAP 登録 (既存 skill との重複照合) | `skills/`、`docs/templates/vmodel/review-examples/` (docs、Claude) | PR-0 PASS |
| PR-G0 | gate-design.md の埋め込みと consumer 優先、G1〜G6 への resolver 注入、harness 回帰固定 (§3.6-1/2/7) | `src/lint/gate-confirm.ts`、`src/gate/static.ts` (Codex) | PR-2b merge、PR-T1 merge (fixture にテンプレートを使う) |
| PR-G7 | G7 coverage の既定 path と不在の typed failed (§3.6-3) | `src/gate/static.ts` の G7 (Codex) | PR-G0 merge |
| PR-GR | 共通述語 S / I / T / E / F / A の evaluator (contract 行から導出) + G8 の登録 (§3.6-4) | right-arm evaluator 1 module (Codex) | PR-G0 merge |
| PR-G9 | G9 の登録と family 述語 | G9 の登録 (Codex) | PR-GR merge |
| PR-G10 | G10 の登録と skip 述語 | G10 の登録 (Codex) | PR-GR merge |
| PR-G11 | G11 の登録と trace review / UAT decision 述語 | G11 の登録 (Codex) | PR-GR merge |
| PR-G12 | G12 の登録と deploy / rollback 述語 | G12 の登録 (Codex) | PR-GR merge |
| PR-G13 | G13 の登録と観測窓 / rollback decision 述語 | G13 の登録 (Codex) | PR-GR merge |
| PR-G14 | G14 の登録と VALUE trace / feedback routing 述語 | G14 の登録 (Codex) | PR-GR merge |
| PR-VL | `vmodel lint` の resolver 対応と typed 未作成 (§3.6-5) | vmodel lint (Codex) | PR-2b merge |
| (531) | PLAN-L7-531 の E2E 観測項目に本 PLAN のコマンド群とエージェント確認経路 (§3.7) を追加 (531 の入力契約改訂、別 PR) | docs / tests | 本 PLAN の全 PR merge + 下表の外部前提 |

PR-1 → PR-3 は setup 本体を共有するため直列。PR-2a / PR-2b / PR-T1 / PR-T3 は独立で並列可。PR-2c は PR-2a と PR-T1 と PR-T2 の merge 後
(`--required` / `--optional` の書き出し対象が揃ってから CLI を出すため)。PR-G0 は PR-2b と PR-T1 の後に置き、PR-G7 と PR-GR は PR-G0 の後で並列可。
PR-GR は PR-G0 の後、PR-G9〜PR-G14 は PR-GR の後で相互に並列可。PR-VL は PR-2b の後で PR-G 系と並列可。PR-G 系は 1 PR = 1 gate (共通 evaluator は PR-GR の 1 module、各 gate PR は登録と gate 固有述語 + 対のテスト + 最小配線) とし、
scope 構造 FLAG は close → 分割再出。PR-T 系は docs のみで source_module を追加しない。

外部 PR / Issue との前提関係 (rev 3):

| 本 PLAN の PR | PLAN-L7-628 PR-1 producer (#670) | PLAN-L7-628 PR-2 installer | launcher 8.3 alias (#678) | license Apache-2.0 (#682) |
| --- | --- | --- | --- | --- |
| PR-1 / PR-3 | 不要 (source 実行で検証) | 不要 (PR-3 の A6 は 628 §6.2 の `active.json` path を参照するだけ。628 が path を変えたら PR-3 が追従) | 不要 | 不要 |
| PR-2a / PR-2c | **必須** (bundle 起動の oracle が producer の build に依存) | 不要 (bundle を直接起動する) | 不要 | 不要 |
| PR-2b / PR-G0 / PR-G7 / PR-GR / PR-G9〜PR-G14 / PR-VL | 不要 | 不要 | 不要 | 不要 |
| PR-T1〜PR-T3 | 不要 | 不要 | 不要 | **必須** (配布物の license 表記) |
| PLAN-L7-531 E2E (本 PLAN §3.7 の観測) | **必須** | **必須** (Release から install した consumer で観測する) | **必須** (Windows の E2E で launcher が 8.3 alias を誤拒否しないこと) | **必須** |

## 5. 完了条件

1. PR-1: origin 無しの空 repo で setup が中断せず identity 以外の出力を完了し、`identity_repository_unbound` と復旧手順を表示し、exit 2 を返す。
   origin 追加後の再実行で identity が作られ、既存出力は変わらない。origin ありの setup 後、work-guard / agent-guard / session start / session summary /
   subagent-stop が root を解決する。`commitRequired` 時に commit 手順が表示される
   (CANDIDATE-U-RCDEV-001..005 Green)。
2. PR-2a: bundle 起動の consumer で `skill suggest` が非空を返し、adapter prompt に書かれる path が全て解決後の実在 path であり、consumer の同名 skill が優先され、
   追加 skill が merge され、展開物が digest 照合され、`.ut-tdd/assets/` が git の ignore 対象になる。
   receipt の `source_files` が埋め込んだ全 skill を含む (CANDIDATE-U-RCDEV-006..010 Green)。
3. PR-2b: consumer (`docs/design/`) と harness (`docs/design/harness/`) の双方で resolver が正しい root を返し、置き場所不在で gate / vmodel lint /
   plan lint が ENOENT で落ちない (CANDIDATE-U-RCDEV-011..013 Green)。
4. PR-2c: テンプレート書き出し (`--required` と `--optional` の両方) が既存ファイルを上書きせず、bundle 埋め込み bytes と一致する (CANDIDATE-U-RCDEV-014 / 015 / 038 Green)。
5. PR-3: setup 直後の db が現行 schema で session start digest が DEGRADED にならない。lock / scripts の無い consumer で生成 workflow が npm 前提 step を実行せず、
   activation pointer の無い CI では ut-tdd step が notice を出して skip する。
   ESM consumer で commitlint 設定が読める (CANDIDATE-U-RCDEV-016..018 Green)。
6. 各 PR で Linux / Windows / aggregate CI Green、成果物を書いていない族の canonical non-author closing receipt を exact revision に束縛。
7. PR-T1〜T3: required 21 slot の全てに provenance 付きテンプレートがあり、57 本が port index で漏れ・重複なく分類され、テンプレートから作った文書を
   gate parser が読め、zip の管理 yaml と `tools/*.py` が別ファイルとして出荷されない (CANDIDATE-U-RCDEV-019..025 Green)。
8. PR-G0〜PR-VL: consumer fixture で gate G1〜G14・`vmodel lint`・`plan lint` の全てが、ENOENT の「could not run」も「no deterministic check registered」も
   返さず、§3.6-4 の述語に基づく判定を返す。harness 自身の G1〜G10 の判定は不変 (CANDIDATE-U-RCDEV-026..037 Green)。
9. #676 の受入 (空 repo からの開発開始、エージェントが書いた文書が gate と review を通ること) は PLAN-L7-531 の E2E で観測する。本 PLAN は unit / integration まで。

## 6. TDD / trace / Reverse

候補 oracle `CANDIDATE-U-RCDEV-001..038` は pair test-design が所有し、実装 PR で同番号の `U-RCDEV-*` へ 1:1 昇格する。
既存 `CANDIDATE-U-PACKRT-*` (628)、L7-529 の identity oracle、`CANDIDATE-ST-PACKCANARY-*` を再採番・再所有しない。

R1: PLAN-L6-101 の source 非依存受入と、L7-529 の create / commit policy を照合する。R2: 同梱資産の解決順・design root 規約・
setup 失敗表示を同一 implementation revision に束縛する。R3: 非著者 review で、埋め込み bytes の provenance 欠落、consumer 同名 skill による
injection path の乗っ取り、harness 自身の挙動変化、部分 setup の残留を攻撃する。R4: 不足差分だけを L6-101 へ backfill する。

## 7. 非 Scope (別 issue)

- gate の判定内容そのものの変更 (G1〜G7 の規則、FR-13 のサインオフ定義)。本 PLAN は consumer で判定を動かすこと (§3.6) だけを所有する。
- テンプレートの新規書き起こし (zip に source の無い内容を足すこと。§3.5.3 の L2 のような構成は既存 source の組み合わせに限る)。
- `tools/*.py` の同梱と Python runtime (ADR-001)。
- catalog / profile / gate 定義を consumer が設定で上書きする手段 (§3.5.4、§3.2 案 B)。
- `review --uncommitted` の `node src/cli.ts doctor` 推奨、route-map 不在 (sweep B9)、`.ut-tdd/teams/*.yaml` / `npm run lint` / `.gitignore` 不在 (sweep B6 / B8 / B10 / B11)、
  生成文書の `ut-tdd` PATH 表記 (B12)。
- origin 以外からの identity create (L7-529 の改訂が要る。§3.3)。
- CI 上での installer 実行 / runtime 有効化 (別 PLAN。§3.4-2)。
- launcher の 8.3 短縮名 alias と long path の等価判定 (Issue #678、別 troubleshoot slice)。
- design root の設定による上書き (§3.2 案 B)。
- Release asset 集合・installer (PLAN-L7-628)、update / rollback (#364)。

## 8. 実装開始条件

1. 本 PLAN と PLAN-REVERSE-676 の pair-freeze に非著者 PASS receipt と CI Green が揃うこと。
2. §3.3 の #676 受入条件改訂コメントの URL、setup の deny code と終了コード (§3.3-1)、テンプレート書き出しコマンド (§3.1.3)、G8〜G14 の述語 (§3.6-4) は記録済み (PR-0 rev 3)。
3. 実装中に方式変更 (解決順、展開先、resolver 規約、setup の失敗条件、テンプレート形式、書き出しコマンド §3.1.3、setup の終了コード §3.3-1、gate の述語 §3.6-4) が必要になったら、PR を close して本 PLAN の契約改訂へ戻る。
4. confirm の手順 (rev 5): 本 PLAN の実装 PR は src/ tests/ に新規ファイルを landing させるため、`deliverable-plan-trace` により `generates` への宣言が必須であり、`merged-plan-status` により draft PLAN はその宣言を持てない。したがって、実装 PR より先に本 PLAN を confirm する。pair-freeze review (PR #680 の Sol r3 PASS、subject f65031c9) は、その head の CI green (2026-09-24T09:00:46Z) より前 (08:46Z) に取られたため、正直な `tests_green_at` を持てず、confirm の証跡にしない。代わりに、本 rev 5 の exact head の CI green の後に、非著者 (Codex Sol) の契約 review を取り直し、その receipt を `review_evidence` に記録した rev 6 で confirm する。rev 6 の docs 差分は bounded 再検を経て merge する。実装 PR は、confirm の merge 後に main を取り込み、自 PR の新規成果物だけを confirmed の本 PLAN の `generates` に追加する (既存ファイルは載せない)。
