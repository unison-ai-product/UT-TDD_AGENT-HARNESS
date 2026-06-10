# A-103 — G4 add-design re-bless: L4 設計 doc を実装実体へ整合 + under-design 明示 defer (2026-06-05)

> runtime audit 記録 (gitignored)。正本は gate-design.md §2.1 A-103 注記 + 本 doc。A-101/A-102 の後続。

## 判定

**G4 add-design re-bless 可 — 4 軸すべて PASS** (intra_runtime_subagent = pmo-sonnet、verdict=PASS / Critical 0)。

## 背景 (なぜ)

PO 指示「L4 の見直し・改善」を受け L4 core 4 doc を新鮮な adversarial 監査 (pmo-sonnet ×4、doc あたり 1 監査)。A-101/A-102 freeze 後に発生した 2 種を確定:

1. **drift (実装 ahead-of-design)**: 実装済かつ review 済の feature が L4 設計 doc へ back-fill されていなかった。= harness 自身が [[feedback_impl_must_backfill_to_design]] (IMP-051) を L4 で破った **meta drift**。
   - data §3 Drive = 9 (mode 値混入) vs `VALID_DRIVES`=5 / lint = 5 記載 vs src/lint = 9 / handover・setup・web 「将来」vs 実装済 / runtime = 2 記載 vs 5 ファイル / ADR-005 欠落 / review_evidence (IMP-071) §6 未着地 / external-if codex-only 欠落。
2. **under-design (機械担保着地先未定義)**: GateId 形式 lint (data §4 空白) / Research 出口 gate の機械条件 (function §3.1) / review_kind 記録着地 (function §3.6) が「doc に書いたが守らせる機械処理が未定義」(柱 2 違反)。

## スコープ (add-design PLAN-L4-06)

- **対象**: L4 core 4 doc (data/architecture/function/external-if) ⇔ L9。新規 FR/設計の発明なし (altitude 維持、wiring/整合のみ)。
- **drift 整合**: 上記 7 件を実体へ。**under-design→defer**: 5 件を明示 defer or 機械着地先参照へ (DC-1=IMP-072 carry / F-1=IMP-052 carry / F-2=review_evidence 着地 / F-3=checkScrumReverse 参照 / F-4=ForwardRouting enum 着地)。
- **carry (本 PLAN 外、IMP 化)**: external-if (c)(d) ST 被覆 (IMP-073) / asset-drift carry PLAN id (IMP-074) / **architecture↔src module drift lint (IMP-075、本 meta drift の再発防止)**。

## G4 audit 4 軸

| 軸 | 判定 | 根拠 |
|---|---|---|
| A1 上流 trace | PASS | 新規 FR なし、既存 FR マップ維持。実装実体への整合のみ (orphan 0 維持) |
| A2 DoD | PASS | PLAN-L4-06 §8 DoD 6 項目 met。drift 精度 5 点を src 直照合で一致確認 |
| A3 V-pair 孤児0 | PASS | L9 ST-DATA-05 (review_evidence) / ST-EXT-02 (codex-only) ペア追加、§2 量閉じ 10 件→5 ST、pair-freeze lint 31 pair 孤児0 (doctor exit 0) |
| A4 sub-doc 整合 | PASS | drift 整合で data⇔architecture⇔function⇔external-if が実装実体と一致。codex-only が function §3.6 ⇔ external-if §4 で整合。Critical 矛盾 0 |

## review 前置 (intra_runtime_subagent)

- **code-reviewer ×2 = truncate (IMP-009 再発)**: 計 74 tool-use で実装照合は実施 (vitest green / §6=10 件 等の partial 確認) も最終 verdict が出力上限で truncate。
- **pmo-sonnet で確定**: A-101 で TL 代替実績 + 4 監査で完全構造化出力の実績がある pmo-sonnet に verdict を委譲 → **VERDICT=PASS / Critical 0**。drift 精度 5 点 (VALID_DRIVES / src handover・setup・web + runHandover・runSetup / lint 9 / runtime 5 / ADR-005) を src 直照合で一致確認。
- **PM 直照合 (補完)**: drift 精度 (最大リスク) は PM が Bash で src/schema・src/ ディレクトリ・exports・ADR-005 を直接照合済 (一次証拠)。
- Important 2 = ① workflow 残手続き (confirmed flip で解消) ② A-102 references = gitignore 実在の誤検知 (`.ut-tdd/audit/A-102` 実在確認済)。両者非ブロッカー。

## flip (1 ファイル)

- PLAN: `PLAN-L4-06-design-refresh.md` (`draft → confirmed`、review_evidence 記録)。
- data/architecture/function/external-if.md + L9 は **confirmed 維持** (A-101 既 freeze、本 refresh を A-103 が bless)。

## 機械証跡

- typecheck 0 / vitest **195 pass** / doctor exit 0 / pair-freeze **31 pair 孤児0** / review-evidence OK (全件あり)。

## Next

- L5 詳細設計 (PLAN-L5-00-master) を Forward で降下 → G5。
- carry IMP-072〜075 (gate-id lint / 観測系 ST / asset-drift PLAN / **architecture↔src drift lint = 本 meta drift の再発防止**) は L5/L6 deepening or 専用 PLAN で解消。
