# A-114 DDD/TDD Strengthening Re-Audit (再レビュー)

Date: 2026-06-09
Gate: G6 (L6) increment — DDD/TDD strictness layer
Auditor: Claude Opus (PM) + machine layer + regex proof
Scope: A-112 後の追加 — DDD/TDD 強化 (ddd-tdd-rules.md + ddd-tdd-rules.ts + PLAN-L6-23〜28 / L7-24〜31 / REVERSE-23) と前回残件の解消確認。
**Verdict (訂正後): base G6 = PASS 維持 / DDD/TDD 増分は正常に進行中**。内容は良質。当初 MUST-A (false G6 PASS) と判定したが**誤読のため取り下げ** (add-design 除外は文書化済み意図)。直すべき harness バグは無く、残りは PO 主導の forward 作業 (15 draft PLAN の confirm + review)。

## 前回 (A-112) 残件の解消 — OK

- ✅ coding-rules PLAN triad 起票: PLAN-L6-23 / PLAN-L7-24 / PLAN-REVERSE-23。
- ✅ A-111 番号重複解消: `A-111-pre-pm-overview-review.md` → `A-113-pre-pm-overview-review.md` にリネーム。

## DDD/TDD 内容 — 良質 (substance PASS)

- **doc⇔機械 pair (柱2 の正例)**: `ddd-tdd-rules.md` が requirements-level SSoT、YAML policy の各 rule が `owner: src/lint/ddd-tdd-rules.ts`。DDD-INV-001..005 ↔ U-DDDTDD-001..005:
  - INV-001: governance/domain modules acyclic、下位契約が上位 runtime に依存しない
  - INV-002: domain invariant は L7 に U-* oracle が無ければ受理しない
  - INV-003: TDD Red-first (`red_at <= green_at`)
  - INV-004: unit test は concrete oracle (truthiness/no-assert を排除)
  - INV-005: integration test は Given/When/Then 粒度で確認
  - → これら自体が [[feedback_coverage_not_substance]] / red-first TDD を機械 rule 化しており方向性は優秀。
- 新 PLAN は構造健全 (§工程表/Step/[並列][直列]/直列理由/review Step あり)。
- new doc 群は mojibake clean。

## MUST-A [取り下げ / WITHDRAWN] — 誤読。add-design 除外は意図的・文書化済み設計判断

> **2026-06-09 訂正**: 当初 `DESIGN_KIND_RE = /^kind:\s*design$/m` が add-design を除外するのを「false G6 PASS の自己欠陥」と判定したが、**誤りだったので取り下げる**。

- 除外は **意図的かつ三重に文書化**された設計判断:
  1. **設計 doc 明記**: [function-spec.md:132](../../docs/design/harness/L6-function-design/function-spec.md) — 「Post-G6 `kind=add-design` PLANs are governed by add-feature/backfill/review evidence and **do not reopen base G6 completion**」。
  2. **テスト明記**: [tests/l6-completion.test.ts:128](../../tests/l6-completion.test.ts) — "does not reopen base G6 completion for post-G6 add-design draft PLANs" が `ready: true` を assert。
  3. **代替統制**: post-G6 add-design は add-feature workflow + `backfill-pairing` + `review-evidence` lint が統制 (l6-completion の責務外)。
- base G6 完了 (原 18 doc + `kind=design` PLAN、A-111 で review 済) は安定 milestone として PASS 維持が正しく、**base-G6 レベルの false-confidence は無い**。
- → **regex 変更はしない** (文書化済み決定とテストに矛盾、[[feedback_check_pillar_before_revert]])。PO 承認 (「修正していいよ」) は当初の誤った finding 前提だったため、誠実性の観点から変更を見送り本訂正を報告する。

## MUST-B [Important] DDD/TDD 増分の PLAN 15 本が draft + review_evidence 0

- L6-23〜28 (add-design 6) / L7-24〜31 (add-impl 8) / REVERSE-23 (reverse 1) = **15 本すべて draft、review_evidence ゼロ**。
- 一方 impl (`ddd-tdd-rules.ts` ほか) は shipped & doctor 配線済 (green) = **impl-ahead-of-confirmed-PLAN** の再演。
- 「残件解消した」と言えるには各 PLAN の confirm + **review 前置 (cross-agent / intra-runtime)** が必要 (.claude/CLAUDE.md review 前置 MUST、self-review で done にしない)。現状は increment 進行中であって完了ではない。

## SHOULD-C [Important] confirmed L6 doc が draft PLAN 下で改変

- confirmed (凍結済) の L6 doc が DDD/TDD addenda で改変: function-spec.md +123 / module-drift.md +32 / vmodel-pair-freeze.md +9 行。authorize する PLAN (L6-24〜28) は draft。
- 凍結 doc への加筆は当該 add-design PLAN の gate を通してから confirmed に反映すべき (freeze 規律)。現状は gate-confirm も G6 PASS のままで検知できていない (MUST-A の blind spot と連動)。

## 機械層 (全 green)

- typecheck/lint clean / vitest 309 pass (37 files) / plan-id naming 4 pass / doctor exit 0 (ddd-tdd-rules OK、coding-rules OK、l6-fr-coverage 47FR OK、readability OK)。
- l6-completion の base-G6 PASS は意図通り正しい (MUST-A 取り下げ)。

## 決定 (訂正後)

**base G6 = PASS 維持。DDD/TDD 増分は正常に「進行中」**。

- MUST-A は取り下げ (誤読、上記)。harness 自己欠陥は無い。
- **MUST-B (残作業、PO 主導)**: DDD/TDD 増分 PLAN 15 本 (L6-23〜28 / L7-24〜31 / REVERSE-23) は draft。これは設計上「add-feature/review-evidence で統制される進行中 increment」であり**異常ではない**。完了宣言には各 PLAN の confirm + review 前置が要る (= 通常の forward 作業)。
- **SHOULD-C (政策判断、PO 主導)**: confirmed の L6 doc が draft add-design PLAN の加筆を保持 (function-spec +123 等)。「confirmed doc に未レビュー add-design 内容が混在」する窓が存在する。add-feature の正規モデル (doc 加筆 → PLAN confirm) の範囲内とも解せるが、freeze 信頼の観点で「confirmed doc に pending add-design 加筆あり」を可視化する仕組みは将来検討余地 (enhancement、auto-fix 対象外)。

→ 直すべき harness バグは無い。残るは PO 主導の forward 作業 (15 PLAN の confirm + review) であり、機械層・内容ともに問題なし。
