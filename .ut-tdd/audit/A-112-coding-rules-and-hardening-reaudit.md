# A-112 Coding-Rules Doc + Hardening Re-Audit (再レビュー)

Date: 2026-06-09
Gate: G6 (L6) supplement + governance coding-rule SSoT
Auditor: Claude Opus (PM) + code-reviewer (independent cross-check)
Scope: A-111 後の追加 — ① コーディングルールの doc 化 (coding-rules.md + process/ workflow docs + coding-rules.ts + tests) ② IMP-092 / IMP-093 hardening。
**Verdict: PASS (合格)** — 追加分は doc⇔機械 pair として実体・配線・negative-test を満たす。L6 G6 PASS (A-111) は維持。残件は非 blocker。

## 機械層 (全 green)

- typecheck exit 0 / lint 71 files clean / **vitest 294/294 pass** (+6: coding-rules 6 + IMP-092/093 negative)。
- doctor exit 0: **coding-rules — OK (TS docs 71, violations 0)** 新規配線 / readability OK / l6-fr-coverage OK / l6-completion OK (G6 PASS) / pair-freeze 38 孤児0 / verification L4-L6 26/26 confirmed。

## ① コーディングルール doc 化 — 良質、フル V-pair

- **doc⇔機械 pair**: `coding-rules.md` の YAML policy を `loadCodingRulePolicy` が機械読みし、`REQUIRED_RULE_IDS` と doc の rule ID 一致を drift 検査 (二重定義でなく単一正本)。4 rule (no-explicit-any / no-suppression-comment / file-name-kebab / max-source-params≤3) すべて検出ロジック実在。
- **workflow doc 強制**: `docs/process/forward/` (4) + `docs/process/modes/` (3) が実在し、`loadCodingWorkflowDocs` が存在 + `CODING-RULE-WORKFLOW`/SSoT 参照を機械検査 (`coding-workflow-missing-doc/reference`)。doctor green = 充足。
- **トレース完備 (orphan でない)**: requirements §7.6.1 (Coding Rules SSoT) → L6 module-drift.md coding-rules addendum (設計) → **U-CODE-001..007** (L7 oracle、入力→期待の実契約) → `src/lint/coding-rules.ts` (impl) → `tests/coding-rules.test.ts` (6 件、negative: any/suppression/>3params/unknown-rule drift を `ok:false` 検出、real-repo 0 violation)。
- new doc 群は mojibake clean。
- ※ A-108 の純 orphan (review-tier/rule-drift = 設計/要件 anchor 皆無) とは質的に別物。

## ② IMP-092 / IMP-093 — 実装確認

- **IMP-092 (l6-fr-coverage 強化)**: `hasFieldBlock = /\{[^}]+[;:?][^}]*\}/` で **explicit_l7_defer 行は `{…field…}` ブロック必須** (`!isExplicitDefer || hasFieldBlock`)。前回 I-1 (keyword presence だけで通る穴) を実際に閉鎖。強化で省略型 2 件 (`catalogExistingAssets`/`catalogSkills`) を検出し `{ roots: string[] }` 等へ補正済。negative test 追加。
- **IMP-093**: doctor.ok 式に warn-first 意図コメント、readability CP932 marker を実例ベース拡張 + negative test。

## 独立 cross-check (code-reviewer) の扱い

reviewer は "insufficient" を返したが、主要根拠 **「coding-rules の workflow-doc 存在前提が満たされず常時 false-fail」は誤前提**。`docs/process/forward/` `docs/process/modes/` は実在し doctor は green → 反証。「path 不一致」も実害なしと reviewer 自身が結論。残り (substance-marker 対象ファイル名のハードコード / readability path 非正規化) は非 blocker の extensibility/maintainability。→ Critical 0、freeze 維持。

## 非 blocker 残件 (housekeeping / carry)

- **A-111 番号重複**: resolved. `A-111-pre-pm-overview-review.md` was renamed to `A-113-pre-pm-overview-review.md`; `A-111-l6-reaudit-after-remediation.md` remains the unique A-111 record.
- coding-rules は要件+設計+L7+test でトレース済だが**専用 PLAN doc が無い** (§1.10 形式上は PLAN 化が望ましい)。PLAN-L6-23 / PLAN-L7-24 / PLAN-REVERSE-23 で add-feature triad 化する。
- carry: l6-fr-coverage substance-marker 対象ファイル名のハードコード (新 FR-alias spec 追加時に拡張要) / IMP-087・088 (orphan back-fill + impl↔PLAN traceability lint) / draft の L7-22/23・REVERSE-21/22。

## 決定

**PASS**。コーディングルール doc 化は doc⇔機械 pair (柱2) の正例で、requirement→設計→L7 oracle→impl→negative-test までフル V-pair。IMP-092 は前回 I-1 を実閉鎖、IMP-093 適用済。L6 G6 PASS (A-111) を維持し、本追加分も合格とする。残件は housekeeping/carry で freeze blocker でない。
