---
plan_id: PLAN-RECOVERY-13-powershell-session-log-visibility
title: "PLAN-RECOVERY-13 (recovery): Windows PowerShell ツールの session-log 監査欠落収束 — PostToolUse matcher 三点同時更新 (issue #86)"
kind: recovery
layer: cross
drive: agent
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-17
updated: 2026-07-17
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/session-log.md
backprop_decision: not_required
backprop_decision_reason: "session-log 機構は L6 設計済みであり、Windows ネイティブ環境の tool 名差分 (PowerShell) が捕捉範囲から漏れていた運用欠陥の収束。L6 session-log doc の hook 配線記述更新で追跡し、新規 L0/L1 要件ではない。"
agent_slots:
  - role: aim
    slot_label: "AIM — matcher 拡張の設計判断 (PowerShell 追加 vs 全 shell tool 包括、rule-drift 整合)"
  - role: se
    slot_label: "SE — L6 doc / settings template / project-hook lint REQUIRED の三点同時更新"
  - role: qa
    slot_label: "QA — PowerShell tool_use が session jsonl と hook_events projection に乗る regression"
  - role: tl
    slot_label: "TL — Claude/Codex adapter 対称性レビュー (codex-hook-adapter との不整合防止)"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-13-powershell-session-log-visibility.md
    artifact_type: markdown_doc
  - artifact_path: .claude/CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: .claude/settings.json
    artifact_type: config_file
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/session-log.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/adapter/.claude/settings.json
    artifact_type: config_file
  - artifact_path: src/lint/project-hook.ts
    artifact_type: source_module
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: src/state-db/runtime-projections.ts
    artifact_type: source_module
  - artifact_path: tests/project-hook.test.ts
    artifact_type: test_file
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_file
  - artifact_path: tests/session-log.test.ts
    artifact_type: test_file
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-01-session-log.md
    - docs/plans/PLAN-L6-03-session-log.md
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
review_evidence: []
---

# PLAN-RECOVERY-13 (recovery): PowerShell session-log 監査欠落の収束

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/86

## 背景 (2026-07-17 監査での実測)

Windows ネイティブ Claude Code (VSCode) の主シェルツールは `PowerShell` だが、
PostToolUse hook matcher は `Edit|Write|MultiEdit|Bash` 固定である
(`.claude/settings.json` / L6 `session-log.md` / `src/setup/templates.ts` /
`src/lint/project-hook.ts` REQUIRED の全 SSoT が同値)。

実測 (session 8f1e5c35): 当該セッションの PowerShell 実行 10+ 件が
`.ut-tdd/logs/session/*.jsonl` に tool_use として記録されず、harness.db
`hook_events` projection にも乗らなかった (Write 系のみ記録)。
「Native Windows behavior is first-class」(`.claude/CLAUDE.md`) の方針に対し、
Windows セッションのシェル操作だけ監査可視性が構造的に低い。

## 問題の構造

- matcher は設計時点の Claude Code tool 名 (Bash) を前提としており、Windows
  ネイティブ環境で harness (Claude Code) が提供する `PowerShell` ツールが
  捕捉範囲外。session-log の設計意図 (シェル操作の証跡化) と実装 (tool 名一致)
  の間の測定対象取り違え。
- SSoT が三点 (L6 doc / settings template + 実体 / project-hook lint REQUIRED)
  に分散しているため、一点だけ直すと rule-drift / project-hook lint が Red になる。
  三点同時更新が必須。

## 設計判断 (採択済み 2026-07-17)

- **採択: 案 A = matcher へ `PowerShell` を明示追加** (`Edit|Write|MultiEdit|Bash|PowerShell`)。
  理由 = 既知 tool 名の明示列挙は fail-close 方針と整合し、wildcard 化より安全。
  PO の包括推進指示 (2026-07-17「ガンガン進めてプルリクまで」) に基づき推奨案を先行採択
  (PR レビューで覆せる可逆判断)。
- 代替 (不採択): shell 系 tool の包括 matcher (将来の tool 名追加に強いが、意図しない tool の
  捕捉と log ノイズのリスク)。

## 実装時の追加所見 (2026-07-17)

matcher 五点に加え、**runtime 側 `src/runtime/session-log.ts` にも第 2 の除外層**があった:
`onPostToolUse` の shell 判定 regex (`Bash|exec_command|local_shell`) と `summarize` の
Bash 特別扱いが PowerShell を除外しており、matcher だけ直しても PowerShell 経由の
`git commit` が commit event にならず、verb 分類 (引数リーク防止) も効かない。
同 slice で `PowerShell` を両箇所へ追加した (U-SLOG-013/014 で固定)。

## 実装対象 (実装着手時に generates へ昇格)

`docs/design/harness/L6-function-design/session-log.md`、`src/setup/templates.ts`、
`.claude/settings.json`、`docs/templates/adapter/.claude/settings.json`、
`src/lint/project-hook.ts`、`tests/project-hook.test.ts`。実装 slice 着手時に
generates へ追加して confirm と対で閉じる。

## 是正方針 (Step 案)

### Step 1: [直列] 設計判断の確定
- 直列理由 = **downstream_dependency** (matcher 形が三点更新の内容を決める)。
  上記設計判断を PO へ確認し、採択結果を本 PLAN に記録する。

### Step 2: [直列] 三点同時更新
- 直列理由 = **atomic_consistency** (部分更新は project-hook lint / rule-drift Red)。
  L6 doc・settings template + 実体 (adapter template 含む)・project-hook lint
  REQUIRED を同一 slice で更新。Codex adapter (`.codex/hooks.json`) の対称性は
  codex-hook-adapter lint で確認 (Codex 側は apply_patch 系 matcher のため
  変更不要の見込み、lint green で実証)。

### Step 3: [並列] regression 追加
- PowerShell tool_use event が session jsonl へ記録され、projection 後に
  `hook_events` へ乗ることを oracle にした test を追加 (real-repo regression、
  prose 主張の禁止)。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。doctor (project-hook / rule-drift /
  codex-hook-adapter) / vitest / plan lint green。

## AC

- [ ] 採択された matcher 形が L6 doc / settings template / settings 実体 /
      adapter template / project-hook lint REQUIRED の五点で一致 (drift 0、
      doctor project-hook + rule-drift green で実証)。
- [ ] PowerShell tool_use → session jsonl → hook_events projection の経路が
      regression test で green。
- [ ] 既存 Bash / Edit / Write 捕捉の真陽性回帰が維持される。
- [ ] doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。
