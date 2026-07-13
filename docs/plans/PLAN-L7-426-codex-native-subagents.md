---
plan_id: PLAN-L7-426-codex-native-subagents
title: "PLAN-L7-426 (troubleshoot): Codex native subagent 対称化 — .codex/agents 生成 + hooks.json parse 退行修正 + rule-drift 拡張"
kind: troubleshoot
layer: L7
drive: agent
status: draft
route_signal: incident
route_mode: incident
created: 2026-07-13
updated: 2026-07-13
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "Codex CLI 0.144 の外部仕様変化 (custom subagent の配置規約) への adapter 追従と、既存 .codex/hooks.json の schema 退行修正。新規 L0/L1 要件ではなく adapter 対称性 (Claude ↔ Codex) の維持。"
agent_slots:
  - role: aim
    slot_label: "AIM — 二重管理回避の設計判断 (単一ソース: .claude/agents frontmatter から生成 or 独立管理)"
  - role: se
    slot_label: "SE — setup/templates への .codex/agents 生成実装 + rule-drift 拡張 + 回帰テスト"
  - role: tl
    slot_label: "TL — Claude/Codex 両 adapter の tier floor / allowlist 一致レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-426-codex-native-subagents.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
    - docs/plans/PLAN-L7-399-agent-guard-quality-check-tier-floor.md
    - docs/plans/PLAN-L7-425-setup-standardization.md
review_evidence: []
---

# PLAN-L7-426 (troubleshoot): Codex native subagent 対称化

## 背景 (2026-07-13 Codex plugin/設定調査、実走裏取り済み)

Codex CLI 0.144.1 で custom subagent の配置規約が確立された。実走実験
(session `019f5914-a6c5-7f43-8b0f-8f9f13231065`, probe agent が spawn され
応答を返すことを確認) で裏取りした現行仕様:

- **宣言**: config layer (project `.codex/config.toml` または
  `~/.codex/config.toml`) の `[agents.<name>]` テーブル。
  フィールド: `description` / `nickname_candidates` / `config_file`。
  `config_file` は実在ファイル必須 (`config_file must point to an existing
  file` で fail-close)。
- **実体**: `config_file` が指す TOML (慣例配置 `.codex/agents/<name>.toml`)。
  フィールド: `developer_instructions` / `model` /
  `model_reasoning_effort` / `sandbox_mode` 等の config override。
- **注意**: `.codex/agents/*.toml` を置くだけでは discover されない
  (実走で AGENT-NOT-FOUND を確認)。`[agents.<name>]` 宣言が必須。
- feature flag `multi_agent` は stable/true。上限は `agents.max_threads` /
  `agents.max_depth` / `agents.job_max_runtime_seconds`。
- Codex には Claude Code 設定の `/import` 移行フロー
  (`.claude/agents` → Codex 形式) も実装済み (バイナリ内文字列で確認)。

### 現状ギャップ

- **G-1 (Important)**: Claude 側は `.claude/agents/` に 19 体の subagent を
  持つが、Codex 側は native subagent ゼロ。hybrid の cross-execution で
  Codex lane が role 分業を native に使えず、stdin prompt 注入
  (`ut-tdd codex --role`) のみに依存。adapter 非対称。
- **G-2 (Important, 即時修正済み・本 PLAN で固定化)**: `.codex/hooks.json` が
  トップレベル `$comment` フィールドで **parse 失敗**し、PLAN-L7-139 の
  Codex hook parity (agent-guard / work-guard / session-log) が全て無効化
  されていた (`unknown field $comment, expected description or hooks`)。
  `description` へ改名して解消済み。schema 変化を検出する fence が無かった
  ことが根本原因。
- **G-3 (Minor)**: `.codex/hooks.json` 内容変更により `~/.codex/config.toml`
  の `[hooks.state]` trusted_hash が失効。次回 Codex 起動時に re-trust が
  必要 (human 操作)。

## 工程表

### Step 1: [直列] 設計判断 (AIM)
- 二重管理回避の方式決定: `.claude/agents/*.md` frontmatter を単一ソースと
  し `ut-tdd setup` (または専用 `ut-tdd agents sync`) が `.codex/config.toml`
  の `[agents.*]` + `.codex/agents/*.toml` を生成する案を基本とする。
  model 名は tier-router のファミリ対応 (opus floor → GPT frontier 等、
  PLAN-L7-399 の floor 原則を Codex 側 model 指定へ写像) を定義する。
- 直列理由 = **design_gate**。生成方式が Step 2 以降の実装形を決める。

### Step 2: [並列] 生成実装 + hooks schema fence (SE)
- 決定方式で `.codex/agents/` 生成を実装し、consumer 向け
  `src/setup/templates.ts` にも同型 emit を追加 (PLAN-L7-425 の整合検証
  test へ相乗り)。
- `.codex/hooks.json` を実際に `codex` の schema で検証する回帰 fence を
  doctor か CI へ追加 (G-2 の再発防止。prose でなく実 parse で検証)。

### Step 3: [並列] rule-drift / allowlist 対称化 (SE)
- rule-drift のチェック対象へ「Claude subagent 一覧 ↔ Codex `[agents.*]`
  一覧の一致」を追加。agent-guard の allowlist と生成物の drift も検出。

### Step 4: [直列] 回帰確認 (TL)
- 直列理由 = **verification_gate**。実走 smoke (`codex exec` で生成 agent
  1 体を spawn し応答確認) + 全テスト green + doctor exit 0 + hooks parse
  warning 無しを確認。

## AC

- [ ] `.claude/agents/` の各 subagent に対応する Codex `[agents.<name>]` +
  `.codex/agents/<name>.toml` が生成され、一致を検証するテストが green。
- [ ] `.codex/hooks.json` が現行 Codex schema で parse 成功することを機械
  検証する fence があり、`$comment` 退行ケースで fail する。
- [ ] 実走 smoke: 生成 subagent 1 体が `codex exec` から spawn され応答
  (Step 4 の実行ログを review_evidence に記録)。
- [ ] rule-drift が Claude/Codex subagent 一覧の drift を検出する。

## 備考

- 本調査時の probe 残骸 (`.codex/agents/ut-tdd-format-probe.toml` と
  config 追記) は検証後に除去済み。リポジトリへ残るのは G-2 修正
  (`.codex/hooks.json` の `$comment` → `description`) のみ。
