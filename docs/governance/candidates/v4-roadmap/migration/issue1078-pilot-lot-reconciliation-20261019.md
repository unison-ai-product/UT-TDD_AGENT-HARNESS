# issue #1078 パイロットロット: 画面カット PLAN の三者照合記録 (2026-10-19)

対象は `plan-retirement-gate.md` §3.3 の `three-way` 照合の証跡である。`06_PLAN_DISPOSITION_FIRST_PASS.json` の `reconciliation.evidencePath` がこの文書を指し、`evidenceId` は各節の見出しの planId である。

共通の判断: ハーネス自身の画面 (中央 UI、15 画面) を作らない決定 (#1084 グループ 13、PO 2026-10-19) に基づく廃止。 #1084 のグループ 13 (ハーネス自身の画面) の実測と依存順に従う。consumer のプロダクト画面を検証する #790 / #971 / #880 は対象外で残す。`verdict` の `consistent` は PLAN と設計文書の凍結内容が一致していること、`plan-stale` は PLAN が宣言する実装が tree に無く PLAN だけが実態より先行していることを指す。いずれも「画面を作らない」決定が先にあり、設計文書とコードの撤去は後続 PR で行う。この PR は PLAN・設計文書・コードを変更しない。

## PLAN-L1-03-screen-requirements

- verdict: consistent
- PLAN の要点: L1 画面要求 (15 画面の要求 §1 PM/HM/GD) を `docs/design/harness/L1-requirements/screen-requirements.md` に凍結する design PLAN。
- 設計文書側の対応: 設計文書 `docs/design/harness/L1-requirements/screen-requirements.md` は #1084 グループ 13 段 4 で撤去する対象 (confirmed のまま残存、撤去は未実施)。
- コード側の対応: コード側: 画面 ID (PM-/HM-/GD-) に依存する `src/lint/g1-trace.ts` (`PLAN-L1-03-screen-requirements` の文字列参照を含む) / `src/lint/doc-consistency.ts` (`screenIdOrphans`) / `src/lint/screen-impl-pair-freeze.ts` / `src/lint/frontend-design-coverage.ts` が残る。外すのは #1084 段 2 (契約 → Red → Green)。`src/web/` は空で実装は存在しない。

## PLAN-L2-01-screen-list

- verdict: consistent
- PLAN の要点: L2 画面一覧 (15 画面 = PM 6 + HM 8 + GD 1、§1 画面表・§2 URL 規約・§3 認証認可) を凍結する design PLAN。
- 設計文書側の対応: 設計文書 `docs/design/harness/L2-screen/screen-list.md` (同 L2-screen 配下 7 本) は #1084 グループ 13 段 4 で撤去する対象 (confirmed のまま残存、撤去は未実施)。
- コード側の対応: コード側: 画面 ID (PM-/HM-/GD-) に依存する `src/lint/g1-trace.ts` (`PLAN-L1-03-screen-requirements` の文字列参照を含む) / `src/lint/doc-consistency.ts` (`screenIdOrphans`) / `src/lint/screen-impl-pair-freeze.ts` / `src/lint/frontend-design-coverage.ts` が残る。外すのは #1084 段 2 (契約 → Red → Green)。`src/web/` は空で実装は存在しない。 加えて `src/state-db/projection-writer.ts` が screen-list §1 の画面表を `screens` テーブルへ投影する。

## PLAN-L2-02-screen-flow

- verdict: consistent
- PLAN の要点: L2 画面遷移 (screen-flow) を凍結する design PLAN。
- 設計文書側の対応: 設計文書 `docs/design/harness/L2-screen/screen-flow.md` は #1084 グループ 13 段 4 で撤去する対象 (confirmed のまま残存、撤去は未実施)。
- コード側の対応: コード側: 画面 ID (PM-/HM-/GD-) に依存する `src/lint/g1-trace.ts` (`PLAN-L1-03-screen-requirements` の文字列参照を含む) / `src/lint/doc-consistency.ts` (`screenIdOrphans`) / `src/lint/screen-impl-pair-freeze.ts` / `src/lint/frontend-design-coverage.ts` が残る。外すのは #1084 段 2 (契約 → Red → Green)。`src/web/` は空で実装は存在しない。

## PLAN-L2-03-ui-element

- verdict: consistent
- PLAN の要点: L2 UI 要素 (ui-element) を凍結する design PLAN。
- 設計文書側の対応: 設計文書 `docs/design/harness/L2-screen/ui-element.md` は #1084 グループ 13 段 4 で撤去する対象 (confirmed のまま残存、撤去は未実施)。
- コード側の対応: コード側: 画面 ID (PM-/HM-/GD-) に依存する `src/lint/g1-trace.ts` (`PLAN-L1-03-screen-requirements` の文字列参照を含む) / `src/lint/doc-consistency.ts` (`screenIdOrphans`) / `src/lint/screen-impl-pair-freeze.ts` / `src/lint/frontend-design-coverage.ts` が残る。外すのは #1084 段 2 (契約 → Red → Green)。`src/web/` は空で実装は存在しない。

## PLAN-L2-04-wireframe

- verdict: consistent
- PLAN の要点: L2 ワイヤーフレーム (wireframe) を凍結する design PLAN。
- 設計文書側の対応: 設計文書 `docs/design/harness/L2-screen/wireframe.md` は #1084 グループ 13 段 4 で撤去する対象 (confirmed のまま残存、撤去は未実施)。
- コード側の対応: コード側: 画面 ID (PM-/HM-/GD-) に依存する `src/lint/g1-trace.ts` (`PLAN-L1-03-screen-requirements` の文字列参照を含む) / `src/lint/doc-consistency.ts` (`screenIdOrphans`) / `src/lint/screen-impl-pair-freeze.ts` / `src/lint/frontend-design-coverage.ts` が残る。外すのは #1084 段 2 (契約 → Red → Green)。`src/web/` は空で実装は存在しない。

## PLAN-L3-06-screen-functional-body

- verdict: consistent
- PLAN の要点: L3 画面機能 (screen-functional) の本体を凍結する design PLAN。generates に `src/lint/frontend-design-coverage.ts` を含む。
- 設計文書側の対応: 設計文書 `docs/design/harness/L3-functional/screen-functional.md` は #1084 グループ 13 段 4 で撤去する対象 (confirmed のまま残存、撤去は未実施)。
- コード側の対応: コード側: 画面 ID (PM-/HM-/GD-) に依存する `src/lint/g1-trace.ts` (`PLAN-L1-03-screen-requirements` の文字列参照を含む) / `src/lint/doc-consistency.ts` (`screenIdOrphans`) / `src/lint/screen-impl-pair-freeze.ts` / `src/lint/frontend-design-coverage.ts` が残る。外すのは #1084 段 2 (契約 → Red → Green)。`src/web/` は空で実装は存在しない。

## PLAN-L4-14-ui-standard

- verdict: consistent
- PLAN の要点: L4 UI 標準 (ui-standard、`tokens.yaml`) を凍結し、`frontend-design-coverage` gate と sub_doc 語彙を登録した design PLAN。
- 設計文書側の対応: 設計文書 `docs/design/harness/L4-basic-design/ui-standard.md` と `tokens.yaml` は #1084 グループ 13 段 4 で撤去する対象 (confirmed のまま残存、撤去は未実施)。
- コード側の対応: コード側: 画面 ID (PM-/HM-/GD-) に依存する `src/lint/g1-trace.ts` (`PLAN-L1-03-screen-requirements` の文字列参照を含む) / `src/lint/doc-consistency.ts` (`screenIdOrphans`) / `src/lint/screen-impl-pair-freeze.ts` / `src/lint/frontend-design-coverage.ts` が残る。外すのは #1084 段 2 (契約 → Red → Green)。`src/web/` は空で実装は存在しない。 `tests/frontend-design-coverage.test.ts` も画面系の oracle として残る。

## PLAN-L5-09-ui-detail-body

- verdict: consistent
- PLAN の要点: L5 UI 詳細 (ui-detail) の本体を凍結する design PLAN。
- 設計文書側の対応: 設計文書 `docs/design/harness/L5-detailed-design/ui-detail.md` は #1084 グループ 13 段 4 で撤去する対象 (confirmed のまま残存、撤去は未実施)。
- コード側の対応: コード側: 画面 ID (PM-/HM-/GD-) に依存する `src/lint/g1-trace.ts` (`PLAN-L1-03-screen-requirements` の文字列参照を含む) / `src/lint/doc-consistency.ts` (`screenIdOrphans`) / `src/lint/screen-impl-pair-freeze.ts` / `src/lint/frontend-design-coverage.ts` が残る。外すのは #1084 段 2 (契約 → Red → Green)。`src/web/` は空で実装は存在しない。

## PLAN-L6-36-screen-spec-body

- verdict: consistent
- PLAN の要点: L6 画面仕様 (screen-spec) の本体を凍結する design PLAN。
- 設計文書側の対応: 設計文書 `docs/design/harness/L6-function-design/screen-spec.md` は #1084 グループ 13 段 4 で撤去する対象 (confirmed のまま残存、撤去は未実施)。
- コード側の対応: コード側: 画面 ID (PM-/HM-/GD-) に依存する `src/lint/g1-trace.ts` (`PLAN-L1-03-screen-requirements` の文字列参照を含む) / `src/lint/doc-consistency.ts` (`screenIdOrphans`) / `src/lint/screen-impl-pair-freeze.ts` / `src/lint/frontend-design-coverage.ts` が残る。外すのは #1084 段 2 (契約 → Red → Green)。`src/web/` は空で実装は存在しない。

## PLAN-L7-96-screen-db-projection

- verdict: consistent
- PLAN の要点: screen-list の画面表を harness.db の `screens` テーブルへ投影する troubleshoot PLAN (generates は PLAN 自身のみ)。
- 設計文書側の対応: 設計文書側の固有の契約は無い (画面表の源は `docs/design/harness/L2-screen/screen-list.md` §1 で、#1084 段 4 の撤去対象)。
- コード側の対応: コード側: `src/schema/harness-db-tables-evaluation.ts` の `screens` テーブルと `src/state-db/projection-writer.ts` の `parseScreenListRows` 以降の投影が現存し、`src/lint/backfill-pairing.ts` がこの PLAN ID を列挙する。撤去は #1084 段 3 (#789 の DB 縮退に相乗り)。

## PLAN-L7-141-web-dashboard-component-derived

- verdict: plan-stale
- PLAN の要点: draft。`src/web` を component 派生で再実装する impl PLAN (2026-06-24 に旧プロトタイプを破棄して再起票したまま未着手)。
- 設計文書側の対応: 設計文書側: 設計文書は L2-screen 配下で、#1084 段 4 で撤去する。この PLAN 固有の設計文書は無い。
- コード側の対応: コード側: `src/web/` は空で、PLAN が宣言する実装は一度も入っていない (PLAN が実態より先行して古い)。`src/lint/l14-close-audit.ts:118` がこの PLAN の path を文字列で参照する。

## PLAN-L7-204-central-ui-vscode-webview-local

- verdict: plan-stale
- PLAN の要点: draft。中央 UI を VS Code webview (ローカル) で提供する impl PLAN。
- 設計文書側の対応: 設計文書側: 固有の設計文書は無い (L2-screen / L10 `visual-design.md` が源で、#1084 段 4 で撤去)。
- コード側の対応: コード側: webview の実装は存在しない (`src/web/` は空)。

## PLAN-L7-102-web-dashboard-phase-b

- verdict: plan-stale
- PLAN の要点: archived。`src/web` に 15 画面の read-only ダッシュボードを実装する impl PLAN (Phase B)。A 区分の `superseded-link-confirmed` だが、後継 PLAN-L7-141 が draft のまま本ロットで退役するため、規則 4 の終端条件 (B) を満たせず、`supersedes-two-sided` ではなく画面カットの退役として最終化する。
- 設計文書側の対応: 設計文書側: 親設計 `docs/design/harness/L2-screen/screen-list.md` は #1084 段 4 で撤去する。
- コード側の対応: コード側: generates の `src/web/app.ts` / `tests/web.test.ts` は現存しない (2026-06-24 に破棄、`76479d38d`)。PLAN が宣言する成果物が tree に無い。
