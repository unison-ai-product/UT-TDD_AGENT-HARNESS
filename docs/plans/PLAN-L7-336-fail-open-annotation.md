---
plan_id: PLAN-L7-336-fail-open-annotation
title: "PLAN-L7-336 (impl): 暗黙 fail-open (catch{} 202 箇所) の意図宣言規約と warn-first lint"
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
    slot_label: "PO - v2 活性化時期 (warn-first 部分は wave Q1 で先行可)"
  - role: tl
    slot_label: "TL - 宣言方式の確定 (コメント規約 vs failOpen() helper) と既存 back-fill の範囲"
  - role: se
    slot_label: "SE - 規約 + lint + 段階 back-fill"
generates:
  - artifact_path: docs/plans/PLAN-L7-336-fail-open-annotation.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
---

# PLAN-L7-336 (impl): fail-open の意図宣言規約

## Status

**version-up parked (v2)**。A-182 所見 AQ-9 (QU-9)。PO 指示 2026-07-03「アップデートでプラン化」。

## 背景 (実測 2026-07-03、A-182 §1/§2)

- `catch {` (エラー変数なし) が src に **202 箇所** (`grep -rn "catch {" src`)。上位: doctor/process-quality 17、graph/loader 15、plan-governance 14、cli 14。中身は `return null` / `continue` / 既定値 — 大半は意図的 fail-open だが、**意図宣言コメントの有無が不統一で「設計」と「握りつぶし」が区別不能** (AQ-9)。
- 影響: 実エラー (権限・ファイル破損) も「対象なし」に化ける — absence-blindness のコード版。既存の fail-open/fail-close 設計原則 (.claude/CLAUDE.md「explicit fail-open / fail-close hook design」) がコードレベルで機械検証されていない。

## スコープ (1 要件: fail-open を宣言必須にし、無宣言の握りつぶしを新規について warn する)

1. 宣言方式の確定 (TL slot): 案 A `// fail-open: <理由>` コメント規約 / 案 B `failOpen(<reason>, () => ...)` helper 関数 (grep 可能性と型安全から**案 B 推奨**だが、202 箇所の一括置換は高リスクのため案 A 併用の段階移行が現実的)。
2. warn-first lint: 新規/変更行の `catch {` に宣言が無い場合に warn (既存 202 箇所はベースライン免除 + ratchet)。
3. 既存 back-fill は上位 4 ファイル (doctor/process-quality, graph/loader, plan-governance, cli) のみ本 PLAN で実施し、残りは漸進 (全量一括をしない — スコープ宣言)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | TL と宣言方式確定 | 直列 (先行) |
| 2 | lint (warn-first + ベースライン ratchet) | 直列 |
| 3 | 上位 4 ファイルの back-fill | **並列可** (ファイル独立、着手前に Codex 非接触確認) |

## DoD

- [ ] 無宣言 `catch {` の新規追加 fixture が warn になる (test 固定)
- [ ] ベースライン免除に ratchet test (縮小のみ許可)
- [ ] 上位 4 ファイルの catch が全て宣言付き
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 「fail-open が正しいか」の判定は本 PLAN のスコープ外 — 宣言の強制まで。宣言を書く過程で「実は握りつぶしだった」箇所が見つかったら improvement backlog へ (無言修正しない)。
- 活性化時 kind は add-design + add-impl 対へ昇格 (lint 新設)。
