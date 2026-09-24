---
plan_id: PLAN-L7-676-release-consumer-dev-start
title: "PLAN-L7-676 (add-impl): Release consumer で開発を開始できる状態にする (identity / 同梱資産
  / 生成物)"
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
    slot_label: Luna worker - PR-1 / PR-2a / PR-2b / PR-2c / PR-3 を別 PR で最小実装する
  - role: qa
    slot_label: Terra - CANDIDATE-U-RCDEV-001..018 の Red oracle を Linux/Windows で先に作る
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
  receipt_id: certificate:aae8bf0e313f8688fbad4d4d8cf0a6a9
  command_id: plan-draft:issue-676:release-consumer-dev-start:forward:1
  admitted_at: 2026-09-24T06:00:00.000Z
  source_digest: sha256:6159474b4832bde4e93e23407b22472f3548409e4a5580dec8d9ea4e369d5030
  decision_digest: sha256:c810b3efd4468b6e8f90c0064082402f2b0df4b1daacd6d1e000610cd15b64e4
  receipt_digest: sha256:98ff9312a07425b48bb40893cb1e2fe20439b8c68446c1fc6971365ecc1a3ef1
  binding:
    path: docs/plans/PLAN-L7-676-release-consumer-dev-start.md
    plan_id: PLAN-L7-676-release-consumer-dev-start
    asset_id: plan:aae8bf0e313f8688fbad4d4d8cf0a6a9
    revision: 1
    content_digest: sha256:6159474b4832bde4e93e23407b22472f3548409e4a5580dec8d9ea4e369d5030
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 676
    episode_id: E4-676-release-consumer-dev-start
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
    revision: 5
    digest: sha256:e29ead3ced26cd437a348ae5ba8199bf22712b787af002e52875fb9c9a2fa6ea
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-676-release-consumer-dev-start
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #676: consumer sweep で、PLAN-L7-628 の producer / installer
    が揃っても Release consumer が開発を開始できない穴 (identity 表示・同梱資産・design root・生成物)
    を確認した。canary.2 で閉じる add-impl の pair-freeze。"
---

# PLAN-L7-676: Release consumer で開発を開始できる状態にする

## 1. 目的と位置付け

