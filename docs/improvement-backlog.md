# UT-TDD Improvement Backlog (作業ログ → 機能化 pipeline)

> 作業中に発見した「不備・改善」を蓄積し、triage して **lint / FR / policy / doc** へ機能化する living backlog。
> FR-L1-19 (Learning Engine) 本実装までの**手動の橋渡し**であり、ledger (`docs/migration/v2-import-ledger.md` の A-*) と相互参照する。
> ledger = 「採択・反映の決定台帳 (起きたこと)」/ 本 backlog = 「未機能化の改善候補 (これからやること)」の分離。
> 機械検証: `src/lint/improvement-backlog.ts` (要件定義書 §1.10.G.12)。
>
> **status**: `observed` (観測) → `triaged` (分類済) → `implemented` (実装) → `verified` (検証済)
> **自動化候補**: `lint` / `FR` / `policy` / `doc` / `none` (複数は `/` 区切り)

## §1 backlog

| ID | 観測日 | 文脈 (作業 / A-番号) | 不備・改善 | 自動化候補 | status | 紐付け (実装 lint / FR / A-番号) |
|---|---|---|---|---|---|---|
| **IMP-001** | 2026-05-29 | A-54 / A-58 | doc-count を全 sub-doc (business BR / nfr / L12 AT / AC) へ汎用化し、件数宣言 vs 実数を一括検証 | lint | triaged | requirements §1.10.G.11 第2弾 |
| **IMP-002** | 2026-05-29 | A-54 | 同一 ID の二重定義検出 (NFR-17 telemetry vs security 型の衝突)。定義 context の機械的確立が前提 | lint | triaged | requirements §1.10.G.11 第2弾 |
| **IMP-003** | 2026-05-29 | A-22 / G.2 | PLAN frontmatter `parent_design` / `pair_artifact` / `related_l0` の path を fs 実在検証 | lint | triaged | requirements §1.10.G.11 第2弾 |
| **IMP-004** | 2026-05-29 | A-55 | 既存 PLAN (PLAN-L1-* / PLAN-L3-*) の plan_id が planIdSchema regex 不適合。plan-id-schema lint で warn surface | lint | triaged | requirements §1.10.G.11 第2弾 |
| **IMP-005** | 2026-05-29 | A-58 retro | ledger / backlog の改善項目を `.ut-tdd/audit/failure_log.jsonl` へ自動連携する経路が無い (手書きのみ) | FR / policy | observed | FR-L1-19 / FR-L1-20 |
| **IMP-006** | 2026-05-29 | A-58 retro | 4 lint (g3-trace / entity-coverage / fr-registry / doc-consistency) の被覆範囲を一覧する lint-coverage-map が無い | doc | observed | HM-01 / HM-02 |
| **IMP-007** | 2026-05-29 | A-53 | commit 後に code-reviewer が不備を発見する手戻り。pre-commit / CI で自動発動する hook 化 (ut-tdd CLI 整備後) | policy | observed | A-53 / .claude hook |
| **IMP-008** | 2026-05-29 | A-57 | FR registry の `導入工程` (provenance) を `出典 doc` 列から正規化列へ昇格 (現状は自由記述に内包) | doc | observed | requirements §1.10.G.10 |
| **IMP-009** | 2026-05-29 | A-54 / A-57 / A-58 | code-reviewer subagent の最終 verdict が途中切れする (SendMessage 不可)。冒頭サマリ強制 / 出力分割で緩和 | policy | observed | A-54 / A-57 / A-58 |
| **IMP-010** | 2026-05-29 | A-58 | carry 宣言 (§3) と詳細表 (§3.1) の整合を機械化 | lint | verified | A-58 doc-consistency carry-consistency |
| **IMP-011** | 2026-05-29 | A-57 | 機能一覧 (FR registry) の漏れ監査を 5 型で機械化 | lint | verified | A-57 fr-registry-audit |
| **IMP-012** | 2026-05-29 | A-56 | ユビキタス言語を各工程更新の living glossary 化 + per-工程 lint | doc / policy | verified | A-56 G.9 |
