---
plan_id: PLAN-DISCOVERY-06-orchestrator-rule-parity
title: "PLAN-DISCOVERY-06 (kind=poc): orchestrator-rule parity — harness ガードを単一 SSoT 化し各 orchestrator (Claude hooks / Codex plugin) の機械強制面へ materialize する feasibility 検証"
kind: poc
layer: cross
workflow_phase: S4
scrum_type: design-spike
drive: fullstack
status: completed
decision_outcome: confirmed
created: 2026-06-23
updated: 2026-06-24
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: aim
    slot_label: "AIM — orchestrator-rule parity の方向性策定"
  - role: tl
    slot_label: "TL (Codex, 別 runtime) — Codex plugin/hook API の裏取り + 設計クロスレビュー"
  - role: po
    slot_label: "PO — global vs repo スコープ判断 + 採否最終判断"
generates:
  - artifact_path: docs/plans/PLAN-DISCOVERY-06-orchestrator-rule-parity.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - PLAN-L7-114-work-guard
---

# PLAN-DISCOVERY-06 (kind=poc): orchestrator-rule parity

## 0. Objective (PO 指示 2026-06-23「しばっておきたい」「オーケストレーターに同じルールを持たせるべき」)

Claude Code も Codex も **対話しながら駆動する orchestrator** であり、双方とも hook/plugin の
機械強制面を持つ。よって harness のガード (work-guard / agent-guard / session-log lifecycle /
hybrid 規律) は **「どの orchestrator が回しても効く」= orchestrator 層の単一ルール (SSoT)** として
定義し、各 orchestrator のネイティブ強制面へ materialize すべき。本 spike はその feasibility を検証する。

## 1. Gap (なぜ必要か)

現状、機械強制を持つのは **Claude Code 側だけ** で Codex は prose (AGENTS.md) 止まり = 片肺。

| ガード | Claude Code (repo) | Codex (調査実体) |
|---|---|---|
| 強制機構 | `.claude/settings.json` hooks + `.claude/hooks/*.ts` (blocking PreToolUse) | `~/.codex/rules/*.rules` (`prefix_rule` = コマンド承認 allow/deny) / `config.toml` (`[projects.*] trust` / sandbox / approval) / `codex plugin` (marketplace) / repo `AGENTS.md` (prose) |
| work-guard (foreign 未コミット編集 block) | あり | **なし** |
| agent-guard (subagent allowlist/model) | あり | **なし** |
| session-log lifecycle | auto (hooks) | `ut-tdd codex` wrapper 経由のみ |
| スコープ | repo-local | 主に global `~/.codex/` |

`rule-drift` (現行) は AGENTS/CLAUDE adapter の **marker 文字列**しか見ず、挙動 parity を検証しない。

## 2. 検証方針 (spike method)

1. **(A) Codex plugin/hook API の裏取り (cross-review、別 runtime=Codex)**: `prefix_rule` は
   コマンド prefix の allow/deny 承認機構。work-guard のような「git 状態を見て編集を blocking 判定する
   任意の hook」を Codex plugin で書けるか / イベント種別 (pre-tool-use 相当) / repo スコープ可否を
   Codex 本人に確認する ([[feedback_cross_review_before_po_escalation]])。
2. **(B) スコープ判断 (PO)**: Codex 強制は global `~/.codex/` が主。harness は repo-local 原則ゆえ、
   repo スコープで縛れるか (per-project config / repo 同梱 plugin) を確定。**global config 書込みは
   不可逆・全プロジェクト影響ゆえ必ず PO 確認後** ([[feedback_forced_stop_high_severity_recovery]] と同等の escalate 対象)。

## 3. 設計仮説 (spike が支持すれば本実装 PLAN へ)

1. **orchestrator-rule SSoT**: harness 側に guard 定義を 1 箇所で持つ。
2. **materializer**: SSoT から各 orchestrator のネイティブ設定を生成 (`ut-tdd setup` が emit)。
   Claude=`.claude/settings.json`+hooks (既存)、Codex=plugin/rules/config。
