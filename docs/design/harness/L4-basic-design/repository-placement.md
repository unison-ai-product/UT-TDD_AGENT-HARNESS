---
layer: L4
sub_doc: architecture
status: draft
pair_artifact: docs/test-design/harness/L9-repository-placement-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L9
plan: pending (PLAN-L4-35 は issue 596 の ledger 取り込み後に plan draft で起票する)
---

# UT-TDD Agent Harness — L4 基本設計: リポジトリの置き場所 (Repository Placement)

本書は、リポジトリの**どこに何を置くか**と、それを**守らせる仕組み**の設計正本である。対象は次の 4 つ。

- 3 区分の分離 (システム / HARNESS 部品 / 自己開発)
- 置き場所の registry
- 書き込み時の guard
- 巡回 (patrol)

あわせて、この repo 自身を consumer として運用する「内部デプロイ」を定める。

現行のツリーの正本は `docs/governance/repository-structure.md` である。本書は**目標の構造と移行の契約**を定める。§8 の切り替えが完了した時点で、`repository-structure.md` を本書に従って書き換える。それまでは、2 つの文書は「現状 (repository-structure)」と「目標 (本書)」として役割を分け、同じ事項を二重に定めない。

## §1 前提と判断の出所

- PO 指示 (2026-10-07、issue #648 / #822 / #759 の議論):
  - 記録だけで終わらせず、整理整頓まで実施する。
  - 指定が間違っていたら置けないようにする。作られたファイルは適切な場所に置かれるようにする。内部を巡回して、自動で見つける。
  - 開発部分、HARNESS 部品、システムを分離する。
  - この repo 自体を内部デプロイする。工程は「開発 HARNESS → 自身の設計 / 実装 → 自身の HARNESS への適用」とする。
  - ディレクトリ構成は、Pack の構造を見て矛盾をレビューし、source へ戻す。
- 方式の判断は advisor (`claude-fable-5`、design、2026-10-07) と相談し、repo の実測で前提を確かめた (§9)。

## §2 現状の矛盾 (Pack canary.4 と source main `a0fd215b` の実測)

| # | 矛盾 | 実測 |
|---|---|---|
| 1 | 配布する部品が `docs/` の中にある | Pack の `docs/templates/` に 101 本 (adapter 35、vmodel 49、github 11 ほか)。同じく配布する部品の skill は root の `skills/` にあり、基準が割れている |
| 2 | リリース工場 (Pack を作って公開する側のコード) が consumer に配られている | `src/setup/` の 22 本のうち、`pack-publication-*` / `release-*` などの 9 本は producer 専用。consumer は Pack を公開しない |
| 3 | 使われていないコードが出荷されている | `src/document-disposition/`、`src/execution/`。`src/` からの import は 0 件で、テストからしか参照されていない |
| 4 | 右腕の設計が `docs/process/` に紛れている | L11 / L13 の設計 (`docs/process/evidence/g11-uat-review-design.md`、`g13-post-deploy-verification-design.md`) が、`docs/design/` ではなく process の下にある |
| 5 | source repo 自身の説明やルールが Pack に入っている | `docs/governance/repository-structure.md` は source repo の構造を説明したもので、Pack の構造とは一致しない。`coding-rules.md` などの、自分の開発ルールも同梱されている |
| 6 | 製品が何なのかが二重になっている | consumer が実際に使うのは release asset (`ut-tdd.mjs` と consumer runtime)。一方、Pack repo はテスト 348 本と CI を含む完全な source になっている |
| 7 | 正本の記述が現実と食い違っている | `repository-structure.md` と ADR-005 は「consumer がこの repo を git dependency (tag-pin) として pull する」と書いている。実際の配布は release asset (canary.2 以降) |
| 8 | 同じ種類のテンプレートの置き場が 2 か所ある | `docs/templates/design/L6-function-spec-template.md` (78 行) と `docs/templates/vmodel/L6-function-spec.md` (56 行) |
| 9 | builtin と disk の二重管理 | `BUILTIN_GITHUB_TEMPLATES` と disk のテンプレートで、45 ペアのうち 7 ペアが不一致 (#872)。consumer には builtin 側が届く |
| 10 | root に役割不明の物が散らばっている | `.pytest_cache/`、`tmp/`、`memory/.update_check`、`tmp_status*.json`、`x.command_id`、ZIP 2 本など (2026-10-07 に、確認できたものから 1 件ずつ削除済み。§8 の 0) |

共通の原因は 2 つある。

- 「配る物」と「自分が開発に使う物」と「自分の開発記録」が、同じ階層に混ざっていること
- 置き場所を判定する正本と、それを守らせる gate が無いこと

## §3 目標の構造 (3 区分)

```text
<repo root>/
├── src/            システム: consumer で動く harness 本体 (TypeScript)。Pack に含める
├── parts/          HARNESS 部品: consumer へそのまま配る部品。Pack に含める
│   ├── skills/
│   ├── templates/
│   │   ├── design/        設計テンプレート (L0〜L6)
│   │   ├── test-design/   テスト設計テンプレート (L7〜L14)
│   │   ├── adapter/       Claude / Codex の settings・hooks・agents 定義
│   │   ├── github/
│   │   ├── plan/
│   │   ├── prompts/
│   │   └── state/
│   └── ...
├── dev/            自己開発: この repo の開発にだけ使う物。Pack に含めない
│   ├── release/    リリース工場 (現 src/setup の pack-publication-* / release-* など)
│   ├── docs/       この repo 自身の PLAN・設計・テスト設計・governance
│   ├── tests/
│   └── scripts/
├── .ut-tdd/  .claude/  .codex/  .github/  .vscode/   ツールの都合で root に置く必要がある物
└── package.json  tsconfig*.json  biome.json  README.md  LICENSE  NOTICE  CHANGELOG.md ...
```

規則は次のとおり。

1. **Pack (配布物) = `src/` + `parts/`。** 現在の、3,178 本から 998 本を filter で選ぶ方式 (allowlist / denylist) をやめ、構造で決まるようにする。dev 専用 path の漏出検査は、「`dev/` が Pack に含まれていないこと」という 1 行の検査になる。
2. **`dev/` は配布しない。** リリース工場は、この repo が Pack を作るための自己開発の道具であって、consumer の harness の一部ではない (矛盾 2)。
3. **設計の文書は層のディレクトリに置く。** `dev/docs/design/harness/<層>/` と `dev/docs/test-design/harness/<層>/` を使う。右腕の層名は、PO が採択した v4 の構成 (#822: L7 単体テスト / L8 仕様書作成 (as-built、設計への適合検証) / L9 結合 / L10 システム / L11 UX 検証 / L12 受入 / L13 / L14) に合わせる。`docs/process/evidence/` にある右腕の設計は、ここへ戻す (矛盾 4)。
4. **テンプレートは `parts/templates/` に一本化する。** `docs/templates/vmodel/` は廃止し、設計テンプレートとテスト設計テンプレートに振り分ける (矛盾 1 / 8)。builtin のテンプレートは、`parts/templates/` から build 時に生成する (矛盾 9。#872 の方式 A)。
5. **使われていないコードは消す** (矛盾 3)。
6. **製品は release asset と定める。** Pack repo は、release asset を再現する source として位置付ける。ADR-005 と `repository-structure.md` の「git dependency で pull する」は、§8 の切り替えで訂正する (矛盾 6 / 7)。

**未決 (本書の review で確定する):**

- `parts/` の名前。候補は `parts/` / `harness/` / `pack/`。PO 確認待ちのため、本書では仮に `parts/` と書く。
- `docs/`・`tests/`・`scripts/` を `dev/` の下へ移すかどうか。移すと、CLAUDE.md の読み込み順、`vitest.config.ts`、`tsconfig`、CI のパス参照がすべて変わる。この影響は §8 の 3 で実測してから確定する。

## §4 置き場所の registry (正本)

- 正本は `src/schema/file-placement.ts` とする。zod の schema と、ルールの表を持つ。repo の慣習に合わせて TypeScript で書き、生の JSON にはしない。
- **既存の catalog が置き場所をすでに定めている領域は、その catalog を import して参照する。** 例: `docs/governance/vmodel-document-catalog.md` の文書種、`src/schema/route-filing.ts`。registry が自前で定義するのは、新しいルールだけにする。これは 4 つ目の正本を作って drift させないためである。
- ルールの種類は次の 3 つ。
  - **path ルール**: 区分 (system / parts / dev / tool-root) と、その中の置き場所
  - **文書ルール**: frontmatter の `layer` / `sub_doc` / `doc_type_id` から、置き場所の層を決める
  - **component ルール**: `src/` の component (R3 で実測した dir) ごとに、置くファイルのパターンを決める (例: `pack-publication-*` / `release-*` は `dev/release/`)
- **未知の種類**: governed root (`src/`、`parts/`、`dev/`、それと移行期間中の `docs/`、`tests/`、`scripts/`) の中で、どのルールにも当たらない新しいファイルは置けない。先に registry へルールを足す。scratchpad、`.ut-tdd/`、ignore 対象は governed root に含めない。
- **例外**: 新しい機構は作らない。foreign-edit override と同じ、理由が必須の one-shot marker (`.ut-tdd/state/placement-override`) を再利用する。使うと消費され、監査ログ `.ut-tdd/logs/placement-overrides.jsonl` に残る。

## §5 書き込み時の guard

- `PreToolUse(Edit|Write|MultiEdit)` の既存 hook (`.claude/hooks/work-guard.ts`) を拡張する。
- **新しいファイル**の書き込みについて、registry で置き場所を判定する。違反していれば **deny** し、正しい path を理由として返す (deny-with-suggestion)。エージェントは、示された path で書き直す。結果として、ファイルは正しい場所に置かれる。
- **書き込み先を差し替える方式 (`updatedInput` での path の書き換え) は採らない** (§9 判断 1)。
- 既存ファイルの編集は、置き場所の判定の対象にしない。既存の誤配置は patrol が扱う。
- **Codex 側**: Codex の hook で、deny とメッセージの返却ができるかを先に実測する (`reference-codex-hook-schema-probe` の実測では、hooks.json に args / blockOnFailure が無い)。できる場合は Claude と対称にする。できない場合は「Codex は書き込み時の guard を持たず、pre-commit と patrol で担保する」という非対称を、本書に明記する。暗黙の非対称は作らない。
- 人が直接置いたファイルは、git の pre-commit (`scripts/git-hooks/`) で同じ判定をする。

## §6 巡回 (patrol)

- doctor の check として `file-placement` scope を足す。`src/doctor/runtime-state-location.ts` (`.ut-tdd` の誤配置を `misplaced` として検出する既存の check) を一般化する。
- 検出するものは次のとおり。
  - `misplaced`: registry と置き場所が一致しない
  - `unreferenced`: `src/` の中で、どこからも import されていない (テストからだけの参照も対象)
  - `duplicate`: 同じ種類の正本が 2 か所にある (テンプレート、builtin と disk など)
- 実行するのは、doctor、CI (`harness-check`)、SessionStart の digest (件数だけ) の 3 か所。
- **最初は報告だけにする。** 修正用の PR を自動で作ることはしない (§9 判断 2)。報告の件数が、そのまま誤配置の発生率の計測になる。
- **自動 PR を足す条件**: patrol の実測で、機械的に直せる誤配置 (移動と import の付け替えだけで済むもの) が継続して発生していることが分かった時点で、別の PLAN として起票する。その PLAN では、機械が作った PR の author family と review 経路を先に契約する。

## §7 内部デプロイ (自己ホスティング)

この repo の開発は、**リリース済みの harness** で行う。開発中の `src/` そのものは使わない。

```text
① 開発用 HARNESS = リリース済みの版 (Pack から内部にインストールしたもの)
     ↓ これで hook・gate・review を回す
② 自分自身の設計 / 実装 (src/・parts/ は製品。開発ツールとしては直接使わない)
     ↓ canary を作る
③ 内部デプロイ = 新しい版を、自分の開発用 HARNESS にアップグレードする (自分への受入)
     ↓ 問題なければ consumer に配る。問題があれば rollback する
```

- `.claude/settings.json` などの hook は、`node ${CLAUDE_PROJECT_DIR}/src/cli.ts` の直接起動から、インストールした `ut-tdd.mjs` (consumer launcher) 経由に切り替える。
- 新しい gate を足す PR は、その gate 自身では守られない。内部デプロイの後から効く (コンパイラの bootstrap と同じ扱い)。
- 内部デプロイは、consumer への公開より前の受入の工程として置く。v4 の右腕では L12 (受入) の前段にあたる。
- 前提: 安全なアップグレードと rollback (#814)。
- **最初の 1 歩**: canary.5 の公開後に、この repo の開発用 HARNESS を canary.5 にし、運用して詰まった箇所を洗い出す。

## §8 移行の順序

| 段階 | 内容 | 配布への影響 |
|---|---|---|
| 0 | root の役割不明の物を、確認できたものから 1 件ずつ削除 (2026-10-07 実施済み: `tmp_status*.json`、`x.command_id`、`tmp/`、`.pytest_cache/`)。残り (`memory/.update_check` の発生源、ZIP、`prt1-zip-templates.json`) は、既存の PO 条件を確認してから処理する | なし |
| 1 | registry (§4) と、報告だけの patrol (§6)。ルールは**現状の構造**で書き、§2 の矛盾は既知の移行対象として報告する | なし |
| 2 | 書き込み時の guard (§5) | なし |
| 3 | 構造の切り替え (§3): `parts/` の新設とテンプレートの移動、`vmodel/` の廃止、リリース工場の `dev/release/` への移動、右腕の設計の層ディレクトリへの移動、使われていないコードの削除、Pack inventory の構造化。v4 の層の切り替え (#822) と**同じ切り替え**で行う (触るファイルがほぼ同じなので、2 回動かさない) | あり。canary で配布し、受入で「Pack = `src/` + `parts/`」と consumer に届くテンプレートの一致を確認する |
| 4 | 内部デプロイ (§7) | なし (この repo の運用だけ) |

registry のルールは、段階 3 で目標の構造へ切り替える。段階 1〜2 の間は、現状の構造を正として、新しい散らかりだけを止める。

## §9 設計判断の記録

advisor: `claude-fable-5` (design、2026-10-07)。前提は repo で実測した。

1. **書き込み先の差し替え (`updatedInput`) は採らない。deny して正しい path を示す。**
   - 差し替えると、エージェントの transcript には旧 path へ書けたと残る。そのため、直後の Edit / Read や import の生成が旧 path を参照して壊れる。
   - Codex の hook は入力を書き換えられないので、Claude と Codex の挙動が非対称になり、それ自体が rule-drift の源になる。
   - deny-with-suggestion は決定的で、エージェントは示された path で書き直して自己修復する。
   - 実測: `work-guard.ts` での `updatedInput` の使用は 0 件。
2. **修正用の PR は、当面は自動で作らない。patrol は報告だけにする。**
   - 誤配置の発生率がまだ計測されていない。未計測のまま機構を作らないのは、既存の PO 原則である (advisor ゲート化を見送った 2026-07-28 の判断と同じ形)。
   - 機械が作った PR の author family と review の帰属が、契約されていない。
   - 「移動と import の書き換え」は機械的に見えても、re-export、動的 import、文書内の path 参照で挙動を変えうる。
3. **registry は単独の新しい JSON にしない。** 既存の catalog を参照し、新しいルールだけを自前で定義する。既存 catalog の合成だけにすると、どれか 1 つの変更で置き場所が黙って変わる。単独の JSON にすると、4 つ目の正本ができて既存の catalog と drift する。
4. **未知の種類を止めるのは governed root の中だけにする。** 全域で fail-close にすると、作業中の scratch や新しい文書種で初日から止まる。
5. **構造の切り替えは、v4 の層の切り替えと同時に行う。** テンプレートの移動、`vmodel/` の廃止、層の番号の付け替えは、触るファイル (`loadTemplates`、`build-node.mjs`、Pack inventory、テスト、catalog) がほぼ同じだからである。
