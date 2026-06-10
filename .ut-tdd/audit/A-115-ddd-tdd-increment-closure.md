# A-115 DDD/TDD Increment Closure Re-Audit (再レビュー / 合否確定)

Date: 2026-06-09
Gate: G6 (L6) increment — DDD/TDD strictness layer closure
Auditor: Claude Opus (PM, cross-agent reviewer 役) + 機械層
Scope: A-114 MUST-B (DDD/TDD 増分 PLAN の confirm + review 前置) の解消確認。
**Verdict: PASS (合格)**。15 PLAN confirmed + review evidence、Reverse pairing 完備、実装 substance 確認、機械層全 green。base G6 PASS 維持。

## A-114 残件の解消

- ✅ **MUST-B**: DDD/TDD 増分 PLAN 15 本 (L6-23〜28 / L7-24〜31 / REVERSE-23) が **全て confirmed + review_evidence あり** (review_kind=human PO/A-114、tests_green_at≤reviewed_at)。
- ✅ **add-impl の Reverse pairing 完備**: L7-25〜31 が REVERSE-24〜30 を `requires` で pairing (全 target 実在、dangling 無し)。doctor backfill OK。
- SHOULD-C (confirmed doc に add-design 加筆) は当該 add-design PLAN が confirmed 化したことで「未レビュー内容混在」窓は閉じた。

## 実装 substance 確認 (cross-agent review)

`src/lint/ddd-tdd-rules.ts` は名ばかりでなく **5 invariant を実検出する enforcement lint**:

- DDD-INV-001 domain-boundary: module import の acyclic/境界違反を検出 (lower→higher import を block)。
- DDD-INV-002 invariant-test-trace: policy doc の `id: DDD-INV-NN oracle: U-*` を parse し L7 test-design が当該 oracle を定義しているか照合 (doc⇔test trace)。
- DDD-INV-003 red-first-evidence: confirmed TDD plan に red_at/green_at 必須 + `red_at ≤ green_at`。
- DDD-INV-004 test-oracle-strength: no-assert / weak-only (`toBeTruthy()`/`toBeFalsy()` 空) を検出。
- DDD-INV-005 integration-gwt: L8 に IT-ID/Given/When/Then 表 + 非空セルを要求。

- test 15 件、negative 充実 (policy missing/unknown、domain-boundary、invariant-trace、red-first ×2、oracle-strength ×2 を `ok:false` で検出)。
- **baseline debt = exact-key suppression** で既存債務を grandfather しつつ新規違反は止める設計 (silent over-suppress を test で防止、`suppresses only exact baseline debt keys`)。
- `ddd-tdd-rules.md` (requirements-level SSoT) ⇔ lint ⇔ U-DDDTDD-001..005 (L7) のフル V-pair。柱2 (doc⇔機械 pair) の正例。

## 機械層 (全 green)

- typecheck/lint clean / vitest **309 pass** (37 files、plan-id naming 含む) / doctor exit 0。
- doctor 全 check OK: backfill (note のみ=biome-debt) / pair-freeze 38孤児0 / module-drift / change-impact 11件 / coding-rules / **ddd-tdd-rules (violations 0, baseline debt 0)** / gate-confirm / plan-schedule (checked=126) / l6-fr-coverage 47FR / readability 22件0 / **l6-completion G6 PASS** / **review-evidence OK (cross_agent worker≠reviewer / 順序)** / verification L4-L6 26/26 confirmed。
- new doc/PLAN は mojibake clean。

## 決定

**PASS**。A-114 MUST-B 解消、DDD/TDD 増分は内容 (実検出 lint + negative test + baseline-debt + oracle trace) と手続き (15 PLAN confirmed + review + Reverse pairing) の両面で完成。base G6 PASS 維持。L6 までの設計層は機械 green かつ substance 健全。

残 carry (L6 blocker でない): IMP-087/088 (旧 A-108 orphan back-fill + impl↔PLAN traceability lint)、relation-graph/dependency-drift/regression expansion の後続 PLAN (doctor scaffold stub)。