#418 の release 定義は「clean な第三者プロジェクトが、その Release だけから setup して Claude / Codex で開発を開始できる」である。
2026-09-24 の consumer sweep (空 git repo 2 つ、`setup --solo` 後に初週の主要コマンドを実行) で、PLAN-L7-628 の producer /
installer が揃っても開発開始を止める穴が残ることを確認した (Issue #676 表 A2〜A7 / B1〜B4)。

本 PLAN はその穴のうち、canary.2 で閉じるものを所有する。PLAN-L7-628 (Release asset と runtime 有効化) とは責務が別であり、
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

設計 / PLAN / state / prompt テンプレートには現状 runtime reader が無い (facts (b))。YAGNI により、埋め込みは **on-demand で
consumer へ雛形を書き出す 1 コマンド** を reader とする場合だけ行う。コマンドは consumer に既存ファイルがあれば上書きせず、
書き出した path を表示する。コマンド名・引数は PR-2c の範囲で決め、PLAN に追記してから実装する (CLI surface = 1 論点)。

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
   §3.2.1 の「identity denial を握り潰して成功扱いにしない」に従い、この場合の終了コードは成功と区別する (具体値は PR-1 で既存 setup の
   終了コード規約に合わせて freeze し、本節へ追記する)。
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

## 4. PR 分割と順序

| PR | 論点 | 触る主な module | 前提 |
| --- | --- | --- | --- |
| PR-0 | 本 PLAN + PLAN-REVERSE-676 + pair test-design の pair-freeze (docs のみ) | docs | #676 受入条件の改訂コメント (§3.3、記録済み) |
| PR-1 | identity / repo-root: A2 部分成功 + typed deny 表示 + 復旧手順、A4 の commit 手順表示、hook error の復旧手順、A3 の setup 後 root 解決 oracle | `src/cli.ts` setup 表示、hook / session start の error 文言 | PR-0 PASS |
| PR-2a | skills の bundle 埋め込み + setup / session start での digest 照合付き展開 + 解決関数 + `.ut-tdd/assets/` の ignore (B1) | `scripts/build-node.mjs`、埋め込み index 1 module、`src/state-db/projection-writer.ts`、`src/assets/catalog.ts` | PR-0 PASS、PLAN-L7-628 PR-1 merge |
| PR-2b | design root resolver + catalog 写像 + gate / vmodel lint の path 入力 + `plan lint` 不在耐性 (B3 / B4) | resolver 1 module、`src/lint/gate-confirm.ts` ほか、`src/plan/lint.ts` | PR-0 PASS |
| PR-2c | テンプレートの埋め込み + on-demand 書き出しコマンド (B2) | 埋め込み index への追加、CLI 1 コマンド | PR-2a merge (埋め込み機構を再利用) |
| PR-3 | 生成物: A5 db 初期化、A6 harness-check (activation pointer 条件 + notice)、A7 commitlint | `src/setup/index.ts`、`src/setup/templates.ts` | PR-1 merge |
| (531) | PLAN-L7-531 の E2E 観測項目に本 PLAN のコマンド群を追加 (531 の入力契約改訂、別 PR) | docs / tests | PR-1〜PR-3 merge |

PR-1 → PR-3 は setup 本体を共有するため直列。PR-2a / PR-2b は独立で並列可。1 PR = 1 論点を守り、scope 構造 FLAG は close → 分割再出。

## 5. 完了条件

1. PR-1: origin 無しの空 repo で setup が中断せず identity 以外の出力を完了し、typed identity deny と復旧手順を表示し、成功と区別される終了コードを返す。
   origin 追加後の再実行で identity が作られ、既存出力は変わらない。origin ありの setup 後、work-guard / agent-guard / session start / session summary /
   subagent-stop が root を解決する。`commitRequired` 時に commit 手順が表示される
   (CANDIDATE-U-RCDEV-001..005 Green)。
2. PR-2a: bundle 起動の consumer で `skill suggest` が非空を返し、adapter prompt に書かれる path が全て解決後の実在 path であり、consumer の同名 skill が優先され、
   追加 skill が merge され、展開物が digest 照合され、`.ut-tdd/assets/` が git の ignore 対象になる。
   receipt の `source_files` が埋め込んだ全 skill を含む (CANDIDATE-U-RCDEV-006..010 Green)。
3. PR-2b: consumer (`docs/design/`) と harness (`docs/design/harness/`) の双方で resolver が正しい root を返し、置き場所不在で gate / vmodel lint /
   plan lint が ENOENT で落ちない (CANDIDATE-U-RCDEV-011..013 Green)。
4. PR-2c: テンプレート書き出しが既存ファイルを上書きせず、bundle 埋め込み bytes と一致する (CANDIDATE-U-RCDEV-014..015 Green)。
5. PR-3: setup 直後の db が現行 schema で session start digest が DEGRADED にならない。lock / scripts の無い consumer で生成 workflow が npm 前提 step を実行せず、
   activation pointer の無い CI では ut-tdd step が notice を出して skip する。
   ESM consumer で commitlint 設定が読める (CANDIDATE-U-RCDEV-016..018 Green)。
6. 各 PR で Linux / Windows / aggregate CI Green、成果物を書いていない族の canonical non-author closing receipt を exact revision に束縛。
7. #676 の受入 (空 repo からの開発開始) は PLAN-L7-531 の E2E で観測する。本 PLAN は unit / integration まで。

## 6. TDD / trace / Reverse

候補 oracle `CANDIDATE-U-RCDEV-001..018` は pair test-design が所有し、実装 PR で同番号の `U-RCDEV-*` へ 1:1 昇格する。
既存 `CANDIDATE-U-PACKRT-*` (628)、L7-529 の identity oracle、`CANDIDATE-ST-PACKCANARY-*` を再採番・再所有しない。

R1: PLAN-L6-101 の source 非依存受入と、L7-529 の create / commit policy を照合する。R2: 同梱資産の解決順・design root 規約・
setup 失敗表示を同一 implementation revision に束縛する。R3: 非著者 review で、埋め込み bytes の provenance 欠落、consumer 同名 skill による
injection path の乗っ取り、harness 自身の挙動変化、部分 setup の残留を攻撃する。R4: 不足差分だけを L6-101 へ backfill する。

## 7. 非 Scope (別 issue)

- gate G1〜G14 の consumer 対応 (G8〜G14 は静的チェック未登録で failed、`src/gate/static.ts:262-268`)。本 PLAN は path 解決とクラッシュ除去だけ。
- 設計テンプレートの中身の整備 (catalog が required とする L1〜L5 設計 / L7〜L14 テスト設計の約 20 種)。本 PLAN は既存テンプレートの配送だけ。
- `review --uncommitted` の `node src/cli.ts doctor` 推奨、route-map 不在 (sweep B9)、`.ut-tdd/teams/*.yaml` / `npm run lint` / `.gitignore` 不在 (sweep B6 / B8 / B10 / B11)、
  生成文書の `ut-tdd` PATH 表記 (B12)。
- origin 以外からの identity create (L7-529 の改訂が要る。§3.3)。
- CI 上での installer 実行 / runtime 有効化 (別 PLAN。§3.4-2)。
- launcher の 8.3 短縮名 alias と long path の等価判定 (Issue #678、別 troubleshoot slice)。
- design root の設定による上書き (§3.2 案 B)。
- Release asset 集合・installer (PLAN-L7-628)、update / rollback (#364)。

## 8. 実装開始条件

1. 本 PLAN と PLAN-REVERSE-676 の pair-freeze に非著者 PASS receipt と CI Green が揃うこと。
2. §3.3 の #676 受入条件改訂コメントの URL は記録済み (PR-0)。PR-1 で freeze する setup 終了コードを、PR-1 の実装着手前に本 PLAN §3.3 へ追記すること。
3. 実装中に方式変更 (解決順、展開先、resolver 規約、setup の失敗条件) が必要になったら、PR を close して本 PLAN の契約改訂へ戻る。
