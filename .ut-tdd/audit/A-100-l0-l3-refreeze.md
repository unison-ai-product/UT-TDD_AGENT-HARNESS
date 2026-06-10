# A-100 — L0-L3 freeze 再確定 (G0.5 / G1 / G3 PO サインオフ)

- **日付**: 2026-06-04
- **承認者**: PO (yoshiyuki) — 会話で「L0-L3 freeze (G0.5/G1/G3 の PO サインオフ) を実行」「Aだな」と授権
- **トリガー**: ロードマップ Phase 1 (L0-L3) 改善/検証サイクル 4 巡完走 (残 PO 判断要 0)。PO「フィックス」= 改善/検証サイクル終了 → L0-L3 を確定 (freeze)。
- **前提整合 (reconcile)**: PLAN-RECOVERY-02 (V-model 正規式モデル、非破壊) が L0-L3 へ fullback したため、旧台帳の G1=A-41 / G3=A-60 PASS、G4=A-67/A-91・G5=A-70 COND PASS は正規式モデル確定前スコープ。PO 判断 (A) = 「L0-L3 を改めて固め、L4-L6 (G4/G5) は仕切り直し」で再確定。

## 判定 (4 軸)

- **trace 整合**: L0 (concept) → L1 要求 → L3 要件 の trace は g3-trace / upstream-coverage / fr-registry-audit が green (vitest 177 pass)。
- **件数整合**: BR/FR-L1 46 / SR 14 / NFR 15 等、doc-consistency・fr-registry-audit green。
- **ペア整合**: backfill 孤児 0 / glossary merge 済 / scrum-reverse OK / propagation OK (doctor exit 0)。
- **意味的整合**: pmo-sonnet 整合チェック + code-reviewer review 前置 (本 freeze の change-set)。

## 確定 (status flip = 17 ファイル)

- L1 設計 doc (5): docs/design/harness/L1-requirements/{business-requirements, functional-requirements, nfr, screen-requirements, technical-requirements}.md
- L3 設計 doc (4): docs/design/harness/L3-functional/{README, business-detail, functional-requirements, nfr-grade}.md  (roadmap.md = living、除外)
- L1/L3 PLAN (8): PLAN-L1-01〜05 / PLAN-L3-01〜03
- すべて `status: draft → confirmed`

## ゲート結果

| gate | 結果 |
|------|------|
| G0.5 | 既済 (再確定) — L0⇔価値検証ペア方向に破綻なし |
| G1 | ✅ PASS (A-100 再freeze) |
| G2 | ⏸ DEFER 維持 (screen track park) |
| G3 | ✅ PASS (A-100 再freeze) — Phase 1 exit = L3 要件定義 confirmed 満足 |
| G4 / G5 | ⏸ 要再評価へ park (正規式モデルで L4-L6 仕切り直し)。旧 COND PASS は historical |

## 不可逆性

- freeze 後の L0-L3 規範変更は Reverse / Recovery を通す (requirements §2.2 / gate fail routing)。ad-hoc 編集をしない。

## 次手

- Phase 2 = L4-L6 の Forward 実開発 (改善サイクルではなく設計の新規降下、L4⇔L9 総合 / L5⇔L8 結合 / L6⇔L7 単体)。L4/L5 テスト設計 doc も要起票。
