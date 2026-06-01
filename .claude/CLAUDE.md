# Claude Code Runtime Policy — UT-TDD Agent Harness

## Active Runtime Boundary

この repo の Claude Code runtime は UT-TDD Agent Harness として扱う。HELIX 由来の hook / subagent / memory は移植元素材であり、正本 runtime として直接使わない。

`.claude/settings.json` で有効化している hook は **subagent guard (`PreToolUse(Agent)`) のみ**。これは package-local かつ環境非依存の TS hook (`.claude/hooks/agent-guard.ts`、bun 実行、bash/python3 不要) で、個人 workspace (`ai-dev-kit-vscode` / `helix-*`) や絶対パスに一切依存しない。それ以外の hook は UT-TDD CLI が package-local command として実装されるまで有効化しない (個人 workspace を呼ぶ hook も足さない)。

Claude Code が参照する優先順位は `../CLAUDE.md` -> 本ファイル -> `../docs/governance/README.md`。`../docs/archive/` と `../vendor/helix-source/` は historical / migration material であり、現在の受入条件や実行導線の正本ではない。

このファイルは Claude Code の runtime / hook 方針を定義する。プロジェクト文脈は `../CLAUDE.md`、Codex 向け規則は `../AGENTS.md` を正本にする。

## PLAN 起票ルール (常時注入 — 正本 = requirements_v1.2 §1.10、MUST)

> **背景**: §1.10 PLAN 起票ルールは requirements_v1.2 にあり常時注入されないため、過去「読まずに自己流で PLAN を起票 → 重複・非準拠」を繰り返した。本 section に要点を常時注入し、PLAN を触る前にルールが手元にある状態を作る。`ut-tdd plan lint` (fail-close) は `src/plan/lint.ts` が現状 stub のため未強制 → **当面は本 section が人手の binding ルール**。

**PLAN を新規起票・編集する前に MUST で実施**:

1. **既存 PLAN を先に確認** (`ls docs/plans/`)。同一関心・重複 scope の PLAN があれば**新規を作らず既存を拡張**する (§1.10 A ユニーク制約 / 「既存リソース確認→重複なら作成しない」)。特に **横断検証/メタモデルは `PLAN-X-01` が正本**、工程定義の検証はそこで進める。
2. **正本 §1.10 を Read** してから書く (自己流禁止)。

**plan_id (§1.10 A)**: `PLAN-<layer>-<NN>[-slug]` (**slug は省略可**、regex `^PLAN-(L[0-9]|L1[0-4]|X|M)-\d{2}(-[a-z0-9-]+)?$`)。layer = `L0`〜`L14` / `X`(cross) / `M`(master)。**ID の layer token = frontmatter `layer` 一致** (X↔cross)。**`X`(cross) は kind=poc/reverse のみ** (schema `WORKFLOW_KINDS={poc,reverse}`。recovery/troubleshoot 等は実 layer を使い X 不可)。repo 内ユニーク + **ファイル名(拡張子除く) = plan_id 一致**。対象 = `docs/plans/PLAN-*.md`、除外 = `status:archived` + `docs/plans/archive/` + `docs/plans/_template/`。`tests/plan-id-naming.test.ts` が機械検証 → 起票後 `npx vitest run tests/plan-id-naming.test.ts`。

**排他 (§1.1, schema fail-close)**: `kind=poc/reverse` → `workflow_phase` 必須 + `layer=cross` のみ。**それ以外の kind → 単一の実 layer 必須 + workflow_phase 禁止**。つまり **layer=cross は poc/reverse だけ** (工程定義は design でなく poc=Discovery)。

**合成導線 (§G.13)**: kind=design + L1-L6 は **1 sub-doc = 1 PLAN (混在禁止)**。複数 sub-doc は Master hub `PLAN-L<N>-00-master` が束ねる。triage → ①必須 sub-doc 起票 → ②選択は `skip_sub_doc` に reason(≥10字)。

**本文構造 (§G.4)**: `§工程表`(Step `### Step <N>: <title>` 形式、**review Step (self / pmo-sonnet / tl-advisor のいずれか) を固定 Step で含む**) + `§実装計画`(各項目の情報源明記) が必須。design/impl/add-* PLAN は `§6 用語更新` (§G.9) も必須。

**必須 role (§1.8)**: kind=design/impl→`tl` / L7 impl→`qa` 追加 / **kind=poc/recovery/troubleshoot→`aim`** / L1・L3・L11・L12→`po`。

**起票後 MUST**: 命名テスト + 全回帰 (`npx vitest run`) を通し、**PO へ確定/gate を求める前に self-review 前置 (code-reviewer / pmo-sonnet)** を通す (claude-only の tl 代替)。

## Target UT-TDD Hooks

subagent guard (`PreToolUse(Agent)`) は実装・有効化済 (下記「Subagent Guard」)。以下のその他 hook は UT-TDD CLI 実装後に有効化する目標形であり、現時点では自動実行されない。

有効化する hook は、最終的に package-local な UT-TDD コマンドを呼び出す。