3. **rule-drift 拡張**: marker 文字列だけでなく **両 orchestrator が同一 guard を実際に強制しているか**を
   doctor で fail-close 検証する。

## 4. AC / exit (S4 decision)

- (A) Codex plugin hook API の可否が事実として確定 (Codex cross-review evidence)。
- (B) global vs repo スコープの PO 方針が確定。
- 上記 2 点を踏まえ orchestrator-rule SSoT + materializer + rule-drift 拡張の採否を S4 で決定し、
  採用なら本実装 PLAN (L6 設計 → L7 impl) を切る。spike 段階では src を作らない (feasibility のみ)。

### AC 充足状況 (S4 close、2026-06-24)

- **(A) 確定済み**。`codex.exe` (0.128.0) binary 裏取り + `PLAN-L7-139-codex-hook-adapter`
  (confirmed) の cross-runtime review (`ut-tdd codex --role qa`、reviewer=Codex/gpt-5.5) で
  blocking hook 機構の実在を確認。実装着地済み (`hooks.json` + `src/lint/codex-hook-adapter.ts` +
  `src/runtime/work-guard.ts` の `extractEditTargets`、`tests/codex-hook-adapter.test.ts` green)。
- **(B) 確定済み = repo-local 採用 (PO 方針追認)**。`L7-139` は repo-local `.codex/hooks.json`
  (`./` cwd 相対) で着地し、**global `~/.codex/` への書込みは行わない** (global 書込みは不可逆・
  全プロジェクト影響ゆえ、将来必要時は別途 PO 明示判断を要する残差として保持)。
- **IMP-064 (Reverse 合流) 充足**: `decision_outcome: confirmed` (ADOPT=reuse-with-hardening) は
  scrum-reverse ゲートで Reverse 合流 PLAN を要求する。`PLAN-REVERSE-139-codex-hook-adapter`
  (R4 / design / confirmed) を起票し、採用知見を L4 architecture §6 へ back-fill した。

## 5. Spike findings (2026-06-23、binary 実体 + 実例で裏取り)

`codex.exe` (codex-cli 0.128.0) の文字列と既存 plugin の `hooks.json` 実例から確定:

- **(A) blocking hook: YES**。Codex は **Claude Code とほぼ同一の hook 機構**を持つ。
  - 設定ファイル = **`hooks.json`**。構造は `.claude/settings.json` と同型:
    `{ "hooks": { "<Event>": [ { "matcher": "Write|Edit", "hooks": [ {"type":"command","command":"..."} ] } ] } }`
    (実例 = figma plugin の `hooks.json`)。
  - イベント名 = `PreToolUse` / `PostToolUse` / `SessionStart` / `UserPromptSubmit` / `Stop` / `Notification`
    (binary: `pre_tool_use`/`post_tool_use`/`session_start`/`user_prompt_submit`)。
  - 出力プロトコルも Claude 互換: `decision` / `permissionDecision` (`deny`/`ask`/`allow`) /
    `hookSpecificOutput` / `additionalContext` / `systemMessage` / `reason`。payload も
    `hook_event_name` / `permission_mode` / `stop_hook_active` / `last_assistant_message` と同名。
  - → hook 機構 (event/protocol 形) は Claude 互換だが、**スクリプトを「ほぼそのまま移植可」と
    した当初記述は誤り (errata、下記参照)**。

