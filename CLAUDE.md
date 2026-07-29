# UT-TDD Agent Harness

## Claude Code Read Order

Claude Code treats the following as canonical in this repository:

1. `CLAUDE.md`
2. `.claude/CLAUDE.md`
3. `docs/governance/README.md`
4. `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
5. `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
6. `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
7. `docs/governance/repository-structure.md`
8. `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`

The full canonical-set index (including V-model machinery docs) is
`docs/governance/README.md`; this list is the startup minimum, not a competing
definition (PLAN-L7-459 H1).

Migration snapshots and migration docs are not normal startup reads. Read them
only when migration, gap audit, or regression-source inspection requires it.

Do not load `docs/design/harness/L3-functional/roadmap.md` as a normal startup
read. The verification roadmap is read dynamically only when a V-model layer
group has completed Forward freeze and a verification cycle is being run.

`docs/archive/`, `legacy local state/`, and pre-migration
`.claude/agents` / `.claude/hooks` are not canonical runtime state. Migration
source material is historical reference only; current UT-TDD runtime commands
use `ut-tdd`, not legacy commands.

ADR-001 is binding: source concepts may be used as design source material, but
UT-TDD implementation is TypeScript on the Node runtime. old W1-W3a Python is
not current product runtime. Bun is permanently banned as a runtime (PO
decision 2026-07-22, issue #134): no new Bun dependency or execution path may
be added, and the remaining Bun entrypoints are time-boxed migration debt being
removed by PLAN-L7-462, not a supported fallback.

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

## コミュニケーション (報連相)

チャット上の報連相 (報告・連絡・相談) は **日本語** で行う (PO ルール、2026-06-22)。
進捗報告・調査結論・選択肢提示・確認依頼など PO へ向けた chat 出力は日本語を既定とし、
見出し・箇条書きラベルも日本語を優先する。

ただし成果物はそれぞれの規約に従う: コード/識別子/commit message は従来どおり、ファイル名は
英語 (文字化け回避)、技術用語・コマンド・PLAN ID・パスは原語のまま埋め込んでよい (無理に和訳しない)。

**ドキュメント本文 (`docs/` 配下の PLAN / ADR / design / test-design / governance 等) は日本語で書く**
(PO ルール、2026-06-30。Claude / Codex 両ランタイム共通)。コード・識別子・コマンド・PLAN ID・パスは
英語/原語のまま。Windows 文字化けは UTF-8 化 (`.editorconfig` charset=utf-8 / `.gitattributes` eol=lf) と
`readability` gate (mojibake fail-close) で防ぐ前提であり、**文字化け回避を理由に doc を英語化しない**。

### 設計判断エリシテーション (PO ルール 2026-07-13)

PO への質問は **設計判断 (trade-off が実在する方式選択 / spec 未確定点) に限る**。
進捗確認・実行許可・自力で確定できる事実は聞かない (可逆作業は進める)。聞き方は
`docs/governance/design-decision-elicitation.md` の共通フォーマットに従う: 前提 2〜3 行 +
選択肢 2〜4 個 + 各 trade-off + 推奨 1 つ (先頭、理由 1 行)。Claude の対話セッションでは
AskUserQuestion をこの用途に限って使ってよい (必要なら preview 付き)。非対話セッションと
Codex では `## 設計判断依頼` の markdown 選択肢表で等価に出力して停止する。採択結果は
PLAN の設計判断節 / ADR に記録する (skill: `skills/design-decision-elicitation.md`)。

