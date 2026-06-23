---
plan_id: PLAN-DISCOVERY-06-orchestrator-rule-parity
title: "PLAN-DISCOVERY-06 (kind=poc): orchestrator-rule parity — harness ガードを単一 SSoT 化し各 orchestrator (Claude hooks / Codex plugin) の機械強制面へ materialize する feasibility 検証"
kind: poc
layer: cross
workflow_phase: S2
scrum_type: design-spike
drive: fullstack
status: draft
created: 2026-06-23
updated: 2026-06-23
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
  - → **work-guard / agent-guard の hook スクリプトはほぼそのまま Codex へ移植可能**。
- **(B) スコープ: repo-local が可能**。`./hooks.json` (cwd 相対) + `hooks/hooks.json` + plugin 同梱の
  パターンが binary にあり、**repo 同梱 `hooks.json` で「このリポジトリで codex を回す時だけ効く」hook**を
  配れる見込み。**global `~/.codex/` への書込みは不要**。
- 残検証 (build 時): work-guard が読む `tool_input.file_path` 等の **payload フィールド名の完全一致**を
  実 hook 実行で確認する (プロトコル形は一致確認済、フィールド名は実走で最終確認)。

**S4 recommendation = ADOPT (reuse-with-hardening)**。orchestrator-rule SSoT + materializer
(`.claude/settings.json` ⊕ repo `hooks.json` を 1 ソースから emit) + rule-drift の挙動 parity 拡張へ進む。
本実装は L6 設計 → L7 impl の別 PLAN を切る。

## 6. 壊さない / 再発させない

- **推測で Codex plugin を書かない**: hook API は Codex 本人/公式 doc で裏取りしてから設計。
- **global `~/.codex/` への書込みは PO 確認前に行わない** (全プロジェクト影響・不可逆)。
- 採用時は SSoT → materialize の単一方向にし、各 orchestrator 設定を手書きで drift させない。
