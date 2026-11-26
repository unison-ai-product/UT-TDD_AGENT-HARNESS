# 運用規律: 目的・PO 判断・棚卸し・配布・guard・取得物 (operating-rules-general)

Status: canonical
Created: 2026-11-26
Owner: PM / PO
Related: `CLAUDE.md` (索引のみ)、`AGENTS.md`

本書は root `CLAUDE.md` から本文を逐語で移した節を収める (PO 指示 2026-11-26)。
節の見出しは移動前と同一であり、`CLAUDE.md §<見出し>` の参照は本書の同名の節を指す。

## Purpose

UT-TDD Agent Harness is the verification and development foundation for safely
using AI implementation agents in internal product development. The harness is
not the end product; it is the ground on which other product work runs.

Design and implementation should be judged by these pillars:

1. Foundation first: the harness must make downstream product development safer.
2. Document-first plus machine enforcement: workflow rules must be backed by
   schema, lint, doctor, hooks, or tests where appropriate.
3. Automatic state and feedback: `.ut-tdd/` state and harness DB projections
   should make progress, gaps, and drift visible.
4. Dynamic context / skill injection: load only relevant context and skills.
5. Practical orchestration: split work across roles/runtimes only where it
   reduces risk or cost.
6. Strict verification: no completion claim without tests or explicit evidence.

## 設計判断エリシテーション (PO ルール 2026-07-13)

PO への質問は **設計判断 (trade-off が実在する方式選択 / spec 未確定点) に限る**。
進捗確認・実行許可・自力で確定できる事実は聞かない (可逆作業は進める)。聞き方は
`docs/governance/design-decision-elicitation.md` の共通フォーマットに従う: 前提 2〜3 行 +
選択肢 2〜4 個 + 各 trade-off + 推奨 1 つ (先頭、理由 1 行)。Claude の対話セッションでは
AskUserQuestion をこの用途に限って使ってよい (必要なら preview 付き)。非対話セッションと
Codex では `## 設計判断依頼` の markdown 選択肢表で等価に出力して停止する。採択結果は
設計文書、GitHub Issue または ADR に記録する (skill: `skills/design-decision-elicitation.md`)。

## PO 判断への反射的エスカレーション禁止 (PO ルール 2026-08-05)

「PO 判断必須」「PO 承認待ち」「PO が決める」と記載して作業を止める前に、必ず
`ut-tdd advisor --decision <kind> --current-model <current-model> --execute --task "<判断内容>"`
で第三者判断を得る。設計・進行・優先順位・UI/UX は
`claude-fable-5-2`、実装方式・技術的トラブルシュートは `gpt-6.1-sol` へrouteする
(正規の `--decision design|progress|uiux|implementation|troubleshooting` を使う)。
advisor結果は前提をrepo実測で検証し、下記の高影響境界に該当せず、既存の層・責務・契約から
一意に決まるなら、AIランタイムが技術判断として決定・記録して作業を継続する。advisor相談を
POへの責任転送の前置きにしてはならない。

production infrastructure、destructive data operation、authentication/authorization、payment、
PII、secret、licensing、外部API前提の変更は高影響境界であり、trade-offの有無やadvisor回答に
かかわらず変更前にPO承認を得る。advisor相談は承認の代替ではない。それ以外でPOへ上げてよいのは、
advisor相談と実測後にも複数案の実在するtrade-offが残り、product scopeなどPO権限を要する判断に
限る。その場合も、相談したadvisor/model、検証した事実、解消できなかったtrade-off、推奨案を
`docs/governance/design-decision-elicitation.md` の形式で提示する。
単なる事実確認、既存責務から導ける所有境界、可逆な実装順序、進捗報告をPO判断にしてはならない。
Fable/Solの双方が利用不能なら相談attemptとfailureを記録し、判断を捏造しない。高影響境界は
advisor unavailableの証跡を添えてPOへ上げる。高影響境界に該当せず既存契約から一意に決まる判断は
継続し、advisorを要する未解決trade-offだけを利用可能になるまで保留する。

