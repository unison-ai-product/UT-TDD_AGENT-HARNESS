# Claude Code Runtime Policy - UT-TDD Agent Harness

## Active Runtime Boundary

この repository の Claude Code runtime は UT-TDD Agent Harness として扱う。HELIX 由来の hook / subagent / memory / `.helix/` / `vendor/helix-source/` は historical / migration material であり、現在の runtime state や実行導線ではない。

現在の正本導線は TypeScript/Bun の package-local 実装である。

- Runtime CLI: `ut-tdd`
- Runtime state: `.ut-tdd/`
- Core implementation: `src/`
- Hook configuration: `.claude/settings.json`

Claude Code が参照する優先順は `../CLAUDE.md` -> 本ファイル -> `../docs/governance/README.md` とする。Codex 向け project rules は `../AGENTS.md` を正本にする。

## Hooks

`.claude/settings.json` で有効化する hook は package-local の UT-TDD command だけにする。個人 workspace や HELIX runtime path へ依存する hook は有効化しない。

- `PreToolUse(Agent)`: `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/agent-guard.ts"`。subagent guard は fail-close。
- `SessionStart`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" session start`。session log / stale sweep は fail-open。
- `PostToolUse(Edit|Write|MultiEdit|Bash)`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" hook post-tool-use`。session log / drift advisory は fail-open。
- `Stop`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" session summary`。summary generation は fail-open。
- `SubagentStop`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" hook subagent-stop`。agent-slot release は fail-open。

Hook が HELIX 由来仕様を参照する場合でも、実装は UT-TDD 所有パスへ移植済みであることを条件にする。移植前の資料は参照だけにとどめ、直接実行しない。

## PLAN Rules

PLAN の起票・更新は `docs/plans/` の既存 PLAN を先に確認してから行う。重複 scope の新規 PLAN は作らず、既存 PLAN を拡張する。

MUST:

- `plan_id` は repository 内で一意にし、ファイル名と一致させる。
- `kind`, `layer`, `status`, `dependencies`, `review_evidence` を現行 schema に合わせる。
- 工程表 Step は `[並列]` または `[直列]` を明示する。
- `kind=add-impl` は対応する Reverse PLAN を持たせる。
- design / impl / add-* PLAN は用語更新を L0 用語集へ back-merge する。
- PO へ確定 gate を求める前に review evidence を残す。

検証は `ut-tdd plan lint`、対象 test、`ut-tdd doctor` を使う。`ut-tdd plan lint` が未対応の領域は、本ファイルと requirements の手動 binding rule を適用して evidence に残す。

## Runtime And Delegation

現在の操作 path は UT-TDD wrapper 経由に統一する。

- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`

Runtime mode は `standalone` / `claude-only` / `codex-only` / `hybrid` のいずれかで扱う。

`hybrid` mode では、設計判断・gate 判定・review は可能な限り別 runtime / 別 model 系統の reviewer に通す。`claude-only` / `codex-only` / `standalone` では cross-runtime review の代替として `intra_runtime_subagent` review を evidence に残す。

Raw `codex exec` / raw `claude` を通常運用の導線にしない。必要な場合は UT-TDD wrapper が session lifecycle / handover warning / audit evidence を記録できる形にしてから使う。

## Subagent Guard

`PreToolUse(Agent)` の active hook は `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/agent-guard.ts"` とする。実体は TypeScript の UT-TDD 実装であり、Windows native 環境でも動作することを前提にする。

強制ルール:

1. `subagent_type` は allowlist のみ許可する。
2. `model` frontmatter または明示 model がない Agent 呼び出しは block する。
3. 指定 model は agent frontmatter の family と一致させる。
4. bypass は `UT_TDD_ALLOW_RAW_AGENT=1` のみ。使用理由を会話または evidence に残す。
5. stdin の JSON parse 失敗や検証不能状態は fail-close とする。

Allowlist:

- `pmo-sonnet`
- `pmo-haiku`
- `pmo-helix-explorer`
- `pmo-helix-scout`
- `pmo-project-explorer`
- `pmo-project-scout`
- `pmo-tech-docs`
- `pmo-tech-fork`
- `pmo-tech-news`
- `pdm-tech-innovation`
- `pdm-marketing-innovation`
- `pdm-innovation-manager`
- `code-reviewer`
- `security-audit`
- `qa-test`

Allowlist 外の BE / DB / DevOps / general-purpose 作業は `ut-tdd codex --role <role> --task "..."` へ寄せる。

## Guard Rules

- 認証、認可、決済、PII、license、本番影響、destructive operation は人間確認なしに確定しない。
- `vendor/helix-source/` は read-only の移植元 snapshot として扱う。
- `.helix/` は active runtime state として扱わない。
- Secret、PII、credential を docs / examples / audit evidence に書かない。
- Hook failure は fail-close / fail-open の設計意図を確認し、黙って無視しない。
- Windows / macOS / Linux の native 動作を第一級対象にする。WSL2 は任意の互換環境であり必須条件ではない。

## Cutover Boundary

UT-TDD は HELIX の設計概念を取り込むが、product code は TypeScript/Bun で再実装する。HELIX Python module や旧 command を現在の operating path として記述しない。

Current cutover rule:

- UT-TDD-owned execution and state are current.
- HELIX materials are reference only.
- `.ut-tdd/harness.db` is rebuildable generated state.
- Migration work is documentation, command, state projection, and audit-feedback alignment.

Current cutover evidence:

- `docs/migration/helix-to-ut-tdd-cutover-strategy.md`
- `docs/plans/PLAN-M-01-cutover-backfill.md`
- `docs/plans/PLAN-L7-44-harness-db-master.md`
- `tests/projection-writer.test.ts`
- `src/state-db/projection-writer.ts`

## Local Preconditions

- `bun` is available on PATH.
- `CLAUDE_PROJECT_DIR` points to the repository root during hook execution.
- `.ut-tdd/` is writable generated runtime state.
- `.claude/settings.json` uses package-local commands only.
- Personal absolute paths are not required for normal operation.

## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do not silently diverge.

- Shared project context: `../CLAUDE.md`
- Codex project rules: `../AGENTS.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