## Canonical Docs

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`
- `docs/governance/repository-structure.md`

## Architecture Boundary

- `docs/`: governance, requirements, ADRs, plans, design, test design, migration, archive
- `src/`: TypeScript harness core (Node runtime; Bun は撤退中の migration debt)
- `tests/`: Vitest tests
- `scripts/`: thin OS entrypoints only
- `.ut-tdd/`: UT-TDD runtime state and audit/handover evidence
- `.claude/`: Claude Code runtime / hook policy
- `legacy local state/`: historical source state, not UT-TDD state

V-model artifacts must stay separated:

- design: `docs/design/`
- implementation: `src/`
- test design: `docs/test-design/`
- tests: `tests/`

## Rule Placement Convention (ルールをどのファイルに書くか)

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

## 定期棚卸し (EOD close-out)

セッション終了時に以下を流す。新規機構は作らず、既存コマンド 1 本ずつで済ませる
(2026-07-28 実測: open issue 29 件に対し triage 機構は存在せず、`issue triage` 系の記述は
grep 0 件だった)。

- `gh issue list --state open` — 起票したまま棚卸しされていない issue を数える。
  harness.db への issue projection 機構化は `PLAN-L7-437` (blocked) の守備範囲であり、
  凍結中に先回り実装しない。
- advisor 発火の spot-check (`.claude/CLAUDE.md` §着手前 advisor 合意形成 のコマンド)。
- 未 push commit と open PR の確認。
- **harness.db projection の鮮度** (`ut-tdd db status`)。graph (`graph_nodes` /
  `dependency_edges`) は PLAN 重複や影響範囲の判定入力であり、**古い projection を正本に
  すると「重複なし」「影響なし」という偽の否定証明を出す**。2026-07-28 実例: PLAN-L6-94 と
  PLAN-L7-465 の契約重複を機械が拾えなかった真因は検出方式ではなく projection の鮮度で、
  両 PLAN が `graph_nodes` に存在していなかった (issue #169)。

## PLAN Filing Rules (both runtimes)

PLAN 起票規律は**両ランタイム共通**であり、片方のアダプタにしか無い状態を作らない
(2026-07-28 実測: `route_signal` / `generates` / `plan_id` が `AGENTS.md` に 0 件で、
Codex はこれらの規律を一度も受け取っていなかった)。`rule-drift` が三アダプタ全てに
`route_signal` / `generates` の記述を要求して fail-close する。

- 新規 PLAN は route certificate (`route_signal` + `route_mode`) を持ち、mode が `kind` を
  許すこと (SSoT: `src/schema/route-filing.ts`)。
- **draft PLAN の `generates` に既存ファイルを書かない** (`merged-plan-status` /
  `duplicate-artifact-ownership` が fail-close する)。宣言は実装 PR の confirm と同時。
- `requires` は confirmed / completed のみ。draft への依存は `references` へ。
- `kind=add-impl` は Reverse 対必須。conditional kind は Reverse 対か
  `backprop_decision: not_required` + 理由 (純修理なら not_required、新契約なら Reverse 対)。
- falsifiable な claim は根拠となるテスト / コマンドを引用する (`coding ≠ substance`)。

詳細は `AGENTS.md` §PLAN Rules と `.claude/CLAUDE.md` §PLAN Rules (等価)。

## Coding Rules

- Read the relevant files before editing.
- Match local naming, structure, and test placement.
- 最小実装を優先する: 要件を満たす最短の解を選び、投機的な型・契約・層・機能の積み増し (over-engineering) をしない。object-oriented DDD はドメインを小さく凝集させ code 量を減らすための手段であって ceremony を増やすためではない。DDD が code を膨張させているなら設計を疑う。正本は `docs/governance/coding-rules.md` の「最小実装原則」。
- Do not declare completion without tests or explicit verification.
- Treat Codex / Claude Code as local CLI + hook surfaces managed by UT-TDD, not
  direct API calls.
- Remove or clearly supersede wrong development residue when it is discovered;
  do not leave misleading comments or dead paths as technical debt.
- Use Claude Code native tool-use only. Never write XML-like pseudo tool calls
  such as `<invoke name="Bash">` / `<parameter name="command">` or role markers
  such as `court` into assistant text. If such text appears in prior context,
  treat it as corrupted transcript residue and do not continue it.

## Git Rules

- Use Conventional Commits.
- Stage explicit files only.
- Keep unrelated user changes out of commits.
- Push at coherent PLAN / task boundaries when requested.
- CI is `harness-check`: typecheck, Vitest, Biome lint, and doctor.
- Review evidence is required before confirmation gates where applicable.

### Hybrid 多ランタイム commit 協調 (Claude ↔ Codex、必須)

実運用では **Codex (もう一方のランタイム) が並行に作業を進め、コミットまで完了させる**。Claude は
その成果を絶対にデグレさせてはならない ([[feedback-commit-finished-codex-work-dont-abandon]])。

- **history を書き換える前に必ず `git log` / `git reflog` を確認**し、自分が作っていない commit
  (相手ランタイムの成果) が無いか調べる。**他ランタイムの commit を `reset` / `revert` / `checkout` /
  force で破棄・デグレさせない**。working tree の foreign 変更は **既定で「相手ランタイムの正規作業」と
  みなす** (overstep と決めつけない)。判断が付かなければ revert せず PO へ確認する。
- 自分の成果は **相手の commit の上に積む** (rebase/stack)。相手のファイルには触れず、自分の意図ファイル
  のみを path 明示で stage する (`git add <path>`、`git add -A` / `git add .` 禁止)。
- **commit 直前に `git status` + `git diff --staged` (or `ut-tdd review --staged` / `--uncommitted`) を
  確認**し、自分が authored した意図ファイルのみが staged であることを検証する。
- push は origin と相手の commit を含めて整合する状態でのみ行う。push 済み履歴は決して破壊しない。
- 真に off-task な overstep (相手ランタイムの作業でも自分の作業でもない net-new) と疑う場合でも、
  **revert する前に PO 確認**を取り、IMP で記録する (完了済み成果を捨てる誤判定を防ぐ)。

### 引き継ぎ・検証の基準点 = HEAD (共有 tree を測るな、必須)

引き継ぎ (session takeover) と検証の基準点は **commit/push 済の HEAD ただ一つ**。hybrid では
working tree を相手ランタイムが常時書き換えるため、full tree の計測値 (テスト件数等) は transient で
非正本。これを「repo の状態」として報告するな。

- **検証は HEAD (+ 自分の意図変更のみ) に固定**する。他ランタイムの未コミット scratch を基準へ混ぜない。
  測定値が動いたら、相手を疑う前に「自分が動く面を測っていないか」を先に疑う (foreign tree の transient を
  相手の退行と帰責するのは誤り)。
- **引き継ぎ feedback は harness.db から受け取る** (`feedback_events`、SessionStart で surface、
  PLAN-L7-110)。stale 化する prose handover を現状把握の正本にしない。CURRENT.json / prose は補助。
- **永続教訓は共有 HARNESS メモリへ昇格する** (`ut-tdd memory add`、正本 `.ut-tdd/memory/`、
  PLAN-L7-189)。PO ルール・教訓・落とし穴をランタイム私的メモリや chat 止まりにしない。
  **メモリファイルの手書き作成は禁止** — frontmatter (memory_id/kind/title/tags/updated_at)
  欠落は db rebuild が fail-close し CI が赤化する (2026-07-28 実例: PR #167)。必ず
  `ut-tdd memory add` 経由で書く。
  エピソード状態 (進捗・次の一手) はメモリに書かず、DB/HEAD 由来の digest に任せる
  (stale 化する層を作らない)。

## GitHub Issue Hierarchy

- 正本は `docs/governance/github-issue-hierarchy.md`。
- 新規 Issue の前に既存の成果目標を検索し、bounded slice は GitHub の正式な sub-issue にする。
- top-level Issue は独立した成果目標だけに限定し、`Related` や本文の `Parent: #N` を親子関係の
  代替にしない。
