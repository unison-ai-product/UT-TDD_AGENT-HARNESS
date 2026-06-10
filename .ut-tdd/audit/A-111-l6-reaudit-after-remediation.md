# A-111 L6 Re-Audit After Remediation (再レビュー / 合否確定)

Date: 2026-06-09
Gate: G6 (re-review of A-110 conditions)
Auditor: Claude Opus (PM) + pmo-sonnet (substance) + code-reviewer (independent cross-check)
Scope: A-110 で CONDITIONAL PASS とした MUST/SHOULD の解消検証。
**Verdict: PASS (合格)** — A-110 の条件 (MUST-1 / MUST-2) は解消、SHOULD-3/4 も対応。残件は freeze blocker でない hardening 2 件。

## A-110 指摘の解消状況

| 項目 | A-110 | A-111 検証結果 |
|---|---|---|
| **MUST-1** 文字化け | Critical | ✅ 解消。gate-confirm.md / plan-schedule-lint.md とも復元 (`—` 正常 / U+FFFD 0)。全 L6 doc を U+FFFD・U+2001+latin・CP932 の3観点で再スキャン = 0。さらに **`src/lint/readability.ts` 新設で機械 gate 化** (MOJIBAKE_MARKERS 3種、`loadFreezeReadabilityDocs` が L6 18 doc + PM review PLAN 計22件対象)。doctor `readability — OK (22件 marker 0)` 配線済。test は **negative case を assert** (`ok:false` 検出、U+2001+E / CP932 検出)。= IMP-089 実装。 |
| **MUST-2** 33 関数 under-design | Critical | ✅ 解消。function-spec に「type body \| pseudocode/implementation_state」表を追加。**defer 契約行 32 本すべてに `{フィールド}` 型 body + algorithm pseudocode + `explicit_l7_defer` マーカー** (実装済関数は `implemented … §2.x` を指す)。「型の単一正本 = src/schema」の SSoT 参照ブロック明記。line 80 に「`explicit_l7_defer` = L6 契約凍結、L7 は新要件を発明禁止」と defer 意味を明示。**`src/lint/l6-fr-coverage.ts` が type body + pseudocode/defer マーカーを substance gate 化** (欠落→`missing_type_body_or_pseudocode_defer_marker`)、negative-test 済、doctor 配線済。= IMP-090 実装。 |
| **SHOULD-3** governance §2.4 hollow | Important | ✅ 対応。§2.4 に「Type/pseudocode substance」副表追加。`evaluateGateReview` (explicit_l7_defer + 型 body + pseudocode) / `checkReviewEvidence` (`implemented by src/lint/review-evidence.ts` + pseudocode)。 |
| **SHOULD-4** agent-slots 浮遊断片 | Important | ✅ 対応。`resolveRosterCapability` に型 body + pseudocode + explicit_l7_defer 付与し FR-L1-46 契約行として正規化 (l6-fr-coverage が被覆確認、孤児でない)。 |

## 機械層 (全 green)

- typecheck exit 0 / lint 69 files clean / **vitest 288/288 pass** (readability・l6-fr-coverage の negative-case test 含む)。
- doctor exit 0: readability OK / l6-fr-coverage OK / l6-completion OK (G6 PASS) / pair-freeze OK (38 pair 孤児0) / change-impact OK (7件) / verification L4-L6 26/26 confirmed。
- 18 L6 doc 全 confirmed / L6 PLAN 00–22 全 confirmed / L7-unit-test-design confirmed。

## 独立 cross-check (code-reviewer) の所見と判断

code-reviewer は "insufficient" を返したが、根拠 2 点はいずれも **現 freeze の blocker でなく hardening**:

- **I-1 (substance gate が型フィールド実在まで見ず文字列 presence)**: 妥当な hardening 指摘。ただし**現状の defer 行 32 本すべてに `{フィールド}` 型 body が実在 = hollow 行ゼロ**を直接検証済。さらに本指摘を IMP-092 として実装し、`explicit_l7_defer` 行は `{...}` フィールドブロックが無ければ `missingSubstance` になるよう強化済み。
- **I-2 (gateConfirm/planSchedule が doctor.ok 非連動)**: gate-confirm.md §3 の warn-first 設計意図通り (reviewer も「現行動作は仕様通り」と明記)。本指摘を IMP-093 として実装し、コード側コメントと設計 doc §3 の rollout 意図を追記済み。
- I-3 (test の totalFr=46 ハードコード) / m-1 (CP932 パターン網羅) / m-2 (substance 対象パス単一正本化) / m-4 (function-spec の addendum 配置順) はいずれ Minor。

→ Critical 0。MUST-1/2 の content fix は reviewer も「実体的」「大幅改善」と確認。

## hardening follow-up (適用済み)

- **IMP-092**: l6-fr-coverage substance gate を「`explicit_l7_defer` 行の type body 列に `{…}` フィールドブロック実在」まで強化。negative test U-FRCOV-006 追加。強化後に実 repoで省略型 2 件 (`catalogExistingAssets` / `catalogSkills`) を検出し、typed field body へ補正済み。
- **IMP-093**: doctor.ok 式に warn-first lint の意図コメントを追加し、gate-confirm.md / plan-schedule-lint.md §3にも rollout 意図を明記。readability の CP932 marker は A-106/A-110/A-111 実例ベースで拡張し、negative test を追加。
- 既存 IMP-087/088 (A-108 orphan back-fill + impl↔PLAN traceability lint)、draft の L7-22/23 / REVERSE-21/22 は L7 への carry (L6 blocker でない)。

## 決定

**G6 PASS (合格)**。A-110 の CONDITIONAL を解除する。L6 設計層は機械 green、中核 substance 実在、A-110 指摘の MUST-1/2 を content + 機械 gate (readability / l6-fr-coverage substance、いずれも negative-test 済) の両面で解消。code-reviewer の hardening 2 件も IMP-092/093 として適用済み。gate-design G6 行は本 A-111 を evidence に更新済み。
