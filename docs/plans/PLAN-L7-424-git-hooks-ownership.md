---
plan_id: PLAN-L7-424-git-hooks-ownership
title: "PLAN-L7-424 (troubleshoot): git hooks の UT-TDD 管理化 — 旧 HELIX 遺物 hook の置換 + tracked hook source + core.hooksPath + doctor 検知"
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
backprop_decision_reason: "CLAUDE.md 宣言 (legacy hooks は非正本) と実挙動 (legacy hook が唯一の commit-time enforcement) の矛盾解消であり、新規 L0/L1 要件ではない。既知課題「git hooks 非追跡」(A-183) の実害是正。"
agent_slots:
  - role: se
    slot_label: "SE — tracked hook source 作成 + setup での導入 + doctor hooksPath/世代検知"
  - role: tl
    slot_label: "TL — 旧 HELIX hook の機能棚卸し (commit-msg 規約 / secret-scan pre-push) と引き継ぎ範囲レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-424-git-hooks-ownership.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-M-01-cutover-backfill.md
review_evidence: []
---

# PLAN-L7-424 (troubleshoot): git hooks の UT-TDD 管理化

## 背景 (2026-07-10 設定/セットアップ系監査所見、Critical)

`.git/hooks/` の稼働 hook 4 本 (pre-commit / pre-push / commit-msg /
post-merge) はすべて**旧 HELIX 由来・未追跡**で、UT-TDD の機械強制の外にある:

- `ut-tdd setup` は git hook を一切生成せず、新規環境では commit-msg 規約・
  pre-push 検査が**存在しない** (現環境は残骸に依存)。
- rule-drift の legacy マーカー検査は adapter doc 3 ファイルのみが対象で、
  hook 内の `HELIX_DRY_RUN_HOOK` は素通り。
- doctor に `core.hooksPath` / hook 世代の検知が無く、この乖離は不可視。
- CLAUDE.md「legacy hooks は current runtime state ではない」宣言と矛盾。

## 工程表

### Step 1: [直列] 旧 hook の機能棚卸し
- 直列理由 = **downstream_dependency**。4 hook の実施内容を読み、UT-TDD へ
  引き継ぐ機能 (Conventional Commits 検査 / secret pre-push 等) と廃棄する
  機能を仕分ける。

### Step 2: [直列] tracked hook source + 導入経路
- UT-TDD 所有の hook source をリポジトリ管理下 (例: `scripts/git-hooks/`) に
  置き、`ut-tdd setup` が `core.hooksPath` 設定 (または hook 配置) で導入する。
  Windows native (sh 非依存 or Git Bash 前提の明示) を確認。

### Step 3: [並列] doctor 検知 + 残骸除去
- doctor へ「hooksPath 未設定 / hook 世代不一致 / legacy マーカー残留
  (.git/hooks 内)」の検知 check を追加。現環境の HELIX hook を置換。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。setup smoke + doctor exit 0 +
  hook 実発火の実証 (規約違反 commit が reject されるログ)。

## AC

- [ ] 新規 clone + `ut-tdd setup` だけで commit-time enforcement が成立する
      (実走ログを evidence として引用)。
- [ ] `.git/hooks/` の HELIX 残骸が置換され、doctor が legacy 残留を検知する。
- [ ] hook source が tracked であり、rule-drift 相当の legacy マーカー検査が
      hook source にも及ぶ。