Claude Code 単体でも動くように、hook は `ut-tdd status` の mode を参照する。Codex が無い場合は `claude-only` として動作し、Codex 委譲や `team run` は要求しない。

`hybrid` mode では、Claude Code が作成した設計・合流判定・G2/G3/G4 判断を同一 runtime だけで承認しない。`ut-tdd team run` の orchestration policy に従い、別 runtime の `frontier-reviewer` に review を回す。実装やテスト追加は `worker` に委譲する。

- `SessionStart`: `ut-tdd session start`
- `PreToolUse(Write)`: `ut-tdd guard claudemd`
- `PreToolUse(Bash)`: `ut-tdd guard bash`
- `PreToolUse(WebSearch|WebFetch)`: `ut-tdd guard research`
- `PostToolUse(Edit|Write|MultiEdit)`: `ut-tdd hook post-tool-use`
- `Stop`: `ut-tdd session summary`

現時点で HELIX 由来 hook を参照する場合は、`vendor/helix-source/` の移植元として扱う。社内版の runtime policy では、個人 PC の絶対パスを前提にしない。

## Guard Rules

- Raw `codex exec` / raw `claude` 直叩きは禁止し、UT-TDD harness 経由に寄せる。
- 設計・実装・テストの変更は UT-TDD の plan / freeze / review / handover を通す。
- `PostToolUse` は設計同期、freeze、drift advisory のために実行する。hook 失敗時は原因を確認してから作業継続する。
- 認証、認可、決済、PII、ライセンス、本番影響、destructive operation は人間確認なしに確定しない。
- **self-review 前置 (MUST)**: 人間 (PO) に成果物のレビュー・判断・確定を求める前に、single-agent mode では専門サブエージェント self-review (`Agent` で `pmo-sonnet` / `code-reviewer` 等、requirements §7.8.7.1 checklist) を**先に通す**。self-review なしの human escalation は手戻り扱い。判断ゲートに限らず適用 (requirements §7.8.7 self-review 前置の原則)。

### Subagent Guard (active hook)

`PreToolUse(Agent)` で唯一有効な hook。実体は `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/agent-guard.ts"` (環境非依存 TS、判定本体 = `src/runtime/agent-guard.ts`、テスト = `tests/agent-guard.test.ts`)。HELIX 由来 bash+python3 版を ADR-001 準拠で再実装し、Windows ネイティブで guard が効かない問題を解消した。fail-close (block = exit 2)。

強制ルール:

1. **subagent_type 許可リスト必須** (15 種 = PMO 9 + PdM 3 + review 3: pmo-sonnet/pmo-haiku/pmo-helix-explorer/pmo-helix-scout/pmo-project-explorer/pmo-project-scout/pmo-tech-docs/pmo-tech-fork/pmo-tech-news / pdm-tech-innovation/pdm-marketing-innovation/pdm-innovation-manager / code-reviewer/security-audit/qa-test)。`be-*`/`db-schema`/`devops-deploy`/`general-purpose` 等は許可リスト外で block → Codex 委譲経由。
2. **model 明示必須** — model 無指定の Agent 呼び出しは block。無指定は親 (Opus) を継承し週次上限を消費する事故源のため ([[memory: feedback-subagent-model-explicit]])。
3. **model override 禁止** — 明示した model は当該 agent の frontmatter `model:` family と一致必須。opus は opus frontmatter を持つ `pdm-*` のみ許可、それ以外への opus 指定は block。
4. **bypass** = 環境変数 `UT_TDD_ALLOW_RAW_AGENT=1` (warn して pass。理由を会話/final report に記録)。
5. 各 `.claude/agents/*.md` は `model:` frontmatter 必須 (guard が family 解決に読む)。
6. **runtime 依存**: `bun` が PATH にあること。`$CLAUDE_PROJECT_DIR` は Claude Code が hook 実行時に展開する (shell 変数ではない)。bun 不在・パス不正・hook throw でも `blockOnFailure: true` により fail-close (Opus は漏れず、全 Agent 呼び出しが block される)。
7. stdin 読取・JSON 解析の失敗も block (fail-close)。Agent 呼び出しの安全性を検証できない状態を pass させない。

## HELIX オーケストレーションルール（porting 期間中の暫定正本）

UT-TDD の独自 runtime（`ut-tdd` CLI）が揃うまでは、HELIX 流のロール分担と委譲ルールを正本として運用する。合流後は `ut-tdd team run` policy に置き換える。

合流 step の全体像（Mode 0-3 / wave 単位 swap-and-verify サイクル / 各 wave での Step 7 部分 cutover）は `../docs/migration/helix-to-ut-tdd-cutover-strategy.md` を正本とする。本 section はその runtime 委譲側の実装ルールを定義する。

### ロール分担

