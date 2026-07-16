# Codex CLI - UT-TDD Agent Harness

This file is the Codex CLI project rules for this repository.

Separation of responsibilities:

- `CLAUDE.md`: shared project context.
- `.claude/CLAUDE.md`: Claude Code runtime / hook policy.
- `AGENTS.md`: Codex CLI project rules.

## コミュニケーション (報連相)

チャット上の報連相 (報告・連絡・相談) は **日本語** で行う (PO ルール、2026-06-22)。
進捗報告・調査結論・選択肢提示・確認依頼など PO へ向けた chat 出力は日本語を既定とし、
見出し・箇条書きラベルも日本語を優先する。これは Claude / Codex 両ランタイム共通のルール
(`CLAUDE.md` / `.claude/CLAUDE.md` と同一)。

ただし成果物はそれぞれの規約に従う: コード/識別子/commit message は従来どおり、ファイル名は
英語 (文字化け回避)、技術用語・コマンド・PLAN ID・パスは原語のまま埋め込んでよい (無理に和訳しない)。

**ドキュメント本文 (`docs/` 配下の PLAN / ADR / design / test-design / governance 等) は日本語で書く**
(PO ルール、2026-06-30。Claude / Codex 両ランタイム共通)。コード・識別子・コマンド・PLAN ID・パスは
英語/原語のまま。Windows 文字化けは UTF-8 化 (`.editorconfig` charset=utf-8 / `.gitattributes` eol=lf) と
`readability` gate (mojibake fail-close) で防ぐ前提であり、**文字化け回避を理由に doc を英語化しない**。

### 設計判断エリシテーション (PO ルール 2026-07-13)

PO への質問は **設計判断 (trade-off が実在する方式選択 / spec 未確定点) に限る**。
進捗確認・実行許可・自力で確定できる事実は聞かない (可逆作業は進める)。聞き方は
`docs/governance/design-decision-elicitation.md` の共通フォーマットに従う。Codex には
構造化質問ツールが無いため、`## 設計判断依頼` 見出し + 選択肢表 (案 / 得るもの / 失うもの、
推奨を先頭に「(推奨)」+ 理由 1 行) の markdown を出力して停止する。採択結果は PLAN の
設計判断節 / ADR に記録する (skill: `skills/design-decision-elicitation.md`)。

## Core Reads

For work in this repository, read the repository-owned sources below and follow
their workflow.

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` - concept for internal rollout
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` - requirements and acceptance criteria
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md` - extraction / cutover plan from the source snapshot
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md` - redesign policy and TypeScript/Bun implementation language
- `docs/governance/README.md` - canonical / reference / archive boundary under governance

Migration snapshots and inventories are not Core Reads. Read `docs/migration/`
only when migration, gap audit, or regression-source inspection requires it. Do
not treat it as UT-TDD runtime state or execution paths.

Do not load `docs/design/harness/L3-functional/roadmap.md` as a normal startup
read. The verification roadmap is read dynamically only at V-model freeze
boundaries when a verification cycle is being run. Normal work follows the
Forward descent path from L0 to L14.

ADR-001 is binding: The previous framework is a design source only. UT-TDD core implementation is
TypeScript/Bun. old W1-W3a Python is not ported as product runtime.
Thin `.ps1` / `.sh` entrypoints may call the compiled or Bun-based TypeScript
core. The language of repositories governed by UT-TDD is independent of the
harness implementation language.

`docs/archive/` is not canonical; it is historical material only. The HELIX
vendor snapshot has been removed now that the fork is complete (see
`docs/migration/helix-fork-completion-plan.md` §11).

## Session Start

1. Confirm the Core Reads above exist.
2. If `.ut-tdd/handover/CURRENT.json` exists, check it and follow any non-stale
   next action.
3. If `legacy local state/` exists, treat it as historical source state, not UT-TDD state.
4. If there is no active handover, start normally and say
   `OK: UT-TDD session initialized`.

