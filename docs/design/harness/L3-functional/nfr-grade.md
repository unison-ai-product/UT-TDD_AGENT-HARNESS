---
layer: L3
sub_doc: nfr
status: placeholder
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_l1_nfr: docs/design/harness/L1-requirements/nfr.md
next_pair_freeze: L12
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-28
---

# L3 NFR グレード値 (nfr-grade) — IPA グレード Lv + 受入閾値 — placeholder

> **status**: placeholder。PLAN-L3-03-nfr-grade で本起票する。
> **scope**: L1 NFR-01〜16 (14 件、NFR-09/10 連動欠番) の IPA グレード Lv + 受入閾値 + 測定方法 + pass 条件確定のみ。NFR 体系自体の追加は L4 carry。

## 本起票時の構造 (PLAN-L3-03 §5 実装計画に対応)

| § | IPA 大項目 | 対象 NFR | 入力 |
|---|-----------|---------|------|
| §1 | 可用性 (継続性 / 耐障害性) | NFR-01 / NFR-06 / NFR-16 | U-NFR3-1 (推奨 Lv2) + U-NFR3-10 (D-09 連動) |
| §2 | 性能・拡張性 | NFR-02 / NFR-12 / NFR-15 | U-NFR3-2 (推奨 Lv2) |
| §3 | 運用・保守性 | NFR-07 / NFR-08 / NFR-13 / NFR-14 | U-NFR3-3 (推奨 Lv3) + U-NFR3-7 (D-02 90%) + U-NFR3-9 (D-05 95%) |
| §4 | 移行性 | HELIX→UT-TDD + Phase A→B | U-NFR3-4 (推奨 Lv2) |
| §5 | セキュリティ | NFR-06 / NFR-11 / NFR-09 | U-NFR3-5 (推奨 Lv3) + U-NFR3-8 (D-06 警告許容) + U-NFR3-13 (rule parity 機械検証) |
| §6 | システム環境 | NFR-01 / NFR-04 / NFR-05 | U-NFR3-6 (推奨 Lv3) |
| §7 | carry / L4 ADR + Phase B | NFR-02 / NFR-15 / NFR-09 / NFR-17 候補 | U-NFR3-11〜15 |

## L1 → L3 trace (継承)

- L1 NFR-01〜16 (14 件) → 本 sub-doc §1〜§6 で IPA Lv + 受入閾値確定
- L1 IPA × ISO 25010 二軸表 (NFR §7) → 本 sub-doc 各節で IPA 大項目別に再構成
- L1 KPI D-01〜D-09 (business §6.5) → 本 sub-doc §3 / §5 で NFR 受入閾値と integrated

## 検証ルール (本起票時に確定)

各 NFR-* に以下を必須記載:
- **IPA グレード Lv**: Lv1〜5 (IPA 非機能要求グレード 2018 準拠)
- **受入閾値**: 数値 + 測定単位 (例: ≥ 90%、≤ 5 件/sprint)
- **測定方法**: どこで何を計測するか (例: `ut-tdd doctor` / `.ut-tdd/gate_runs/`)
- **pass 条件**: L12 受入テストで pass 判定する条件

## CC2 carry (人間主導 + AI 補助原則)

NFR-14 (human-as-residue) との整合維持: NFR-* 閾値超過時の対応は AI 自動化ではなく **人間判断**を default とする (例: gate 通過率 < 90% を観測した場合、修正方針は人間 PO が決定)。