> **errata (2026-06-24、`PLAN-L7-139` の cross-runtime review = reviewer Codex/gpt-5.5 が
> REJECT→全 TRUE 確認で訂正済み)。本 §5 の「ほぼそのまま移植可能」は偽パリティであり、正しい
> 設計は `L7-139` 側にある。具体的な偽パリティ caveat:**
>
> 1. **(Critical) `apply_patch` は freeform で `tool_input.file_path` を持たない** (パスは patch
>    本文)。元の `file_path ?? path` 抽出は apply_patch で no-op = 偽パリティ。→ `L7-139` の
>    `extractEditTargets` (runtime-agnostic pure fn) が patch 本文の複数ファイルパスを抽出して訂正。
> 2. **(Important) matcher の tool 名が違う** (`apply_patch|write_file` / `exec_command|local_shell`)。
>    Claude の `Write|Edit` を literal copy しても発火しない = 偽パリティ。
> 3. **(Important) `agent-guard` は N/A ではなく deferred**。Codex は `spawn_agent` 族 (real
>    sub-agent surface) を持ち現状未ガード = `CODEX_DEFERRED_SURFACE`。**真に N/A なのは
>    `subagent-stop` のみ**。
> 4. **(scope boundary) `.codex/hooks.json` の効力範囲は direct Codex CLI/IDE の repo-local hook**
>    であり、hosted/API runtime の `apply_patch` までは機械的に intercept しない。この制限は
>    `L7-139` 側で明示済み (本 S4 結論にも同じ制限が掛かる)。
>
> → 実装・正しい設計は `PLAN-L7-139-codex-hook-adapter` (confirmed、PR #1 マージ済) を参照。
> 本 spike は draft 段階の自己訂正のため `supersedes` 厳格機構 (PLAN-L7-89、confirmed PLAN の
> claim 訂正用) の対象外。DISCOVERY-06 → L7-139 の参照リンクで足りる。

- **(B) スコープ: repo-local が可能**。`./hooks.json` (cwd 相対) + `hooks/hooks.json` + plugin 同梱の
  パターンが binary にあり、**repo 同梱 `hooks.json` で「このリポジトリで codex を回す時だけ効く」hook**を
  配れる見込み (`L7-139` で repo-local 着地・global `~/.codex/` 書込みなしを実証)。
- 残検証 (build 時): work-guard が読む payload フィールド名の差は `L7-139` で確定済み
  (apply_patch は `file_path` 不在 → `extractEditTargets` で patch 本文パース、上記 errata #1)。

**S4 recommendation = ADOPT (reuse-with-hardening)**。orchestrator-rule SSoT + materializer
(`.claude/settings.json` ⊕ repo `.codex/hooks.json` を 1 ソースから emit) + rule-drift の挙動 parity 拡張へ進む。
本実装は L6 設計 → L7 impl の別 PLAN を切る。

## 5.1 S4 decision log (close、2026-06-24)

- **decision_outcome = confirmed (ADOPT = reuse-with-hardening)**。hook 機構を再利用しつつ
  偽パリティ 4 点を hardening (§5 errata)。実装は `PLAN-L7-139-codex-hook-adapter`
  (confirmed、PR #1) で forward 着地済み。
- **cross-runtime review (判断ゲート、[[feedback_cross_review_before_po_escalation]])**: reviewer =
  Codex/gpt-5.5 (`ut-tdd codex --role qa`、別 runtime)、verdict = **approve-with-changes**。
  - (a) §5 errata 補正 = 要修正 → 4 caveat + scope boundary を反映済 (§5)。
  - (b) supersedes 機構 = draft ゆえ厳格対象外、参照リンクで足りる (TRUE)。
  - (c) status close = `completed` + `workflow_phase: S4` + `decision_outcome: confirmed` が正。
- **IMP-064 (Reverse 合流) — cross-review が見落とした実 blocker、PO 判断 (A) で解消**:
  confirmed poc (promotion≠redesign) は scrum-reverse ゲートで Reverse 合流 PLAN を fail-close 要求。
  `PLAN-REVERSE-139-codex-hook-adapter` (R4 / design / confirmed) を起票し、採用知見を
  L4 architecture §6 横断方針へ back-fill して充足した ([[feedback_impl_must_backfill_to_design]])。
- desk-review task = `.ut-tdd/review/PLAN-DISCOVERY-06-codex-review-task.md` (scratch、非追跡)。

## 6. 壊さない / 再発させない

- **推測で Codex plugin を書かない**: hook API は Codex 本人/公式 doc で裏取りしてから設計。
- **global `~/.codex/` への書込みは PO 確認前に行わない** (全プロジェクト影響・不可逆)。
- 採用時は SSoT → materialize の単一方向にし、各 orchestrator 設定を手書きで drift させない。