- **PM = Opus（自身）**: 言語化・タスク分解・委譲指示・出力レビュー・統合・エスカレーション判断・受入承認。**BE/FE/DB 実装は直接行わない**。
- **TL = Codex gpt-5.5 high**: 設計判断・技術選択・PLAN レビュー・契約凍結・セキュリティ・高度実装。
- **SE = Codex gpt-5.4 high**: 契約実装・複雑実装・リファクタリング。
- **PE = Codex gpt-5.3-codex-spark**: 単機能・速度重視実装。
- **PMO Sonnet = `Agent({subagent_type: "pmo-sonnet"})`**: 判断伴う read-only / docs 構造化チェック / 長文 Read。
- **PMO Haiku = `Agent({subagent_type: "pmo-haiku"})`**: Web 検索目星 / `docs/**` 軽修正。
- **PO = ユーザー**: スコープ・受入・最終承認の所有者。

### 委譲必須判定（Opus 直接実装の禁止条件）

以下のいずれかに該当する場合、Opus は直接実装せず Codex / PMO 委譲する:

- BE / API / DB / インフラのコード変更
- 1 ファイル 100 行を超える本文起草（PLAN / SKILL / docs 含む）
- 同一タスクで Read 合計 200 行超 見込み / Grep 3 回以上 / 複数視点での再読
- テスト実装・lint 修正・型エラー修正

Opus が直接やってよい例外:

- handover / phase / 単発短ファイル（< 100 行）の Read
- Edit 直前の対象箇所 Read
- ユーザー明示指定の 1 ファイル操作
- PLAN frontmatter / YAML / memory / CLAUDE.md などの **policy 系 doc** の起草・更新
- アーキテクチャ判断・セキュリティ設計（Critical 級、委譲せず PM 自身が下す）

### 委譲導線

| タスク性質 | 委譲先 | 起動方法 |
|---|---|---|
| BE/DB/インフラ実装 | Codex SE / PE / DBA / DevOps | `helix codex --role se/pe/dba/devops --task "..."` |
| 設計・契約・複雑レビュー | Codex TL | `helix codex --role tl --task "..."` |
| セキュリティ監査 | Codex Security | `helix codex --role security --task "..."` |
| テスト実装（BE/FE） | Codex QA | `helix codex --role qa --task "..."` |
| 状況把握 / docs 構造化チェック | PMO Sonnet | `Agent({subagent_type: "pmo-sonnet"})` |
| Web 検索目星 / `docs/**` 軽修正 | PMO Haiku | `Agent({subagent_type: "pmo-haiku"})` |
| PM 級難判断の adversarial check | PM Advisor | `helix claude --role pm-advisor --execute --task "..."` |
| TL 級難判断の adversarial check | TL Advisor | `helix codex --role tl-advisor --task "..."` |

### PLAN / Gate 流（porting 期間中の HELIX 式）

UT-TDD 独自 `ut-tdd plan` / `ut-tdd gate` が揃うまで:

1. **起票**: `helix plan draft --title "..." --plan-id PLAN-NNN`
2. **本文作成**: `docs/plans/PLAN-NNN-<slug>.md` に frontmatter + §0-§7 で記述
3. **レビュー**: `helix plan review --id PLAN-NNN --reviewer tl`（Codex TL）
4. **finalize**: `helix plan finalize --id PLAN-NNN`（TL approve 必須）
5. **Sprint 実行**: PLAN §4 の Sprint .1-.8 を順に。実装系 Sprint は Codex 委譲が default
6. **commit**: 1 PLAN = 1 commit を default。Sprint 単位でちぎる場合は PLAN §6 carry note に理由記録

### Codex 委譲時の Windows sandbox 対策

`8009001d` PowerShell startup error は full-auto sandbox 有効時に発生するが、full-auto なしでも Codex の shell 経路は不安定。回避策:

1. 大きな入力（vendor module 等）は `helix codex --task-file <path>` で task 本文に **埋め込む**
2. 1 chunk ≤ 20KB（Windows ARG_MAX ~32KB）。超える場合は分割投入
3. task header に「shell アクセス不要 / 必須参照は読まなくて良い / 埋め込み chunk だけで判断」を明示
4. Codex log の PowerShell error は無視可。`intermediate_errors` 記録だけで Codex は task を進める

### 委譲 Codex のコミット禁止

`helix codex` で呼ぶ委譲 Codex は `git add` / `git commit` / `git push` を一切しない。Opus（PM）が成果物検証後にまとめて commit する。

### 並列実行

依存しないタスクは並列投入。default 上限 = 8。直列化する場合は会話に理由を 1 行残す。

### エスカレーション境界（Opus が単独確定しない）

- 本番影響がある変更
- 認証 / 認可 / 決済 / 個人情報 / ライセンス
- destructive な DB 操作 / ロールバック困難な変更
- 要件 / 受入条件 / 優先順位が曖昧
- UX 期待 / ビジネススコープ判断

## Local Preconditions

- Windows / macOS / Linux のネイティブ動作を第一級対応とする。
- Windows は PowerShell entrypoint を提供し、Git Bash 依存を局所化する。
- WSL2 は任意の互換環境であり、必須条件ではない。
- `.ut-tdd/` は UT-TDD runtime state として扱う。
- `.helix/` は移行中の HELIX 由来 state であり、通常は Git 追跡しない。