## TL Driven Mode

When Codex CLI is used without another active runtime, act as the technical lead
for the current slice. This does not replace Claude Code; it means Codex can
execute, verify, and make gate decisions in `codex-only` or `standalone` modes.

- Carry design, implementation, review, tests, and verification through when
  feasible.
- Read relevant existing files before editing.
- Match existing structure, naming, and test placement.
- State gate outcomes in the final response when the change size requires them.
- Escalate before changing production infrastructure, authentication,
  authorization, payment, PII, secrets, licensing, external APIs, or other
  high-impact environment assumptions.

## UT-TDD Workflow

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `reverse <type> R0` -> `R1` -> `R2` -> `R3` -> `R4` -> Forward merge
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- Additive change: preserve existing design and add deltas through `add-design`
  / `add-impl`.
- Handover: use `.ut-tdd/handover/` as the session / cross-runtime handover
  source.

## Codex / Claude Code Harness

Codex and Claude Code are managed by UT-TDD Agent Harness through contract
plans, local CLIs, and hooks. They are not direct API calls in this product.

Runtime modes:

- `standalone`
- `claude-only`
- `codex-only`
- `hybrid`

Canonical commands:

- Codex execution: `ut-tdd codex --role <role> --task "..."`
- Claude prompt generation: `ut-tdd claude --role <role> --task "..." --dry-run`
- Team delegation: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
- Task classification: `ut-tdd task classify --text "..."` / `ut-tdd task estimate --plan <path>`
- Skill recommendation: `ut-tdd skill suggest --plan <path>`
- Review packet: `ut-tdd review --uncommitted`
- Handover: `ut-tdd handover`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`

When multiple AI runtimes are available, separate creation from judgement.
Design decisions, judgement gates, and R4 merge decisions should go through a
different runtime / model family when feasible. In single-runtime modes, record
`intra_runtime_subagent` as the review substitute and leave evidence.

### Blind review role (`--role blind-reviewer`)

`ut-tdd codex --role blind-reviewer --task "<packet>"` is the Codex side of blind
review. `blind-reviewer` / `blind-review` are read-only delegation roles: the
review session must stay non-destructive (review-guard enforces it), so the role
inspects and reports — it never implements or edits off-task.

The role judges the artifact, not the author's account. When you build the packet,
withhold the author's claims, self-assessment, stated intent, prior verdicts, and
identity/runtime. Run two lanes and report them separately:

- **claim-blind (main)**: artifact + spec/AC + tests you run yourself. Judge
  whether the artifact satisfies the spec regardless of what the author claims.
  Prose claims (`N green`, `blast radius 0`, `fully covered`) are not evidence
  (`coding ≠ substance`, PLAN-L7-89); if they appear in the packet, flag and
  disregard them and re-derive the verdict from spec + test results.
- **spec-blind (safety net)**: artifact only, spec withheld too. Judge internal
  soundness (self-contradiction, obvious bugs, uncovered boundaries, dead code).
  Requirement satisfaction is out of scope for this lane.

Use the valid-attack taxonomy and citation-only refutation from
`docs/plans/PLAN-L6-53-adversarial-review-mechanism.md`; verdict is FLAG (an
un-refuted attack), PASS (all attacks refuted by citation), or PASS-WEAK (no
attack found, with a trial log of at least three attempted attacks). In `hybrid`,
route blind review to the provider that did not author the change so
attacker/defender providers stay separated. The Claude subagent counterpart is
`.claude/agents/blind-reviewer.md`.

Model / effort routing defaults (task-kind ベース、PO rule 2026-07-14):

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
- Design/implementation review uses a top reviewer model: GPT frontier
  (`gpt-5.6-sol`) or Claude Opus (`claude-opus-4-8`) or above, behind the
  explicit frontier gate.
- 正規委譲経路 (`ut-tdd codex/claude --role <role>`) は上記 routing を機械強制する
  (PLAN-L7-255、`src/team/delegation-routing.ts`): 未登録 role は fail-close、
  判断ゲート role (reviewer / blind-reviewer / qa / tl 等) は族内 frontier reviewer tier
  へ固定、worker role は intent 推定既定。明示 `--model`/`--effort` が常に優先。
  effort は codex にも argv (`-c model_reasoning_effort=...`) で実注入される。
- advisor (PO rule 2026-07-14): 技術/設計/トラブルシューティング判断は
  `gpt-5.6-sol` 一次 (fallback Fable)、デザイン/UI 判断は `claude-fable-5` 一次
  (次点 `gpt-5.6-sol`)。迷う場合は
  `ut-tdd advisor --task "..." --current-model <model>` を使い、実相談は
  `--execute` を付ける。

Do not add legacy commands as current company/product execution paths.

## Hooks (Codex orchestrator parity)

Codex enforces the same guardrails as Claude through repo-local
`.codex/hooks.json` (PLAN-L7-139). It is **repo-relative only**; never write
hook config to global `~/.codex/`. It reuses the SAME TypeScript hook entrypoints
as Claude (`.claude/hooks/work-guard.ts`, `src/cli.ts session ...`) with NO logic
fork — the guard logic lives in `src/runtime/*.ts` and is runtime-agnostic.

Codex tool names differ from Claude, so matchers are mapped (not copied):

- `Edit|Write|MultiEdit` (Claude) -> `apply_patch|write_file` (Codex) for the
  foreign-edit `work-guard`. Codex's `apply_patch` is **freeform** and carries no
  `file_path` field — the edited paths live in the patch body
  (`*** Update File:` / `*** Add File:` / `*** Delete File:` / `*** Move to:`,
  multi-file). `work-guard` parses those headers so the foreign-edit block
  actually fires for `apply_patch` (Codex's primary edit tool), not just
  `write_file`.
- `Bash` (Claude) -> `exec_command|local_shell` (Codex) for `PostToolUse`
  session logging.
- `subagent-stop` (`SubagentStop`) has **no Codex surface** and is genuinely N/A:
  codex.exe 0.128.0 exposes only `PreToolUse` / `PostToolUse` / `SessionStart` /
  `Stop` / `UserPromptSubmit` hook events (no `SubagentStop`).
- `agent-guard` (`Agent`) is **not yet wired** for Codex. Codex DOES have a
  sub-agent surface (`spawn_agent` / `wait_agent` / `list_agents` tools), so an
  agent-guard analog is a **deferred follow-up** (a real, currently-unguarded
  surface), **not** an absent one. Wiring it needs a Codex allowlist/model design
  because `spawn_agent` semantics differ from Claude's `subagent_type`.

`.codex/hooks.json` parity with `.claude/settings.json` is machine-checked by `doctor`
`codex-hook-adapter`, which fails closed if a guard diverges, drops
`blockOnFailure`, depends on `$CLAUDE_PROJECT_DIR`, or references global
`~/.codex/`.

Scope boundary: `.codex/hooks.json` guards direct Codex CLI / Codex IDE sessions
only. Hosted API/developer tools supplied by the surrounding chat runtime (such
as this environment's `apply_patch`) do not execute through the Codex hook
engine, so repo hooks cannot mechanically intercept them. In that surface,
Codex must treat the hook as non-enforcing and perform explicit git/status
preflight before edits; do not claim mechanical hook coverage for API tool
calls.

## Skills

- Read only the relevant `SKILL.md` for matching triggers.
- Do not bulk-load all skills.
- Resolve `references/` relative to the skill directory.
- Pack / runtime skill content lives under root `skills/` so runnable skill
  assets are separated from explanatory `docs/` content.
- `src/skill-engine/` is TypeScript implementation code for skill
  recommendation / injection / scaffolding. It is not a skill content directory
  and should stay under `src/` with the rest of the harness core.
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

## Editing Rules

- Read target files before editing them.
- When reading tracked prose or source through PowerShell, specify UTF-8 explicitly
  (for example `Get-Content -Encoding utf8`) or use Node/Bun filesystem reads.
  Do not trust bare `Get-Content` / ANSI-default output for Japanese text; display
  mojibake can become real file corruption if copied back into docs. Repository
  gates enforce UTF-8 no-BOM and mojibake fail-close through `readability`.
- Match existing code structure, naming, and test placement.
- Treat existing uncommitted changes and **commits made by the other runtime
  (Claude)** as legitimate work; do not revert/reset/checkout them without
  explicit instruction.
- Do not write secrets, PII, or credentials into docs, rules, examples, or audit
  evidence.

## Git Rules (hybrid 多ランタイム協調)

- Use Conventional Commits. Stage explicit paths only (`git add <path>`; never
  `git add -A` / `git add .`).
- **history を書き換える前に `git log` / `git reflog` を確認**し、もう一方のランタイム
  (Claude) の commit を `reset` / `revert` / `checkout` / force で破棄・デグレさせない。
  working tree の foreign 変更は既定で「相手ランタイムの正規作業」とみなす。判断不能なら
  revert せず PO 確認。
- 自分の成果は相手の commit の上に積み、相手のファイルに触れない。
- **commit 直前に `git status` + `git diff --staged` (or `ut-tdd review --staged` /
  `--uncommitted`)** で、authored した意図ファイルのみが staged であることを検証する。
- push 済み履歴は破壊しない。
- **引き継ぎ・検証の基準点は commit/push 済 HEAD ただ一つ**。hybrid では working tree を
  相手ランタイムが常時書き換えるため、full tree の計測値は transient で非正本。検証は HEAD
  (+ 自分の意図変更のみ) に固定し、測定値が動いたら相手を疑う前に自分の baseline を疑う
  (foreign tree の transient を相手の退行と帰責しない)。引き継ぎ feedback は harness.db
  (`feedback_events`、PLAN-L7-110) から受け取り、stale 化する prose handover を正本にしない。
- **永続教訓は共有 HARNESS メモリへ昇格する** (`ut-tdd memory add`、正本 `.ut-tdd/memory/`、
  PLAN-L7-189)。PO ルール・教訓・落とし穴をランタイム私的メモリや chat 止まりにしない。
  エピソード状態 (進捗・次の一手) はメモリに書かず、DB/HEAD 由来の digest に任せる
  (stale 化する層を作らない)。

## Doctor Invocation Discipline (PLAN-L7-442)

`ut-tdd doctor` は長時間・read-only の **singleton** 検査。2 本目以降は exit 2
(保持者 pid 付き) で fail-fast する。規律:

- exit 2 (already running) は **実行中 doctor の完了を待つ**。再試行しない。
  起動形を変えた再実行 (`bun -e` / `--json` / `runDoctor` 直呼び) もしない。
  再試行嵐はマシンを飢餓させる (2026-07-16 incident: doctor 16 本並列、
  物理メモリ残 31MB)。
- 一部だけ要るなら scoped 実行 (`--scope toolchain`、テスト内の check 関数直呼び)
  を優先する。

## Test Rules

- Docs changes: use `rg` to check old assumptions such as WSL2-required wording,
  migration-source-as-current wording, personal absolute paths, and mojibake
  markers.
- Bash changes: `bash -n <changed-script>`.
- PowerShell changes: `powershell -NoProfile -ExecutionPolicy Bypass -File <changed-script>`.
- TypeScript core changes: `tsc --noEmit` plus targeted `vitest`.
- CLI / hook changes: smoke test Windows PowerShell and POSIX shell paths when
  relevant.

## Local Overrides

Personal overrides go in `AGENTS.override.md`. It is not tracked by Git.

## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do
not silently diverge.

- Shared context: `CLAUDE.md`
- Claude runtime policy: `.claude/CLAUDE.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
