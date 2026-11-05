---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_consumer_generated_instructions
pair_artifact: docs/test-design/harness/L7-consumer-generated-instructions-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1524
---

> **L6 contract marker**: 本書は setup が consumer に生成する指示文 (managed block・`.claude/commands/*`・生成 workflow・生成 agent text) の呼び出し表記の契約である (未実装の目標契約)。oracle (CANDIDATE-U-CGENI-001〜) は `docs/test-design/harness/L7-consumer-generated-instructions-test-design.md` が固定する。行番号は 2026-11-04 の `origin/main` で測った。

# consumer 生成指示文の呼び出し表記 — 関数設計 (issue #1524)

## 1. 目的

consumer の実運用で、生成された managed block と生成コマンドが、consumer に無い global の `ut-tdd` と `npm run` を前提にしていることを観測した。consumer が持つのは checkout ごとの launcher (`node .ut-tdd/bin/ut-tdd.mjs`) だけである。生成物の表記を 1 つに揃え、そのまま実行できる状態にする。

対象は consumer へ生成される文面だけである。このリポジトリ自身の `CLAUDE.md` / `AGENTS.md` は対象外とする。

## 2. 前提 (実測)

| 前提 | 根拠 |
| --- | --- |
| managed block 本文、コマンド雛形、`.claude/commands` 本文が bare の `ut-tdd ...` を書いている | `src/setup/templates.ts:42`、`:106-113`、`:138-144`、`:172-177`、`:369`、`:380` |
| 生成コマンド (test) は `npm run typecheck` / `npm run lint` を無条件に要求する | `src/setup/templates.ts:380` |
| consumer の runtime は launcher を生成する (`common/ut-tdd.mjs`) | `src/setup/templates.ts:99`、`:509-511` |
| 生成 workflow は launcher 経由で、doctor を `--setup-smoke` 形で呼ぶ | `src/setup/templates.ts:433`、`:446`、`:452` |
| doctor は 2 つの表記を受け付ける。`--setup-smoke` は `--profile consumer-setup-smoke` と同じ profile に解決される | `src/cli.ts:747-750`、`src/doctor/profiles.ts:201-208`、`:234-237` |
| Pack の CI 方針 lint は、`pack` profile の workflow (role `pack_template`) にだけ `doctor --setup-smoke` の文字列を要求する。生成 workflow (role `setup_builtin`) と `source_template` には Pack の必須段・禁止段を適用しない | `src/lint/github-ci-policy.ts:150-151`、`:185-188`、`:1064-1071`、`:1196` |
| 生成 workflow の `npm run typecheck` / `npm run test` は、`package.json` があり、かつその script が定義されているときだけ実行される (script ごとの確認を既に持つ) | `src/setup/templates.ts:436-437`、`:441-442` |
| adapter の文面は `docs/templates/adapter/` にも置かれ、setup の生成と同じ本文を持つ | `docs/templates/adapter/AGENTS.md`、`docs/templates/adapter/CLAUDE.md` |

## 3. 契約

### 3.1 launcher 接頭辞

生成物が CLI を呼ぶときは `node .ut-tdd/bin/ut-tdd.mjs <args>` とし、bare の `ut-tdd <args>` は書かない。接頭辞は生成器の定数 1 個 (`CONSUMER_CLI_PREFIX = "node .ut-tdd/bin/ut-tdd.mjs"`) から作り、文面は `${CONSUMER_CLI_PREFIX} status` のように組む。文字列リテラルの複製を持たない。生成 workflow の launcher 呼び出しも同じ定数を使う。

対象は生成される全文面である: managed block (`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md`)、`.claude/commands/*`、生成 workflow、生成 agent text (hook の説明文を含む)。一部だけ直して他を残さない。

### 3.2 npm script の条件付き案内

`npm run <script>` は、consumer の `package.json` がその script を定義しているときだけ案内する。生成文面は「`package.json` に typecheck script があれば `npm run typecheck` を実行する」のように条件を文中に書く。`package.json` が無い、または script が無い consumer に対しては、`npm run` の語を条件文以外に出さない。生成 workflow の npm 段は、現行の script ごとの確認 (`package.json` があり、かつ当該 script が定義されているときだけ実行する、§2) をそのまま保つ。`package.json` の存在確認だけに縮める変更はしない。

### 3.3 consumer setup doctor の正本表記

正本は `doctor --profile consumer-setup-smoke` とする。2 つの表記は同じ profile に解決されるので (§2)、実行結果は変わらず、選択の基準は文面の一貫性である。profile 形は toolchain の `--profile consumer-toolchain` と並び、doctor が公開する profile 名 (`--profiles`) と一致する。managed block・コマンド・生成 workflow は同じ表記 (`${CONSUMER_CLI_PREFIX} doctor --profile consumer-setup-smoke`) を使う。

`--setup-smoke` は互換の別名として受け付け続け、生成物には書かない。Pack の CI 方針 lint が `doctor --setup-smoke` を要求するのは role `pack_template` の workflow だけであり、生成 workflow (role `setup_builtin`) には Pack の必須段・禁止段を適用しない (§2)。したがって生成 workflow の表記変更は lint を変えずに成り立つ。本書は Pack の CI 方針 lint (`PACK_REQUIRED_STEPS` と `forbidden_full_doctor`) を変えない。

### 3.4 実装との対応

- `src/setup/templates.ts` が生成の正本である。`docs/templates/adapter/` の文面は同じ本文に保つ (対の drift を許さない)。
- 新しい関数や層は足さない。定数 1 個と、既存の文面組み立ての置き換えに限る (最小実装原則)。

## 4. DbC

- pre: 生成器へ渡す consumer の状態は、`package.json` の有無と scripts の集合だけである。
- post: 生成された全ファイルに bare の `ut-tdd <args>` が現れない。`npm run` は条件文か、定義済み script への案内にだけ現れる。setup doctor の表記は 1 種類である。
- invariant: 接頭辞の文字列は生成器の中で 1 か所だけ定義される。

## 5. 非目標

- このリポジトリ自身の `CLAUDE.md` / `AGENTS.md` の表記は変えない。
- launcher の生成内容 (`renderConsumerNodeWrapper`) と doctor の profile の振る舞いは変えない。
- `doctor --profile consumer-toolchain` が `package.json` 無しで赤のままになる件は、本書の範囲外である (別 Issue で扱う)。

## 6. 単位の契約 (DbC)

本書が定める契約上の関数は 1 つである (定数 `CONSUMER_CLI_PREFIX` から文面を組む §3.1 の規則を関数形で表す)。

- `renderConsumerCommand(args) => string`: `${CONSUMER_CLI_PREFIX} <args>` の形の呼び出し文を返す。bare の `ut-tdd <args>` は返さない。

- pre: 渡す consumer の状態は `package.json` の有無と scripts の集合だけである (§4)。
- post: 生成された全ファイルに bare の `ut-tdd <args>` が現れず、setup doctor の表記は `doctor --profile consumer-setup-smoke` の 1 種類である (§3.3、§4)。
- invariant: 接頭辞の文字列は生成器の中で 1 か所だけ定義される (§4)。
- oracle: CANDIDATE-U-CGENI-001〜007 が上記を固定する。