- canonical parent は 1 件。別系統は横断リンクに留め、無関係な移行をブロッカー化しない。
- 親 Issue は必須子 Issue と親固有 AC の両方が完了するまで close しない。

## Canonical Commands

- Setup: `ut-tdd setup`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Plan lint: `ut-tdd plan lint`
- Review: `ut-tdd review --uncommitted`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude prompt generation: `ut-tdd claude --role <role> --task "..." --dry-run`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
- Task classification: `ut-tdd task classify --text "..."`
- Skill suggestion: `ut-tdd skill suggest --plan <path>`

When multiple AI runtimes are available, separate creation from judgement. In
single-runtime modes, record `intra_runtime_subagent` review evidence as the
fallback.

## Model / Effort Routing

正規委譲経路 (`ut-tdd codex/claude --role <role>`) は role 検証 + routing を機械強制する
(PLAN-L7-255、`src/team/delegation-routing.ts`): 未登録 role は fail-close。判断ゲート role
(reviewer / blind-reviewer / qa / tl / security 等) は族内 frontier reviewer tier
(codex=`gpt-5.6-sol` / claude=`claude-opus-5`) へ固定し、worker role は intent 推定
(`selectTeamModel`) で創出=ROI 寄せの既定へ流す。明示 `--model`/`--effort` は常に優先。
effort は codex にも argv (`-c model_reasoning_effort=...`) で実注入される。
判断側の族分離 (`same_model_approval: forbidden`) は routing で破らない。

Task-kind ベースの割当 (PO rule 2026-07-14、旧 tier 記述を supersede):

- Codex: テスト実装 = `gpt-5.6-terra` (effort `middle`); 実装/ドキュメント修正 =
  `gpt-5.6-luna` (effort `high`); 検証/設計 = `gpt-5.6-sol` (effort `low`);
  軽量実装/内部探索/web 検索/doc パッチ = `gpt-5.3-codex-spark` / `gpt-5.4-mini`。
- Claude: フロントデザイン/設計ドキュメント作成 = Opus (`claude-opus-5`);
  UI デザイン実装/ドキュメント修正 = Sonnet (`claude-sonnet-5`);
  web 検索/doc パッチ = Haiku (`claude-haiku-4-5`)。
- Lightweight parallel lanes use spark/mini-class GPT/Codex models with no
  closing authority.
