---
plan_id: PLAN-REVERSE-395-cli-command-design-backfill
title: "PLAN-REVERSE-395 (kind=reverse): CLI コマンド体系・終了コード規約 as-is 復元 (ZIP 88_CLIアーキ・コマンド体系設計書 相当)"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - src/cli.ts 実装からの as-is 復元 (R0-R2) + L4 external-if.md への合流判断 (R3-R4)"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-395-cli-command-design-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - src/cli.ts
    - docs/design/harness/L4-basic-design/external-if.md
    - CLAUDE.md
    - AGENTS.md
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-REVERSE-395: CLI コマンド体系・終了コード規約 as-is 復元

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `88_CLIアーキ・コマンド体系設計書` はサブコマンド体系/引数規約/終了コードを定義する。UT-TDD 側
`src/cli.ts` には80以上のコマンドが**実装先行で**存在するが、対応するコマンド体系・終了コード規約を
定める設計 doc の正本が無い (`docs/design/harness/L4-basic-design/external-if.md` はサービス境界を
扱うがCLIコマンド体系そのものは対象外)。

advisor 相談の結果、**本件は Forward `add-design` (未実装機能の設計) ではなく Reverse (既存の
未文書化実装を as-is 復元する) が正しい route** と判定した。UTDD taxonomy 上、実装が先行し設計が
追随していないケースは Recovery ではなく Reverse (`reverse <type> R0 -> R4 -> Forward merge`) の対象
であり、`kind=add-design` で新規機能として起票すると実装先行の事実と route が食い違う。

## 1. Reverse スコープ (R0-R2: as-is 復元)

1. `src/cli.ts` の実コマンド一覧・引数パターン・終了コード規約を as-is で棚卸しする。
2. CLAUDE.md の Canonical Commands 節との整合性を確認する (正本が CLAUDE.md 側にあるか、
   専用設計 doc が要るかを R3 で判断)。

## 2. Forward 合流判断 (R3-R4)

- R3: 棚卸し結果を、独立した CLI 設計 doc として新設するか、既存 `external-if.md` の拡張とするかを
  TL/PO が判断する。
- R4: 判断結果に基づき Forward (L4) へ合流する。

## 3. 受け入れ条件

- as-is 復元がテスト・CI で裏取りされた実コマンド一覧と一致する (推測で記述しない)。
- Forward 合流先 (新設 doc か既存 doc 拡張か) が R3 で確定する。
- `forward_routing`/`promotion_strategy` は R0 時点では未確定のため frontmatter に含めない
  (Codex クロスレビュー指摘: R0 で先取り確定すると R3/R4 の判断を骨抜きにする)。R3/R4 到達時に
  確定した値を追記する。
