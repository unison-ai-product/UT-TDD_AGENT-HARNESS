---
plan_id: PLAN-L7-419-hook-failopen-hardening
title: "PLAN-L7-419 (troubleshoot): hook 強制層の fail-open 疑い是正 — bun 不在時の guard 実効性検証 + work-guard 検知漏れ (octal escape / case / untracked dir / marker 空撃ち) 修正"
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
backprop_decision_reason: "既存 guard 機構 (PLAN-L7-114 work-guard / agent-guard) の宣言 (fail-close) と実装の乖離修正であり、新規 L0/L1 要件ではない。"
agent_slots:
  - role: se
    slot_label: "SE — bun 不在シミュレーション実験 + wrapper 化 (必要時) + work-guard unescape/case/untracked 修正 + regression test"
  - role: tl
    slot_label: "TL — fail-open/fail-close 境界の設計整合レビュー (意図的 fail-open を壊さない)"
generates:
  - artifact_path: docs/plans/PLAN-L7-419-hook-failopen-hardening.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/work-guard.ts
    artifact_type: source_module
  - artifact_path: tests/work-guard.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-114-work-guard.md
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
review_evidence: []
---

# PLAN-L7-419 (troubleshoot): hook 強制層の fail-open 疑い是正

## 背景 (2026-07-10 品質基盤全件監査所見)

`.claude/CLAUDE.md` は agent-guard / work-guard を fail-close と宣言するが、
block の機械保証は hook プロセスの exit 2 のみで、以下の経路で宣言が破れる:

- **C-1**: `.claude/settings.json` の `PreToolUse` hook は `blockOnFailure: true`
  に依存。bun が PATH に無い / spawn 失敗時 (Windows で最も起きやすい環境障害)
  に `blockOnFailure` が honor されない場合、agent-guard の model floor も
  work-guard の foreign edit 保護も素通りする (fail-open)。
- **H-1**: `src/runtime/work-guard.ts` の `gitUncommittedFiles` は
  `git status --porcelain` の octal escape (`\346\227…`、非 ASCII ファイル名)
  を unescape しないため、該当 foreign ファイルへの編集が block されない。
- **M-1**: パス照合が case-sensitive (repoRoot 接頭辞のみ lower 化)。Windows
  の case-insensitive FS で同一ファイルを別文字列と誤認しうる。
- **M-2**: 未追跡ディレクトリは porcelain 上 `?? dir/` に丸められ、配下新規
  ファイルへの編集が uncommitted 個別パスに一致せず素通り。
- **M-4**: `foreign-edit-override` marker が foreign でない編集でも消費される
  (block 判定前に consume)。正当な override の空撃ち → 次の真の foreign edit
  を誤 block。
- **M-3**: agent-guard の subagent_type 判定が `name` 等の無関係フィールドまで
  受理 (allowlist 照合が後段にあるため security 破れではないが意図と乖離)。

## 工程表

### Step 1: [直列] C-1 裏取り実験
- 直列理由 = **downstream_dependency** (実験結果が Step 2 の要否を決める)。
- bun を PATH から外した環境で PreToolUse hook の挙動を実測し、
  `blockOnFailure: true` が block として実効かを確定する。結果を本 PLAN に記録。

### Step 2: [直列] fail-close 保証の実装 (Step 1 で fail-open と判明した場合)
- hook コマンドを wrapper 化するなどで「bun 不在 → exit 2 (block)」を自前保証。
  Windows native (.cmd / PowerShell) を第一級で扱う。

### Step 3: [並列] work-guard 検知漏れ修正
- octal escape unescape (H-1)、case 正規化 (M-1)、untracked dir 展開 (M-2)、
  marker 消費の foreign-edit 限定化 (M-4)、agent-guard alias 縮小 (M-3)。
- 各修正に対応するユニットテストを tests/work-guard.test.ts へ追加
  (非 ASCII ファイル名 / case 差 / untracked dir / marker 空撃ちの 4 ケース)。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。`bun run typecheck` + 対象テスト +
  `ut-tdd doctor` green。意図的 fail-open (内部エラー時の work-guard exit 0)
  を壊していないことをテストで確認。

## AC

- [ ] bun 不在時の hook 挙動が実験で確定し、fail-open なら機械的に fail-close
      化されている (実験ログ or wrapper テストを evidence として引用)。
- [ ] 非 ASCII ファイル名 / case 差 / untracked dir 配下 / marker 空撃ちの
      4 ケースがユニットテストで Red→Green 実証済み。
- [ ] 既存 work-guard / agent-guard テスト全 green、doctor exit 0。