## Canonical Docs

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`
- `docs/governance/repository-structure.md`

## 定期棚卸し (EOD close-out)

セッション終了時に以下を流す。新規機構は作らず、既存コマンド 1 本ずつで済ませる
(2026-07-28 実測: open issue 29 件に対し triage 機構は存在せず、`issue triage` 系の記述は
grep 0 件だった)。

- `gh issue list --state open` — 起票したまま棚卸しされていない issue を数える。
- advisor 発火の spot-check (`.claude/CLAUDE.md` §着手前 advisor 合意形成 のコマンド)。
- 未 push commit と open PR の確認。
- **harness.db projection の鮮度** (`ut-tdd db status`)。graph (`graph_nodes` /
  `dependency_edges`) は影響範囲の判定入力であり、**古い projection を正本に
  すると「重複なし」「影響なし」という偽の否定証明を出す**。2026-07-28 実例: PLAN-L6-94 と
  PLAN-L7-465 の契約重複を機械が拾えなかった真因は検出方式ではなく projection の鮮度で、
  両 PLAN が `graph_nodes` に存在していなかった (issue #169)。

## Canonical Commands

- Setup: `ut-tdd setup`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Review: `ut-tdd review --uncommitted`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude prompt generation: `ut-tdd claude --role <role> --task "..."` (`--execute` なしが dry run)
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
- Task classification: `ut-tdd task classify --text "..."`
- Skill suggestion: `ut-tdd skill suggest --text "..."`

When multiple AI runtimes are available, separate creation from judgement. In
single-runtime modes, record `intra_runtime_subagent` review evidence as the
fallback.

## Skills

- Load only relevant skills; do not bulk-load the full catalog.
- Pack / runtime skill content lives under root `skills/`.
- `src/skill-engine/` is TypeScript implementation code for skill
  recommendation / injection / scaffolding. It is not a skill content directory.
- Legacy-derived skill material under `docs/skills/` is source-repo reference /
  migration material unless a task explicitly targets it. Do not treat it as the
  Pack runtime skill root.

## Distribution Repository

- Source development repo: `unison-ai-product/UT-TDD_AGENT-HARNESS`.
- Clean distribution Pack repo:
  `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`
  (`https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`).
- When publishing clean Pack artifacts, push/export to the Pack repo, not back
  into the source development repo.
- Standard local propagation from this source repo to an existing Pack checkout
  is `ut-tdd distribution sync-pack --repo-dir <Pack checkout>`.
  Use `--prune-local` only when intentionally removing local files that are not
  part of the clean Pack artifact set. The command must not commit or push;
  inspect its output and perform any Pack repo commit / push as a separate,
  human-reviewed step.

## Shared Guard Discipline (both runtimes) (doctor singleton 以外)

配置規約に従い、両ランタイムで成り立つ guard 規律は本節が正本 (2026-07-28 時点で
片側のアダプタにしか無かった 3 件を集約した)。

- **並列 subagent は既定上限 8** (`DEFAULT_MAX_PARALLEL`、`src/runtime/agent-slots.ts`)。
  `agent-slots` が fire/release を記録し上限到達を警告する (fail-open advisory であって
  fail-close gate ではない)。
- **Vitest の snapshot guard を env で迂回しない**。raw Vitest が global-setup に拒否されたとき、
  `UT_TDD_TEST_EXECUTION_ROOT` / `UT_TDD_TEST_FENCE_ROOT` / `UT_TDD_HEAD_SNAPSHOT_ROOT` を dirty な
  worktree へ手設定して再実行しない。その実行は Red / Green やレビューの証拠にならない
  (Issue #890 の実例)。Red テストを先に通常 commit し、`npm run test:vitest-snapshot` 系
  (`scripts/run-vitest-snapshot.ts`) を committed HEAD に対して流す。
- **Docker Desktop は使っていないときは停止する** (PO 2026-10-01)。Linux 受入の使い捨て container
  など必要な作業の前に `docker desktop start` で起動し、作業と証跡の退避が終わったら
  `docker desktop stop` で落とす。
- **foreign-edit override は one-shot**。`.ut-tdd/state/foreign-edit-override` に非空の理由を
  書いた場合のみ 1 回通り、その編集で消費 (削除) される。空 marker は通さない (理由なき
  silent override を作らない)。bypass は `.ut-tdd/logs/foreign-edit-overrides.jsonl` へ監査
  記録される。marker は**書いたセッションに紐付かない** — 消費前に読んだ任意のプロセスが
  使えてしまう first-come-first-served であり、実際に別セッションが他セッションの marker を
  消費した観測がある (2026-07-17T01:33:51)。env の `UT_TDD_ALLOW_FOREIGN_EDIT=1` は
  human 管理で消費されない。

## ゼロトラストダウンロード原則 (PO ルール 2026-11-17、両ランタイム共通)

外から取ってくるものは、取った時点では信頼しない。対象は npm パッケージ、GitHub Action、バイナリ、
スクリプト、archive、container image、`curl` などで取ったファイル、`npx` で一時的に動かすツールのすべてである。

1. **版を固定する**: npm は exact version と lockfile の integrity、GitHub Action は commit SHA、
   container image は digest で指す。範囲指定 (`^` / `~`)・`latest`・タグだけの参照は使わない。
2. **公開から 14 日以上たった版を使う**: 公開の直後は、乗っ取られた版が見つかる前に入ってしまう。
   脆弱性の修正で急ぐときだけ、PO 承認で例外にする。
3. **完全性を確かめる**: lockfile の integrity、配布元が公開する sha256、署名や provenance があればそれを
   検証する。検証できないものは入れない。
4. **取得するときに実行しない**: `npm install` / `npm ci` には `--ignore-scripts` を付ける。`curl ... | sh` の
   ように、取ってすぐ実行しない。取得物は新しい空のディレクトリに置き、そのディレクトリの中でインタプリタや
   ビルドを動かさない (同じディレクトリにある `json.py` などが読み込まれるため)。Python で読むときは `-I` を付ける。
5. **入れる前に審査して記録する**: ライセンス、保守の状況、直接の依存の数、install script の有無を確かめ、
   PR 本文に書く。新しい依存の追加はサプライチェーンの高影響境界であり、PO 承認を取る。
6. **権限を渡さない**: 取得物を動かす CI の job には、必要最小の `permissions` だけを与え、secret を渡さない。

いまある仕組みは一部だけである。Node と npm の版と hash の固定 (`src/lint/toolchain-pin.ts` の `NODE_TOOLCHAIN_POLICY`
と `packageManager` の検査。npm の exact version と hash は `package.json` の `packageManager` に持つ)、Biome と
esbuild の版の固定 (同じ file)、`.github/workflows/security.yml` の Action の SHA 固定と `npm ci --ignore-scripts` である。
依存全体の exact pin、全 workflow の Action の SHA 固定、`harness-check.yml` の `npm ci` への `--ignore-scripts` はまだ無い。機械で確かめていない項目は #1741 で仕組みにする。

## Rule Placement Convention (2026-11-26 改訂前の本文)

**共通ルールは本ファイル (`CLAUDE.md`) のみに書く。** アダプタファイルはランタイム固有
事項に限る (`.claude/CLAUDE.md` = Claude Code の hook / subagent / tool 呼び出し、
`AGENTS.md` = Codex CLI 固有の経路と手順)。同じルールを 2 箇所に書けばそこが drift 源に
なる (2026-07-28 実測: 片側欠落が 5 topic — Parallel Task Limit / foreign-edit override の
one-shot 消費 / memory add 必須 / doctor singleton / effort ladder。矛盾ではなく欠落であり、
`rule-drift` はマーカー節しか見ないので機械の視野外だった)。

前提: **`AGENTS.md` の Core Reads は本ファイルを含む** (Codex が共通ルールに到達できる
ことが規約の成立条件)。既存の重複記述は当面残す — 一部は `rule-drift` の必須マーカーに
なっており、整理のために gate を壊すのは本末転倒だからである。規約は**新規ルールの置き場所**
に適用する。

判定に迷ったら「もう一方のランタイムでも成り立つか」で決める。成り立つなら共通 =
本ファイル。成り立たないならアダプタ固有。

## Coding Rules (最小実装・残骸除去)

- 最小実装を優先する: 要件を満たす最短の解を選び、投機的な型・契約・層・機能の積み増し (over-engineering) をしない。object-oriented DDD はドメインを小さく凝集させ code 量を減らすための手段であって ceremony を増やすためではない。DDD が code を膨張させているなら設計を疑う。正本は `docs/governance/coding-rules.md` の「最小実装原則」。
- Treat Codex / Claude Code as local CLI + hook surfaces managed by UT-TDD, not
  direct API calls.
- Remove or clearly supersede wrong development residue when it is discovered;
  do not leave misleading comments or dead paths as technical debt.

## Instruction Files

- Shared project context: `CLAUDE.md`
- Claude Code runtime / hook policy: `.claude/CLAUDE.md`
- Codex CLI project rules: `AGENTS.md`
- Personal overrides: `CLAUDE.local.md` / `AGENTS.override.md`

## UT-TDD Workflow

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `R0` → `R1` → `R2` → `R3` → `R4` → Forward への合流 (`docs/process/modes/reverse.md`)
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- Handover: check `.ut-tdd/handover/CURRENT.json` if present and non-stale.
