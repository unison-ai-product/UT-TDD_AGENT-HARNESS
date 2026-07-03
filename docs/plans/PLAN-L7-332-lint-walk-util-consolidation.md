---
plan_id: PLAN-L7-332-lint-walk-util-consolidation
title: "PLAN-L7-332 (impl): walkMarkdown 5 複製 + normalizedPath 私製の shared.ts 統合 (behavior-invariant)"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 (wave Q1。着手直前に Codex diff との非接触確認)"
  - role: tl
    slot_label: "TL - behavior-invariant 確認 (isFile 判定差など統合時の意味差レビュー)"
  - role: se
    slot_label: "SE - shared.ts への統合 + 参照置換 + regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-332-lint-walk-util-consolidation.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
---

# PLAN-L7-332 (impl): walkMarkdown / normalizedPath の shared 統合

## Status

**version-up parked (v2)**。A-182 所見 AQ-2 (QU-5)。PO 指示 2026-07-03「アップデートでプラン化」。

## 背景 (実測 2026-07-03、A-182 §2)

- `function walkMarkdown` が src/lint の 5 ファイル (design-language / gate-confirm / l7-completion / placeholder-deps / readability) に独立定義。コアは readdirSync 再帰 + `.md` フィルタで同一だが、isFile 確認の有無・シグネチャが微妙に相違し、将来バグの温床。
- `normalizedPath` / `normalizeRel` (= `path.replace(/\\/g, "/")`) が g8/g9/g10-workflow と design-language にローカル定義され、`shared.ts` の `normalizePath` を未使用 — Windows path 一貫性が各所任せ。
- 影響: 新 lint gate 実装時にどのパターンを参照すべきか不明確 (後続エージェントの実装ミス誘発、AQ-2)。

## スコープ (1 要件: 走査/正規化 util を shared.ts に 1 本化し、複製を参照へ置換する — behavior-invariant)

1. `src/lint/shared.ts` に `walkMarkdown(dir, repoRoot)` を 1 定義追加 (isFile 確認あり = 最も安全な variant を正とする。挙動差は TL レビューで確定)。
2. 5 ファイルのローカル定義を shared 参照へ置換。normalizedPath/normalizeRel の 4 箇所も `normalizePath` 参照へ置換。
3. regression fence: 変更前後で `bun run test` full green + 対象 gate の doctor 出力が不変であること (behavior-invariant の機械証明)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 着手直前の非接触確認 (`git status`/`git log` — 対象 9 ファイルが Codex diff に無いこと) | 直列 (先行) |
| 2 | shared 統合 + 置換 (9 ファイル、1 commit で閉じる) | 直列 |
| 3 | regression fence (full test + doctor 出力突合) | 直列 |

## DoD

- [ ] `grep -rn "function walkMarkdown" src/lint` が shared.ts の 1 件のみ
- [ ] `grep -rn "function normalizedPath\|function normalizeRel" src/lint` が 0 件
- [ ] `bun run test` full green + 対象 gate の doctor messages 不変 (前後ログ突合)

## 実装ノート (後続モデル向け)

- behavior-invariant refactor — 挙動変更 (isFile 統一で拾うファイルが変わる等) が出た場合はその差分を明示し TL 判断を仰ぐ (無言で意味を変えない)。
- 活性化時 kind は refactor へ昇格 (route_signal=code_smell、Codex 先例 L7-312/314 型)。
