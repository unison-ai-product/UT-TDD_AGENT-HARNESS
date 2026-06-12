# Codex CLI — UT-TDD Agent Harness

このファイルは Codex CLI 向けの project rules。Claude Code 側の project context は `CLAUDE.md`、Claude runtime / hook の詳細は `.claude/CLAUDE.md` を参照する。三者の分担は固定で、`CLAUDE.md` は共有 project context、`.claude/CLAUDE.md` は Claude Code runtime / hook policy、`AGENTS.md` は Codex CLI project rules とする。

## Core Reads

タスク受領時は必ず以下を Read してフローに従う。

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` — 社内展開向け構想書
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` — 要件定義・受入条件
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md` — 移植元からの切り出し計画
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md` — 再設計方針・実装言語 (TypeScript/Bun)
- `docs/governance/README.md` — governance 配下の正本 / 参照 / archive 境界

移植元 snapshot / migration inventory は Core Reads ではない。移植・差分監査・回帰観点抽出が必要なときだけ `docs/migration/` と `vendor/helix-source/` を参照し、UT-TDD の正本や実行導線として扱わない。

**検証ロードマップは常時参照しない（節目限定の動的参照）**: `docs/design/harness/L3-functional/roadmap.md`（検証ロードマップ）は Core Reads に含めない。**定常は Forward 工程（L0→L14 の設計降下）が本線**で、検証ロードマップは **V-model 層群（L0-L3 / L4-L6 / L7 / L8-L14 など）の Forward が freeze 完了した節目で検証サイクルを回すときだけ動的に Read する** band。検証タイミングは V-model 単位に依存して機械発火させる（崩れ防止の全体調整）。定常作業を検証ロードマップの Phase / サイクルで語らない。

**実装方針 (ADR-001)**: HELIX は設計概念のみ取り込み、内部は **TypeScript (Bun) で全面再実装**する。HELIX / 旧 W1-W3a の Python は port せず TS で作り直す。core (`src/`) は TS、薄い `.ps1`/`.sh` entrypoint が compiled binary を呼ぶ。UT-TDD が統制する対象リポジトリの言語は非依存。

`docs/archive/` と `vendor/helix-source/` は正本ではない。`vendor/helix-source/` は移植元 snapshot であり、productizing 作業では vendor を直接編集せず、UT-TDD 所有パスへコピーしてから名称・前提・Windows 対応を差し替える。

## Session Start

1. 上記 Core Reads が存在するか確認する。
2. `.ut-tdd/handover/CURRENT.json` が存在する場合は、内容を確認して stale でない Next Action に従う。
3. `.helix/` が存在しても HELIX runtime state として扱い、UT-TDD 正本 state にはしない。
4. handover がなければ通常開始し、「OK: UT-TDD セッション初期化完了」と宣言する。

## TL Driven Mode

Codex CLI 単体利用時は TL（テックリード）として自律動作する。これは Claude Code を置き換える意味ではなく、`ut-tdd status` が `codex-only` または `standalone` を返す環境で、Codex が実行・検証・ゲート判定を自己完結するための読み替えである。

- 設計、技術的難易度評価、実装、レビュー、テスト、検証を一気通貫で進める。
- 実装前に対象ファイルを Read し、既存構造・命名・テスト配置へ合わせる。
- ゲート判定は変更規模に応じて行い、結果を final で簡潔に示す。
- 不明点、本番影響、認証、認可、決済、PII、ライセンス、外部 API / infrastructure / env 変更は人間に確認する。

## UT-TDD Workflow

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `reverse <type> R0` -> `R1` -> `R2` -> `R3` -> `R4` -> Forward 合流
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- Additive change: 既存設計を破壊せず `add-design` / `add-impl` として差分を積む。
- Handover: セッションや担当をまたぐ場合は `.ut-tdd/handover/` を正本にする。

## Codex / Claude Code Harness

Codex と Claude Code は API 直叩きではなく、契約プラン + ローカル CLI / hook を UT-TDD Agent Harness が管理する対象。片方だけの環境でも `ut-tdd status` が mode を判定し、単体実行できる範囲を明示する。`hybrid` は Claude Code / Codex 共存、`claude-only` は Claude Code 単体、`codex-only` は Codex 単体、`standalone` は利用可能 runtime だけで最小実行する mode として扱う。

将来の正本コマンド:

- Codex 実行: `ut-tdd codex --role <role> --task "..."`
- Claude Code prompt 生成: `ut-tdd claude --role <role> --task "..." --dry-run`
- 複数 role 委譲: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
- タスク判定: `ut-tdd task classify --text "..."` / `ut-tdd task estimate --plan <path>`
- skill 推挙: `ut-tdd skill suggest --plan <path>`
- 差分レビュー: `ut-tdd review --uncommitted`
- 引継ぎ: `ut-tdd handover status --json`
- 状態確認: `ut-tdd status --json` (`standalone` / `claude-only` / `codex-only` / `hybrid`)

複数 AI を使える場合は、判断と実行を分ける。設計判断・判断ゲート (G0.5/G2/G4-G7) レビュー・R4 合流判定は、現在作業している AI とは別 runtime / 別 model 系統の `frontier-reviewer` に依頼する。実装・テスト追加・文書整形は `worker` に委譲し、軽量分類や要約は `fast-checker` に寄せる。同一 `runtime + model` が作成と承認を兼ねる構成は避ける。`claude-only` / `codex-only` / `standalone` では cross-runtime review の代替として `intra_runtime_subagent` review を必須とし、cross-agent 不在と代替 reviewer を evidence に残す (構想書 §2.1.2.1)。

現時点で未移植の機能は `vendor/helix-source/` から参照してよいが、`helix` コマンドを社内版の正本導線として記述しない。

## Skills

- triggers 該当時は該当スキルの `SKILL.md` だけを Read する。
- 全スキル一括読み込みは禁止。
- skill 内の `references/` は skill ディレクトリからの相対パスで解決する。
- HELIX 由来 skill は移植元として扱い、UT-TDD 正本化時に名称・前提・対象 OS を確認する。

## Editing Rules

- 実装前に必ず対象ファイルを Read する。
- 既存コードの構造、命名、テスト配置へ合わせる。
- 既存の未コミット変更はユーザー作業として扱い、巻き戻さない。
- secret、PII、credential を docs / rules / examples に書かない。
- `vendor/helix-source/` は原則 read-only。移植時は UT-TDD 所有パスへコピーして編集する。

## Test Rules

- Docs 変更: `rg` で旧前提（WSL2 必須、HELIX 正本表現、個人絶対パス）を確認する。
- Bash 変更: `bash -n <changed-script>`
- PowerShell 変更: `powershell -NoProfile -ExecutionPolicy Bypass -File <changed-script>`
- TypeScript 変更 (core 実装): `tsc --noEmit` (型チェック) + 対象 `vitest` (ADR-001。実装言語は TS/Bun)
- CLI / hook 変更: Linux/macOS POSIX shell と Windows PowerShell の両方で smoke test する。Windows 側で Git Bash bridge が必要な hook は bridge 経由も確認する。

## Local Overrides

個人差分は `AGENTS.override.md` に書く。`AGENTS.override.md` は Git 追跡しない。

## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do not silently diverge.

- Shared context: `CLAUDE.md`
- Claude runtime policy: `.claude/CLAUDE.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
