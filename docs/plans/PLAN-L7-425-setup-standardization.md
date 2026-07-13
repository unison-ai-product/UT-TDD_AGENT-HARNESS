---
plan_id: PLAN-L7-425-setup-standardization
title: "PLAN-L7-425 (troubleshoot): setup 標準化 — consumer gate reviewer の opus floor 是正 + editorconfig/gitattributes 導入保証 + VSCode 共有設定整備"
kind: troubleshoot
layer: L7
drive: agent
status: draft
route_signal: incident
route_mode: incident
created: 2026-07-10
updated: 2026-07-10
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "setup が emit する成果物と既存ポリシー (PLAN-L7-399 opus floor / CLAUDE.md UTF-8-LF 前提) の乖離修正、および宣言済みだが空白の VSCode 共有設定の整備。新規 L0/L1 要件ではない。"
agent_slots:
  - role: aim
    slot_label: "AIM — 是正方針の設計判断 (fail-close 境界 / gate 方針)"
  - role: se
    slot_label: "SE — templates.ts の floor 修正 + COMMON_FILES への editorconfig/gitattributes 追加 + .vscode 共有設定"
  - role: tl
    slot_label: "TL — self (ソース repo) と配布物のポリシー一致レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-425-setup-standardization.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-399-agent-guard-quality-check-tier-floor.md
review_evidence: []
---

# PLAN-L7-425 (troubleshoot): setup 標準化

## 背景 (2026-07-10 設定/セットアップ系監査所見)

- **I-1 (Important)**: `src/setup/templates.ts:27-106` が consumer へ emit する
  gate/quality reviewer agent (code-reviewer / qa-test / security-audit /
  ut-tdd-tl) が **Sonnet 宣言**。ソース repo の同 agent は opus floor であり、
  PLAN-L7-399「review は orchestrator より下位にしない」に配布物側が違反。
  agent-guard は frontmatter floor をそのまま採用するため、consumer 環境で
  Sonnet review が素通りする。
- **I-2 (Important)**: `ut-tdd setup` は `.editorconfig` / `.gitattributes` /
  bun 前提 / git hooks を導入しない (consumer-readiness profile の read-only
  検査止まり)。CLAUDE.md が mojibake 対策の前提とする UTF-8/LF 正規化が
  手動コピー依存。
- **M-2 (Minor)**: `.gitignore` は「共有 `.vscode/` を commit したい場合が
  ある」と宣言しつつ、実体は残骸疑いの `launch.json` のみ。Biome formatter /
  format-on-save / files.eol / 拡張推奨 / tasks の共有設定が空白。
- **M-1/M-3/M-4 (Minor)**: settings.json matcher `Agent|Task` と doc 表記の
  ずれ、MCP 未使用の明示欠如、settings.local.json の `git add *` 許可と
  explicit-path 方針の不整合 (ローカル限定)。

## 工程表

### Step 1: [並列] opus floor 是正 (I-1)
- templates.ts の gate reviewer 4 体を opus floor へ修正し、ソース repo の
  frontmatter と配布テンプレの整合を検証する regression test を追加
  (self/配布物ポリシー drift の再発防止)。

### Step 2: [並列] toolchain 導入保証 (I-2)
- `.editorconfig` / `.gitattributes` を setup の COMMON_FILES へ追加 (既存
  ファイルは非破壊 skip)。bun 版数と正規化設定の検査をソース repo 常用
  doctor へも昇格するか判断し、しない場合は手動前提として governance へ明記。

### Step 3: [並列] VSCode 共有設定 + 表記整合 (M 群)
- `.vscode/settings.json` (Biome / format-on-save / files.eol=\n / utf8) と
  `extensions.json` を整備、`launch.json` 残骸は用途確認のうえ処置。
- `.claude/CLAUDE.md` の hook matcher 表記 (`Agent|Task`) を settings と一致
  させ、MCP 未使用の明示を governance に一文追記。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。setup smoke (tmp repo で実走) +
  全テスト green + doctor exit 0。

## AC

- [ ] setup が emit する gate reviewer 4 体が opus floor で、ソース repo との
      整合テストが green (Red→Green 実証)。
- [ ] tmp repo での `ut-tdd setup` 実走後に `.editorconfig` / `.gitattributes`
      が存在し内容がソース repo と一致する。
- [ ] `.vscode/settings.json` / `extensions.json` が commit され、matcher 表記
      ずれが解消されている。
