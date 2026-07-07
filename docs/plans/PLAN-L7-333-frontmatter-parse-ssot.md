---
plan_id: PLAN-L7-333-frontmatter-parse-ssot
title: "PLAN-L7-333 (impl): frontmatter 生 parse 私製 15 実装の共通 util 集約 (CRLF/閉じ欠落挙動の単一定義)"
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
    slot_label: "PO - v2 活性化時期 (projection-writer を含むため Codex 抽出完了トリガー — PO 指摘 2026-07-03 で Q1 から後送)"
  - role: tl
    slot_label: "TL - 統合先の設計判断 (shared.ts vs schema/frontmatter-raw.ts) + 挙動差の確定"
  - role: se
    slot_label: "SE - 共通 util + 12 ファイル置換 + 挙動固定テスト"
generates:
  - artifact_path: docs/plans/PLAN-L7-333-frontmatter-parse-ssot.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-L7-339-projection-writer-split.md
---

# PLAN-L7-333 (impl): frontmatter 生 parse の SSoT 化

## Status

**version-up parked (v2)**。A-182 所見 AQ-8 (QU-6)。PO 指示 2026-07-03「アップデートでプラン化」。**活性化トリガー = Codex の抽出リファクタ完了** (対象に projection-writer.ts / plan/lint.ts を含み接触面が広いため、PO 指摘 2026-07-03 で wave Q1 から後送)。

## 背景 (実測 2026-07-03、A-182 §1)

- frontmatter の生 parse (`---` 分割・key 抽出) が **15 関数 / 12 ファイル**に copy-paste されている (`grep -rn "function .*[fF]rontmatter" src`): assets/catalog、graph/loader、lint×8 (branch-kind / ddd-tdd-rules / descent-obligation / design-language / roadmap-registry / screen-impl-pair-freeze / skill-assignment ほか)、plan/lint、state-db (drive-registration / projection-writer)。
- zod schema の SSoT (`src/schema/frontmatter.ts`) は「検証」を担うが「生分割」は各所私製のまま — CRLF 処理・閉じ `---` 欠落・値の quote 除去の挙動が実装ごとに微差で固定。
- 影響: 1 箇所の parse バグ修正が他 11 ファイルへ伝播しない。Windows CRLF 系の不具合が「どの gate で読んだか」で再現が揺れる (AQ-8)。

## スコープ (1 要件: 生 parse を 1 実装に集約し、edge 挙動をテストで単一定義する)

1. 共通 util を新設 — 配置は TL 判断 slot: 案 A `src/lint/shared.ts` へ追加 / 案 B `src/schema/frontmatter-raw.ts` 新設 (schema = 依存の末端に置き lint 外からも参照可能にする。graph/assets/state-db が使うため**案 B 推奨**)。
2. edge 挙動をテストで固定: CRLF / 閉じ `---` 欠落 / frontmatter なし / 値の quote / 配列値。
3. 15 実装を段階置換 (機械的、1 ファイル 1 置換単位で commit を刻む — hybrid 衝突面を最小化)。
4. regression fence: full test green + 対象 gate/projection の出力不変。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | Codex 抽出完了の確認 + 統合先の TL 決定 (案 A/B) | 直列 (先行) |
| 2 | 共通 util + edge テスト | 直列 |
| 3 | 12 ファイル置換 (ファイル単位で分割 commit) | **並列可** (ファイル独立) |
| 4 | regression fence | 直列 |

## DoD

- [ ] `grep -rn "function .*[fF]rontmatter" src` の私製定義が共通 util 1 箇所のみ (isFrontmatterLine 等の行判定 helper は除外を明記)
- [ ] CRLF / 閉じ欠落 / quote の edge テストが共通 util を固定
- [ ] `bun run test` full green + doctor 出力不変

## 実装ノート (後続モデル向け)

- 置換は「同一挙動の保証」が核心 — 各私製実装の微差 (quote 除去有無など) を置換前に diff し、挙動が変わるファイルは明示して TL 判断。
- 活性化時 kind は refactor へ昇格。
