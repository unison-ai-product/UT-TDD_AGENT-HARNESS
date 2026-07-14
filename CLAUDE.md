# UT-TDD Agent Harness

## Claude Code Read Order

Claude Code treats the following as canonical in this repository:

1. `CLAUDE.md`
2. `.claude/CLAUDE.md`
3. `docs/governance/README.md`
4. `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
5. `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
6. `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
7. `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`

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
UT-TDD implementation is TypeScript/Bun. old W1-W3a Python is not
current product runtime.

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
- `src/`: TypeScript/Bun harness core
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

## Coding Rules

- Read the relevant files before editing.
- Match local naming, structure, and test placement.
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
  エピソード状態 (進捗・次の一手) はメモリに書かず、DB/HEAD 由来の digest に任せる
  (stale 化する層を作らない)。

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

Task-kind ベースの割当 (PO rule 2026-07-14、旧 tier 記述を supersede):

- Codex: テスト実装 = `gpt-5.6-terra`; 実装/ドキュメント修正 = `gpt-5.6-luna`
  (effort `high` 基準、worker `middle` 既定の上書き); 検証/設計 = `gpt-5.6-sol`;
  軽量実装/内部探索/web 検索/doc パッチ = `gpt-5.3-codex-spark` / `gpt-5.4-mini`。
- Claude: フロントデザイン/設計ドキュメント作成 = Opus (`claude-opus-4-8`);
  UI デザイン実装/ドキュメント修正 = Sonnet (`claude-sonnet-5`);
  web 検索/doc パッチ = Haiku (`claude-haiku-4-5`)。
- Lightweight parallel lanes use spark/mini-class GPT/Codex models with no
  closing authority.
- Effort はモデル別基準ラダー (PO rule 2026-07-14) が既定: Sol/Terra/Fable =
  `low`、Sonnet = `middle`、Opus/Luna/spark = `high`、mini = `xhigh`。回答が
  浅い時は 1 段引き上げ (Sol/Terra/Fable → `middle`、Sonnet → `high`、Opus →
  `xhigh`)、Terra が `middle` でも浅い場合は Sol `low` へ乗り換える
  (`escalateShallowResponse`)。ラダー外 (haiku 等) は従来既定 (Claude `high` /
  GPT `middle`)。UI/UX のみ task-kind 例外で `xhigh` (PO rule 2026-07-08)。
- Implementation work in `hybrid` is cross-executed and cross-reviewed: the
  non-orchestrating provider executes, and review returns to the other
  provider (tier-router implementation lane, PO rule 2026-07-08).
- Design/implementation review uses a top reviewer model: GPT frontier
  (`gpt-5.6-sol`) or Claude Opus (`claude-opus-4-8`) or above, behind the
  explicit frontier gate.
- advisor (PO rule 2026-07-14): 技術/設計/トラブルシューティング判断は
  `gpt-5.6-sol` 一次 (fallback Fable)、デザイン/UI 判断は `claude-fable-5` 一次
  (次点 `gpt-5.6-sol`)。迷う場合は
  `ut-tdd advisor --task "..." --current-model <model>` を使い、実相談は
  `--execute` を付ける。

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
