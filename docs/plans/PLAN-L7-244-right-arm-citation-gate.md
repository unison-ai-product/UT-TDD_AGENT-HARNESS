---
plan_id: PLAN-L7-244-right-arm-citation-gate
title: "PLAN-L7-244 (impl): 右腕 citation gate の被覆拡張 (IT/ST 採番 + defer 機械追跡)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-08-07
owner: PM / PO
parent_design: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - ORACLE_ID regex 拡張 + defer frontmatter 追跡"
  - role: qa
    slot_label: "QA - IT-CONTRACT-01〜03 の実装 or 明示 defer の確定"
generates:
  - artifact_path: docs/plans/PLAN-L7-244-right-arm-citation-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-174-forward-design-test-pair-audit-2026-07-02.md
    - src/lint/oracle-test-trace.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/plans/PLAN-L7-482-oracle-provenance-uniqueness.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/206
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/259
---

# PLAN-L7-244 (impl): 右腕 citation gate の被覆拡張

## Status

draft 起票 (PO /goal 2026-07-02、A-174 F-1 feature-gap [important])。

2026-07-28 追記: issue #165 (PR #146/#147 構造分析で再発見) は本 PLAN スコープ 1 と同一の
fail-open 穴。実害インスタンスが増えた: PR #146 宣言の 2 桁 ID (IT-DOCLEDGER-01..07 /
ST-DOCLEDGER-01..05 / ST-DOCSEM-01..08) が U-OTT-004 zero-orphan gate の対象外。
本 PLAN が #165 の機構化正本であり、新規 PLAN は起票しない (重複回避)。

2026-08-07 追記: Issue #206 の oracle ID 再利用検出を本 PLAN の拡張スコープとして回収する。単純な複数ファイル出現は正当な再引用を誤検知するため採用せず、同一 ID が test-design の別説明へ割り当てられた衝突を宣言 site (ID / path / line / 説明) から検出する。candidate/概要表と confirmed/freeze 表、Resource Kernel の概要/freeze 表という**列スキーマが契約化された構造的再掲だけ**を同一 path + ID の mirror として除外する。未知の表スキーマや addendum は見出し名に関係なく保持し、canonical 同士・別 path・新規説明は fail-close する。正確な ID セルを持つ行は説明側の別 ID 再引用があっても site を落とさない。既知の別 oracle 衝突 (U-PHOVER-002 / IT-MODULE-01) は provenance 付き ratchet baseline として固定し、新しい説明の追加を fail-close する。既存の `collectOracleIds` の Set/配列契約は維持し、Issue #259 (cited-but-not-declared の逆向き検査) は別スコープとして分離する。

2026-08-07 補足: #165 の ID pattern 拡張は PR #269 (PLAN-L7-480) で main に反映済み。本追記の未完了対象は #206 の provenance-aware uniqueness だけとし、#259 は別の検証設計として残す。

2026-08-07 所有分離: #206 のうち PR #290 で実装・検証・main merge 済みの provenance-aware
uniqueness は、本 PLAN の残存スコープ (defer 規格化 / IT-CONTRACT disposition) とライフサイクルが
異なるため、専用子 PLAN-L7-482 が実装成果物 `src/lint/oracle-id-duplicate-baseline.ts` を所有する。
本 PLAN は集約設計として draft のまま残し、#206 の完了を本 PLAN 全体の完了とみなさない。

## 背景 (A-174 F-1)

`ORACLE_ID = /\b(?:U|IT)-[A-Z0-9]+-[0-9]{3}\b/` (src/lint/oracle-test-trace.ts:21) が 3 桁採番のみ対象のため、2 桁採番の IT-* (IT-CONTRACT-01〜03 = tests 実装 0 件・defer 宣言なし) と ST-* 全体が citation gate を素通り。「未実装」と「明示 defer」の機械区別も無く、G8/G9 close を宣言ベースで通過し得る (右腕片肺の残存形)。

2026-08-07 現状補足: 旧 `ORACLE_ID` の 3 桁 + U/IT 固定による視野外は PR #269 (PLAN-L7-480) で解消済み。現在の残存課題は、declared → cited の Set 差分だけでは同一 oracle ID の宣言再利用を検出できず、別意味の test-design 行が green を通る点である。#206 はこの宣言 provenance の片肺を対象にする。

## スコープ

1. ORACLE_ID の桁ゆらぎ吸収 (2-3 桁) + ST-* パターン追加 (baseline 拡張は縮小のみ可ルール維持)。
2. test-design 側 defer の機械追跡 (defer 宣言 frontmatter/表形式の規格化 + 「未実装かつ非 defer」の fail-close)。
3. IT-CONTRACT-01〜03 の実装 or 明示 defer 化 (QA 判断)。
4. Issue #206 の provenance-aware citation site 収集 (列スキーマによる structural mirror 選択 / multi-ID 行の exact ID cell)、意味衝突の baseline/ratchet、既存 API を壊さない detector/doctor/CI 配線。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | regex/パターン拡張 + 影響 baseline 算定 | 直列 |
| 2 | defer 機械追跡の規格化 | 1 と並列 |
| 3 | IT-CONTRACT disposition + G8/G9 close 前提の regression test | 直列 |
| 4 | #206 の重複検出を Red test → canonical provenance detector → doctor → exact-head CI の順で実装 | 1 と並列 |

## DoD
- [ ] Issue #206: 同一 oracle ID を test-design の別説明へ再利用した宣言 site 衝突を検出し、新規衝突を fail-close する。列スキーマで契約化した candidate/概要↔confirmed と Resource Kernel 概要↔freeze の構造的な再掲だけを除外し、未知の表スキーマ・addendum・単純な複数ファイル出現や tests 側の正当な再引用は無記録に捨てない。
- [ ] multi-ID 行の正確な ID セルを収集し、説明側の再引用で declared site を欠落させない。baseline-only の単独説明を「重複」と報告せず、stale/更新要求として分離する。
- [ ] 既存の `collectOracleIds` の Set/配列契約を維持し、既知の衝突 (U-PHOVER-002 / IT-MODULE-01) だけを provenance 付き ratchet baseline として固定する。#259 の cited-but-not-declared 逆向き検査は別スコープに残す。
- [ ] Red test → detector → doctor → exact-head CI → 非author closing review の証跡を揃える。

- [ ] IT/ST 全採番が citation gate 被覆 (test 固定)
- [ ] 未実装かつ非 defer の右腕 ID が doctor red になる