- Effort はモデル別基準ラダー (PO rule 2026-07-28) が既定: Sol/Fable = `low`、
  Opus/Terra/Sonnet = `middle`、Luna/spark/mini = `high`。回答が浅い時は
  **まず effort を 1 段、その先はモデルを上げる** (`escalateShallowResponse`):
  Sol/Fable → `middle`、Opus/Terra/Sonnet → `high`、そこでも浅ければ
  Sonnet→Opus `middle` / Opus・Terra・Luna・Fable→Sol `low` / spark・mini→Terra
  `middle`。**`xhigh` は既定として配らない** (PO rule 2026-07-28:
  「xhigh 以上はモデルを上げたほうがいい」)。ラダー外 (haiku 等) は従来既定
  (Claude `high` / GPT `middle`)。明示 `--effort xhigh` は有効で、UI/UX は
  task-kind 例外 (PO rule 2026-07-08)。
- Implementation work in `hybrid` is cross-executed and cross-reviewed: the
  non-orchestrating provider executes, and review returns to the other
  provider (tier-router implementation lane, PO rule 2026-07-08).
- Design/implementation review uses a top reviewer model: GPT frontier
  (`gpt-5.6-sol`) or Claude Opus (`claude-opus-5`) or above, behind the
  explicit frontier gate.
- advisor (PO rule 2026-07-29、2026-07-14 の行列を supersede): **技術判断**
  (実装方式 / トラブルシューティング) は `gpt-5.6-sol` 一次 (fallback Fable)、
  **設計・進行判断** (設計方式 / レーン選択 / 優先順位 / 段取り) と
  **デザイン/UI 判断** は `claude-fable-5` 一次 (次点 `gpt-5.6-sol`)。
  判断種別は `--decision design|progress|implementation|troubleshooting|uiux`
  で明示でき、省略時は task 文から推論する (進行語は technical 語より優先)。
  迷う場合は `ut-tdd advisor --task "..." --current-model <model>` を使い、
  実相談は `--execute` を付ける。

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

## Shared Guard Discipline (both runtimes)

配置規約に従い、両ランタイムで成り立つ guard 規律は本節が正本 (2026-07-28 時点で
片側のアダプタにしか無かった 3 件を集約した)。

- **doctor は singleton** (PLAN-L7-442)。二重起動は exit 2 + holder pid で fail-fast する。
  exit 2 を見たら**待つ**。retry も別形式 (`bun -e` / `--json` / 直接 `runDoctor`) での
  再起動もしない (2026-07-16 実害: doctor 16 並行、空きメモリ 31MB)。一部だけ要るなら
  `--scope` や check 関数の直接呼び出しを使う。
- **並列 subagent は既定上限 8** (`DEFAULT_MAX_PARALLEL`、`src/runtime/agent-slots.ts`)。
  `agent-slots` が fire/release を記録し上限到達を警告する (fail-open advisory であって
  fail-close gate ではない)。
- **foreign-edit override は one-shot**。`.ut-tdd/state/foreign-edit-override` に非空の理由を
  書いた場合のみ 1 回通り、その編集で消費 (削除) される。空 marker は通さない (理由なき
  silent override を作らない)。bypass は `.ut-tdd/logs/foreign-edit-overrides.jsonl` へ監査
  記録される。marker は**書いたセッションに紐付かない** — 消費前に読んだ任意のプロセスが
  使えてしまう first-come-first-served であり、実際に別セッションが他セッションの marker を
  消費した観測がある (2026-07-17T01:33:51)。env の `UT_TDD_ALLOW_FOREIGN_EDIT=1` は
  human 管理で消費されない。

## Safety Boundaries

- Do not write API keys, secrets, PII, or credentials into rules, docs,
  examples, or audit evidence.
- Escalate before changing authentication, authorization, payments, PII,
  licenses, destructive data operations, production infrastructure, or external
  API assumptions.
- Do not track local runtime artifacts except explicitly tracked audit /
  provider-handover evidence.

## UT-TDD Workflow

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `reverse <type> R0` -> `R1` -> `R2` -> `R3` -> `R4` -> Forward merge
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- Handover: check `.ut-tdd/handover/CURRENT.json` if present and non-stale.

## Instruction Files

- Shared project context: `CLAUDE.md`
- Claude Code runtime / hook policy: `.claude/CLAUDE.md`
- Codex CLI project rules: `AGENTS.md`
- Personal overrides: `CLAUDE.local.md` / `AGENTS.override.md`

## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do
not silently diverge.

- Codex project rules: `AGENTS.md`
- Claude runtime policy: `.claude/CLAUDE.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
